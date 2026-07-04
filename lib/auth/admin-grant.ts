import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Emails auto-granted admin, from the ADMIN_EMAILS env allowlist. */
function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * If the user's email is on the allowlist, ensure profiles.is_admin = true.
 * Runs server-side with the service role (RLS forbids self-elevation).
 * Idempotent; safe to call on every login.
 */
export async function syncAdminGrant(userId: string, email: string | null) {
  if (!email) return;
  if (!adminEmailAllowlist().includes(email.toLowerCase())) return;

  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({ is_admin: true }).eq("id", userId);
}
