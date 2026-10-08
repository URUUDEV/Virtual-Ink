import { ApiError } from '@backend/api/errors.ts';
import { handleApi } from '@backend/api/responses.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const response = await handleApi(request, () => { throw new ApiError('NOT_FOUND'); });
  return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
export const HEAD = GET;
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
