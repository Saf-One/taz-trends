import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/checkout/razorpay";
import { sendOrderEmails } from "@/lib/email/notify";
import type { Order } from "@/types/db";

/**
 * Razorpay webhook — server-to-server source of truth.
 *
 * Listens for `payment.captured` (the definitive "money moved" event).
 * Catches edge cases where the client-side verify callback in the browser
 * failed or was never called (user closed the tab, network drop, etc.).
 *
 * Idempotent, fully logged, and always returns 200 ASAP so Razorpay
 * does not retry a handled event.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // ── verify ──────────────────────────────────────────────────────────
  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[webhook] bad signature — rejecting");
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

  const razorpayPaymentId = event.payload?.payment?.entity?.id;
  const razorpayOrderId = event.payload?.payment?.entity?.order_id;

  if (!razorpayPaymentId || !razorpayOrderId) {
    console.warn("[webhook] payment.captured missing id/order_id");
    return NextResponse.json({ error: "missing_payment_data" }, { status: 400 });
  }

  // ── find order ──────────────────────────────────────────────────────
  const admin = createSupabaseAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, payment_status, user_id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!order) {
    // No local order yet — possible if create-order succeeded but
    // create_order_from_cart failed. Log and bounce.
    console.warn(
      "[webhook] no matching order for razorpay_order_id:",
      razorpayOrderId,
    );
    return NextResponse.json({ received: true });
  }

  // ── idempotency ─────────────────────────────────────────────────────
  // Razorpay may fire duplicate payment.captured for the same payment.
  // The client-side verify callback may also have already marked it paid.
  if (order.payment_status === "paid") {
    console.log("[webhook] order already paid — skipping (idempotent)");
    return NextResponse.json({ received: true });
  }

  // ── persist the captured payment ────────────────────────────────────
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "processing",
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("[webhook] failed to update order:", updateErr.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  console.log(
    "[webhook] order updated —",
    { orderId: order.id, razorpayPaymentId, razorpayOrderId },
  );

  // ── send confirmation emails (fire-and-forget) ──────────────────────
  // The client-side verify callback normally sends these, but if the
  // browser callback never ran (closed tab, network failure) the webhook
  // acts as the safety net. Fetch the full order + user email to send.
  const { data: fullOrder } = await admin
    .from("orders")
    .select("*")
    .eq("id", order.id)
    .maybeSingle();

  if (fullOrder) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .maybeSingle();

    if (profile?.email) {
      sendOrderEmails(
        fullOrder as Order,
        profile.email,
        profile.full_name,
      ).catch((e) =>
        console.error("[webhook] sendOrderEmails failed:", e),
      );
    } else {
      console.warn("[webhook] no profile/email for user:", order.user_id);
    }
  } else {
    console.warn("[webhook] could not re-fetch order after update");
  }

  return NextResponse.json({ received: true });
}
