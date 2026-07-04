import { notFound } from "next/navigation";
import { getProductByIdAdmin } from "@/lib/catalog/admin-queries";
import {
  updateProduct,
  addVariant,
  deleteVariant,
} from "@/lib/catalog/actions";
import { publicImageUrl } from "@/lib/catalog/images";
import { formatPaise } from "@/lib/config";
import { ImageUploader } from "@/components/admin/ImageUploader";

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
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-serif text-2xl text-ink">Edit: {product.title}</h1>

      {/* Core fields */}
      <form
        action={updateProduct.bind(null, product.id)}
        className="card space-y-4 p-6"
      >
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Title</span>
          <input name="title" defaultValue={product.title} className="input" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Slug</span>
          <input name="slug" defaultValue={product.slug} className="input" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Description</span>
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            className="input min-h-20"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Price (₹) — used when no variants</span>
            <input name="price" type="number" defaultValue={rupees} className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Stock — used when no variants</span>
            <input name="stock" type="number" defaultValue={product.stock} className="input" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Status</span>
          <select name="status" defaultValue={product.status} className="input">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <button className="btn-primary">Save changes</button>
      </form>

      {/* Variants (optional) */}
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg">Variants (optional)</h2>
        <p className="mb-4 text-xs text-ink/50">
          Leave empty for a simple product. When variants exist, their stock
          and price override the product row.
        </p>

        {product.product_variants.length > 0 && (
          <ul className="mb-4 divide-y divide-ink/10">
            {product.product_variants.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {v.variant_name}: <strong>{v.variant_value}</strong> · stock {v.stock} ·{" "}
                  {formatPaise(v.price_override ?? product.price)}
                </span>
                <form action={deleteVariant.bind(null, product.id, v.id)}>
                  <button className="text-xs text-red-700 underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={addVariant.bind(null, product.id)}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <input name="variant_name" placeholder="Size" defaultValue="Size" className="input" />
          <input name="variant_value" placeholder="M" className="input" required />
          <input name="stock" type="number" placeholder="Stock" className="input" />
          <input name="price_override" type="number" placeholder="₹ (optional)" className="input" />
          <button className="btn-outline col-span-2 sm:col-span-4">Add variant</button>
        </form>
      </section>

      {/* Images */}
      <section className="card p-6">
        <h2 className="mb-4 font-serif text-lg">Images</h2>
        {product.product_images.length > 0 && (
          <div className="mb-4 grid grid-cols-4 gap-2">
            {product.product_images.map((img) => {
              const url = publicImageUrl(img.storage_path);
              return (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded bg-blush">
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  )}
                  {img.is_primary && (
                    <span className="absolute left-1 top-1 rounded bg-wine px-1 text-[10px] text-white">
                      primary
                    </span>
                  )}
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
