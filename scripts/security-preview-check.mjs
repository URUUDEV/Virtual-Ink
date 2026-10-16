// Credential-free, non-mutating guest probes. Never a protection bypass or MFA acceptance.
import {mkdir,writeFile} from 'node:fs/promises';
const target=new URL(process.env.HOSTED_CHECK_URL??'');
if(target.protocol!=='https:'||target.username||target.password||target.port||target.search||target.hash||target.pathname!=='/'||
 !/^virtual(?:-ink)?-[a-z0-9-]+-shadowrootsec-5679\.vercel\.app$/.test(target.hostname))throw new Error('Use this project’s reviewed Preview URL.');
const checks=[['/login','GET'],['/admin/security','GET'],['/api/security/status','GET'],['/api/security/status','POST']];
const results=[];
for(const[path,method]of checks){
 let actual=null,state='failed',reason='request_unavailable';
 try{
  const response=await fetch(new URL(path,target),{method,redirect:'manual',cache:'no-store',credentials:'omit',
   headers:{Origin:target.origin,...(method==='POST'?{'Content-Type':'application/json'}:{})},
   ...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(15000)});
  actual=response.status;
  const location=new URL(response.headers.get('location')??'/',target);
  const type=response.headers.get('content-type')??'';
  const reader=response.body?.getReader();let bytes=0,body='';
  if(reader){try{while(true){const{value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1048576){await reader.cancel();throw new Error();}body+=new TextDecoder().decode(value);}}finally{reader.releaseLock();}}
  const protectedPreview=location.hostname==='vercel.com'&&location.pathname.startsWith('/sso-api')||
   actual===401&&body.includes('Vercel')&&(/Authentication Required|vercel\.com\/sso/.test(body)||
    response.headers.get('server')==='Vercel'&&body.includes('vercel.com')&&body.includes('sso-api'));
  if(protectedPreview){state='blocked';reason='vercel_deployment_protection';}
  else {
   let json;try{json=JSON.parse(body);}catch{}
   const passed=path==='/login'?actual===200&&body.includes('Virtual Ink'):
    path==='/admin/security'?actual===307&&location.origin===target.origin&&location.pathname==='/login':
    method==='GET'?actual===405&&json?.error?.code==='METHOD_NOT_ALLOWED':
    [401,503].includes(actual)&&['UNAUTHENTICATED','IDENTITY_UNAVAILABLE'].includes(json?.error?.code);
   const headers=['no-referrer'].includes(response.headers.get('referrer-policy'))&&
    response.headers.get('x-content-type-options')==='nosniff';
   state=passed&&headers?'pass':'failed';reason=state==='pass'?'guest_only':'unexpected_guest_response';
  }
 }catch{}
 results.push({path,method,actual,state,reason});
}
const status=results.every(r=>r.state==='pass')?'pass':results.some(r=>r.state==='failed')?'failed':'blocked';
const report={check:'security_preview_guest',date:new Date().toISOString(),origin:target.origin,status,results,
 limits:['No cookies, tokens, Auth writes or role changes','No protection bypass','Not genuine MFA or isolated resource acceptance']};
await mkdir('coverage',{recursive:true});await writeFile('coverage/security-preview.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=status==='pass'?0:status==='blocked'?2:1;
