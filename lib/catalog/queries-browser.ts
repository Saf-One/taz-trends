/**
 * Browser-compatible catalog queries (uses the browser Supabase client,
 * not next/headers). Safe to import from client components.
 */
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductWithRelations } from "@/types/db";

/** Active products for the storefront grid. Uses browser client (safe in "use client"). */
export async function getActiveProductsBrowser(): Promise<ProductWithRelations[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductWithRelations[]) ?? [];
}
