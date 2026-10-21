import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
import { backendAccessResponse } from '@/lib/backend-access';
import { globalRoles } from '@backend/permissions/policy.ts';
import { webAuthClient } from '@/lib/web-auth';
import { SignOut } from '@/components/sign-out';
import {randomUUID} from 'node:crypto';
import {privilegedRoles} from '@backend/identity/security-admin.ts';
import Link from 'next/link';
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
  let securityAdministrator=false;
  let orderDashboardView:string|undefined;
  if(process.env.SECURITY_ADMIN_ENABLED==='true') {
    try {
      const {securityDependencies}=await import('@/lib/security-admin');
      const dependencies=await securityDependencies(client,{get:name=>store.get(name)?.value,set:()=>{}});
      const identity=await dependencies.auth.identity();
      const result=await dependencies.commands.run('account.status',{},identity,randomUUID());
      const currentRole=String((result.data as {role?:string}).role);
      securityAdministrator=(privilegedRoles as readonly string[]).includes(currentRole);
      if(process.env.WORKFLOW_ENABLED==='true')orderDashboardView=currentRole==='CUSTOMER'?'customer':currentRole==='VENDOR'?'vendor':undefined;
    }catch{ /* No security authority or redirect is inferred from missing infrastructure. */ }
  }
  if(securityAdministrator)redirect('/admin/security');
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
      {orderDashboardView?<Link href={`/${orderDashboardView}`} className="button button-primary">Open your order workspace</Link>:<p>Your order workspace is unavailable until application access is connected. No order totals or empty history are inferred from an unavailable service.</p>}<SignOut /></div>
    <div className="account-service-grid"><article className="ui-panel"><h2>Your designs</h2><p>Explore the product studio and reopen a draft saved on this device. Cloud design storage is not connected.</p><Link className="text-link" href="/studio">Open the studio →</Link></article><article className="ui-panel"><h2>Orders and proofs</h2><p>Order history, private uploaded files, messages, vendor proofs and receipts will appear after those services are connected.</p><Link className="text-link" href="/how-it-works">Understand the order journey →</Link></article><article className="ui-panel"><h2>Account help</h2><p>Use the existing password recovery flow if you need to reset your password. Never share an authenticator code or recovery credential.</p><Link className="text-link" href="/forgot-password">Password recovery →</Link></article></div>
    </section>;
}
