import Link from 'next/link';
import { BrandLogo } from './brand-logo';
export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div><Link href="/" className="logo-link footer-logo" aria-label="Virtual Ink home"><BrandLogo /></Link><p>Your Ideas. Our Print. Delivered.</p>
      <p className="workflow">DESIGN · PRINT · ORDER · DELIVER</p></div>
    <nav aria-label="Footer"><Link href="/print-documents">Print documents</Link><Link href="/shop">Explore products</Link><Link href="/design-services">Design services</Link>
      <Link href="/business">Business and bulk</Link><Link href="/vendors/join">Become a vendor</Link><Link href="/pricing">Pricing explained</Link><Link href="/delivery">Delivery & collection</Link><Link href="/about">About & trust</Link><Link href="/support">Help & frequently asked questions</Link></nav>
    <div><p>By Shadow Root Security Technologies</p><p className="footer-note">Visual collection preview. Vendor, commercial and policy details are awaiting confirmation.</p></div>
  </div></footer>;
}
