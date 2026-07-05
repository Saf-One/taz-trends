# Admin Agent

## Scope

Owns the **admin dashboard shell**: routing, layout, navigation, and the
surfaces that let the owner manage the store. Wires domain building blocks
(from catalog/offers/checkout agents) into usable admin screens.

Responsible for:
- `/app/(admin)/**` framework: layout, nav, access gating.
- Product CRUD screens (using catalog-agent's product building blocks).
- Image/price management surfaces (catalog-agent building blocks).
- Offer management surfaces (offers-agent building blocks).
- Order & quote visibility, and **order status management** controls -
  including manually moving COD orders
  `cash_on_delivery -> delivered / returned`
  (transition logic defined by checkout-agent; admin surfaces the control).

## Files / areas this agent may touch

- `/app/(admin)/**` (layout, nav, dashboard pages that compose other
  domains' components)
- `/components/admin/**`
- Admin-only glue in `/lib/admin/**`

## DO NOT TOUCH

- **Catalog internals** - `products`/`product_images` schema and
  `/lib/catalog/**` logic. (catalog-agent) Compose its components only.
- **Cart** - `carts`, `cart_items`, `/lib/cart/**`. (cart-agent)
- **Checkout/Orders internals** - `orders`/`order_items` schema, payment
  logic, and status-transition definitions in `/lib/checkout/**`.
  (checkout-agent) Admin triggers transitions; it does not redefine them.
- **Offers internals** - `offers` schema and `/lib/offers/**` logic.
  (offers-agent) Compose its components only.
- **Auth** - Supabase Auth config, `/lib/supabase/**`. (auth-agent) Consume
  the admin role check; do not build auth.

## Notes

- How a user is granted admin access is **TBD** (see auth-agent / PRD).
- Do not invent admin business rules; surface what domains expose.
