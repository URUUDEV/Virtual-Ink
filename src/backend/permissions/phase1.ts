/**
 * Phase 1 policy evaluator. Inputs must be loaded from verified identity and
 * trusted application rows; this module never accepts browser role metadata.
 * It is intentionally not wired to routes until the role/RLS migration lands.
 */
export const phase1Roles = ['CUSTOMER', 'VENDOR', 'DESIGNER', 'DELIVERY_PARTNER',
  'ORGANIZATION_MEMBER', 'ORGANIZATION_ADMIN', 'ADMIN', 'SUPER_ADMIN'] as const;
export type Phase1Role = typeof phase1Roles[number];

export const phase1Capabilities = ['order.create', 'order.read', 'file.upload.source',
  'file.download', 'file.break_glass', 'quote.propose', 'quote.respond', 'job.accept', 'assignment.manage', 'proof.upload',
  'proof.approve', 'production.start', 'production.evidence.upload', 'qc.complete',
  'order.cancel', 'delivery.update', 'audit.read', 'order.assign', 'quote.manage',
  'proof.manage', 'order.override', 'production.override', 'qc.override',
  'delivery.resolve', 'identity.manage', 'identity.suspend', 'security.read',
  'organization.manage', 'identity.super_admin'] as const;
export type Phase1Capability = typeof phase1Capabilities[number];

export type Phase1Grant = Readonly<{
  actorId: string; capability: Phase1Capability; resourceId: string;
  purpose: string; reason: string; expiresAt: number;
}>;
export type Phase1Actor = Readonly<{
  userId: string; active: boolean; roles: readonly string[];
  organizationIds: readonly string[]; vendorId?: string;
  activeVendorAssignment: boolean; activeDesignerAssignment: boolean;
  assignedDeliveryPartner: boolean; aal: 'aal1' | 'aal2';
  grants: readonly Phase1Grant[];
}>;
export type Phase1Resource = Readonly<{
  id: string; ownerUserId?: string; organizationId?: string;
  organizationMembershipActive: boolean; vendorId?: string; vendorVerified: boolean;
  assignedDesignerIds: readonly string[]; deliveryPartnerUserId?: string;
  orderState?: string; isNew?: boolean;
  fileStatus?: 'SAFE' | 'REJECTED' | 'REVIEW_REQUIRED' | 'QUARANTINED';
  filePurpose?: 'source' | 'design' | 'production' | 'proof' | 'evidence' | 'dispute';
  fileIsActive: boolean; fileApproved: boolean;
  paymentRequired: boolean; paymentConfirmed: boolean;
  proofRequired: boolean; proofApproved: boolean; proofIsLatest: boolean;
}>;
export type Phase1Authorization = Readonly<{
  actor: Phase1Actor; resource: Phase1Resource; now: number;
}>;

const orderStates = new Set(['DRAFT', 'SUBMITTED', 'QUOTE_PENDING', 'QUOTED',
  'CUSTOMER_REVIEW', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'VENDOR_ASSIGNED',
  'VENDOR_ACCEPTED', 'PROOF_REQUIRED', 'PROOF_UPLOADED', 'CHANGES_REQUESTED',
  'PROOF_APPROVED', 'QUEUED_FOR_PRODUCTION', 'IN_PRODUCTION', 'QC_PENDING',
  'QC_FAILED', 'QC_PASSED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'COMPLETED',
  'CANCELLED', 'DISPUTED']);
const cancellableStates = new Set(['DRAFT', 'SUBMITTED', 'QUOTE_PENDING', 'QUOTED',
  'CUSTOMER_REVIEW', 'AWAITING_PAYMENT']);
const sourceUploadStates = new Set(['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED']);
const assignableStates = new Set(['SUBMITTED', 'QUOTE_PENDING', 'QUOTED', 'CUSTOMER_REVIEW',
  'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'VENDOR_ASSIGNED']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value);
}

function validRequest(request: Phase1Authorization): boolean {
  if (!request || typeof request !== 'object' || !request.actor || typeof request.actor !== 'object' ||
    !request.resource || typeof request.resource !== 'object') return false;
  const { actor, resource, now } = request;
  return Number.isSafeInteger(now) && now >= 0 && actor.active === true &&
    isUuid(actor.userId) && isUuid(resource.id) &&
    Array.isArray(actor.roles) && actor.roles.length === 1 &&
    actor.roles.every((role) => (phase1Roles as readonly string[]).includes(role)) &&
    Array.isArray(actor.organizationIds) && actor.organizationIds.every(isUuid) &&
    (actor.vendorId === undefined || isUuid(actor.vendorId)) &&
    Array.isArray(actor.grants) && actor.grants.every((grant) => !!grant && typeof grant === 'object' &&
      grant.actorId === actor.userId && (phase1Capabilities as readonly string[]).includes(grant.capability) &&
      isUuid(grant.resourceId) && typeof grant.purpose === 'string' && grant.purpose.length <= 120 &&
      typeof grant.reason === 'string' && grant.reason.length <= 500 && Number.isSafeInteger(grant.expiresAt)) &&
    Array.isArray(resource.assignedDesignerIds) && resource.assignedDesignerIds.every(isUuid) &&
    (resource.ownerUserId === undefined || isUuid(resource.ownerUserId)) &&
    (resource.organizationId === undefined || isUuid(resource.organizationId)) &&
    (resource.vendorId === undefined || isUuid(resource.vendorId)) &&
    (resource.deliveryPartnerUserId === undefined || isUuid(resource.deliveryPartnerUserId)) &&
    (resource.orderState === undefined || typeof resource.orderState === 'string') &&
    (resource.isNew === undefined || typeof resource.isNew === 'boolean') &&
    actor.aal !== undefined &&
    (actor.aal === 'aal1' || actor.aal === 'aal2') &&
    typeof actor.activeVendorAssignment === 'boolean' && typeof actor.activeDesignerAssignment === 'boolean' &&
    typeof actor.assignedDeliveryPartner === 'boolean' && typeof resource.organizationMembershipActive === 'boolean' &&
    typeof resource.vendorVerified === 'boolean' && typeof resource.paymentRequired === 'boolean' &&
    typeof resource.fileIsActive === 'boolean' && typeof resource.fileApproved === 'boolean' &&
    typeof resource.paymentConfirmed === 'boolean' && typeof resource.proofRequired === 'boolean' &&
    typeof resource.proofApproved === 'boolean' && typeof resource.proofIsLatest === 'boolean' &&
    (resource.fileStatus === undefined || ['SAFE', 'REJECTED', 'REVIEW_REQUIRED', 'QUARANTINED'].includes(resource.fileStatus)) &&
    (resource.filePurpose === undefined || ['source', 'design', 'production', 'proof', 'evidence', 'dispute'].includes(resource.filePurpose));
}

function hasRole(actor: Phase1Actor, role: Phase1Role): boolean {
  return actor.roles.includes(role);
}
function owns(actor: Phase1Actor, resource: Phase1Resource): boolean {
  return resource.ownerUserId === actor.userId;
}
function organizationScope(actor: Phase1Actor, resource: Phase1Resource): boolean {
  return resource.organizationMembershipActive === true && !!resource.organizationId &&
    actor.organizationIds.includes(resource.organizationId);
}
function vendorAssignment(actor: Phase1Actor, resource: Phase1Resource): boolean {
  return resource.vendorVerified === true && actor.activeVendorAssignment === true &&
    !!actor.vendorId && resource.vendorId === actor.vendorId;
}
function designerAssignment(actor: Phase1Actor, resource: Phase1Resource): boolean {
  return actor.activeDesignerAssignment === true && resource.assignedDesignerIds.includes(actor.userId);
}
function deliveryAssignment(actor: Phase1Actor, resource: Phase1Resource): boolean {
  return actor.assignedDeliveryPartner === true && resource.deliveryPartnerUserId === actor.userId;
}
function validGrant(request: Phase1Authorization, capability: Phase1Capability): boolean {
  const { actor, resource, now } = request;
  if (!hasRole(actor, 'ADMIN') && !hasRole(actor, 'SUPER_ADMIN')) return false;
  return actor.grants.some((grant) => grant.actorId === actor.userId &&
    grant.capability === capability && grant.resourceId === resource.id &&
    typeof grant.purpose === 'string' && grant.purpose.trim().length > 0 &&
    typeof grant.reason === 'string' && grant.reason.trim().length > 0 &&
    Number.isSafeInteger(grant.expiresAt) && grant.expiresAt > now && actor.aal === 'aal2');
}
function organizationOrderGrant(request: Phase1Authorization, capability: Phase1Capability): boolean {
  const { actor, resource, now } = request;
  return (hasRole(actor, 'ORGANIZATION_MEMBER') || hasRole(actor, 'ORGANIZATION_ADMIN')) &&
    organizationScope(actor, resource) && actor.grants.some((grant) => grant.actorId === actor.userId &&
      grant.capability === capability && grant.resourceId === resource.id &&
      !!grant.purpose.trim() && Number.isSafeInteger(grant.expiresAt) && grant.expiresAt > now);
}
function safeFile(resource: Phase1Resource): boolean {
  return resource.fileStatus === 'SAFE' && resource.fileIsActive === true;
}
function privilegedFileAccess(request: Phase1Authorization): boolean {
  return hasRole(request.actor, 'ADMIN') && validGrant(request, 'file.download') ||
    hasRole(request.actor, 'SUPER_ADMIN') && validGrant(request, 'file.break_glass');
}

/** Returns false for unknown capabilities, malformed contexts and missing facts. */
export function permitsPhase1(capability: string, request: Phase1Authorization): boolean {
  if (!(phase1Capabilities as readonly string[]).includes(capability) || !validRequest(request)) return false;
  const action = capability as Phase1Capability;
  const { actor, resource } = request;
  const state = resource.orderState;
  if (state !== undefined && !orderStates.has(state)) return false;

  switch (action) {
    case 'order.create':
      if (resource.isNew !== true || resource.ownerUserId !== actor.userId) return false;
      return hasRole(actor, 'CUSTOMER') ||
        (hasRole(actor, 'ORGANIZATION_MEMBER') || hasRole(actor, 'ORGANIZATION_ADMIN')) && organizationScope(actor, resource) ||
        validGrant(request, 'order.create');
    case 'order.read':
      return owns(actor, resource) && hasRole(actor, 'CUSTOMER') ||
        hasRole(actor, 'ORGANIZATION_ADMIN') && organizationScope(actor, resource) ||
        organizationOrderGrant(request, 'order.read') ||
        vendorAssignment(actor, resource) && hasRole(actor, 'VENDOR') ||
        designerAssignment(actor, resource) && hasRole(actor, 'DESIGNER') ||
        deliveryAssignment(actor, resource) && hasRole(actor, 'DELIVERY_PARTNER') || validGrant(request, 'order.read');
    case 'file.upload.source':
      return !!state && sourceUploadStates.has(state) &&
        (owns(actor, resource) && hasRole(actor, 'CUSTOMER') || organizationScope(actor, resource) &&
          hasRole(actor, 'ORGANIZATION_ADMIN') || organizationOrderGrant(request, 'file.upload.source') ||
          validGrant(request, 'file.upload.source'));
    case 'file.download':
      if (!safeFile(resource) || !resource.filePurpose) return false;
      if (resource.filePurpose === 'source') return owns(actor, resource) && hasRole(actor, 'CUSTOMER') ||
        organizationOrderGrant(request, 'file.download') || privilegedFileAccess(request);
      if (resource.filePurpose === 'design') return designerAssignment(actor, resource) && hasRole(actor, 'DESIGNER') || privilegedFileAccess(request);
      if (resource.filePurpose === 'production') return resource.fileApproved === true &&
        (vendorAssignment(actor, resource) && hasRole(actor, 'VENDOR') || privilegedFileAccess(request));
      if (resource.filePurpose === 'proof') return owns(actor, resource) && hasRole(actor, 'CUSTOMER') ||
        vendorAssignment(actor, resource) && hasRole(actor, 'VENDOR') ||
        designerAssignment(actor, resource) && hasRole(actor, 'DESIGNER') ||
        organizationOrderGrant(request, 'file.download') || privilegedFileAccess(request);
      return privilegedFileAccess(request);
    case 'quote.propose':
      return hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) && state === 'QUOTE_PENDING' ||
        state === 'QUOTE_PENDING' && validGrant(request, 'quote.manage');
    case 'quote.respond':
      return owns(actor, resource) && hasRole(actor, 'CUSTOMER') && state === 'QUOTED' ||
        organizationOrderGrant(request, 'quote.respond') && state === 'QUOTED' || state === 'QUOTED' && validGrant(request, 'order.override');
    case 'job.accept':
      return state === 'VENDOR_ASSIGNED' &&
        (hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) || validGrant(request, 'assignment.manage'));
    case 'proof.upload':
      return (hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) ||
        hasRole(actor, 'DESIGNER') && designerAssignment(actor, resource)) &&
        (state === 'PROOF_REQUIRED' || state === 'CHANGES_REQUESTED') ||
        (state === 'PROOF_REQUIRED' || state === 'CHANGES_REQUESTED') && validGrant(request, 'proof.manage');
    case 'proof.approve':
      return resource.proofIsLatest === true && state === 'PROOF_UPLOADED' &&
        (owns(actor, resource) && hasRole(actor, 'CUSTOMER') || organizationOrderGrant(request, 'proof.approve') ||
          validGrant(request, 'order.override'));
    case 'production.start':
      return hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) && state === 'QUEUED_FOR_PRODUCTION' &&
        (!resource.paymentRequired || resource.paymentConfirmed === true) &&
        (!resource.proofRequired || resource.proofApproved === true && resource.proofIsLatest === true) ||
        state === 'QUEUED_FOR_PRODUCTION' && (!resource.paymentRequired || resource.paymentConfirmed === true) &&
        (!resource.proofRequired || resource.proofApproved === true && resource.proofIsLatest === true) &&
        validGrant(request, 'production.override');
    case 'production.evidence.upload':
      return hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) && state === 'IN_PRODUCTION' ||
        state === 'IN_PRODUCTION' && validGrant(request, 'production.evidence.upload');
    case 'qc.complete':
      return hasRole(actor, 'VENDOR') && vendorAssignment(actor, resource) && state === 'QC_PENDING' ||
        (state === 'QC_PENDING' || state === 'QC_FAILED') && validGrant(request, 'qc.override');
    case 'order.cancel':
      return !!state && cancellableStates.has(state) &&
        (owns(actor, resource) && hasRole(actor, 'CUSTOMER') ||
          hasRole(actor, 'ORGANIZATION_ADMIN') && organizationScope(actor, resource) ||
          organizationOrderGrant(request, 'order.cancel') || validGrant(request, 'order.cancel'));
    case 'delivery.update':
      return hasRole(actor, 'DELIVERY_PARTNER') && deliveryAssignment(actor, resource) && state === 'READY_FOR_DELIVERY' ||
        state === 'READY_FOR_DELIVERY' && validGrant(request, 'delivery.resolve');
    case 'audit.read':
      return owns(actor, resource) && hasRole(actor, 'CUSTOMER') || hasRole(actor, 'ORGANIZATION_ADMIN') &&
        organizationScope(actor, resource) || organizationOrderGrant(request, 'order.read') || vendorAssignment(actor, resource) &&
        hasRole(actor, 'VENDOR') || designerAssignment(actor, resource) && hasRole(actor, 'DESIGNER') ||
        deliveryAssignment(actor, resource) && hasRole(actor, 'DELIVERY_PARTNER') || validGrant(request, 'audit.read');
    case 'order.assign':
      return !!resource.vendorId && resource.vendorVerified === true &&
        !!state && assignableStates.has(state) &&
        actor.vendorId !== resource.vendorId &&
        !hasRole(actor, 'VENDOR') && validGrant(request, 'order.assign');
    case 'identity.manage': case 'identity.suspend':
    case 'security.read':
      return validGrant(request, action);
    case 'organization.manage':
      return resource.id === resource.organizationId &&
        (hasRole(actor, 'ORGANIZATION_ADMIN') && organizationScope(actor, resource) || validGrant(request, action));
    case 'identity.super_admin':
      return hasRole(actor, 'SUPER_ADMIN') && validGrant(request, action);
    default:
      return false;
  }
}
