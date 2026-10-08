import Link from 'next/link';
export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div><p className="footer-name">Virtual Ink<span>.</span></p><p>Your Ideas. Our Print. Delivered.</p>
      <p className="workflow">DESIGN · PRINT · ORDER · DELIVER</p></div>
    <nav aria-label="Footer"><Link href="/shop">Explore categories</Link><Link href="/design-services">Design services</Link>
      <Link href="/business">Business and bulk</Link><Link href="/roadmap">Build roadmap</Link></nav>
    <div><p>By Shadow Root Security Technologies</p><p className="footer-note">A clearly labelled foundation preview. Vendor, commercial and policy details are awaiting confirmation.</p></div>
  </div></footer>;
}
