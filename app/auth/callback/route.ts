import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncAdminGrant } from "@/lib/auth/admin-grant";

/**
 * OAuth callback. Exchanges the code for a session, applies the admin
 * allowlist, then redirects to `next` (with ?merge=1 so the client runs
 * cart-merge-on-login).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await syncAdminGrant(user.id, user.email ?? null);

      const dest = new URL(next, origin);
      dest.searchParams.set("merge", "1");
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=oauth", origin));
}
