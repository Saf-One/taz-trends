"use client";

import { useMemo, useState } from "react";
import type { ProductWithRelations } from "@/types/db";
import { ProductCard } from "./ProductCard";

const CATEGORY_FILTERS = [
  "All",
  "Sarees",
  "Suits",
  "Lehengas",
  "Kurtis",
  "Accessories",
] as const;

const PRICE_FILTERS = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under ₹1,000", min: 0, max: 100000 },
  { label: "₹1,000 – ₹3,000", min: 100000, max: 300000 },
  { label: "₹3,000 – ₹5,000", min: 300000, max: 500000 },
  { label: "Above ₹5,000", min: 500000, max: Infinity },
] as const;

function matchesCategory(
  product: ProductWithRelations,
  category: string,
): boolean {
  if (category === "All") return true;
  const search = category.toLowerCase();
  const title = product.title.toLowerCase();
  const slug = product.slug.toLowerCase();
  return title.includes(search) || slug.includes(search);
}

function matchesPriceRange(
  product: ProductWithRelations,
  min: number,
  max: number,
): boolean {
  const variants = product.product_variants ?? [];
  if (variants.length > 0) {
    return variants.some((v) => {
      const p = v.price_override ?? product.price;
      return p >= min && p <= max;
    });
  }
  return product.price >= min && product.price <= max;
}

export function ProductGrid({
  products,
}: {
  products: ProductWithRelations[];
}) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceFilterIndex, setPriceFilterIndex] = useState(0);

  const filtered = useMemo(() => {
    const pf = PRICE_FILTERS[priceFilterIndex];
    return products.filter((p) => {
      if (!matchesCategory(p, categoryFilter)) return false;
      if (!matchesPriceRange(p, pf.min, pf.max)) return false;
      return true;
    });
  }, [products, categoryFilter, priceFilterIndex]);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-ink/60">
        No products yet. Add some from the admin dashboard.
      </p>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 space-y-3">
        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-wine text-white"
                  : "border border-ink/20 text-ink/60 hover:border-wine/40 hover:text-wine"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price range pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRICE_FILTERS.map((pf, i) => (
            <button
              key={pf.label}
              onClick={() => setPriceFilterIndex(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                priceFilterIndex === i
                  ? "bg-wine text-white"
                  : "border border-ink/20 text-ink/60 hover:border-wine/40 hover:text-wine"
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-ink/40">
        {filtered.length === products.length
          ? `${products.length} product${products.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${products.length} product${products.length === 1 ? "" : "s"}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-12 w-12 text-ink/20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <p className="mt-2 text-sm text-ink/50">
            No products match these filters.
          </p>
          <button
            onClick={() => {
              setCategoryFilter("All");
              setPriceFilterIndex(0);
            }}
            className="btn-outline mt-3 text-xs"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
