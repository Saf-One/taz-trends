import type { ProductWithRelations } from "@/types/db";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-ink/60">
        No products yet. Add some from the admin dashboard.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
