-- =====================================================================
-- 0007_tracking_link.sql - add optional tracking URL column to orders
-- =====================================================================

alter table orders add column tracking_url text;

