import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrderWithItems } from "@/lib/checkout/orders";
import { formatPaise } from "@/lib/config";
import type { Product } from "@/types/db";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  cash_on_delivery: "Cash on Delivery — confirmed",
};

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser(`/orders/${params.id}`);
  const result = await getOrderWithItems(params.id);
  if (!result) notFound();
  const { order, items } = result;

  // Fetch product names for display
  const supabase = createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .in(
      "id",
      items.map((it) => it.product_id),
    );
  const productMap = new Map(products?.map((p) => [p.id, p.title]) || []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-ink">Order confirmed</h1>
          <span className="rounded-full bg-blush px-3 py-1 text-xs text-wine">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          #{order.id.slice(0, 8)} ·{" "}
          {order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"} ·{" "}
          payment: {order.payment_status}
        </p>

        <ul className="mt-6 divide-y divide-ink/10">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between py-2 text-sm">
              <span>
                {it.quantity} ×{" "}
                <span className="font-medium">
                  {productMap.get(it.product_id) || "Product"}
                </span>
              </span>
              <span>{formatPaise(it.unit_price * it.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPaise(order.subtotal_paise)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {order.shipping_paise === 0
                ? "Free"
                : formatPaise(order.shipping_paise)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPaise(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/orders" className="btn-outline">
            My orders
          </Link>
          <Link href="/" className="btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
