import { ApiError } from '../api/errors.ts';
import { uuid } from '../api/validation.ts';
import { loadSupabaseRestConfig, type SupabaseRestConfig } from '../database/supabase-rest.ts';

export type VerifiedIdentity = Readonly<{ provider: 'supabase'; issuer: string; subject: string }>;
export interface IdentityVerifier { verify(accessToken: string): Promise<VerifiedIdentity> }

export function bearerToken(request: Request): string {
  const value = request.headers.get('authorization');
  // No tokens in query strings/cookies and no ambiguous concatenated headers.
  const match = value?.match(/^Bearer ([A-Za-z0-9._~-]{1,8192})$/i);
  if (!match) throw new ApiError('UNAUTHENTICATED');
  return match[1];
}

export function createSupabaseIdentityVerifier(config: SupabaseRestConfig,
  fetcher: typeof fetch = fetch): IdentityVerifier {
  const checked = loadSupabaseRestConfig({ SUPABASE_URL: config.projectUrl, SUPABASE_PUBLISHABLE_KEY: config.publishableKey });
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(checked.publishableKey)) {
    throw new Error('Identity verification requires a modern Supabase publishable key.');
  }
  return Object.freeze({
    async verify(token: string): Promise<VerifiedIdentity> {
      // The Auth server validates the bearer token. Never decode JWT/user metadata
      // as a substitute for verification, and never persist/cache the token.
      if (!/^[A-Za-z0-9._~-]{1,8192}$/.test(token)) throw new ApiError('UNAUTHENTICATED');
      let response: Response;
      try {
        response = await fetcher(`${checked.projectUrl}/auth/v1/user`, {
          headers: { apikey: checked.publishableKey, Authorization: `Bearer ${token}` },
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
        });
      } catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
      if ([400, 401, 403].includes(response.status)) throw new ApiError('UNAUTHENTICATED');
      if (!response.ok) throw new ApiError('IDENTITY_UNAVAILABLE');
      try {
        const user: unknown = await response.json();
        if (!user || typeof user !== 'object' || Array.isArray(user)) throw new Error();
        const record = user as Record<string, unknown>;
        // Missing anonymous status is denied too; there is no private guest access.
        if (record.is_anonymous !== false || record.banned_until &&
          Date.parse(String(record.banned_until)) > Date.now()) throw new ApiError('UNAUTHENTICATED');
        return Object.freeze({ provider: 'supabase', issuer: `${checked.projectUrl}/auth/v1`, subject: uuid(record.id) });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') throw error;
        throw new ApiError('IDENTITY_UNAVAILABLE');
      }
    },
  });
}
