import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/checkout/orders";
import { formatPaise } from "@/lib/config";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireUser("/orders");
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl text-ink">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-20 w-20">
              <rect x="12" y="20" width="40" height="34" rx="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 28v12M26 34h12" strokeLinecap="round" />
              <path d="M20 12h24l4 8H16l4-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="No orders yet"
          description="You haven't placed any orders yet. Start shopping and find something you love."
          actionLabel="Start Shopping"
          actionHref="/"
        />
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
