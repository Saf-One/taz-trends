import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/catalog/admin-queries";
import { getAllOrders, getAllQuotes } from "@/lib/checkout/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, orders, quotes] = await Promise.all([
    getAllProductsAdmin(),
    getAllOrders(),
    getAllQuotes(),
  ]);

  const openCod = orders.filter((o) => o.status === "cash_on_delivery").length;
  const newQuotes = quotes.filter((q) => q.status === "new").length;

  const cards = [
    { label: "Products", value: products.length, href: "/admin/products" },
    { label: "Orders", value: orders.length, href: "/admin/orders" },
    { label: "COD to action", value: openCod, href: "/admin/orders" },
    { label: "New quotes", value: newQuotes, href: "/admin/quotes" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-4 hover:border-wine/40">
            <p className="text-3xl font-semibold text-wine">{c.value}</p>
            <p className="text-sm text-ink/60">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
