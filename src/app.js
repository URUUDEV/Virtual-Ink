import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

export function createApp({ logger = () => {} } = {}) {
  const server = createServer({ maxHeaderSize: 16 * 1024 }, (req, res) => {
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

    const pathname = (req.url ?? '').split('?')[0];
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
