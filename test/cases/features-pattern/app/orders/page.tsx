import { OrderTotal } from '../../features/orders/components/order-total';

export default function OrdersPage() {
  return (
    <main className="orders">
      <OrderTotal total={0} />
    </main>
  );
}
