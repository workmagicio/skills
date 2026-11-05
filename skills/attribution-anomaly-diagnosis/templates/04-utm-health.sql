-- Branch A1: UTM / tracking health for rule-based models
-- Two queries: aggregate tenant-level health + ad-level scan
-- Fill: {ads_platform}

-- Aggregate UTM health per ads platform
SELECT
    ads_platform,
    set_properly_ads_ratio,
    unmatch_orders_ratio,
    total_ads_count
FROM platform_offline.ads_view_analytics_tenant_tracking_and_unmatch_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%');

-- Ad-level UTM scan
SELECT
    ads_platform, campaign_name, has_set_properly,
    COUNT(*) AS ad_count
FROM platform_offline.dwd_view_analytics_ads_creative_level_tracking_list_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND is_ads_active = 'Y'
GROUP BY 1, 2, 3
ORDER BY 2, 3

