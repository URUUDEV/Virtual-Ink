import { ApiError } from '../api/errors.ts';
import { handleApi } from '../api/responses.ts';
import { readJson, strictObject } from '../api/validation.ts';
import { createAdmission } from '../api/admission.ts';
import { loadSupabaseRestConfig } from '../database/supabase-rest.ts';

type Environment = Record<string, string | undefined>;
export type WebAuthConfig = Readonly<{ origin: string; projectUrl: string; publishableKey: string }>;
export function loadWebAuthConfig(env: Environment): WebAuthConfig | undefined {
  if (!['true', 'false'].includes(env.WEB_AUTH_ENABLED ?? 'false')) throw new Error('Invalid web Auth configuration.');
  if (env.WEB_AUTH_ENABLED !== 'true') return undefined;
  const origin = new URL(env.APP_ORIGIN ?? '');
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
    !(origin.protocol === 'https:' || origin.protocol === 'http:' && loopback) ||
    env.NODE_ENV === 'production' && origin.protocol !== 'https:' && !loopback) throw new Error('Invalid application origin.');
  const provider = loadSupabaseRestConfig(env);
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(provider.publishableKey)) throw new Error('A modern publishable key is required.');
  return Object.freeze({ origin: origin.origin, ...provider });
}

export type Credentials = Readonly<{ email: string; password: string }>;
export function validateEmailInput(value: unknown): Readonly<{ email: string }> {
  const data = strictObject(value, ['email']);
  if (typeof data.email !== 'string' || data.email.length > 254 ||
    !/^[^\s@\u0000-\u001f<>]+@[^\s@\u0000-\u001f<>]+\.[^\s@\u0000-\u001f<>]+$/.test(data.email)) {
    throw new ApiError('VALIDATION_FAILED', ['email']);
  }
  return Object.freeze({ email: data.email });
}
export function validateNewPassword(value: unknown): Readonly<{ password: string }> {
  const data = strictObject(value, ['password']);
  if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(data.password)) throw new ApiError('VALIDATION_FAILED', ['password']);
  return Object.freeze({ password: data.password });
}
export function validateCredentials(value: unknown, action: 'login' | 'register'): Credentials {
  const data = strictObject(value, ['email', 'password']);
  if (typeof data.email !== 'string' || data.email.length > 254 ||
    !/^[^\s@\u0000-\u001f<>]+@[^\s@\u0000-\u001f<>]+\.[^\s@\u0000-\u001f<>]+$/.test(data.email)) {
    throw new ApiError('VALIDATION_FAILED', ['email']);
  }
  // Do not trim or normalize passwords. Support long passphrases and bound work.
  if (typeof data.password !== 'string' || data.password.length < (action === 'register' ? 12 : 1) ||
    data.password.length > 128 || /[\u0000-\u001f\u007f]/.test(data.password)) throw new ApiError('VALIDATION_FAILED', ['password']);
  return Object.freeze({ email: data.email, password: data.password });
}

export interface WebAuthGateway {
  login(credentials: Credentials): Promise<void>;
  register(credentials: Credentials, callbackUrl: string): Promise<void>;
  requestPasswordReset(email: string, callbackUrl: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  logout(): Promise<void>;
}
const admission = createAdmission(8);
export function webAuthResponse(request: Request,
  gateway: (config: WebAuthConfig) => WebAuthGateway,
  env: Environment = process.env): Promise<Response> {
  return handleApi(request, async () => {
    if (request.method !== 'POST') throw new ApiError('METHOD_NOT_ALLOWED');
    const url = new URL(request.url);
    const action = url.pathname.match(/^\/api\/auth\/(login|register|logout|password-reset|password-update)$/)?.[1];
    if (!action) throw new ApiError('NOT_FOUND');
    if (url.search) throw new ApiError('VALIDATION_FAILED', ['query']);
    let config: WebAuthConfig | undefined;
    try { config = loadWebAuthConfig(env); } catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
    if (!config) throw new ApiError('IDENTITY_UNAVAILABLE');
    // Never infer authority from Host or X-Forwarded-* supplied by a client.
    if (request.headers.get('origin') !== config.origin ||
      request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError('FORBIDDEN');
    const input = await readJson(request, (value) => {
      if (action === 'logout') return strictObject(value, []);
      if (action === 'password-reset') return validateEmailInput(value);
      if (action === 'password-update') return validateNewPassword(value);
      return validateCredentials(value, action as 'login' | 'register');
    });
    return admission.run(async () => {
      const auth = gateway(config);
      if (action === 'logout') { await auth.logout(); return { state: 'signed_out' }; }
      if (action === 'password-reset') {
        await auth.requestPasswordReset((input as { email: string }).email, `${config.origin}/auth/recovery-callback`);
        return { state: 'if_account_exists' };
      }
      if (action === 'password-update') {
        await auth.updatePassword((input as { password: string }).password);
        return { state: 'password_updated' };
      }
      if (action === 'register') {
        await auth.register(input as Credentials, `${config.origin}/auth/callback`);
        return { state: 'confirmation_required' };
      }
      await auth.login(input as Credentials);
      return { state: 'signed_in' };
    });
  }).then((response) => {
    if (response.status === 405) response.headers.set('Allow', 'POST');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Vary', 'Cookie, Origin');
    return response;
  });
}
