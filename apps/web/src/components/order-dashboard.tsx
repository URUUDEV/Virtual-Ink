import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import type { ReactNode } from 'react';
import { ApiError } from '@backend/api/errors.ts';
import { dashboardInput, type DashboardView } from '@backend/orders/dashboard.ts';
import { orderDashboardSession } from '@/lib/order-dashboard';
import { orderDashboardAction } from '@/lib/order-dashboard-actions';
import './order-dashboard.css';

type Order={id:string;state:string;version:number;productCode:string;quantity:number;createdAt:string;updatedAt:string};
type Detail={id:string;state:string;version:number;spec:{productCode:string;quantity:number;widthMm:number;heightMm:number};proofId:string|null;approvedProofId:string|null;
 quote:{amountMinor:number;currency:string;validUntil:string}|null;timeline:{id:string;action:string;state:string;occurredAt:string}[]};
type Dashboard={summary:{total:number;active:number;pendingProof:number;inProduction:number};orders:Order[];detail:Detail|null;nextCursor:string|null};
const states=['DRAFT','SUBMITTED','QUOTE_PENDING','QUOTED','CUSTOMER_REVIEW','AWAITING_PAYMENT','PAYMENT_CONFIRMED','VENDOR_ASSIGNED','VENDOR_ACCEPTED','PROOF_REQUIRED','PROOF_UPLOADED','CHANGES_REQUESTED','PROOF_APPROVED','QUEUED_FOR_PRODUCTION','IN_PRODUCTION','QC_PENDING','QC_FAILED','QC_PASSED','READY_FOR_PICKUP','READY_FOR_DELIVERY','COMPLETED','CANCELLED','DISPUTED'];
const label=(value:string)=>value.toLowerCase().replaceAll('_',' ');
const messages:Record<string,string>={saved:'Your change was recorded.',CONFLICT:'This order changed or its requirements are not met. Review the latest details before trying again.',FORBIDDEN:'Your current access does not permit this action.',UNAUTHENTICATED:'Sign in again and complete the required security verification.',VALIDATION_FAILED:'Check the form fields and try again.',unavailable:'Orders are temporarily unavailable. No change was confirmed.'};
function Action({view,order,action,text,reason,children}:{view:DashboardView;order:Detail;action:string;text:string;reason?:string;children?:ReactNode}) {
 return <form action={orderDashboardAction}><input type="hidden" name="view" value={view}/><input type="hidden" name="action" value={action}/>
  <input type="hidden" name="orderId" value={order.id}/><input type="hidden" name="operationId" value={randomUUID()}/><input type="hidden" name="expectedVersion" value={order.version}/>
  {reason&&<input type="hidden" name="reasonCode" value={reason}/>}<fieldset><legend>{text}</legend>{children}<button className="button button-plain" type="submit">{text}</button></fieldset></form>;
}
export async function OrderDashboard({view,searchParams}:{view:DashboardView;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;
 let data:Dashboard;
 try {
  const input=dashboardInput({view,...params.orderId?{orderId:params.orderId}:{},...params.cursor?{cursor:params.cursor}:{},...params.state?{state:params.state}:{}});
  const session=await orderDashboardSession();
  data=await session.dashboard.read(input,session.identity,randomUUID()) as unknown as Dashboard;
 }catch(error){
  const denied=error instanceof ApiError&&['FORBIDDEN','UNAUTHENTICATED','NOT_FOUND'].includes(error.code);
  return <section className="section container order-dashboard"><h1>{view==='admin'?'Administrator':view==='vendor'?'Vendor':'Customer'} orders</h1>
   <div className="ui-notice" role="status"><p>{denied?'These orders are not available with your current access. Administrator oversight requires recent authenticator verification.':'Order services are currently unavailable. Your order history and totals could not be loaded.'}</p></div>
   <Link href="/account" className="button button-plain">Back to your account</Link>{view==='customer'&&<Link href="/print-documents" className="button button-plain">Prepare document printing</Link>}{view==='admin'&&<Link href="/admin/security" className="button button-plain">Verify account security</Link>}</section>;
 }
 const detail=data.detail;
 const actions:[string,string,string?][]=[];
 if(detail&&view==='customer'){
  if(['DRAFT','SUBMITTED','QUOTE_PENDING','QUOTED','CUSTOMER_REVIEW','AWAITING_PAYMENT'].includes(detail.state))actions.push(['order.cancel','Cancel this order']);
  if(['QUOTED','CUSTOMER_REVIEW'].includes(detail.state))actions.push(['quote.accept','Accept this quote'],['quote.reject','Request another quote']);
  if(detail.state==='READY_FOR_PICKUP')actions.push(['order.complete','Confirm collected']);
 }
 if(detail&&view==='vendor'){
  const next:Record<string,[string,string]>={VENDOR_ASSIGNED:['job.accept','Accept assigned job'],VENDOR_ACCEPTED:['proof.request','Start proof preparation'],PROOF_APPROVED:['production.queue','Queue approved work'],QUEUED_FOR_PRODUCTION:['production.start','Start production'],IN_PRODUCTION:['production.finish','Submit production for QC'],QC_FAILED:['production.correct','Start QC correction']};
  if(next[detail.state])actions.push(next[detail.state]);
 }
 return <section className="section container order-dashboard"><div className="dashboard-heading"><div><p className="eyebrow">Your Virtual Ink workspace</p><h1>{view==='admin'?'Platform order oversight':view==='vendor'?'Assigned order queue':'Your orders'}</h1></div><Link href="/account" className="text-link">Account and security</Link></div>
  {view==='customer'&&<div className="ui-notice"><p>Printing assignments, notes or reports? Choose document-specific options before preparing a request.</p><Link href="/print-documents" className="button button-plain">Prepare document printing</Link></div>}
  {typeof params.message==='string'&&messages[params.message]&&<p className="ui-notice" role={params.message==='saved'?'status':'alert'}>{messages[params.message]}</p>}
  <dl className="dashboard-counts">{([['Total orders',data.summary.total],['Active orders',data.summary.active],['Awaiting proof review',data.summary.pendingProof],['Production and QC',data.summary.inProduction]] as const).map(([title,count])=><div className="ui-panel" key={title}><dt>{title}</dt><dd>{count}</dd></div>)}</dl>
  <form method="GET" action={`/${view}`} className="dashboard-filter"><label htmlFor="order-state">Filter by order status</label><select id="order-state" name="state" defaultValue={typeof params.state==='string'?params.state:''}><option value="">All statuses</option>{states.map(state=><option key={state} value={state}>{label(state)}</option>)}</select><button type="submit" className="button button-plain">Apply filter</button><Link href={`/${view}`} className="text-link">Reset filters</Link></form>
  <div className="dashboard-orders"><h2>{view==='vendor'?'Queue — newest first':'Recent orders'}</h2>{data.orders.length===0?<p className="ui-notice">No orders match this view.</p>:<ul>{data.orders.map(order=><li key={order.id} className="ui-panel"><Link href={`/${view}?${new URLSearchParams({orderId:order.id})}`}><strong>{order.productCode} · {order.quantity} units</strong><span className="ui-status">{label(order.state)}</span><span>Updated {new Date(order.updatedAt).toLocaleString('en-GB',{timeZone:'Africa/Lusaka'})} CAT</span><span>Order {order.id}</span></Link></li>)}</ul>}
  {data.nextCursor&&<Link className="button button-plain" href={`/${view}?${new URLSearchParams({cursor:data.nextCursor,...typeof params.state==='string'&&params.state?{state:params.state}:{}})}`}>Next page</Link>}</div>
  {detail&&<article className="ui-panel dashboard-detail"><h2>Order details</h2><p>Order {detail.id} · version {detail.version}</p><p className="ui-status">{label(detail.state)}</p><p>{detail.spec.productCode} · {detail.spec.quantity} units · {detail.spec.widthMm} × {detail.spec.heightMm} mm</p>
   {detail.quote&&<p>Vendor quote: {new Intl.NumberFormat('en-ZM',{style:'currency',currency:detail.quote.currency}).format(detail.quote.amountMinor/100)} · valid until {new Date(detail.quote.validUntil).toLocaleString('en-GB',{timeZone:'Africa/Lusaka'})} CAT</p>}
   {detail.proofId&&<p>{detail.approvedProofId===detail.proofId?'The latest proof is approved.':'The latest proof is awaiting approval or revision.'} Proof viewing and approval will be available here when private file delivery is connected.</p>}
   <div className="dashboard-actions">{actions.map(([action,text,reason])=><Action key={action} view={view} order={detail} action={action} text={text} reason={reason}/>)}</div>
   {view==='vendor'&&detail.state==='VENDOR_ASSIGNED'&&<Action view={view} order={detail} action="job.decline" text="Decline assigned job"><label htmlFor="decline-reason">Reason (required)</label><select id="decline-reason" name="reasonCode" required><option value="">Select a reason</option><option value="capacity_unavailable">No available capacity</option><option value="equipment_unavailable">Equipment unavailable</option><option value="scheduling_conflict">Cannot meet the schedule</option></select><p>Declining a paid job puts it on hold for review; it does not refund the customer.</p></Action>}
   {view==='vendor'&&detail.state==='QC_PENDING'&&<Action view={view} order={detail} action="qc.record" text="Record quality control" reason="vendor_quality_review"><p id="qc-help">Check each completed inspection. A passing result requires every check.</p>{([['artwork','Artwork matches the approved proof'],['quantityChecked','Quantity is correct'],['finish','Finishing and packing are correct']] as const).map(([name,title])=><label key={name} className="dashboard-choice"><input type="checkbox" name={name} aria-describedby="qc-help"/>{title}</label>)}<fieldset><legend>QC result (required)</legend><label className="dashboard-choice"><input type="radio" name="passed" value="true" required/>Pass</label><label className="dashboard-choice"><input type="radio" name="passed" value="false" required/>Requires correction</label></fieldset></Action>}
   {view==='vendor'&&detail.state==='QC_PASSED'&&<Action view={view} order={detail} action="order.ready" text="Confirm ready for handoff"><fieldset><legend>Handoff method (required)</legend><label className="dashboard-choice"><input type="radio" name="handoff" value="collection" required/>Customer collection</label><label className="dashboard-choice"><input type="radio" name="handoff" value="delivery" required/>Assigned delivery partner</label></fieldset><p>Delivery requires a current authorized partner assignment.</p></Action>}
   {detail.state==='IN_PRODUCTION'&&view==='vendor'&&<p>All printing, finishing and packing evidence must be recorded before submitting for QC.</p>}
   <h3>Recorded progress</h3><ol>{detail.timeline.map(event=><li key={event.id}>{label(event.state)} · {new Date(event.occurredAt).toLocaleString('en-GB',{timeZone:'Africa/Lusaka'})} CAT</li>)}</ol><p>Showing up to 50 recent state changes.</p></article>}
  {view==='customer'&&<details className="ui-panel dashboard-detail"><summary>Create a print enquiry draft</summary><p>This saves your print specification. Artwork, pricing and payment are separate steps; no payment is taken.</p><form action={orderDashboardAction}>
   <input type="hidden" name="view" value={view}/><input type="hidden" name="action" value="order.create"/><input type="hidden" name="orderId" value={randomUUID()}/><input type="hidden" name="operationId" value={randomUUID()}/><input type="hidden" name="expectedVersion" value="0"/>
   <label htmlFor="draft-product">Product code (required)</label><input id="draft-product" name="productCode" required pattern="[a-z][a-z0-9_-]{2,63}" maxLength={64} aria-describedby="draft-product-help"/><p id="draft-product-help">Use the product code supplied with your print enquiry.</p>
   {([['quantity','Quantity'],['widthMm','Print width in mm'],['heightMm','Print height in mm']] as const).map(([name,title])=><div key={name}><label htmlFor={`draft-${name}`}>{title} (required)</label><input id={`draft-${name}`} type="number" name={name} min="1" max="10000" step="1" required inputMode="numeric"/></div>)}
   <button type="submit" className="button button-primary">Save enquiry draft</button></form></details>}
  {view==='admin'&&<Link className="button button-plain" href="/admin/security">Open controlled security administration</Link>}
 </section>;
}
