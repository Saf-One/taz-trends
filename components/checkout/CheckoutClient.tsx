"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { useCartProducts } from "@/lib/cart/useCartProducts";
import { formatPaise, STORE_NAME } from "@/lib/config";

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

const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
const POSTAL_RE = /^\d{6}$/; // Indian PIN code

export function CheckoutClient({ shippingPaise }: { shippingPaise: number }) {
  const router = useRouter();
  const { lines, count, refresh, ready } = useCart();
  const { unitPaise, label } = useCartProducts(lines);
  const [offerCode, setOfferCode] = useState("");
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    postal: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<null | "cod" | "razorpay">(null);
  const [error, setError] = useState<string | null>(null);

  const fieldError: Record<string, string | null> = {
    name: address.name.trim() ? null : "Enter the recipient's name",
    phone: PHONE_RE.test(address.phone.trim())
      ? null
      : "Enter a 10-digit mobile number",
    street: address.street.trim() ? null : "Enter the street address",
    city: address.city.trim() ? null : "Enter the city",
    postal: POSTAL_RE.test(address.postal.trim())
      ? null
      : "Enter the 6-digit PIN code",
  };
  const addressValid = Object.values(fieldError).every((e) => e === null);

  function setField(key: keyof typeof address, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  function touch(key: string) {
    setTouched((t) => ({ ...t, [key]: true }));
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
          refresh();
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
        Your cart is empty.{" "}
        <a href="/" className="text-wine underline">
          Shop now
        </a>
        .
      </p>
    );
  }

  const inputCls = (key: string) =>
    `input ${touched[key] && fieldError[key] ? "border-red-400" : ""}`;

  function FieldHint({ k }: { k: string }) {
    if (!touched[k] || !fieldError[k]) return null;
    return <p className="mt-1 text-xs text-red-600">{fieldError[k]}</p>;
  }

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Address */}
        <div className="card space-y-3 p-4">
          <h2 className="font-serif text-lg">Delivery address</h2>
          <div>
            <label htmlFor="addr-name" className="mb-1 block text-sm text-ink/70">
              Full name
            </label>
            <input
              id="addr-name"
              className={inputCls("name")}
              autoComplete="name"
              value={address.name}
              onChange={(e) => setField("name", e.target.value)}
              onBlur={() => touch("name")}
            />
            <FieldHint k="name" />
          </div>
          <div>
            <label htmlFor="addr-phone" className="mb-1 block text-sm text-ink/70">
              Mobile number
            </label>
            <input
              id="addr-phone"
              className={inputCls("phone")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="10-digit mobile"
              value={address.phone}
              onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
              onBlur={() => touch("phone")}
            />
            <FieldHint k="phone" />
          </div>
          <div>
            <label htmlFor="addr-street" className="mb-1 block text-sm text-ink/70">
              Street address
            </label>
            <input
              id="addr-street"
              className={inputCls("street")}
              autoComplete="street-address"
              placeholder="House no., street, area"
              value={address.street}
              onChange={(e) => setField("street", e.target.value)}
              onBlur={() => touch("street")}
            />
            <FieldHint k="street" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="addr-city" className="mb-1 block text-sm text-ink/70">
                City
              </label>
              <input
                id="addr-city"
                className={inputCls("city")}
                autoComplete="address-level2"
                value={address.city}
                onChange={(e) => setField("city", e.target.value)}
                onBlur={() => touch("city")}
              />
              <FieldHint k="city" />
            </div>
            <div>
              <label htmlFor="addr-postal" className="mb-1 block text-sm text-ink/70">
                PIN code
              </label>
              <input
                id="addr-postal"
                className={inputCls("postal")}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={address.postal}
                onChange={(e) =>
                  setField("postal", e.target.value.replace(/\D/g, ""))
                }
                onBlur={() => touch("postal")}
              />
              <FieldHint k="postal" />
            </div>
          </div>
        </div>

        {/* Offer code */}
        <div className="card p-4">
          <h2 className="font-serif text-lg">Have an offer code?</h2>
          <p className="mb-2 text-xs text-ink/50">
            Offer codes apply to online (Razorpay) payment only.
          </p>
          <label htmlFor="offer-code" className="sr-only">
            Offer code
          </label>
          <input
            id="offer-code"
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
            disabled={busy !== null || !addressValid}
            title={!addressValid ? "Fill the delivery address first" : ""}
          >
            {busy === "razorpay" ? "Starting…" : "Pay online (Razorpay)"}
          </button>
          <button
            className="btn-outline"
            onClick={placeCod}
            disabled={busy !== null || !addressValid}
            title={!addressValid ? "Fill the delivery address first" : ""}
          >
            {busy === "cod" ? "Placing…" : "Cash on Delivery"}
          </button>
        </div>
      </div>

      <aside className="card h-fit p-4">
        <h2 className="font-serif text-lg">Summary</h2>
        <ul className="mt-3 space-y-1 text-sm text-ink/70">
          {lines.map((l) => (
            <li
              key={`${l.product_id}:${l.variant_id ?? "null"}`}
              className="flex justify-between gap-2"
            >
              <span className="truncate">
                {l.quantity} × {label(l)}
              </span>
              <span className="shrink-0">
                {formatPaise(unitPaise(l) * l.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-ink/10 pt-2 text-sm">
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
