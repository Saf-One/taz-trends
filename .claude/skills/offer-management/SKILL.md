# Skill: Offer Management

Owner: **offers-agent**. Admin creates and manages offers that map to a
Razorpay `offer_id`.

## Preconditions

- Acting user is an admin (admin role mechanism **TBD**).
- The corresponding offer exists in the Razorpay dashboard/API and has a
  Razorpay `offer_id`.

## Steps

1. **Create an offer** row in `offers`:
   - `name` / `code` (internal label; code semantics **TBD**).
   - `razorpay_offer_id` (the mapping to Razorpay).
   - `is_active` (boolean; starts inactive unless specified).
   - Validity window fields (`starts_at` / `ends_at`) — **TBD** whether
     required; store if provided, do not invent defaults.
   - Discount amount/percentage — **do not invent**; the actual discount is
     enforced by Razorpay via the `offer_id`. Store only descriptive
     metadata the admin enters.

2. **Activate / deactivate** by toggling `is_active`. Deactivating must not
   delete the offer or retroactively alter past orders.

3. **Expose active offers** to checkout: provide a query for currently
   active offers so checkout-agent can attach an `offer_id` to a Razorpay
   order. Checkout applies it; offers-agent does not touch orders.

4. **Edit / archive** offers. Prefer soft-deactivation over hard delete to
   preserve history referenced by past orders.

## Hard rules

- Offers map to a Razorpay `offer_id`; the source of truth for the actual
  discount math is Razorpay, not this table.
- Do not invent discount percentages, caps, or validity rules.
- COD: whether offers apply to COD is **TBD** (Razorpay `offer_id` is a
  Razorpay/online-payment concept).

## Out of scope

- Applying the offer to an order (checkout-agent).
- Editing product base prices (catalog-agent).

## TBD to confirm

- Offer code semantics (auto-apply vs. user-entered code).
- Whether validity windows are required.
- Whether offers apply to the COD path.
