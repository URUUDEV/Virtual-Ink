import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { orderDashboardSession } from '@/lib/order-dashboard';
import { vendorCommerceAction } from '@/lib/vendor-commerce-actions';
import './order-dashboard.css';

type Price = { id: string; version: number; service: string; label: string; unit: string; amountMinor: number; currency: string; active: boolean };
type Data = { vendors: { id: string; name: string }[]; vendorId: string | null; prices: Price[]; accepted: boolean; accruedCommissionMinor: number;
  policy: null | { id: string; version: number; basisPoints: number; terms: string; termsSha256: string; collection: string; settlement: string } };
const money = (amount: number) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount / 100);
const messages: Record<string, string> = { saved: 'Your change was recorded.', CONFLICT: 'The price or agreement changed. Review the latest details before trying again.', FORBIDDEN: 'Your current access does not permit this change.', UNAUTHENTICATED: 'Sign in and complete recent authenticator verification before making changes.', VALIDATION_FAILED: 'Check the form fields and try again.', NOT_FOUND: 'This vendor or price is not available with your current access.', unavailable: 'No change was confirmed. Pricing services are temporarily unavailable.' };
function Context({ vendorId, action, priceId, version }: { vendorId: string; action: string; priceId?: string; version?: number }) {
  return <><input type="hidden" name="vendorId" value={vendorId}/><input type="hidden" name="operationId" value={randomUUID()}/><input type="hidden" name="action" value={action}/>{priceId && <input type="hidden" name="priceId" value={priceId}/>} {version !== undefined && <input type="hidden" name="expectedVersion" value={version}/>}</>;
}
function PriceForm({ vendorId, price }: { vendorId: string; price?: Price }) {
  const key = price?.id ?? 'new-price';
  return <form action={vendorCommerceAction}><Context vendorId={vendorId} action="price.save" priceId={price?.id ?? randomUUID()} version={price?.version ?? 0}/><input type="hidden" name="currency" value="ZMW"/>
    <label htmlFor={`${key}-label`}>Service description (required)</label><input id={`${key}-label`} name="label" defaultValue={price?.label} required maxLength={120}/>
    <fieldset><legend>Service (required)</legend>{['printing', 'design'].map(service => <label className="dashboard-choice" key={service}><input type="radio" name="service" value={service} required defaultChecked={price?.service === service}/>{service === 'printing' ? 'Printing' : 'Design'}</label>)}</fieldset>
    <fieldset><legend>Price per (required)</legend>{['page', 'copy', 'item', 'job', 'hour'].map(unit => <label className="dashboard-choice" key={unit}><input type="radio" name="unit" value={unit} required defaultChecked={price?.unit === unit}/>{unit}</label>)}</fieldset>
    <label htmlFor={`${key}-amount`}>Price in ZMW (required)</label><input id={`${key}-amount`} name="amount" type="text" inputMode="decimal" pattern="(0|[1-9][0-9]{0,7})(\.[0-9]{1,2})?" defaultValue={price ? (price.amountMinor / 100).toFixed(2) : undefined} required maxLength={11} aria-describedby={`${key}-help`}/><p id={`${key}-help`}>Enter the full customer price with up to two decimal places. Your agreed commission comes from this price; no extra customer fee is added.</p>
    <button type="submit" className="button button-primary">{price ? 'Save a new price version' : 'Add service price'}</button></form>;
}
export async function VendorPricing({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let data: Data;
  try {
    const session = await orderDashboardSession();
    data = await session.commerce.run('read', { operationId: randomUUID(), ...params.vendorId ? { vendorId: params.vendorId } : {} }, session.identity, randomUUID()) as unknown as Data;
  } catch {
    return <section className="section container order-dashboard"><h1>Service prices and commission</h1><p className="ui-notice" role="status">Vendor pricing is unavailable with your current access or configuration. No service prices or agreement could be loaded.</p><Link className="button button-plain" href="/account/security">Account security</Link><Link className="button button-plain" href="/vendor">Assigned orders</Link></section>;
  }
  const vendorId = data.vendorId;
  return <section className="section container order-dashboard"><h1>Service prices and commission</h1><p>Customers pay you directly. Manage your own prices and review the agreement that applies to your work.</p><Link href="/vendor" className="text-link">Assigned orders</Link>
    {typeof params.message === 'string' && messages[params.message] && <p className="ui-notice" role={params.message === 'saved' ? 'status' : 'alert'}>{messages[params.message]}</p>}
    <nav aria-label="Your vendor accounts"><ul>{data.vendors.map(vendor => <li key={vendor.id}><Link href={`/vendor/pricing?${new URLSearchParams({ vendorId: vendor.id })}`} aria-current={vendorId === vendor.id ? 'page' : undefined}>{vendor.name}</Link></li>)}</ul></nav>
    {!data.vendors.length && <p className="ui-notice">No verified vendor account is available.</p>}
    {vendorId && <>
      <article className="ui-panel dashboard-detail"><h2>Commission agreement</h2>{data.policy ? <>
        <p>{data.policy.basisPoints / 100}% of completed service work, included in your customer price. Customers pay you directly; commission is reconciled weekly.</p><p>Agreement version {data.policy.version}. {data.accepted ? 'Accepted for this vendor account.' : 'Review and accept before changing prices or proposing new quotes.'}</p>
        <div className="vendor-terms">{data.policy.terms}</div>
        {!data.accepted && <form action={vendorCommerceAction}><Context vendorId={vendorId} action="agreement.accept"/><input type="hidden" name="policyId" value={data.policy.id}/><input type="hidden" name="termsSha256" value={data.policy.termsSha256}/><label className="dashboard-choice"><input type="checkbox" name="consent" required/>I have read and accept this agreement and commission schedule for this vendor account.</label><p>Recent authenticator verification is required for acceptance and price changes.</p><button type="submit" className="button button-primary">Accept this agreement</button></form>}
      </> : <p>No approved commission agreement is configured. Price changes and new commercial quotes are unavailable.</p>}</article>
      <article className="ui-panel dashboard-detail"><h2>Accrued commission</h2><p>{money(data.accruedCommissionMinor)} recorded from completed orders. This is accrued commission; payment of commission has not been recorded here.</p></article>
      <div className="dashboard-detail"><h2>Your service prices</h2>{data.prices.length === 0 && <p>No service prices have been recorded.</p>}{data.prices.map(price => <article key={price.id} className="ui-panel dashboard-detail"><h3>{price.label}</h3><p>{money(price.amountMinor)} per {price.unit} · version {price.version} · {price.active ? 'Active' : 'Retired'}</p>{data.accepted && <details><summary>Edit service price</summary><PriceForm vendorId={vendorId} price={price}/></details>}{data.accepted && price.active && <form action={vendorCommerceAction}><Context vendorId={vendorId} action="price.retire" priceId={price.id} version={price.version}/><button type="submit" className="button button-plain">Retire this price</button><p>Previously accepted quotes retain their agreed prices.</p></form>}</article>)}</div>
      {data.accepted && <details className="ui-panel dashboard-detail"><summary>Add a service price</summary><PriceForm vendorId={vendorId}/></details>}
    </>}
  </section>;
}
