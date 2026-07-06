import type { Metadata } from "next";
import { SITE_URL, STORE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Contact ${STORE_NAME} - Get in Touch`,
  description:
    `Contact ${STORE_NAME} customer support. Email us for inquiries about orders, products, returns, or bulk purchases. We're here to help.`,
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `Contact ${STORE_NAME}`,
    description: "Get in touch with our team for orders, inquiries, and support.",
    url: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="container-page py-12">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-3xl text-ink">
          Contact {STORE_NAME}
        </h1>
        <p className="mb-8 text-sm text-ink/60">
          Have a question about an order, product, or your account? We're here
          to help. Reach out to us and we'll get back to you within 24-48 hours.
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Email */}
          <div className="rounded-lg border border-ink/10 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-wine/10">
              <svg
                className="h-5 w-5 text-wine"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mb-1 font-serif text-sm font-medium text-ink">
              Email Us
            </h2>
            <p className="text-xs text-ink/50">
              <span className="text-ink/70">help@taztrends.in</span>
              <br />
              We respond within 24-48 hours.
            </p>
          </div>

          {/* Social */}
          <div className="rounded-lg border border-ink/10 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-wine/10">
              <svg
                className="h-5 w-5 text-wine"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22.54 6.42a3.006 3.006 0 00-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.42.75a3.006 3.006 0 00-2.12 2.12C0 8.08 0 12 0 12s0 3.92.46 5.58a3.006 3.006 0 002.12 2.12c1.92.75 9.42.75 9.42.75s7.5 0 9.42-.75a3.006 3.006 0 002.12-2.12C24 15.92 24 12 24 12s0-3.92-.46-5.58z" />
                <path d="M9.75 15.02l6.2-3.02-6.2-3.02v6.04z" />
              </svg>
            </div>
            <h2 className="mb-1 font-serif text-sm font-medium text-ink">
              Follow Us
            </h2>
            <p className="text-xs text-ink/50">
              <a
                href="https://instagram.com/taz.trends"
                className="text-wine hover:underline"
                rel="me"
              >
                Instagram
              </a>
              <span className="mx-2 text-ink/20">·</span>
              <a
                href="https://facebook.com/taztrends"
                className="text-wine hover:underline"
                rel="me"
              >
                Facebook
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
