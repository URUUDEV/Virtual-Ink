import { ButtonLink } from '@/components/ui/button-link';
export default function HowItWorks() {
  return <section className="section container info-page"><p className="eyebrow">DESIGN · PRINT · ORDER · DELIVER</p><h1 className="page-title">A considered journey.<br />Every step visible.</h1>
    <p className="page-description">This is the intended workflow. Order processing, proof approval and fulfilment are future implementation slices.</p>
    <ol className="workflow-list"><li><h2>Discover and define</h2><p>Choose a verified offering and specify the required options.</p></li>
      <li><h2>Supply artwork or a brief</h2><p>Use private file handover, or request professional design assistance.</p></li>
      <li><h2>Review and approve</h2><p>Confirm the server-generated quote and required proofs.</p></li>
      <li><h2>Produce and receive</h2><p>Follow authorized status updates, then collect, arrange delivery or receive approved digital work.</p></li></ol>
    <ButtonLink href="/shop">Explore the category preview</ButtonLink></section>;
}
