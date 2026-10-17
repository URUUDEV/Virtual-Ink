import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductStudio } from '@/components/product-studio';
import '../customize/cotton-t-shirt/fonts.css';
export const metadata: Metadata = { title:'Product design studio · Design lab',robots:{index:false,follow:false} };
export default function StudioPage() {
  return <section className="container studio-page"><Link className="text-link" href="/shop">← Back to the collection</Link><div className="studio-heading"><div><p className="eyebrow">VIRTUAL INK / DESIGN STUDIO</p><h1>A blank. A possibility.</h1></div><p>Explore your idea on a product-specific model. Choose a surface, make your mark and keep a layout reference.</p></div><ProductStudio/></section>;
}
