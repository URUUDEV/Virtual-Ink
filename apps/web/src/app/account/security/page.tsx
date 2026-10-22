import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {loadSecurityConfig,privilegedRoles} from '@backend/identity/security-admin.ts';
import {securityDependencies} from '@/lib/security-admin';
import {webAuthClient} from '@/lib/web-auth';
import {SecurityAdminPanel} from '@/components/security-admin-panel';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Account security',robots:{index:false,follow:false}};
export default async function AccountSecurityPage() {
 let config;try{config=loadSecurityConfig(process.env);}catch{}
 if(!config)return <section className="section container auth-page"><h1>Account security</h1><p>Account security is unavailable while private setup and verification are pending.</p><Link href="/account">Return to your account</Link></section>;
 const store=await cookies();
 const client=webAuthClient(config,()=>store.getAll(),()=>{});
 let status;
 try{
  const dependencies=await securityDependencies(client,{get:name=>store.get(name)?.value,set:()=>{}});
  const identity=await dependencies.auth.identity();
  const result=await dependencies.commands.run('account.security',{},identity,randomUUID());
  const data=result.data as {userId:string;role:string;canManageRoles:boolean};
  status={...data,factors:await dependencies.auth.factors(),assurance:await dependencies.auth.assurance(),needsStepUp:identity.stepUpAt===null};
 }catch{redirect('/account');}
 if((privilegedRoles as readonly string[]).includes(status.role))redirect('/admin/security');
 if(!['CUSTOMER','VENDOR'].includes(status.role))redirect('/account');
 return <section className="section container auth-page security-admin-page"><p className="eyebrow">Your Virtual Ink account</p><h1>Account security</h1>
  <Link href="/account" className="button button-plain">Return to your account</Link><SecurityAdminPanel initial={status} selfService/></section>;
}
