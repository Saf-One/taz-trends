import { getActiveProducts } from "@/lib/catalog/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { ProductWithRelations } from "@/types/db";

// Product availability changes; don't statically cache the storefront.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: ProductWithRelations[] = [];
  try {
    products = await getActiveProducts();
  } catch {
    // Supabase not configured yet - render an empty storefront gracefully.
    products = [];
  }

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-serif text-3xl text-ink">New arrivals</h1>
        <p className="mt-1 text-ink/60">
          Handpicked ethnic wear, ready to ship.
        </p>
      </section>
      <ProductGrid products={products} />
    </div>
  );
}
