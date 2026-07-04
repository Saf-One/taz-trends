-- =====================================================================
-- 0001_init.sql — full schema per docs/SCHEMA.md
-- Money is integer paise (INR). Variants optional. NULL-safe uniqueness.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------------------------------------------------
create type product_status as enum ('draft', 'active', 'archived');
create type payment_method as enum ('razorpay', 'cod');
create type payment_status as enum ('pending', 'paid', 'failed', 'unpaid');
create type order_status as enum (
  'pending', 'processing', 'shipped', 'delivered',
  'cancelled', 'returned', 'cash_on_delivery'
);
create type quote_status as enum ('new', 'contacted', 'closed');

-- ---------- updated_at helper ---------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles -------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- SECURITY DEFINER admin check — avoids recursive RLS on profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Create a profile row automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- products -------------------------------------------------
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  price       integer not null default 0,   -- paise; used when no variants
  stock       integer not null default 0,   -- used when no variants
  status      product_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- ---------- product_variants (optional) -----------------------------
create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  variant_name   text not null,   -- e.g. "Size"
  variant_value  text not null,   -- e.g. "M"
  stock          integer not null default 0,
  price_override integer,         -- paise; null -> fall back to product.price
  created_at     timestamptz not null default now()
);
create index product_variants_product_idx on product_variants(product_id);

-- ---------- product_images ------------------------------------------
create table product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt          text,
  position     integer not null default 0,
  is_primary   boolean not null default false
);
create index product_images_product_idx on product_images(product_id);

-- ---------- carts ----------------------------------------------------
create table carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index carts_user_uq on carts(user_id);
create trigger carts_updated_at before update on carts
  for each row execute function set_updated_at();

-- ---------- cart_items ----------------------------------------------
create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  quantity   integer not null check (quantity > 0)
);
-- NULL-safe uniqueness: plain UNIQUE would not dedupe NULL variant_id.
create unique index cart_items_variant_uq
  on cart_items (cart_id, product_id, variant_id)
  where variant_id is not null;
create unique index cart_items_no_variant_uq
  on cart_items (cart_id, product_id)
  where variant_id is null;

-- ---------- offers ---------------------------------------------------
-- Maps an internal offer to a Razorpay offer_id. Discount math lives in
-- Razorpay; this table only stores the mapping + usability window.
create table offers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  code              text unique not null,      -- user-entered at checkout
  razorpay_offer_id text not null,
  is_active         boolean not null default false,
  starts_at         timestamptz,               -- enforced only when present
  ends_at           timestamptz,               -- enforced only when present
  created_at        timestamptz not null default now()
);

-- ---------- orders ---------------------------------------------------
create table orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id),
  payment_method    payment_method not null,
  payment_status    payment_status not null,
  status            order_status not null,
  offer_id          uuid references offers(id),
  razorpay_order_id text,
  subtotal_paise    integer not null default 0,
  shipping_paise    integer not null default 0,
  total             integer not null default 0,  -- paise
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_user_idx on orders(user_id);
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------- order_items ---------------------------------------------
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  quantity   integer not null check (quantity > 0),
  unit_price integer not null   -- paise snapshot at purchase
);
create index order_items_order_idx on order_items(order_id);
create unique index order_items_variant_uq
  on order_items (order_id, product_id, variant_id)
  where variant_id is not null;
create unique index order_items_no_variant_uq
  on order_items (order_id, product_id)
  where variant_id is null;

-- ---------- quotes ---------------------------------------------------
create table quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  name          text not null,
  email         text not null,
  phone         text,
  message       text not null,
  cart_snapshot jsonb,
  status        quote_status not null default 'new',
  created_at    timestamptz not null default now()
);
create index quotes_status_idx on quotes(status);
