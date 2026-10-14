import Link from 'next/link';
export default function ProductNotFound() { return <section className="section container empty-state"><h1>Product not found</h1><p>This concept isn’t part of the current collection.</p><Link href="/shop" className="button button-primary">Explore products</Link></section>; }
