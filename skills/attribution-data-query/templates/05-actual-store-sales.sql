-- Actual store sales (NOT attribution)
-- Use case: "What sales did Shopify actually report last week?"
-- Triggers: "actual" / "store-reported" / "Shopify dashboard" / "platform-reported"
-- DataSet: order_sales (NO attr_model_name column — query will FAIL if you add it)
-- ALWAYS prepend scope warning: "⚠️ Data scope: store-reported actuals — not WorkMagic attribution."

SELECT
  sales_platform,
  SUM(order_total_orders) AS orders,
  SUM(order_total_sales)  AS sales,
  SUM(order_net_sales)    AS net_sales
FROM dws_view_copilot_sales_channel_daily_latest
WHERE tenant_id    = <tenant_id>
  AND event_date  >= '<start_date>'
  AND event_date   < '<end_date>'
GROUP BY sales_platform
ORDER BY sales DESC
