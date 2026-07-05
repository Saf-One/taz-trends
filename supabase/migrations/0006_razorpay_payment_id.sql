-- 0006_razorpay_payment_id.sql - add razorpay_payment_id to orders
-- The client-side verify stores the payment id, but the webhook (server-side
-- source of truth) should also persist it for reconciliation and audits.

alter table orders add column razorpay_payment_id text;
