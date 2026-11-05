-- Branch C3: Lift test recalibration (the iDDA-specific cause)
-- Pull recent lift tests + results to see if one triggered the iDDA retroactive change.
-- Fill: {ads_platform}

SELECT
    lt.id AS lift_test_id, lt.name AS test_name,
    lt.ads_platform, lt.tactic_name,
    lt.status, lt.test_start_date, lt.test_end_date, lt.auto_apply,
    r.LIFT_TEST_GROUP_ID, r.LIFT_PCT, r.IROAS,
    r.NC_IROAS, r.NC_IORDERS, r.SALES_PLATFORM, r.UPDATE_TIME
FROM platform_offline.dws_view_analytics_lift_test_latest lt
LEFT JOIN platform_offline.dws_lift_test_result_report_latest r
    ON lt.lift_test_group_id = r.LIFT_TEST_GROUP_ID
WHERE LOWER(lt.ads_platform) LIKE LOWER('%{ads_platform}%')
ORDER BY lt.test_end_date DESC
LIMIT 10

