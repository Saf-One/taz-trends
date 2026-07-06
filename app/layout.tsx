import type { Metadata, Viewport } from "next";
import "./globals.css";
import { STORE_NAME, SITE_URL } from "@/lib/config";
import { ToastProvider } from "@/lib/notifications/ToastProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeSchemaGraph } from "@/lib/seo/schemas";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const OG_IMAGE = "/images/brand/brand_logo.jpg";
const OG_IMAGE_FULL = `${SITE_URL.replace(/\/$/, "")}/images/brand/brand_logo.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STORE_NAME} - Women's Ethnic Fashion Online | Indian Wear & Traditional Outfits`,
    template: `%s · ${STORE_NAME}`,
  },
  description:
    "Shop women's ethnic fashion at Taz Trends. Handpicked Indian ethnic wear, traditional outfits, and modern styles. Free shipping across India. Quality craftsmanship.",
  robots: {
    index: true,
    follow: true,
    "max-snippet": 150,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: STORE_NAME,
    title: `${STORE_NAME} - Women's Ethnic Fashion Online`,
    description:
      "Shop women's ethnic fashion at Taz Trends. Handpicked Indian ethnic wear, traditional outfits, and modern styles. Free shipping across India.",
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE_FULL,
        width: 1200,
        height: 630,
        alt: STORE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE_NAME} - Women's Ethnic Fashion Online`,
    description:
      "Shop women's ethnic fashion at Taz Trends. Handpicked Indian ethnic wear, traditional outfits, and modern styles.",
    images: [OG_IMAGE_FULL],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/images/favicon/favicon.ico",
    apple: "/images/favicon/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/images/favicon/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/images/favicon/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/images/favicon/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/images/favicon/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/images/favicon/site.webmanifest",
  other: {
    "geo.region": "IN",
    "geo.placename": "India",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {/* Preconnect to image origin */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ""} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ""} />
        <JsonLd data={homeSchemaGraph()} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
