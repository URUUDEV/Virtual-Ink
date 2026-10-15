import { NextRequest, NextResponse } from 'next/server';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
import { webAuthClient, type AuthCookie } from '@/lib/web-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pending: AuthCookie[] = [];
  let destination = '/login?recovery=failed';
  try {
    const config = loadWebAuthConfig(process.env);
    const code = url.searchParams.get('code');
    if (!config || !code || code.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(code) ||
      url.searchParams.getAll('code').length !== 1 || [...url.searchParams.keys()].some((key) => key !== 'code')) throw new Error();
    const client = webAuthClient(config, () => request.cookies.getAll(), (cookies) => { pending.push(...cookies); });
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email_confirmed_at || data.user.is_anonymous !== false) throw new Error();
    destination = '/reset-password';
  } catch { /* Fixed destination; never reflect or log recovery codes or provider errors. */ }
  const response = new NextResponse(null, { status: 303, headers: {
    Location: destination, 'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'no-referrer', Vary: 'Cookie',
  } });
  if (destination === '/reset-password') pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
