// Run ONLY against the disposable, password-protected replay cluster on port 54329.
// This fixture validates adapter SQL, not genuine Supabase Auth or JWT signatures.
import assert from 'node:assert/strict';
import pg from 'pg';
import { createStepUpVerifier } from '../src/backend/identity/step-up.ts';
import { createSupabaseSessionEvidenceStore } from '../src/backend/identity/supabase-session.ts';

const client=new pg.Client({host:'127.0.0.1',port:54329,user:'vendor_replay',database:'postgres',
  password:process.env.PGPASSWORD,ssl:false,connectionTimeoutMillis:5000,statement_timeout:5000});
const subject='d1000000-0000-4000-8000-000000000001';
const sessionId='d1000000-0000-4000-8000-000000000002';
const factorId='d1000000-0000-4000-8000-000000000003';
const otherId='d1000000-0000-4000-8000-000000000004';
const issuer='https://synthetic.invalid/auth/v1';
const identity={provider:'supabase',issuer,subject};
await client.connect();
try {
  assert.equal((await client.query("SELECT to_regnamespace('auth') IS NULL AS isolated")).rows[0].isolated,true,
    'Refuse any cluster with an existing Auth schema.');
  await client.query('BEGIN');
  await client.query(`CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, is_anonymous boolean, email_confirmed_at timestamptz,
      deleted_at timestamptz, banned_until timestamptz);
    CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,aal text,factor_id uuid,not_after timestamptz);
    CREATE TABLE auth.mfa_factors(id uuid PRIMARY KEY,user_id uuid,factor_type text,status text,created_at timestamptz);
    CREATE TABLE auth.mfa_amr_claims(session_id uuid,authentication_method text,updated_at timestamptz);
    CREATE ROLE synthetic_session_reader NOLOGIN NOBYPASSRLS;
    GRANT USAGE ON SCHEMA auth TO synthetic_session_reader;
    GRANT SELECT(id,is_anonymous,email_confirmed_at,deleted_at,banned_until) ON auth.users TO synthetic_session_reader;
    GRANT SELECT(id,user_id,aal,factor_id,not_after) ON auth.sessions TO synthetic_session_reader;
    GRANT SELECT(id,user_id,factor_type,status,created_at) ON auth.mfa_factors TO synthetic_session_reader;
    GRANT SELECT(session_id,authentication_method,updated_at) ON auth.mfa_amr_claims TO synthetic_session_reader;`);
  const current=Math.floor(Date.now()/1000);
  await client.query('INSERT INTO auth.users VALUES($1,false,to_timestamp($2),NULL,NULL)',[subject,current-100]);
  await client.query("INSERT INTO auth.sessions VALUES($1,$2,'aal2',$3,NULL)",[sessionId,subject,factorId]);
  await client.query("INSERT INTO auth.mfa_factors VALUES($1,$2,'totp','verified',to_timestamp($3))",[factorId,subject,current-100]);
  await client.query("INSERT INTO auth.mfa_amr_claims VALUES($1,'totp',to_timestamp($2))",[sessionId,current-1]);
  const store=createSupabaseSessionEvidenceStore({async query(sql,parameters){
    await client.query('SET LOCAL ROLE synthetic_session_reader');
    try {return await client.query(sql,parameters);} finally {await client.query('RESET ROLE');}
  }});
  const verifier=createStepUpVerifier({issuer,maximumAgeSeconds:300,
    identityVerifier:{async verify(){return identity;}},sessions:store}); // Explicitly synthetic verification.
  const claims={iss:issuer,sub:subject,session_id:sessionId,role:'authenticated',aud:'authenticated',
    aal:'aal2',iat:current,exp:current+600,amr:[{method:'totp',timestamp:current-1}]};
  const token=`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.c2ln`;
  assert.equal((await verifier.verify(token)).aal,'aal2');
  let denied=0;
  async function rejects(sql,parameters=[]) {
    await client.query('SAVEPOINT denial');
    try {await client.query(sql,parameters);await assert.rejects(verifier.verify(token),{code:'UNAUTHENTICATED'});denied++;}
    finally {await client.query('ROLLBACK TO SAVEPOINT denial');}
  }
  await rejects('DELETE FROM auth.sessions');
  await rejects("UPDATE auth.sessions SET aal='aal1'");
  await rejects('UPDATE auth.sessions SET user_id=$1',[otherId]);
  await rejects('UPDATE auth.sessions SET factor_id=NULL');
  await rejects("UPDATE auth.sessions SET not_after=clock_timestamp()-interval '1 second'");
  await rejects('UPDATE auth.users SET is_anonymous=true');
  await rejects('UPDATE auth.users SET email_confirmed_at=NULL');
  await rejects('UPDATE auth.users SET deleted_at=clock_timestamp()');
  await rejects("UPDATE auth.users SET banned_until=clock_timestamp()+interval '1 hour'");
  await rejects('DELETE FROM auth.mfa_factors');
  await rejects('UPDATE auth.mfa_factors SET user_id=$1',[otherId]);
  await rejects("UPDATE auth.mfa_factors SET status='unverified'");
  await rejects("UPDATE auth.mfa_factors SET factor_type='phone'");
  await rejects('UPDATE auth.mfa_factors SET created_at=clock_timestamp()');
  await rejects('DELETE FROM auth.mfa_amr_claims');
  await rejects("UPDATE auth.mfa_amr_claims SET authentication_method='password'");
  await rejects("UPDATE auth.mfa_amr_claims SET updated_at=updated_at-interval '1 second'");
  await client.query("UPDATE auth.sessions SET not_after=clock_timestamp()+interval '30 seconds'");
  await client.query("UPDATE auth.users SET banned_until=clock_timestamp()-interval '1 minute'");
  assert.ok((await verifier.verify(token)).expiresAt<=Math.floor(Date.now()/1000)+30);
  // Read-only credentials cannot mutate provider state, even in the disposable fixture.
  await client.query('SAVEPOINT rights');await client.query('SET LOCAL ROLE synthetic_session_reader');
  await assert.rejects(client.query('DELETE FROM auth.sessions'),{code:'42501'});
  await client.query('ROLLBACK TO SAVEPOINT rights');
  await client.query('ROLLBACK');
  assert.equal((await client.query("SELECT to_regnamespace('auth') IS NULL AS clean")).rows[0].clean,true);
  console.log(`Passed: real PostgreSQL session adapter; ${denied} revocation/account/factor/AMR denials; column-only SELECT; zero fixture residue. Genuine Auth unverified.`);
} finally {await client.query('ROLLBACK').catch(()=>{});await client.end();}
