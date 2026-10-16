import { NextRequest, NextResponse } from 'next/server';
import { webAuthResponse } from '@backend/identity/web-auth.ts';
import { webAuthClient, webAuthGateway, type AuthCookie } from '@/lib/web-auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: NextRequest) {
  const securedAction=new URL(request.url).pathname.match(/^\/api\/auth\/(logout|password-update)$/)?.[1];
  if(process.env.SECURITY_ADMIN_ENABLED==='true'&&securedAction) {
    const {handleSecurityRequest}=await import('@/lib/security-admin');
    return handleSecurityRequest(request,securedAction);
  }
  const pending: AuthCookie[] = [];
  const cacheHeaders: Record<string, string> = {};
  const result = await webAuthResponse(request, (config) => webAuthGateway(webAuthClient(config,
    () => request.cookies.getAll(), (cookies, headers) => { pending.push(...cookies); Object.assign(cacheHeaders, headers); })));
  const response = new NextResponse(result.body, { status: result.status, headers: result.headers });
  // Never persist a partial login after a failed provider/verification operation.
  if (result.ok) {
    pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
  }
  return response;
}
export const POST = handle;
export const GET = handle;
export const HEAD = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
