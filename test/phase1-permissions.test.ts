import { test } from 'node:test';
import assert from 'node:assert/strict';
import { permitsPhase1, phase1Capabilities, phase1Roles, type Phase1Actor,
  type Phase1Authorization, type Phase1Capability, type Phase1Grant, type Phase1Resource, type Phase1Role } from '../src/backend/permissions/phase1.ts';

const user = '11111111-1111-4111-8111-111111111111';
const otherUser = '22222222-2222-4222-8222-222222222222';
const vendor = '33333333-3333-4333-8333-333333333333';
const organization = '44444444-4444-4444-8444-444444444444';
const order = '55555555-5555-4555-8555-555555555555';
const otherOrder = '66666666-6666-4666-8666-666666666666';
const now = 1_800_000_000_000;

function actor(role: Phase1Role, overrides: Partial<Phase1Actor> = {}): Phase1Actor {
  return { userId: user, active: true, roles: [role], organizationIds: [],
    activeVendorAssignment: false, activeDesignerAssignment: false,
    assignedDeliveryPartner: false, aal: 'aal1', grants: [], ...overrides };
}
function resource(overrides: Partial<Phase1Resource> = {}): Phase1Resource {
  return { id: order, ownerUserId: user, organizationMembershipActive: false,
    vendorVerified: true, assignedDesignerIds: [], paymentRequired: false,
    fileIsActive: true, fileApproved: true,
    paymentConfirmed: false, proofRequired: false, proofApproved: false,
    proofIsLatest: false, ...overrides };
}
function access(role: Phase1Role, resourceFacts: Partial<Phase1Resource> = {}, actorFacts: Partial<Phase1Actor> = {}, at = now): Phase1Authorization {
  return { actor: actor(role, actorFacts), resource: resource(resourceFacts), now: at };
}
function grant(capability: Phase1Capability, resourceId = order, overrides: Partial<Phase1Grant> = {}): Phase1Grant {
  return { actorId: user, capability, resourceId, purpose: 'review_case', reason: 'Synthetic policy test',
    expiresAt: now + 1000, ...overrides };
}
function permits(capability: string, request: Phase1Authorization): boolean {
  return permitsPhase1(capability, request);
}

test('declares the eight requested roles and fails closed on unknown or malformed context', () => {
  assert.deepEqual(phase1Roles, ['CUSTOMER', 'VENDOR', 'DESIGNER', 'DELIVERY_PARTNER',
    'ORGANIZATION_MEMBER', 'ORGANIZATION_ADMIN', 'ADMIN', 'SUPER_ADMIN']);
  assert.ok(phase1Capabilities.includes('file.break_glass'));
  assert.equal(permits('role.assign', access('CUSTOMER')), false);
  assert.equal(permits('order.read', null as unknown as Phase1Authorization), false);
  assert.equal(permits('order.read', { ...access('CUSTOMER'), actor: null as unknown as Phase1Actor }), false);
  assert.equal(permits('order.read', { ...access('CUSTOMER'), resource: null as unknown as Phase1Resource }), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { active: false })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { userId: 'invalid' })), false);
  assert.equal(permits('order.read', access('CUSTOMER', { id: '../other' })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { roles: ['CUSTOMER', 'VENDOR'] })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { roles: ['PLATFORM_OPERATOR'] })), false);
  assert.equal(permits('order.read', { ...access('CUSTOMER'), now: -1 }), false);
  assert.equal(permits('order.read', access('CUSTOMER', { orderState: 'UNKNOWN' })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { aal: 'unknown' as 'aal1' })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { grants: [null as unknown as Phase1Grant] })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { organizationIds: ['not-a-uuid'] })), false);
  assert.equal(permits('order.read', access('CUSTOMER', {}, { vendorId: 'not-a-uuid' })), false);
});

test('customer order, source-file, quotation, proof and cancellation access is own and state bound', () => {
  assert.equal(permits('order.create', access('CUSTOMER', { isNew: true })), true);
  assert.equal(permits('order.create', access('CUSTOMER', { isNew: false })), false);
  assert.equal(permits('order.read', access('CUSTOMER')), true);
  assert.equal(permits('order.read', access('CUSTOMER', { ownerUserId: otherUser })), false);
  assert.equal(permits('file.upload.source', access('CUSTOMER', { orderState: 'DRAFT' })), true);
  assert.equal(permits('file.upload.source', access('CUSTOMER', { orderState: 'SUBMITTED' })), true);
  assert.equal(permits('file.upload.source', access('CUSTOMER', { orderState: 'IN_PRODUCTION' })), false);
  assert.equal(permits('file.download', access('CUSTOMER', { filePurpose: 'source', fileStatus: 'SAFE' })), true);
  for (const fileStatus of ['QUARANTINED', 'REJECTED', 'REVIEW_REQUIRED'] as const) {
    assert.equal(permits('file.download', access('CUSTOMER', { filePurpose: 'source', fileStatus })), false);
  }
  assert.equal(permits('file.download', access('CUSTOMER', { ownerUserId: otherUser, filePurpose: 'source', fileStatus: 'SAFE' })), false);
  assert.equal(permits('quote.respond', access('CUSTOMER', { orderState: 'QUOTED' })), true);
  assert.equal(permits('quote.respond', access('CUSTOMER', { orderState: 'QUOTE_PENDING' })), false);
  assert.equal(permits('proof.approve', access('CUSTOMER', { orderState: 'PROOF_UPLOADED', proofIsLatest: true })), true);
  assert.equal(permits('proof.approve', access('CUSTOMER', { orderState: 'PROOF_UPLOADED', proofIsLatest: false })), false);
  assert.equal(permits('proof.approve', access('CUSTOMER', { ownerUserId: otherUser, orderState: 'PROOF_UPLOADED', proofIsLatest: true })), false);
  assert.equal(permits('order.cancel', access('CUSTOMER', { orderState: 'AWAITING_PAYMENT' })), true);
  assert.equal(permits('order.cancel', access('CUSTOMER', { orderState: 'IN_PRODUCTION' })), false);
});

test('vendor access requires assignment and enforces payment/proof production gates', () => {
  const assigned = { vendorId: vendor, activeVendorAssignment: true };
  assert.equal(permits('order.read', access('VENDOR', { vendorId: vendor }, assigned)), true);
  assert.equal(permits('order.read', access('VENDOR', { vendorId: vendor }, { vendorId: vendor })), false);
  assert.equal(permits('quote.propose', access('VENDOR', { vendorId: vendor, orderState: 'QUOTE_PENDING' }, assigned)), true);
  assert.equal(permits('quote.propose', access('VENDOR', { vendorId: vendor, orderState: 'QUOTED' }, assigned)), false);
  assert.equal(permits('job.accept', access('VENDOR', { vendorId: vendor, orderState: 'VENDOR_ASSIGNED' }, assigned)), true);
  assert.equal(permits('job.accept', access('VENDOR', { vendorId: otherUser, orderState: 'VENDOR_ASSIGNED' }, assigned)), false);
  assert.equal(permits('proof.upload', access('VENDOR', { vendorId: vendor, orderState: 'PROOF_REQUIRED' }, assigned)), true);
  assert.equal(permits('proof.upload', access('VENDOR', { vendorId: vendor, orderState: 'CHANGES_REQUESTED' }, assigned)), true);
  assert.equal(permits('proof.upload', access('VENDOR', { vendorId: vendor, orderState: 'PROOF_APPROVED' }, assigned)), false);
  assert.equal(permits('file.download', access('VENDOR', { vendorId: vendor, filePurpose: 'production', fileStatus: 'SAFE' }, assigned)), true);
  assert.equal(permits('file.download', access('VENDOR', { vendorId: vendor, filePurpose: 'source', fileStatus: 'SAFE' }, assigned)), false);
  const queued = { vendorId: vendor, orderState: 'QUEUED_FOR_PRODUCTION', paymentRequired: true,
    paymentConfirmed: false, proofRequired: true, proofApproved: false, proofIsLatest: false };
  assert.equal(permits('production.start', access('VENDOR', queued, assigned)), false);
  assert.equal(permits('production.start', access('VENDOR', { ...queued, paymentConfirmed: true }, assigned)), false);
  assert.equal(permits('production.start', access('VENDOR', { ...queued, paymentConfirmed: true,
    proofApproved: true, proofIsLatest: true }, assigned)), true);
  assert.equal(permits('production.evidence.upload', access('VENDOR', { vendorId: vendor, orderState: 'IN_PRODUCTION' }, assigned)), true);
  assert.equal(permits('production.evidence.upload', access('VENDOR', { vendorId: vendor, orderState: 'COMPLETED' }, assigned)), false);
  assert.equal(permits('qc.complete', access('VENDOR', { vendorId: vendor, orderState: 'QC_PENDING' }, assigned)), true);
  assert.equal(permits('qc.complete', access('VENDOR', { vendorId: vendor, orderState: 'QC_FAILED' }, assigned)), false);
  assert.equal(permits('proof.approve', access('VENDOR', { vendorId: vendor, orderState: 'PROOF_UPLOADED', proofIsLatest: true }, assigned)), false);
  assert.equal(permits('order.assign', access('VENDOR', { vendorId: vendor, vendorVerified: true,
    orderState: 'SUBMITTED' }, { ...assigned, aal: 'aal2', grants: [grant('order.assign')] })), false);
});

test('designer and delivery roles receive only their assigned tasks and permitted artifacts', () => {
  const designer = { activeDesignerAssignment: true };
  assert.equal(permits('order.read', access('DESIGNER', { assignedDesignerIds: [user] }, designer)), true);
  assert.equal(permits('file.download', access('DESIGNER', { assignedDesignerIds: [user],
    filePurpose: 'design', fileStatus: 'SAFE' }, designer)), true);
  assert.equal(permits('file.download', access('DESIGNER', { assignedDesignerIds: [user],
    filePurpose: 'source', fileStatus: 'SAFE' }, designer)), false);
  assert.equal(permits('proof.upload', access('DESIGNER', { assignedDesignerIds: [user],
    orderState: 'CHANGES_REQUESTED' }, designer)), true);
  assert.equal(permits('production.start', access('DESIGNER', { orderState: 'QUEUED_FOR_PRODUCTION' }, designer)), false);
  const delivery = { assignedDeliveryPartner: true };
  assert.equal(permits('order.read', access('DELIVERY_PARTNER', { deliveryPartnerUserId: user }, delivery)), true);
  assert.equal(permits('order.read', access('DELIVERY_PARTNER', { deliveryPartnerUserId: otherUser }, delivery)), false);
  assert.equal(permits('delivery.update', access('DELIVERY_PARTNER', { deliveryPartnerUserId: user,
    orderState: 'READY_FOR_DELIVERY' }, delivery)), true);
  assert.equal(permits('delivery.update', access('DELIVERY_PARTNER', { deliveryPartnerUserId: user,
    orderState: 'IN_PRODUCTION' }, delivery)), false);
  assert.equal(permits('file.download', access('DELIVERY_PARTNER', { deliveryPartnerUserId: user,
    filePurpose: 'source', fileStatus: 'SAFE' }, delivery)), false);
  assert.equal(permits('proof.approve', access('DELIVERY_PARTNER', { deliveryPartnerUserId: user,
    orderState: 'PROOF_UPLOADED', proofIsLatest: true }, delivery)), false);
});

test('organization orders and files require active membership and order-specific grants', () => {
  const organizationMember = { organizationIds: [organization] };
  const orgOrder = { organizationId: organization, organizationMembershipActive: true, ownerUserId: otherUser };
  assert.equal(permits('order.read', access('ORGANIZATION_MEMBER', orgOrder, organizationMember)), false);
  const readGrant = grant('order.read');
  assert.equal(permits('order.read', access('ORGANIZATION_MEMBER', orgOrder,
    { ...organizationMember, grants: [readGrant] })), true);
  assert.equal(permits('order.read', access('ORGANIZATION_MEMBER', orgOrder,
    { ...organizationMember, grants: [grant('order.read', otherOrder)] })), false);
  assert.equal(permits('order.read', access('ORGANIZATION_MEMBER', orgOrder,
    { ...organizationMember, grants: [grant('order.read', order, { expiresAt: now })] })), false);
  assert.equal(permits('order.read', access('ORGANIZATION_MEMBER', orgOrder,
    { organizationIds: [otherUser], grants: [readGrant] })), false);
  assert.equal(permits('file.upload.source', access('ORGANIZATION_MEMBER', { ...orgOrder, orderState: 'DRAFT' }, organizationMember)), false);
  assert.equal(permits('file.upload.source', access('ORGANIZATION_MEMBER', { ...orgOrder, orderState: 'DRAFT' },
    { ...organizationMember, grants: [grant('file.upload.source')] })), true);
  assert.equal(permits('file.download', access('ORGANIZATION_MEMBER', { ...orgOrder, filePurpose: 'source', fileStatus: 'SAFE' },
    { ...organizationMember, grants: [grant('file.download')] })), true);
  assert.equal(permits('file.download', access('ORGANIZATION_MEMBER', { ...orgOrder, filePurpose: 'source', fileStatus: 'SAFE' }, organizationMember)), false);
  assert.equal(permits('quote.respond', access('ORGANIZATION_MEMBER', { ...orgOrder, orderState: 'QUOTED' },
    { ...organizationMember, grants: [grant('quote.respond')] })), true);
  assert.equal(permits('proof.approve', access('ORGANIZATION_MEMBER', { ...orgOrder, orderState: 'PROOF_UPLOADED', proofIsLatest: true },
    { ...organizationMember, grants: [grant('proof.approve')] })), true);
  assert.equal(permits('audit.read', access('ORGANIZATION_MEMBER', orgOrder,
    { ...organizationMember, grants: [readGrant] })), true);
  const orgAdmin = access('ORGANIZATION_ADMIN', orgOrder, organizationMember);
  assert.equal(permits('order.read', orgAdmin), true);
  assert.equal(permits('organization.manage', access('ORGANIZATION_ADMIN', { ...orgOrder, id: organization }, organizationMember)), true);
  assert.equal(permits('organization.manage', access('ORGANIZATION_ADMIN', { ...orgOrder, id: order }, organizationMember)), false);
  assert.equal(permits('organization.manage', access('ORGANIZATION_ADMIN', { ...orgOrder, organizationId: otherUser }, organizationMember)), false);
});

test('privileged administration requires exact scoped grant, reason, expiry and step-up', () => {
  const adminFacts = { aal: 'aal2' as const, grants: [grant('order.read')] };
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser }, adminFacts)), true);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser }, { grants: [grant('order.read')] })), false);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser },
    { aal: 'aal2', grants: [grant('order.read', otherOrder)] })), false);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser },
    { aal: 'aal2', grants: [grant('order.read', order, { expiresAt: now - 1 })] })), false);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser },
    { aal: 'aal2', grants: [grant('order.read', order, { purpose: '' })] })), false);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser },
    { aal: 'aal2', grants: [grant('order.read', order, { reason: '' })] })), false);
  assert.equal(permits('order.read', access('ADMIN', { ownerUserId: otherUser },
    { aal: 'aal2', grants: [grant('order.read', order, { actorId: otherUser })] })), false);
  assert.equal(permits('proof.approve', access('ADMIN', { orderState: 'PROOF_UPLOADED', proofIsLatest: true },
    { aal: 'aal2', grants: [grant('order.override')] })), true);
  assert.equal(permits('proof.approve', access('ADMIN', { orderState: 'PROOF_UPLOADED', proofIsLatest: false },
    { aal: 'aal2', grants: [grant('order.override')] })), false);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor, vendorVerified: true,
    orderState: 'SUBMITTED' }, { aal: 'aal2', grants: [grant('order.assign')] })), true);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor, vendorVerified: false,
    orderState: 'SUBMITTED' }, { aal: 'aal2', grants: [grant('order.assign')] })), false);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor, vendorVerified: true,
    orderState: 'COMPLETED' }, { aal: 'aal2', grants: [grant('order.assign')] })), false);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor, orderState: 'SUBMITTED' },
    { vendorId: vendor, aal: 'aal2', grants: [grant('order.assign')] })), false);
  assert.equal(permits('identity.suspend', access('ADMIN', {}, { aal: 'aal2', grants: [grant('identity.suspend')] })), true);
  assert.equal(permits('identity.super_admin', access('ADMIN', {}, { aal: 'aal2', grants: [grant('identity.super_admin')] })), false);
  assert.equal(permits('identity.super_admin', access('SUPER_ADMIN', {}, { aal: 'aal2', grants: [grant('identity.super_admin')] })), true);
  assert.equal(permits('file.download', access('SUPER_ADMIN', { filePurpose: 'source', fileStatus: 'SAFE' },
    { aal: 'aal2', grants: [grant('file.break_glass')] })), true);
  assert.equal(permits('file.download', access('SUPER_ADMIN', { filePurpose: 'source', fileStatus: 'SAFE' },
    { aal: 'aal2', grants: [grant('file.download')] })), false);
});

test('support grants permit only the named business action and retain state and production gates', () => {
  const cases: readonly [string, Phase1Capability, Partial<Phase1Resource>][] = [
    ['order.create', 'order.create', { isNew: true }],
    ['file.upload.source', 'file.upload.source', { orderState: 'DRAFT' }],
    ['quote.propose', 'quote.manage', { orderState: 'QUOTE_PENDING' }],
    ['quote.respond', 'order.override', { orderState: 'QUOTED' }],
    ['job.accept', 'assignment.manage', { orderState: 'VENDOR_ASSIGNED' }],
    ['proof.upload', 'proof.manage', { orderState: 'PROOF_REQUIRED' }],
    ['proof.upload', 'proof.manage', { orderState: 'CHANGES_REQUESTED' }],
    ['production.start', 'production.override', { orderState: 'QUEUED_FOR_PRODUCTION' }],
    ['production.evidence.upload', 'production.evidence.upload', { orderState: 'IN_PRODUCTION' }],
    ['qc.complete', 'qc.override', { orderState: 'QC_PENDING' }],
    ['qc.complete', 'qc.override', { orderState: 'QC_FAILED' }],
    ['order.cancel', 'order.cancel', { orderState: 'SUBMITTED' }],
    ['delivery.update', 'delivery.resolve', { orderState: 'READY_FOR_DELIVERY' }],
    ['audit.read', 'audit.read', {}],
    ['identity.manage', 'identity.manage', {}],
    ['security.read', 'security.read', {}],
    ['organization.manage', 'organization.manage', { organizationId: order }],
  ];
  for (const [action, capability, facts] of cases) {
    const authorized = { aal: 'aal2' as const, grants: [grant(capability)] };
    assert.equal(permits(action, access('ADMIN', facts, authorized)), true, action);
    assert.equal(permits(action, access('ADMIN', facts, { ...authorized, grants: [] })), false, `${action} without grant`);
    assert.equal(permits(action, access('ADMIN', facts, { ...authorized, aal: 'aal1' })), false, `${action} without MFA`);
    if (facts.orderState) {
      assert.equal(permits(action, access('ADMIN', { ...facts, orderState: 'COMPLETED' }, authorized)),
        false, `${action} in terminal state`);
    }
  }
  for (const capability of ['order.override', 'production.override', 'quote.manage', 'proof.manage',
    'qc.override', 'delivery.resolve', 'assignment.manage', 'file.break_glass'] as const) {
    assert.equal(permits(capability, access('SUPER_ADMIN', {}, { aal: 'aal2', grants: [grant(capability)] })), false);
  }
  const productionGrant = { aal: 'aal2' as const, grants: [grant('production.override')] };
  const queued = { orderState: 'QUEUED_FOR_PRODUCTION', paymentRequired: true, proofRequired: true };
  assert.equal(permits('production.start', access('ADMIN', queued, productionGrant)), false);
  assert.equal(permits('production.start', access('ADMIN', { ...queued, paymentConfirmed: true }, productionGrant)), false);
  assert.equal(permits('production.start', access('ADMIN', { ...queued, paymentConfirmed: true,
    proofApproved: true, proofIsLatest: false }, productionGrant)), false);
  assert.equal(permits('production.start', access('ADMIN', { ...queued, paymentConfirmed: true,
    proofApproved: true, proofIsLatest: true }, productionGrant)), true);
});

test('purpose-specific file and timeline permissions do not cross assignment or delivery boundaries', () => {
  const assignedFacts = { vendorId: vendor, assignedDesignerIds: [user], deliveryPartnerUserId: user,
    organizationId: organization, organizationMembershipActive: true };
  const assignments = { vendorId: vendor, activeVendorAssignment: true, activeDesignerAssignment: true,
    assignedDeliveryPartner: true, organizationIds: [organization] };
  for (const role of phase1Roles) {
    const privilege = role === 'ADMIN' ? 'file.download' : 'file.break_glass';
    const actorFacts = { ...assignments, aal: 'aal2' as const,
      grants: [grant(privilege), grant('file.download'), grant('order.read')] };
    for (const purpose of ['source', 'design', 'production', 'proof', 'evidence', 'dispute'] as const) {
      const expected = role === 'ADMIN' || role === 'SUPER_ADMIN' ||
        role === 'CUSTOMER' && (purpose === 'source' || purpose === 'proof') ||
        role === 'VENDOR' && (purpose === 'production' || purpose === 'proof') ||
        role === 'DESIGNER' && (purpose === 'design' || purpose === 'proof') ||
        (role === 'ORGANIZATION_MEMBER' || role === 'ORGANIZATION_ADMIN') && (purpose === 'source' || purpose === 'proof');
      assert.equal(permits('file.download', access(role, { ...assignedFacts, filePurpose: purpose, fileStatus: 'SAFE' }, actorFacts)), expected,
        `${role} ${purpose}`);
    }
    assert.equal(permits('audit.read', access(role, assignedFacts,
      { ...actorFacts, grants: [...actorFacts.grants, grant('audit.read')] })), true, `${role} timeline`);
  }
  assert.equal(permits('file.download', access('ADMIN', { filePurpose: 'source', fileStatus: 'SAFE' },
    { aal: 'aal2', grants: [grant('file.download')] })), true);
  assert.equal(permits('file.download', access('ADMIN', { fileStatus: 'SAFE' },
    { aal: 'aal2', grants: [grant('file.download')] })), false);
  assert.equal(permits('order.read', access('VENDOR', { vendorId: vendor, vendorVerified: false }, assignments)), false);
  assert.equal(permits('file.download', access('VENDOR', { vendorId: vendor, vendorVerified: false,
    filePurpose: 'production', fileStatus: 'SAFE' }, assignments)), false);
  for (const role of phase1Roles) {
    assert.equal(permits('file.download', access(role, { ...assignedFacts, filePurpose: 'proof',
      fileStatus: 'SAFE', fileIsActive: false }, { ...assignments, aal: 'aal2',
      grants: [grant('file.download'), grant('file.break_glass')] })), false, `${role} inactive file`);
  }
  assert.equal(permits('file.download', access('VENDOR', { vendorId: vendor, filePurpose: 'production',
    fileStatus: 'SAFE', fileApproved: false }, assignments)), false);
});

test('organization creation and cancellation require current scope and delegated authority', () => {
  const orgFacts = { organizationId: organization, organizationMembershipActive: true, isNew: true, orderState: 'DRAFT' };
  const orgActor = { organizationIds: [organization] };
  for (const role of ['ORGANIZATION_MEMBER', 'ORGANIZATION_ADMIN'] as const) {
    assert.equal(permits('order.create', access(role, orgFacts, orgActor)), true);
    assert.equal(permits('order.create', access(role, { ...orgFacts, organizationMembershipActive: false }, orgActor)), false);
    assert.equal(permits('order.cancel', access(role, orgFacts,
      { ...orgActor, grants: [grant('order.cancel')] })), true);
    assert.equal(permits('order.cancel', access(role, { ...orgFacts, orderState: 'IN_PRODUCTION' }, orgActor)), false);
  }
  assert.equal(permits('order.cancel', access('ORGANIZATION_MEMBER', orgFacts, orgActor)), false);
  assert.equal(permits('file.upload.source', access('ORGANIZATION_ADMIN', orgFacts, orgActor)), true);
  assert.equal(permits('order.create', access('VENDOR', { isNew: true })), false);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor },
    { aal: 'aal2', grants: [grant('order.assign')] })), false);
  assert.equal(permits('order.assign', access('ADMIN', { vendorId: vendor, orderState: 'IN_PRODUCTION' },
    { aal: 'aal2', grants: [grant('order.assign')] })), false);
});

test('malformed trusted-input envelopes fail closed without coercing object or symbol IDs', () => {
  const malformedActor = { userId: Symbol('id') } as unknown as Partial<Phase1Actor>;
  assert.equal(permits('order.read', access('CUSTOMER', {}, malformedActor)), false);
  assert.equal(permits('order.read', access('CUSTOMER', { id: { toString() { throw Error('must not run'); } } } as unknown as Partial<Phase1Resource>)), false);
  for (const facts of [{ ownerUserId: 'invalid' }, { organizationId: 'invalid' }, { vendorId: 'invalid' },
    { deliveryPartnerUserId: 'invalid' }, { assignedDesignerIds: ['invalid'] }, { isNew: 'yes' },
    { fileStatus: 'TRUSTED' }, { filePurpose: 'public' }]) {
    assert.equal(permits('order.read', access('CUSTOMER', facts as Partial<Phase1Resource>)), false);
  }
  for (const invalidGrant of [grant('order.read', order, { purpose: 'a'.repeat(121) }),
    grant('order.read', order, { reason: 'a'.repeat(501) }), grant('order.read', 'invalid')]) {
    assert.equal(permits('order.read', access('ADMIN', {}, { aal: 'aal2', grants: [invalidGrant] })), false);
  }
});
