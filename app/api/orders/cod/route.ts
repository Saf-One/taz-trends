import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";
import { sendOrderEmails } from "@/lib/email/notify";
import type { Order } from "@/types/db";

/**
 * Place a Cash-on-Delivery order. COD is placed IMMEDIATELY at status
 * cash_on_delivery (no admin pre-confirmation) - settled decision. The RPC
 * builds the order from the server cart, decrements stock, and clears it.
 * Address is stored in order metadata (JSON field).
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
  const address = body?.address || {};

  const { data, error } = await supabase.rpc("create_order_from_cart", {
    p_payment_method: "cod",
    p_shipping_paise: SHIPPING_FLAT_PAISE,
    p_offer_id: null,
    p_razorpay_order_id: null,
    // Pass the object as-is: stringifying would store a JSON *string*
    // scalar in the jsonb column instead of an object.
    p_address_json: address,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const order = Array.isArray(data) ? data[0] : data;

  // Await so serverless fn doesn't exit before email sends.
  // Errors are caught inside sendOrderEmails — won't fail the order.
  await sendOrderEmails(
    order as Order,
    user.email ?? "",
    user.user_metadata?.full_name ?? null,
  );

  return NextResponse.json({ orderId: order.id });
}
