# PRD - [Store Name - TBD]

## What it is

A women's ethnic fashion and outfits e-commerce site. The owner lists
products with images and prices; customers browse, build a cart, optionally
raise a quote, and place orders paid via Razorpay or Cash on Delivery.

## Stack (fixed)

Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Razorpay
(payments). No other services.

## Users

- **Customer** - browses catalog, uses a cart, raises quotes, places orders.
- **Owner / Admin** - manages products, images, prices, offers, and views
  and updates orders and quotes.

## Core features

1. **Catalog** - admin adds products with images and prices. Customers
   browse and view product detail.
2. **Cart**
   - Guest cart in `localStorage`.
   - Logged-in cart in Supabase.
   - On login, the guest cart is **merged into** the account cart - union
     of both, quantities summed on conflict, neither side dropped. (See
     the cart-merge-on-login skill.)
3. **Quotes / Orders**
   - A customer may raise a **quote** (allowed **pre-login**).
   - Placing an actual **order requires login**.
4. **Checkout / Payments** - two separate paths:
   - **Razorpay** online payment, with an **optional `offer_id`**.
   - **Cash on Delivery (COD)** - placed **immediately** with status
     `cash_on_delivery` (no admin pre-confirmation). Admin later updates
     status manually: `cash_on_delivery -> delivered` or `-> returned`.
5. **Offers** - admin creates, activates/deactivates, and manages offers
   that map to a Razorpay `offer_id`.
6. **Auth** - Supabase Auth, **Google sign-in only**. No phone/OTP.
7. **Admin** - product CRUD, image/price management, offer management,
   order/quote visibility, and manual order-status updates.

## Settled decisions (not open)

- **Auth:** Google sign-in only via Supabase Auth. No phone/OTP anywhere.
- **COD:** Immediate placement at status `cash_on_delivery`; no pre-
  confirmation; admin manually moves it to `delivered` or `returned`.
- **Currency:** **INR only.** All prices, cart totals, and order amounts
  in INR, stored as integer **paise** (smallest unit).
- **Variant model:** Variants are **optional**, not absent. A product has
  zero variants (simple - stock/price on the product row) OR one+ variants
  (`product_variants` - stock/price per variant row). `cart_items` /
  `order_items` carry a nullable `variant_id` (null = simple product).

## Resolved with defaults (see docs/HANDOFF.md "Assumptions log")

All previously-open questions were resolved with standard, reversible
e-commerce defaults so the build could proceed. Summary - full detail and
rationale in **docs/HANDOFF.md**:

- **Brand name** - configurable `STORE_NAME` (env-overridable); placeholder
  default, not invented.
- **Product `status`** - `draft | active | archived` (default `draft`).
- **Quote workflow** - request-for-quote `quotes` table; manual follow-up.
- **Order status** - unified enum incl. Razorpay `pending → processing →
  shipped → delivered` and COD `cash_on_delivery → delivered | returned`.
- **Return / cancellation** - customer cancel pre-shipment; returns
  admin-set; no auto-refund.
- **Tax / shipping** - tax-inclusive prices; flat shipping (default ₹0).
- **Offers** - user-entered code, optional validity window, Razorpay path
  only (COD excluded).
- **Admin access** - `profiles.is_admin` via `ADMIN_EMAILS` allowlist.
- **Storage** - bucket `product-images`, public read / admin write.

## Still external (owner must provide accounts/keys)

- Supabase project URL + keys, Google OAuth client id/secret.
- Razorpay key id/secret + webhook secret.
