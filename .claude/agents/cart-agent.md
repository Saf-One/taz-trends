# Cart Agent

## Scope

Owns the **shopping cart** across guest and logged-in states.

Responsible for:
- Guest cart in `localStorage`.
- Logged-in cart in Supabase (`carts`, `cart_items`).
- The **merge-on-login** behavior — merge, never overwrite, never silently
  drop either side. See `.claude/skills/cart-merge-on-login/SKILL.md`.
- Add/update/remove line items; quantity handling.

## Files / areas this agent may touch

- `/lib/cart/**`
- `/components/cart/**`
- `/app/(shop)/cart/**`
- `supabase` migrations for `carts`, `cart_items` only
- `types/cart.ts`

## DO NOT TOUCH

- **Catalog** — `products`, `product_images`, `/lib/catalog/**`.
  (catalog-agent) Cart references product IDs; it does not edit products.
- **Checkout/Orders** — `orders`, `order_items`, payment logic,
  `/lib/checkout/**`. (checkout-agent) Cart hands off to checkout.
- **Offers** — `offers`, discount application, `/lib/offers/**`.
  (offers-agent) Offer application happens at checkout, not in the cart.
- **Auth** — Supabase Auth config. (auth-agent) Cart consumes the current
  user/session; it does not manage auth. The merge is *triggered* by a
  login event but the auth flow itself belongs to auth-agent.
- **Admin** — `/app/(admin)/**`. (admin-agent)

## Notes

- Line-item identity = `product_id` + nullable `variant_id` (null = simple
  product, no variant). Variants optional — see PRD/SCHEMA.
- On merge conflict: sum quantities; never delete either side silently.
  Full rules in the cart-merge-on-login skill.
- Placing an order requires login; the cart itself works for guests.
