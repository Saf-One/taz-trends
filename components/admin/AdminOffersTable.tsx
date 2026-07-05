"use client";

import { useState, useMemo } from "react";
import type { Offer } from "@/types/db";
import { toggleOffer } from "@/lib/offers/actions";
import { useSortable } from "./useSortable";
import { SortIcon } from "./SortIcon";

export function AdminOffersTable({ offers }: { offers: Offer[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return offers;
    const q = search.toLowerCase();
    return offers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.razorpay_offer_id.toLowerCase().includes(q)
    );
  }, [offers, search]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered);

  return (
    <div className="card overflow-hidden">
      {/* Search inside table header */}
      <div className="border-b border-ink/10 bg-blush/60 p-3">
        <div className="relative max-w-xs">
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
            placeholder="Search offers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="table-header">
          <tr>
            <th
              className="cursor-pointer select-none"
              onClick={() => toggle("name" as keyof Offer)}
            >
              <span className="inline-flex items-center">
                Name
                <SortIcon active={sortKey === "name"} dir={sortDir} />
              </span>
            </th>
            <th
              className="cursor-pointer select-none"
              onClick={() => toggle("code" as keyof Offer)}
            >
              <span className="inline-flex items-center">
                Code
                <SortIcon active={sortKey === "code"} dir={sortDir} />
              </span>
            </th>
            <th>Razorpay ID</th>
            <th
              className="cursor-pointer select-none"
              onClick={() => toggle("is_active" as keyof Offer)}
            >
              <span className="inline-flex items-center">
                Active
                <SortIcon active={sortKey === "is_active"} dir={sortDir} />
              </span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => (
            <tr key={o.id} className="table-row">
              <td className="font-medium">{o.name}</td>
              <td className="font-mono text-xs">{o.code}</td>
              <td className="font-mono text-xs text-ink/60">{o.razorpay_offer_id}</td>
              <td>
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    o.is_active ? "text-emerald-700" : "text-ink/40"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      o.is_active ? "bg-emerald-500" : "bg-ink/20"
                    }`}
                  />
                  {o.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="text-right">
                <form action={toggleOffer.bind(null, o.id, !o.is_active)}>
                  <button
                    className={`text-xs font-medium underline ${
                      o.is_active
                        ? "text-red-600 hover:text-red-700"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    {o.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="p-10 text-center text-sm text-ink/50">
                {search
                  ? "No offers match your search."
                  : "No offers yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
