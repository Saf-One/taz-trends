import { getAllOffers } from "@/lib/offers/queries";
import { createOffer } from "@/lib/offers/actions";
import { AdminOffersTable } from "@/components/admin/AdminOffersTable";

export const dynamic = "force-dynamic";

export default async function AdminOffers() {
  const offers = await getAllOffers();

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="font-serif text-2xl text-ink">Offers</h1>

      {/* Create offer form */}
      <div className="card p-6">
        <h2 className="mb-4 font-serif text-lg text-ink">Create offer</h2>
        <form action={createOffer} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Name</span>
            <input name="name" className="input" required placeholder="Summer Sale" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Code (user-entered)</span>
            <input name="code" className="input" required placeholder="SUMMER50" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Razorpay offer_id</span>
            <input name="razorpay_offer_id" className="input" required placeholder="offer_..." />
          </label>
          <label className="flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-ink/20 text-wine focus:ring-wine/30"
            />
            <span className="text-sm text-ink/70">Active on creation</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Starts (optional)</span>
            <input name="starts_at" type="datetime-local" className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/70">Ends (optional)</span>
            <input name="ends_at" type="datetime-local" className="input" />
          </label>
          <div className="col-span-full">
            <button className="btn-primary">Create offer</button>
            <p className="mt-2 text-xs text-ink/50">
              Discount is enforced by Razorpay via the offer_id. Offers apply to
              online (Razorpay) payment only.
            </p>
          </div>
        </form>
      </div>

      {/* Offers table */}
      <AdminOffersTable offers={offers} />
    </div>
  );
}
