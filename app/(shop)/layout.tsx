import { CartProvider } from "@/lib/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { getProfile } from "@/lib/auth/session";
import { STORE_NAME } from "@/lib/config";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <div className="bg-logo-bg">
          <Header
            userEmail={profile?.email ?? null}
            isAdmin={profile?.is_admin ?? false}
          />
        </div>
        <div className="container-page flex-1 py-8">{children}</div>
        <footer className="border-t border-ink/10 bg-logo-bg py-6 text-center text-xs text-ink/50">
          © {STORE_NAME}. Women&apos;s ethnic fashion.
        </footer>
      </div>
    </CartProvider>
  );
}
