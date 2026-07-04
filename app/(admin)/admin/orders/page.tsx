import { getAllOrders } from "@/lib/checkout/admin-queries";
import { updateOrderStatus } from "@/lib/checkout/actions";
import { allowedNextStatuses } from "@/lib/checkout/status";
import { formatPaise } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => {
          const nexts = allowedNextStatuses(o.status, o.payment_method);
          return (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    #{o.id.slice(0, 8)}{" "}
                    <span className="ml-2 rounded bg-blush px-2 py-0.5 text-xs">
                      {o.status}
                    </span>
                  </p>
                  <p className="text-xs text-ink/50">
                    {o.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"} ·
                    payment {o.payment_status} · {formatPaise(o.total)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nexts.length === 0 && (
                    <span className="text-xs text-ink/40">No further action</span>
                  )}
                  {nexts.map((next) => (
                    <form key={next} action={updateOrderStatus.bind(null, o.id, next)}>
                      <button className="btn-outline text-xs">
                        Mark {next}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-ink/50">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
