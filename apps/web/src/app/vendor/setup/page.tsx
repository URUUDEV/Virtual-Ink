import { VendorSetup } from '@/components/vendor-setup';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: 'Vendor setup', robots: { index: false, follow: false } };
export default function VendorSetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <VendorSetup searchParams={searchParams}/>;
}
