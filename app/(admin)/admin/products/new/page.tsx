import { createProduct } from "@/lib/catalog/actions";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 font-serif text-2xl text-ink">New product</h1>
      <form
        action={createProduct}
        className="card mx-auto max-w-lg space-y-5 p-6"
      >
        {/* Title */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">
            Title <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            required
            className="input"
            placeholder="e.g. Silk Embroidered Kurta"
          />
        </label>

        {/* Description */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">
            Description
          </span>
          <textarea
            name="description"
            className="input min-h-24 resize-y"
            placeholder="Product description (supports Markdown)"
          />
        </label>

        {/* Price + Stock */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Price (₹)
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/30">
                ₹
              </span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                className="input pl-8"
                placeholder="0.00"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Stock
            </span>
            <input
              name="stock"
              type="number"
              min="0"
              className="input"
              placeholder="0"
              defaultValue={0}
            />
          </label>
        </div>

        {/* Status */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">
            Status
          </span>
          <select name="status" className="input" defaultValue="draft">
            <option value="draft">Draft - hidden from store</option>
            <option value="active">Active - visible on store</option>
            <option value="archived">Archived - not listed</option>
          </select>
        </label>

        {/* Hint */}
        <div className="flex items-start gap-2 rounded-md bg-blush/60 p-3 text-xs text-ink/60">
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
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="12" x2="12.01" y1="8" y2="8" />
          </svg>
          <span>
            Simple product by default. You can add images, sizes, and variants
            after creating the product.
          </span>
        </div>

        <button className="btn-primary w-full">
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
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Create product
        </button>
      </form>
    </div>
  );
}
