-- =====================================================================
-- 0006_pending_checkout.sql - store checkout context until payment succeeds
-- =====================================================================
-- This table temporarily holds address/offer data between Razorpay order
-- creation and payment verification. Prevents orphan orders when user
-- cancels or closes browser before completing payment.

create table pending_checkouts (
  user_id            uuid not null references profiles(id) on delete cascade,
  razorpay_order_id  text not null,
  address_json       jsonb not null default '{}',
  offer_id           uuid references offers(id),
  created_at         timestamptz not null default now(),
  primary key (user_id, razorpay_order_id)
);

create index pending_checkouts_rzp_idx on pending_checkouts(razorpay_order_id);

-- RLS: only owner can access their pending checkout
alter table pending_checkouts enable row level security;
create policy pending_checkouts_owner on pending_checkouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());