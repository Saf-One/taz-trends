# Offers Agent

## Scope

Owns **offers / discount codes** that map to a Razorpay `offer_id`.

Responsible for:
- `offers` table.
- Admin create / activate / deactivate / manage offers.
- Exposing active offers so checkout can attach an `offer_id` to a
  Razorpay order.
- Mapping between an internal offer and its Razorpay `offer_id`.

See `.claude/skills/offer-management/SKILL.md`.

## Files / areas this agent may touch

- `/lib/offers/**`
- `/app/(admin)/offers/**`
- `/components/offers/**`
- `supabase` migrations for `offers` only
- `types/offer.ts`

## DO NOT TOUCH

- **Catalog** - `products`, `product_images`. (catalog-agent) Base price
  lives on products; offers do not edit product rows.
- **Cart** - `carts`, `cart_items`. (cart-agent)
- **Checkout/Orders** - `orders`, `order_items`, Razorpay order creation,
  `/lib/checkout/**`. (checkout-agent) Offers agent provides the active
  `offer_id`; checkout-agent applies it to the Razorpay order.
- **Auth** - Supabase Auth config. (auth-agent)
- **Admin shell/routing** - the admin framework itself. (admin-agent)
  Offers agent owns offer screens' logic; admin-agent owns the shell.

## Notes

- Discount percentages / amounts and validity windows are **TBD** - do not
  invent values or rules. Store what the admin enters; validate structure,
  not policy.
- COD path: whether offers apply to COD is **TBD** (Razorpay `offer_id` is
  inherently a Razorpay concept). Flag, do not assume.
