import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductExplorer } from '@/components/product-explorer';
import { UrlProductExplorer } from '@/components/url-product-explorer';
import { ButtonLink } from '@/components/ui/button-link';
import { productGroups, type ProductGroup } from '@/lib/demo-products';
export const metadata: Metadata = { title: 'Explore products' };
export default async function Shop({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams;
  const group: ProductGroup = productGroups.find(item => item === params.group) ?? 'All';
  return <><section className="catalogue-heading"><div className="container"><p className="eyebrow">MADE FOR YOUR NEXT IDEA</p><h1 className="page-title">Make something<br /><span>worth sharing.</span></h1><p>Apparel, print and merchandise. Find the canvas for your creativity.</p></div></section>
    <section className="section container catalogue-section"><div className="ui-panel"><p className="eyebrow">PRINTING FOR STUDY AND WORK</p><h2>Need to print a document?</h2>
      <p>Prepare assignments, lecture notes, reports and dissertations with your choice of paper, copies and binding. Quotation required; ordering is not live yet.</p>
      <ButtonLink href="/print-documents">Configure document printing</ButtonLink></div>
      <div className="catalogue-notice"><strong>A visual collection, ready to explore.</strong><p>Supplied mockups and illustrative ZMW prices. Vendors, specifications and availability await confirmation; ordering is not live.</p></div><Suspense fallback={<ProductExplorer key={group} initialGroup={group}/>}><UrlProductExplorer initialGroup={group}/></Suspense></section></>;
}
