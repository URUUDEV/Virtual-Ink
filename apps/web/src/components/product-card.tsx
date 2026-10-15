import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { type DemoProduct, formatDemoPrice, productImage } from '@/lib/demo-products';
export function ProductCard({ product }: { product: DemoProduct }) {
  return <Link className="product-card" href={`/shop/${product.slug}`}>
    <div className="product-card-image"><span className="product-tag">{product.group}</span>
      <Image src={productImage(product)} unoptimized alt={`${product.name} — supplied Virtual Ink mockup`} width={480} height={480} sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw" />
      <span className="product-open" aria-hidden="true"><ArrowUpRight size={19} /></span>
    </div>
    <div className="product-card-copy"><h3>{product.name}</h3><p>{product.finish}</p><div className="product-price"><strong>From {formatDemoPrice(product.price)}</strong><span>Illustrative</span></div></div>
  </Link>;
}
