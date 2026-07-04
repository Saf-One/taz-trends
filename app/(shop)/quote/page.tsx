import { QuoteForm } from "@/components/checkout/QuoteForm";

export const metadata = { title: "Request a quote" };

export default function QuotePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 font-serif text-2xl text-ink">Request a quote</h1>
      <p className="mb-6 text-sm text-ink/60">
        Tell us what you&apos;re looking for. No account needed — we&apos;ll
        reply by email.
      </p>
      <QuoteForm />
    </div>
  );
}
