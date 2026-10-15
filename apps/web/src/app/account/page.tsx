import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
import { backendAccessResponse } from '@/lib/backend-access';
import { globalRoles } from '@backend/permissions/policy.ts';
import { webAuthClient } from '@/lib/web-auth';
import { SignOut } from '@/components/sign-out';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your account' };
export default async function AccountPage() {
  let config;
  try { config = loadWebAuthConfig(process.env); } catch {}
  if (!config) redirect('/login');
  const store = await cookies();
  const client = webAuthClient(config, () => store.getAll(), () => {});
  let user;
  try {
    const result = await client.auth.getUser();
    if (!result.error && result.data.user?.is_anonymous === false && result.data.user.email_confirmed_at) user = result.data.user;
  } catch {}
  if (!user) redirect('/login');
  let roles: readonly string[] | undefined;
  try {
    // getSession only supplies a token AFTER online user verification. It never grants roles.
    const { data } = await client.auth.getSession();
    if (data.session) {
      const response = await backendAccessResponse(new Request(`${config.origin}/api/v1/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      }));
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result.data?.roles) && result.data.roles.every((role: unknown) =>
          typeof role === 'string' && globalRoles.includes(role as typeof globalRoles[number]))) roles = result.data.roles;
      }
    }
  } catch { /* A provider account does not imply provisioned application access. */ }
  return <section className="section container auth-page"><p className="eyebrow">Your Virtual Ink account</p><h1>You’re signed in</h1>
    <div className="auth-card"><p>{roles ? 'Your application account is connected.' : 'Your email is confirmed. Application access is still being prepared.'}</p>
      {roles && <p>Account roles: {roles.length ? roles.join(', ') : 'No roles assigned'}</p>}
      <p>Ordering and role dashboards are the next Phase 1 build steps.</p><SignOut /></div></section>;
}
