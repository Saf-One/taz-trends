"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductWithRelations } from "@/types/db";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPaise } from "@/lib/config";

export function AddToCartForm({ product }: { product: ProductWithRelations }) {
  const { add, lines, setQty, remove } = useCart();
  const variants = product.product_variants ?? [];
  const hasVariants = variants.length > 0;

  const [variantId, setVariantId] = useState<string | null>(
    hasVariants ? (variants.find((v) => v.stock > 0)?.id ?? variants[0].id) : null,
  );
  const [busy, setBusy] = useState(false);

  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === variantId) ?? null
    : null;

  const unitPaise = selectedVariant
    ? (selectedVariant.price_override ?? product.price)
    : product.price;

  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const soldOut = stock <= 0;

  const cartLine = lines.find(
    (l) => l.product_id === product.id && l.variant_id === (hasVariants ? variantId : null),
  );
  const cartQty = cartLine?.quantity ?? 0;

  async function onAdd() {
    setBusy(true);
    await add(product.id, hasVariants ? variantId : null, 1);
    setBusy(false);
  }

  function onDecrement() {
    if (!cartLine) return;
    setBusy(true);
    if (cartLine.quantity <= 1) {
      remove(cartLine);
    } else {
      setQty(cartLine, cartLine.quantity - 1);
    }
    setBusy(false);
  }

  function onIncrement() {
    if (!cartLine) return;
    if (cartLine.quantity >= stock) return; // can't exceed available stock
    setBusy(true);
    setQty(cartLine, cartLine.quantity + 1);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xl text-wine">{formatPaise(unitPaise)}</p>

      {hasVariants && (
        <div className="block">
          <span className="mb-2 block text-sm text-ink/70">
            {variants[0].variant_name}
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                }}
                disabled={v.stock <= 0}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  variantId === v.id
                    ? "bg-wine text-white"
                    : "border border-wine/40 text-wine hover:bg-wine/5 disabled:border-ink/20 disabled:text-ink/30"
                } disabled:cursor-not-allowed`}
              >
                {v.variant_value}
              </button>
            ))}
          </div>
        </div>
      )}

      {cartQty > 0 ? (
        <div className="flex items-center gap-2">
          <button
            className="flex-1 rounded-md border border-wine/40 px-3 py-2 font-bold text-wine hover:bg-wine/5 disabled:border-ink/20 disabled:text-ink/30"
            onClick={onDecrement}
            disabled={busy}
          >
            −
          </button>
          <span className="flex-1 text-center font-medium">{cartQty}</span>
          <button
            className="flex-1 rounded-md border border-wine/40 px-3 py-2 font-bold text-wine hover:bg-wine/5 disabled:border-ink/20 disabled:text-ink/30"
            onClick={onIncrement}
            disabled={busy || cartQty >= stock}
            title={cartQty >= stock ? "No more stock available" : ""}
          >
            +
          </button>
        </div>
      ) : (
        <button
          className="btn-primary w-full"
          onClick={onAdd}
          disabled={soldOut || busy}
        >
          {soldOut ? "Sold out" : busy ? "Adding…" : "Add to cart"}
        </button>
      )}
    </div>
  );
}
