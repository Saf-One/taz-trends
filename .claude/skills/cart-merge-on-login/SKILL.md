# Skill: Cart Merge on Login

Owner: **cart-agent**. This is the known tricky spot. Follow it exactly.

## Goal

When a guest with a `localStorage` cart logs in (Google via Supabase Auth),
merge the guest cart **into** their existing Supabase account cart. The
result is the **union** of both carts. **Never overwrite. Never silently
drop either side.**

## Definitions

- **Guest cart**: array of line items in `localStorage`.
- **Account cart**: rows in `cart_items` for the user's `carts` row.
- **Line-item identity key**: `product_id` + `variant_id`.
  `variant_id` is **nullable**: null = simple product (no variant). Treat
  null as its **own valid key** - never collapse a null-variant line into
  any real variant line, and never merge two different `variant_id`s.
  Normalize only null/undefined to a single canonical null token so a
  missing and an explicit-null variant map to the SAME key.

## Trigger

Runs on a successful login event (emitted by auth-agent). Idempotent: if it
runs twice, the second run must not double quantities.

## Algorithm (step by step)

1. **Load both sides.**
   - Read the guest cart from `localStorage`.
   - Fetch (or create) the user's `carts` row and load its `cart_items`.
   - If the guest cart is empty -> nothing to merge; keep account cart
     as-is; clear guest cart; done.
   - If the account cart is empty -> still perform the merge loop below
     (do not blindly overwrite; treat as union with an empty set).

2. **Normalize keys** for every line item on both sides:
   `key = product_id + "|" + normalize(variant_id)`, where `normalize`
   maps null/undefined to a single canonical null token. Null variant_id
   is a distinct, valid key - not merged with any real variant.

3. **Build a map** keyed by the identity key, starting from the **account
   cart** (authoritative persistence side).

4. **Fold in the guest cart**, item by item:
   - **No conflict** (key not in map): insert the guest item.
   - **Conflict** (key already present): **sum the quantities**
     (`account.qty + guest.qty`). Do not take max, do not overwrite, do
     not skip. Apply any max-quantity/stock cap **only if such a rule is
     specified** - none is today (**TBD**); until then, sum without a cap.

5. **Validate product references.** For each merged item, confirm the
   `product_id` still exists and is purchasable (read-only check against
   catalog; do not modify products). If a product is gone/unavailable:
   - Keep the line but flag it as unavailable in the returned result so the
     UI can inform the user. **Do not silently delete it.**

6. **Persist** the merged set to `cart_items` (upsert by identity key) in a
   **single transaction**. On any failure, roll back - leave the account
   cart untouched and **retain the guest cart in localStorage** so nothing
   is lost. Only clear `localStorage` after a confirmed successful commit.

7. **Clear the guest cart** from `localStorage` after commit succeeds.

## Hard rules (never violate)

- Never replace the account cart wholesale with the guest cart.
- Never replace the guest cart wholesale with the account cart.
- On quantity conflict: **sum**, never overwrite or drop.
- Deletion of a line item is only allowed by an explicit user action later,
  never as a side effect of merging.
- Merge must be idempotent and transactional.

## TBD to confirm

- Whether a per-line max-quantity / stock cap exists (currently none).
