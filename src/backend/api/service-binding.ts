import { ApiError } from './errors.ts';
import { handleApi } from './responses.ts';
import { bearerToken } from '../identity/supabase.ts';
import { parseMembershipPagination } from '../identity/memberships.ts';
import { uuid } from './validation.ts';
import { readUpstreamJson } from './upstream-json.ts';
type Environment = Record<string, string | undefined>;

export function usesAppBinding(env: Environment = process.env): boolean {
  // Deployed services fail closed if their injected binding is missing. A plain
  // standalone local Next preview keeps its existing in-process backend adapter.
  return env.VERCEL === '1' || env.APP_SERVICE_URL !== undefined;
}
export function appServiceBase(env: Environment): URL {
  try {
    const url = new URL(env.APP_SERVICE_URL ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    // Binding is trusted server configuration, never a browser URL/header.
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  } catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
}

export async function boundAppResponse(request: Request, env: Environment = process.env,
  fetcher: typeof fetch = fetch): Promise<Response> {
  // Only implemented read routes are reachable. This isn't an arbitrary proxy.
  let upstream: Response | undefined;
  const failure = await handleApi(request, async () => {
    const url = new URL(request.url);
    const health = ['/health', '/api/v1/health'].includes(url.pathname);
    const tenant = url.pathname.match(/^\/api\/v1\/tenants\/([^/]+)\/access$/);
    if (!health && !tenant && !['/api/v1/me', '/api/v1/memberships'].includes(url.pathname)) throw new ApiError('NOT_FOUND');
    if (request.method !== 'GET' && !(health && request.method === 'HEAD')) throw new ApiError('METHOD_NOT_ALLOWED');
    const token = health ? undefined : bearerToken(request);
    if (url.pathname === '/api/v1/memberships') parseMembershipPagination(url.searchParams);
    else if (url.search) throw new ApiError('VALIDATION_FAILED', ['query']);
    if (tenant) uuid(tenant[1], 'tenantId');
    const target = new URL(`${url.pathname.slice(1)}${url.search}`, appServiceBase(env));
    try {
      upstream = await fetcher(target, { method: request.method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    } catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
    if (![200, 400, 401, 403, 404, 405, 413, 415, 503].includes(upstream.status) ||
      !upstream.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError('IDENTITY_UNAVAILABLE');
    if (request.method !== 'HEAD') {
      // Bound the private service response and reject unexpected/redirect bodies.
      let body: unknown;
      try { body = await readUpstreamJson(upstream); }
      catch { throw new ApiError('IDENTITY_UNAVAILABLE'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('IDENTITY_UNAVAILABLE');
      const checked = new Response(JSON.stringify(body), { status: upstream.status, headers: upstream.headers });
      upstream = checked;
    }
  });
  if (!upstream || failure.status !== 200) {
    if (failure.status === 405) failure.headers.set('Allow', ['/health', '/api/v1/health'].includes(new URL(request.url).pathname) ? 'GET, HEAD' : 'GET');
    if (failure.status === 401) failure.headers.set('WWW-Authenticate', 'Bearer');
    return failure;
  }
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  // Never forward upstream Set-Cookie, Location, CORS or infrastructure headers.
  for (const name of ['x-request-id', 'allow', 'www-authenticate']) {
    const value = upstream.headers.get(name);
    if (value && value.length <= 128 && !/[\r\n]/.test(value)) headers.set(name, value);
  }
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
}
