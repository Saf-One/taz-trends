import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

/** Current auth user (or null). */
export async function getUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user's profile row (or null). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Require a logged-in user; redirect to sign-in otherwise. */
export async function requireUser(next = "/") {
  const user = await getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

/** Require an admin; redirect non-admins away. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/sign-in?next=/admin");
  if (!profile.is_admin) redirect("/");
  return profile;
}
