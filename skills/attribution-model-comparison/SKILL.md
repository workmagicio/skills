---
name: attribution-model-comparison
description: Pull attribution numbers under multiple attribution models side-by-side and explain why they differ, in business language. Use when the user wants to compare attribution across models or understand discrepancies between WorkMagic, Meta Ads Manager, and Google Ads numbers. Not for single-model queries.
---

# attribution-model-comparison

## 1. Purpose
Pull attribution numbers under **multiple attribution models side-by-side** and explain **why they differ**, using business-language interpretation grounded in how each model works. This skill exists because users frequently see different numbers in different places (WorkMagic dashboard vs Meta Ads Manager vs Google Ads) and want to understand the discrepancy.
**This skill is not**:
- A diagnosis of why a single model dropped — that's `attribution-anomaly-diagnosis`
- A judgment of which model is "correct" — give situational guidance only if asked, never push one as the right answer
- A pure data pull — must include the interpretation step
## 2. When to trigger
Trigger when the user wants to **compare attribution under different models**. Common phrasings:
- "Compare Meta under last_click vs iDDA"
- "Why is WorkMagic showing lower ROAS than Meta Ads Manager?"
- "Show me the difference between data_driven and first_click for all channels"
- "How do my channels look across all attribution models?"
- "Which attribution model should I trust for Meta?" (educational variant — answer + optionally pull data)
**Do NOT trigger** when:
- User wants a single model's number → `attribution-data-query`
- User asks "why did X drop?" on a single model → `attribution-anomaly-diagnosis`
- User asks for educational content only ("what is iDDA?") → answer from `knowledge-base-ask` without pulling data
## 3. Inputs

<lark-table rows="7" cols="3" column-widths="185,155,419">

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
      `models`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      ```plaintext
      idda
      ```
      ```plaintext
      dda
      ```
      ```plaintext
      last_click
      ```
      ```plaintext
      platform_reported
      ```
      ```plaintext
      idda
      ```
      ```plaintext
      dda
      ```
      ```plaintext
      platform_reported
      ```
      ```plaintext
      idda
      ```
      ```plaintext
      dda
      ```
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
      Meta / Google / TikTok / Pinterest / Snap / Amazon Ads / "all"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `sales_platform`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `metric`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **Default:**`attr_orders` + `roas` (the two most commonly compared metrics). If user specifies one, use it.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dimension`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **Default:** by `ads_platform` (channel level). If user asks "for all channels" or "across channels", use channel level. If user names a specific channel, drill to `tactic_name` or `campaign_name`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `time_range`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **Default:** past 30 days. Model comparison needs enough volume to be stable; 7 days is too noisy.
    </lark-td>
  </lark-tr>
</lark-table>

**Model → model_id mapping** (used in SQL via `attr_model_name`):

<lark-table rows="7" cols="3" column-widths="219,119,328">

  <lark-tr>
    <lark-td>
      **Model**
    </lark-td>
    <lark-td>
      **model_id**
    </lark-td>
    <lark-td>
      **What it represents**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_reported`
    </lark-td>
    <lark-td>
      0
    </lark-td>
    <lark-td>
      What the ads platform (Meta / Google / TikTok) reports natively — uncalibrated, no cross-channel de-dup
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `last_click`
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
      `first_click`
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
      `any_click`
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
      `dda`
    </lark-td>
    <lark-td>
      31
    </lark-td>
    <lark-td>
      Data-driven attribution: any_click + handling for Unmatched / VTA / PPS
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `idda`
    </lark-td>
    <lark-td>
      32
    </lark-td>
    <lark-td>
      Incremental DDA: dda + lift test calibration; reflects true incremental contribution
    </lark-td>
  </lark-tr>
</lark-table>

<callout emoji="bulb" background-color="light-orange" border-color="light-orange">
**Model availability by sales platform** — not all models work on all sales platforms:
- **DTC platforms (Shopify, TikTok Shop, etc.)**: all 6 models valid (platform_reported, last_click, first_click, any_click, dda, idda)
- **Non-DTC platforms (Amazon Store, etc.)**: only **iDDA, DDA, and platform_reported** are valid. Click-based models (last_click, first_click, any_click) are NOT available because click signal cant be observed off-site on these platforms.
For a scientific comparison, **pin a single sales platform** and use only its valid model set. Mixing DTC and non-DTC into one comparison row is not meaningful — run them as separate comparisons if the user wants to see both.
</callout>

## 4. SOP
**Step 1: Parse the request**
- Identify which models the user wants. If 0 specified → use default 4-way. If 1 specified → assume they want to compare it against the default set; ask once to confirm. If 2+ specified → use exactly what they named.
- Check tenant has `idda` available (via `knowledge-base-ask` or `lift-test-list`). If not, replace `idda` with `dda` in the default set and inform the user.
- Cap the comparison at **6 models**; more than that is unreadable. If user asks for "all" → use all 6 (platform_reported / last_click / first_click / any_click / dda / idda).
**Step 2: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Ask for:
- How to query multiple models in one SQL via `attr_model_name` or `attr_model_array`
- The mechanism diff between the chosen models (this powers the interpretation step)
- Whether the tenant has active lift tests affecting the time window (relevant for iDDA interpretation)
Required for the `ctx` timestamp that `database-query-sql` needs.
**Step 3: Validate fields via **`**dashboard-metrics-list**`
Validate metric names (`attr_orders`, `attr_roas`, `attr_new_customer_roas`, etc.) and the `attr_model_name` dimension.
**Step 4: Build the SQL**
Use a single query with `CASE WHEN` branches per model, not N separate queries — this guarantees the comparison is on the same row set (same time range, same filters, same dedup). Pattern:
```plaintext
SELECT
    ads_platform,
    SUM(CASE WHEN attr_model_name = 'platform_reported'
        THEN attr_orders ELSE 0 END) AS platform_orders,
    SUM(CASE WHEN attr_model_name = 'last_click'
        THEN attr_orders ELSE 0 END) AS lc_orders,
    SUM(CASE WHEN attr_model_name = 'dda'
        THEN attr_orders ELSE 0 END) AS dda_orders,
    SUM(CASE WHEN attr_model_name = 'idda'
        THEN attr_orders ELSE 0 END) AS idda_orders,
    -- ROAS variants
    SUM(CASE WHEN attr_model_name = 'last_click'
        THEN attr_sales ELSE 0 END)
        / NULLIF(SUM(CASE WHEN attr_model_name = 'last_click'
                          THEN ad_spend ELSE 0 END), 0) AS lc_roas,
    SUM(CASE WHEN attr_model_name = 'idda'
        THEN attr_sales ELSE 0 END)
        / NULLIF(SUM(CASE WHEN attr_model_name = 'idda'
                          THEN ad_spend ELSE 0 END), 0) AS idda_roas
FROM channel_attribution
WHERE event_date BETWEEN '{start}' AND '{end}'
  AND ads_platform = '{ads_platform}'
  AND sales_platform = '{sales_platform}'
GROUP BY 1
ORDER BY 1

```

Notes:
- Use **Cube.dev syntax**, not raw warehouse SQL
- `attr_model_name` is the dimension; do not use a field literally named `attribution_model`
- Tenant isolation is injected by platform-mcp — do not add `tenant_id` filters
- For "all channels" comparison, group by `ads_platform`; for single-channel deep dive, group by `tactic_name` or `campaign_name`
**Step 5: Compute deltas**
- For each row, compute `delta = idda - last_click` (or whichever anchor pair makes the user's question clearest)
- Express as absolute and percentage: "Meta: 4.8x → 2.3x (-52%)"
- Sort the output by absolute delta descending — biggest gaps first
**Step 6: Interpret using **`**knowledge-base-ask**`** + diff patterns (Section 5 below)**
- Identify which diff pattern matches the data (e.g., "last_click >> idda" → calibration / over-reporting story)
- Surface 1–2 business-language sentences **per row** if comparing few channels, or per "story" (the 2–3 most striking rows) if many
- Don't invent reasons — if the pattern doesn't match any known story, say "this differential isn't from a typical pattern; worth checking the lift test calendar / VTA configuration"
**Step 7: Return — table + interpretation, no follow-up question**
- Output: side-by-side table + 1–3 sentences of interpretation
- **Do not** ask "want me to also look at X?" — UI exposes drill-down
- **Do not** append "which model should I use?" guidance unless the user explicitly asked
## 5. Diff patterns (interpretation playbook)
When two models differ noticeably (> 15–20% delta), match against the patterns below and use the corresponding business-language explanation. **Do not invent reasons** — if no pattern matches, surface that fact instead of guessing.

<lark-table rows="11" cols="2" column-widths="291,447">

  <lark-tr>
    <lark-td>
      **Pattern**
    </lark-td>
    <lark-td>
      **Business-language explanation**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_reported >> last_click`
    </lark-td>
    <lark-td>
      Platforms report their own attribution without cross-channel de-duplication — Meta, Google, and TikTok each take credit for the same conversion if all touched the user. WorkMagic last_click deduplicates by giving credit only to the platform that actually owned the last click. Expect the platform-reported sum across channels to exceed total orders.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `last_click > dda`
    </lark-td>
    <lark-td>
      Last click concentrates 100% credit on the final touch; dda spreads credit across all clicks in the conversion path. A channel that often appears late in the journey (retargeting-heavy Meta, branded Google search) will show stronger in last_click than dda.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `last_click > idda` (most common)
    </lark-td>
    <lark-td>
      The classic "platform vs incremental" gap. Last click awards credit for every conversion it touched last; iDDA further discounts conversions that would have happened anyway (calibrated by lift test). The gap reflects the channel's **real incremental contribution** being lower than its observed last-touch share.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dda > idda`
    </lark-td>
    <lark-td>
      dda is the pure mathematical distribution; iDDA layers lift-test calibration on top. If the channel's most recent lift test concluded with a low `LIFT_PCT`, iDDA will deflate its weight below the dda baseline. Check the lift-test calendar to confirm.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `first_click > last_click`
    </lark-td>
    <lark-td>
      This channel plays a discovery/awareness role — it brings users into the journey, but they convert through a different channel later. Meta and TikTok (especially video / branded campaigns) commonly show stronger in first_click than last_click.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `idda > last_click` (rare)
    </lark-td>
    <lark-td>
      Usually driven by view-through attribution (VTA) credited in iDDA but ignored by last_click. Common for high-impression brand-style campaigns on Meta / TikTok / Pinterest / Snap where users see the ad and convert without clicking.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `idda ≈ dda`
    </lark-td>
    <lark-td>
      No active lift-test calibration affecting this channel — either no lift test has been run, or the most recent test concluded with a neutral lift. iDDA is essentially passing dda through.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `idda ≈ last_click`
    </lark-td>
    <lark-td>
      The channel behaves like a true last-touch driver with high incrementality — most of what it shows in last_click survives the calibration. Common for lower-funnel performance channels with strong conversion intent.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `All models close` (within ~10%)
    </lark-td>
    <lark-td>
      Straightforward conversion paths, minimal cross-channel overlap, no big VTA component. The channel does roughly what it looks like it does. Often seen for small-volume tactics or channels with simple buyer journeys.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `platform_reported >> idda` (extreme)
    </lark-td>
    <lark-td>
      Two things stacked: cross-channel double-counting (platform vs last_click gap) AND incrementality discount (last_click vs idda gap). Common in iOS-era Meta or post-cookie-deprecation Google where platforms aggressively claim conversions they didn't drive. The iDDA number is the closer estimate of business impact.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Tools used

<lark-table rows="5" cols="3" column-widths="231,167,328">

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
      Get model mechanism explanations + Cube.dev schema patterns + `ctx` timestamp for SQL execution. **This skill especially depends on KB for interpretation** — never invent model behavior.
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
      Validate `attr_orders`, `attr_roas`, `attr_model_name` and other field names
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
      Execute the multi-model CASE WHEN SQL in one shot
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-list`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      When iDDA is in the comparison set, check active lift tests on this channel to (a) confirm idda is available, (b) ground the dda-vs-idda interpretation
    </lark-td>
  </lark-tr>
</lark-table>

## 7. Output format
**One message, two parts**: side-by-side table → interpretation. No question at the end.
<callout emoji="bar_chart" background-color="light-gray" border-color="gray">
**Meta attribution across 4 models — past 30 days, Shopify**
</callout>


<lark-table rows="2" cols="6" column-widths="102,193,101,87,87,168">

  <lark-tr>
    <lark-td>
      **Channel**
    </lark-td>
    <lark-td>
      **Platform-reported ROAS**
    </lark-td>
    <lark-td>
      **Last Click**
    </lark-td>
    <lark-td>
      **DDA**
    </lark-td>
    <lark-td>
      **iDDA**
    </lark-td>
    <lark-td>
      **Δ (iDDA − Last Click)**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Meta
    </lark-td>
    <lark-td>
      5.2x
    </lark-td>
    <lark-td>
      4.8x
    </lark-td>
    <lark-td>
      3.1x
    </lark-td>
    <lark-td>
      2.3x
    </lark-td>
    <lark-td>
      −52%
    </lark-td>
  </lark-tr>
</lark-table>

**What this shows**: Meta looks strong in last_click (4.8x) but iDDA drops it to 2.3x — that's a 52% gap. The reason is two-fold: (1) platform-reported (5.2x) is even higher because Meta and other channels each claim the same conversions without de-dup, and (2) the latest Meta lift test concluded with limited incremental impact, so iDDA's calibration further discounts Meta's contribution. **The iDDA number is the closer estimate of Meta's real business impact.**
**Output rules**:
- Table first, interpretation second (never the other way)
- Always show **which sales platform** and **time range** were used (one line above the table)
- Sort by absolute delta descending if comparing multiple channels
- Highlight the largest gap explicitly — don't make the user scan
- One paragraph of interpretation max (~3 sentences); link to anomaly-diagnosis if user wants to drill deeper
## 8. Edge cases & routing

<lark-table rows="8" cols="2" column-widths="309,410">

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
      Tenant has no lift tests (no iDDA available)
    </lark-td>
    <lark-td>
      Drop iDDA from the default set. Inform user in one sentence: "Your account doesn't have an iDDA model yet — that requires lift tests. Showing dda, last_click, and platform-reported instead."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for a model that doesn't exist for this tenant (e.g., "show me MMM attribution")
    </lark-td>
    <lark-td>
      Tell the user what's available. If they're asking about a different product (MMM), route to `attribution-edge-routing`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants comparison across > 6 models
    </lark-td>
    <lark-td>
      Cap at 6 (all models). Don't fan out to per-attribution-window comparisons; that's a different analysis.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "why did Meta drop?" but actually wants to compare two models on the drop
    </lark-td>
    <lark-td>
      If the question is "why did model X give a different number than model Y on Meta last week," this is comparison + diagnosis hybrid. Run comparison first, then if a clear pattern (e.g., recent lift test) emerges, hand off to `attribution-anomaly-diagnosis`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks "which model should I trust for Meta?"
    </lark-td>
    <lark-td>
      This is educational. Pull the data first, then give situational guidance: "For budget decisions → iDDA / dda. For reconciling against Meta Ads Manager → last_click. For understanding the discovery path → first_click." **Don't push one model as "correct".**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Comparison shows all models within ~10% of each other
    </lark-td>
    <lark-td>
      Still surface this — it's an informative finding ("no significant divergence; this channel's attribution is consistent across models"). Don't pretend there's a story when there isn't.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User compares first_click for a single-channel deep dive ("show me Meta's first_click contribution")
    </lark-td>
    <lark-td>
      This is more about *discovery path* than model comparison. Run as a single-model query (route to `attribution-data-query`) unless they explicitly want vs another model.
    </lark-td>
  </lark-tr>
</lark-table>

## 9. Failure modes (never do these)
- **Run N separate queries instead of one CASE WHEN** — separate queries can drift on filters / dedup and produce non-comparable numbers
- **Compare click-based models on a non-DTC sales platform** — last_click / first_click / any_click are NOT valid on Amazon Store and similar; only iDDA, DDA, and platform-reported are. Dropping click models silently is also wrong — tell the user once.
- **Mix multiple sales platforms in one comparison row** — attribution is per sales platform AND the valid model set differs (DTC vs non-DTC). Run separately per sales platform; never merge into one row.
- **Skip **`**knowledge-base-ask**`** before SQL** — `database-query-sql` requires the `ctx` timestamp
- **Invent a reason for a diff that doesn't match any known pattern** — say "this pattern isn't typical; worth checking lift test calendar / VTA config" instead
- **Push one model as "the right answer"** — give situational guidance only when asked; the user picks based on their decision context
- **Mix sales platforms in one row** — attribution is per sales platform; combining them distorts the comparison
- **Default to a 7-day window** — too noisy for model comparison; use 30 days as the default
- **Compare iDDA to anything when no lift tests exist** — surface the missing-lift-test state and use dda instead
- **Hide the platform-reported column when comparing** — it anchors the user's expectation ("but Meta says 5x") and explains the most common confusion
- **Use **`**attribution_model**`** as a SQL column** — the actual dimension is `attr_model_name`
- **Ask "want to look deeper?" at the end** — the UI exposes drill-down; don't pad
- **Append a "which model should I use" guide when the user didn't ask** — pad-y and presumptuous
- **Add **`**tenant_id**`** filters in SQL** — platform-mcp injects it
## 10. References & related skills
**Related skills**:
- **Upstream**: `attribution-intent-clarification` (when "compare attribution" is too vague — which models? which channel?)
- **Sibling**: `attribution-data-query` (single-model number), `attribution-anomaly-diagnosis` (why a single model changed)
- **Downstream**: `attribution-anomaly-diagnosis` (if comparison surfaces a one-off anomaly — e.g., iDDA fell off a cliff because a new lift test was applied)
- **Out of scope**: `attribution-edge-routing` (MMM, forecasting, non-WM attribution products)
**Key dataset**: `channel_attribution` (for channel-level comparison) / `ads_attribution` (for campaign-level deep dive). The `attr_model_name` dimension carries the model identity; switching between `idda` / `dda` / `last_click` / `first_click` / `any_click` / `platform_reported` happens via this single field.
