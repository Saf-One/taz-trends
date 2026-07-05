import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/checkout/razorpay";
import { sendOrderEmails } from "@/lib/email/notify";
import type { Order } from "@/types/db";

/**
 * Verify the Razorpay checkout callback. On a valid signature, mark the
 * order paid + processing and clear the buyer's cart. Uses the service role
 * (a normal user cannot update order status under RLS) but only after the
 * signature check and scoped to that user's own order.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const ok = verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Scope strictly to this user's pending order for that Razorpay order id.
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, payment_status")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (order.payment_status !== "paid") {
    await admin
      .from("orders")
      .update({ payment_status: "paid", status: "processing" })
      .eq("id", order.id);

    // Clear the buyer's cart now that payment is confirmed.
    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

    // Fetch updated order for email (needs paid status)
    const { data: updatedOrder } = await admin
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .maybeSingle();

    if (updatedOrder) {
      await sendOrderEmails(
        updatedOrder as Order,
        user.email ?? "",
        user.user_metadata?.full_name ?? null,
      );
    }
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
