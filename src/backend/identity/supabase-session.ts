import { ApiError } from '../api/errors.ts';
import type { SqlExecutor } from '../database/ports.ts';
import type { SessionEvidenceStore } from './step-up.ts';
import type { VerifiedIdentity } from './supabase.ts';

// Provider-specific adapter. No SELECT *, token, MFA secret, refresh token or private profile data.
// The injected executor needs separately reviewed minimal column SELECT permissions and timeouts.
// No current service login receives auth-schema privileges from this module.
export const sessionEvidenceStatement = `SELECT s.id AS session_id, s.user_id AS subject,
  floor(extract(epoch FROM a.updated_at))::float8 AS mfa_at,
  floor(extract(epoch FROM s.not_after))::float8 AS expires_at
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
JOIN auth.mfa_factors f ON f.id = s.factor_id AND f.user_id = s.user_id
JOIN auth.mfa_amr_claims a ON a.session_id = s.id AND a.authentication_method = 'totp'
WHERE s.id = $1 AND s.user_id = $2 AND s.aal = 'aal2'
  AND (s.not_after IS NULL OR s.not_after > clock_timestamp())
  AND u.is_anonymous = false AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
  AND (u.banned_until IS NULL OR u.banned_until <= clock_timestamp())
  AND f.factor_type = 'totp' AND f.status = 'verified' AND f.created_at <= a.updated_at
LIMIT 2`;

export function createSupabaseSessionEvidenceStore(database: SqlExecutor): SessionEvidenceStore {
  return Object.freeze({ async read(identity: VerifiedIdentity, sessionId: string) {
    const result = await database.query(sessionEvidenceStatement, [sessionId, identity.subject]);
    if (result.rowCount !== result.rows.length || result.rows.length > 1) throw new ApiError('IDENTITY_UNAVAILABLE');
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    if (typeof row.subject !== 'string' || typeof row.session_id !== 'string' ||
        typeof row.mfa_at !== 'number' || (row.expires_at !== null && typeof row.expires_at !== 'number')) {
      throw new ApiError('IDENTITY_UNAVAILABLE');
    }
    return Object.freeze({ subject: row.subject, sessionId: row.session_id,
      mfaAt: row.mfa_at, expiresAt: row.expires_at as number | null });
  } });
}
