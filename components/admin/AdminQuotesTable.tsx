"use client";

import { useState, useMemo } from "react";
import type { Quote, QuoteStatus } from "@/types/db";
import { updateQuoteStatus } from "@/lib/checkout/actions";
import { useSortable } from "./useSortable";
import { SortIcon } from "./SortIcon";

const NEXT: Record<QuoteStatus, QuoteStatus[]> = {
  new: ["contacted", "closed"],
  contacted: ["closed", "new"],
  closed: ["new"],
};

export function AdminQuotesTable({ quotes }: { quotes: Quote[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = quotes;
    if (statusFilter !== "all") {
      list = list.filter((q) => q.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (qt) =>
          qt.name.toLowerCase().includes(q) ||
          qt.email.toLowerCase().includes(q) ||
          (qt.phone && qt.phone.includes(search))
      );
    }
    return list;
  }, [quotes, search, statusFilter]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered);

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
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[120px]"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-xs text-ink/40">
          {filtered.length} of {quotes.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {sorted.map((q) => (
          <div
            key={q.id}
            className="card animate-slide-up p-4 transition-shadow hover:shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{q.name}</p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.status === "new"
                        ? "bg-amber-100 text-amber-800"
                        : q.status === "contacted"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink/50">
                  <a
                    href={`mailto:${q.email}`}
                    className="hover:text-wine hover:underline"
                  >
                    {q.email}
                  </a>
                  {q.phone && (
                    <>
                      {" · "}
                      <a
                        href={`tel:${q.phone}`}
                        className="hover:text-wine hover:underline"
                      >
                        {q.phone}
                      </a>
                    </>
                  )}
                  {" · "}
                  {formatDate(q.created_at)}
                </p>
                {q.message && (
                  <p className="mt-2 text-sm text-ink/80 line-clamp-3">
                    {q.message}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {NEXT[q.status].map((next) => (
                  <form
                    key={next}
                    action={updateQuoteStatus.bind(null, q.id, next)}
                  >
                    <button className="btn-outline btn-xs">
                      Mark {next}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-ink/50">
            {search || statusFilter !== "all"
              ? "No quotes match your filters."
              : "No quotes yet."}
          </p>
        )}
      </div>
    </div>
  );
}
