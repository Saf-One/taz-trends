# Skill: Add a Product

Owner: **catalog-agent**. Adds a product with images and a price via admin.

## Preconditions

- Acting user is an admin (admin role mechanism is **TBD** — see PRD).
- Supabase Storage bucket for product images exists (name **TBD**).

## Steps

1. **Create the product row** in `products`:
   - `title`, `description`, `price` (integer **paise**, INR), `stock`,
     `status` (e.g. draft/active — enum values TBD), `slug` (unique).
   - This is the **simple-product default**: no variants. `price` and
     `stock` live on this row. Done — skip step 3.
   - Do **not** set discount fields here — discounts are Offers.

2. **Upload images** to Supabase Storage, then insert one row per image in
   `product_images`:
   - `product_id` (FK), `storage_path`, `alt`, `position` (ordering).
   - Mark one image as primary (`is_primary` or lowest `position`).

3. **Variants (opt-in, optional).** Only if the product needs variants
   (e.g. sizes). Insert one row per variant in `product_variants`:
   - `product_id` (FK), `variant_name` (e.g. "Size"), `variant_value`
     (e.g. "M"), `stock`, optional `price_override` (paise; falls back to
     product `price` when null).
   - When variants exist, stock/price are governed **per variant row**;
     the product-row `price` acts as display/base fallback.
   - Most products have **no** variants — do not add them by default.

4. **Validate** required fields are present; reject on missing
   `title`/`price`. Do not apply pricing *policy* (min price, rounding) —
   none is specified.

5. **Save**. Product appears on the storefront only when `status` is the
   active value (value TBD).

## Out of scope for this skill

- Pricing discounts / offers (offers-agent).
- Cart/checkout behavior (cart-agent / checkout-agent).

## TBD to confirm before/with implementation

- Product `status` enum values.
- Storage bucket name and public/private access.
