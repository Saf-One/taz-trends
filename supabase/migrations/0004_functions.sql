-- =====================================================================
-- 0004_functions.sql - transactional RPCs.
-- SECURITY DEFINER so a normal user can decrement stock / manage their
-- own cart+order atomically; each fn enforces auth.uid() explicitly.
-- =====================================================================

-- ---------- cart subtotal (server-computed, tamper-proof) ------------
create or replace function public.cart_subtotal_paise()
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(ci.quantity * coalesce(pv.price_override, p.price)), 0)::int
  from carts c
  join cart_items ci on ci.cart_id = c.id
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where c.user_id = auth.uid();
$$;

-- ---------- merge-on-login (union, sum on conflict, NULL-safe) -------
-- p_items: jsonb array of {product_id, variant_id, quantity}.
create or replace function public.merge_guest_cart(p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_cart uuid;
  it     jsonb;
  v_pid  uuid;
  v_vid  uuid;
  v_qty  int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into carts(user_id) values (v_uid) on conflict (user_id) do nothing;
  select id into v_cart from carts where user_id = v_uid;

  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_pid := (it->>'product_id')::uuid;
    v_vid := nullif(it->>'variant_id', '')::uuid;
    v_qty := greatest(coalesce((it->>'quantity')::int, 0), 0);

    if v_pid is null or v_qty = 0 then continue; end if;
    if not exists (select 1 from products where id = v_pid) then continue; end if;

    if v_vid is null then
      insert into cart_items(cart_id, product_id, variant_id, quantity)
      values (v_cart, v_pid, null, v_qty)
      on conflict (cart_id, product_id) where variant_id is null
      do update set quantity = cart_items.quantity + excluded.quantity;
    else
      insert into cart_items(cart_id, product_id, variant_id, quantity)
      values (v_cart, v_pid, v_vid, v_qty)
      on conflict (cart_id, product_id, variant_id) where variant_id is not null
      do update set quantity = cart_items.quantity + excluded.quantity;
    end if;
  end loop;
end;
$$;

-- ---------- place order from the user's server cart ------------------
-- Recomputes prices server-side from products/variants (never trusts the
-- client). COD clears the cart immediately; Razorpay keeps it until the
-- payment is verified (see verify route).
create or replace function public.create_order_from_cart(
  p_payment_method    payment_method,
  p_shipping_paise    integer default 0,
  p_offer_id          uuid default null,
  p_razorpay_order_id text default null
) returns orders language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := auth.uid();
  v_cart     uuid;
  v_subtotal int;
  v_status   order_status;
  v_pay      payment_status;
  v_order    orders;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select id into v_cart from carts where user_id = v_uid;
  if v_cart is null then raise exception 'no cart'; end if;
  if not exists (select 1 from cart_items where cart_id = v_cart) then
    raise exception 'cart is empty';
  end if;

  select coalesce(sum(ci.quantity * coalesce(pv.price_override, p.price)), 0)::int
    into v_subtotal
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart;

  if p_payment_method = 'cod' then
    v_status := 'cash_on_delivery'; v_pay := 'unpaid';
  else
    v_status := 'pending'; v_pay := 'pending';
  end if;

  insert into orders(user_id, payment_method, payment_status, status,
                     offer_id, razorpay_order_id, subtotal_paise,
                     shipping_paise, total)
  values (v_uid, p_payment_method, v_pay, v_status,
          case when p_payment_method = 'razorpay' then p_offer_id else null end,
          p_razorpay_order_id, v_subtotal, p_shipping_paise,
          v_subtotal + p_shipping_paise)
  returning * into v_order;

  insert into order_items(order_id, product_id, variant_id, quantity, unit_price)
  select v_order.id, ci.product_id, ci.variant_id, ci.quantity,
         coalesce(pv.price_override, p.price)
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart;

  -- Decrement stock: variant stock when a variant, else product stock.
  update product_variants pv set stock = pv.stock - ci.quantity
  from cart_items ci
  where ci.cart_id = v_cart and ci.variant_id = pv.id;

  update products p set stock = p.stock - ci.quantity
  from cart_items ci
  where ci.cart_id = v_cart and ci.variant_id is null and ci.product_id = p.id;

  if p_payment_method = 'cod' then
    delete from cart_items where cart_id = v_cart;
  end if;

  return v_order;
end;
$$;

grant execute on function public.cart_subtotal_paise() to authenticated;
grant execute on function public.merge_guest_cart(jsonb) to authenticated;
grant execute on function public.create_order_from_cart(payment_method, integer, uuid, text) to authenticated;
