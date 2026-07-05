"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CartLine } from "@/lib/cart/CartProvider";
import type { ProductWithRelations } from "@/types/db";

/**
 * Shared cart-line helpers: fetches the products behind a set of cart lines
 * and derives unit price / display label / available stock per line.
 * Single source for CartView + CheckoutClient (was duplicated in both).
 */
export function useCartProducts(lines: CartLine[]) {
  const [products, setProducts] = useState<
    Record<string, ProductWithRelations>
  >({});

  const productIds = useMemo(
    () => Array.from(new Set(lines.map((l) => l.product_id))),
    [lines],
  );

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts({});
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .in("id", productIds)
      .then(({ data }) => {
        const map: Record<string, ProductWithRelations> = {};
        (data ?? []).forEach(
          (p) =>
            (map[(p as ProductWithRelations).id] = p as ProductWithRelations),
        );
        setProducts(map);
      });
  }, [productIds]);

  function unitPaise(line: CartLine): number {
    const p = products[line.product_id];
    if (!p) return 0;
    if (line.variant_id) {
      const v = p.product_variants.find((x) => x.id === line.variant_id);
      return v?.price_override ?? p.price;
    }
    return p.price;
  }

  function label(line: CartLine): string {
    const p = products[line.product_id];
    if (!p) return "…";
    if (line.variant_id) {
      const v = p.product_variants.find((x) => x.id === line.variant_id);
      return `${p.title}${v ? ` - ${v.variant_value}` : ""}`;
    }
    return p.title;
  }

  /** Available stock for this line (variant stock when a variant). */
  function lineStock(line: CartLine): number {
    const p = products[line.product_id];
    if (!p) return Infinity; // unknown yet - don't block the UI
    if (line.variant_id) {
      const v = p.product_variants.find((x) => x.id === line.variant_id);
      return v?.stock ?? 0;
    }
    return p.stock;
  }

  return { products, unitPaise, label, lineStock };
}
