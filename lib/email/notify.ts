import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResend, adminEmails } from "./resend";
import {
  adminOrderEmail,
  customerOrderEmail,
  customerStatusEmail,
} from "./templates";
import { STORE_NAME } from "@/lib/config";
import type { Order, OrderStatus } from "@/types/db";

const FROM = process.env.RESEND_FROM_EMAIL || `${STORE_NAME} <orders@taztrends.com>`;

interface ItemRow {
  name: string;
  variant?: string;
  qty: number;
  unit_price: number;
}

async function fetchItemRows(orderId: string): Promise<ItemRow[]> {
  const admin = createSupabaseAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("quantity, unit_price, product_id, variant_id")
    .eq("order_id", orderId);
  if (!items?.length) return [];

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const variantIds = items.flatMap((i) => (i.variant_id ? [i.variant_id] : []));

  const [{ data: products }, { data: variants }] = await Promise.all([
    admin.from("products").select("id, title").in("id", productIds),
    variantIds.length
      ? admin
          .from("product_variants")
          .select("id, variant_value")
          .in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; variant_value: string }[] }),
  ]);

  const pMap = new Map(products?.map((p) => [p.id, p.title]) ?? []);
  const vMap = new Map(variants?.map((v) => [v.id, v.variant_value]) ?? []);

  return items.map((it) => ({
    name: pMap.get(it.product_id) ?? "Product",
    variant: it.variant_id ? vMap.get(it.variant_id) : undefined,
    qty: it.quantity,
    unit_price: it.unit_price,
  }));
}

/**
 * Send admin alert + customer confirm after a new order.
 * Fire-and-forget: errors are logged but never throw (don't fail the order).
 */
export async function sendOrderEmails(
  order: Order,
  customerEmail: string,
  customerName: string | null,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set - skipping order emails");
    return;
  }

  const items = await fetchItemRows(order.id).catch(() => [] as ItemRow[]);

  const toAdmin = adminEmails();
  const { subject: aSubj, html: aHtml } = adminOrderEmail(order, items);
  const { subject: cSubj, html: cHtml } = customerOrderEmail(order, items, customerName);

  await Promise.allSettled([
    toAdmin.length
      ? resend.emails.send({ from: FROM, to: toAdmin, subject: aSubj, html: aHtml })
      : Promise.resolve(),
    resend.emails.send({
      from: FROM,
      to: [customerEmail],
      subject: cSubj,
      html: cHtml,
    }),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected")
        console.error("[email] send failed:", r.reason);
    });
  });
}

/**
 * Send customer status update email (shipped, delivered, cancelled, returned).
 * Called from admin order status update action.
 */
export async function sendStatusEmail(
  order: Order,
  newStatus: OrderStatus,
  trackingUrl: string | null = null,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  if (!profile?.email) return;

  const { subject, html } = customerStatusEmail(order, newStatus, profile.full_name, trackingUrl);
  await resend.emails
    .send({ from: FROM, to: [profile.email], subject, html })
    .catch((e) => console.error("[email] status email failed:", e));
}
