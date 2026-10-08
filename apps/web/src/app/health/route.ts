// Preserve the original unversioned health response for existing consumers.
import { randomUUID } from 'node:crypto';
import { jsonResponse } from '@backend/api/responses.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return jsonResponse({ service: 'Virtual Ink', status: 'ok' }, randomUUID());
}
export function HEAD() {
  const response = GET();
  return new Response(null, { status: response.status, headers: response.headers });
}
