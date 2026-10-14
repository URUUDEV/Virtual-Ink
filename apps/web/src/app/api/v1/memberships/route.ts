import { accessResponse } from '@backend/identity/routes.ts';
import { handleApi } from '@backend/api/responses.ts';
import { ApiError } from '@backend/api/errors.ts';
import { bearerToken } from '@backend/identity/supabase.ts';
import { backendAccess } from '@/lib/backend-access';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (request.method !== 'GET') return accessResponse(request);
  try { bearerToken(request); } catch { return accessResponse(request); }
  try { return accessResponse(request, await backendAccess()); }
  catch { return handleApi(request, () => { throw new ApiError('IDENTITY_UNAVAILABLE'); }); }
}
export const HEAD = GET;
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
