import { getAllOffers } from "@/lib/offers/queries";
import { createOffer, toggleOffer } from "@/lib/offers/actions";

export const dynamic = "force-dynamic";

export default async function AdminOffers() {
  const offers = await getAllOffers();

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-ink">Offers</h1>

      <form action={createOffer} className="card grid gap-3 p-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Name</span>
          <input name="name" className="input" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Code (user-entered)</span>
          <input name="code" className="input" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Razorpay offer_id</span>
          <input name="razorpay_offer_id" className="input" required />
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input name="is_active" type="checkbox" />
          <span className="text-sm text-ink/70">Active</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Starts (optional)</span>
          <input name="starts_at" type="datetime-local" className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Ends (optional)</span>
          <input name="ends_at" type="datetime-local" className="input" />
        </label>
        <div className="sm:col-span-2">
          <button className="btn-primary">Create offer</button>
          <p className="mt-2 text-xs text-ink/50">
            Discount is enforced by Razorpay via the offer_id. Offers apply to
            online (Razorpay) payment only.
          </p>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blush text-left text-ink/60">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Razorpay id</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t border-ink/10">
                <td className="p-3">{o.name}</td>
                <td className="p-3 font-mono text-xs">{o.code}</td>
                <td className="p-3 font-mono text-xs">{o.razorpay_offer_id}</td>
                <td className="p-3">{o.is_active ? "Yes" : "No"}</td>
                <td className="p-3 text-right">
                  <form action={toggleOffer.bind(null, o.id, !o.is_active)}>
                    <button className="text-wine underline">
                      {o.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink/50">
                  No offers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
