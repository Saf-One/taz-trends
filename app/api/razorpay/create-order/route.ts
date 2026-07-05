import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { razorpayClient } from "@/lib/checkout/razorpay";
import { validateOfferCode } from "@/lib/offers/validate";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";

/**
 * Start the Razorpay path: compute the total server-side, create a Razorpay
 * order (optionally with an offer), and persist a local `orders` row at
 * status pending. Returns what the browser widget needs.
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

  // Persist the local order (recomputes subtotal server-side to match).
  const { data: created, error: orderErr } = await supabase.rpc(
    "create_order_from_cart",
    {
      p_payment_method: "razorpay",
      p_shipping_paise: SHIPPING_FLAT_PAISE,
      p_offer_id: offer?.id ?? null,
      p_razorpay_order_id: rzpOrder.id,
      // Object as-is: stringifying stores a JSON string scalar, not an object.
      p_address_json: address,
    },
  );
  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 400 });
  }
  const order = Array.isArray(created) ? created[0] : created;

  return NextResponse.json({
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    currency: "INR",
    orderId: order.id,
  });
}
