import type { Metadata, Viewport } from "next";
import "./globals.css";
import { STORE_NAME, SITE_URL } from "@/lib/config";
import { ToastProvider } from "@/lib/notifications/ToastProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const OG_IMAGE = "/images/brand/brand_logo.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STORE_NAME} - Women's Ethnic Fashion`,
    template: `%s · ${STORE_NAME}`,
  },
  description: "Women's ethnic fashion and outfits.",
  openGraph: {
    siteName: STORE_NAME,
    images: [{ url: OG_IMAGE, width: 800, height: 800, alt: STORE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
