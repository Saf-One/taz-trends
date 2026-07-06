"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { useCartProducts } from "@/lib/cart/useCartProducts";
import { publicImageUrl } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import { EmptyState } from "@/components/ui/EmptyState";
import { validateOfferCodeAction } from "@/lib/offers/actions";

const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999

export function CartView() {
  const { lines, setQty, remove, ready } = useCart();
  const { products, unitPaise, label, lineStock } = useCartProducts(lines);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + unitPaise(l) * l.quantity, 0),
    [lines, unitPaise],
  );

  const remainingForFree = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PAISE - subtotal,
  );
  const freeProgressPct = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD_PAISE) * 100,
  );

  async function handleApplyCoupon() {
    const result = await validateOfferCodeAction(couponCode);
    if (result.valid) {
      setCouponApplied(true);
      setCouponError(null);
    } else {
      setCouponError("Invalid coupon code. Please try again.");
      setCouponApplied(false);
    }
  }

  if (!ready)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wine border-t-transparent" />
      </div>
    );

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-20 w-20">
            <rect x="12" y="18" width="40" height="40" rx="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 18V16a10 10 0 0 1 20 0v2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 30h8M28 38h8" strokeLinecap="round" />
          </svg>
        }
        title="Your cart is empty"
        description="Looks like you haven't added anything yet. Start shopping and find your perfect look."
        actionLabel="Start Shopping"
        actionHref="/"
      />
    );
  }

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">

        {/* Cart items */}
        <ul className="space-y-4">
          {lines.map((line) => {
            const p = products[line.product_id];
            const primary =
              p?.product_images.find((i) => i.is_primary) ??
              p?.product_images[0];
            const img = publicImageUrl(primary?.storage_path);
            const key = `${line.product_id}:${line.variant_id ?? "null"}`;
            const atStock = line.quantity >= lineStock(line);
            return (
              <li key={key} className="card flex gap-4 p-3">
                <Link href={`/products/${p?.slug ?? ""}`} className="h-24 w-20 shrink-0 overflow-hidden rounded bg-blush">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/products/${p?.slug ?? ""}`}
                      className="font-serif text-sm text-ink hover:text-wine transition-colors"
                    >
                      {label(line)}
                    </Link>
                    <button
                      className="text-lg text-ink/30 hover:text-red-600 transition-colors"
                      onClick={() => remove(line)}
                      title="Remove"
                      aria-label={`Remove ${label(line)} from cart`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Polished quantity selector */}
                    <div className="flex items-center gap-1 rounded-md border border-ink/20">
                      <button
                        className="flex h-8 w-8 items-center justify-center text-sm font-medium text-ink/60 hover:bg-blush hover:text-ink rounded-l-md transition-colors"
                        aria-label="Decrease quantity"
                        onClick={() => {
                          if (line.quantity <= 1) {
                            remove(line);
                          } else {
                            setQty(line, line.quantity - 1);
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center border-x border-ink/10 text-sm font-medium">
                        {line.quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center text-sm font-medium text-ink/60 hover:bg-blush hover:text-ink rounded-r-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Increase quantity"
                        disabled={atStock}
                        title={atStock ? "No more stock available" : ""}
                        onClick={() => setQty(line, line.quantity + 1)}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm font-medium text-wine">
                      {formatPaise(unitPaise(line) * line.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Summary sidebar */}
      <aside className="space-y-4">
        <div className="card h-fit p-4">
          <h2 className="font-serif text-lg">Summary</h2>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-ink/70">Subtotal</span>
            <span>{formatPaise(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-ink/70">Shipping</span>
            <span className="text-green-600">
              {subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? "Free" : "Calculated at checkout"}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Taxes included where applicable.
          </p>
          <Link href="/checkout" className="btn-primary mt-4 w-full text-center">
            Proceed to checkout
          </Link>
        </div>

        {/* Coupon input */}
        <div className="card p-4">
          <h2 className="font-serif text-sm">Have a coupon?</h2>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                if (couponApplied) setCouponApplied(false);
                if (couponError) setCouponError(null);
              }}
              placeholder="Enter code"
              className="input min-w-0 flex-1 text-sm"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || couponApplied}
              className="btn-outline shrink-0 text-xs"
            >
              Apply
            </button>
          </div>
          {couponApplied && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Coupon applied!
            </p>
          )}
          {couponError && (
            <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
          )}
          <p className="mt-1 text-[10px] text-ink/40">
            Enter a valid offer code
          </p>
        </div>
      </aside>
    </div>
  );
}
