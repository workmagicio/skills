-- Multi-model attribution comparison — ONE query, multiple models via CASE WHEN
-- Use case: any attribution-model-comparison ask
-- Guarantees comparison is on the same row set (same time range, filters, dedup)
-- Fill: {ads_platform}, {sales_platform}, {start_date}, {end_date}
-- Add/remove model branches per the user's requested model list

SELECT
    ads_platform,
    -- Order counts per model
    SUM(CASE WHEN attr_model_name = 'platform_reported'
        THEN attr_orders ELSE 0 END) AS platform_orders,
    SUM(CASE WHEN attr_model_name = 'last_click'
        THEN attr_orders ELSE 0 END) AS lc_orders,
    SUM(CASE WHEN attr_model_name = 'dda'
        THEN attr_orders ELSE 0 END) AS dda_orders,
    SUM(CASE WHEN attr_model_name = 'idda'
        THEN attr_orders ELSE 0 END) AS idda_orders,

    -- ROAS per model = SUM(sales) / NULLIF(SUM(spend), 0) — always ratio-of-sums
    SUM(CASE WHEN attr_model_name = 'last_click'
        THEN attr_sales ELSE 0 END)
        / NULLIF(SUM(CASE WHEN attr_model_name = 'last_click'
                          THEN ad_spend ELSE 0 END), 0) AS lc_roas,
    SUM(CASE WHEN attr_model_name = 'dda'
        THEN attr_sales ELSE 0 END)
        / NULLIF(SUM(CASE WHEN attr_model_name = 'dda'
                          THEN ad_spend ELSE 0 END), 0) AS dda_roas,
    SUM(CASE WHEN attr_model_name = 'idda'
        THEN attr_sales ELSE 0 END)
        / NULLIF(SUM(CASE WHEN attr_model_name = 'idda'
                          THEN ad_spend ELSE 0 END), 0) AS idda_roas
FROM channel_attribution
WHERE event_date BETWEEN '{start_date}' AND '{end_date}'
  AND ads_platform = '{ads_platform}'
  AND sales_platform = '{sales_platform}'
GROUP BY 1
ORDER BY 1

