import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandLogo } from "@/components/layout/BrandLogo";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/quotes", label: "Quotes" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: redirects non-admins. Middleware already enforced "logged in".
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-ink/10 bg-white p-4">
        <div className="mb-2 w-32">
          <BrandLogo href="/admin" />
        </div>
        <p className="mb-4 text-xs text-ink/40">Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded px-2 py-1.5 hover:bg-blush"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-2">
          <Link href="/" className="block text-xs text-ink/50 hover:text-wine">
            ← Back to store
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 bg-blush/40 p-8">{children}</main>
    </div>
  );
}
