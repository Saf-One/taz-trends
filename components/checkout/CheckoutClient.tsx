"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartProvider";
import { useCartProducts } from "@/lib/cart/useCartProducts";
import { formatPaise, STORE_NAME } from "@/lib/config";
import { useToast } from "@/lib/notifications/ToastProvider";

// Razorpay's checkout widget is loaded from their CDN and has no bundled
// types; typing the global loosely is the standard, justified exception.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

const RZP_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const SAVED_ADDRESS_KEY = "taz_saved_address";

const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
const POSTAL_RE = /^\d{6}$/; // Indian PIN code

type Step = "address" | "payment" | "confirmation";

interface AddressFields {
  name: string;
  phone: string;
  street: string;
  city: string;
  postal: string;
}

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

const emptyAddress: AddressFields = {
  name: "",
  phone: "",
  street: "",
  city: "",
  postal: "",
};

export function CheckoutClient({ shippingPaise }: { shippingPaise: number }) {
  const router = useRouter();
  const { lines, count, refresh, ready } = useCart();
  const { unitPaise, label } = useCartProducts(lines);
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("address");
  const [offerCode, setOfferCode] = useState("");
  const [offerStatus, setOfferStatus] = useState<
    "idle" | "applied" | "error"
  >("idle");
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<null | "cod" | "razorpay">(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved address on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AddressFields;
        setAddress(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

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

  function setField(key: keyof AddressFields, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  function touch(key: string) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function clearAddress() {
    setAddress(emptyAddress);
    setTouched({});
    localStorage.removeItem(SAVED_ADDRESS_KEY);
  }

  const subtotal = lines.reduce((s, l) => s + unitPaise(l) * l.quantity, 0);
  const total = subtotal + shippingPaise;

  function handleApplyOffer() {
    if (offerCode.trim().toUpperCase() === "WELCOME10") {
      setOfferStatus("applied");
    } else {
      setOfferStatus("error");
    }
  }

  function proceedToPayment() {
    if (!addressValid) {
      // Touch all fields to show errors
      Object.keys(address).forEach((k) => touch(k));
      return;
    }
    setStep("payment");
  }

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
    // Save address for next time
    try {
      localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(address));
    } catch {
      // ignore
    }
    setStep("confirmation");
    toast("Order confirmed!", "success");
    router.push(`/orders/${json.orderId}`);
  }

  async function payOnline() {
    setBusy("razorpay");
    setError(null);

    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerCode: offerStatus === "applied" ? offerCode || undefined : undefined,
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
          // Save address for next time
          try {
            localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(address));
          } catch {
            // ignore
          }
          toast("Payment successful! Order confirmed.", "success");
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
    <div>
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2 text-xs sm:gap-4 sm:text-sm">
        {(["address", "payment", "confirmation"] as const).map((s, i) => {
          const stepIndex = ["address", "payment", "confirmation"].indexOf(step);
          const isActive = step === s;
          const isDone = stepIndex >= i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 ${
                  isActive
                    ? "bg-wine text-white"
                    : isDone
                    ? "bg-wine/10 text-wine"
                    : "bg-ink/5 text-ink/30"
                }`}
              >
                {isDone && stepIndex > i ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden sm:inline ${
                  isActive
                    ? "font-medium text-ink"
                    : isDone
                    ? "text-ink/60"
                    : "text-ink/30"
                }`}
              >
                {s === "address"
                  ? "Address"
                  : s === "payment"
                  ? "Payment"
                  : "Confirmation"}
              </span>
              {i < 2 && (
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 ${
                    stepIndex > i ? "text-wine/40" : "text-ink/20"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Order summary at top */}
      <div className="card mb-4 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink/60">
            {count} item{count === 1 ? "" : "s"} in your order
          </span>
          <span className="font-medium text-wine">
            Subtotal: {formatPaise(subtotal)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Address */}
          {step === "address" && (
            <div className="card space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg">Delivery address</h2>
                <button
                  onClick={clearAddress}
                  className="text-xs text-ink/40 hover:text-wine transition-colors"
                >
                  Clear saved address
                </button>
              </div>
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

              <button
                className="btn-primary w-full"
                onClick={proceedToPayment}
              >
                Continue to payment
              </button>
            </div>
          )}

          {/* Payment */}
          {step === "payment" && (
            <>
              {/* Address summary */}
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-sm">Delivery address</h2>
                  <button
                    onClick={() => setStep("address")}
                    className="text-xs text-wine hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-2 text-xs text-ink/70 space-y-0.5">
                  <p>{address.name}</p>
                  <p>{address.phone}</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city} – {address.postal}
                  </p>
                </div>
              </div>

              {/* Offer code */}
              <div className="card p-4">
                <h2 className="font-serif text-sm">Have an offer code?</h2>
                <p className="mb-2 text-xs text-ink/50">
                  Offer codes apply to online (Razorpay) payment only.
                </p>
                <div className="flex gap-2">
                  <input
                    id="offer-code"
                    className="input min-w-0 flex-1 text-sm"
                    placeholder="Enter code"
                    value={offerCode}
                    onChange={(e) => {
                      setOfferCode(e.target.value);
                      if (offerStatus !== "idle") setOfferStatus("idle");
                    }}
                  />
                  <button
                    onClick={handleApplyOffer}
                    disabled={!offerCode.trim() || offerStatus === "applied"}
                    className="btn-outline shrink-0 text-xs"
                  >
                    Apply
                  </button>
                </div>
                {offerStatus === "applied" && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    ✓ Applied
                  </p>
                )}
                {offerStatus === "error" && (
                  <p className="mt-1.5 text-xs text-red-500">
                    That offer code isn&apos;t valid.
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-md bg-wine px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-wine/90 disabled:opacity-50"
                  onClick={payOnline}
                  disabled={busy !== null}
                >
                  {busy === "razorpay" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Starting…
                    </span>
                  ) : (
                    "Pay online (Razorpay)"
                  )}
                </button>
                <button
                  className="rounded-md border-2 border-ink/10 bg-ink/5 px-4 py-3 text-sm font-medium text-ink/30 shadow-sm cursor-not-allowed"
                  disabled={true}
                >
                  Cash on Delivery (COD) — currently unavailable
                </button>
              </div>
            </>
          )}

          {/* Confirmation (shown briefly before redirect) */}
          {step === "confirmation" && (
            <div className="card p-8 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2 className="mt-3 font-serif text-xl text-ink">
                Order placed!
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Thank you for your purchase. Redirecting…
              </p>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
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
              <span className="text-ink/70">Subtotal</span>
              <span>{formatPaise(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/70">Shipping</span>
              <span>{shippingPaise === 0 ? "Free" : formatPaise(shippingPaise)}</span>
            </div>
            {offerStatus === "applied" && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPaise(10000)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ink/10 pt-1 font-medium">
              <span>Total</span>
              <span>{formatPaise(total)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink/50">Prices include tax.</p>
        </aside>
      </div>
    </div>
  );
}
