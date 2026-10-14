'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { demoProducts, productImage } from '@/lib/demo-products';
export function ProductShowcase() {
  const [index, setIndex] = useState(0);
  const product = demoProducts[index];
  return <section className="product-showcase" aria-label="Product showcase" aria-roledescription="carousel">
    <div className="showcase-top"><span>THE POSSIBILITIES, IN PRINT</span><span className="showcase-badge">Visual collection</span></div>
    <div className="showcase-stage"><div className="showcase-ring" aria-hidden="true" />
      <Image key={product.slug} src={productImage(product)} alt={`${product.name} supplied product mockup, static 2D image`} width={600} height={600} sizes="(max-width: 780px) 90vw, 45vw" priority />
    </div>
    <div className="showcase-bottom"><div aria-live="polite" aria-atomic="true"><p>{product.name}</p><span>{String(index + 1).padStart(2, '0')} / 06 · {product.finish}</span></div>
      <Link href={`/shop/${product.slug}`} className="showcase-detail" aria-label={`Explore ${product.name}`}><ArrowUpRight size={22} /></Link></div>
    <div className="showcase-controls"><button type="button" aria-label="Previous product" onClick={() => setIndex((index + demoProducts.length - 1) % demoProducts.length)}><ArrowLeft size={18} /></button>
      <div className="showcase-dots">{demoProducts.map((item, i) => <button type="button" key={item.slug} aria-label={`Show ${item.name}`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div>
      <button type="button" aria-label="Next product" onClick={() => setIndex((index + 1) % demoProducts.length)}><ArrowRight size={18} /></button></div>
  </section>;
}
