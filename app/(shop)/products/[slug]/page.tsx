import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog/queries";
import { publicImageUrl } from "@/lib/catalog/images";
import { AddToCartForm } from "@/components/product/AddToCartForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  return { title: product?.title ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const primary =
    product.product_images.find((i) => i.is_primary) ??
    product.product_images[0];
  const img = publicImageUrl(primary?.storage_path);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="relative aspect-[3/4] w-full bg-blush">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={primary?.alt ?? product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-ink/30">
              {product.title}
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="font-serif text-3xl text-ink">{product.title}</h1>
        {product.description && (
          <p className="mt-3 text-ink/70">{product.description}</p>
        )}
        <div className="mt-6">
          <AddToCartForm product={product} />
        </div>
      </div>
    </div>
  );
}
