"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Order } from "@/types/db";
import { formatPaise } from "@/lib/config";
import { parseOrderAddress } from "@/lib/checkout/address";
import { StatusChip } from "./StatusChip";
import { useSortable } from "./useSortable";
import { SortIcon } from "./SortIcon";

export function AdminOrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (methodFilter !== "all") {
      list = list.filter((o) => o.payment_method === methodFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.razorpay_order_id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter, methodFilter]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => s.add(o.status));
    return [...s].sort();
  }, [orders]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
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
            placeholder="Search by order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[130px]"
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="input w-auto min-w-[120px]"
        >
          <option value="all">All methods</option>
          <option value="cod">COD</option>
          <option value="razorpay">Razorpay</option>
        </select>
        <span className="text-xs text-ink/40">
          {filtered.length} of {orders.length}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="table-header">
            <tr>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("id" as keyof Order)}
              >
                <span className="inline-flex items-center">
                  Order
                  <SortIcon active={sortKey === "id"} dir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("created_at" as keyof Order)}
              >
                <span className="inline-flex items-center">
                  Date
                  <SortIcon active={sortKey === "created_at"} dir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer select-none"
                onClick={() => toggle("status" as keyof Order)}
              >
                <span className="inline-flex items-center">
                  Status
                  <SortIcon active={sortKey === "status"} dir={sortDir} />
                </span>
              </th>
              <th>Method</th>
              <th
                className="cursor-pointer select-none text-right"
                onClick={() => toggle("total" as keyof Order)}
              >
                <span className="inline-flex items-center justify-end">
                  Total
                  <SortIcon active={sortKey === "total"} dir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((o) => (
              <tr key={o.id} className="table-row cursor-pointer" onClick={() => window.location.href = `/admin/orders/${o.id}`}>
                <td className="font-mono text-xs font-medium">
                  #{o.id.slice(0, 8)}
                </td>
                <td className="text-ink/60">{formatDate(o.created_at)}</td>
                <td>
                  <StatusChip status={o.status} />
                </td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      o.payment_method === "cod"
                        ? "text-amber-700"
                        : "text-sky-700"
                    }`}
                  >
                    {o.payment_method === "cod" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" x2="12" y1="2" y2="22" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                    {o.payment_method === "cod" ? "COD" : "Online"}
                  </span>
                </td>
                <td className="text-right font-medium text-wine">
                  {formatPaise(o.total)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-ink/50">
                  {search || statusFilter !== "all" || methodFilter !== "all" ? (
                    "No orders match your filters."
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-ink/20">
                        <rect x="12" y="16" width="40" height="36" rx="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M24 16V8h16v8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M28 32h8M28 40h8" strokeLinecap="round" />
                        <line x1="20" y1="26" x2="44" y2="26" strokeLinecap="round" />
                      </svg>
                      No orders yet.
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
