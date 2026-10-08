import { ApiError } from '../api/errors.ts';

type Environment = Record<string, string | undefined>;
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type SupabaseRestConfig = Readonly<{ projectUrl: string; publishableKey: string }>;
export type SupabaseRequest = Readonly<{
  path: `rest/v1/${string}`;
  method: HttpMethod;
  accessToken?: string;
  query?: Readonly<Record<string, string>>;
  body?: unknown;
}>;

function projectUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port ||
      !/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) || url.pathname !== '/') throw new Error();
    return url.origin;
  } catch { throw new Error('SUPABASE_URL must be an HTTPS project URL.'); }
}

function publishableKey(value: string): string {
  if (!value.trim() || value.startsWith('sb_secret_') || /service[_-]?role/i.test(value)) {
    throw new Error('Supabase REST client requires a publishable key.');
  }
  return value;
}

export function loadSupabaseRestConfig(env: Environment = process.env): SupabaseRestConfig {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase REST configuration requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
  }
  return Object.freeze({ projectUrl: projectUrl(env.SUPABASE_URL), publishableKey: publishableKey(env.SUPABASE_PUBLISHABLE_KEY) });
}

function validateRequest(request: SupabaseRequest): void {
  if (!/^rest\/v1\/[a-z][a-z0-9_]*$/.test(request.path)) throw new ApiError('VALIDATION_FAILED', ['path']);
  if (request.accessToken !== undefined && (!request.accessToken.trim() || /[\r\n]/.test(request.accessToken))) {
    throw new ApiError('UNAUTHENTICATED');
  }
  if (request.body !== undefined && request.method === 'GET') throw new ApiError('VALIDATION_FAILED', ['body']);
  if (request.query && Object.keys(request.query).some((key) => !/^[a-z][a-z0-9_\.]*$/.test(key))) {
    throw new ApiError('VALIDATION_FAILED', ['query']);
  }
}

// This is deliberately a transport adapter, not a generic database abstraction.
// Repositories should own table names and server-side authorization before calling it.
export function createSupabaseRestClient(config: SupabaseRestConfig, fetcher: typeof fetch = fetch) {
  const endpoint = projectUrl(config.projectUrl);
  const key = publishableKey(config.publishableKey);
  return Object.freeze({
    async request<T>(request: SupabaseRequest): Promise<T> {
      validateRequest(request);
      const url = new URL(`${endpoint}/${request.path}`);
      for (const [name, value] of Object.entries(request.query ?? {})) url.searchParams.set(name, value);
      const response = await fetcher(url, {
        method: request.method,
        headers: {
          apikey: key,
          ...(request.accessToken ? { Authorization: `Bearer ${request.accessToken}` } : {}),
          ...(request.body === undefined ? {} : { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
      });
      if (!response.ok) {
        // Do not return provider response text; it may include table names or policy details.
        throw new ApiError(response.status === 401 ? 'UNAUTHENTICATED' : response.status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR');
      }
      if (response.status === 204) return undefined as T;
      try { return await response.json() as T; } catch { throw new ApiError('INTERNAL_ERROR'); }
    },
  });
}
