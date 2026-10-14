import { ButtonLink } from '@/components/ui/button-link';
export default function Business() {
  return <section className="section container info-page"><p className="eyebrow">BUSINESS & BULK</p><h1 className="page-title">One identity.<br />A coordinated collection.</h1>
    <p className="page-description">Planned solutions for branded uniforms, bulk apparel, event materials, school printing and corporate merchandise.</p>
    <div className="info-callout"><h2>Prepare a useful brief</h2><p>List the required items, quantities, artwork needs, deadline and collection or delivery preferences. Verified vendor capabilities and approved quote rules will determine what can be offered.</p>
      <p>Quote submission is not enabled in this preview. No turnaround, coverage or capacity promise is being made.</p></div>
    <ButtonLink href="/how-it-works">Understand the planned workflow</ButtonLink>
    <div className="info-callout"><h2>Bring your business to Virtual Ink</h2><p>Print, apparel, signage and design partners can prepare a vendor profile for review. Account activation follows verified capabilities and an approved onboarding process.</p><p><ButtonLink href="/vendors/join">Prepare a vendor profile</ButtonLink></p></div></section>;
}
