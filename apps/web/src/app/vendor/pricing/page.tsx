import { VendorPricing } from '@/components/vendor-pricing';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: 'Vendor prices and commission', robots: { index: false, follow: false } };
export default function VendorPricingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <VendorPricing searchParams={searchParams}/>;
}
