-- Period-over-period comparison (WoW / MoM) — MUST run as 2 SEPARATE queries
-- Use case: "Last 7 days vs the prior 7 days for Meta." / "This month vs last month."
-- Cube SQL does NOT support CTE / UNION / LAG. Compute delta client-side.
-- Length-align the windows — see references/time-range-resolution.md for MTD vs same-day-prior-MTD rules.

-- ============================================================
-- Query 1: current period
-- ============================================================
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = '<platform>'
  AND event_date      >= '<current_start>'
  AND event_date       < '<current_end>';

-- ============================================================
-- Query 2: prior period — IDENTICAL filters, only dates shift
-- ============================================================
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = '<platform>'
  AND event_date      >= '<prior_start>'
  AND event_date       < '<prior_end>';
