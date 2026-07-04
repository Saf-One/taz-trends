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
