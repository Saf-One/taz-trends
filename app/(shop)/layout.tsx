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
      <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
        <div className="bg-logo-bg">
          <Header
            userEmail={profile?.email ?? null}
            isAdmin={profile?.is_admin ?? false}
          />
        </div>
        <div
          className="container-page flex-1 py-8 bg-flower-logo"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)), url(/images/body/logo_flower.png)',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {children}
        </div>
        {/* Multi-column footer */}
        <footer className="border-t border-ink/10 bg-logo-bg">
          <div className="container-page py-8 sm:py-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
              {/* Column 1: Brand */}
              <div>
                <div className="mb-3 w-24">
                  <BrandLogo />
                </div>
                <p className="text-xs text-ink/50 leading-relaxed">
                  Women&apos;s ethnic fashion. Handpicked quality, traditional
                  craftsmanship with a modern touch.
                </p>
                <div className="mt-4 flex gap-3">
                  {/* Instagram */}
                  <a href="https://instagram.com/taz.trends" className="text-ink/30 hover:text-wine transition-colors" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 010 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z" />
                    </svg>
                  </a>
                  {/* Facebook */}
                  <a href="#" className="text-ink/30 hover:text-wine transition-colors" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="#" className="text-ink/30 hover:text-wine transition-colors" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Column 2: Quick Links */}
              <div>
                <h3 className="mb-3 font-serif text-sm font-medium text-ink">
                  Quick Links
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/" className="text-xs text-ink/50 hover:text-wine transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-xs text-ink/50 hover:text-wine transition-colors">
                      Products
                    </a>
                  </li>
                  <li>
                    <a href="/cart" className="text-xs text-ink/50 hover:text-wine transition-colors">
                      Cart
                    </a>
                  </li>
                  <li>
                    <a href="/orders" className="text-xs text-ink/50 hover:text-wine transition-colors">
                      Orders
                    </a>
                  </li>
                  <li>
                    <a href="/quote" className="text-xs text-ink/50 hover:text-wine transition-colors">
                      Request Quote
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 4: Stay Updated */}
              <div>
                <h3 className="mb-3 font-serif text-sm font-medium text-ink">
                  Stay Updated
                </h3>
                <p className="mb-3 text-xs text-ink/50">
                  Subscribe to get updates on new arrivals and exclusive offers.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="input min-w-0 flex-1 text-xs"
                    readOnly
                  />
                  <button className="btn-primary shrink-0 text-xs">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="border-t border-ink/10">
            <div className="container-page flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-between">
              <p className="text-[10px] text-ink/40">
                &copy; {new Date().getFullYear()} Taz Trends. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
