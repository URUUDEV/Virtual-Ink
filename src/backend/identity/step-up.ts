import { ApiError } from '../api/errors.ts';
import { uuid } from '../api/validation.ts';
import type { IdentityVerifier, VerifiedIdentity } from './supabase.ts';

export type SessionEvidence = Readonly<{
  subject: string; sessionId: string; mfaAt: number; expiresAt: number | null;
}>;
export interface SessionEvidenceStore {
  // Only return current, eligible AAL2 sessions with a verified same-user TOTP factor.
  read(identity: VerifiedIdentity, sessionId: string): Promise<SessionEvidence | undefined>;
}
export type StepUpProof = Readonly<{
  identity: VerifiedIdentity; sessionId: string; aal: 'aal2'; mfaAt: number; expiresAt: number;
}>;
export interface StepUpVerifier { verify(accessToken: string): Promise<StepUpProof> }
const seconds = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

function claims(token: string): Record<string, unknown> {
  try {
    if (token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error();
    const encoded = token.split('.')[1];
    const bytes = Buffer.from(encoded, 'base64url');
    if (bytes.toString('base64url') !== encoded) throw new Error();
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new ApiError('UNAUTHENTICATED'); }
}

// Internal prerequisite only. No route, credentials or business authority are enabled here.
// Every action must call verify afresh; a proof must never be persisted/cached as authority.
export function createStepUpVerifier(options: {
  issuer: string; maximumAgeSeconds: number; identityVerifier: IdentityVerifier;
  sessions: SessionEvidenceStore; now?: () => number;
}): StepUpVerifier {
  const { issuer, maximumAgeSeconds, identityVerifier, sessions } = options;
  const url = new URL(issuer);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/auth/v1' || url.href !== issuer ||
      !Number.isInteger(maximumAgeSeconds) || maximumAgeSeconds < 1 || maximumAgeSeconds > 900) {
    throw new Error('A trusted Auth issuer and explicit MFA freshness window (1-900 seconds) are required.');
  }
  const now = options.now ?? (() => Math.floor(Date.now() / 1000));
  return Object.freeze({ async verify(token: string): Promise<StepUpProof> {
    let identity: VerifiedIdentity;
    try { identity = await identityVerifier.verify(token); }
    catch (error) {
      throw new ApiError(error instanceof ApiError && error.code === 'UNAUTHENTICATED'
        ? 'UNAUTHENTICATED' : 'IDENTITY_UNAVAILABLE');
    }
    // Decoding is permitted only AFTER the same token was validated by Auth.
    const value = claims(token);
    let sessionId: string;
    try {
      if (identity.provider !== 'supabase' || identity.issuer !== issuer || value.iss !== issuer ||
          uuid(value.sub) !== identity.subject || value.role !== 'authenticated' || value.aal !== 'aal2') throw new Error();
      sessionId = uuid(value.session_id);
    } catch { throw new ApiError('UNAUTHENTICATED'); }
    const audience = value.aud;
    if (!(audience === 'authenticated' || (Array.isArray(audience) && audience.length <= 8 &&
        audience.every(item => typeof item === 'string') && audience.includes('authenticated'))) ||
        !seconds(value.iat) || !seconds(value.exp) || value.exp <= value.iat ||
        (value.nbf !== undefined && (!seconds(value.nbf) || value.nbf >= value.exp)) ||
        !Array.isArray(value.amr) || value.amr.length < 1 || value.amr.length > 16) throw new ApiError('UNAUTHENTICATED');
    const methods = value.amr as Record<string, unknown>[];
    if (methods.some(method => !method || typeof method !== 'object' || Array.isArray(method) ||
        typeof method.method !== 'string' || !seconds(method.timestamp))) throw new ApiError('UNAUTHENTICATED');
    const totp = methods.filter(method => method.method === 'totp');
    if (totp.length !== 1) throw new ApiError('UNAUTHENTICATED');
    const mfaAt = totp[0].timestamp as number;
    const timeEligible = (time: number) => seconds(time) && (value.iat as number) <= time &&
      mfaAt <= (value.iat as number) && (value.nbf === undefined || (value.nbf as number) <= time) &&
      time < (value.exp as number) && time < mfaAt + maximumAgeSeconds;
    if (!timeEligible(now())) throw new ApiError('UNAUTHENTICATED');
    let evidence: SessionEvidence | undefined;
    try { evidence = await sessions.read(identity, sessionId); }
    catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
    const checkedAt = now();
    if (!evidence || evidence.subject !== identity.subject || evidence.sessionId !== sessionId ||
        !seconds(evidence.mfaAt) || evidence.mfaAt !== mfaAt || !timeEligible(checkedAt) ||
        (evidence.expiresAt !== null && (!seconds(evidence.expiresAt) || evidence.expiresAt <= checkedAt))) {
      throw new ApiError('UNAUTHENTICATED');
    }
    // Copy the identity so a mutable provider result cannot change an issued proof.
    return Object.freeze({ identity: Object.freeze({ provider: identity.provider, issuer, subject: identity.subject }),
      sessionId, aal: 'aal2', mfaAt,
      expiresAt: Math.min(value.exp as number, mfaAt + maximumAgeSeconds, evidence.expiresAt ?? Infinity) });
  } });
}
