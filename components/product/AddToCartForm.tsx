"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductWithRelations } from "@/types/db";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPaise } from "@/lib/config";

export function AddToCartForm({ product }: { product: ProductWithRelations }) {
  const { add } = useCart();
  const variants = product.product_variants ?? [];
  const hasVariants = variants.length > 0;

  const [variantId, setVariantId] = useState<string | null>(
    hasVariants ? (variants.find((v) => v.stock > 0)?.id ?? variants[0].id) : null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === variantId) ?? null
    : null;

  const unitPaise = selectedVariant
    ? (selectedVariant.price_override ?? product.price)
    : product.price;

  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const soldOut = stock <= 0;

  async function onAdd() {
    setBusy(true);
    await add(product.id, hasVariants ? variantId : null, qty);
    setBusy(false);
    setAdded(true);
  }

  return (
    <div className="space-y-4">
      <p className="text-xl text-wine">{formatPaise(unitPaise)}</p>

      {hasVariants && (
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">
            {variants[0].variant_name}
          </span>
          <select
            className="input"
            value={variantId ?? ""}
            onChange={(e) => {
              setVariantId(e.target.value);
              setAdded(false);
            }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.variant_value}
                {v.stock <= 0 ? " — sold out" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-ink/70">Quantity</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, stock)}
          value={qty}
          onChange={(e) => {
            setQty(Math.max(1, Number(e.target.value) || 1));
            setAdded(false);
          }}
          className="input w-24"
          disabled={soldOut}
        />
      </label>

      <button
        className="btn-primary w-full"
        onClick={onAdd}
        disabled={soldOut || busy}
      >
        {soldOut ? "Sold out" : busy ? "Adding…" : "Add to cart"}
      </button>

      {added && (
        <p className="text-sm text-ink/70">
          Added.{" "}
          <Link href="/cart" className="text-wine underline">
            Go to cart
          </Link>
        </p>
      )}
    </div>
  );
}
