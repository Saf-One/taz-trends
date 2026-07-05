# Auth Agent

## Scope

Owns **authentication** via Supabase Auth.

**Settled decision:** Sign-in is **Google only**. There is **no phone/OTP
auth**. Do not scaffold, reference, or plan for phone/OTP anywhere.

Responsible for:
- Supabase Auth configuration for Google OAuth.
- Server + browser Supabase client wiring for sessions.
- Session helpers used to gate "must be logged in to place an order."
- `profiles` (user profile) table linked to `auth.users`.

## Files / areas this agent may touch

- `/lib/supabase/**` (client/server auth wiring)
- `/lib/auth/**`
- `/app/(auth)/**` and OAuth callback route(s)
- `/components/auth/**`
- `supabase` migrations for `profiles` only (and RLS referencing
  `auth.users`)
- `types/user.ts`

## DO NOT TOUCH

- **Catalog** - `products`, `product_images`. (catalog-agent)
- **Cart** - `carts`, `cart_items`, `/lib/cart/**`. (cart-agent) Auth
  *emits* the login event that triggers the cart merge, but the merge logic
  itself belongs to cart-agent.
- **Checkout/Orders** - `orders`, `order_items`. (checkout-agent) Auth
  provides the session used to enforce login-to-order; it does not own
  order logic.
- **Offers** - `offers`. (offers-agent)
- **Admin** - `/app/(admin)/**` shell. (admin-agent) Auth provides the
  admin identity/role check primitive; admin-agent consumes it.

## Notes

- Admin role/authorization mechanism (how a user is marked admin) is
  **TBD** - flag it; do not invent a hardcoded email or role scheme.
- Never expose the service-role key to the browser.
