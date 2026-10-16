import { NextRequest } from 'next/server';
import { handleSecurityRequest } from '@/lib/security-admin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handle(request:NextRequest,context:{params:Promise<{action:string}>}) {
  return handleSecurityRequest(request,(await context.params).action);
}
export const POST=handle;
export const GET=handle;
export const HEAD=handle;
export const PUT=handle;
export const PATCH=handle;
export const DELETE=handle;
export const OPTIONS=handle;
