import { PasswordRecoveryForm } from '@/components/password-recovery-form';
import { loadWebAuthConfig } from '@backend/identity/web-auth.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set a new password' };

export default function ResetPasswordPage() {
  let available = false;
  try { available = !!loadWebAuthConfig(process.env); } catch {}
  return <section className="section container auth-page"><p className="eyebrow">Your Virtual Ink account</p>
    <h1>Set a new password</h1><p>Use the form opened from your recovery email in this browser.</p>
    <PasswordRecoveryForm mode="update" available={available} /></section>;
}
