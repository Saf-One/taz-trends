import type { OrderStatus, PaymentMethod } from "@/types/db";

/**
 * Allowed order-status transitions. This logic is owned by the checkout
 * domain; the admin dashboard only surfaces controls for these. COD flow
 * (settled): cash_on_delivery -> delivered | returned.
 */
export function allowedNextStatuses(
  current: OrderStatus,
  _method: PaymentMethod,
): OrderStatus[] {
  switch (current) {
    case "cash_on_delivery":
      return ["shipped", "delivered", "returned"];
    case "pending":
      return ["processing", "cancelled"];
    case "processing":
      return ["shipped", "cancelled"];
    case "shipped":
      return ["delivered", "returned"];
    case "delivered":
      return ["returned"];
    case "cancelled":
    case "returned":
      return [];
    default:
      return [];
  }
}

export function isValidTransition(
  current: OrderStatus,
  next: OrderStatus,
  method: PaymentMethod,
): boolean {
  return allowedNextStatuses(current, method).includes(next);
}
