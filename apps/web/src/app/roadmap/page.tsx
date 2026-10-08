import { HealthStatus } from '@/components/health-status';
export default function Roadmap() {
  return <section className="section container info-page"><p className="eyebrow">A FOUNDATION BUILT WITH CARE</p><h1 className="page-title">Build one slice.<br />Verify it. Then grow.</h1>
    <p className="page-description">Virtual Ink is being developed by Shadow Root Security Technologies. This page describes planned work; it is not a feature availability promise.</p>
    <ol className="workflow-list"><li><h2>Backend and brand foundation</h2><p>Health, configuration, validation, audit contracts, documentation and the responsive application shell.</p></li>
      <li><h2>Identity, roles and tenant boundaries</h2><p>Customer or guest, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner. Denial and isolation tests come before private work queues.</p></li>
      <li><h2>Verified marketplace discovery</h2><p>Approved vendors, products and server-side quote rules.</p></li>
      <li><h2>Private files and customization</h2><p>Validated uploads, audited access, proofs and an explicitly labelled 2D/3D editor.</p></li>
      <li><h2>Customer, vendor and operator journeys</h2><p>Orders, approved payment records, support and delivery coordination, one accepted flow at a time.</p></li></ol>
    <div className="info-callout"><h2>Foundation health</h2><HealthStatus /></div>
  </section>;
}
