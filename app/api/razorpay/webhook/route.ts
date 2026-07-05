import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/checkout/razorpay";

/**
 * Razorpay webhook (server-to-server source of truth). Idempotently marks
 * the matching local order paid on payment.captured / order.paid. Verified
 * against the raw body - do not parse before checking the signature.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const type = event.event;
  const razorpayOrderId = event.payload?.payment?.entity?.order_id;

  if (
    (type === "payment.captured" || type === "order.paid") &&
    razorpayOrderId
  ) {
    const admin = createSupabaseAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (order && order.payment_status !== "paid") {
      await admin
        .from("orders")
        .update({ payment_status: "paid", status: "processing" })
        .eq("id", order.id);
    }
  }

  // Always 200 quickly so Razorpay doesn't retry a handled event.
  return NextResponse.json({ received: true });
}
