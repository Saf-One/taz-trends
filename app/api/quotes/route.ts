import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";

/** 3 quote submissions per minute per IP */
const rl = rateLimit({ max: 3, windowMs: 60_000, label: "quotes" });

/** Submit a request-for-quote. Allowed pre-login (user_id optional). */
export async function POST(request: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────
  const rlResult = rl.check(request);
  if (!rlResult.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const cart_snapshot = body?.cart_snapshot ?? null;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Basic input length sanitization to prevent abuse
  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return NextResponse.json({ error: "field_too_long" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("quotes").insert({
    user_id: user?.id ?? null,
    name,
    email,
    phone,
    message,
    cart_snapshot,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
