import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/catalog/admin-queries";
import { formatPaise } from "@/lib/config";
import { hasVariants, totalStock } from "@/lib/catalog/queries";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { EmptyState } from "@/components/ui/EmptyState";
export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProducts() {
  const products = await getAllProductsAdmin();

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          + New product
        </Link>
      </div>

      <AdminProductsTable products={products} />
    </div>
  );
}
