// Preserve the original unversioned health response for existing consumers.
import { randomUUID } from 'node:crypto';
import { jsonResponse } from '@backend/api/responses.ts';
import { boundAppResponse, usesAppBinding } from '@backend/api/service-binding.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  if (usesAppBinding()) return boundAppResponse(request);
  return jsonResponse({ service: 'Virtual Ink', status: 'ok' }, randomUUID());
}
export async function HEAD(request: Request) {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}
