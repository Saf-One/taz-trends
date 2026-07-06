/**
 * Schema.org JSON-LD generator functions for Taz Trends.
 * Each function returns a plain object safe for JSON.stringify.
 */

const BASE_URL = "https://www.taztrends.in";
const STORE_NAME = "Taz Trends";

/* ── Organization (site-wide) ─────────────────────────────────────── */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/images/brand/brand_logo.jpg`,
      width: 512,
      height: 512,
    },
    description:
      "Women's ethnic fashion and outfits. Handpicked quality, traditional craftsmanship with a modern touch.",
    sameAs: [
      "https://instagram.com/taz.trends",
      "https://facebook.com/taztrends",
      "https://youtube.com/@taztrends",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

/* ── Website (site-wide) ──────────────────────────────────────────── */

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/images/brand/brand_logo.jpg`,
      width: 1080,
      height: 1080,
    },
    description:
      "Women's ethnic fashion and outfits. Handpicked quality, traditional craftsmanship with a modern touch.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── BreadcrumbList ───────────────────────────────────────────────── */

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/* ── Product (product detail page) ────────────────────────────────── */

interface ProductSchemaInput {
  name: string;
  description: string | null;
  image: string | null;
  sku: string;
  pricePaise: number;
  currency?: string;
  availability: "InStock" | "OutOfStock" | "LimitedAvailability";
  productUrl: string;
}

export function productSchema(input: ProductSchemaInput) {
  const price = (input.pricePaise / 100).toFixed(2);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    ...(input.description && { description: stripMarkdown(input.description).substring(0, 300) }),
    ...(input.image && { image: input.image }),
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: input.currency ?? "INR",
      availability: `https://schema.org/${input.availability}`,
      url: input.productUrl,
    },
  };
}

/* ── Homepage @graph (combines Organization + WebSite) ────────────── */

export function homeSchemaGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationSchema(), websiteSchema()],
  };
}

/* ── FAQ Page ──────────────────────────────────────────────────────── */

export function faqPageSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/** Strip common markdown characters for clean text output in schema. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/[*_~`#]/g, "") // bold, italic, strikethrough, code, heading markers
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links/images: [text](url) -> text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // emoji range
    .replace(/\r?\n\s*\r?\n/g, "\n") // normalize multiple newlines
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}
