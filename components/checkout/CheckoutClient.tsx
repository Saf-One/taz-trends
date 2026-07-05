"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCart, type CartLine } from "@/lib/cart/CartProvider";
import { formatPaise, STORE_NAME } from "@/lib/config";
import type { ProductWithRelations } from "@/types/db";

// Razorpay's checkout widget is loaded from their CDN and has no bundled
// types; typing the global loosely is the standard, justified exception.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

const RZP_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RZP_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutClient({ shippingPaise }: { shippingPaise: number }) {
  const router = useRouter();
  const { lines, count, refresh, ready } = useCart();
  const [products, setProducts] = useState<Record<string, ProductWithRelations>>({});
  const [offerCode, setOfferCode] = useState("");
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    postal: "",
  });
  const [busy, setBusy] = useState<null | "cod" | "razorpay">(null);
  const [error, setError] = useState<string | null>(null);

  const addressFilled =
    address.name.trim() &&
    address.phone.trim() &&
    address.street.trim() &&
    address.city.trim() &&
    address.postal.trim();

  const productIds = useMemo(
    () => Array.from(new Set(lines.map((l) => l.product_id))),
    [lines],
  );

  useEffect(() => {
    if (productIds.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .in("id", productIds)
      .then(({ data }) => {
        const map: Record<string, ProductWithRelations> = {};
        (data ?? []).forEach((p) => (map[(p as ProductWithRelations).id] = p as ProductWithRelations));
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

  const subtotal = lines.reduce((s, l) => s + unitPaise(l) * l.quantity, 0);
  const total = subtotal + shippingPaise;

  async function placeCod() {
    setBusy("cod");
    setError(null);
    const res = await fetch("/api/orders/cod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(json.error ?? "Could not place order.");
      return;
    }
    router.push(`/orders/${json.orderId}`);
  }

  async function payOnline() {
    setBusy("razorpay");
    setError(null);

    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerCode: offerCode || undefined,
        address,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setBusy(null);
      setError(
        json.error === "invalid_offer"
          ? "That offer code isn't valid."
          : json.error ?? "Could not start payment.",
      );
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      setBusy(null);
      setError("Could not load the payment widget.");
      return;
    }

    const rzp = new window.Razorpay({
      key: json.keyId,
      order_id: json.razorpayOrderId,
      amount: json.amount,
      currency: json.currency,
      name: STORE_NAME,
      description: "Order payment",
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const vr = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resp),
        });
        const vj = await vr.json();
        if (vr.ok) {
          // Don't refresh (cart still needed for next page). Just navigate.
          // Verify route will clear cart after confirming payment server-side.
          router.push(`/orders/${vj.orderId}`);
        } else {
          setError("Payment could not be verified. If charged, contact us.");
        }
      },
      modal: { ondismiss: () => setBusy(null) },
    });
    rzp.open();
  }

  if (ready && count === 0) {
    return (
      <p className="text-ink/60">
        Your cart is empty. <a href="/" className="text-wine underline">Shop now</a>.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Address */}
        <div className="card space-y-3 p-4">
          <h2 className="font-serif text-lg">Delivery address</h2>
          <input
            className="input"
            placeholder="Full name"
            value={address.name}
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Phone"
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          />
          <input
            className="input"
            placeholder="Street address"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
            <input
              className="input"
              placeholder="Postal code"
              value={address.postal}
              onChange={(e) => setAddress({ ...address, postal: e.target.value })}
            />
          </div>
        </div>

        {/* Offer code */}
        <div className="card p-4">
          <h2 className="font-serif text-lg">Have an offer code?</h2>
          <p className="mb-2 text-xs text-ink/50">
            Offer codes apply to online (Razorpay) payment only.
          </p>
          <input
            className="input"
            placeholder="Enter code"
            value={offerCode}
            onChange={(e) => setOfferCode(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="btn-primary"
            onClick={payOnline}
            disabled={busy !== null || !addressFilled}
            title={!addressFilled ? "Fill address first" : ""}
          >
            {busy === "razorpay" ? "Starting…" : "Pay online (Razorpay)"}
          </button>
          <button
            className="btn-outline"
            onClick={placeCod}
            disabled={busy !== null || !addressFilled}
            title={!addressFilled ? "Fill address first" : ""}
          >
            {busy === "cod" ? "Placing…" : "Cash on Delivery"}
          </button>
        </div>
      </div>

      <aside className="card h-fit p-4">
        <h2 className="font-serif text-lg">Summary</h2>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPaise(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shippingPaise === 0 ? "Free" : formatPaise(shippingPaise)}</span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-1 font-medium">
            <span>Total</span>
            <span>{formatPaise(total)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink/50">Prices include tax.</p>
      </aside>
    </div>
  );
}
