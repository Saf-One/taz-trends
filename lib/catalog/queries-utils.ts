/**
 * Pure utility functions for product/catalog logic.
 * Safe to import from client components (no Supabase server client dependency).
 */
import type { ProductWithRelations } from "@/types/db";

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
