-- =====================================================================
-- 0005_add_address.sql — add address_json column to orders
-- =====================================================================

alter table orders add column address_json jsonb;

-- Update create_order_from_cart to accept and store address
create or replace function public.create_order_from_cart(
  p_payment_method    payment_method,
  p_shipping_paise    integer default 0,
  p_offer_id          uuid default null,
  p_razorpay_order_id text default null,
  p_address_json      jsonb default null
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
                     shipping_paise, total, address_json)
  values (v_uid, p_payment_method, v_pay, v_status,
          case when p_payment_method = 'razorpay' then p_offer_id else null end,
          p_razorpay_order_id, v_subtotal, p_shipping_paise,
          v_subtotal + p_shipping_paise, p_address_json)
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

grant execute on function public.create_order_from_cart(payment_method, integer, uuid, text, jsonb) to authenticated;
