import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { razorpayClient } from "@/lib/checkout/razorpay";
import { validateOfferCode } from "@/lib/offers/validate";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";
import { rateLimit } from "@/lib/security/rate-limit";

/** 5 create-order attempts per minute per IP */
const rl = rateLimit({ max: 5, windowMs: 60_000, label: "create-order" });

/**
 * Start the Razorpay path: compute the total server-side, create a Razorpay
 * order (optionally with an offer), and store checkout context temporarily.
 * Does NOT create a local order yet - the order is only created when payment
 * succeeds (via verify or webhook). Returns what the browser widget needs.
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
  const offerCode: string | undefined = body?.offerCode;
  const address = body?.address || {};

  // Server-computed subtotal - never trust a client amount.
  const { data: subtotal, error: subErr } = await supabase.rpc(
    "cart_subtotal_paise",
  );
  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 400 });
  }
  if (!subtotal || subtotal <= 0) {
    return NextResponse.json({ error: "cart_empty" }, { status: 400 });
  }

  const total = (subtotal as number) + SHIPPING_FLAT_PAISE;

  // Offers apply to the Razorpay path only (COD excluded).
  const offer = offerCode ? await validateOfferCode(offerCode) : null;
  if (offerCode && !offer) {
    return NextResponse.json({ error: "invalid_offer" }, { status: 400 });
  }

  let rzpOrder;
  try {
    const rzp = razorpayClient();
    rzpOrder = await rzp.orders.create({
      amount: total,
      currency: "INR",
      receipt: `u_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id },
      ...(offer ? { offers: [offer.razorpay_offer_id] } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "razorpay_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Store checkout context temporarily - will be used when payment succeeds.
  // This prevents orphan orders if user cancels/closes browser.
  await supabase.from("pending_checkouts").upsert({
    user_id: user.id,
    razorpay_order_id: rzpOrder.id,
    address_json: address,
    offer_id: offer?.id ?? null,
  });

  // Return Razorpay order data - the local order will be created
  // in verify or webhook when payment succeeds.
  return NextResponse.json({
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    currency: "INR",
  });
}
