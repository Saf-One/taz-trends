# HANDOFF - [Store Name - TBD]

## Current state

**Full application built** per the CLAUDE.md build order. Typechecks clean,
`next build` passes (22 routes), dev/prod server boots, storefront renders,
and auth gates + API guards verified.

Built (Next.js App Router + TS + Tailwind + Supabase + Razorpay):
- **Schema/migrations** - `supabase/migrations/0001..0004` (tables, enums,
  NULL-safe partial unique indexes, RLS, `product-images` bucket,
  transactional RPCs: `merge_guest_cart`, `create_order_from_cart`,
  `cart_subtotal_paise`) + `supabase/seed.sql`.
- **Auth** - Google OAuth sign-in, `/auth/callback`, `profiles`, session
  helpers, `is_admin` allowlist grant, middleware session refresh + admin
  gate.
- **Catalog** - active-product browse grid + detail, variant-aware pricing,
  `lib/catalog`.
- **Cart** - guest localStorage + server cart, unified `CartProvider`,
  NULL-safe merge-on-login via RPC.
- **Checkout** - quote (pre-login), Razorpay create-order + signature
  verify + webhook, COD immediate placement, order confirmation + history.
- **Offers** - offers table, admin CRUD, code validation, applied on the
  Razorpay path only.
- **Admin** - dashboard shell, product CRUD (+ optional variants + image
  upload), order status controls (incl. COD `cash_on_delivery ->
  delivered/returned`), offer management, quotes.

Earlier meta-scaffolding (`CLAUDE.md`, `.claude/agents/`, `.claude/skills/`,
`docs/`) remains the source of truth for domain scope.

Settled product decisions baked in:
- **Auth:** Google sign-in only via Supabase Auth (no phone/OTP).
- **COD:** placed immediately at status `cash_on_delivery`, no pre-
  confirmation; admin manually moves to `delivered` / `returned`.
- **Currency:** INR only, stored as integer paise (smallest unit).
- **Variant model:** optional variants (not absent). Simple product =
  zero variants (stock/price on product row); else one+ `product_variants`
  rows carry stock/price. `cart_items`/`order_items` use nullable
  `variant_id` (null = simple product).

## In progress / to wire before going live

- **Provide real credentials** in `.env.local` (see `.env.example`):
  Supabase URL + anon + service-role keys; enable Google OAuth in Supabase
  (client id/secret + redirect `<site>/auth/callback`); Razorpay key id +
  secret + webhook secret (point the webhook at `/api/razorpay/webhook`,
  events `payment.captured` / `order.paid`).
- **Run migrations + seed** against the Supabase project
  (`supabase/migrations/*`, then `supabase/seed.sql`).
- Set `ADMIN_EMAILS` to grant yourself admin, then sign in once.
- Live payment/auth round-trips were NOT exercised here (placeholder creds).
  Everything up to that boundary - build, boot, routing, auth gates, RLS
  design, API validation - is verified.

## Assumptions log (resolved defaults - change any if the owner disagrees)

Each was an **open question**; resolved with a reversible, standard default
and implemented. None is destructive.

1. **Brand name** - kept configurable, not invented. Single source of truth
   `STORE_NAME` in `lib/config.ts`, overridable via env
   `NEXT_PUBLIC_STORE_NAME`. Default display value `"Ethnica"` is a
   **placeholder** - swap in one place. `[Store Name - TBD]` retained in
   docs headers intentionally.
2. **Product `status` enum** - `draft | active | archived`. Only `active`
   shows on storefront. Default on create = `draft`.
3. **Quote workflow** - implemented as a request-for-quote: `quotes` table
   (name, email, phone?, message, optional cart snapshot JSON), status
   `new | contacted | closed`. Capturable pre-login. Conversion-to-order is
   **manual** by admin (no automatic conversion) - kept simple.
4. **Order status flow (unified enum)** -
   `pending | processing | shipped | delivered | cancelled | returned |
   cash_on_delivery`.
   - Razorpay: `pending` (unpaid) → on verified payment `processing` →
     admin → `shipped` → `delivered`; `cancelled`/`returned` allowed.
   - COD (settled): `cash_on_delivery` → `delivered` | `returned` (admin
     may also use `shipped`).
5. **Return / cancellation** - customer may cancel only while `pending` or
   `processing` (pre-shipment). Returns are admin-set (`returned`). No
   automated refund logic (Razorpay refunds are out of scope of the brief).
   7-day return window is a documented policy note only, not enforced code.
6. **Tax & shipping** - prices are **tax-inclusive** (GST-inclusive display,
   no separate tax line). Shipping = **flat rate**, default **₹0 (free)**,
   configurable via `SHIPPING_FLAT_PAISE` in `lib/config.ts`.
7. **Offers** - **user-entered code** at checkout (not auto-apply). Validity
   window (`starts_at`/`ends_at`) optional; enforced only when present.
   Offers apply to the **Razorpay path only** (COD excluded - Razorpay
   `offer_id` is Razorpay-native).
8. **Admin access model** - `profiles.is_admin` boolean (default `false`).
   Granted by (a) matching `ADMIN_EMAILS` env allowlist on first
   login/profile upsert, or (b) manual DB toggle. All admin routes + RLS
   gate on `is_admin`.
9. **Supabase Storage** - bucket **`product-images`**, **public read**,
   authenticated (admin) write. Configured in migrations + a note in setup.
10. **Shop frontend polish** - Visual/functional improvements applied:
    - Sticky header with category nav bar, expanding search, mini-cart
      dropdown on hover, mobile slide-out drawer.
    - Homepage hero banner (wine→blush gradient) + 3 brand value cards.
    - Product cards: quick-add button on hover, buy-now link, share
      button (Web Share API / clipboard), discount badge, hover zoom.
    - Product grid: category pill filters + price range filters,
      results count, empty filter state.
    - Product detail: breadcrumbs, share button, "You may also like"
      recommendations (same-category random), mobile sticky add-to-cart
      bar, recently viewed strip (localStorage).
    - Cart: coupon code input, free-shipping progress bar (₹999
      threshold), empty cart illustration, styled qty controls.
    - Checkout: step indicator (Address→Payment→Confirmation), saved
      address (localStorage, pre-fill on return), offer code with Apply
      feedback.
    - Multi-column footer with social icons, quick links, customer care,
      newsletter input, payment method icons.
    - Toast notifications (success/error/info) on add-to-cart, order
      placed, payment confirmed. Auto-dismiss 4s.
    - Skeleton loading grid on shop pages.
    - Page fade-in transitions via PageTransition wrapper.
11. **Admin dashboard polish** - Visual/functional improvements applied:
    - AdminNav with inline SVG icons for all 5 nav items.
    - Dashboard overview: stat cards with color-coded icons + hover
      effects, SVG bar chart (orders by status), donut chart (products
      by status), quick-action cards.
    - Sortable/searchable tables for Products, Orders, Offers, Quotes
      (useSortable generic hook, search bar, status filter pills,
      pagination).
    - Drag-and-drop image uploader with visual feedback.
    - Product form: improved labels, rupee prefix, hints, variant table
      with delete icon, image preview with count badge and hover zoom.
    - StatusChip extended for all status types.
12. **Perf constraints honoured throughout** -
    - No JS animation libraries (pure CSS transforms/opacity).
    - `backdrop-blur` removed from header and mobile drawer (bg-white/95
      is effectively opaque; blur forces an expensive compositor layer).
    - Scroll listener is `passive: true`.
    - Product filters use `useMemo`.
    - All animations use GPU-composited properties (transform, opacity).
    - No new npm packages added.
    - `tsc --noEmit` passes clean.

> Note: Phone/OTP auth remains intentionally **out of scope** (Google-only)
> and was never an open question.

## Still genuinely external (not code-blocking, needs real accounts)

- **Supabase project** - URL + anon/service keys, and Google OAuth provider
  enabled with client id/secret. App reads these from `.env.local`.
- **Razorpay account** - key id/secret + webhook secret. Live
  create-order / signature-verify / webhook need real keys to exercise.

Both are configured via `.env.example` placeholders; the app builds and
boots without them, but the live payment/auth round-trip needs real
credentials the owner must supply.
