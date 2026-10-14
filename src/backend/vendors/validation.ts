import { ApiError } from '../api/errors.ts';
import { strictObject, uuid } from '../api/validation.ts';
import { applicationStatuses, vendorServiceOptions, type VendorProfileInput } from '../../shared/vendor-onboarding.ts';
const fields = ['businessName','contactName','email','phone','country','city','slug','summary','registrationNumber','notes','services','handoff','typicalWorkingDays'] as const;
export const reservedVendorSlugs = ['join','prepare','onboarding','account','register','admin','signin','login','store'] as const;
export function vendorSlug(value: unknown, optional = false): string {
  if (optional && value === '') return '';
  if (typeof value !== 'string' || value.length < 3 || value.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || reservedVendorSlugs.includes(value as typeof reservedVendorSlugs[number])) throw new ApiError('VALIDATION_FAILED', ['slug']);
  return value;
}
export function validateVendorProfile(value: unknown, complete = false): VendorProfileInput {
  const data = strictObject(value, fields);
  if (Object.keys(data).length !== fields.length) throw new ApiError('VALIDATION_FAILED', ['profile']);
  const output: Record<string, unknown> = {};
  const required = ['businessName','contactName','email','country','city','slug','summary'];
  for (const [field,max] of [['businessName',100],['contactName',80],['email',254],['phone',40],['country',60],['city',80],['slug',60],['summary',400],['registrationNumber',60],['notes',500]] as const) {
    const item = data[field];
    if (typeof item !== 'string' || item.length > max || /[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(item) || complete && required.includes(field) && !item.trim()) throw new ApiError('VALIDATION_FAILED', [field]);
    output[field] = item.trim();
  }
  output.slug = vendorSlug(output.slug, !complete);
  if (complete && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(output.email as string)) throw new ApiError('VALIDATION_FAILED', ['email']);
  if (!Array.isArray(data.services) || data.services.length > 4 || complete && !data.services.length || new Set(data.services).size !== data.services.length || data.services.some(item => !vendorServiceOptions.some(choice => choice.id === item))) throw new ApiError('VALIDATION_FAILED', ['services']);
  if (typeof data.handoff !== 'string' || !['','collection','delivery','both'].includes(data.handoff) || complete && !data.handoff) throw new ApiError('VALIDATION_FAILED', ['handoff']);
  if ((data.typicalWorkingDays !== null || complete) && (typeof data.typicalWorkingDays !== 'number' || !Number.isInteger(data.typicalWorkingDays) || data.typicalWorkingDays < 1 || data.typicalWorkingDays > 90)) throw new ApiError('VALIDATION_FAILED', ['typicalWorkingDays']);
  return { ...output, services: [...data.services], handoff: data.handoff, typicalWorkingDays: data.typicalWorkingDays } as VendorProfileInput;
}
export function expectedVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1_000_000) throw new ApiError('VALIDATION_FAILED', ['expectedVersion']);
  return value;
}
export function writePayload(value: unknown, action: 'create' | 'save' | 'submit' | 'decision' | 'availability') {
  const allowed = action === 'create' ? ['operationId','profile'] : action === 'save' ? ['operationId','expectedVersion','profile'] : action === 'submit' ? ['operationId','expectedVersion','consent'] : action === 'decision' ? ['operationId','expectedVersion','decision','feedback','checks','evidenceReference'] : ['operationId','availability'];
  const body = strictObject(value, allowed);
  const result: Record<string, unknown> = { operationId: uuid(body.operationId, 'operationId') };
  if (action !== 'create' && action !== 'availability') result.expectedVersion = expectedVersion(body.expectedVersion);
  if (action === 'create' || action === 'save') result.profile = validateVendorProfile(body.profile);
  if (action === 'submit') { if (body.consent !== true) throw new ApiError('VALIDATION_FAILED', ['consent']); result.consent = true; }
  if (action === 'availability') { if (typeof body.availability !== 'string' || !['accepting_enquiries','paused'].includes(body.availability)) throw new ApiError('VALIDATION_FAILED', ['availability']); result.availability = body.availability; }
  if (action === 'decision') {
    if (typeof body.decision !== 'string' || !['approve','request_changes','reject'].includes(body.decision)) throw new ApiError('VALIDATION_FAILED', ['decision']);
    if (typeof body.feedback !== 'string' || !body.feedback.trim() || body.feedback.length > 500 || /[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(body.feedback)) throw new ApiError('VALIDATION_FAILED', ['feedback']);
    const checks = strictObject(body.checks, ['ownerIdentity','businessEvidence','serviceCapabilities']);
    if (Object.keys(checks).length !== 3 || Object.values(checks).some(item => typeof item !== 'boolean') || body.decision === 'approve' && Object.values(checks).some(item => item !== true)) throw new ApiError('VALIDATION_FAILED', ['checks']);
    result.decision = body.decision; result.feedback = body.feedback.trim(); result.checks = checks;
    result.evidenceReference = body.evidenceReference === null && body.decision !== 'approve' ? null : uuid(body.evidenceReference, 'evidenceReference');
  }
  return result;
}
export function onboardingPagination(query: URLSearchParams, admin = false) {
  const allowed = admin ? ['limit','cursor','status'] : ['limit','cursor'];
  if ([...query.keys()].some(key => !allowed.includes(key)) || allowed.some(key => query.getAll(key).length > 1)) throw new ApiError('VALIDATION_FAILED', ['query']);
  const limit = query.get('limit') ?? '20';
  if (!/^\d{1,2}$/.test(limit) || Number(limit) < 1 || Number(limit) > 50) throw new ApiError('VALIDATION_FAILED', ['limit']);
  const cursor = query.get('cursor');
  if (cursor !== null && (cursor.length > 150 || !/^[A-Za-z0-9_-]+$/.test(cursor))) throw new ApiError('VALIDATION_FAILED', ['cursor']);
  const status = admin ? query.get('status') ?? 'submitted' : undefined;
  if (status !== undefined && !(applicationStatuses as readonly string[]).includes(status)) throw new ApiError('VALIDATION_FAILED', ['status']);
  return { limit: Number(limit), cursor: cursor ?? null, ...(status ? { status } : {}) };
}
