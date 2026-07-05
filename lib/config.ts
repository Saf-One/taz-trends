/**
 * Single source of truth for store-wide config. Brand name, currency,
 * shipping are placeholders/defaults per docs/HANDOFF.md assumptions log -
 * change here (or via env) rather than hunting through the codebase.
 */

export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Taz Trends";

// Currency is INR only (settled). Money is integer paise everywhere.
export const CURRENCY = "INR" as const;

// Flat shipping in paise. Default ₹0 (free) - assumption, see HANDOFF.
export const SHIPPING_FLAT_PAISE = Number(
  process.env.SHIPPING_FLAT_PAISE ?? 0,
);

// SITE_URL: comma-separated list (e.g. "http://localhost:3000,example.com,https://other.com")
// Auto-adds https:// to bare domains. Primary (first) used as default.
const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteUrls = siteUrlRaw
  .split(",")
  .map((url) => {
    const trimmed = url.trim().replace(/\/$/, "");
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  })
  .filter(Boolean);
export const SITE_URL = siteUrls[0] || "http://localhost:3000";
export const SITE_URLS = siteUrls;

/** Format integer paise as an INR string, e.g. 149900 -> "₹1,499.00". */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(rupees);
}
