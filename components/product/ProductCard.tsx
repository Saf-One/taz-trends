import Link from "next/link";
import type { ProductWithRelations } from "@/types/db";
import { publicImageUrl } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import { displayPricePaise, hasVariants, totalStock } from "@/lib/catalog/queries";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const primary =
    product.product_images.find((i) => i.is_primary) ??
    product.product_images[0];
  const img = publicImageUrl(primary?.storage_path);
  const price = displayPricePaise(product);
  const soldOut = totalStock(product) <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="card group overflow-hidden">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-blush">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={primary?.alt ?? product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">
            <span className="font-serif text-sm">{product.title}</span>
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-xs text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-serif text-sm text-ink">{product.title}</h3>
        <p className="mt-1 text-sm text-wine">
          {hasVariants(product) ? "From " : ""}
          {formatPaise(price)}
        </p>
      </div>
    </Link>
  );
}
