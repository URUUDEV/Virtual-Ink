import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {loadSecurityConfig} from '@backend/identity/security-admin.ts';
import {randomUUID} from 'node:crypto';
import {securityDependencies} from '@/lib/security-admin';
import {webAuthClient} from '@/lib/web-auth';
import {SecurityAdminPanel} from '@/components/security-admin-panel';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Security administration',robots:{index:false,follow:false}};
export default async function SecurityPage() {
 let config;try{config=loadSecurityConfig(process.env);}catch{}
 if(!config)return <section className="section container auth-page"><h1>Security administration</h1><p>Security administration is unavailable while private setup and verification are pending.</p></section>;
 const store=await cookies();
 const client=webAuthClient(config,()=>store.getAll(),()=>{});
 let status;
 try{
  const dependencies=await securityDependencies(client,{get:name=>store.get(name)?.value,set:()=>{}});
  const identity=await dependencies.auth.identity();
  const result=await dependencies.commands.run('status',{},identity,randomUUID());
  const [factors,assurance]=await Promise.all([dependencies.auth.factors(),dependencies.auth.assurance()]);
  status={...result.data as {userId:string;role:string;canManageRoles:boolean},factors,assurance,needsStepUp:identity.stepUpAt===null};
 }catch{redirect('/account');}
 return <section className="section container auth-page"><p className="eyebrow">Restricted administration</p><h1>Account security and roles</h1>
  <SecurityAdminPanel initial={status}/></section>;
}
