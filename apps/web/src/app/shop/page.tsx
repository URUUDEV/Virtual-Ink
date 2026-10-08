import type { Metadata } from 'next';
import { CategoryExplorer } from '@/components/category-explorer';
export const metadata: Metadata = { title: 'Explore categories' };
export default function Shop() {
  return <section className="section container"><p className="eyebrow">THE POSSIBILITIES</p><h1 className="page-title">What will you create?</h1>
    <p className="page-description">Browse the planned categories. Real products, vendors, prices and availability will be added after discovery and approval.</p><CategoryExplorer /></section>;
}
