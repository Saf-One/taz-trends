import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/types/db";

/** All products regardless of status (admin only — RLS enforces is_admin). */
export async function getAllProductsAdmin(): Promise<ProductWithRelations[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .order("created_at", { ascending: false });
  return (data as ProductWithRelations[]) ?? [];
}

export async function getProductByIdAdmin(
  id: string,
): Promise<ProductWithRelations | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as ProductWithRelations) ?? null;
}
