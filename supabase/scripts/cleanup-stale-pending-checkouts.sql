-- =====================================================================
-- cleanup-stale-pending-checkouts.sql
-- =====================================================================
-- Run periodically (cron) to clean up abandoned checkouts.
-- Deletes pending_checkouts older than 24 hours where no corresponding
-- order exists (payment was never captured).

delete from pending_checkouts
where created_at < now() - interval '24 hours'
  and not exists (
    select 1 from orders o
    where o.razorpay_order_id = pending_checkouts.razorpay_order_id
  );

-- This cleans up abandoned Razorpay orders where user never completed payment.
-- The cart remains intact (user can still checkout again).