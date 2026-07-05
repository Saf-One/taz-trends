"use client";

import { useEffect } from "react";

/**
 * Client-side helper for the product detail page.
 * - Records the product slug in recently-viewed localStorage.
 */
export function DetailClient({ product }: { product: { slug: string; title: string } }) {
  // Record this product as recently viewed on mount
  useEffect(() => {
    try {
      const key = "taz_recently_viewed";
      const raw = localStorage.getItem(key);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      // Prepend, remove duplicates, keep max 20
      const updated = [
        product.slug,
        ...viewed.filter((s: string) => s !== product.slug),
      ].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // localStorage may be blocked
    }
  }, [product.slug]);

  return null;
}
