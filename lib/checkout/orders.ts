import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/db";

/** Fetch an order plus its line items. RLS returns it only to owner/admin. */
export async function getOrderWithItems(
  id: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const supabase = createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return { order: order as Order, items: (items as OrderItem[]) ?? [] };
}

/** Orders belonging to the current user, newest first. */
export async function getMyOrders(): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}
