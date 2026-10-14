import { ApiError } from '../api/errors.ts';
import { handleApi, paginatedResult, type RuntimeEvent } from '../api/responses.ts';
import { bearerToken, type IdentityVerifier } from './supabase.ts';
import { createIdentityService } from './service.ts';
import type { SqlDatabase } from '../database/ports.ts';
import { createMembershipService, parseMembershipPagination } from './memberships.ts';
import { createAdmission } from '../api/admission.ts';

const protectedAdmission = createAdmission();

export type AccessDependencies = Readonly<{ verifier: IdentityVerifier; database: SqlDatabase }>;
export function accessResponse(request: Request, dependencies?: AccessDependencies,
  logger: (event: RuntimeEvent) => void = () => {}): Promise<Response> {
  return handleApi(request, async (input, context) => {
    if (input.method !== 'GET') throw new ApiError('METHOD_NOT_ALLOWED');
    const token = bearerToken(input);
    if (!dependencies) throw new ApiError('IDENTITY_UNAVAILABLE');
    const url = new URL(input.url);
    const pagination = url.pathname === '/api/v1/memberships' ? parseMembershipPagination(url.searchParams) : undefined;
    if (!pagination && url.search) throw new ApiError('VALIDATION_FAILED', ['query']);
    return protectedAdmission.run(async () => {
      const identity = await dependencies.verifier.verify(token);
      if (pagination) {
        const page = await createMembershipService(dependencies.database).list(identity, pagination, context.requestId);
        return paginatedResult(page.data, page.pagination);
      }
      const service = createIdentityService(dependencies.database);
      if (url.pathname === '/api/v1/me') return service.me(identity);
      const match = url.pathname.match(/^\/api\/v1\/tenants\/([^/]+)\/access$/);
      if (match) return service.tenantAccess(identity, match[1], context.requestId);
      throw new ApiError('NOT_FOUND');
    });
  }, logger).then((response) => {
    if (response.status === 405) response.headers.set('Allow', 'GET');
    if (response.status === 401) response.headers.set('WWW-Authenticate', 'Bearer');
    return response;
  });
}
