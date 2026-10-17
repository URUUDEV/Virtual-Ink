import {cookies} from 'next/headers';
import {notFound} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import {loadSecurityConfig} from '@backend/identity/security-admin.ts';
import {securityDependencies} from '@/lib/security-admin';
import {webAuthClient} from '@/lib/web-auth';
import {BrandLab} from '@/components/brand/brand-lab';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Brand laboratory',robots:{index:false,follow:false}};
export default async function BrandLabPage(){
  let allowed=false;
  try{
    const config=loadSecurityConfig(process.env);
    if(config){const store=await cookies(),client=webAuthClient(config,()=>store.getAll(),()=>{}),dependencies=await securityDependencies(client,{get:name=>store.get(name)?.value,set:()=>{}}),identity=await dependencies.auth.identity();
      const result=await dependencies.commands.run('status',{},identity,randomUUID());
      const data=result.data as {role?:unknown};
      if(data.role==='SUPER_ADMIN'&&identity.aal==='aal2'&&identity.stepUpAt!==null){
        // The existing SQL command rechecks current provider facts, native MFA
        // receipt, recent signed step-up and assignment, and writes an audit.
        const check=await dependencies.commands.run('protected.check',{capability:'security.read'},identity,randomUUID());allowed=(check.data as {authorized?:unknown})?.authorized===true;
      }
    }
  }catch{/* No lab UI is rendered when authentication, MFA, audit or database checks fail. */}
  if(!allowed)notFound();
  return <section className="section container brand-lab-page"><p className="eyebrow">INTERNAL · RESTRICTED</p><h1>Virtual Ink brand laboratory</h1><p>Reference animation controls. Changes are local to this view and do not update platform settings.</p><BrandLab/></section>;
}
