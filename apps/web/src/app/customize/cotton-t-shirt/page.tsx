import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TshirtWorkspace } from '@/components/tshirt-workspace';
import './fonts.css';
export const metadata: Metadata = { title: 'Create your T-shirt concept' };
export default function CustomizeTshirt() {
  return <section className="section container workspace-page"><Link className="text-link detail-back" href="/shop/cotton-t-shirt"><ArrowLeft size={16} /> Back to Cotton T-Shirt</Link>
    <div className="workspace-heading"><div><p className="eyebrow">A LITTLE INK. A LOT OF YOU.</p><h1>Make it yours.</h1></div><p>Give your idea a place to start.<br />Create a T-shirt layout and keep a preview.</p></div>
    <p><Link className="text-link" href="/studio">Open the product model design lab: garments, mugs and flat print →</Link></p><TshirtWorkspace />
  </section>;
}
