-- Test-run SQL for weekly / daily / monthly attribution reports
-- Fill: {start_date}, {end_date}, {channel_filter} (e.g., "AND ads_platform IN ('Meta','Google')")
-- For prior-period comparison, run twice with length-aligned windows.
-- Tenant isolation injected by platform-mcp — do NOT add tenant_id filters.

SELECT
    ads_platform,
    SUM(ad_spend)                                AS spend,
    SUM(attr_shopify_sales)                      AS revenue,
    SUM(attr_orders)                             AS orders,
    SUM(attr_new_customer_orders)                AS nc_orders,
    SUM(attr_shopify_sales)
        / NULLIF(SUM(ad_spend), 0)               AS roas,
    SUM(attr_new_customer_sales)
        / NULLIF(SUM(ad_spend), 0)               AS nc_roas,
    SUM(clicks) / NULLIF(SUM(impressions), 0)    AS ctr,
    SUM(ad_spend) / NULLIF(SUM(attr_orders), 0)  AS cpa
FROM channel_attribution
WHERE event_date BETWEEN '{start_date}' AND '{end_date}'
  AND attr_model_name = '{tenant_default_model}'  -- idda or dda
  AND src_channel     = 'ads'
  {channel_filter}
GROUP BY 1
ORDER BY spend DESC

