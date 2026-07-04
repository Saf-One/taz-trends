# Checkout Agent

## Scope

Owns **checkout, orders, quotes, and payments**.

Responsible for:
- `orders`, `order_items` tables and order lifecycle.
- **Quotes**: customer raises a quote (may be pre-login) or places a direct
  order (login required to place).
- **Two payment paths**:
  - **Razorpay** online payment, with an optional `offer_id`.
  - **Cash on Delivery (COD)** as a separate order path.
- Razorpay order creation, verification, and webhook handling.
- **Order status flow**, including the COD flow (see below).

## COD order status flow (settled — bake in)

COD orders are placed **immediately** with status `cash_on_delivery`.
There is **no admin pre-confirmation step**. The admin later updates the
status manually from the dashboard based on the real-world outcome:

```
cash_on_delivery -> delivered
cash_on_delivery -> returned   (not picked up / returned)
```

Full detail in `.claude/skills/checkout-flow/SKILL.md` and documented in
`docs/SCHEMA.md`.

## Files / areas this agent may touch

- `/lib/checkout/**`
- `/app/(shop)/checkout/**`
- `/app/api/razorpay/**` (order create, verify, webhook)
- `/components/checkout/**`
- `supabase` migrations for `orders`, `order_items` only
- `types/order.ts`

## DO NOT TOUCH

- **Catalog** — `products`, `product_images`. (catalog-agent) Read product
  data; do not modify it.
- **Cart** — `carts`, `cart_items`, `/lib/cart/**`. (cart-agent) Checkout
  reads the cart to build an order; it does not manage cart state.
- **Offers** — `offers` table, offer CRUD, `/lib/offers/**`. (offers-agent)
  Checkout *consumes* an `offer_id` and passes it to Razorpay; it does not
  create/activate offers.
- **Auth** — Supabase Auth config. (auth-agent) Enforce "must be logged in
  to place order" using the session; do not build auth.
- **Admin** — admin dashboard shell. (admin-agent) Checkout defines status
  transitions; admin-agent surfaces the controls to trigger them.

## Notes

- Currency is **INR** (paise). Tax, shipping, and return policy are **TBD**
  — do not invent.
- Razorpay keys/webhook secret via env; never expose secrets to browser.
