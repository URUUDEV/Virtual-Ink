import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { healthResponse } from './backend/health.ts';
import { ApiError } from './backend/api/errors.ts';
import { handleApi } from './backend/api/responses.ts';
import { accessResponse } from './backend/identity/routes.ts';

export function createApp({ logger = () => {}, access } = {}) {
  const server = createServer({ maxHeaderSize: 16 * 1024 }, async (req, res) => {
    const pathname = (req.url ?? '').split('?')[0];
    if (pathname.startsWith('/api/')) {
      const acceptedMethod = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(req.method);
      // Fetch Request rejects TRACE/CONNECT/TRACK; normalize before constructing
      // it, then reject the original unsupported method without crashing HTTP.
      const protectedRoute = pathname === '/api/v1/me' || /^\/api\/v1\/tenants\/[^/]+\/access$/.test(pathname);
      const duplicateAuth = req.rawHeaders.filter((value, index) => index % 2 === 0 && value.toLowerCase() === 'authorization').length > 1;
      const request = new Request(`http://127.0.0.1${req.url}`, {
        method: acceptedMethod ? req.method : 'GET',
        headers: protectedRoute && req.headers.authorization ? { Authorization: duplicateAuth ? 'ambiguous' : req.headers.authorization } : {},
      });
      const response = protectedRoute ? (acceptedMethod ? await accessResponse(request, access, logger) :
        await handleApi(request, () => { throw new ApiError('METHOD_NOT_ALLOWED'); }, logger)) : pathname !== '/api/v1/health' ?
        await handleApi(request, () => { throw new ApiError('NOT_FOUND'); }, logger) :
        acceptedMethod ? await healthResponse(request, logger) :
          await handleApi(request, () => { throw new ApiError('METHOD_NOT_ALLOWED'); }, logger);
      if (response.status === 405) response.headers.set('Allow', protectedRoute ? 'GET' : 'GET, HEAD');
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(req.method === 'HEAD' ? undefined : await response.text());
      return;
    }
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    res.on('finish', () => {
      // No URL, query, body, cookies, authorization header, or client IP is logged.
      logger({ event: 'http_request_completed', requestId, statusCode: res.statusCode });
    });

    let body;
    if (pathname !== '/health') {
      res.statusCode = 404;
      body = { error: 'Not found', requestId };
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      body = { error: 'Method not allowed', requestId };
    } else {
      res.statusCode = 200;
      body = { service: 'Virtual Ink', status: 'ok' };
    }

    const payload = JSON.stringify(body);
    res.setHeader('Content-Length', Buffer.byteLength(payload));
    res.end(req.method === 'HEAD' ? undefined : payload);
  });

  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}
