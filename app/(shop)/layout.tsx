import { CartProvider } from "@/lib/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { getProfile } from "@/lib/auth/session";

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
        <div
          className="container-page flex-1 py-8"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)), url(/images/body/logo_flower.png)',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            backgroundSize: 'auto',
            filter: 'drop-shadow(0 0 24px rgba(123, 45, 59, 0.15))',
          }}
        >
          {children}
        </div>
        <footer className="border-t border-ink/10 bg-logo-bg py-6 text-center text-xs text-ink/50">
          <div className="mb-2 flex justify-center">
            <div className="w-24">
              <BrandLogo />
            </div>
          </div>
          Women&apos;s ethnic fashion.
        </footer>
      </div>
    </CartProvider>
  );
}
