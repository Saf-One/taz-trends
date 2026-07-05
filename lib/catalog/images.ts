/**
 * Public URL for a product image stored in the `product-images` bucket.
 * The bucket is public, so we can build the URL directly from the project
 * URL without a Supabase round-trip.
 */
export function publicImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

/**
 * Carousel-ready image list for a product: primary image first, then by
 * position. Rows whose public URL can't be built are dropped.
 */
export function carouselImages(
  images: { storage_path: string; alt: string | null; position: number; is_primary: boolean }[],
  fallbackAlt: string,
): { src: string; alt: string }[] {
  return [...images]
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
    )
    .flatMap((img) => {
      const src = publicImageUrl(img.storage_path);
      return src ? [{ src, alt: img.alt ?? fallbackAlt }] : [];
    });
}
