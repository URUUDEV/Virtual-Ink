'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export function AuthForm({ action, available }: { action: 'login' | 'register'; available: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !available) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true); setError(''); setSuccess(false);
    try {
      const response = await fetch(`/api/auth/${action}`, { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.get('email'), password: fields.get('password') }) });
      if (!response.ok) {
        setError(response.status === 401 ? 'Email or password is incorrect, or your email still needs confirmation.' :
          response.status === 400 ? 'Check your email and password. New passwords need 12–128 characters.' :
          'Account access is temporarily unavailable. Please try again later.');
        return;
      }
      form.reset();
      if (action === 'register') setSuccess(true);
      else { router.replace('/account'); router.refresh(); }
    } catch { setError('We could not connect. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-card">
    {!available && <p className="info-callout" role="status">Account access is being prepared. Registration and login are currently unavailable.</p>}
    {success ? <div role="status"><h2>Check your email</h2><p>If registration can proceed, you’ll receive a confirmation link. Open it in this browser to finish, then sign in.</p>
      <Link className="button button-plain" href="/login">Go to login</Link></div> :
      <form onSubmit={submit} aria-busy={busy}>
        <div className="vendor-field"><label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!available || busy} /></div>
        <div className="vendor-field"><label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autoComplete={action === 'register' ? 'new-password' : 'current-password'}
            minLength={action === 'register' ? 12 : 1} maxLength={128} required disabled={!available || busy}
            aria-describedby={action === 'register' ? 'password-help' : undefined} /></div>
        {action === 'register' && <p id="password-help" className="vendor-hint">Use 12–128 characters. A long, unique passphrase works well.</p>}
        {error && <p className="vendor-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit" disabled={!available || busy}>{busy ? 'Please wait…' : action === 'register' ? 'Create account' : 'Log in'}</button>
      </form>}
    <p className="auth-switch">{action === 'register' ? 'Already have an account? ' : 'New to Virtual Ink? '}
      <Link href={action === 'register' ? '/login' : '/register'}>{action === 'register' ? 'Log in' : 'Create an account'}</Link></p>
    {action === 'login' && <p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p>}
  </div>;
}
