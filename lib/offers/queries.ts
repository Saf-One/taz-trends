import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Offer } from "@/types/db";

/** All offers for the admin screen (RLS: admin sees all). */
export async function getAllOffers(): Promise<Offer[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Offer[]) ?? [];
}
