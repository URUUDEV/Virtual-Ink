/** Framework/provider-independent vendor onboarding contract. */
export const vendorServiceOptions = [
  { id: 'apparel', label: 'Apparel & merchandise' }, { id: 'paper', label: 'Print & documents' },
  { id: 'signage', label: 'Signs & banners' }, { id: 'design', label: 'Design services' },
] as const;
export const applicationStatuses = ['draft', 'submitted', 'changes_requested', 'approved', 'rejected'] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
export type VendorProfileInput = {
  businessName: string; contactName: string; email: string; phone: string; country: string; city: string;
  slug: string; summary: string; registrationNumber: string; notes: string;
  services: string[]; handoff: '' | 'collection' | 'delivery' | 'both'; typicalWorkingDays: number | null;
};
export const blankVendorProfile: VendorProfileInput = { businessName: '', contactName: '', email: '', phone: '', country: '', city: '', slug: '', summary: '', registrationNumber: '', notes: '', services: [], handoff: '', typicalWorkingDays: null };
export type ApplicationSummary = { id: string; status: ApplicationStatus; version: number; businessName: string; slug: string; updatedAt: string; submittedAt: string | null; tenantId: string | null };
export type OnboardingEvent = { action: string; occurredAt: string; version: number; fromStatus: string | null; toStatus: string | null };
export type ApplicationDetail = ApplicationSummary & { profile: VendorProfileInput; feedback: string; events: OnboardingEvent[]; consent: boolean };
export type VendorStorefront = { tenantId: string; businessName: string; slug: string; summary: string; country: string; city: string; services: string[]; handoff: string; typicalWorkingDays: number; availability: 'accepting_enquiries' | 'paused'; approvedAt: string };
export type OnboardingSession = { accountId: string; reviewAccess: 'none' | 'mfa_required' | 'ready'; vendors: VendorStorefront[] };
export type MutationReceipt = { applicationId?: string; tenantId?: string; status?: ApplicationStatus; version?: number; historicalReplay: boolean; availability?: string };
export type OnboardingPage = { items: ApplicationSummary[]; nextCursor: string | null };
