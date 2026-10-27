'use client';
import { useSearchParams } from 'next/navigation';
import { productGroups, type ProductGroup } from '@/lib/demo-products';
import { ProductExplorer } from './product-explorer';

// Keep category deep links in the static UI; search and sorting remain local.
export function UrlProductExplorer({ initialGroup }: { initialGroup: ProductGroup }) {
  const params = useSearchParams();
  const values = params?.getAll('group');
  const group = values === undefined ? initialGroup : productGroups.find(item => values.length === 1 && item === values[0]) ?? 'All';
  return <ProductExplorer key={group} initialGroup={group}/>;
}
