import { OrderDashboard } from '@/components/order-dashboard';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Your orders',robots:{index:false,follow:false}};
export default function CustomerPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 return <OrderDashboard view="customer" searchParams={searchParams}/>;
}
