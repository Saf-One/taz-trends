import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/checkout/orders";
import { formatPaise } from "@/lib/config";

export const metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireUser("/orders");
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl text-ink">My orders</h1>
      {orders.length === 0 ? (
        <p className="text-ink/60">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="card flex items-center justify-between p-4 hover:border-wine/40"
              >
                <div>
                  <p className="font-medium">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-ink/50">
                    {o.payment_method === "cod" ? "COD" : "Razorpay"} · {o.status}
                  </p>
                </div>
                <span className="text-wine">{formatPaise(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
