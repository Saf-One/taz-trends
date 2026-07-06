import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetailAdmin } from "@/lib/checkout/admin-queries";
import { updateOrderStatus } from "@/lib/checkout/actions";
import { allowedNextStatuses } from "@/lib/checkout/status";
import { StatusChip } from "@/components/admin/StatusChip";
import { parseOrderAddress } from "@/lib/checkout/address";
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
  const addr = parseOrderAddress(order.address_json);
  const placed = new Date(order.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-wine"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          All orders
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-ink">
            Order #{order.id.slice(0, 8)}
          </h1>
          <StatusChip status={order.status} />
        </div>
        <p className="mt-1 text-sm text-ink/50">
          Placed {placed}
        </p>
      </div>

      {/* Status actions */}
      {nexts.length > 0 && (
        <div className="card flex flex-wrap items-center gap-2 p-4">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-ink/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Move to:
          </span>
          {nexts.map((next) => (
            <form key={next} action={updateOrderStatus.bind(null, order.id, next)} className={next === "shipped" ? "flex flex-wrap items-center gap-2" : ""}>
              {next === "shipped" && (
                <input
                  type="url"
                  name="tracking_url"
                  placeholder="Tracking link (optional)"
                  defaultValue={order.tracking_url ?? ""}
                  className="w-56 rounded border border-ink/20 px-3 py-1.5 text-xs text-ink outline-none focus:border-wine"
                />
              )}
              <button className="btn-outline btn-xs">Mark {next.replace(/_/g, " ")}</button>
            </form>
          ))}
        </div>
      )}

      {/* Info grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ship to */}
        <section className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink/40"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Ship to
          </h2>
          {addr && (addr.name || addr.street) ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-ink">{addr.name}</p>
              {addr.street && <p className="text-ink/70">{addr.street}</p>}
              {(addr.city || addr.postal) && (
                <p className="text-ink/70">
                  {addr.city}
                  {addr.postal ? ` - ${addr.postal}` : ""}
                </p>
              )}
              {addr.phone && (
                <p className="pt-1">
                  <a
                    href={`tel:${addr.phone}`}
                    className="inline-flex items-center gap-1 text-wine underline underline-offset-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
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

        {/* Customer + payment info */}
        <section className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink/40"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Customer
          </h2>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-ink">
              {order.profiles?.full_name ?? addr?.name ?? "-"}
            </p>
            {order.profiles?.email && (
              <p>
                <a
                  href={`mailto:${order.profiles.email}`}
                  className="inline-flex items-center gap-1 text-wine underline underline-offset-2"
                >
                  {order.profiles.email}
                </a>
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 pt-2 text-xs">
              <div>
                <span className="text-ink/40">Payment</span>
                <p className="font-medium">
                  {order.payment_method === "cod" ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" />
                      </svg>
                      Cash on Delivery
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sky-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      Razorpay
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-ink/40">Payment status</span>
                <p
                  className={`font-medium ${
                    order.payment_status === "paid"
                      ? "text-emerald-700"
                      : order.payment_status === "failed"
                        ? "text-red-700"
                        : "text-ink/60"
                  }`}
                >
                  {order.payment_status}
                </p>
              </div>
            </div>
            {order.razorpay_order_id && (
              <p className="pt-1 text-xs text-ink/40">
                Razorpay: {order.razorpay_order_id}
              </p>
            )}
            <p className="pt-0.5 text-xs text-ink/30">
              User {order.user_id.slice(0, 8)}
            </p>
          </div>
        </section>
      </div>

      {/* Items to pack */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink/10 bg-blush/40 px-4 py-3">
          <h2 className="font-serif text-lg text-ink">Items to pack</h2>
        </div>

        <div className="divide-y divide-ink/10 px-4">
          {order.order_items.map((it) => (
            <div
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-blush text-xs font-semibold text-ink/70">
                  ×{it.quantity}
                </span>
                <span className="font-medium text-ink">
                  {it.products?.title ?? `item ${it.product_id.slice(0, 8)}`}
                </span>
                {it.product_variants && (
                  <span className="rounded border border-ink/15 px-1.5 py-0.5 text-xs text-ink/70">
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
            </div>
          ))}
        </div>

        <div className="border-t border-ink/10 bg-blush/20 px-4 py-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>{formatPaise(order.subtotal_paise)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Shipping</span>
              <span>
                {order.shipping_paise === 0 ? (
                  <span className="text-emerald-700">Free</span>
                ) : (
                  formatPaise(order.shipping_paise)
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>
                Total{order.payment_method === "cod" ? " (to collect)" : ""}
              </span>
              <span className="text-wine">{formatPaise(order.total)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
