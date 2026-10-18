'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {accountError} from '@/lib/account-request';
import {AccountFeedback,AccountWait,PasswordField,clearPassword,useAccountAction,type AccountRequester} from './account-form-controls';

type Phase='form'|'sent'|'updated'|'uncertain'|'expired';
export function PasswordRecoveryForm({mode,available}:{mode:'request'|'update';available:boolean}) {
  const router=useRouter(),{busy,run}=useAccountAction();
  const [phase,setPhase]=useState<Phase>('form'),[error,setError]=useState('');

  async function closeSession(request:AccountRequester,current:()=>boolean,confirmed:boolean) {
    const result=await request('logout',{});
    if(!current())return;
    if(!result.ok){setError('This session could not be closed. Retry signing out before leaving this browser.');return;}
    router.replace(confirmed?'/login?recovery=complete':'/login?recovery=review');router.refresh();
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy||!available||phase!=='form')return;
    const form=event.currentTarget;
    let confirmed=false;
    await run(async(request,current)=>{
      const fields=new FormData(form);clearPassword(form);setError('');
      const action=mode==='request'?'password-reset':'password-update';
      const result=await request(action,mode==='request'?{email:fields.get('email')}:{password:fields.get('password')});
      if(!current())return;
      if(!result.ok){
        if(mode==='update'&&result.status>=500){setPhase('uncertain');return;}
        if(mode==='update'&&result.status===401)setPhase('expired');
        setError(accountError(result.status,action));return;
      }
      form.reset();
      if(mode==='request'){setPhase('sent');return;}
      confirmed=true;setPhase('updated');await closeSession(request,current,true);
    },()=>{
      if(mode==='request')setError('We could not connect. Check your connection and try again.');
      else if(confirmed){setPhase('updated');setError('Your password was updated, but this session could not be closed. Retry signing out before leaving this browser.');}
      else setPhase('uncertain');
    });
  }
  async function retryLogout(){
    if(!available||busy||!['updated','uncertain'].includes(phase))return;
    await run(async(request,current)=>{setError('');await closeSession(request,current,phase==='updated');},()=>setError('This session could not be closed. Check your connection and retry signing out before leaving this browser.'));
  }
  return <div className="auth-card">
    {!available&&<p className="info-callout" role="status">Account access is being prepared. Password recovery is currently unavailable.</p>}
    <AccountFeedback message={error}/>
    {phase==='form'&&<form onSubmit={submit} aria-busy={busy}>
      {mode==='request'?<div className="vendor-field"><label htmlFor="recovery-email">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!available||busy}/></div>:
        <PasswordField id="recovery-password" label="New password" newPassword disabled={!available||busy}/>}
      <button className="button button-primary" type="submit" disabled={!available||busy}>{busy?'Please wait…':mode==='request'?'Send recovery link':'Save new password'}</button>
    </form>}
    {phase==='sent'&&<div><h2>Check your email</h2><AccountFeedback kind="success" message="If an account matches that address, a recovery link will be sent. Open it in this browser. The link expires according to the account provider’s policy."/><Link className="button button-plain" href="/login">Return to login</Link></div>}
    {phase==='expired'&&<Link className="button button-plain" href="/forgot-password">Request a new recovery link</Link>}
    {['updated','uncertain'].includes(phase)&&<div className="account-recovery-result">
      <h2>{phase==='updated'?'Password updated':'Password update not confirmed'}</h2>
      <AccountFeedback kind={phase==='updated'?'success':'error'} message={phase==='updated'?'Your new password was saved. Finish signing out of this recovery session.':'We could not confirm whether your password changed. Sign out, then request a new recovery link. Your password will not be submitted again from this page.'}/>
      <button type="button" className="button button-primary" disabled={!available||busy} onClick={retryLogout}>{busy?'Signing out…':'Finish signing out'}</button>
      <p className="auth-switch"><Link href="/forgot-password">Request a new recovery link</Link></p>
    </div>}
    <AccountWait busy={busy} label={phase==='updated'||phase==='uncertain'?'Closing this session…':mode==='request'?'Requesting a recovery link…':'Saving your new password…'}/>
    {mode==='request'&&phase==='form'&&<p className="auth-switch"><Link href="/login">Return to login</Link></p>}
  </div>;
}
