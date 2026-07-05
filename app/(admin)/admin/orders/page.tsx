import { getAllOrders } from "@/lib/checkout/admin-queries";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrders() {
  const orders = await getAllOrders();

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Orders</h1>
      </div>

      <AdminOrdersTable orders={orders} />
    </div>
  );
}
