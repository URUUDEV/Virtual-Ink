# Virtual Ink Supabase REST adapter

`src/backend/database/supabase-rest.ts` is the first provider adapter for the managed Supabase direction. It uses the project's HTTPS Data API URL, a publishable key and, where a signed-in user is involved, that user's verified access token. It is server-side source code and does not expose a service-role or secret key.

The adapter accepts only `rest/v1/<table_name>` paths and a small HTTP method/query contract. It hides provider response bodies and maps authentication/policy failures to the shared API error catalogue. It does not decide tenant access, roles, pricing, file access or vendor scope. A repository must perform those checks before making a request; when the PostgreSQL adapter is added later, the same repository contract can be retained.

No route calls this adapter yet. Backend Phase 2 must add verified identity and membership first. A browser should never receive the Supabase secret/service-role key or a direct business-table capability. Publishable keys are not authorization by themselves; RLS and server-side authorization remain required.

## Configuration

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PROJECT_REF=<project-ref>
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Do not copy values from the dashboard into Git. The config loader rejects non-HTTPS/mismatched project URLs, service-role/secret key values and malformed tokens. The current tests use synthetic values and a stubbed fetcher only.

## Portability boundary

The adapter is intentionally small. It is not the domain persistence layer, an arbitrary SQL proxy, or a substitute for a database connection. Domain repositories should depend on a project-owned interface and can later switch from this REST implementation to a PostgreSQL `SqlDatabase` implementation. Keep primary keys, tenant IDs, audit event fields, pricing version fields and file IDs application-owned. Supabase-specific schemas (`auth`, `storage`) remain outside business-table contracts.
