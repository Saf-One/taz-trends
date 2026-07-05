import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/catalog/admin-queries";
import { getAllOrders, getAllQuotes } from "@/lib/checkout/admin-queries";
import { getAllOffers } from "@/lib/offers/queries";

export const dynamic = "force-dynamic";

function BarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => {
        const h = Math.max((d.value / max) * 100, 4);
        return (
          <div
            key={d.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-xs font-semibold text-ink">{d.value}</span>
            <div
              className="w-full rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor: d.color,
                minHeight: 4,
              }}
            />
            <span className="text-[10px] text-ink/50">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({
  segments,
  size = 100,
}: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = segments.map((seg) => {
    const fraction = seg.value / total;
    const length = fraction * circumference;
    const dash = `${length} ${circumference - length}`;
    const dashOffset = -offset;
    offset += length;
    return { ...seg, dash, dashOffset };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f3f3" strokeWidth="10" />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="10"
          strokeDasharray={s.dash}
          strokeDashoffset={s.dashOffset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default async function AdminHome() {
  const [products, orders, quotes] = await Promise.all([
    getAllProductsAdmin(),
    getAllOrders(),
    getAllQuotes(),
  ]);

  const offersCount = (await getAllOffers()).length;

  // Order status breakdown
  const orderStatusCounts: Record<string, number> = {};
  for (const o of orders) {
    orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1;
  }

  // Product status breakdown
  const productStatusCounts: Record<string, number> = { draft: 0, active: 0, archived: 0 };
  for (const p of products) {
    if (p.status in productStatusCounts) productStatusCounts[p.status]++;
  }

  // Revenue calculation (completed orders)
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const openCod = orders.filter((o) => o.status === "cash_on_delivery").length;
  const newQuotes = quotes.filter((q) => q.status === "new").length;
  const activeProducts = products.filter((p) => p.status === "active").length;

  const statCards = [
    {
      label: "Products",
      value: products.length,
      sub: `${activeProducts} active`,
      href: "/admin/products",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      color: "text-wine",
    },
    {
      label: "Orders",
      value: orders.length,
      sub: `${openCod} COD to action`,
      href: "/admin/orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
        </svg>
      ),
      color: "text-gold",
    },
    {
      label: "Revenue",
      value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`,
      sub: `from delivered orders`,
      href: "/admin/orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: "text-emerald-600",
    },
    {
      label: "Quotes",
      value: quotes.length,
      sub: `${newQuotes} new`,
      href: "/admin/quotes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Dashboard</h1>
        <Link href="/admin/products/new" className="btn-primary btn-sm">
          + New product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card card-hover group p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={c.color}>{c.icon}</span>
              <span className="text-xs text-ink/30 group-hover:text-wine transition-colors">
                →
              </span>
            </div>
            <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
            <p className="mt-0.5 text-xs text-ink/50">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order status bar chart */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-base text-ink">Orders by status</h2>
          {orders.length > 0 ? (
            <BarChart
              data={[
                { label: "Pending", value: orderStatusCounts.pending || 0, color: "#f59e0b" },
                { label: "Processing", value: orderStatusCounts.processing || 0, color: "#0ea5e9" },
                { label: "Shipped", value: orderStatusCounts.shipped || 0, color: "#8b5cf6" },
                { label: "Delivered", value: orderStatusCounts.delivered || 0, color: "#10b981" },
                { label: "COD", value: orderStatusCounts.cash_on_delivery || 0, color: "#7b2d3b" },
                { label: "Cancelled", value: orderStatusCounts.cancelled || 0, color: "#a1a1aa" },
              ]}
            />
          ) : (
            <p className="py-8 text-center text-sm text-ink/50">No orders yet</p>
          )}
        </div>

        {/* Product status donut */}
        <div className="card p-5">
          <h2 className="mb-4 font-serif text-base text-ink">Products by status</h2>
          <div className="flex items-center gap-6">
            <DonutChart
              segments={[
                { value: productStatusCounts.active, color: "#10b981" },
                { value: productStatusCounts.draft, color: "#d4d4d8" },
                { value: productStatusCounts.archived, color: "#a1a1aa" },
              ]}
              size={100}
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-ink/70">Active</span>
                <span className="ml-auto font-medium">{productStatusCounts.active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="text-ink/70">Draft</span>
                <span className="ml-auto font-medium">{productStatusCounts.draft}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
                <span className="text-ink/70">Archived</span>
                <span className="ml-auto font-medium">{productStatusCounts.archived}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions / summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/orders" className="card flex items-center gap-4 p-4 transition-colors hover:border-wine/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium">{openCod} COD order{openCod !== 1 ? "s" : ""}</p>
            <p className="text-xs text-ink/50">Needs fulfilment</p>
          </div>
        </Link>
        <Link href="/admin/quotes" className="card flex items-center gap-4 p-4 transition-colors hover:border-wine/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium">{newQuotes} new quote{newQuotes !== 1 ? "s" : ""}</p>
            <p className="text-xs text-ink/50">Awaiting response</p>
          </div>
        </Link>
        <Link href="/admin/offers" className="card flex items-center gap-4 p-4 transition-colors hover:border-wine/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wine/10 text-wine">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium">{offersCount} offer{offersCount !== 1 ? "s" : ""}</p>
            <p className="text-xs text-ink/50">Discount campaigns</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
