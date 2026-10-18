'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {accountError} from '@/lib/account-request';
import {AccountFeedback,AccountWait,PasswordField,clearPassword,useAccountAction} from './account-form-controls';
export function AuthForm({ action, available }: { action: 'login' | 'register'; available: boolean }) {
  const router = useRouter();
  const {busy,run}=useAccountAction();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !available) return;
    const form = event.currentTarget;
    await run(async(request,current)=>{
      const fields=new FormData(form);clearPassword(form);setError('');setSuccess(false);
      const response=await request(action,{email:fields.get('email'),password:fields.get('password')});
      if(!current())return;
      if(!response.ok){setError(accountError(response.status,action));return;}
      form.reset();
      if(action==='register')setSuccess(true);
      else {router.replace('/account');router.refresh();}
    },()=>setError('We could not connect. Check your connection, enter your password again and retry.'));
  }
  return <div className="auth-card">
    {!available && <p className="info-callout" role="status">Account access is being prepared. Registration and login are currently unavailable.</p>}
    <AccountFeedback message={error}/>
    {success ? <div><h2>Check your email</h2><AccountFeedback kind="success" message="If registration can proceed, you’ll receive a confirmation link. Open it in this browser to finish, then sign in."/>
      <Link className="button button-plain" href="/login">Go to login</Link></div> :
      <form onSubmit={submit} aria-busy={busy}>
        <div className="vendor-field"><label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!available || busy} /></div>
        <PasswordField id="auth-password" newPassword={action==='register'} disabled={!available||busy}/>
        <button className="button button-primary" type="submit" disabled={!available || busy}>{busy ? 'Please wait…' : action === 'register' ? 'Create account' : 'Log in'}</button>
      </form>}
    <AccountWait busy={busy} label={action==='register'?'Creating your account…':'Signing you in…'}/>
    <p className="auth-switch">{action === 'register' ? 'Already have an account? ' : 'New to Virtual Ink? '}
      <Link href={action === 'register' ? '/login' : '/register'}>{action === 'register' ? 'Log in' : 'Create an account'}</Link></p>
    {action === 'login' && <p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p>}
  </div>;
}
