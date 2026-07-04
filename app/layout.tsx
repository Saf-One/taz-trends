import type { Metadata } from "next";
import "./globals.css";
import { STORE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${STORE_NAME} — Women's Ethnic Fashion`,
    template: `%s · ${STORE_NAME}`,
  },
  description: "Women's ethnic fashion and outfits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
