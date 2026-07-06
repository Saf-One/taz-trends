"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidTransition } from "@/lib/checkout/status";
import { sendStatusEmail } from "@/lib/email/notify";
import type { Order, OrderStatus, QuoteStatus } from "@/types/db";

const STATUS_NOTIFY = new Set<OrderStatus>(["shipped", "delivered", "cancelled", "returned"]);

/**
 * Admin: move an order to a new status, enforcing allowed transitions.
 * Covers the settled COD flow cash_on_delivery -> delivered | returned.
 * Optionally stores a tracking_url when marking as shipped.
 */
export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus,
  formData: FormData,
) {
  const supabase = createSupabaseServerClient();

  // Verify the caller is an admin (RLS is defence-in-depth; check explicitly).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("forbidden");

  const { data: order, error: readErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (readErr) throw new Error(readErr.message);

  if (!isValidTransition(order.status, next, order.payment_method)) {
    throw new Error(`Illegal transition ${order.status} -> ${next}`);
  }

  const trackingUrl = formData.get("tracking_url") as string | null;

  const updateFields: Record<string, unknown> = { status: next };
  if (next === "shipped" && trackingUrl) {
    updateFields.tracking_url = trackingUrl;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateFields)
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  if (STATUS_NOTIFY.has(next)) {
    void sendStatusEmail(
      { ...order, ...updateFields } as Order,
      next,
      trackingUrl ?? null,
    );
  }
}

export async function updateQuoteStatus(quoteId: string, next: QuoteStatus) {
  const supabase = createSupabaseServerClient();

  // Verify the caller is an admin.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("forbidden");

  const { error } = await supabase
    .from("quotes")
    .update({ status: next })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/quotes");
}
