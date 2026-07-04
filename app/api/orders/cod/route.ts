import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SHIPPING_FLAT_PAISE } from "@/lib/config";

/**
 * Place a Cash-on-Delivery order. COD is placed IMMEDIATELY at status
 * cash_on_delivery (no admin pre-confirmation) — settled decision. The RPC
 * builds the order from the server cart, decrements stock, and clears it.
 */
export async function POST() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("create_order_from_cart", {
    p_payment_method: "cod",
    p_shipping_paise: SHIPPING_FLAT_PAISE,
    p_offer_id: null,
    p_razorpay_order_id: null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const order = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ orderId: order.id });
}
