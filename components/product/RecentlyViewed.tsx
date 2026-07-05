"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveProductsBrowser } from "@/lib/catalog/queries-browser";
import { formatPaise } from "@/lib/config";
import type { ProductWithRelations } from "@/types/db";
import { displayPricePaise } from "@/lib/catalog/queries-utils";
import { carouselImages } from "@/lib/catalog/images";

const STORAGE_KEY = "taz_recently_viewed";
const MAX_ITEMS = 8;

/**
 * Recently-viewed products strip.
 * Reads slugs from localStorage, fetches matching products,
 * and renders a horizontal scrollable strip.
 */
export function RecentlyViewed() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const slugs: string[] = raw ? JSON.parse(raw) : [];
        if (slugs.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const all = await getActiveProductsBrowser();
        const slugIndex = new Map(all.map((p) => [p.slug, p]));
        const matched = slugs
          .map((s) => slugIndex.get(s))
          .filter((p): p is ProductWithRelations => !!p)
          .slice(0, MAX_ITEMS);

        if (!cancelled) setProducts(matched);
      } catch {
        // Silently fail
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-serif text-xl text-ink">Recently viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {products.map((p) => {
          const images = carouselImages(p.product_images, p.title);
          const price = displayPricePaise(p);
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group w-32 shrink-0 sm:w-36"
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-blush">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[0].src}
                    alt={images[0].alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center font-serif text-xs text-ink/30">
                    {p.title}
                  </div>
                )}
              </div>
              <h3 className="mt-1.5 line-clamp-1 font-serif text-xs text-ink group-hover:text-wine transition-colors">
                {p.title}
              </h3>
              <p className="text-xs text-wine">{formatPaise(price)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
