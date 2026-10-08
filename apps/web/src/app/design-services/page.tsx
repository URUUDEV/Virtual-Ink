import { ButtonLink } from '@/components/ui/button-link';
export default function DesignServices() {
  return <section className="section container info-page"><p className="eyebrow">FROM BRIEF TO ARTWORK</p><h1 className="page-title">Give your idea a clear direction.</h1>
    <p className="page-description">Design brief submission, quotations, proof approvals and private digital handover are planned. This foundation preview does not send a brief or create a quote.</p>
    <div className="feature-grid"><article className="feature-card"><h2>Define the brief</h2><p>Intended use, dimensions, quantity, deadline and existing artwork.</p></article>
      <article className="feature-card"><h2>Review the proof</h2><p>Clear revision history and an explicit approval step before production.</p></article>
      <article className="feature-card"><h2>Receive privately</h2><p>Authorized access to final files, with retention rules and sensitive-access audits.</p></article></div>
    <ButtonLink href="/roadmap">View the build sequence</ButtonLink></section>;
}
