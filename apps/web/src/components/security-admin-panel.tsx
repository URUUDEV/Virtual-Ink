'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
type Status={userId:string;role:string;canManageRoles:boolean;factors?:readonly {id:string;status:string;type:string}[];assurance?:{currentLevel:string|null;nextLevel:string|null}};
type RequestRow={id:string;target_id:string;previous_role:string;new_role:string;reason:string;requester:string;approver:string|null;state:string};
const roles=['ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER','SUPER_ADMIN','CUSTOMER'];
async function api(action:string,input:Record<string,unknown>={}) {
 const response=await fetch(`/api/security/${action}`,{method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
 const result=await response.json();
 if(!response.ok)throw new Error(response.status===429?'Too many attempts. Wait five minutes.':
  response.status===401?'Sign in again with your password, then complete an authenticator challenge.':
  response.status===403?'This action is not authorized. You may need a distinct super administrator.':
  response.status===409?'The record changed or this request was already used. Reload and review it again.':
  response.status===400?'Check the required fields and enter a clear reason of at least ten characters.':'Security administration is unavailable.');
 return result.data;
}
export function SecurityAdminPanel({initial}:{initial:Status}) {
 const [status,setStatus]=useState<Status>(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [qr,setQr]=useState(''),[factorId,setFactorId]=useState(initial.factors?.find(f=>f.type==='totp'&&f.status==='verified')?.id??''),[challengeId,setChallengeId]=useState('');
 const [target,setTarget]=useState<{userId:string;assignmentId:string;role:string;expiresAt:string|null}>();
 const [proposal,setProposal]=useState<Record<string,unknown>>(),[requests,setRequests]=useState<RequestRow[]>([]);
 const [events,setEvents]=useState<{id:string;action:string;outcome:string;severity:string;occurred_at:string}[]>([]);
 async function work(task:()=>Promise<void>) {if(busy)return;setBusy(true);setError('');setMessage('');
  try{await task();}catch(e){setError(e instanceof Error?e.message:'The request failed.');}finally{setBusy(false);}}
 const fields=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();return new FormData(event.currentTarget);};
 return <div className="security-admin-grid" aria-busy={busy}>
  <p>Signed in as {initial.userId}. Current administrative role: {status.role}.</p>
  <p className="info-callout">Administrative changes require a password sign-in and authenticator verification within five minutes. Role changes also require approval by a different super administrator.</p>
  <nav><Link href="/reset-password">Change password after step-up</Link> · <button type="button" disabled={busy} onClick={()=>work(async()=>{setStatus(await api('status'));})}>Check session and factors</button></nav>
  {status.assurance&&<p>Provider assurance: {status.assurance.currentLevel}. Required: aal2.</p>}
  {error&&<p role="alert" className="vendor-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <section className="auth-card"><h2>Authenticator security</h2>
   {status.factors&&!status.factors.some(f=>f.type==='totp'&&f.status==='verified')&&<p role="status">No verified authenticator is enrolled. Enroll an authenticator app, scan the QR code, then verify a fresh code.</p>}
   {status.factors?.some(f=>f.type==='totp'&&f.status==='verified')&&status.assurance?.currentLevel!=='aal2'&&<p role="status">Your primary sign-in is verified. Complete an authenticator challenge before sensitive administration.</p>}
   <form onSubmit={event=>{const data=fields(event);const form=event.currentTarget;void work(async()=>{
    try{await api('reauthenticate',{password:data.get('password')});setMessage('Password verified. Complete your authenticator challenge next.');}
    finally{form.reset();}});}}>
    <label htmlFor="security-password">Confirm your password</label><input id="security-password" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy}/>
    <button disabled={busy} className="button button-plain">Verify primary sign-in</button>
   </form>
   <button disabled={busy} type="button" className="button button-plain" onClick={()=>work(async()=>{
    const result=await api('enroll');setQr(result.qr);setFactorId(result.factorId);setChallengeId('');
    setMessage('Scan this QR code using your authenticator app. It is shown only for this setup attempt.');})}>Enroll authenticator</button>
   {qr&&<figure><img src={qr} width={240} height={240} alt="Scan in your authenticator app to enroll Virtual Ink MFA"/><figcaption>Keep this QR code private. It contains your enrollment secret.</figcaption></figure>}
   <div className="vendor-field"><label htmlFor="security-factor">Authenticator factor</label><select id="security-factor" value={factorId} disabled={busy} onChange={event=>{setFactorId(event.target.value);setChallengeId('');}}>
    <option value="">Choose your factor</option>{qr&&<option value={factorId}>New authenticator — verify enrollment</option>}
    {status.factors?.filter(f=>f.type==='totp').map(f=><option key={f.id} value={f.id}>{f.id} ({f.status})</option>)}
   </select></div>
   <button type="button" disabled={busy||!factorId} onClick={()=>work(async()=>{
    const result=await api('challenge',{factorId});setChallengeId(result.challengeId);setMessage('Enter a fresh authenticator code. Expired and reused codes are rejected.');})}>Start MFA challenge</button>
   <form onSubmit={event=>{const data=fields(event);const form=event.currentTarget;void work(async()=>{
    try{const result=await api('verify',{factorId,challengeId,code:data.get('code')});setQr('');setChallengeId('');setStatus(await api('status'));
     setMessage(`Authenticator verified. Audit reference: ${result.auditId}.`);}finally{form.reset();}});}}>
    <label htmlFor="security-totp">Six-digit authenticator code</label><input id="security-totp" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy||!challengeId}/>
    <button disabled={busy||!challengeId} className="button button-primary">Verify authenticator</button>
   </form>
   <p>Factor removal requires recent MFA and another verified factor. The final verified factor cannot be removed here.</p>
   <p>To restart an unfinished setup, select its unverified factor and discard it before enrolling again.</p>
   <button type="button" disabled={busy||!factorId} onClick={()=>work(async()=>{const result=await api('cancel-enrollment',{factorId});setQr('');setFactorId('');setChallengeId('');setStatus(await api('status'));setMessage(`Unfinished enrollment discarded. Audit reference: ${result.auditId}.`);})}>Discard unfinished enrollment</button>
   <button type="button" disabled={busy||!factorId} onClick={()=>work(async()=>{const result=await api('unenroll',{factorId});setQr('');setFactorId('');setStatus(await api('status'));setMessage(`Factor removed. Audit reference: ${result.auditId}.`);})}>Remove selected factor</button>
   <form onSubmit={event=>{const data=fields(event);void work(async()=>{const result=await api('recovery-request',{reason:data.get('reason')});
    setMessage(`Recovery request ${result.data.requestId} recorded. Two super administrators and private identity review are required. MFA has not been disabled.`);});}}>
    <label htmlFor="recovery-reason">Lost authenticator: request controlled recovery</label><textarea id="recovery-reason" name="reason" required minLength={10} maxLength={500} disabled={busy}/>
    <button disabled={busy}>Request recovery review</button>
   </form>
  </section>
  {initial.canManageRoles&&<section className="auth-card"><h2>Privileged role management</h2>
   <form onSubmit={event=>{const data=fields(event);void work(async()=>{const result=await api('lookup',{targetUserId:data.get('targetUserId')});setTarget(result.data);setProposal(undefined);});}}>
    <label htmlFor="role-target">Target application user ID</label><input id="role-target" name="targetUserId" required maxLength={36} disabled={busy}/><button disabled={busy}>Load current role</button>
   </form>
   {target&&<><p>User identity: {target.userId}. Current role: {target.role}. {target.expiresAt&&`Expires: ${target.expiresAt}`}</p>
    <form onSubmit={event=>{const data=fields(event);setProposal({targetUserId:target.userId,expectedAssignmentId:target.assignmentId,role:data.get('role'),reason:data.get('reason'),
      expiresAt:data.get('expiry')?new Date(String(data.get('expiry'))).toISOString():null});}}>
     <label htmlFor="role-new">Requested role</label><select id="role-new" name="role" defaultValue="" required disabled={busy}><option value="" disabled>Choose a change</option>
      {roles.map(role=><option key={role} value={role}>{role==='CUSTOMER'?'Remove privileged role — restore CUSTOMER':role}</option>)}</select>
     <label htmlFor="role-reason">Reason for this change</label><textarea id="role-reason" name="reason" minLength={10} maxLength={500} required disabled={busy}/>
     <label htmlFor="role-expiry">Optional temporary expiry (your local time; maximum 30 days)</label><input id="role-expiry" name="expiry" type="datetime-local" disabled={busy}/>
     <p>SUPER_ADMIN cannot expire automatically. Escalation grants sensitive access; removal signs the target out of every session.</p>
     <button disabled={busy||target.userId===initial.userId}>Review requested change</button>
    </form></>}
   {proposal&&<div role="group" aria-label="Confirm privilege change"><h3>Confirm the requested access change</h3><p>Target: {String(proposal.targetUserId)}. Requested role: {String(proposal.role)}.</p>
    <p>Reason: {String(proposal.reason)}</p><p>This creates a request. A distinct super administrator must approve it before execution. You cannot change your own role.</p>
    <button disabled={busy} type="button" onClick={()=>work(async()=>{const result=await api('request',proposal);setProposal(undefined);setMessage(`Request ${result.data.requestId} created. Audit reference: ${result.auditId}.`);})}>Confirm and request role change</button>
    <button disabled={busy} type="button" onClick={()=>setProposal(undefined)}>Cancel</button></div>}
   <button disabled={busy} type="button" onClick={()=>work(async()=>{const result=await api('requests');setRequests(result.data);})}>Load recent role requests</button>
   {requests.map(row=><article key={row.id}><h3>Request {row.id}</h3><p>{row.target_id}: {row.previous_role} → {row.new_role}. State: {row.state}.</p><p>{row.reason}</p>
    <p>Requester: {row.requester}. Approver: {row.approver??'Pending'}.</p>
    {row.state==='pending'&&row.requester!==initial.userId&&row.target_id!==initial.userId&&<button disabled={busy} type="button" onClick={()=>work(async()=>{const result=await api('approve',{requestId:row.id});setMessage(`Approved request ${row.id}. Audit reference: ${result.auditId}. Reload requests before execution.`);})}>Approve this access change</button>}
    {row.state==='approved'&&row.target_id!==initial.userId&&<button disabled={busy} type="button" onClick={()=>work(async()=>{const result=await api('execute',{requestId:row.id});setMessage(`Executed request ${row.id}; target sessions revoked. Audit reference: ${result.auditId}.`);setRequests([]);})}>Execute approved change and sign out target</button>}
   </article>)}
   <form onSubmit={event=>{const data=fields(event);void work(async()=>{const result=await api('recovery-approve',{requestId:data.get('requestId')});setMessage(`Recovery approval recorded. Audit reference: ${result.auditId}. Private identity review and provider-side execution remain required.`);});}}>
    <h3>Review a recovery request</h3><p>Approve only after reviewing the requester’s identity through the controlled private process. Two distinct super administrators are required. Approval does not disable MFA.</p>
    <label htmlFor="recovery-request-id">Recovery request ID</label><input id="recovery-request-id" name="requestId" required maxLength={36} disabled={busy}/>
    <button disabled={busy}>Record my recovery approval</button>
   </form>
  </section>}
  {['SUPER_ADMIN','SECURITY_ADMIN'].includes(status.role)&&<section className="auth-card"><h2>Security alerts and audit</h2>
   <button disabled={busy} type="button" onClick={()=>work(async()=>{const result=await api('events');setEvents(result.data);})}>Load recent security events</button>
   {events.map(event=><p key={event.id}>{event.severity}: {event.action} — {event.outcome}, {event.occurred_at}. Audit reference: {event.id}.</p>)}
  </section>}
 </div>;
}
