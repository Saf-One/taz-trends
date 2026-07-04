import { getAllQuotes } from "@/lib/checkout/admin-queries";
import { updateQuoteStatus } from "@/lib/checkout/actions";
import type { QuoteStatus } from "@/types/db";

export const dynamic = "force-dynamic";

const NEXT: Record<QuoteStatus, QuoteStatus[]> = {
  new: ["contacted", "closed"],
  contacted: ["closed", "new"],
  closed: ["new"],
};

export default async function AdminQuotes() {
  const quotes = await getAllQuotes();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Quotes</h1>
      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {q.name}{" "}
                  <span className="ml-2 rounded bg-blush px-2 py-0.5 text-xs">
                    {q.status}
                  </span>
                </p>
                <p className="text-xs text-ink/50">
                  {q.email}
                  {q.phone ? ` · ${q.phone}` : ""}
                </p>
                <p className="mt-2 text-sm text-ink/80">{q.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {NEXT[q.status].map((next) => (
                  <form key={next} action={updateQuoteStatus.bind(null, q.id, next)}>
                    <button className="btn-outline text-xs">Mark {next}</button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        ))}
        {quotes.length === 0 && <p className="text-ink/50">No quotes yet.</p>}
      </div>
    </div>
  );
}
