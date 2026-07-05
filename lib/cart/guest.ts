import type { GuestCartLine } from "@/types/db";

/**
 * Guest cart persistence in localStorage. Identity of a line is
 * (product_id, variant_id) with variant_id null for simple products - kept
 * as its own key, never collapsed. See cart-merge-on-login skill.
 */
const KEY = "guest_cart_v1";

function sameLine(a: GuestCartLine, b: GuestCartLine): boolean {
  return a.product_id === b.product_id && a.variant_id === b.variant_id;
}

export function getGuestLines(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.product_id === "string")
      .map((l) => ({
        product_id: l.product_id,
        variant_id: l.variant_id ?? null,
        quantity: Math.max(1, Number(l.quantity) || 1),
      }));
  } catch {
    return [];
  }
}

export function setGuestLines(lines: GuestCartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
}

/** Add qty to a line, summing on the (product_id, variant_id) key. */
export function addGuestLine(line: GuestCartLine): void {
  const lines = getGuestLines();
  const existing = lines.find((l) => sameLine(l, line));
  if (existing) existing.quantity += line.quantity;
  else lines.push({ ...line });
  setGuestLines(lines.filter((l) => l.quantity > 0));
}

export function setGuestQty(
  product_id: string,
  variant_id: string | null,
  quantity: number,
): void {
  const lines = getGuestLines().filter(
    (l) => !(l.product_id === product_id && l.variant_id === variant_id),
  );
  if (quantity > 0) lines.push({ product_id, variant_id, quantity });
  setGuestLines(lines);
}

export function clearGuest(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
