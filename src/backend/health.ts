import { ApiError } from './api/errors.ts';
import { handleApi } from './api/responses.ts';
import type { RuntimeEvent } from './api/responses.ts';
export async function healthResponse(request: Request, logger?: (event: RuntimeEvent) => void) {
  const response = await handleApi(request, () => {
    if (!['GET', 'HEAD'].includes(request.method)) throw new ApiError('METHOD_NOT_ALLOWED');
    return { service: 'Virtual Ink', status: 'ok' }; // Liveness, not dependency readiness.
  }, logger);
  if (response.status === 405) response.headers.set('Allow', 'GET, HEAD');
  if (request.method === 'HEAD') return new Response(null, { status: response.status, headers: response.headers });
  return response;
}
