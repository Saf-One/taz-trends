import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, Quote } from "@/types/db";

/** All orders (admin). RLS: admin sees every row. */
export async function getAllOrders(): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
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
