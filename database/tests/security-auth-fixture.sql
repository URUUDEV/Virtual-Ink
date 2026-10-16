-- Disposable local replay only; never apply this file to a provider database.
DO $$ BEGIN IF to_regnamespace('auth') IS NOT NULL THEN RAISE EXCEPTION 'Refuse an existing Auth schema'; END IF; END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,aal text,factor_id uuid,not_after timestamptz);
CREATE TABLE auth.mfa_factors(id uuid PRIMARY KEY,user_id uuid,factor_type text,status text,created_at timestamptz);
CREATE TABLE auth.mfa_amr_claims(session_id uuid,authentication_method text,updated_at timestamptz,PRIMARY KEY(session_id,authentication_method));
REVOKE ALL ON SCHEMA auth FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM PUBLIC,anon,authenticated,service_role;
