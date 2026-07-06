import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Dynamic sitemap for Taz Trends.
 * Includes: home page, static routes, and all active product pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.taztrends.in";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/orders`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/quote`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  // Active product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createSupabaseServerClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active");

    if (products) {
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Supabase not configured yet — return static pages only
  }

  return [...staticPages, ...productPages];
}
