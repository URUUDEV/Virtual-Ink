import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { orderDashboardSession } from '@/lib/order-dashboard';
import './order-dashboard.css';
import './vendor-setup.css';

type SetupData = { vendors: { id: string; name: string }[]; vendorId: string | null; accepted: boolean;
  prices: { active: boolean; service: string }[]; policy: null | { version: number } };
export async function VendorSetup({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let data: SetupData | null = null;
  try {
    const session = await orderDashboardSession();
    // Reuse the audited owner-only read. Query parameters and local profiles grant no authority.
    data = await session.commerce.run('read', { operationId: randomUUID(), ...params.vendorId ? { vendorId: params.vendorId } : {} }, session.identity, randomUUID()) as unknown as SetupData;
  } catch { /* Render a safe, useful entry point without private account details. */ }
  const selected = data?.vendors.find(vendor => vendor.id === data?.vendorId);
  const agreement = !!selected && !!data?.policy && data.accepted;
  const activePrices = agreement ? data!.prices.filter(price => price.active).length : 0;
  const pricingUrl = `/vendor/pricing${selected ? `?${new URLSearchParams({ vendorId: selected.id })}` : ''}`;
  return <section className="section container order-dashboard vendor-setup-page">
    <p className="eyebrow">YOUR VENDOR WORKSPACE</p><h1 className="page-title">A clear path to your first job.</h1>
    <p className="page-description">Prepare your business, secure your account and agree how you will trade. Start with the next step that applies to you.</p>
    {data === null ? <p className="ui-notice" role="status">Your vendor account status could not be loaded. Sign in with your approved owner account, or prepare a profile below. No setup completion has been confirmed.</p>
      : !selected ? <p className="ui-notice" role="status">No approved owner account is selected. A prepared profile still needs identity and capability review before vendor access is granted.</p>
      : <><nav aria-label="Your vendor accounts"><ul>{data.vendors.map(vendor => <li key={vendor.id}><Link href={`/vendor/setup?${new URLSearchParams({ vendorId: vendor.id })}`} aria-current={selected.id === vendor.id ? 'page' : undefined}>{vendor.name}</Link></li>)}</ul></nav>
        <p className="ui-notice">Setup for <strong>{selected.name}</strong>. Commercial details below come from your current account. They do not confirm operational approval to take live orders.</p></>}
    <ol className="vendor-setup-checklist">
      <li className="ui-panel"><span className="vendor-setup-state">{selected ? 'Owner access confirmed' : 'Start here'}</span><h2>1. Prepare your business</h2>
        <p>Describe your business type, school-serving context, services, working hours and handoff. Individual vendors can use a trading name.</p>
        <Link href="/vendors/join" className="button button-plain">Prepare or resume your profile</Link><p className="vendor-hint">Profile preparation stays local. Operations verifies identity and capabilities before granting access.</p></li>
      <li className="ui-panel"><span className="vendor-setup-state">Verification required for protected changes</span><h2>2. Secure your account</h2>
        <p>Use your own verified account and set up your authenticator. Agreement acceptance and price changes require recent verification.</p>
        <Link href="/account/security" className="button button-plain">Open account security</Link></li>
      <li className="ui-panel"><span className="vendor-setup-state">{agreement ? `Agreement version ${data!.policy!.version} accepted` : 'Agreement review pending'}</span><h2>3. Review your agreement</h2>
        <p>Read the actual approved terms, commission rate and reconciliation responsibilities for your vendor account. Customers pay you directly.</p>
        <Link href={pricingUrl} className="button button-plain">{agreement ? 'View your agreement' : 'Review agreement and commission'}</Link><p className="vendor-hint">Preparing a profile does not accept a contract. An unavailable agreement cannot be accepted.</p></li>
      <li className="ui-panel"><span className="vendor-setup-state">{activePrices ? `${activePrices} active service ${activePrices === 1 ? 'price' : 'prices'}` : 'Service prices pending'}</span><h2>4. Set your service prices</h2>
        <p>Add your printing or design services, price per page, copy, item, job or hour, and the full customer price in ZMW.</p>
        <Link href={pricingUrl} className="button button-plain">Manage service prices</Link><p className="vendor-hint">Accept the current agreement before changing prices. Retired prices do not count as active services.</p></li>
      <li className="ui-panel"><span className="vendor-setup-state">Operations review required</span><h2>5. Review your first-job readiness</h2>
        <p>Confirm capabilities, payment receipt checks, commission reconciliation, private file handling, turnaround and collection or delivery with operations.</p>
        <p>A complete profile or rate card does not publish a listing or activate live orders. Only verified assigned work appears in your queue.</p><Link href="/vendor" className="button button-plain">Open assigned orders</Link></li>
    </ol>
    <Link href="/login" className="text-link">Sign in to your account</Link>
  </section>;
}
