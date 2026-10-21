import 'server-only';
import { cookies } from 'next/headers';
import { loadSecurityConfig } from '@backend/identity/security-admin.ts';
import { ApiError } from '@backend/api/errors.ts';
import { webAuthClient } from './web-auth';
import { orderDashboardDependencies } from './security-admin';

export async function orderDashboardSession(mutate=false) {
  const config=loadSecurityConfig(process.env);
  if(!config||process.env.WORKFLOW_ENABLED!=='true')throw new ApiError('IDENTITY_UNAVAILABLE');
  const store=await cookies();
  const client=webAuthClient(config,()=>store.getAll(),pending=>{if(mutate)pending.forEach(({name,value,options})=>store.set(name,value,options));});
  const dependencies=await orderDashboardDependencies(client,{get:name=>store.get(name)?.value,set:cookie=>{if(mutate)store.set(cookie.name,cookie.value,cookie.options);}});
  return {...dependencies,identity:await dependencies.auth.identity(),origin:config.origin};
}
