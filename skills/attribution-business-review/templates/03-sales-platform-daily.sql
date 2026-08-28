-- Parts 1-2 — store-actual revenue by sales platform (Shopify / Amazon /
-- TikTok Shop / marketplaces). NO attribution model applies here: this is what
-- the business actually sold, not what ads got credit for. The board shows it
-- next to, and visibly distinct from, ads-attributed revenue.
-- Fill: <start_date>, <end_date> (exclusive).
-- Tenant isolation is injected by the query tool — do NOT add a tenant_id filter.

SELECT
  sales_platform,
  event_date,
  SUM(order_total_sales)  AS order_total_sales,
  SUM(order_total_orders) AS order_total_orders
FROM dws_view_copilot_sales_channel_daily_latest
WHERE event_date >= '<start_date>'
  AND event_date  < '<end_date>'
GROUP BY 1, 2
