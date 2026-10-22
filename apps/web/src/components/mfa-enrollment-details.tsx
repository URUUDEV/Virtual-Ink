'use client';
import {useEffect,useState} from 'react';

export function MfaEnrollmentDetails({qr,manualKey,expiresAt,onExpired}:{qr:string;manualKey:string;expiresAt:number;onExpired:()=>void}) {
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{
  const timer=setTimeout(onExpired,Math.max(0,expiresAt-Date.now()));
  const checkExpiry=()=>{if(Date.now()>=expiresAt)onExpired();};
  document.addEventListener('visibilitychange',checkExpiry);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',checkExpiry);};
 },[expiresAt,onExpired]);
 return <div className="mfa-enrollment-details">
  <figure><img src={qr} width={240} height={240} referrerPolicy="no-referrer" alt="Scan in your authenticator app to enroll Virtual Ink MFA"/>
   <figcaption>Keep this QR code and setup key private. They allow authenticator codes to be generated for your account.</figcaption></figure>
  <p id="mfa-manual-help">Cannot scan the QR code? Add a time-based account in your authenticator app and enter this setup key. Setup details hide after five minutes; this does not delete an unfinished factor.</p>
  <label htmlFor="mfa-manual-key">Manual authenticator setup key</label>
  <input id="mfa-manual-key" type={revealed?'text':'password'} value={manualKey} readOnly autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="mfa-manual-help"/>
  <button className="button button-plain" type="button" aria-pressed={revealed} aria-controls="mfa-manual-key" onClick={()=>setRevealed(!revealed)}>{revealed?'Hide setup key':'Show setup key'}</button>
  <button className="button button-plain" type="button" onClick={onExpired}>Hide setup details</button>
 </div>;
}
