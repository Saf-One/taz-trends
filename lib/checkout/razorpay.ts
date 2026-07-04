import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

/** Server-side Razorpay client. Throws clearly if keys are missing. */
export function razorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured (RAZORPAY_KEY_ID/SECRET).");
  }
  return new Razorpay({ key_id, key_secret });
}

/** Verify the checkout callback signature (order_id|payment_id HMAC). */
export function verifyPaymentSignature(args: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${args.razorpay_order_id}|${args.razorpay_payment_id}`)
    .digest("hex");
  return timingSafeEqual(expected, args.razorpay_signature);
}

/** Verify a Razorpay webhook payload signature against the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
