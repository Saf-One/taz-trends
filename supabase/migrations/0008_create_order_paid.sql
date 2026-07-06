-- =====================================================================
-- 0008_create_order_paid.sql - admin variant for webhook/verify-initiated orders
-- =====================================================================
-- When creating order after successful Razorpay payment via webhook, we need
-- an RPC that accepts user_id explicitly (because webhook has no session).
-- Razorpay payment has already been captured - creates with processing/paid.

create or replace function public.create_order_from_cart_admin(
  p_user_id             uuid,
  p_payment_method      payment_method,
  p_shipping_paise      integer default 0,
  p_offer_id            uuid default null,
  p_razorpay_order_id   text default null,
  p_address_json        jsonb default null,
  p_razorpay_payment_id text default null
) returns orders language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := p_user_id;
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

  -- Razorpay payment already captured - set to processing immediately
  v_status := 'processing'; v_pay := 'paid';

  insert into orders(user_id, payment_method, payment_status, status,
                     offer_id, razorpay_order_id, subtotal_paise,
                     shipping_paise, total, address_json, razorpay_payment_id)
  values (v_uid, p_payment_method, v_pay, v_status,
          case when p_payment_method = 'razorpay' then p_offer_id else null end,
          p_razorpay_order_id, v_subtotal, p_shipping_paise,
          v_subtotal + p_shipping_paise, p_address_json, p_razorpay_payment_id)
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

  -- Cart will be cleared by the caller (verify or webhook)

  return v_order;
end;
$$;

grant execute on function public.create_order_from_cart_admin(uuid, payment_method, integer, uuid, text, jsonb, text) to authenticated;