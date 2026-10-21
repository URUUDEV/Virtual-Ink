import { OrderDashboard } from '@/components/order-dashboard';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const metadata={title:'Platform order oversight',robots:{index:false,follow:false}};
export default function AdminPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 return <OrderDashboard view="admin" searchParams={searchParams}/>;
}
