/** Local preparation only. This contract grants no identity, approval or tenant access. */
export const vendorServices = ['Paper printing', 'Design services', 'Apparel printing', 'Signage'] as const;
export const handoffChoices = ['Collection', 'Delivery', 'Collection and delivery'] as const;
export const vendorKinds = [
  { id: 'individual', label: 'Individual vendor', hint: 'You offer printing or design in your own capacity.' },
  { id: 'print_shop', label: 'Print shop', hint: 'You operate a printing business or shop.' },
  { id: 'design_studio', label: 'Design studio', hint: 'You provide design services, with or without printing.' },
] as const;
export const vendorContexts = [
  { id: 'school_based', label: 'Based at a school or campus' },
  { id: 'serves_schools', label: 'Serving schools from elsewhere' },
  { id: 'general', label: 'Serving the wider community' },
] as const;
export const vendorAvailability = [
  { id: 'enquiries', label: 'Available for enquiries' },
  { id: 'limited', label: 'Limited availability' },
  { id: 'paused', label: 'Not taking enquiries yet' },
] as const;
export type VendorStep = 1 | 2 | 3 | 4;
export type VendorApplication = {
  businessName: string; contactName: string; email: string; city: string;
  vendorKind: string; context: string; availability: string; workingHours: string;
  services: string[]; handoff: string; turnaround: string; notes: string; confirmed: boolean;
};
export const emptyVendorApplication: VendorApplication = {
  businessName: '', contactName: '', email: '', city: '', vendorKind: '', context: '', availability: '', workingHours: '',
  services: [], handoff: '', turnaround: '', notes: '', confirmed: false,
};
// Keep the device key so older saved profiles remain discoverable; envelopes are versioned.
export const vendorDraftKey = 'virtual-ink:vendor-draft:v1';
export const maxVendorProfileBytes = 8192;
export type VendorErrors = Partial<Record<keyof VendorApplication | 'form', string>>;
const keys = Object.keys(emptyVendorApplication);
const legacyKeys = keys.filter(key => !['vendorKind', 'context', 'availability', 'workingHours'].includes(key));
function text(value: unknown, max: number, required = true) {
  // eslint-disable-next-line no-control-regex -- This security filter intentionally rejects ASCII control characters.
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0) && !/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(value);
}
const choice = (value: unknown, choices: readonly { id: string }[]) => choices.some(item => item.id === value);
export function vendorErrors(value: unknown, step: VendorStep = 4): VendorErrors {
  if (!exact(value, keys)) return { form: 'Use the supported vendor setup fields.' };
  const errors: VendorErrors = {};
  if (step === 1 || step === 4) {
    if (!text(value.businessName, 100)) errors.businessName = 'Enter a business or trading name up to 100 characters, without markup.';
    if (!choice(value.vendorKind, vendorKinds)) errors.vendorKind = 'Choose how you operate.';
    if (!choice(value.context, vendorContexts)) errors.context = 'Choose the setting that best describes your service.';
    if (!text(value.contactName, 80)) errors.contactName = 'Enter a contact name up to 80 characters, without markup.';
    if (!text(value.city, 80)) errors.city = 'Enter a city or service area up to 80 characters, without markup.';
    if (!text(value.email, 254) || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(String(value.email))) errors.email = 'Enter a valid contact email.';
  }
  if (step === 2 || step === 4) {
    if (!Array.isArray(value.services) || !value.services.length || value.services.length > vendorServices.length ||
      new Set(value.services).size !== value.services.length || value.services.some(service => !vendorServices.includes(service as typeof vendorServices[number]))) errors.services = 'Choose at least one listed service.';
  }
  if (step === 3 || step === 4) {
    if (!handoffChoices.includes(value.handoff as typeof handoffChoices[number])) errors.handoff = 'Choose a collection or delivery option.';
    if (typeof value.turnaround !== 'string' || !/^[1-9]\d?$/.test(value.turnaround) || Number(value.turnaround) > 90) errors.turnaround = 'Enter a typical turnaround of 1 to 90 working days.';
    if (!choice(value.availability, vendorAvailability)) errors.availability = 'Choose your current availability.';
    if (!text(value.workingHours, 120)) errors.workingHours = 'Describe your working hours in up to 120 characters.';
    if (!text(value.notes, 500, false)) errors.notes = 'Keep notes to 500 characters, without markup or line breaks.';
  }
  if (typeof value.confirmed !== 'boolean' || (step === 4 && !value.confirmed)) errors.confirmed = 'Confirm that these details are self-declared and have not been verified.';
  return errors;
}
export function firstVendorStep(profile: VendorApplication): VendorStep {
  for (const step of [1, 2, 3] as const) if (Object.keys(vendorErrors(profile, step)).length) return step;
  return 4;
}
function boundedPacket(value: unknown): string {
  const result = JSON.stringify(value, null, 2);
  if (new TextEncoder().encode(result).byteLength > maxVendorProfileBytes) throw new Error('Keep the vendor profile within 8 KB.');
  return result;
}
export function prepareVendorPacket(value: unknown): string {
  if (Object.keys(vendorErrors(value)).length) throw new Error('Complete and review the vendor profile before downloading.');
  const data = value as VendorApplication;
  const { turnaround, confirmed: _confirmed, ...fields } = data;
  return boundedPacket({ schemaVersion: 2, status: 'prepared-not-submitted', verification: 'self-declared', profile: {
    ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : [...value]])),
    typicalWorkingDays: Number(turnaround),
  } });
}
function exact(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key));
}
/** Drafts may be incomplete, but never carry unsupported fields or access authority. */
function safeDraft(value: unknown, legacy = false): VendorApplication {
  const fail = () => { throw new Error('Use a supported vendor profile or draft file up to 8 KB.'); };
  if (!exact(value, legacy ? legacyKeys : keys)) return fail();
  const data = { ...emptyVendorApplication, ...value };
  for (const [key, max] of [['businessName', 100], ['contactName', 80], ['email', 254], ['city', 80], ['workingHours', 120], ['notes', 500]] as const) {
    if (!text(data[key], max, false)) return fail();
  }
  for (const [key, choices] of [['vendorKind', vendorKinds], ['context', vendorContexts], ['availability', vendorAvailability]] as const) {
    if (data[key] !== '' && !choice(data[key], choices)) return fail();
  }
  if (!Array.isArray(data.services) || data.services.length > vendorServices.length || new Set(data.services).size !== data.services.length ||
    data.services.some(service => !vendorServices.includes(service as typeof vendorServices[number])) ||
    (data.handoff !== '' && !handoffChoices.includes(data.handoff as typeof handoffChoices[number])) ||
    typeof data.turnaround !== 'string' || !/^\d{0,2}$/.test(data.turnaround) || typeof data.confirmed !== 'boolean') return fail();
  return { ...data, services: [...data.services], confirmed: false } as VendorApplication;
}
export function prepareVendorDraft(value: unknown): string {
  return boundedPacket({ schemaVersion: 2, status: 'draft-not-submitted', profile: safeDraft(value) });
}
export function parseVendorProfile(source: string): VendorApplication {
  if (new TextEncoder().encode(source).byteLength > maxVendorProfileBytes) throw new Error('Choose a vendor profile file up to 8 KB.');
  const value: unknown = JSON.parse(source);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a supported vendor profile or draft file.');
  const envelope = value as Record<string, unknown>, legacy = envelope.schemaVersion === 1;
  if (!legacy && envelope.schemaVersion !== 2) throw new Error('Unsupported profile version.');
  if (exact(value, ['schemaVersion', 'status', 'profile']) && value.status === 'draft-not-submitted') return safeDraft(value.profile, legacy);
  const packetKeys = (legacy ? legacyKeys : keys).filter(key => !['turnaround', 'confirmed'].includes(key)).concat('typicalWorkingDays');
  if (!exact(value, ['schemaVersion', 'status', 'verification', 'profile']) || value.status !== 'prepared-not-submitted' || value.verification !== 'self-declared' ||
    !exact(value.profile, packetKeys) || !Number.isInteger(value.profile.typicalWorkingDays)) throw new Error('Choose a supported vendor profile or draft file.');
  const { typicalWorkingDays, ...fields } = value.profile;
  const profile = safeDraft({ ...fields, turnaround: String(typicalWorkingDays), confirmed: true }, legacy);
  // Legacy packets may omit new setup fields; their original completed fields must still be valid.
  const errors = vendorErrors({ ...profile, confirmed: true });
  if (legacy) for (const key of ['vendorKind', 'context', 'availability', 'workingHours'] as const) delete errors[key];
  if (Object.keys(errors).length) throw new Error('This vendor profile contains invalid fields.');
  return profile;
}
