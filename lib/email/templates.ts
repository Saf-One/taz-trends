import { STORE_NAME, SITE_URL, formatPaise } from "@/lib/config";
import type { Order, OrderItem } from "@/types/db";

interface ItemRow {
  name: string;
  variant?: string;
  qty: number;
  unit_price: number;
}

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f7ede8;font-family:Georgia,serif;color:#1a1414}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden}
  .head{background:#f8f2e7;padding:24px 32px;border-bottom:1px solid #e8ddd4}
  .head h1{margin:0;font-size:22px;color:#7b2d3b}
  .body{padding:28px 32px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ebe6;font-size:14px}
  .row:last-child{border:none}
  .total{font-weight:bold;font-size:16px;margin-top:8px}
  .btn{display:inline-block;margin-top:20px;padding:12px 28px;background:#7b2d3b;color:#fff;text-decoration:none;border-radius:6px;font-size:14px}
  .addr{margin-top:16px;padding:12px 16px;background:#f7ede8;border-radius:6px;font-size:13px;line-height:1.6}
  .footer{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #f0ebe6;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>${STORE_NAME}</h1></div>
  <div class="body">${body}</div>
  <div class="footer">&copy; ${STORE_NAME} &nbsp;·&nbsp; <a href="${SITE_URL}" style="color:#7b2d3b">${SITE_URL}</a></div>
</div>
</body></html>`;
}

function itemsTable(items: ItemRow[]): string {
  return items
    .map(
      (it) => `<div class="row">
      <span>${it.qty} × ${it.name}${it.variant ? ` <span style="color:#888;font-size:12px">(${it.variant})</span>` : ""}</span>
      <span>${formatPaise(it.unit_price * it.qty)}</span>
    </div>`,
    )
    .join("");
}

/** Admin alert: new order placed */
export function adminOrderEmail(
  order: Order,
  items: ItemRow[],
): { subject: string; html: string } {
  const method = order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay";
  const addr = order.address_json;
  const addrBlock = addr
    ? `<div class="addr">
        <strong>Ship to:</strong><br>
        ${addr.name ?? ""}${addr.phone ? ` · ${addr.phone}` : ""}<br>
        ${addr.street ?? ""}${addr.city ? `, ${addr.city}` : ""}${addr.postal ? ` - ${addr.postal}` : ""}
      </div>`
    : "";

  const body = `
    <p style="margin-top:0">New order received. Order <strong>#${order.id.slice(0, 8)}</strong> · ${method}</p>
    ${itemsTable(items)}
    <div class="row total"><span>Total</span><span>${formatPaise(order.total)}</span></div>
    ${addrBlock}
    <a href="${SITE_URL}/admin/orders/${order.id}" class="btn" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#7b2d3b;color:#fff!important;text-decoration:none;border-radius:6px;font-size:14px">View order →</a>
  `;

  return {
    subject: `New order #${order.id.slice(0, 8)} - ${formatPaise(order.total)} (${method})`,
    html: base("New order", body),
  };
}

/** Customer confirmation email */
export function customerOrderEmail(
  order: Order,
  items: ItemRow[],
  customerName: string | null,
): { subject: string; html: string } {
  const method = order.payment_method === "cod" ? "Cash on Delivery" : "Online payment";
  const addr = order.address_json;
  const addrBlock = addr
    ? `<div class="addr">
        <strong>Delivering to:</strong><br>
        ${addr.name ?? ""}${addr.phone ? ` · ${addr.phone}` : ""}<br>
        ${addr.street ?? ""}${addr.city ? `, ${addr.city}` : ""}${addr.postal ? ` - ${addr.postal}` : ""}
      </div>`
    : "";

  const greeting = customerName ? `Hi ${customerName.split(" ")[0]},` : "Hi,";

  const body = `
    <p style="margin-top:0">${greeting}</p>
    <p>Your order has been confirmed. We'll update you when it ships.</p>
    <p style="font-size:13px;color:#888">Order #${order.id.slice(0, 8)} · ${method}</p>
    ${itemsTable(items)}
    <div class="row total"><span>Total</span><span>${formatPaise(order.total)}</span></div>
    ${addrBlock}
    <a href="${SITE_URL}/orders/${order.id}" class="btn" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#7b2d3b;color:#fff!important;text-decoration:none;border-radius:6px;font-size:14px">View order →</a>
  `;

  return {
    subject: `Order confirmed - ${STORE_NAME} #${order.id.slice(0, 8)}`,
    html: base("Order confirmed", body),
  };
}

/** Customer: order status changed */
export function customerStatusEmail(
  order: Order,
  newStatus: string,
  customerName: string | null,
  trackingUrl: string | null = null,
): { subject: string; html: string } {
  const STATUS_MSG: Record<string, string> = {
    shipped: "Your order has been shipped and is on the way!",
    delivered: "Your order has been delivered. Enjoy!",
    cancelled: "Your order has been cancelled.",
    returned: "Your return has been processed.",
  };
  const msg = STATUS_MSG[newStatus] ?? `Your order status is now: ${newStatus}.`;
  const greeting = customerName ? `Hi ${customerName.split(" ")[0]},` : "Hi,";

  const trackingBlock = trackingUrl
    ? `<p style="margin-top:16px"><a href="${trackingUrl}" class="btn" style="display:inline-block;padding:12px 28px;background:#7b2d3b;color:#fff!important;text-decoration:none;border-radius:6px;font-size:14px">Track your shipment →</a></p>`
    : "";

  const body = `
    <p style="margin-top:0">${greeting}</p>
    <p>${msg}</p>
    ${trackingBlock}
    <p style="font-size:13px;color:#888">Order #${order.id.slice(0, 8)}</p>
    <a href="${SITE_URL}/orders/${order.id}" class="btn" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#7b2d3b;color:#fff!important;text-decoration:none;border-radius:6px;font-size:14px">View order →</a>
  `;

  return {
    subject: `Order update - ${newStatus} (#${order.id.slice(0, 8)})`,
    html: base("Order update", body),
  };
}
