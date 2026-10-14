'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { filterDemoProducts, productGroups, type ProductGroup } from '@/lib/demo-products';
import { ProductCard } from './product-card';
export function ProductExplorer({ initialGroup = 'All' }: { initialGroup?: ProductGroup }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<ProductGroup>(initialGroup);
  const [sort, setSort] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const results = filterDemoProducts(query, group, sort);
  function clear() { setQuery(''); setGroup('All'); setSort('featured'); }
  return <div className="catalogue"><div className="catalogue-toolbar"><label className="search-field"><Search size={20} aria-hidden="true" /><span className="sr-only">Search products</span>
    <input value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="Find your next idea…" type="search" />
    {query && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={18} /></button>}</label>
    <label className="catalogue-sort"><SlidersHorizontal size={17} aria-hidden="true" /><span className="sr-only">Sort products</span><select value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="featured">Featured</option><option value="price-low">Illustrative price: low to high</option><option value="price-high">Illustrative price: high to low</option></select></label></div>
    <div className="filter-row" aria-label="Filter product group">{productGroups.map(item => <button type="button" key={item} className={`filter ${group === item ? 'active' : ''}`} aria-pressed={group === item} onClick={() => setGroup(item)}>{item}</button>)}</div>
    <p className="results-count" role="status">{results.length} {results.length === 1 ? 'product concept' : 'product concepts'}{group !== 'All' ? ` · ${group}` : ''}</p>
    {results.length ? <div className="product-grid">{results.map(product => <ProductCard key={product.slug} product={product} />)}</div> : <div className="empty-state"><Search size={30} aria-hidden="true" /><h2>No matching concepts</h2><p>Try another search or explore all product groups.</p><button type="button" className="button button-plain" onClick={clear}>Clear filters</button></div>}
  </div>;
}
