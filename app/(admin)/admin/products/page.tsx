import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/catalog/admin-queries";
import { formatPaise } from "@/lib/config";
import { hasVariants, totalStock } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-blush text-left text-ink/60">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="hidden p-3 sm:table-cell">Type</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-ink/10">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3">
                  <span className="rounded bg-blush px-2 py-0.5 text-xs">
                    {p.status}
                  </span>
                </td>
                <td className="p-3">{formatPaise(p.price)}</td>
                <td className="p-3">{totalStock(p)}</td>
                <td className="hidden p-3 text-ink/60 sm:table-cell">
                  {hasVariants(p) ? "Variants" : "Simple"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="text-wine underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/50">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
