import { AuthForm } from '@/components/auth-form';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in' };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  let available = false;
  try { available = !!loadWebAuthConfig(process.env); } catch {}
  const query = await searchParams;
  return <section className="section container auth-page"><p className="eyebrow">Your Virtual Ink account</p><h1>Welcome back</h1>
    <p>Log in to continue with your account.</p>
    {query.confirmation === 'failed' && <p className="vendor-error" role="alert">That confirmation link could not be verified. Try logging in after confirming your email in the same browser.</p>}
    <AuthForm action="login" available={available} /></section>;
}
