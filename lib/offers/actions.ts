"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create an offer mapping to a Razorpay offer_id. We validate structure,
 * not discount policy - the actual discount lives in Razorpay.
 */
export async function createOffer(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const starts = String(formData.get("starts_at") ?? "").trim();
  const ends = String(formData.get("ends_at") ?? "").trim();

  const { error } = await supabase.from("offers").insert({
    name: String(formData.get("name") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    razorpay_offer_id: String(formData.get("razorpay_offer_id") ?? "").trim(),
    is_active: formData.get("is_active") === "on",
    starts_at: starts ? new Date(starts).toISOString() : null,
    ends_at: ends ? new Date(ends).toISOString() : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/offers");
}

/** Soft toggle - never deletes; preserves history on past orders. */
export async function toggleOffer(offerId: string, isActive: boolean) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("offers")
    .update({ is_active: isActive })
    .eq("id", offerId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/offers");
}

/** Validate an offer code from the checkout / cart UI (client components). */
export async function validateOfferCodeAction(
  code: string,
): Promise<{ valid: boolean; offerName?: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { valid: false };
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("offers")
    .select("name, is_active, starts_at, ends_at")
    .eq("code", trimmed)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return { valid: false };
  const now = Date.now();
  if (data.starts_at && now < new Date(data.starts_at).getTime())
    return { valid: false };
  if (data.ends_at && now > new Date(data.ends_at).getTime())
    return { valid: false };
  return { valid: true, offerName: data.name ?? undefined };
}
