import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Offer } from "@/types/db";

/**
 * Look up a user-entered offer code and confirm it is usable:
 * active, and (when a window is set) within [starts_at, ends_at].
 * Returns the offer or null. Discount math itself is Razorpay's job.
 */
export async function validateOfferCode(code: string): Promise<Offer | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("code", trimmed)
    .eq("is_active", true)
    .maybeSingle();

  const offer = (data as Offer) ?? null;
  if (!offer) return null;

  const now = Date.now();
  if (offer.starts_at && now < new Date(offer.starts_at).getTime()) return null;
  if (offer.ends_at && now > new Date(offer.ends_at).getTime()) return null;

  return offer;
}
