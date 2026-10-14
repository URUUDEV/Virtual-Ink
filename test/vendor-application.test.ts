import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyVendorApplication, parseVendorProfile, prepareVendorDraft, prepareVendorPacket, vendorErrors } from '../apps/web/src/lib/vendor-application.ts';
const valid = () => ({ ...emptyVendorApplication, businessName: 'Synthetic Print Studio', contactName: 'Test Partner', email: 'partner@example.invalid', city: 'Demo area', services: ['Apparel printing', 'Design services'], handoff: 'Collection', turnaround: '5', confirmed: true });
test('vendor packet is explicitly unsubmitted and contains no provisioning authority', () => {
  const data = valid(); data.businessName = '  Synthetic Print Studio  ';
  const packet = JSON.parse(prepareVendorPacket(data));
  assert.equal(packet.status, 'prepared-not-submitted'); assert.equal(packet.verification, 'self-declared');
  assert.equal(packet.profile.businessName, 'Synthetic Print Studio'); assert.equal(packet.profile.typicalWorkingDays, 5);
  assert.equal(packet.profile.email, 'partner@example.invalid');
  assert.deepEqual(Object.keys(packet), ['schemaVersion', 'status', 'verification', 'profile']);
});
test('vendor profile rejects unsupported authority fields and malformed containers', () => {
  for (const value of [null, [], 'profile', { ...valid(), role: 'VendorOwner' }, { ...valid(), tenantId: 'synthetic' }, { ...valid(), approved: true }, { ...valid(), password: 'synthetic' }]) {
    assert.ok(Object.keys(vendorErrors(value)).length); assert.throws(() => prepareVendorPacket(value));
  }
});
test('vendor profile rejects markup, control characters, oversized text and non-string inputs', () => {
  for (const [key, values] of Object.entries({ businessName: ['', '<script>synthetic</script>', 'x'.repeat(101), 'a\u202eb', {}], contactName: ['x'.repeat(81), '\u0000name'], email: ['not-an-email', 'a@b', 'x'.repeat(255)], city: ['x'.repeat(81)], notes: ['x'.repeat(501), '<img src=x>', 'line\nbreak'] })) {
    for (const value of values) { const data = { ...valid(), [key]: value }; assert.ok(Object.keys(vendorErrors(data)).length); assert.throws(() => prepareVendorPacket(data)); }
  }
});
test('vendor capabilities stay bounded, self-declared and require review confirmation', () => {
  for (const change of [{ services: [] }, { services: ['Apparel printing', 'Apparel printing'] }, { services: ['PlatformOperator'] }, { services: 'Design services' }, { handoff: 'all zones' }, { turnaround: '0' }, { turnaround: '91' }, { turnaround: '1e2' }, { turnaround: 5 }, { confirmed: false }, { confirmed: 'true' }]) {
    const data = { ...valid(), ...change }; assert.ok(Object.keys(vendorErrors(data)).length); assert.throws(() => prepareVendorPacket(data));
  }
  const firstStep = { ...emptyVendorApplication, businessName: 'Synthetic', contactName: 'Test', email: 'test@example.invalid', city: 'Demo' };
  assert.deepEqual(vendorErrors(firstStep, 1), {});
  assert.deepEqual(vendorErrors({ ...valid(), confirmed: false }, 2), {});
  assert.ok(vendorErrors(firstStep).services);
});

test('incomplete vendor drafts and existing completed packets reopen without trusting confirmation', () => {
  const incomplete = { ...emptyVendorApplication, businessName: 'Synthetic draft', email: 'unfinished', turnaround: '91' };
  assert.deepEqual(parseVendorProfile(prepareVendorDraft(incomplete)), incomplete);
  const restored = parseVendorProfile(prepareVendorPacket(valid()));
  assert.deepEqual(restored, { ...valid(), confirmed: false });
  assert.throws(() => prepareVendorPacket(restored));
  assert.equal(parseVendorProfile(prepareVendorDraft(valid())).confirmed, false);
});
test('vendor recovery rejects oversized, malformed and forged draft/profile envelopes', () => {
  const draft = JSON.parse(prepareVendorDraft(valid()));
  const packet = JSON.parse(prepareVendorPacket(valid()));
  for (const data of [null, [], { ...draft, role: 'VendorOwner' }, { ...draft, schemaVersion: 2 }, { ...draft, status: 'approved' },
    { ...draft, profile: { ...draft.profile, tenantId: 'synthetic' } }, { ...draft, profile: { ...draft.profile, services: ['PlatformOperator'] } },
    { ...draft, profile: { ...draft.profile, businessName: '<script>synthetic</script>' } }, { ...draft, profile: { ...draft.profile, notes: 'x'.repeat(501) } },
    { ...packet, verification: 'verified' }, { ...packet, profile: { ...packet.profile, typicalWorkingDays: '5' } },
    { ...packet, profile: { ...packet.profile, typicalWorkingDays: 91 } }, { ...packet, profile: { ...packet.profile, approved: true } }]) assert.throws(() => parseVendorProfile(JSON.stringify(data)));
  assert.throws(() => parseVendorProfile('{')); assert.throws(() => parseVendorProfile(' '.repeat(8193)));
  assert.throws(() => parseVendorProfile(JSON.stringify(draft).replace('"schemaVersion":1', '"schemaVersion":1,"__proto__":{"polluted":true}')));
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
});
