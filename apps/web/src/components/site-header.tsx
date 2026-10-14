'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BrandLogo } from './brand-logo';
const links = [
  ['/', 'Home'], ['/shop', 'Shop'], ['/design-services', 'Design services'],
  ['/business', 'For business'], ['/how-it-works', 'How it works'],
] as const;
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); document.getElementById('navigation-toggle')?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return <header className="site-header"><div className="container header-inner">
    <Link href="/" aria-label="Virtual Ink home" onClick={() => setOpen(false)} className="logo-link"><BrandLogo /></Link>
    <button id="navigation-toggle" type="button" className="menu-toggle" aria-expanded={open} aria-controls="primary-nav"
      aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>
      {open ? <X size={24} /> : <Menu size={24} />}
    </button>
    <nav id="primary-nav" aria-label="Primary" className={`primary-nav ${open ? 'is-open' : ''}`}>
      {links.map(([href, label]) => <Link key={href} href={href} aria-current={(href === '/shop' ? pathname.startsWith('/shop') : pathname === href) ? 'page' : undefined}
        onClick={() => setOpen(false)}>{label}</Link>)}
      <Link href="/roadmap" className="nav-roadmap" onClick={() => setOpen(false)}>Build roadmap <ArrowRight size={15} /></Link>
    </nav>
  </div></header>;
}
