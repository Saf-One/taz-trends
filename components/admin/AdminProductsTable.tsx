"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ProductWithRelations } from "@/types/db";
import { formatPaise } from "@/lib/config";
import { hasVariants, totalStock } from "@/lib/catalog/queries-utils";
import { StatusChip } from "./StatusChip";
import { useSortable } from "./useSortable";
import { SortIcon } from "./SortIcon";

export function AdminProductsTable({
  products,
}: {
  products: ProductWithRelations[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = products;
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, statusFilter]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered);

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[120px]"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <span className="text-xs text-ink/40">
          {filtered.length} of {products.length}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="table-header">
            <tr>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("title" as keyof ProductWithRelations)}
              >
                <span className="inline-flex items-center">
                  Title
                  <SortIcon
                    active={sortKey === "title"}
                    dir={sortDir}
                  />
                </span>
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("status" as keyof ProductWithRelations)}
              >
                <span className="inline-flex items-center">
                  Status
                  <SortIcon
                    active={sortKey === "status"}
                    dir={sortDir}
                  />
                </span>
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("price" as keyof ProductWithRelations)}
              >
                <span className="inline-flex items-center">
                  Price
                  <SortIcon
                    active={sortKey === "price"}
                    dir={sortDir}
                  />
                </span>
              </th>
              <th className="hidden sm:table-cell">Stock</th>
              <th className="hidden sm:table-cell">Type</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="font-medium text-ink">{p.title}</td>
                <td>
                  <StatusChip status={p.status} />
                </td>
                <td>{formatPaise(p.price)}</td>
                <td className="hidden sm:table-cell">{totalStock(p)}</td>
                <td className="hidden sm:table-cell text-ink/60">
                  {hasVariants(p) ? "Variants" : "Simple"}
                </td>
                <td className="text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-wine hover:underline"
                  >
                    Edit
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
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-sm text-ink/50">
                  {search || statusFilter !== "all" ? (
                    "No products match your filters."
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-ink/20">
                        <rect x="16" y="12" width="32" height="40" rx="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M28 40h8M28 32h8" strokeLinecap="round" />
                        <path d="M22 8v4h20V8a2 2 0 0 0-2-2H24a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      No products yet.
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
