import type { OrderStatus, ProductStatus, QuoteStatus } from "@/types/db";

type AnyStatus = OrderStatus | ProductStatus | QuoteStatus;

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-ink/10 text-ink/60",
  returned: "bg-red-100 text-red-700",
  cash_on_delivery: "bg-wine text-white",
  draft: "bg-ink/5 text-ink/50",
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-ink/10 text-ink/50",
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-sky-100 text-sky-800",
  closed: "bg-ink/10 text-ink/50",
};

const LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  cash_on_delivery: "COD - to fulfil",
  draft: "Draft",
  active: "Active",
  archived: "Archived",
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export function StatusChip({ status }: { status: AnyStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-blush text-ink"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
