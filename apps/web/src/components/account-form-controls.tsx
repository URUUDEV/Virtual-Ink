'use client';
import {useEffect,useRef,useState} from 'react';
import {accountRequest,type AccountAction} from '@/lib/account-request';

export type AccountRequester=(action:AccountAction,input:Record<string,unknown>)=>ReturnType<typeof accountRequest>;
/** Prevent duplicate work and discard navigation-stale UI results. Aborting does not undo a server operation. */
export function useAccountAction() {
  const [busy,setBusy]=useState(false);
  const mounted=useRef(true),pending=useRef<AbortController|null>(null);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;pending.current?.abort();pending.current=null;};},[]);
  async function run(task:(request:AccountRequester,current:()=>boolean)=>Promise<void>,onFailure:()=>void) {
    if(!mounted.current||pending.current)return;
    const controller=new AbortController();pending.current=controller;setBusy(true);
    const current=()=>mounted.current&&pending.current===controller;
    try {await task((action,input)=>accountRequest(action,input,controller.signal),current);}
    catch {if(current())onFailure();}
    finally {if(current()){pending.current=null;setBusy(false);}}
  }
  return {busy,run};
}

export function AccountFeedback({message,kind='error'}:{message:string;kind?:'error'|'success'}) {
  const target=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(message)target.current?.focus();},[message]);
  return <div ref={target} tabIndex={-1} role={kind==='error'?'alert':'status'} aria-atomic="true" className={message?`account-feedback account-feedback-${kind}`:'sr-only'}>{message}</div>;
}

export function PasswordField({id,label='Password',newPassword=false,disabled=false}:{id:string;label?:string;newPassword?:boolean;disabled?:boolean}) {
  const [visible,setVisible]=useState(false);
  return <div className="vendor-field account-password"><label htmlFor={id}>{label}</label>
    <div className="account-password-control"><input id={id} name="password" type={visible&&!disabled?'text':'password'} autoComplete={newPassword?'new-password':'current-password'}
      minLength={newPassword?12:1} maxLength={128} required disabled={disabled} spellCheck={false} autoCapitalize="none" aria-describedby={newPassword?`${id}-help`:undefined}/>
      <button type="button" className="account-password-toggle" aria-controls={id} aria-pressed={visible&&!disabled} disabled={disabled} onClick={()=>setVisible(!visible)}>{visible&&!disabled?'Hide':'Show'}<span className="sr-only"> password</span></button></div>
    {newPassword&&<p id={`${id}-help`} className="vendor-hint">Use 12–128 characters. A long, unique passphrase works well. Pasting from a password manager is supported.</p>}
  </div>;
}

export function clearPassword(form:HTMLFormElement) {
  const password=form.querySelector<HTMLInputElement>('input[name="password"]');
  if(password)password.value='';
}

export function AccountWait({busy,label}:{busy:boolean;label:string}) {
  return <p className="account-wait" role="status" aria-atomic="true">{busy?label:''}</p>;
}
