import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileText, Shirt, Palette, Box, ShieldCheck, Lock, Layers, Truck } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ButtonLink } from '@/components/ui/button-link';
import referenceBoard from '../../../../asssets/Virtual Ink UI_UX Showcase Board.png';
const highlights = [
  { icon: Shirt, name: 'Custom apparel', text: 'T-shirts, polos, hoodies and uniforms.' },
  { icon: FileText, name: 'Everyday print', text: 'Business cards, flyers, posters and signage.' },
  { icon: Box, name: 'Brand merchandise', text: 'Mugs, packaging and promotional pieces.' },
  { icon: Palette, name: 'Design services', text: 'Creative briefs, proofs and private handover.' },
];
export default function Home() {
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><p className="eyebrow hero-eyebrow"><span /> A new space for ideas in print</p>
        <h1>Your Ideas.<br />Our Print.<br /><span className="gradient-text">Delivered.</span></h1>
        <p className="hero-description">Custom printing, branded apparel, marketing materials, and professional design services from trusted vendors — all in one place.</p>
        <div className="hero-actions"><ButtonLink href="/shop">Start Ordering <ArrowRight size={18} /></ButtonLink>
          <ButtonLink href="/design-services" secondary>Get a Quote</ButtonLink></div>
        <p className="hero-disclaimer">Explore the foundation preview. Ordering and quote submission are coming in later verified slices.</p>
        <p className="workflow">DESIGN <span>·</span> PRINT <span>·</span> ORDER <span>·</span> DELIVER</p>
      </div>
      <div className="hero-brand"><div className="brand-orbit" aria-hidden="true" /><div className="brand-showcase"><BrandLogo large />
        <div className="brand-showcase-caption"><span>YOUR NEXT IDEA STARTS HERE</span><p>From imagination<br />to something you can hold.</p></div></div>
        <div className="hero-chip"><Layers size={19} /> Built for creative possibilities</div>
      </div>
    </div></section>
    <section className="trust-strip"><div className="container trust-grid">
      <span><ShieldCheck size={20} /> Clear vendor approval</span><span><Lock size={20} /> Private customer files</span>
      <span><Layers size={20} /> Proof before production</span><span><Truck size={20} /> Collection or delivery</span>
    </div><p>Platform design commitments · Vendor approval and fulfilment are not live yet.</p></section>
    <section className="section container"><div className="section-heading"><div><p className="eyebrow">MAKE IT YOURS</p>
      <h2>One idea. So many possibilities.</h2></div><Link className="text-link" href="/shop">Explore all categories <ArrowRight size={17} /></Link></div>
      <div className="feature-grid">{highlights.map(({ icon: Icon, name, text }) => <Link href="/shop" className="feature-card" key={name}>
        <div className="category-icon"><Icon size={30} /></div><h3>{name}</h3><p>{text}</p><span className="text-link">Explore categories <ArrowRight size={16} /></span>
      </Link>)}</div>
    </section>
    <section className="section section-muted"><div className="container"><div className="section-heading"><div>
      <p className="eyebrow">A SIMPLE CREATIVE JOURNEY</p><h2>From your first idea to the final piece.</h2></div></div>
      <div className="steps-grid">{[['01', 'Choose', 'Discover an offering and define your requirements.'],
        ['02', 'Design', 'Bring your artwork or prepare a design brief.'], ['03', 'Approve & print', 'Review the proof before approved work moves ahead.'],
        ['04', 'Receive', 'Collect, arrange delivery, or receive a private digital handover.']].map(([number, title, text]) =>
          <article className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      <p className="section-note">Planned customer workflow. This preview does not submit an order.</p>
    </div></section>
    <section className="section container"><div className="split-section"><div><p className="eyebrow">THE DESIGN DIRECTION</p>
      <h2>A workspace for<br />your creative process.</h2><p>Artwork, layers and product previews are planned as a dedicated customization slice. A real 3D model will be required for 3D rotation; otherwise the editor will be labelled as a 2D preview.</p>
      <ButtonLink href="/roadmap">See what we’re building <ArrowRight size={17} /></ButtonLink></div>
      <figure className="reference-figure"><Image src={referenceBoard} alt="Supplied Virtual Ink concept board showing desktop and mobile design references" />
        <figcaption>Supplied design reference · Screens and illustrative prices in this image are concepts, not live products or working controls.</figcaption></figure>
    </div></section>
    <section className="container business-callout"><div><p className="eyebrow">FOR TEAMS WITH BIG IDEAS</p><h2>Your identity. Across every detail.</h2>
      <p>Printing and merchandise journeys for businesses, schools, churches, NGOs and event organisers.</p></div>
      <ButtonLink href="/business">Explore business solutions <ArrowRight size={17} /></ButtonLink></section>
    <section className="section container faq"><p className="eyebrow">GOOD TO KNOW</p><h2>A clear start.</h2>
      <details><summary>Can I place an order today?</summary><p>This is a foundation preview. Ordering will follow verified vendor discovery, approved pricing and tested permissions.</p></details>
      <details><summary>Where are my uploaded files stored?</summary><p>Uploads are not enabled. The backend plan requires private storage and audited access before files can be accepted.</p></details>
      <details><summary>Does the customizer work in 3D?</summary><p>The customizer is a later slice. This version does not simulate 3D rotation or offer an upload editor.</p></details>
      <details><summary>Are payments or delivery partners connected?</summary><p>No live payment or courier integration is configured. Those decisions remain open with Uchi and Lubasi.</p></details>
    </section>
  </>;
}
