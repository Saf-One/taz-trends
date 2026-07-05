import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getActiveProducts, getProductBySlug } from "@/lib/catalog/queries";
import { carouselImages, publicImageUrl } from "@/lib/catalog/images";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ImageCarousel } from "@/components/product/ImageCarousel";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { DetailClient } from "./DetailClient";
import { ShareButton } from "./ShareButton";
import type { ProductWithRelations } from "@/types/db";
import { formatPaise } from "@/lib/config";
import { displayPricePaise, hasVariants } from "@/lib/catalog/queries";

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

  // Fetch recommendations (related products based on title similarity)
  let recommendations: ProductWithRelations[] = [];
  try {
    const allProducts = await getActiveProducts();
    const keywords = product.title
      .split(" ")
      .filter((w) => w.length > 2)
      .slice(0, 3);
    const sameCat = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        keywords.some(
          (kw) =>
            p.title.toLowerCase().includes(kw.toLowerCase()) ||
            p.slug.toLowerCase().includes(kw.toLowerCase()),
        ),
    );
    // Shuffle and pick up to 4
    recommendations = sameCat
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    if (recommendations.length < 4) {
      // Fill with random products
      const others = allProducts
        .filter((p) => p.id !== product.id && !sameCat.includes(p))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - recommendations.length);
      recommendations = [...recommendations, ...others];
    }
  } catch {
    // Silently fail
  }

  const soldOut =
    (product.product_variants?.length ?? 0) > 0
      ? product.product_variants.every((v) => v.stock <= 0)
      : product.stock <= 0;

  return (
    <>
      <DetailClient product={product} />

      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-ink/40">
        <a href="/" className="hover:text-wine">Home</a>
        <span>/</span>
        <span className="text-ink/60">Products</span>
        <span>/</span>
        <span className="truncate text-ink/80">{product.title}</span>
      </nav>

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

        <div id="add-to-cart">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-3xl text-ink">{product.title}</h1>
              <p className="mt-1 text-xl text-wine">
                {hasVariants(product) ? "From " : ""}
                {formatPaise(displayPricePaise(product))}
              </p>
            </div>
            {/* Share button */}
            <ShareButton title={product.title} slug={product.slug} />
          </div>

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

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-xl text-ink">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            {recommendations.map((p) => {
              const recImages = carouselImages(
                p.product_images,
                p.title,
              );
              const recPrice = displayPricePaise(p);
              return (
                <a
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="card group overflow-hidden"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-blush">
                    {recImages[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={recImages[0].src}
                        alt={recImages[0].alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-center font-serif text-xs text-ink/30">
                        {p.title}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <h3 className="line-clamp-1 font-serif text-xs text-ink group-hover:text-wine transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-wine">
                      {formatPaise(recPrice)}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink/10 bg-white shadow-lg md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="line-clamp-1 font-serif text-sm text-ink/60">
              {product.title}
            </p>
            <p className="text-sm font-medium text-wine">
              {hasVariants(product) ? "From " : ""}
              {formatPaise(displayPricePaise(product))}
            </p>
          </div>
          <a
            href="#add-to-cart"
            className={`btn-primary text-sm ${soldOut ? "pointer-events-none opacity-50" : ""}`}
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </a>
        </div>
      </div>
    </>
  );
}
