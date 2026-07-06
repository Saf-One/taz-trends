import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/checkout/razorpay";
import { sendOrderEmails } from "@/lib/email/notify";
import type { Order } from "@/types/db";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";

/**
 * Razorpay webhook - server-to-server source of truth.
 *
 * Listens for `payment.captured` (the definitive "money moved" event).
 * On successful payment, creates the local order from cart (if not already done
 * by the verify endpoint) and clears the buyer's cart.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // ── verify ──────────────────────────────────────────────────────────
  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[webhook] bad signature - rejecting");
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // ── parse ───────────────────────────────────────────────────────────
  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    console.warn("[webhook] invalid JSON body");
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const type = event.event;
  console.log("[webhook] event received:", type);

  // We only care about captured payments (the definitive "money moved" event)
  if (type !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const admin = createSupabaseAdminClient();
  const razorpayPaymentId = event.payload?.payment?.entity?.id;
  const razorpayOrderId = event.payload?.payment?.entity?.order_id;

  if (!razorpayPaymentId || !razorpayOrderId) {
    console.warn("[webhook] payment.captured missing id/order_id");
    return NextResponse.json({ error: "missing_payment_data" }, { status: 400 });
  }

  // ── find pending checkout (contains user_id, address, offer) ----------
  const { data: pending } = await admin
    .from("pending_checkouts")
    .select("user_id, address_json, offer_id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!pending) {
    console.warn(
      "[webhook] no pending checkout for razorpay_order_id:",
      razorpayOrderId,
    );
    return NextResponse.json({ received: true });
  }

  const userId = pending.user_id;

  // ── check if order already exists ------------------------------------
  // (verify endpoint may have already created it)
  const { data: order } = await admin
    .from("orders")
    .select("id, payment_status, user_id")
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("user_id", userId)
    .maybeSingle();

  // ── idempotency ─────────────────────────────────────────────────────
  // Razorpay may fire duplicate payment.captured for the same payment.
  if (order && order.payment_status === "paid") {
    // Still ensure cart is cleared (defensive)
    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (cart) {
      await admin.from("cart_items").delete().eq("cart_id", cart.id);
    }
    await admin
      .from("pending_checkouts")
      .delete()
      .eq("razorpay_order_id", razorpayOrderId);
    console.log("[webhook] order already paid - skipping (idempotent)");
    return NextResponse.json({ received: true });
  }

  // ── create order from cart -----------------------------------------
  const { data: orderResult, error: createErr } = await admin.rpc(
    "create_order_from_cart_admin",
    {
      p_user_id: userId,
      p_payment_method: "razorpay",
      p_shipping_paise: SHIPPING_FLAT_PAISE,
      p_offer_id: pending.offer_id ?? null,
      p_razorpay_order_id: razorpayOrderId,
      p_address_json: pending.address_json ?? {},
      p_razorpay_payment_id: razorpayPaymentId,
    },
  );

  if (createErr) {
    console.error("[webhook] failed to create order:", createErr.message);
    // Return 500 so Razorpay retries - payment was captured but our order
    // creation failed; we need this to succeed.
    return NextResponse.json(
      { error: "order_creation_failed" },
      { status: 500 },
    );
  }

  const createdOrder = Array.isArray(orderResult) ? orderResult[0] : orderResult;

  // ── clear cart ------------------------------------------------------
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (cart) {
    await admin.from("cart_items").delete().eq("cart_id", cart.id);
  }

  // Clean up pending checkout
  await admin
    .from("pending_checkouts")
    .delete()
    .eq("razorpay_order_id", razorpayOrderId);

  // ── send confirmation emails ----------------------------------------
  const { data: fullOrder } = await admin
    .from("orders")
    .select("*")
    .eq("id", createdOrder.id)
    .maybeSingle();

  if (fullOrder) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.email) {
      sendOrderEmails(
        fullOrder as Order,
        profile.email,
        profile.full_name,
      ).catch((e) => console.error("[webhook] sendOrderEmails failed:", e));
    }
  }

  console.log("[webhook] order created:", createdOrder.id);
  return NextResponse.json({ received: true });
}