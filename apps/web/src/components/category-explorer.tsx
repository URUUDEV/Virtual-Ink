'use client';
import { useState } from 'react';
import { Search, FileText, Shirt, Palette, Box } from 'lucide-react';
import { categories } from '@/lib/categories';
const groups = ['All', 'Apparel', 'Print', 'Merchandise', 'Design'] as const;
const icons = { Apparel: Shirt, Print: FileText, Merchandise: Box, Design: Palette };
export function CategoryExplorer() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('All');
  const results = categories.filter((category) => (group === 'All' || category.group === group) &&
    category.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <label className="search-field"><Search size={21} aria-hidden="true" /><span className="sr-only">Search categories</span>
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search print, apparel, merchandise…" /></label>
    <div className="filter-row" role="group" aria-label="Category groups">
      {groups.map((name) => <button className={group === name ? 'filter active' : 'filter'} key={name}
        aria-pressed={group === name} onClick={() => setGroup(name)}>{name}</button>)}
    </div>
    <p className="results-count" role="status">{results.length} categories · Preview taxonomy, not a live product catalogue</p>
    <div className="category-grid">{results.map((category) => {
      const Icon = icons[category.group];
      return <article className="category-card" key={category.name}><div className="category-icon"><Icon size={26} aria-hidden="true" /></div>
        <span className="eyebrow">{category.group}</span><h2>{category.name}</h2><p>{category.summary}</p>
        <span className="preview-label">Vendor offerings awaiting confirmation</span></article>;
    })}</div>
    {results.length === 0 && <div className="empty-state"><h2>No matching categories</h2><p>Try another search or reset the filters.</p>
      <button className="button button-plain" onClick={() => { setQuery(''); setGroup('All'); }}>Reset filters</button></div>}
  </>;
}
