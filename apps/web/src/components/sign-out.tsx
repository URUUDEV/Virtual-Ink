'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {AccountFeedback,AccountWait,useAccountAction} from './account-form-controls';
export function SignOut() {
  const router = useRouter();
  const {busy,run}=useAccountAction();
  const [error, setError] = useState('');
  async function logout() {
    if (busy) return;
    await run(async(request,current)=>{
      setError('');
      const result=await request('logout',{});
      if(!current())return;
      if (!result.ok) throw new Error();
      router.replace('/login'); router.refresh();
    },()=>setError('Could not log out. Retry before leaving this browser.'));
  }
  return <div><button className="button button-plain" type="button" onClick={logout} disabled={busy}>{busy ? 'Logging out…' : 'Log out'}</button>
    <AccountFeedback message={error}/><AccountWait busy={busy} label="Signing you out…"/></div>;
}
