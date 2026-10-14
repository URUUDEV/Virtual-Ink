import type { Metadata } from 'next';
import { ProductExplorer } from '@/components/product-explorer';
import { productGroups, type ProductGroup } from '@/lib/demo-products';
export const metadata: Metadata = { title: 'Explore products' };
export default async function Shop({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams;
  const group: ProductGroup = productGroups.find(item => item === params.group) ?? 'All';
  return <><section className="catalogue-heading"><div className="container"><p className="eyebrow">MADE FOR YOUR NEXT IDEA</p><h1 className="page-title">Make something<br /><span>worth sharing.</span></h1><p>Apparel, print and merchandise. Find the canvas for your creativity.</p></div></section>
    <section className="section container catalogue-section"><div className="catalogue-notice"><strong>A visual collection, ready to explore.</strong><p>Supplied mockups and illustrative ZMW prices. Vendors, specifications and availability await confirmation; ordering is not live.</p></div><ProductExplorer key={group} initialGroup={group} /></section></>;
}
