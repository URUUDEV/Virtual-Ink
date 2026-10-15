import { PasswordRecoveryForm } from '@/components/password-recovery-form';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recover your password' };

export default function ForgotPasswordPage() {
  let available = false;
  try { available = !!loadWebAuthConfig(process.env); } catch {}
  return <section className="section container auth-page"><p className="eyebrow">Your Virtual Ink account</p>
    <h1>Recover your password</h1><p>We’ll send a single-use recovery link when an account matches the address.</p>
    <PasswordRecoveryForm mode="request" available={available} /></section>;
}
