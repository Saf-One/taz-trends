"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartProvider";
import { useCartProducts } from "@/lib/cart/useCartProducts";
import { publicImageUrl } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";

export function CartView() {
  const { lines, setQty, remove, ready } = useCart();
  const { products, unitPaise, label, lineStock } = useCartProducts(lines);

  const subtotal = lines.reduce((sum, l) => sum + unitPaise(l) * l.quantity, 0);

  if (!ready) return <p className="text-ink/60">Loading cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink/60">Your cart is empty.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
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
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-blush">
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
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-sm">{label(line)}</span>
                    <button
                      className="text-lg text-ink/30 hover:text-red-600"
                      onClick={() => remove(line)}
                      title="Remove"
                      aria-label={`Remove ${label(line)} from cart`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-8 w-8 items-center justify-center text-lg font-bold text-ink/60 hover:text-ink"
                        aria-label="Decrease quantity"
                        onClick={() => {
                          if (line.quantity <= 1) {
                            remove(line);
                          } else {
                            setQty(line, line.quantity - 1);
                          }
                        }}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {line.quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center text-lg font-bold text-ink/60 hover:text-ink disabled:opacity-30"
                        aria-label="Increase quantity"
                        disabled={atStock}
                        title={atStock ? "No more stock available" : ""}
                        onClick={() => setQty(line, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-wine">
                      {formatPaise(unitPaise(line) * line.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="card h-fit p-4">
        <h2 className="font-serif text-lg">Summary</h2>
        <div className="mt-3 flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPaise(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Shipping & taxes calculated at checkout.
        </p>
        <Link href="/checkout" className="btn-primary mt-4 w-full">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
