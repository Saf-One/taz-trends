import type { Metadata } from "next";
import { SITE_URL, STORE_NAME } from "@/lib/config";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema, organizationSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
  title: `About ${STORE_NAME} - Women's Ethnic Fashion`,
  description:
    `Learn more about ${STORE_NAME} – handpicked women's ethnic wear, traditional Indian outfits, and modern styles. Quality craftsmanship since 2026.`,
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `About ${STORE_NAME}`,
    description:
      "Handpicked women's ethnic wear with traditional craftsmanship and modern style.",
    url: `${SITE_URL}/about`,
  },
};

const faqs = [
  {
    question: "What types of products does Taz Trends offer?",
    answer:
      "Taz Trends specializes in women's ethnic fashion including Pakistani suits, sharara sets, lehenga cholis, and traditional Indian wear. Our collection features handpicked fabrics and contemporary designs blending tradition with modern style.",
  },
  {
    question: "Do you ship across India?",
    answer:
      "Yes, we offer shipping across India. Orders are processed within 1-2 business days and delivered via trusted courier partners. Shipping charges and estimated delivery times are shown at checkout.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments via Razorpay (credit/debit cards, UPI, net banking, wallets) and Cash on Delivery (COD) for eligible orders. All online payments are processed securely through Razorpay's encrypted gateway.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "We strive to ensure your satisfaction. If you receive a damaged or incorrect item, please contact our customer service within 48 hours of delivery. Return and exchange policies vary by product — reach out to us and we'll assist you.",
  },
  {
    question: "How do I place a bulk or custom order?",
    answer:
      "You can submit a quote request through our website with your requirements. Our team will review your request and get back to you with pricing and availability for bulk or custom orders.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach us via email or through the contact form on our website. We aim to respond to all inquiries within 24-48 hours during business days.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={organizationSchema()} />

      <div className="container-page py-12">
        {/* About Section */}
        <section className="mx-auto max-w-3xl">
          <h1 className="mb-6 font-serif text-3xl text-ink">
            About {STORE_NAME}
          </h1>
          <div className="space-y-4 text-sm text-ink/70 leading-relaxed">
            <p>
              Welcome to Taz Trends — your destination for women's ethnic
              fashion that celebrates tradition while embracing modern style.
              We carefully curate each piece to bring you handpicked quality,
              from everyday elegance to festive occasion wear.
            </p>
            <p>
              Our collection features Pakistani suits, sharara sets, lehenga
              cholis, and more — every item selected for its craftsmanship,
              fabric quality, and timeless appeal. We believe that ethnic wear
              should make every woman feel confident, comfortable, and beautiful.
            </p>
            <p>
              Based in India, we are committed to offering authentic designs
              at accessible prices, with reliable shipping across the country.
              Whether you're dressing for a celebration or adding to your
              everyday wardrobe, Taz Trends brings you styles you'll love.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 font-serif text-2xl text-ink">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-lg border border-ink/10 transition-colors open:border-wine/30"
              >
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:text-wine transition-colors [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <svg
                    className="h-4 w-4 shrink-0 text-ink/40 transition-transform group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <div className="border-t border-ink/5 px-4 py-3 text-xs text-ink/60 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
