import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Quote } from "@/types/db";

/** All orders (admin). RLS: admin sees every row. */
export async function getAllOrders(): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

/** Order line with the product/variant labels needed to pick and pack it. */
export type AdminOrderItem = OrderItem & {
  products: { title: string } | null;
  product_variants: { variant_name: string; variant_value: string } | null;
};

export type AdminOrderDetail = Order & {
  order_items: AdminOrderItem[];
  profiles: { email: string; full_name: string | null } | null;
};

/** One order with items (product + variant labels) and the buyer's profile. */
export async function getOrderDetailAdmin(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, products(title), product_variants(variant_name, variant_value)), profiles(email, full_name)",
    )
    .eq("id", orderId)
    .maybeSingle();
  return (data as AdminOrderDetail | null) ?? null;
}

/** All quotes (admin). */
export async function getAllQuotes(): Promise<Quote[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Quote[]) ?? [];
}
