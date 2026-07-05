import { getAllQuotes } from "@/lib/checkout/admin-queries";
import { AdminQuotesTable } from "@/components/admin/AdminQuotesTable";

export const dynamic = "force-dynamic";

export default async function AdminQuotes() {
  const quotes = await getAllQuotes();

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 font-serif text-2xl text-ink">Quotes</h1>
      <AdminQuotesTable quotes={quotes} />
    </div>
  );
}
