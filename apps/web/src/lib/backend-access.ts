import 'server-only';
import { loadAccessDependencies } from '@backend/identity/runtime.ts';
import { accessResponse } from '@backend/identity/routes.ts';
import { handleApi } from '@backend/api/responses.ts';
import { ApiError } from '@backend/api/errors.ts';
import { bearerToken } from '@backend/identity/supabase.ts';
import { boundAppResponse, usesAppBinding } from '@backend/api/service-binding.ts';

// Reuse one server pool, never a browser pool. Rejected startup stays rejected.
let dependencies: ReturnType<typeof loadAccessDependencies> | undefined;
export function backendAccess() {
  return dependencies ??= loadAccessDependencies();
}

// Called only by Node route handlers/server-rendered pages, never by the proxy
// or during builds. Browser traffic remains on the existing same-origin routes.
export async function backendAccessResponse(request: Request) {
  if (usesAppBinding()) return boundAppResponse(request);
  if (request.method !== 'GET') return accessResponse(request);
  try { bearerToken(request); } catch { return accessResponse(request); }
  try { return accessResponse(request, await backendAccess()); }
  catch { return handleApi(request, () => { throw new ApiError('IDENTITY_UNAVAILABLE'); }); }
}
