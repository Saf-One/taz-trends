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
 */
export async function updateOrderStatus(orderId: string, next: OrderStatus) {
  const supabase = createSupabaseServerClient();

  const { data: order, error: readErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (readErr) throw new Error(readErr.message);

  if (!isValidTransition(order.status, next, order.payment_method)) {
    throw new Error(`Illegal transition ${order.status} -> ${next}`);
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  if (STATUS_NOTIFY.has(next)) {
    void sendStatusEmail({ ...order, status: next } as Order, next);
  }
}

export async function updateQuoteStatus(quoteId: string, next: QuoteStatus) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: next })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/quotes");
}
