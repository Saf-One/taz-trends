import { NextResponse } from "next/server";
import { getResend, adminEmails } from "@/lib/email/resend";
import { STORE_NAME } from "@/lib/config";

/**
 * Debug endpoint to test Resend email configuration.
 * GET /api/debug/test-email
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    env_vars: {
      RESEND_API_KEY: process.env.RESEND_API_KEY
        ? `✅ set (${process.env.RESEND_API_KEY.slice(0, 8)}...)`
        : "❌ NOT SET",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "⚠️ NOT SET (using default)",
      ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "⚠️ NOT SET",
      NEXT_PUBLIC_STORE_NAME:
        process.env.NEXT_PUBLIC_STORE_NAME ?? "⚠️ NOT SET (using default)",
    },
    resolved: {
      from_address:
        process.env.RESEND_FROM_EMAIL ||
        `${STORE_NAME} <orders@taztrends.com>`,
      admin_recipients: adminEmails(),
    },
    resend_client: null as unknown,
    test_send: null as unknown,
  };

  // Check if Resend client initialises
  try {
    const resend = getResend();
    if (!resend) {
      diagnostics.resend_client =
        "❌ getResend() returned null — RESEND_API_KEY invalid or missing";
      return NextResponse.json(diagnostics, { status: 200 });
    }
    diagnostics.resend_client = "✅ Resend client created";

    // Try sending a test email to the first admin email (if available)
    const toAdmin = adminEmails();
    if (toAdmin.length === 0) {
      diagnostics.test_send =
        "⚠️ Skipped — no ADMIN_EMAILS configured to send the test to";
    } else {
      const from =
        process.env.RESEND_FROM_EMAIL ||
        `${STORE_NAME} <orders@taztrends.com>`;

      const result = await resend.emails
        .send({
          from,
          to: [toAdmin[0]],
          subject: "🔧 Test email from your store",
          html: `<p>This is a test from your e-commerce site.</p><p>If you're reading this, Resend is configured correctly ✅</p>`,
        })
        .then((r: unknown) => ({ status: "fulfilled", data: r }))
        .catch((e: Error) => ({ status: "rejected", error: e.message }));

      diagnostics.test_send = result;
    }
  } catch (e) {
    diagnostics.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
