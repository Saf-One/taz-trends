-- =====================================================================
-- seed.sql — sample catalog so the storefront renders without an admin
-- upload. Prices are paise (INR). Run after migrations.
-- =====================================================================

-- Simple product (no variants): price + stock on the row.
insert into products (id, slug, title, description, price, stock, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'silk-anarkali-wine',
  'Wine Silk Anarkali',
  'Floor-length wine silk anarkali with gold zari detailing.',
  499900, 12, 'active'
) on conflict (id) do nothing;

-- Variant product: price/stock live on variants; product.price is a base.
insert into products (id, slug, title, description, price, stock, status)
values (
  '22222222-2222-2222-2222-222222222222',
  'cotton-kurta-set',
  'Block-Print Cotton Kurta Set',
  'Hand block-printed cotton kurta with matching palazzo and dupatta.',
  189900, 0, 'active'
) on conflict (id) do nothing;

insert into product_variants (product_id, variant_name, variant_value, stock, price_override)
values
  ('22222222-2222-2222-2222-222222222222', 'Size', 'S', 8,  189900),
  ('22222222-2222-2222-2222-222222222222', 'Size', 'M', 5,  189900),
  ('22222222-2222-2222-2222-222222222222', 'Size', 'L', 3,  199900)
on conflict do nothing;

-- Draft product (must NOT appear on storefront).
insert into products (id, slug, title, description, price, stock, status)
values (
  '33333333-3333-3333-3333-333333333333',
  'festive-lehenga-preview',
  'Festive Lehenga (coming soon)',
  'Draft — should not be visible on the storefront.',
  899900, 4, 'draft'
) on conflict (id) do nothing;
