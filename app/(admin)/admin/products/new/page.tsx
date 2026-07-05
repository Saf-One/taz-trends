import { createProduct } from "@/lib/catalog/actions";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-serif text-2xl text-ink">New product</h1>
      <form action={createProduct} className="card space-y-4 p-6">
        <Field name="title" label="Title" required />
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Description</span>
          <textarea name="description" className="input min-h-20" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Field name="price" label="Price (₹)" type="number" />
          <Field name="stock" label="Stock" type="number" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Status</span>
          <select name="status" className="input" defaultValue="draft">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <p className="text-xs text-ink/50">
          Simple product by default. Add sizes/variants after creating it.
        </p>
        <button className="btn-primary w-full">Create product</button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink/70">{label}</span>
      <input name={name} type={type} required={required} className="input" />
    </label>
  );
}
