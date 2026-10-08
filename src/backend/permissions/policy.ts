export const globalRoles = ['Customer', 'PlatformOperator', 'DeliveryPartner'] as const;
export const vendorRoles = ['VendorOwner', 'VendorStaff'] as const;
export type GlobalRole = typeof globalRoles[number];
export type VendorRole = typeof vendorRoles[number];
export type Capability = 'tenant.read' | 'file.read' | 'proof.read' | 'membership.manage' | 'pricing.change';
export type AccessFacts = Readonly<{
  activeUser: boolean; activeTenant: boolean; roles: readonly GlobalRole[];
  membership: VendorRole | null; operatorTenantReview: boolean;
}>;

// Only the first narrow read is implemented. File/proof/staff/pricing capabilities
// stay denied until resource assignments and approved business rules exist.
export function permits(capability: Capability, facts: AccessFacts): boolean {
  if (!facts.activeUser || !facts.activeTenant || facts.roles.includes('DeliveryPartner')) return false;
  if (capability !== 'tenant.read') return false;
  if (facts.membership === 'VendorOwner' || facts.membership === 'VendorStaff') return true;
  return facts.roles.includes('PlatformOperator') && facts.operatorTenantReview;
}
