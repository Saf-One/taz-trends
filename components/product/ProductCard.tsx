"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductWithRelations } from "@/types/db";
import { carouselImages } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import {
  displayPricePaise,
  hasVariants,
  totalStock,
} from "@/lib/catalog/queries-utils";
import { ImageCarousel } from "./ImageCarousel";
import { useCart } from "@/lib/cart/CartProvider";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const { add } = useCart();
  const images = carouselImages(product.product_images, product.title);
  const price = displayPricePaise(product);
  const soldOut = totalStock(product) <= 0;
  const hasVariant = hasVariants(product);
  const variants = product.product_variants ?? [];
  const [showVariants, setShowVariants] = useState<"add" | "buy" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Discount percentage badge
  const compareAt = product.compare_at_price ?? null;
  const discountPct =
    compareAt && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;

  async function quickAdd(variantId: string | null) {
    setBusy("add");
    await add(product.id, variantId, 1);
    setBusy(null);
    setShowVariants(null);
  }

  async function buyNow(variantId: string | null) {
    setBusy("buy");
    await add(product.id, variantId, 1);
    setBusy(null);
    setShowVariants(null);
    router.push("/checkout");
  }

  async function handleShare() {
    const url = `${window.location.origin}/products/${product.slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="card group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:border-wine/30">
      <Link
        href={`/products/${product.slug}`}
        className="block"
      >
        {/* Image area */}
        <div className="relative overflow-hidden">
          {images.length > 0 ? (
            <div className="transition-transform duration-300 group-hover:scale-105">
              <ImageCarousel images={images} />
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-blush text-ink/30">
              <span className="font-serif text-sm">{product.title}</span>
            </div>
          )}

          {/* Sold out badge */}
          {soldOut && (
            <span className="absolute left-2 top-2 z-10 rounded bg-ink/80 px-2 py-0.5 text-xs text-white">
              Sold out
            </span>
          )}

          {/* Discount badge */}
          {discountPct && !soldOut && (
            <span className="absolute left-2 top-2 z-10 rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
              {discountPct}% OFF
            </span>
          )}

          {/* Share button on hover */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare();
            }}
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink/60 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-wine group-hover:opacity-100"
            aria-label="Share"
            title="Share"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          {/* Quick add button on hover (desktop) / always visible (mobile) */}
          {!soldOut && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full p-2 transition-transform duration-200 group-hover:translate-y-0 md:group-hover:translate-y-0 max-md:translate-y-0">
              {!hasVariant ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    quickAdd(null);
                  }}
                  disabled={busy !== null}
                  className="w-full rounded-md bg-wine py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-wine/90 disabled:opacity-60"
                >
                  {busy === "add" ? "Adding…" : "Add to cart"}
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVariants(showVariants === "add" ? null : "add");
                    }}
                    disabled={busy !== null}
                    className="w-full rounded-md bg-wine py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-wine/90"
                  >
                    {busy === "add" ? "Adding…" : "Add to cart"}
                  </button>
                  {showVariants === "add" && (
                    <div
                      className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-lg border border-ink/10 bg-white p-3 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink/50">
                        {variants[0]?.variant_name ?? "Options"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              quickAdd(v.id);
                            }}
                            disabled={v.stock <= 0}
                            className="rounded-md border border-wine/30 px-2.5 py-1 text-xs font-medium text-wine transition-colors hover:bg-wine hover:text-white disabled:border-ink/20 disabled:text-ink/30 disabled:hover:bg-transparent"
                          >
                            {v.variant_value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="p-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-serif text-sm text-ink group-hover:text-wine transition-colors">
            {product.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-wine">
            {hasVariants(product) ? "From " : ""}
            {formatPaise(price)}
          </p>
          {discountPct && (
            <p className="text-xs text-ink/40 line-through">
              {formatPaise(compareAt!)}
            </p>
          )}
        </div>
        {/* Buy now link */}
        {!soldOut && (
          <div className="mt-2 flex items-center justify-between">
            {!hasVariant ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  buyNow(null);
                }}
                disabled={busy !== null}
                className="text-xs font-medium text-wine/70 hover:text-wine disabled:opacity-50"
              >
                {busy === "buy" ? "Redirecting…" : "Buy now"}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVariants(showVariants === "buy" ? null : "buy");
                }}
                className="text-xs font-medium text-wine/70 hover:text-wine"
              >
                Buy now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Variant popover for Buy now */}
      {hasVariant && showVariants === "buy" && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowVariants(null)}
        >
          <div
            className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-lg border border-ink/10 bg-white p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ bottom: "auto", top: "auto" }}
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink/50">
              Select {variants[0]?.variant_name ?? "option"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => buyNow(v.id)}
                  disabled={v.stock <= 0}
                  className="rounded-md border border-wine/30 px-2.5 py-1 text-xs font-medium text-wine transition-colors hover:bg-wine hover:text-white disabled:border-ink/20 disabled:text-ink/30"
                >
                  {v.variant_value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
