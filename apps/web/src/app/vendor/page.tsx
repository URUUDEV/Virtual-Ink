import { OrderDashboard } from '@/components/order-dashboard';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Assigned order queue',robots:{index:false,follow:false}};
export default function VendorPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 return <OrderDashboard view="vendor" searchParams={searchParams}/>;
}
