import { VendorOnboarding } from '@/components/vendor-onboarding';
import '@/components/vendor-setup.css';
export default function JoinVendors() {
  return <section className="section container vendor-page"><p className="eyebrow">PARTNER WITH VIRTUAL INK</p>
    <h1 className="page-title">Your business.<br />Your vendor setup.</h1>
    <p className="page-description">A guided start for Hotprints, individual vendors and print or design businesses. Prepare your services, availability and handoff details, then review what comes next.</p>
    <VendorOnboarding /></section>;
}
