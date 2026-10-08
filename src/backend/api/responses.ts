import { randomUUID } from 'node:crypto';
import { safeError } from './errors.ts';
export type RequestContext = Readonly<{ requestId: string }>;
export type RuntimeEvent = Readonly<{ event: 'http_request_completed'; requestId: string; statusCode: number }>;
export type ApiHandler = (request: Request, context: RequestContext) => unknown | Promise<unknown>;
export function jsonResponse(body: unknown, requestId: string, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Request-Id': requestId,
  } });
}
export async function handleApi(request: Request, handler: ApiHandler,
  logger: (event: RuntimeEvent) => void = () => {}): Promise<Response> {
  const context = Object.freeze({ requestId: randomUUID() });
  let response: Response;
  try {
    response = jsonResponse({ data: await handler(request, context), meta: context }, context.requestId);
  } catch (error) {
    const safe = safeError(error);
    response = jsonResponse({ error: safe.body, meta: context }, context.requestId, safe.status);
  }
  // Operational logs omit input and are separate from required durable audits.
  try { logger({ event: 'http_request_completed', requestId: context.requestId, statusCode: response.status }); } catch {}
  return response;
}
