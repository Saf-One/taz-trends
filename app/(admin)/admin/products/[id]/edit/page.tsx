import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductByIdAdmin } from "@/lib/catalog/admin-queries";
import {
  updateProduct,
  addVariant,
  deleteVariant,
} from "@/lib/catalog/actions";
import { publicImageUrl } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DeleteImageButton } from "@/components/admin/DeleteImageButton";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductByIdAdmin(params.id);
  if (!product) notFound();

  const rupees = (product.price / 100).toString();

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/products"
          className="mb-2 inline-flex items-center gap-1 text-xs text-ink/50 hover:text-wine"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          All products
        </Link>
        <h1 className="font-serif text-2xl text-ink">{product.title}</h1>
      </div>

      {/* Core fields */}
      <form
        action={updateProduct.bind(null, product.id)}
        className="card space-y-5 p-6"
      >
        <h2 className="font-serif text-lg text-ink">Details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink/70">Title</span>
            <input
              name="title"
              defaultValue={product.title}
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Slug</span>
            <input
              name="slug"
              defaultValue={product.slug}
              className="input font-mono text-xs"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Status</span>
            <select name="status" defaultValue={product.status} className="input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">
            Description
          </span>
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            className="input min-h-24 resize-y"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Price (₹) - used when no variants
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/30">
                ₹
              </span>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={rupees}
                className="input pl-8"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Stock - used when no variants
            </span>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={product.stock}
              className="input"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button className="btn-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1.5"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save changes
          </button>
        </div>
      </form>

      {/* Variants (optional) */}
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-ink">Variants (optional)</h2>
        <p className="mb-4 text-xs text-ink/50">
          Leave empty for a simple product. When variants exist, their stock and
          price override the product-level values.
        </p>

        {product.product_variants.length > 0 && (
          <div className="mb-5 overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-blush/60 text-left text-xs font-medium text-ink/50">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {product.product_variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 text-ink/60">{v.variant_name}</td>
                    <td className="px-3 py-2 font-medium">{v.variant_value}</td>
                    <td className="px-3 py-2">{v.stock}</td>
                    <td className="px-3 py-2">
                      {formatPaise(v.price_override ?? product.price)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <form
                        action={deleteVariant.bind(null, product.id, v.id)}
                      >
                        <button className="inline-flex items-center gap-1 text-xs text-red-600 underline hover:text-red-700">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          action={addVariant.bind(null, product.id)}
          className="grid gap-3 rounded-lg border border-dashed border-ink/20 bg-blush/20 p-4 sm:grid-cols-4"
        >
          <input
            name="variant_name"
            placeholder="Size"
            defaultValue="Size"
            className="input"
          />
          <input
            name="variant_value"
            placeholder="e.g. M"
            className="input"
            required
          />
          <input
            name="stock"
            type="number"
            placeholder="Stock"
            className="input"
          />
          <input
            name="price_override"
            type="number"
            step="0.01"
            placeholder="₹ (optional)"
            className="input"
          />
          <button className="btn-outline btn-sm sm:col-span-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Add variant
          </button>
        </form>
      </section>

      {/* Images */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Images</h2>
          {product.product_images.length > 0 && (
            <span className="text-xs text-ink/40">
              {product.product_images.length} image
              {product.product_images.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {product.product_images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {product.product_images.map((img) => {
              const url = publicImageUrl(img.storage_path);
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-blush"
                >
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={img.alt ?? ""}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  {img.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-wine px-2 py-0.5 text-[10px] font-medium text-white shadow">
                      Primary
                    </span>
                  )}
                  <DeleteImageButton
                    imageId={img.id}
                    productId={product.id}
                    storagePath={img.storage_path}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ink/10" />
                </div>
              );
            })}
          </div>
        )}

        <ImageUploader
          productId={product.id}
          makePrimary={product.product_images.length === 0}
        />
      </section>
    </div>
  );
}
