---
name: attribution-anomaly-diagnosis
description: Diagnose "why" questions about attribution anomalies — attribution = 0 and attribution swings (sudden drops, spikes, or retroactive changes to historical numbers). Walks a structured 5-step diagnostic tree and produces both internal and client-facing explanations. Use when the user asks why attribution looks wrong, not just what the numbers are. Not for simple "show me the numbers" queries.
---

# attribution-anomaly-diagnosis

## 1. Purpose
Diagnose **"why" questions** about attribution anomalies — specifically **attribution = 0** (a tactic shows no attributed orders) and **attribution swings** (sudden drops, spikes, or retroactive changes to historical numbers). The skill walks a structured 5-step diagnostic tree (scope → classify → basic checks → model-specific routing → fallback), produces both an internal diagnostic report and a client-facing explanation. **Do NOT use this skill for simple "show me the numbers" queries** — those belong to `attribution-data-query`.
## 2. When to trigger
Trigger when the user is asking **why** attribution looks wrong, not just **what** the numbers are. Common phrasings:
- "Why did Meta ROAS drop last week?"
- "Why is my [tactic] attribution showing 0?"
- "The numbers I pulled last week are different from this week for the same date range — why?" (**retroactive change**)
- "Something looks wrong with my Google attribution"
- "Why is my new-customer count so low this quarter?"
**Do NOT trigger** when:
- User just wants the numbers (no "why") → `attribution-data-query`
- User wants to compare two attribution models on purpose → `attribution-model-comparison`
- The anomaly is on an out-of-scope channel/tenant → `attribution-edge-routing`
## 3. Inputs
Required and optional fields parsed from the user message. **Ask for missing required fields once before running diagnostics.**

<lark-table rows="9" cols="3" column-widths="217,126,328">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description / default**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenant_id`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Tenant being diagnosed (injected by platform-mcp; never appears in SQL filters)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `ads_platform`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Meta / Google / TikTok / Pinterest / Snap / Amazon Ads ...
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tactic_name`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Specific tactic; if not given, scan all and pick the biggest contributor to the anomaly
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `sales_platform`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Amazon Store / Shopify / TikTok Shop ... Attribution is computed **per sales platform**; the wrong combo (e.g., Amazon Ads → Shopify) is a known product design that always returns 0.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution_model`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      `idda`(32) / `dda`(31) / `last_click`(1) / `first_click`(2) / `any_click`(21). If not specified, scan all models in STEP 1 to locate which is broken. In SQL this is the `attr_model_name` dimension.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `metric`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      `roas` / `attr_orders` / `attr_new_customer_orders` / `cac`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `anomaly_period`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The window where the user sees the anomaly
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `baseline_period`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Comparison window. Default: same-length period immediately before `anomaly_period`.
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 0: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Before any SQL execution, ask the knowledge base about the Cube.dev schema patterns this diagnosis needs. `database-query-sql` requires the `ctx` timestamp it produces. **Skipping fails at execution.**
**Step 1: Lock the scope — which platform × tactic × sales platform × model**
Goal: pinpoint *whose* attribution is broken before diagnosing why. If `attribution_model` is unspecified, compare all models in the anomaly vs baseline windows to locate which one diverged.
```plaintext
-- Cross-model comparison: which attribution model diverged?
SELECT
    src_source AS ads_platform,
    CAST(attr_model_array AS VARCHAR) AS model_array,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(1))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS lc_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(1))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS lc_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS ac_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS ac_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS dda_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS dda_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(32))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS idda_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(32))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS idda_orders_anomaly
FROM platform_offline.dws_view_analytics_attribution_channel_level_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(src_source) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2
ORDER BY 1

```

**Confirm before moving on**: which `ads_platform` + `tactic`, which `sales_platform`, which `attribution_model` (model_id).
**Step 2: Classify — is it "attribution = 0" or "attribution swing"?**

<lark-table rows="3" cols="3" column-widths="148,295,295">

  <lark-tr>
    <lark-td>
      **Type**
    </lark-td>
    <lark-td>
      **How to detect**
    </lark-td>
    <lark-td>
      **Next priority**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Attribution = 0**
    </lark-td>
    <lark-td>
      `attr_orders`/`attr_sales` is exactly 0, or the tactic row is missing from the dashboard
    </lark-td>
    <lark-td>
      Go to Step 3b / 3c / 3d (product-design and config checks) first
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Attribution swing**
    </lark-td>
    <lark-td>
      Numeric value exists but shows a sharp jump up/down, OR the same historical window returns different numbers on different pull dates (**retroactive change**)
    </lark-td>
    <lark-td>
      Go to Step 3a (spend check), then model routing in Step 5
    </lark-td>
  </lark-tr>
</lark-table>

<quote-container>
**Retroactive change note:** If the user says "last week it was X, this week the same date range shows Y," this is iDDA's retro-recalibration mechanism. When a new lift test is applied, the model rewrites attribution back over the historical window. This is expected behavior, not a bug — diagnosed in Branch C / C3.
</quote-container>

**Step 3: Basic checks — metric, product design, config**
<quote-container>
Before entering the model-specific branches, rule out the three "obvious" cause families. These are config / product-design issues, not model issues — they account for the majority of "attribution = 0" tickets.
</quote-container>

### 3a. Did spend change?
Fastest first check: if spend dropped proportionally, attribution dropping proportionally is correct and no further diagnosis is needed.
```plaintext
SELECT
    DATE_TRUNC('week', event_date) AS week,
    ads_platform,
    tactic_name,
    sales_platform,
    SUM(ad_spend) AS spend,
    SUM(calibrated_orders) AS idda_orders,
    SUM(calibrated_new_customer_orders) AS idda_nc_orders,
    SUM(calibrated_sales) AS idda_sales,
    CASE WHEN SUM(ad_spend) > 0
        THEN SUM(calibrated_sales) / SUM(ad_spend) END AS roas,
    CASE WHEN SUM(ad_spend) > 0
        THEN SUM(calibrated_new_customer_sales) / SUM(ad_spend) END AS nc_roas
FROM platform_offline.dws_view_mmm_tactic_daily_metrics_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND LOWER(sales_platform) LIKE LOWER('%{sales_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2, 3, 4
ORDER BY 1

```


<lark-table rows="4" cols="3" column-widths="280,177,281">

  <lark-tr>
    <lark-td>
      **Spend change**
    </lark-td>
    <lark-td>
      **attr_orders change**
    </lark-td>
    <lark-td>
      **Conclusion**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Spend ↓ X%, attr_orders ↓ ~X%
    </lark-td>
    <lark-td>
      Proportional
    </lark-td>
    <lark-td>
      ✅ **Reasonable. Stop here.** Less invested → fewer attributed orders. Explain to the client.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Spend ↓ X%, attr_orders drop >> X%
    </lark-td>
    <lark-td>
      Disproportionate
    </lark-td>
    <lark-td>
      Continue diagnosis
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Spend flat/↑, attr_orders ↓
    </lark-td>
    <lark-td>
      Inverse
    </lark-td>
    <lark-td>
      Continue diagnosis
    </lark-td>
  </lark-tr>
</lark-table>

### 3b. [Attribution = 0 only] Is the platform × sales-platform combo valid?
<quote-container>
**Known product design:****Amazon Ads only attribute to Amazon Store.** If the client is running Amazon Ads but looking at their Shopify or TikTok Shop dashboard, attribution will always be 0 — this is product design, not a bug.
- Amazon Ads → can only attribute to Amazon Store
- Google / Meta / TikTok / Pinterest → can attribute to Shopify, TikTok Shop, etc.
</quote-container>

Ask CS or the client which sales-platform dashboard they're looking at. If it's a known-invalid combo, stop here and explain.
### 3c. [Attribution = 0 only] Measurement Readiness
If product design is ruled out and attribution is still 0, check measurement readiness:
```plaintext
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

```


<lark-table rows="4" cols="2" column-widths="144,531">

  <lark-tr>
    <lark-td>
      **Status**
    </lark-td>
    <lark-td>
      **Meaning**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Ready`
    </lark-td>
    <lark-td>
      Healthy
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Not Ready`
    </lark-td>
    <lark-td>
      Integration incomplete; the model can't run → loop in Eng
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Not Optimal`
    </lark-td>
    <lark-td>
      Integrated but signal quality is degraded (e.g., unmatch rate too high); attribution may be inaccurate but won't be 0
    </lark-td>
  </lark-tr>
</lark-table>

<quote-container>
**Note:** Readiness is a one-way path: `Not Ready → Ready → Not Optimal`. Once Ready, it never returns to Not Ready; "Not Optimal" indicates signal degradation, not zero attribution.
</quote-container>

### 3d. [Row missing from dashboard] Dashboard view & channel config
<quote-container>
Sometimes the client says "I can't see channel X on the dashboard" but it's a config issue — the channel exists, it just isn't classified into the right module.
</quote-container>

1. **Which dashboard?** Ads dashboard vs Channel dashboard — different views, different data organization.
1. **If Ads dashboard:** the channel must be classified as `ads` at the channel level. If not configured, it only shows on the Channel dashboard.
1. **If the Ads dashboard shows an **`**unmatched**`** row:** there's a campaign-level UTM tracking issue — some orders couldn't be matched to a campaign and fell into the unmatched bucket.
**Step 4: Quick attribution-model reference**

<lark-table rows="6" cols="3" column-widths="171,122,328">

  <lark-tr>
    <lark-td>
      **Model**
    </lark-td>
    <lark-td>
      **model_id**
    </lark-td>
    <lark-td>
      **Mechanism**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Last Click
    </lark-td>
    <lark-td>
      1
    </lark-td>
    <lark-td>
      Last click before conversion gets 100% credit
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      First Click
    </lark-td>
    <lark-td>
      2
    </lark-td>
    <lark-td>
      First click before conversion gets 100% credit
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Any Click
    </lark-td>
    <lark-td>
      21
    </lark-td>
    <lark-td>
      Linear: every click in the conversion window gets equal share
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      DDA
    </lark-td>
    <lark-td>
      31
    </lark-td>
    <lark-td>
      Any Click + handling for Unmatched, VTA, and PPS
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      iDDA
    </lark-td>
    <lark-td>
      32
    </lark-td>
    <lark-td>
      DDA + spend-change weighting + lift-test calibration
    </lark-td>
  </lark-tr>
</lark-table>

**Step 5: Model-specific diagnostic branches**
### Branch A — Rule-based models (Last Click / First Click / Any Click)
<quote-container>
**Core mechanism:** pure **click-based** attribution, independent of lift tests. Only two failure modes:
- **Click signal lost** — UTM tracking broken, clicks can't be matched to campaigns
- **Click distribution shift** — a new campaign brings a flood of clicks that dilute/steal share from the old tactic
</quote-container>

**A1 — UTM / tracking health**
```plaintext
-- Aggregate UTM health per ads platform
SELECT
    ads_platform,
    set_properly_ads_ratio,
    unmatch_orders_ratio,
    total_ads_count
FROM platform_offline.ads_view_analytics_tenant_tracking_and_unmatch_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')

```


<lark-table rows="4" cols="2" column-widths="248,490">

  <lark-tr>
    <lark-td>
      **unmatch_orders_ratio**
    </lark-td>
    <lark-td>
      **Meaning**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      < 20%
    </lark-td>
    <lark-td>
      ✅ Healthy
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      20%–40%
    </lark-td>
    <lark-td>
      ⚠️ Elevated — some clicks aren't attributable
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      > 40%
    </lark-td>
    <lark-td>
      🔴 Severe — attribution heavily distorted
    </lark-td>
  </lark-tr>
</lark-table>

```plaintext
-- Ad-level UTM scan
SELECT
    ads_platform, campaign_name, has_set_properly,
    COUNT(*) AS ad_count
FROM platform_offline.dwd_view_analytics_ads_creative_level_tracking_list_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND is_ads_active = 'Y'
GROUP BY 1, 2, 3
ORDER BY 2, 3

```

- `has_set_properly = 'N'`: UTM misconfigured, click signal can be lost → root cause
- `has_set_properly = 'NO_DOMAIN'`: TOF/Reach/VideoViews campaigns have no CTA URL — **expected**, not a bug
- If a campaign with `has_set_properly = 'N'` only appeared during the anomaly window, that's a direct root cause
**A2 — Click distribution shift**
```plaintext
SELECT
    campaign_name,
    MIN(event_date) AS first_seen_date,
    SUM(CASE WHEN event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN clicks ELSE 0 END) AS clicks_baseline,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN clicks ELSE 0 END) AS clicks_anomaly,
    SUM(CASE WHEN event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN ad_spend ELSE 0 END) AS spend_baseline,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN ad_spend ELSE 0 END) AS spend_anomaly,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        AND json_overlaps(attr_model_array, json_array(21))
        THEN attr_orders ELSE 0 END) AS ac_orders_anomaly
FROM platform_offline.dws_view_analytics_ads_ad_level_metrics_attrs_settings_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1
ORDER BY clicks_anomaly DESC

```


<lark-table rows="4" cols="2" column-widths="328,328">

  <lark-tr>
    <lark-td>
      **Signal**
    </lark-td>
    <lark-td>
      **Meaning**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `first_seen_date >= anomaly_start`
    </lark-td>
    <lark-td>
      New campaign that only appeared in the anomaly window
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Clicks ↑↑ but `ac_orders` ≈ 0
    </lark-td>
    <lark-td>
      Lots of clicks, no conversions → dilutes Any Click share
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `spend_baseline > 0` AND `spend_anomaly ≈ 0`
    </lark-td>
    <lark-td>
      Old campaign paused → attribution source disappeared
    </lark-td>
  </lark-tr>
</lark-table>

### Branch B — DDA 
<quote-container>
**Core mechanism:** DDA = Any Click (Linear All) **plus** handling for three things Any Click can't:
1. **Unmatched** — UTM missing; DDA redistributes those orders across campaigns by model weight; Any Click can't.
1. **VTA (View-Through Attribution)** — platform-reported VTA orders from Meta / TikTok / Pinterest / Snap.
1. **PPS (Post-Purchase Survey)** — user fills survey on T, system processes on T+2, then backfills to T (T+2 delay).
</quote-container>

**B1 — Compare DDA vs Any Click first.** If trends are identical, the issue is on the click/touchpoint side → go back to Branch A.
```plaintext
SELECT
    DATE_TRUNC('week', event_date) AS week,
    src_source AS ads_platform,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        THEN attr_orders ELSE 0 END) AS anyclick_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        THEN attr_orders ELSE 0 END) AS dda_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(0))
        THEN attr_orders ELSE 0 END) AS platform_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(0))
        THEN ad_spend ELSE 0 END) AS spend
FROM platform_offline.dws_view_analytics_attribution_channel_level_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(src_source) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2
ORDER BY 1

```

**B2-1 — VTA change.** Only Meta / TikTok / Pinterest / Snap support VTA. If platform-reported VTA suddenly increases or drops to 0, DDA shifts accordingly.
**B2-2 — Unmatched change.** Driven by either (a) attribution rule config changes in the WM backend, or (b) upstream UTM changes from the client. Check `unmatch_orders_ratio` over time — if it moves in lockstep with DDA, this is the cause.
**B2-3 — PPS delay.** If a single day's historical value got revised by a small consistent amount, PPS's T+2 backfill is the most likely cause.
### Branch C — iDDA 
<quote-container>
**Core mechanism:** iDDA = DDA **plus** calibration from lift test results. Order of diagnosis: DDA layer → PPS → lift test.
</quote-container>

**C1 — Check DDA trend first.** If iDDA ≈ DDA in trend, the issue is on the touchpoint/DDA side → go to Branch B. If iDDA diverges from DDA (often dropping more), the iDDA calibration layer introduced the change → continue to C2/C3.
**C2 — PPS.** Same T+2 backfill mechanism as in Branch B. If iDDA shows small retro-edits while DDA is stable, PPS is likely.
**C3 — Lift test calibration (the iDDA-specific cause).** When a new lift test result is applied, iDDA **retroactively rewrites** the historical window. A low-lift result lowers the platform's weight and drags historical attribution down.
```plaintext
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

```


<lark-table rows="6" cols="2" column-widths="328,328">

  <lark-tr>
    <lark-td>
      **Signal**
    </lark-td>
    <lark-td>
      **Meaning**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `test_end_date` within 0–30 days before `anomaly_start`
    </lark-td>
    <lark-td>
      Overlaps the anomaly window — very likely the trigger
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `LIFT_PCT` ≈ 0 or very low
    </lark-td>
    <lark-td>
      Test concluded near-zero incrementality → iDDA cuts weight sharply
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `NC_IROAS` noticeably lower than previous test
    </lark-td>
    <lark-td>
      Calibration was pulled down; NC attribution drops with it
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `auto_apply = 1`
    </lark-td>
    <lark-td>
      Result auto-applied, no manual step required
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `UPDATE_TIME` falls between two client data pulls
    </lark-td>
    <lark-td>
      Direct evidence of a retroactive change
    </lark-td>
  </lark-tr>
</lark-table>

<quote-container>
**Before concluding the lift test result is correct:** were there atypical conditions during the test (promotions, holiday, major spend changes)? Was the holdout design sound? If in doubt, loop in DS and schedule a lift-test refresh once the environment is stable.
</quote-container>

**Step 6: Final fallback — campaign-structure shift**
<quote-container>
If all model branches come up clean, the last check is whether the client's campaign mix actually changed:
- Another tactic's spend exploded and squeezed this one's attribution share (zero-sum allocation)
- Client/agency added a lot of upper-funnel campaigns (Reach / Awareness / VideoViews) — order metrics look worse, but the real cause is a strategy shift, not a reporting issue
</quote-container>


<lark-table rows="5" cols="3" column-widths="240,160,328">

  <lark-tr>
    <lark-td>
      **Metric**
    </lark-td>
    <lark-td>
      **Direction**
    </lark-td>
    <lark-td>
      **Meaning**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      CPM = spend / impr × 1000
    </lark-td>
    <lark-td>
      ↓↓ (e.g. $15 → $3)
    </lark-td>
    <lark-td>
      Shifted to cheap Reach/Awareness inventory
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Impressions
    </lark-td>
    <lark-td>
      ↑↑ (e.g. +600%)
    </lark-td>
    <lark-td>
      Reach campaigns flooded delivery
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      CTR = clicks / impr
    </lark-td>
    <lark-td>
      ↓↓
    </lark-td>
    <lark-td>
      Low-intent audience
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Orders / clicks (CVR)
    </lark-td>
    <lark-td>
      ↓↓
    </lark-td>
    <lark-td>
      Traffic doesn't convert
    </lark-td>
  </lark-tr>
</lark-table>

<quote-container>
Root cause here is **a real campaign-strategy change**, usually from the agency. The attribution drop is real, not a WM bug.
</quote-container>

## 5. Tools used

<lark-table rows="5" cols="3" column-widths="267,160,311">

  <lark-tr>
    <lark-td>
      **Tool**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
    <lark-td>
      Required (first)
    </lark-td>
    <lark-td>
      Consult Cube.dev schema patterns before SQL. Produces the `ctx` timestamp that `database-query-sql` requires. Ask about: attribution model joins, retroactive change patterns, lift-test result tables.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Validate metric and dimension field names (e.g., `attr_model_name`, `calibrated_orders`) before SQL.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Execute Cube.dev SQL. Pass the `ctx` from `knowledge-base-ask`. Tenant isolation is injected by platform-mcp — do not add `tenant_id` filters.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-list` / `lift-test-get`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      For Branch C / C3 — pull lift test metadata and results when iDDA retroactive change is suspected.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
Diagnosis output is **customer-facing** — written for the client (or their CSM relaying to the client). Keep it concise, non-technical, structured for action.
```plaintext
# Attribution Diagnosis · {ads_platform} / {tactic_name}

**Period:** {anomaly_period}  (baseline: {baseline_period})
**Sales platform:** {sales_platform}
**Attribution model:** {idda / dda / last_click}

---

## What we found
[1–2 sentences quantifying the change: "Meta ROAS dropped from 4.2x → 2.6x (−38%) week-over-week, driven primarily by [cause]."]

## Why it happened
[Plain-language explanation of the root cause. Pick the matching scenario from the snippets below; do not paste two contradictory ones. If multiple causes overlap, name the dominant one first.]

## What you can do
[2–3 concrete actions. Each one ≤ 1 sentence. If no action is warranted because the change is expected (e.g., spend dropped proportionally), say so explicitly.]

---
*Diagnosis attribution model: {model_name}. Data as of: {query_time}.*

```

**Output rules**:
- **Three sections only**: What we found / Why it happened / What you can do. Don't add "Background", "Methodology", etc. — those belong in product docs.
- **Quantify the change** in the first sentence (X → Y, ±%) so the reader doesn't have to scan
- **Pick one root-cause story**, not a buffet — if multiple causes overlap, name the dominant one first, mention the second only if material
- **Action items are concrete**: "Review UTM config for [campaigns]" beats "improve tracking"
- **Footer always names the attribution model + data-as-of time** — readers will misinterpret the numbers without it
- **Never expose internal terminology**: no `model_id = 32`, no `dws_view_*` table names, no `attr_enhanced`, no Branch A/B/C labels
- **If the cause is "expected behavior" (Amazon Ads → Shopify, retroactive recalibration, etc.)**, lead with that and explain — don't make the customer think there's a bug
**Reusable scenario snippets** (pick the one that matches; never paste two contradictory ones):
- **Amazon Ads → non-Amazon Store**: "This is expected. Amazon Ads attribution only credits orders completed on Amazon Store. If you're looking at Shopify or another channel, Amazon Ads will always show zero — by design, not a tracking bug."
- **Spend dropped proportionally**: "Spend on [tactic] decreased [X]% over the period; attributed orders dropped about the same. This is proportional, not a performance issue — attribution is reflecting the lower investment correctly."
- **UTM tracking issue**: "We found about [X]% of clicks can't be matched to campaigns because of UTM gaps. Please review UTMs for the listed campaigns — attribution typically recovers within 1–2 weeks once fixed."
- **Click dilution (new high-volume campaigns)**: "Starting [date], [N] new campaigns generated large click volumes. Under [model], those clicks compete for credit. The new campaigns appear Reach/Traffic-optimized — more clicks, fewer conversions — so this is a click-mix shift, not a real performance decline."
- **Lift-test calibration / retroactive change**: "When a new lift test is published, iDDA retroactively updates attribution across the test's historical window. Your latest test for [platform] (completed [date]) showed lower incremental impact than before, so the model recalibrated downward. The [X → Y] change reflects a more accurate estimate of true incrementality, not a real performance drop."
- **Campaign restructure (real performance change)**: "The drop traces to a campaign restructure effective [date] — the account shifted from purchase-optimized to reach/awareness-optimized. Platform-reported orders also dropped [X]% in the same window, so it's a real performance change, not a reporting issue."
- **Share squeezed (iDDA zero-sum)**: "During [window], [other tactic]'s spend grew significantly, and iDDA allocated more credit there. This compressed [your tactic]'s share, even if its absolute contribution didn't change — that's how the zero-sum model works."
## 7. Edge cases & routing

<lark-table rows="7" cols="2" column-widths="328,328">

  <lark-tr>
    <lark-td>
      **Edge case**
    </lark-td>
    <lark-td>
      **Handling**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "why?" but the metric in question is on an unsupported channel
    </lark-td>
    <lark-td>
      Route to `attribution-edge-routing`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants to compare two models on purpose ("does last_click see Meta the same way iDDA does?")
    </lark-td>
    <lark-td>
      Route to `attribution-model-comparison`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Spend dropped proportionally with attribution
    </lark-td>
    <lark-td>
      Stop after Step 3a. Explain to the client; don't run the full tree.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Amazon Ads → Shopify combo, attribution = 0
    </lark-td>
    <lark-td>
      Stop after Step 3b with the product-design snippet.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Retroactive change but no recent lift test
    </lark-td>
    <lark-td>
      Check PPS first (Step B2-3 / C2); if that's clean, escalate to DS.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Lift test result looks abnormal (test ran during a holiday / promo)
    </lark-td>
    <lark-td>
      Surface this in the Internal section and recommend a lift-test refresh; do not silently dismiss the model output.
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Skip **`**knowledge-base-ask**`** before SQL** — `database-query-sql` requires the `ctx` timestamp
- **Skip Step 3a (spend check)** — most "swings" are just proportional spend changes
- **Jump straight into lift-test diagnosis on a rule-based or DDA anomaly** — lift tests only affect iDDA
- **Conclude "WM bug" without verifying against platform-reported orders** — if Meta Ads Manager also shows the drop, it's real
- **Treat retroactive change as a bug** — for iDDA it's expected; explain the mechanism instead
- **Use **`**attribution_model**`** as a SQL column** — the actual dimension is `attr_model_name`
- **Run the full 5-step tree when Step 3 already explains it** — stop early when an obvious cause is found
- **Expose internal terminology** — customers should never see "model_id = 32", table names, or Branch A/B/C labels
- **Recommend a lift-test refresh without checking the test's environmental conditions** — refresh during a promo period just creates a second bad number
- **Add **`**tenant_id**`** filters in SQL** — platform-mcp injects it
## 9. References & related skills
**Key tables:**

<lark-table rows="9" cols="2" column-widths="328,328">

  <lark-tr>
    <lark-td>
      **Table**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dws_view_mmm_tactic_daily_metrics_latest`
    </lark-td>
    <lark-td>
      iDDA tactic-level attribution (`calibrated_orders`, `calibrated_new_customer_orders`, `calibrated_sales`)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dws_view_analytics_attribution_channel_level_latest`
    </lark-td>
    <lark-td>
      Cross-model comparison (model 0 / 21 / 31 / 32); Step 1 routing
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dws_view_analytics_ads_ad_level_metrics_attrs_settings_latest`
    </lark-td>
    <lark-td>
      Campaign-level click / spend / orders breakdown
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.feature_readiness_validate`
    </lark-td>
    <lark-td>
      Measurement readiness state
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.ads_view_analytics_tenant_tracking_and_unmatch_latest`
    </lark-td>
    <lark-td>
      Tenant-level UTM match rate
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dwd_view_analytics_ads_creative_level_tracking_list_latest`
    </lark-td>
    <lark-td>
      Ad-level UTM config detail
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dws_view_analytics_lift_test_latest`
    </lark-td>
    <lark-td>
      Lift test list (join key: `lift_test_group_id`)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_offline.dws_lift_test_result_report_latest`
    </lark-td>
    <lark-td>
      Lift test results (`LIFT_PCT`, `IROAS`, `NC_IROAS`)
    </lark-td>
  </lark-tr>
</lark-table>

**Related skills:**
- **Upstream**: `attribution-intent-clarification` (if the "why" question is too vague to scope)
- **Sibling**: `attribution-model-comparison` (user wants two models compared, not a diagnosis), `attribution-data-query` (user just wants numbers, no diagnosis)
- **Route to**: `attribution-edge-routing` (out-of-scope channel/tenant)
