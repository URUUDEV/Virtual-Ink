import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyVendorApplication, firstVendorStep, parseVendorProfile, prepareVendorDraft, prepareVendorPacket, vendorErrors } from '../apps/web/src/lib/vendor-application.ts';
const valid = () => ({ ...emptyVendorApplication, businessName: 'Synthetic Print Studio', contactName: 'Test Partner', email: 'partner@example.invalid', city: 'Demo area', vendorKind: 'individual', context: 'serves_schools', availability: 'limited', workingHours: 'Monday to Friday, 08:00–17:00 CAT', services: ['Apparel printing', 'Design services'], handoff: 'Collection', turnaround: '5', confirmed: true });
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
  const firstStep = { ...emptyVendorApplication, businessName: 'Synthetic', contactName: 'Test', email: 'test@example.invalid', city: 'Demo', vendorKind: 'individual', context: 'general' };
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
  for (const data of [null, [], { ...draft, role: 'VendorOwner' }, { ...draft, schemaVersion: 99 }, { ...draft, status: 'approved' },
    { ...draft, profile: { ...draft.profile, tenantId: 'synthetic' } }, { ...draft, profile: { ...draft.profile, services: ['PlatformOperator'] } },
    { ...draft, profile: { ...draft.profile, businessName: '<script>synthetic</script>' } }, { ...draft, profile: { ...draft.profile, notes: 'x'.repeat(501) } },
    { ...packet, verification: 'verified' }, { ...packet, profile: { ...packet.profile, typicalWorkingDays: '5' } },
    { ...packet, profile: { ...packet.profile, typicalWorkingDays: 91 } }, { ...packet, profile: { ...packet.profile, approved: true } }]) assert.throws(() => parseVendorProfile(JSON.stringify(data)));
  assert.throws(() => parseVendorProfile('{')); assert.throws(() => parseVendorProfile(' '.repeat(8193)));
  assert.throws(() => parseVendorProfile(JSON.stringify(draft).replace('"schemaVersion":2', '"schemaVersion":2,"__proto__":{"polluted":true}')));
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
});

test('vendor setup validates declared context, availability and operations without manufacturing approval', () => {
  for (const change of [{ vendorKind: 'verified_shop' }, { context: 'school_endorsed' }, { availability: 'live' }, { workingHours: '' }, { workingHours: 'x'.repeat(121) }, { workingHours: 'a\nline' }, { vendorKind: null }]) {
    assert.throws(() => prepareVendorPacket({ ...valid(), ...change }));
    if (change.workingHours !== '') assert.throws(() => prepareVendorDraft({ ...valid(), ...change }));
  }
  for (const vendorKind of ['individual', 'print_shop', 'design_studio']) {
    const packet = JSON.parse(prepareVendorPacket({ ...valid(), vendorKind }));
    assert.equal(packet.schemaVersion, 2); assert.equal(packet.profile.vendorKind, vendorKind);
    assert.equal(packet.profile.context, 'serves_schools'); assert.equal(packet.profile.availability, 'limited');
    assert.equal(packet.profile.workingHours, valid().workingHours);
    assert.equal(packet.status, 'prepared-not-submitted'); assert.equal(packet.verification, 'self-declared');
    assert.equal('accepted' in packet.profile, false);
  }
  assert.equal(firstVendorStep(emptyVendorApplication), 1);
  assert.equal(firstVendorStep({ ...valid(), services: [] }), 2);
  assert.equal(firstVendorStep({ ...valid(), workingHours: '' }), 3);
  assert.equal(firstVendorStep({ ...valid(), confirmed: false }), 4);
});

test('legacy vendor drafts and completed profiles preserve details and require missing setup fields', () => {
  const { vendorKind: _kind, context: _context, availability: _availability, workingHours: _hours, ...legacy } = valid();
  const draft = { schemaVersion: 1, status: 'draft-not-submitted', profile: legacy };
  const restored = parseVendorProfile(JSON.stringify(draft));
  assert.equal(restored.businessName, legacy.businessName); assert.equal(restored.vendorKind, '');
  assert.equal(restored.confirmed, false); assert.equal(firstVendorStep(restored), 1);
  const { turnaround, confirmed: _confirmed, ...fields } = legacy;
  const packet = { schemaVersion: 1, status: 'prepared-not-submitted', verification: 'self-declared', profile: { ...fields, typicalWorkingDays: Number(turnaround) } };
  assert.deepEqual(parseVendorProfile(JSON.stringify(packet)), restored);
  assert.throws(() => prepareVendorPacket(restored));
  assert.throws(() => parseVendorProfile(JSON.stringify({ ...packet, profile: { ...packet.profile, vendorKind: 'print_shop' } })));
  assert.throws(() => parseVendorProfile(JSON.stringify({ ...packet, profile: { ...packet.profile, typicalWorkingDays: 91 } })));
  const multibyte = JSON.stringify({ schemaVersion: 2, padding: '🙂'.repeat(2050) });
  assert(multibyte.length < 8192); assert.throws(() => parseVendorProfile(multibyte));
});
