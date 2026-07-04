import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Keeps the auth session fresh and guards /admin. Fine-grained admin
 * authorization is enforced by RLS + the admin layout; this is a fast
 * "must be logged in" gate for the admin area.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
  if (isAdminArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
