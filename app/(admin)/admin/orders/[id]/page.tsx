import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetailAdmin } from "@/lib/checkout/admin-queries";
import { updateOrderStatus } from "@/lib/checkout/actions";
import { allowedNextStatuses } from "@/lib/checkout/status";
import { StatusChip } from "@/components/admin/StatusChip";
import { formatPaise } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order detail" };

export default async function AdminOrderDetail({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrderDetailAdmin(params.id);
  if (!order) notFound();

  const nexts = allowedNextStatuses(order.status, order.payment_method);
  const addr = order.address_json;
  const placed = new Date(order.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/orders" className="text-xs text-ink/50 hover:text-wine">
          ← All orders
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-ink">
            Order #{order.id.slice(0, 8)}
          </h1>
          <StatusChip status={order.status} />
        </div>
        <p className="mt-1 text-sm text-ink/50">
          Placed {placed} ·{" "}
          {order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"} ·
          payment {order.payment_status}
          {order.razorpay_order_id && ` · ${order.razorpay_order_id}`}
        </p>
      </div>

      {/* Status actions */}
      {nexts.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-4">
          <span className="mr-1 text-sm text-ink/60">Move to:</span>
          {nexts.map((next) => (
            <form key={next} action={updateOrderStatus.bind(null, order.id, next)}>
              <button className="btn-outline text-xs">Mark {next}</button>
            </form>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ship to */}
        <section className="card p-4">
          <h2 className="mb-3 font-serif text-lg">Ship to</h2>
          {addr && (addr.name || addr.street) ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{addr.name}</p>
              <p>{addr.street}</p>
              <p>
                {addr.city}
                {addr.postal ? ` — ${addr.postal}` : ""}
              </p>
              {addr.phone && (
                <p className="pt-1">
                  <a href={`tel:${addr.phone}`} className="text-wine underline underline-offset-2">
                    {addr.phone}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink/50">
              No address on this order (placed before address capture).
            </p>
          )}
        </section>

        {/* Customer */}
        <section className="card p-4">
          <h2 className="mb-3 font-serif text-lg">Customer</h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {order.profiles?.full_name ?? addr?.name ?? "—"}
            </p>
            {order.profiles?.email && (
              <p>
                <a
                  href={`mailto:${order.profiles.email}`}
                  className="text-wine underline underline-offset-2"
                >
                  {order.profiles.email}
                </a>
              </p>
            )}
            <p className="pt-1 text-xs text-ink/40">User {order.user_id.slice(0, 8)}</p>
          </div>
        </section>
      </div>

      {/* Items to pack */}
      <section className="card p-4">
        <h2 className="mb-3 font-serif text-lg">Items to pack</h2>
        <ul className="divide-y divide-ink/10">
          {order.order_items.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <span>
                <span className="mr-2 inline-block w-10 rounded bg-blush px-1.5 py-0.5 text-center text-xs font-semibold">
                  ×{it.quantity}
                </span>
                <span className="font-medium">
                  {it.products?.title ?? `item ${it.product_id.slice(0, 8)}`}
                </span>
                {it.product_variants && (
                  <span className="ml-2 rounded border border-ink/15 px-1.5 py-0.5 text-xs text-ink/70">
                    {it.product_variants.variant_name}: {it.product_variants.variant_value}
                  </span>
                )}
              </span>
              <span className="text-ink/70">
                {formatPaise(it.unit_price)} × {it.quantity} ={" "}
                <span className="font-medium text-ink">
                  {formatPaise(it.unit_price * it.quantity)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPaise(order.subtotal_paise)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {order.shipping_paise === 0 ? "Free" : formatPaise(order.shipping_paise)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>
              Total{order.payment_method === "cod" ? " to collect" : ""}
            </span>
            <span className="text-wine">{formatPaise(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
