import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { ApiError } from '@backend/api/errors.ts';
import type { WebAuthConfig, WebAuthGateway } from '@backend/identity/web-auth.ts';

export type AuthCookie = { name: string; value: string; options: CookieOptions };
export function webAuthClient(config: WebAuthConfig,
  getAll: () => { name: string; value: string }[],
  setAll: (cookies: AuthCookie[], headers: Record<string, string>) => void) {
  return createServerClient(config.projectUrl, config.publishableKey, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: config.origin.startsWith('https:'), path: '/' },
    cookies: { getAll, setAll },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) }) },
  });
}
export function webAuthGateway(client: ReturnType<typeof webAuthClient>): WebAuthGateway {
  return {
    async login(credentials) {
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) throw new ApiError(!error.status || error.status === 429 || error.status >= 500 ? 'IDENTITY_UNAVAILABLE' : 'UNAUTHENTICATED');
      if (!data.user || data.user.is_anonymous !== false || !data.user.email_confirmed_at || !data.session) throw new ApiError('UNAUTHENTICATED');
    },
    async register(credentials, callbackUrl) {
      const { data, error } = await client.auth.signUp({ ...credentials, options: { emailRedirectTo: callbackUrl } });
      // Existing-account responses use the same success state; don't enumerate emails.
      if (error && !['user_already_exists', 'email_exists'].includes(error.code ?? '')) throw new ApiError('IDENTITY_UNAVAILABLE');
      // Registration never logs the user in, even if provider confirmation was disabled.
      if (data.session) {
        const result = await client.auth.signOut({ scope: 'local' });
        if (result.error) throw new ApiError('IDENTITY_UNAVAILABLE');
      }
    },
    async logout() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new ApiError('IDENTITY_UNAVAILABLE');
    },
  };
}
