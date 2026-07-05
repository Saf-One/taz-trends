# SCHEMA (draft) - [Store Name - TBD]

Draft table list. Columns are inferred from the brief; **TBD** marks
anything not specified. Money = integer **paise** (INR smallest unit).
Currency is **INR only** (settled). Do not invent business rules.

---

## profiles

User profile linked to Supabase `auth.users`. Auth is **Google only**.

| column       | type        | notes                                  |
|--------------|-------------|----------------------------------------|
| id           | uuid PK     | = `auth.users.id`                      |
| email        | text        | from Google                            |
| full_name    | text        | from Google, nullable                  |
| avatar_url   | text        | nullable                               |
| is_admin     | boolean     | default false; true via `ADMIN_EMAILS` allowlist on upsert or manual DB toggle |
| created_at   | timestamptz | default now()                          |

---

## products

| column       | type        | notes                                     |
|--------------|-------------|-------------------------------------------|
| id           | uuid PK     |                                           |
| slug         | text unique |                                           |
| title        | text        |                                           |
| description  | text        | nullable                                  |
| price        | integer     | paise (INR). Used when product has NO variants |
| status       | text/enum   | `draft` \| `active` \| `archived`; default `draft`; only `active` on storefront |
| stock        | integer     | Used when product has NO variants         |
| created_at   | timestamptz | default now()                             |
| updated_at   | timestamptz |                                           |

**Variants optional (settled).** A product has **zero variants** (simple
product - `price` and `stock` live on this row) OR **one+ variants** (then
price/stock live on the `product_variants` row; the product row `price` may
act as a display/base fallback). See `product_variants`.

---

## product_variants

Optional. Present only for products that have variants (e.g. sizes).

| column         | type        | notes                                        |
|----------------|-------------|----------------------------------------------|
| id             | uuid PK     |                                              |
| product_id     | uuid FK     | -> products.id                               |
| variant_name   | text        | e.g. "Size"                                  |
| variant_value  | text        | e.g. "M"                                      |
| stock          | integer     | per-variant stock                            |
| price_override | integer     | paise (INR), nullable; falls back to product price |
| created_at     | timestamptz | default now()                                |

- Product with **zero** rows here = simple product (stock/price on `products`).
- Product with **one+** rows here = stock/price live per variant row.

---

## product_images

| column       | type        | notes                          |
|--------------|-------------|--------------------------------|
| id           | uuid PK     |                                |
| product_id   | uuid FK     | -> products.id                 |
| storage_path | text        | Supabase Storage path          |
| alt          | text        | nullable                       |
| position     | integer     | ordering                       |
| is_primary   | boolean     | one primary per product        |

---

## carts

| column       | type        | notes                                    |
|--------------|-------------|------------------------------------------|
| id           | uuid PK     |                                          |
| user_id      | uuid FK     | -> profiles.id (logged-in cart)          |
| created_at   | timestamptz | default now()                            |
| updated_at   | timestamptz |                                          |

Guest carts live in `localStorage` (not in this table) until merge-on-login.

---

## cart_items

Identity of a line = `product_id` + `variant_id` (variant_id nullable).

| column       | type        | notes                                        |
|--------------|-------------|----------------------------------------------|
| id           | uuid PK     |                                              |
| cart_id      | uuid FK     | -> carts.id                                  |
| product_id   | uuid FK     | -> products.id                               |
| variant_id   | uuid FK     | -> product_variants.id, **nullable** (null = simple product, no variant) |
| quantity     | integer     | summed on merge conflict                     |

**Uniqueness (partial indexes, not a plain UNIQUE constraint).** In
Postgres a plain `UNIQUE(cart_id, product_id, variant_id)` does **not**
dedupe rows where `variant_id IS NULL` (NULLs are distinct), so a simple
product could be inserted twice. Use two partial unique indexes instead:

```sql
CREATE UNIQUE INDEX cart_items_variant_uq
  ON cart_items (cart_id, product_id, variant_id)
  WHERE variant_id IS NOT NULL;

CREATE UNIQUE INDEX cart_items_no_variant_uq
  ON cart_items (cart_id, product_id)
  WHERE variant_id IS NULL;
```

Both together give one line per `(cart_id, product_id, variant_id)`
identity, with NULL treated as its own valid key. Upsert-on-merge targets
whichever index matches (`variant_id` null vs. not).

---

## orders

Covers both payment paths. **COD is placed immediately** at status
`cash_on_delivery` (no pre-confirmation); admin updates it manually.

| column            | type        | notes                                        |
|-------------------|-------------|----------------------------------------------|
| id                | uuid PK     |                                              |
| user_id           | uuid FK     | -> profiles.id (login required to order)     |
| payment_method    | text/enum   | `razorpay` \| `cod`                          |
| payment_status    | text/enum   | see below                                    |
| status            | text/enum   | order status - see below                     |
| offer_id          | uuid FK     | -> offers.id, nullable (Razorpay path only)  |
| razorpay_order_id | text        | nullable (Razorpay path)                     |
| total             | integer     | paise (INR)                                  |
| created_at        | timestamptz | default now()                                |
| updated_at        | timestamptz |                                              |

Extra columns: `shipping_paise` (flat shipping, default 0),
`subtotal_paise` (sum of line items). `total = subtotal_paise +
shipping_paise`. Prices are tax-inclusive (no separate tax column).

### payment_status

`pending | paid | failed | unpaid`
- Razorpay: `pending` -> `paid` (or `failed`).
- COD: `unpaid` (until real-world settlement).

### status - order status flow (unified enum)

`pending | processing | shipped | delivered | cancelled | returned |
cash_on_delivery`

**Razorpay path:**

```
pending (unpaid) -> processing (on verified payment)
processing -> shipped -> delivered        (admin)
processing|pending -> cancelled           (customer pre-shipment / admin)
delivered -> returned                     (admin)
```

**COD path (settled):**

```
cash_on_delivery -> delivered             (admin)
cash_on_delivery -> returned              (not picked up / returned)
```

- COD orders are created immediately with `status = 'cash_on_delivery'`.
- Admin manually transitions COD orders from the dashboard. Admin may also
  mark COD `shipped` before `delivered` (optional).
- Customer self-cancel allowed only while `pending` or `processing`.

---

## order_items

Snapshot of purchased lines (price captured at order time).

| column       | type        | notes                                        |
|--------------|-------------|----------------------------------------------|
| id           | uuid PK     |                                              |
| order_id     | uuid FK     | -> orders.id                                 |
| product_id   | uuid FK     | -> products.id                               |
| variant_id   | uuid FK     | -> product_variants.id, **nullable** (null = simple product) |
| quantity     | integer     |                                              |
| unit_price   | integer     | paise (INR); snapshot at purchase            |

**Uniqueness (partial indexes, same NULL-safety pattern as `cart_items`,
keyed on `order_id`):**

```sql
CREATE UNIQUE INDEX order_items_variant_uq
  ON order_items (order_id, product_id, variant_id)
  WHERE variant_id IS NOT NULL;

CREATE UNIQUE INDEX order_items_no_variant_uq
  ON order_items (order_id, product_id)
  WHERE variant_id IS NULL;
```

---

## offers

Maps an internal offer to a Razorpay `offer_id`.

| column            | type        | notes                                     |
|-------------------|-------------|-------------------------------------------|
| id                | uuid PK     |                                           |
| name              | text        | internal label                            |
| code              | text unique | **user-entered** code at checkout         |
| razorpay_offer_id | text        | mapping to Razorpay                       |
| is_active         | boolean     | activate/deactivate toggle                |
| starts_at         | timestamptz | nullable; enforced only when present      |
| ends_at           | timestamptz | nullable; enforced only when present      |
| created_at        | timestamptz | default now()                             |

Discount amount/percentage is enforced by Razorpay via `razorpay_offer_id`;
do not invent local discount math. Offer applies on the **Razorpay path
only** (COD excluded). An offer is "usable" when `is_active` and (now
within `[starts_at, ends_at]` when those are set).

---

## quotes

Request-for-quote. Capturable **pre-login** (user_id nullable). Admin
follows up manually; conversion-to-order is manual (no auto conversion).

| column        | type        | notes                                        |
|---------------|-------------|----------------------------------------------|
| id            | uuid PK     |                                              |
| user_id       | uuid FK     | -> profiles.id, nullable (pre-login allowed) |
| name          | text        | contact name                                 |
| email         | text        | contact email                                |
| phone         | text        | nullable                                     |
| message       | text        | free text                                    |
| cart_snapshot | jsonb       | nullable; optional snapshot of cart at ask   |
| status        | text/enum   | `new` \| `contacted` \| `closed`; default `new` |
| created_at    | timestamptz | default now()                                |
