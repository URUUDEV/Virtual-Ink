/** Local preparation only. This contract grants no identity, approval or tenant access. */
export const vendorServices = ['Apparel printing', 'Paper printing', 'Signage', 'Design services'] as const;
export const handoffChoices = ['Collection', 'Delivery', 'Collection and delivery'] as const;
export type VendorApplication = {
  businessName: string; contactName: string; email: string; city: string;
  services: string[]; handoff: string; turnaround: string; notes: string; confirmed: boolean;
};
export const emptyVendorApplication: VendorApplication = {
  businessName: '', contactName: '', email: '', city: '', services: [], handoff: '', turnaround: '', notes: '', confirmed: false,
};
export const vendorDraftKey = 'virtual-ink:vendor-draft:v1';
export const maxVendorProfileBytes = 8192;
export type VendorErrors = Partial<Record<keyof VendorApplication | 'form', string>>;
const keys = Object.keys(emptyVendorApplication);
function text(value: unknown, max: number, required = true) {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0) && !/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(value);
}
export function vendorErrors(value: unknown, step: 1 | 2 | 3 = 3): VendorErrors {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { form: 'Enter the vendor profile details.' };
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== keys.length || keys.some(key => !Object.hasOwn(data, key))) return { form: 'Use the supported profile fields.' };
  const errors: VendorErrors = {};
  if (step !== 2) {
    if (!text(data.businessName, 100)) errors.businessName = 'Enter a business name up to 100 characters, without markup.';
    if (!text(data.contactName, 80)) errors.contactName = 'Enter a contact name up to 80 characters, without markup.';
    if (!text(data.city, 80)) errors.city = 'Enter a city or service area up to 80 characters, without markup.';
    if (!text(data.email, 254) || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(String(data.email))) errors.email = 'Enter a valid contact email.';
  }
  if (step !== 1) {
    if (!Array.isArray(data.services) || !data.services.length || data.services.length > vendorServices.length ||
      new Set(data.services).size !== data.services.length || data.services.some(service => !vendorServices.includes(service as typeof vendorServices[number]))) errors.services = 'Choose at least one listed service.';
    if (!handoffChoices.includes(data.handoff as typeof handoffChoices[number])) errors.handoff = 'Choose a collection or delivery option.';
    if (typeof data.turnaround !== 'string' || !/^[1-9]\d?$/.test(data.turnaround) || Number(data.turnaround) > 90) errors.turnaround = 'Enter a typical turnaround of 1 to 90 working days.';
    if (!text(data.notes, 500, false)) errors.notes = 'Keep notes to 500 characters, without markup or line breaks.';
    if (typeof data.confirmed !== 'boolean' || (step === 3 && !data.confirmed)) errors.confirmed = 'Confirm that these details are self-declared and have not been verified.';
  }
  return errors;
}
export function prepareVendorPacket(value: unknown): string {
  if (Object.keys(vendorErrors(value)).length) throw new Error('Complete and review the vendor profile before downloading.');
  const data = value as VendorApplication;
  return JSON.stringify({ schemaVersion: 1, status: 'prepared-not-submitted', verification: 'self-declared', profile: {
    businessName: data.businessName.trim(), contactName: data.contactName.trim(), email: data.email.trim(), city: data.city.trim(),
    services: [...data.services], handoff: data.handoff, typicalWorkingDays: Number(data.turnaround), notes: data.notes.trim(),
  } }, null, 2);
}

function exact(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key));
}
/** Drafts may be incomplete, but never carry unsupported fields or access authority. */
function safeDraft(value: unknown): VendorApplication {
  const fail = () => { throw new Error('Use a supported vendor profile or draft file up to 8 KB.'); };
  if (!exact(value, keys)) return fail();
  for (const [key, max] of [['businessName', 100], ['contactName', 80], ['email', 254], ['city', 80], ['notes', 500]] as const) {
    if (!text(value[key], max, false)) return fail();
  }
  if (!Array.isArray(value.services) || value.services.length > vendorServices.length || new Set(value.services).size !== value.services.length ||
    value.services.some(service => !vendorServices.includes(service as typeof vendorServices[number])) ||
    (value.handoff !== '' && !handoffChoices.includes(value.handoff as typeof handoffChoices[number])) ||
    typeof value.turnaround !== 'string' || !/^\d{0,2}$/.test(value.turnaround) || typeof value.confirmed !== 'boolean') return fail();
  return { ...value, services: [...value.services], confirmed: false } as VendorApplication;
}
export function prepareVendorDraft(value: unknown): string {
  return JSON.stringify({ schemaVersion: 1, status: 'draft-not-submitted', profile: safeDraft(value) }, null, 2);
}
export function parseVendorProfile(source: string): VendorApplication {
  if (source.length > maxVendorProfileBytes) throw new Error('Choose a vendor profile file up to 8 KB.');
  const value: unknown = JSON.parse(source);
  if (exact(value, ['schemaVersion', 'status', 'profile']) && value.schemaVersion === 1 && value.status === 'draft-not-submitted') return safeDraft(value.profile);
  if (!exact(value, ['schemaVersion', 'status', 'verification', 'profile']) || value.schemaVersion !== 1 || value.status !== 'prepared-not-submitted' || value.verification !== 'self-declared' ||
    !exact(value.profile, ['businessName', 'contactName', 'email', 'city', 'services', 'handoff', 'typicalWorkingDays', 'notes']) ||
    !Number.isInteger(value.profile.typicalWorkingDays)) throw new Error('Choose a supported vendor profile or draft file.');
  const { typicalWorkingDays, ...fields } = value.profile;
  const profile = { ...fields, turnaround: String(typicalWorkingDays), confirmed: true };
  if (Object.keys(vendorErrors(profile)).length) throw new Error('This vendor profile contains invalid fields.');
  return safeDraft(profile);
}
