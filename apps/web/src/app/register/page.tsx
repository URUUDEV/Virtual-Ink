import { AuthForm } from '@/components/auth-form';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create account' };
export default function RegisterPage() {
  let available = false;
  try { available = !!loadWebAuthConfig(process.env); } catch {}
  return <section className="section container auth-page"><p className="eyebrow">Your Virtual Ink account</p><h1>Create your account</h1>
    <p>Start with your email and a secure password. Vendor access is reviewed separately.</p>
    <AuthForm action="register" available={available} /></section>;
}
