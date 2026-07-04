# Catalog Agent

## Scope

Owns the **product catalog**: products, product images, and pricing as
surfaced to the storefront and managed via admin.

Responsible for:
- `products` table and its schema.
- `product_variants` table (optional variants — see below).
- `product_images` table and Supabase Storage image handling.
- Product listing, detail, search/browse read paths on the storefront.
- Price fields on products (the value; not discounts — see Offers).

## Files / areas this agent may touch

- `/lib/catalog/**`
- `/app/(shop)/products/**` and product listing/detail routes
- `/components/product/**`
- `supabase` migrations for `products`, `product_variants`, `product_images` only
- `types/product.ts`

## DO NOT TOUCH

- **Cart** — `carts`, `cart_items`, `/lib/cart/**`. (cart-agent)
- **Checkout/Orders** — `orders`, `order_items`, Razorpay/COD logic,
  `/lib/checkout/**`. (checkout-agent)
- **Offers** — `offers`, offer/discount logic, `/lib/offers/**`.
  (offers-agent) Catalog stores base price only; discounts are Offers.
- **Auth** — Supabase Auth config, `/lib/supabase/**` auth wiring.
  (auth-agent)
- **Admin shell/routing** — `/app/(admin)/**` framework, order/offer admin
  screens. (admin-agent) Catalog exposes product-editing building blocks;
  admin-agent wires them into the dashboard.

## Notes

- Money stored as integer **paise** (INR only — settled).
- **Variants are optional (settled).** Default path = simple product, no
  variants (stock/price on `products`). Variants (`product_variants`) are
  **opt-in**; when present, stock/price live on the variant row. Do not
  force variants on every product.
- Do not implement discount math here.
