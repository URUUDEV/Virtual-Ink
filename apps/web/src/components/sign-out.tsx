'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!result.ok) throw new Error();
      router.replace('/login'); router.refresh();
    } catch { setError('Could not log out. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div><button className="button button-plain" type="button" onClick={logout} disabled={busy}>{busy ? 'Logging out…' : 'Log out'}</button>
    {error && <p className="vendor-error" role="alert">{error}</p>}</div>;
}
