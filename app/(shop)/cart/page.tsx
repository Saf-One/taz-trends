import { CartView } from "@/components/cart/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Your cart</h1>
      <CartView />
    </div>
  );
}
