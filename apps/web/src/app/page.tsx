import Link from 'next/link';
import { ArrowRight, FileText, Shirt, Palette, Box, ShieldCheck, Lock, Layers, Truck, Sparkles } from 'lucide-react';
import { ProductShowcase } from '@/components/product-showcase';
import { ProductCard } from '@/components/product-card';
import { demoProducts } from '@/lib/demo-products';
import { ButtonLink } from '@/components/ui/button-link';
const highlights = [
  { icon: Shirt, name: 'Custom apparel', text: 'T-shirts, polos and hoodies.', href: '/shop?group=Apparel' },
  { icon: FileText, name: 'Everyday print', text: 'Cards, flyers and stationery.', href: '/shop?group=Print' },
  { icon: Box, name: 'Banners & signage', text: 'Make your message stand out.', href: '/shop?group=Signage' },
  { icon: Palette, name: 'Design services', text: 'Bring your vision into focus.', href: '/design-services' },
];
export default function Home() {
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><p className="eyebrow hero-eyebrow"><span /> A new space for ideas in print</p>
        <h1>Your Ideas.<br />Our Print.<br /><span className="gradient-text">Delivered.</span></h1>
        <p className="hero-description">Custom printing, branded apparel, marketing materials, and professional design services — all in one place.</p>
        <div className="hero-actions"><ButtonLink href="/shop">Start Ordering <ArrowRight size={18} /></ButtonLink>
          <ButtonLink href="/design-services" secondary>Get a Quote</ButtonLink></div>
        <p className="hero-disclaimer">Find your inspiration. Explore the visual collection.</p>
        <p className="workflow">DESIGN <span>·</span> PRINT <span>·</span> ORDER <span>·</span> DELIVER</p>
      </div>
      <ProductShowcase />
    </div></section>
    <section className="trust-strip"><div className="container trust-grid">
      <span><ShieldCheck size={20} /> Clear vendor approval</span><span><Lock size={20} /> Private customer files</span>
      <span><Layers size={20} /> Proof before production</span><span><Truck size={20} /> Collection or delivery</span>
    </div><p>Platform design commitments · Vendor approval and fulfilment are not live yet.</p></section>
    <section className="section container"><div className="section-heading"><div><p className="eyebrow">MAKE IT YOURS</p>
      <h2>One idea. So many possibilities.</h2></div><Link className="text-link" href="/shop">Explore all categories <ArrowRight size={17} /></Link></div>
      <div className="feature-grid category-shortcuts">{highlights.map(({ icon: Icon, name, text, href }) => <Link href={href} className="feature-card" key={name}>
        <div className="category-icon"><Icon size={25} /></div><h3>{name}</h3><p>{text}</p><span className="text-link">Explore <ArrowRight size={16} /></span>
      </Link>)}</div>
    </section>
    <section className="section section-muted"><div className="container"><div className="section-heading"><div><p className="eyebrow">YOUR BRAND, YOUR WAY</p><h2>Explore custom products.</h2></div><Link href="/shop" className="text-link">View the collection <ArrowRight size={17} /></Link></div>
      <p className="collection-note">Supplied product concepts · All ZMW prices are illustrative, pending vendor approval.</p>
      <div className="product-grid">{demoProducts.map(product => <ProductCard key={product.slug} product={product} />)}</div>
    </div></section>
    <section className="section section-muted"><div className="container"><div className="section-heading"><div>
      <p className="eyebrow">A SIMPLE CREATIVE JOURNEY</p><h2>From your first idea to the final piece.</h2></div></div>
      <div className="steps-grid">{[['01', 'Choose', 'Discover an offering and define your requirements.'],
        ['02', 'Design', 'Bring your artwork or prepare a design brief.'], ['03', 'Approve & print', 'Review the proof before approved work moves ahead.'],
        ['04', 'Receive', 'Collect, arrange delivery, or receive a private digital handover.']].map(([number, title, text]) =>
          <article className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      <p className="section-note">Planned customer workflow. This preview does not submit an order.</p>
    </div></section>
    <section className="section container"><div className="creative-callout"><div><p className="eyebrow">A LITTLE HELP WITH YOUR BIG IDEA</p><h2>Start with an idea.<br />Make it unmistakably yours.</h2><p>From a fresh identity to artwork for your next event, explore the design services planned for Virtual Ink.</p><ButtonLink href="/design-services">Explore design services <ArrowRight size={17} /></ButtonLink></div>
      <div className="creative-mark" aria-hidden="true"><Sparkles size={48} /><span>DESIGN</span><span>WITH</span><strong>possibility.</strong><div className="creative-swatches"><i /><i /><i /></div></div>
    </div></section>
    <section className="container business-callout"><div><p className="eyebrow">FOR TEAMS WITH BIG IDEAS</p><h2>Your identity. Across every detail.</h2>
      <p>Printing and merchandise journeys for businesses, schools, churches, NGOs and event organisers.</p></div>
      <ButtonLink href="/business">Explore business solutions <ArrowRight size={17} /></ButtonLink></section>
    <section className="section container faq"><p className="eyebrow">GOOD TO KNOW</p><h2>A clear start.</h2>
      <details><summary>Can I place an order today?</summary><p>This is a foundation preview. Ordering will follow verified vendor discovery, approved pricing and tested permissions.</p></details>
      <details><summary>Where are my uploaded files stored?</summary><p>Uploads are not enabled. The backend plan requires private storage and audited access before files can be accepted.</p></details>
      <details><summary>Does the customizer work in 3D?</summary><p>The <Link href="/customize/cotton-t-shirt">T-shirt workspace</Link> includes a 2D placement guide and an interactive 3D concept shirt. Text and artwork stay in your browser. Production garment models and print proofs come later.</p></details>
      <details><summary>Are payments or delivery partners connected?</summary><p>No live payment or courier integration is configured. Those decisions remain open with Uchi and Lubasi.</p></details>
    </section>
  </>;
}
