# CLAUDE.md - [Store Name - TBD]

A women's ethnic fashion and outfits e-commerce site.

## Build Order
schema/migrations → auth → catalog → cart → checkout (Razorpay + COD) → offers → admin → polish

## Autonomy
- Don't ask for confirmation on implementation details covered by 
  existing agent/skill docs - just build it.
- If something is genuinely undecided (see HANDOFF.md open questions), 
  make the most reasonable e-commerce-standard choice, implement it, 
  and log the assumption in HANDOFF.md instead of stopping to ask.
- Only stop and ask if a decision is irreversible or destructive 
  (e.g. dropping a table with data, deleting files).
- After finishing a domain, update HANDOFF.md, then move to the next 
  item in the build order without waiting for confirmation.

## Stack (fixed - do not substitute or add to)

- **Next.js** (App Router)
- **Supabase** (Postgres, Auth, Storage)
- **Razorpay** (payments)

Do **not** introduce Elasticsearch, Redis, S3, a separate queue, or any
other service unless the user explicitly asks for it. Do not add
infrastructure "for scale."

## Core domains

1. **Catalog** - owner adds products, images, prices via admin.
2. **Quotes/Orders** - customers can raise a quote or place a direct order.
3. **Cart** - guest carts in localStorage; logged-in carts in Supabase.
   Must **merge** guest cart into account cart on login (never overwrite,
   never silently drop either side). Must be logged in to place an order;
   the quote step can be pre-login.
4. **Checkout/Payments** - Razorpay online payment AND Cash on Delivery
   (COD) as a separate order path. Razorpay orders support an optional
   `offer_id`.
5. **Offers** - admin creates, activates/deactivates, and manages offers
   mapped to a Razorpay `offer_id`.
6. **Auth** - Supabase Auth, **Google sign-in only**. No phone/OTP.
7. **Admin** - product CRUD, image/price management, offer management,
   order/quote visibility, order status management.

## Folder conventions

> The Next.js app is **not scaffolded yet**. These are the intended
> conventions for when it is.

```
/app                 # Next.js App Router routes
  /(shop)            # public storefront routes
  /(admin)           # admin dashboard routes
  /api               # route handlers (Razorpay webhooks, etc.)
/components          # shared UI components
/lib                 # supabase client, razorpay client, helpers
/lib/supabase        # server + browser Supabase clients
/lib/cart            # cart logic (incl. merge-on-login)
/lib/checkout        # checkout / payment logic
/types               # shared TypeScript types
/supabase            # SQL migrations, RLS policies, seed
/docs                # PRD, SCHEMA, HANDOFF
.claude/agents       # domain-scoped agent definitions
.claude/skills       # step-by-step skill playbooks
```

## Coding style

- TypeScript everywhere. No `any` unless justified with a comment.
- Server-side data access via server components / route handlers using the
  server Supabase client. Never expose service-role keys to the browser.
- Money is stored as integer **paise** (INR only - settled). See
  docs/SCHEMA.md.
- Prefer Supabase Row Level Security (RLS) over app-layer authorization.
- Keep domain logic in `/lib/<domain>`, not inside components.
- No business rules invented in code - anything not specified in the brief
  is TBD and must be confirmed with the owner (see docs/PRD.md).

## Where things live

- **Agents** live in `.claude/agents/`. Each agent is scoped strictly to
  one domain and has an explicit **DO NOT TOUCH** list naming other
  domains' files/tables.
- **Skills** live in `.claude/skills/`. Each is a precise, step-by-step
  playbook for one recurring task.

## Assumptions & Open Questions

**Settled decisions (do not revisit):**
- Auth is **Google sign-in only** via Supabase Auth. No phone/OTP.
- **COD orders are placed immediately** with status `cash_on_delivery`
  (no admin pre-confirmation). Admin later updates status manually
  (`cash_on_delivery` -> `delivered` / `returned`).
- **Currency is INR only**, stored as integer paise.
- **Variants are optional**: simple product (zero variants, stock/price on
  product row) OR one+ `product_variants` rows; `cart_items`/`order_items`
  use a nullable `variant_id`.

**Open questions** are tracked in `docs/HANDOFF.md` and `docs/PRD.md`.
Highlights:
- Brand name is **[Store Name - TBD]** - a real name is needed.
- Return/cancellation policy, quote workflow specifics, tax/shipping
  handling, and product `status` enum values are all **TBD**.

Do not guess any TBD item in code. Flag and defer to the owner.
