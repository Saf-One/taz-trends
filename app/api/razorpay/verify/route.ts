import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/checkout/razorpay";
import { sendOrderEmails } from "@/lib/email/notify";
import type { Order } from "@/types/db";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";
import { rateLimit } from "@/lib/security/rate-limit";

/** 10 verify attempts per minute per IP */
const rl = rateLimit({ max: 10, windowMs: 60_000, label: "verify" });

/**
 * Verify the Razorpay checkout callback. On a valid signature, create the
 * local order from the cart (using stored pending_checkout context), mark it
 * paid, clear the buyer's cart, and send confirmation emails.
 */
export async function POST(request: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────
  const rlResult = rl.check(request);
  if (!rlResult.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

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

  if (!verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  })) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Fetch stored checkout context
  const { data: pending } = await admin
    .from("pending_checkouts")
    .select("address_json, offer_id")
    .eq("user_id", user.id)
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  // Check if order already exists (webhook may have already created it)
  const { data: existingOrder } = await admin
    .from("orders")
    .select("id, user_id, payment_status")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Idempotency: if webhook already processed this payment
  if (existingOrder?.payment_status === "paid") {
    // Still need to clear cart if somehow not cleared
    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (cart) {
      await admin.from("cart_items").delete().eq("cart_id", cart.id);
    }
    // Clean up pending checkout (defensive)
    await admin.from("pending_checkouts").delete().eq("razorpay_order_id", razorpay_order_id);
    return NextResponse.json({ ok: true, orderId: existingOrder.id });
  }

  // Create order from cart now that payment succeeded
  const { data: orderResult, error: orderErr } = await admin.rpc(
    "create_order_from_cart_admin",
    {
      p_user_id: user.id,
      p_payment_method: "razorpay",
      p_shipping_paise: SHIPPING_FLAT_PAISE,
      p_offer_id: pending?.offer_id ?? null,
      p_razorpay_order_id: razorpay_order_id,
      p_address_json: pending?.address_json ?? {},
      p_razorpay_payment_id: razorpay_payment_id,
    },
  );

  if (orderErr) {
    // Cart may be empty or other error - but payment succeeded
    return NextResponse.json({ error: orderErr.message }, { status: 400 });
  }

  const order = Array.isArray(orderResult) ? orderResult[0] : orderResult;

  // Clear the buyer's cart now that payment is confirmed
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (cart) {
    await admin.from("cart_items").delete().eq("cart_id", cart.id);
  }

  // Clean up pending checkout
  await admin.from("pending_checkouts").delete().eq("razorpay_order_id", razorpay_order_id);

  // Fetch updated order for email
  const { data: fullOrder } = await admin
    .from("orders")
    .select("*")
    .eq("id", order.id)
    .maybeSingle();

  if (fullOrder) {
    await sendOrderEmails(
      fullOrder as Order,
      user.email ?? "",
      user.user_metadata?.full_name ?? null,
    );
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
