import 'server-only';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { ApiError } from '@backend/api/errors.ts';
import { createPooledDatabase, type ConnectionPool } from '@backend/database/pool.ts';
import { loadDatabaseConfig } from '@backend/database/config.ts';
import { createSupabaseIdentityVerifier } from '@backend/identity/supabase.ts';
import { createSecurityCommands, loadSecurityConfig, securityIdentityFromClaims, securityResponse,issueApplicationStepUp,withApplicationStepUp,
  type SecurityAuth, type SecurityConfig } from '@backend/identity/security-admin.ts';
import { webAuthClient, type AuthCookie } from './web-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createWorkflowCommands, workflowResponse } from '@backend/orders/workflow.ts';
import { handleApi } from '@backend/api/responses.ts';
import { assertEnvironmentIsolation } from '@backend/setup/environment-isolation.ts';
import { createDashboardQueries } from '@backend/orders/dashboard.ts';

type Client=ReturnType<typeof webAuthClient>;
export type SecurityCookieStore={get(name:string):string|undefined;set(cookie:AuthCookie):void};
function check(error:{status?:number}|null) {
  if(error)throw new ApiError(error.status===429?'RATE_LIMITED':!error.status||error.status>=500?'IDENTITY_UNAVAILABLE':'UNAUTHENTICATED');
}
export function securityAuthGateway(client:Client,config:SecurityConfig,cookies:SecurityCookieStore):SecurityAuth {
  const name=config.origin.startsWith('https:')?'__Host-vi-step-up':'vi-step-up';
  const options={httpOnly:true,secure:config.origin.startsWith('https:'),sameSite:'strict' as const,path:'/'};
  const clear=()=>cookies.set({name,value:'',options:{...options,maxAge:0}});
  return {
    async identity() {
      const user=await client.auth.getUser();check(user.error);
      if(user.data.user?.is_anonymous!==false||!user.data.user.email_confirmed_at)throw new ApiError('UNAUTHENTICATED');
      const session=await client.auth.getSession();check(session.error);
      if(!session.data.session)throw new ApiError('UNAUTHENTICATED');
      const token=session.data.session.access_token;
      const identity=await createSupabaseIdentityVerifier(config).verify(token);
      const claims=await client.auth.getClaims(token);check(claims.error);
      if(!claims.data||identity.subject!==user.data.user.id)throw new ApiError('UNAUTHENTICATED');
      return withApplicationStepUp(securityIdentityFromClaims(claims.data.claims,identity),cookies.get(name),config.codeKey);
    },
    async factors() {
      const result=await client.auth.mfa.listFactors();check(result.error);
      return result.data!.all.map(f=>({id:f.id,status:f.status,type:f.factor_type}));
    },
    async assurance() {
      const result=await client.auth.mfa.getAuthenticatorAssuranceLevel();check(result.error);
      return {currentLevel:result.data!.currentLevel,nextLevel:result.data!.nextLevel};
    },
    async enroll() {
      const result=await client.auth.mfa.enroll({factorType:'totp',issuer:'Virtual Ink',friendlyName:`Virtual Ink administrator ${randomUUID()}`});check(result.error);
      const qr=result.data!.totp.qr_code;
      // Native Auth QR SVGs exceed 256 KiB for ordinary issuer/email payloads.
      if(!qr.startsWith('data:image/svg+xml;utf-8,')||qr.length>1048576)throw new ApiError('IDENTITY_UNAVAILABLE');
      return {factorId:result.data!.id,qr:`data:image/svg+xml;base64,${Buffer.from(qr.slice('data:image/svg+xml;utf-8,'.length)).toString('base64')}`};
    },
    async challenge(factorId) {
      const result=await client.auth.mfa.challenge({factorId});check(result.error);
      return {challengeId:result.data!.id,expiresAt:result.data!.expires_at};
    },
    async verify(factorId,challengeId,code) {
      const result=await client.auth.mfa.verify({factorId,challengeId,code});check(result.error);
      // Tokens are retained only in HttpOnly session cookies; never return the SDK response.
      const current=await this.identity();
      if(current.aal!=='aal2'||current.mfaAt===null)throw new ApiError('UNAUTHENTICATED');
      const proof=issueApplicationStepUp(current,config.codeKey);
      cookies.set({name,value:proof.value,options:{...options,maxAge:proof.maxAge}});
    },
    async reauthenticate(password) {
      const before=await client.auth.getUser();check(before.error);
      if(!before.data.user?.email)throw new ApiError('UNAUTHENTICATED');
      const result=await client.auth.signInWithPassword({email:before.data.user.email,password});check(result.error);
      if(result.data.user?.id!==before.data.user.id)throw new ApiError('UNAUTHENTICATED');
      clear();
    },
    async updatePassword(password) {const result=await client.auth.updateUser({password});check(result.error);clear();},
    async unenroll(factorId) {const result=await client.auth.mfa.unenroll({factorId});check(result.error);clear();},
    async logout() {const result=await client.auth.signOut({scope:'local'});check(result.error);clear();},
  };
}
let database:Promise<ReturnType<typeof createPooledDatabase>>|undefined;
async function openSecurityDatabase(config:SecurityConfig) {
  const env={...process.env,DATABASE_URL:process.env.SECURITY_DATABASE_URL,
    DATABASE_SSL_ROOT_CERT:process.env.SECURITY_DATABASE_SSL_ROOT_CERT,DATABASE_MIGRATION_URL:undefined};
  if(!loadDatabaseConfig(env).configured)throw new Error();
  const url=new URL(env.DATABASE_URL!);url.searchParams.delete('sslmode');
  const ca=env.DATABASE_SSL_ROOT_CERT?await readFile(env.DATABASE_SSL_ROOT_CERT,'utf8'):undefined;
  if(config.environment==='preview'&&!ca?.includes('-----BEGIN CERTIFICATE-----'))throw new Error();
  const {Pool}=createRequire(import.meta.url)('pg') as {Pool:new(options:Record<string,unknown>)=>ConnectionPool&{on(name:string,fn:()=>void):void}};
  const pool=new Pool({connectionString:url.toString(),max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,
    statement_timeout:5000,ssl:ca?{ca,rejectUnauthorized:true}:false});
  pool.on('error',()=>{});
  const db=createPooledDatabase(pool);
  try {
    const result=await db.query(`SELECT NOT (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication)
      AND pg_has_role(current_user,'virtual_ink_security_service','USAGE')
      AND NOT EXISTS(SELECT FROM pg_auth_members m WHERE m.member=r.oid AND (m.roleid<>'virtual_ink_security_service'::regrole OR m.admin_option))
      AND NOT EXISTS(SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN('virtual_ink','virtual_ink_phase1','virtual_ink_security','virtual_ink_workflow','auth') AND pg_has_role(current_user,c.relowner,'MEMBER')) AS safe
      FROM pg_roles r WHERE r.rolname=current_user`,[]);
    if(result.rows[0]?.safe!==true)throw new Error();
    return db;
  }catch{await db.close();throw new Error();}
}
export async function securityDependencies(client:Client,cookies:SecurityCookieStore) {
  try {
    const config=loadSecurityConfig(process.env);if(!config)throw new Error();
    const db=await(database??=openSecurityDatabase(config));
    return {config,auth:securityAuthGateway(client,config,cookies),commands:createSecurityCommands(db,config)};
  }catch{throw new ApiError('IDENTITY_UNAVAILABLE');}
}
export async function orderDashboardDependencies(client:Client,cookies:SecurityCookieStore) {
  assertEnvironmentIsolation(process.env);
  const config=loadSecurityConfig(process.env);
  if(process.env.WORKFLOW_ENABLED!=='true'||!config)throw new ApiError('IDENTITY_UNAVAILABLE');
  const db=await(database??=openSecurityDatabase(config));
  return {auth:securityAuthGateway(client,config,cookies),commands:createWorkflowCommands(db,config.environment),dashboard:createDashboardQueries(db,config.environment)};
}
export async function handleSecurityRequest(request:NextRequest,action:string) {
  const pending:AuthCookie[]=[];
  const result=await securityResponse(request,action,async()=>{
    let config:SecurityConfig|undefined;
    try{config=loadSecurityConfig(process.env);}catch{throw new ApiError('IDENTITY_UNAVAILABLE');}
    if(!config)throw new ApiError('IDENTITY_UNAVAILABLE');
    const currentCookies=()=>{
      const values=new Map(request.cookies.getAll().map(cookie=>[cookie.name,cookie.value]));
      for(const cookie of pending){if(cookie.value)values.set(cookie.name,cookie.value);else values.delete(cookie.name);}
      return [...values].map(([name,value])=>({name,value}));
    };
    const client=webAuthClient(config,currentCookies,cookies=>{pending.push(...cookies);});
    return securityDependencies(client,{get:name=>currentCookies().find(cookie=>cookie.name===name)?.value,set:cookie=>{pending.push(cookie);}});
  });
  const response=new NextResponse(result.body,{status:result.status,headers:result.headers});
  if(result.ok)pending.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  return response;
}

export async function handleWorkflowRequest(request:NextRequest,action:string) {
  if(process.env.WORKFLOW_ENABLED!=='true')return workflowResponse(request,action);
  const pending:AuthCookie[]=[];
  try {
    assertEnvironmentIsolation(process.env);
    const config=loadSecurityConfig(process.env);
    if(!config)throw new ApiError('IDENTITY_UNAVAILABLE');
    const currentCookies=()=>{
      const values=new Map(request.cookies.getAll().map(cookie=>[cookie.name,cookie.value]));
      for(const cookie of pending){if(cookie.value)values.set(cookie.name,cookie.value);else values.delete(cookie.name);}
      return [...values].map(([name,value])=>({name,value}));
    };
    const client=webAuthClient(config,currentCookies,cookies=>{pending.push(...cookies);});
    const gateway=securityAuthGateway(client,config,{get:name=>currentCookies().find(cookie=>cookie.name===name)?.value,set:cookie=>{pending.push(cookie);}});
    const db=await(database??=openSecurityDatabase(config));
    const result=await workflowResponse(request,action,{origin:config.origin,identity:()=>gateway.identity(),commands:createWorkflowCommands(db,config.environment)});
    const response=new NextResponse(result.body,{status:result.status,headers:result.headers});
    if(result.ok)pending.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    return response;
  } catch {return handleApi(request,()=>{throw new ApiError('IDENTITY_UNAVAILABLE');});}
}
