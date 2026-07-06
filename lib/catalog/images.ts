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
 * Strip markdown formatting, emoji, and special chars from alt text.
 * Product titles often contain markdown like *text* and emoji like 👗
 * which make poor alt text for accessibility and SEO.
 */
export function sanitizeAltText(text: string): string {
  return text
    .replace(/[*_~`#>|]/g, "")        // markdown syntax
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // emoji and symbols
    .replace(/\s+/g, " ")              // collapse whitespace
    .trim();
}

/**
 * Carousel-ready image list for a product: primary image first, then by
 * position. Rows whose public URL can't be built are dropped.
 * Alt text is sanitized to remove markdown and emoji for clean SEO output.
 */
export function carouselImages(
  images: { storage_path: string; alt: string | null; position: number; is_primary: boolean }[],
  fallbackAlt: string,
): { src: string; alt: string }[] {
  const cleanFallback = sanitizeAltText(fallbackAlt);
  return [...images]
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
    )
    .flatMap((img) => {
      const src = publicImageUrl(img.storage_path);
      const rawAlt = img.alt ?? fallbackAlt;
      return src ? [{ src, alt: sanitizeAltText(rawAlt) }] : [];
    });
}
