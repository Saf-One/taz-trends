import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AdminNav } from "@/components/admin/AdminNav";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: redirects non-admins. Middleware already enforced "logged in".
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white px-4 pt-3 md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <div className="w-28">
            <BrandLogo href="/admin" />
          </div>
          <Link href="/" className="text-xs text-ink/50 hover:text-wine">
            ← Store
          </Link>
        </div>
        <AdminNav layout="topbar" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-ink/10 bg-white p-4 md:flex md:flex-col">
        <div className="mb-2 w-32">
          <BrandLogo href="/admin" />
        </div>
        <p className="mb-4 text-xs uppercase tracking-widest text-ink/40">
          Admin
        </p>
        <AdminNav layout="sidebar" />
        <div className="mt-auto space-y-2 pt-6">
          <Link href="/" className="block text-xs text-ink/50 hover:text-wine">
            ← Back to store
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 bg-blush/40 p-4 sm:p-6 md:p-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
