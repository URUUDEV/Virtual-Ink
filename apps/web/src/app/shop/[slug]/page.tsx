import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Palette, LockKeyhole } from 'lucide-react';
import { demoProducts, findDemoProduct, productImage, formatDemoPrice } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';
// This preview has a fixed catalogue. Reject unknown routes before streaming HTML.
export const dynamicParams = false;
export function generateStaticParams() {
  return demoProducts.map(product => ({ slug: product.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = findDemoProduct((await params).slug);
  return { title: product?.name ?? 'Product not found' };
}
export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const product = findDemoProduct((await params).slug);
  if (!product) notFound();
  return <section className="section container"><Link href="/shop" className="text-link detail-back"><ArrowLeft size={16} /> All products</Link>
    <div className="product-detail-grid"><figure className="detail-image"><Image src={productImage(product)} unoptimized alt={`${product.name} supplied mockup; final colours and specifications unconfirmed`} width={900} height={900} sizes="(max-width: 780px) 90vw, 50vw" priority /><figcaption>Supplied product mockup · 2D reference</figcaption></figure>
      <div className="detail-copy"><p className="eyebrow">{product.group.toUpperCase()} / VISUAL COLLECTION</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>
        <div className="detail-price"><strong>From {formatDemoPrice(product.price)}</strong><span>Illustrative price · {product.unit}</span></div>
        <dl className="detail-specs"><div><dt>Finish</dt><dd>{product.finish}</dd></div><div><dt>Vendor</dt><dd>To be confirmed</dd></div><div><dt>Options & availability</dt><dd>Awaiting vendor specifications</dd></div><div><dt>Collection & delivery</dt><dd>Zones and turnaround unconfirmed</dd></div></dl>
        {product.slug === 'cotton-t-shirt' && <Link href="/customize/cotton-t-shirt" className="button button-primary detail-customize"><Palette size={18} /> Create a T-shirt concept <ArrowRight size={17} /></Link>}
        <Link href="/design-services" className={`button ${product.slug === 'cotton-t-shirt' ? 'button-plain' : 'button-primary'}`}><Palette size={18} /> Explore design services <ArrowRight size={17} /></Link>
        <p className="detail-note"><LockKeyhole size={17} aria-hidden="true" /> Orders, uploads and payments are not enabled. This price is a reference, not a quotation.</p>
      </div></div>
    <div className="section-heading related-heading"><div><p className="eyebrow">MORE POSSIBILITIES</p><h2>Keep the ideas coming.</h2></div></div><div className="product-grid">{demoProducts.filter(item => item.slug !== product.slug).slice(0, 3).map(item => <ProductCard key={item.slug} product={item} />)}</div>
  </section>;
}
