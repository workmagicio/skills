-- Step 3c: Measurement Readiness check (attribution = 0 only)
-- Fill: {ads_platform}, {sales_platform}

SELECT
    integration_type,
    integration_name,
    feature_module,
    current_check_status,
    hit_rule_when_not_ready,
    hit_rule_detail_actual_expected
FROM platform_offline.feature_readiness_validate
WHERE feature_module = 'mta'
  AND (LOWER(integration_name) LIKE LOWER('%{ads_platform}%')
       OR LOWER(integration_name) LIKE LOWER('%{sales_platform}%'))

