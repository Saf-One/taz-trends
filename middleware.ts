import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

/**
 * Security headers applied to every response.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * Content Security Policy.
 * - Default-src: self
 * - Scripts: self + Razorpay checkout + strict-dynamic fallback
 * - Styles: self + 'unsafe-inline' for Tailwind
 * - Images: self + Supabase storage + data:
 * - Frames: Razorpay (for payment modal)
 * - Connect: self + Supabase + Razorpay API
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "frame-src 'self' https://api.razorpay.com",
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Middleware:
 * 1. Refreshes Supabase session.
 * 2. Blocks unauthenticated access to /admin.
 * 3. Blocks non-admin access to /admin (checks profiles.is_admin via RPC).
 * 4. Applies security headers and CSP to all responses.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isAdminArea = pathname.startsWith("/admin");

  // ── Unauthenticated: gate /admin (redirect to sign-in) ────────────
  if (isAdminArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated but not admin: gate /admin (redirect home) ──────
  if (isAdminArea && user) {
    // Check is_admin via Supabase using the user's own session (RLS-compliant)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {
            /* read-only in middleware */
          },
        },
      },
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // ── Apply security headers ────────────────────────────────────────
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  // Only set CSP on HTML pages (not API routes, static assets)
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|js|css)$/)
  ) {
    headers.set("Content-Security-Policy", CSP);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
