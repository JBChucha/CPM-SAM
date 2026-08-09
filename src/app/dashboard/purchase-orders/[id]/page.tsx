import PurchaseOrderDetailPage from '@/features/purchase-orders/components/purchase-order-detail-page';

export const metadata = {
  title: 'Dashboard: Purchase Order Detail'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return <PurchaseOrderDetailPage orderId={decodeURIComponent(params.id)} />;
}
