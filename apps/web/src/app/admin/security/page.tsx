import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {loadSecurityConfig,privilegedRoles} from '@backend/identity/security-admin.ts';
import {randomUUID} from 'node:crypto';
import {securityDependencies} from '@/lib/security-admin';
import {webAuthClient} from '@/lib/web-auth';
import {SecurityAdminPanel} from '@/components/security-admin-panel';
import Link from 'next/link';
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
 if(!(privilegedRoles as readonly string[]).includes(status.role))redirect('/account');
 return <section className="section container auth-page security-admin-page"><p className="eyebrow">Restricted administration</p><h1>Account security and roles</h1>
  {process.env.WORKFLOW_ENABLED==='true'&&['ADMIN','SUPER_ADMIN'].includes(status.role)&&<Link href="/admin" className="button button-plain">Open order oversight</Link>}
  <SecurityAdminPanel initial={status}/></section>;
}
