-- =====================================================================
-- 0002_rls.sql - Row Level Security. Prefer RLS over app-layer authz.
-- Admin = profiles.is_admin (checked via public.is_admin()).
-- =====================================================================

alter table profiles         enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table product_images   enable row level security;
alter table carts            enable row level security;
alter table cart_items       enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table offers           enable row level security;
alter table quotes           enable row level security;

-- ---------- profiles -------------------------------------------------
create policy profiles_select_self on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- (is_admin is only togglable by service role / SQL, never by the user.)

-- ---------- products / variants / images -----------------------------
-- Public may read only ACTIVE products; admins read everything.
create policy products_read_active on products
  for select using (status = 'active' or public.is_admin());
create policy products_admin_write on products
  for all using (public.is_admin()) with check (public.is_admin());

create policy variants_read on product_variants
  for select using (
    public.is_admin()
    or exists (select 1 from products p
               where p.id = product_id and p.status = 'active')
  );
create policy variants_admin_write on product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy images_read on product_images
  for select using (
    public.is_admin()
    or exists (select 1 from products p
               where p.id = product_id and p.status = 'active')
  );
create policy images_admin_write on product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- carts / cart_items (owner only) --------------------------
create policy carts_owner on carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cart_items_owner on cart_items
  for all using (
    exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ---------- orders / order_items -------------------------------------
-- Owner may read + insert own orders. Only admin may update status.
create policy orders_read_own on orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy orders_insert_own on orders
  for insert with check (user_id = auth.uid());
create policy orders_admin_update on orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy order_items_read on order_items
  for select using (
    public.is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy order_items_insert_own on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ---------- offers ---------------------------------------------------
-- Anyone may read ACTIVE offers (to validate a code). Admin manages all.
create policy offers_read_active on offers
  for select using (is_active or public.is_admin());
create policy offers_admin_write on offers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- quotes ---------------------------------------------------
-- Anyone (incl. anon) may submit a quote. Read own or admin.
create policy quotes_insert_any on quotes
  for insert with check (true);
create policy quotes_read on quotes
  for select using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
  );
create policy quotes_admin_update on quotes
  for update using (public.is_admin()) with check (public.is_admin());
