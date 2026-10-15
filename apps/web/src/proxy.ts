import { NextRequest, NextResponse } from 'next/server';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
import { webAuthClient } from '@/lib/web-auth';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  let applicationOrigin = request.nextUrl.origin;
  function loginRedirect() {
    const denied = NextResponse.redirect(new URL('/login', applicationOrigin), 307);
    denied.headers.set('Cache-Control', 'private, no-store, max-age=0');
    denied.headers.set('Vary', 'Cookie');
    denied.headers.set('Referrer-Policy', 'no-referrer');
    response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
    return denied;
  }
  try {
    const config = loadWebAuthConfig(process.env);
    if (!config) return loginRedirect();
    applicationOrigin = config.origin;
    const client = webAuthClient(config, () => request.cookies.getAll(), (cookies, headers) => {
      cookies.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('Vary', 'Cookie');
    });
    // Online verification refreshes cookies; each protected page verifies again.
    const { data, error } = await client.auth.getUser();
    if (error || data.user?.is_anonymous !== false || !data.user.email_confirmed_at) return loginRedirect();
  } catch { return loginRedirect(); }
  return response;
}
export const config = { matcher: ['/account/:path*', '/customer/:path*', '/vendor/:path*', '/admin/:path*'] };
