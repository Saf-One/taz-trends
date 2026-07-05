import type { OrderAddress } from "@/types/db";

/**
 * Normalize orders.address_json. Rows written before the object-vs-string
 * fix hold a double-encoded JSON string scalar; parse those back into an
 * object so old orders still show their address.
 */
export function parseOrderAddress(value: unknown): OrderAddress | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as OrderAddress)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as OrderAddress;
  return null;
}
