import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, ProductWithRelations } from "@/types/db";

/**
 * Active products for the storefront grid. RLS already restricts anon reads
 * to `active`, but we filter explicitly too (admins would otherwise see all).
 */
export async function getActiveProducts(): Promise<ProductWithRelations[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductWithRelations[]) ?? [];
}

/** Single active product by slug (storefront detail). Null if not found. */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  return (data as ProductWithRelations) ?? null;
}

/** Whether a product has variants (drives simple vs. variant UI/logic). */
export function hasVariants(p: ProductWithRelations): boolean {
  return (p.product_variants?.length ?? 0) > 0;
}

/** Lowest listed price in paise (variant-aware) for display. */
export function displayPricePaise(p: ProductWithRelations): number {
  if (hasVariants(p)) {
    const prices = p.product_variants.map((v) => v.price_override ?? p.price);
    return Math.min(...prices);
  }
  return p.price;
}

/** Total available stock (variant-aware). */
export function totalStock(p: ProductWithRelations): number {
  if (hasVariants(p)) {
    return p.product_variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return p.stock;
}

export type { Product };
