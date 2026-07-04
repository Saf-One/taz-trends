import { requireUser } from "@/lib/auth/session";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // Placing an order requires login (quote step may be pre-login).
  await requireUser("/checkout");

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Checkout</h1>
      <CheckoutClient shippingPaise={SHIPPING_FLAT_PAISE} />
    </div>
  );
}
