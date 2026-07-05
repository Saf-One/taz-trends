import Link from "next/link";
import { getAllOrders } from "@/lib/checkout/admin-queries";
import { StatusChip } from "@/components/admin/StatusChip";
import { parseOrderAddress } from "@/lib/checkout/address";
import { formatPaise } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrders() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Orders</h1>
      <div className="space-y-2">
        {orders.map((o) => {
          const placed = new Date(o.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
          return (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-wine/40"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  #{o.id.slice(0, 8)}
                  <StatusChip status={o.status} />
                </p>
                <p className="mt-0.5 truncate text-xs text-ink/50">
                  {placed} · {parseOrderAddress(o.address_json)?.name ?? "—"} ·{" "}
                  {o.payment_method === "cod" ? "COD" : "Razorpay"} · payment{" "}
                  {o.payment_status}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-wine">{formatPaise(o.total)}</span>
                <span className="text-ink/30" aria-hidden>
                  →
                </span>
              </div>
            </Link>
          );
        })}
        {orders.length === 0 && <p className="text-ink/50">No orders yet.</p>}
      </div>
    </div>
  );
}
