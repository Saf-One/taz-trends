import Link from "next/link";
import type { ProductWithRelations } from "@/types/db";
import { carouselImages } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import { displayPricePaise, hasVariants, totalStock } from "@/lib/catalog/queries";
import { ImageCarousel } from "./ImageCarousel";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const images = carouselImages(product.product_images, product.title);
  const price = displayPricePaise(product);
  const soldOut = totalStock(product) <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="card group overflow-hidden">
      <div className="relative">
        {images.length > 0 ? (
          <ImageCarousel images={images} />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-blush text-ink/30">
            <span className="font-serif text-sm">{product.title}</span>
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 z-10 rounded bg-ink/80 px-2 py-0.5 text-xs text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-serif text-sm text-ink">{product.title}</h3>
        <p className="mt-1 text-sm text-wine">
          {hasVariants(product) ? "From " : ""}
          {formatPaise(price)}
        </p>
      </div>
    </Link>
  );
}
