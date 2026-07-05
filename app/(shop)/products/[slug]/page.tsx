import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getProductBySlug } from "@/lib/catalog/queries";
import { carouselImages, publicImageUrl } from "@/lib/catalog/images";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ImageCarousel } from "@/components/product/ImageCarousel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "Product" };

  const desc =
    product.description
      ?.split("\n")[0]
      ?.substring(0, 160)
      .replace(/[#*_~`]/g, "") || "Discover this beautiful piece";

  const primaryImage = product.product_images?.[0];
  const ogImage = primaryImage ? publicImageUrl(primaryImage.storage_path) : null;

  return {
    title: product.title,
    description: desc,
    openGraph: {
      title: product.title,
      description: desc,
      ...(ogImage && { images: [{ url: ogImage, width: 400, height: 500 }] }),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const images = carouselImages(product.product_images, product.title);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        {images.length > 0 ? (
          <div className="card overflow-hidden p-2">
            <ImageCarousel images={images} showThumbnails />
          </div>
        ) : (
          <div className="card flex aspect-[3/4] w-full items-center justify-center bg-blush font-serif text-ink/30">
            {product.title}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-serif text-3xl text-ink">{product.title}</h1>
        {product.description && (
          <div className="md-body mt-3 text-ink/70">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        )}
        <div className="mt-6">
          <AddToCartForm product={product} />
        </div>
      </div>
    </div>
  );
}
