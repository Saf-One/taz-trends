# Skill: Checkout Flow

Owner: **checkout-agent**. Covers quote, the two payment branches
(Razorpay-with-optional-`offer_id` and COD), and order status.

## Preconditions

- **Quote step** may happen **pre-login**.
- **Placing an order requires login** (Google via Supabase Auth). Enforce
  the session check before creating any order.
- An order is built from the user's cart (read-only from cart-agent).

## Shared start

1. If the user only wants a **quote**, capture the quote (may be pre-login)
   and stop. Quote-to-order conversion specifics are **TBD**.
2. To place an order, ensure the user is logged in. If not, send them
   through Google sign-in first (this triggers cart-merge-on-login).
3. Build the order draft from the current cart: line items, quantities,
   and prices (integer paise, INR).
4. User selects a payment method: **Razorpay** or **COD**. These are two
   **separate branches** below.

---

## Branch A — Razorpay (online payment)

1. Optionally attach an **`offer_id`** (from offers-agent's active offers).
   The `offer_id` is **optional**; proceed with none if not provided.
2. Create a Razorpay order server-side, passing amount (paise), currency
   `INR`, and `offer_id` if present. Never expose secrets to the browser.
3. Persist a local `orders` row with `payment_method = 'razorpay'`,
   `payment_status = 'pending'`, and the Razorpay order id.
4. Open Razorpay checkout on the client.
5. On payment result, **verify the signature server-side** (and/or handle
   the Razorpay **webhook**) before trusting success.
6. On verified success: set `payment_status = 'paid'` and move the order
   into the fulfillment flow (post-payment status values **TBD**).
7. On failure/cancel: leave `payment_status = 'pending'`/`failed`; do not
   fulfill. Do not clear the cart until payment is confirmed.

---

## Branch B — Cash on Delivery (COD) — separate path

**Settled behavior (bake in):** COD orders are placed **immediately**.
There is **NO admin pre-confirmation step**.

1. Create the `orders` row immediately with:
   - `payment_method = 'cod'`
   - `status = 'cash_on_delivery'`
   - `payment_status = 'unpaid'`
2. The order is confirmed to the customer right away.
3. The admin later updates the status **manually** from the admin dashboard
   based on the real-world outcome. Required transitions:

   ```
   cash_on_delivery -> delivered        (order delivered)
   cash_on_delivery -> returned         (not picked up / returned)
   ```

4. No offer_id is attached in the Razorpay sense (Razorpay `offer_id` is a
   Razorpay concept). Whether offers apply to COD at all is **TBD**.

---

## Order status model (summary — see docs/SCHEMA.md)

- Razorpay path: `pending` payment -> `paid` -> fulfillment (values TBD).
- COD path: `cash_on_delivery` -> `delivered` | `returned`.

Status-transition rules live here (checkout-agent). The admin dashboard
(admin-agent) only surfaces the controls to trigger allowed transitions.

## TBD to confirm

- Currency.
- Post-payment fulfillment statuses for the Razorpay path.
- Whether offers apply to COD.
- Quote workflow (fields, conversion to order, who follows up).
- Cancellation / return window policy.
