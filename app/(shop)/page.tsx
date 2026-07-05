import { getActiveProducts } from "@/lib/catalog/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import type { ProductWithRelations } from "@/types/db";

// Product availability changes; don't statically cache the storefront.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  let products: ProductWithRelations[] = [];
  try {
    products = await getActiveProducts();
  } catch {
    // Supabase not configured yet - render an empty storefront gracefully.
    products = [];
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative -mx-4 -mt-8 mb-10 overflow-hidden sm:-mx-4 md:-mx-4 lg:-mx-4">
        <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-wine via-wine/90 to-blush sm:min-h-[400px]">
          {/* Background watermark */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'url(/images/body/logo_flower.png)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'clamp(200px, 40vw, 400px)',
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-serif text-3xl leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Discover Your Style
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              Handpicked ethnic wear that celebrates tradition with a modern
              touch. Every piece tells a story of craftsmanship and elegance.
            </p>
            <a
              href="#products"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-serif text-sm text-wine shadow-sm transition-colors hover:bg-white/90 sm:text-base"
            >
              Shop New Arrivals
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Brand value cards */}
      <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card flex items-start gap-3 p-4">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-6 w-6 shrink-0 text-wine"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
          <div>
            <h3 className="font-serif text-sm font-medium text-ink">
              Free Shipping
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              On all orders across India. No minimum purchase required.
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-4">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-6 w-6 shrink-0 text-wine"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v5h-5" />
            <path d="M12 7v5l3 3" />
          </svg>
          <div>
            <h3 className="font-serif text-sm font-medium text-ink">
              Easy Returns
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              7-day hassle-free returns. We&apos;ll pick it up from your door.
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-4">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-6 w-6 shrink-0 text-wine"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div>
            <h3 className="font-serif text-sm font-medium text-ink">
              Handpicked Quality
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              Every product is curated by our team for the best quality.
            </p>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section id="products" className="mb-8 scroll-mt-28">
        <h2 className="font-serif text-3xl text-ink">New arrivals</h2>
        <p className="mt-1 text-ink/60">
          Handpicked ethnic wear, ready to ship.
        </p>
      </section>
      <ProductGrid products={products} searchQuery={search} />

      {/* Recently viewed */}
      <RecentlyViewed />
    </div>
  );
}
