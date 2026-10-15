'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function PasswordRecoveryForm({ mode, available }: { mode: 'request' | 'update'; available: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !available) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    let passwordUpdated = false;
    setBusy(true); setError(''); setSuccess(false);
    try {
      const response = await fetch(`/api/auth/${mode === 'request' ? 'password-reset' : 'password-update'}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'request'
          ? { email: fields.get('email') }
          : { password: fields.get('password') }),
      });
      if (!response.ok) {
        setError(response.status === 400 ? 'Check the email address or use a 12–128 character password.' :
          response.status === 401 ? 'This recovery session is no longer valid. Request a new link.' :
          'Account access is temporarily unavailable. Please try again later.');
        return;
      }
      form.reset();
      if (mode === 'request') setSuccess(true);
      else {
        passwordUpdated = true;
        const logout = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (!logout.ok) {
          setError('Your password was updated, but this session could not be closed. Sign out from My Account before leaving this browser.');
          return;
        }
        router.replace('/login?recovery=complete'); router.refresh();
      }
    } catch { setError(passwordUpdated
      ? 'Your password was updated, but this session could not be closed. Sign out from My Account before leaving this browser.'
      : 'We could not connect. Check your connection and try again.'); }
    finally { setBusy(false); }
  }

  return <div className="auth-card">
    {!available && <p className="info-callout" role="status">Account access is being prepared. Password recovery is currently unavailable.</p>}
    {success ? <div role="status"><h2>Check your email</h2><p>If an account matches that address, a recovery link will arrive shortly. The link opens in this browser and expires according to the account provider’s policy.</p>
      <Link className="button button-plain" href="/login">Return to login</Link></div> :
      <form onSubmit={submit} aria-busy={busy}>
        {mode === 'request' ? <div className="vendor-field"><label htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!available || busy} />
        </div> : <div className="vendor-field"><label htmlFor="recovery-password">New password</label>
          <input id="recovery-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={!available || busy} />
          <p className="vendor-hint">Use 12–128 characters. A long, unique passphrase works well.</p>
        </div>}
        {error && <p className="vendor-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit" disabled={!available || busy}>
          {busy ? 'Please wait…' : mode === 'request' ? 'Send recovery link' : 'Save new password'}
        </button>
      </form>}
    {mode === 'request' && <p className="auth-switch"><Link href="/login">Return to login</Link></p>}
  </div>;
}
