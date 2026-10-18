/** Loopback unavailable-service/denial checks, never genuine hosted account acceptance. */
import assert from 'node:assert/strict';
const base=new URL(process.env.WEB_CHECK_URL??'http://127.0.0.1:3117');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(base.hostname),'Loopback only.');
let assertions=0;
const equal=(a,b)=>{assert.equal(a,b);assertions++;},check=value=>{assert.ok(value);assertions++;};
const get=(path,options={})=>fetch(new URL(path,base),{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});
for(const [path,heading]of [['/login','Welcome back'],['/register','Create your account'],['/forgot-password','Recover your password']]){
  const response=await get(path),html=await response.text();equal(response.status,200);check(html.includes(heading));check(html.includes('Account access is being prepared'));check(html.includes('disabled=""'));check(html.includes('aria-atomic="true"'));equal(response.headers.get('set-cookie'),null);
  if(path!=='/forgot-password'){check(html.includes('type="password"'));check(html.includes('aria-pressed="false"'));check(html.includes('Show'));}
}
for(const [value,message]of [['complete','Your password was updated'],['review','The password update could not be confirmed'],['failed','That recovery link could not be verified']]){
  const response=await get(`/login?recovery=${value}`),html=await response.text();equal(response.status,200);check(html.includes(message));check(html.includes('disabled=""'));equal(response.headers.get('set-cookie'),null);
}
const malicious=await get('/login?recovery=%3Cscript%3Ealert(1)%3C%2Fscript%3E');equal(malicious.status,200);check(!(await malicious.text()).includes('<script>alert(1)</script>'));
for(const [action,input]of [['password-reset',{email:'synthetic@example.test'}],['password-update',{password:'synthetic password only'}]]){
  const response=await get(`/api/auth/${action}`,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:JSON.stringify(input)});
  equal(response.status,503);equal((await response.json()).error.code,'IDENTITY_UNAVAILABLE');equal(response.headers.get('set-cookie'),null);check(response.headers.get('cache-control')?.includes('no-store'));
}
for(const path of ['/account','/reset-password','/reset-password?role=SUPER_ADMIN','/admin/security','/brand-lab']){
  const response=await get(path,{headers:{'X-Role':'SUPER_ADMIN',Cookie:'sb-synthetic-auth-token=tampered-only'}});
  check([307,404].includes(response.status));check(response.headers.get('cache-control')?.includes('no-store'));
  if(response.status===307)equal(new URL(response.headers.get('location'),base).pathname,'/login');
}
console.log(JSON.stringify({check:'account_ux_loopback_http',status:'pass',assertions,genuineHostedAuth:'unverified'}));
