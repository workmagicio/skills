---
name: attribution-data-query
description: Translate an explicit attribution data request into a precise SQL query and return results — no estimation or fabrication. The default skill for query-type requests in the Attribution domain. Use when the user asks for specific metrics by dimension over a time range (e.g. "Show me ROAS by channel for the last 30 days", "Which campaigns spent the most last week?"). Not for ambiguous requests, "why" questions, or model comparisons.
---

# attribution-data-query

## 1. Purpose
Translate the user's explicit data request into a precise SQL query and return results. **No estimation, no fabrication, no proactive dashboard creation.** This is the default skill for all query-type requests in the Attribution domain.
## 2. When to trigger
**Trigger condition**: The user's request explicitly states (or strongly implies) **most** of the following:
- A specific metric (ROAS, spend, new_customers, conversion_rate, etc.)
- A specific dimension (channel, campaign, creative, sales_channel)
- A time range (explicit or common phrasing like "last week", "last 30 days")
- Optional: filter conditions, attribution model, sort order
**Examples that should trigger this skill**:
- "Show me ROAS by channel for the last 30 days"
- "Which campaigns spent the most last week?"
- "Pull total sales of TikTok Shop for last week"
- "Show me campaigns where ROAS > 2"
- "Compare last 7 days vs the previous 7 days"
- "Show me ROAS by channel using last click" (single model override stays here, not in model-comparison)
**Examples that should NOT trigger this skill — route to another skill instead**:

<lark-table rows="7" cols="2" column-widths="344,240">

  <lark-tr>
    <lark-td>
      **Input pattern**
    </lark-td>
    <lark-td>
      **Route to**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Ambiguous request ("Show me my numbers" / "How is Meta doing")
    </lark-td>
    <lark-td>
      `attribution-intent-clarification`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Why" question ("Why did sales drop?")
    </lark-td>
    <lark-td>
      `attribution-anomaly-diagnosis`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Comparing 2+ attribution models ("Compare iDDA vs last_click")
    </lark-td>
    <lark-td>
      `attribution-model-comparison`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Business-label dimension ("by region" / "by audience" / "by brand")
    </lark-td>
    <lark-td>
      `attribution-custom-dimension`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Create / build a dashboard"
    </lark-td>
    <lark-td>
      `attribution-custom-report`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Send me a weekly/daily report"
    </lark-td>
    <lark-td>
      `attribution-weekly-report`
    </lark-td>
  </lark-tr>
</lark-table>

## 3. Inputs
**Fields you must parse from user input**:

<lark-table rows="8" cols="3" column-widths="184,110,587">

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
      `dataset`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      One of: `channel_attribution` (by channel) / `ads_attribution` (by campaign/ad) / `creative_attribution` (by creative) / `order_sales` (raw orders, no attribution split). **Infer from user phrasing; never ask user to pick a DataSet name.**
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
      Extract from user input. **Always call **`**dashboard-metrics-list**`** to validate the field name before using it.** Never guess.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dimension`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      ```plaintext
      dashboard-metrics-list
      ```
      ```plaintext
      ads_attribution
      ```
      ```plaintext
      creative_attribution
      ```
      ```plaintext
      Product Group
      ```
      ```plaintext
      Asset Type
      ```
      ```plaintext
      Creator name
      ```
      ```plaintext
      propertyName
      ```
      ```plaintext
      tenantId
      ```
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
      **Default: past 7 days.** When user doesn't specify, use the default and inform them in one sentence ("Defaulting to the past 7 days — let me know if you want a different window"). **Do not ask back.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution_model`
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
      attr_model_name
      ```
      ```plaintext
      WHERE attr_model_name = idda
      ```
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `filters`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Extract from input ("only Meta", "ROAS > 2", "exclude test").
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `order_by / limit`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      "top 10" / "most" implies sorting — order descending by the implied key.
    </lark-td>
  </lark-tr>
</lark-table>

### 3.1 Time range resolution
**Always re-fetch today's date before resolving any relative phrasing. Do not assume today's date from training data or earlier in the conversation.**
Resolve silently, then state the window in business language (not ISO dates) in the response:

<lark-table rows="15" cols="2" column-widths="161,587">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Resolve as** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "today"
    </lark-td>
    <lark-td>
      today (note: same-day data is usually incomplete — see §7 Data ingestion lag)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "yesterday"
    </lark-td>
    <lark-td>
      yesterday (may still be ingesting — see §7)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "this week"
    </lark-td>
    <lark-td>
      Monday of current week through today
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "last week"
    </lark-td>
    <lark-td>
      previous 7 days ending yesterday
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "this month" / "MTD"
    </lark-td>
    <lark-td>
      1st of current month through today
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "last month"
    </lark-td>
    <lark-td>
      full previous calendar month
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "this quarter"
    </lark-td>
    <lark-td>
      start of current quarter through today
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "last quarter"
    </lark-td>
    <lark-td>
      full previous quarter
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Q1 2026", "April 2026"
    </lark-td>
    <lark-td>
      exact calendar bounds
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "YTD"
    </lark-td>
    <lark-td>
      Jan 1 of current year through today
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "last 30 days" / "last N days"
    </lark-td>
    <lark-td>
      past N days ending yesterday (or today if data is fully loaded)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "recently", "lately", "these days"
    </lark-td>
    <lark-td>
      past 7 days (do not ask back — default + tell)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Future date ("next week", "next month")
    </lark-td>
    <lark-td>
      Tell the user that period has no data yet
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Invalid date ("May 32")
    </lark-td>
    <lark-td>
      Ask once to clarify
    </lark-td>
  </lark-tr>
</lark-table>

**Comparison windows must be length-aligned.** The pitfall: today is the 15th, user asks "this month vs last month." Comparing *all of May* (half-empty) against *all of April* (full) makes May look like a ~50% drop that isn't real.
Fix: when the current window is partial, clip the comparison window to the same number of elapsed days (MTD vs. same-day-last-month MTD). State this in one line: "Comparing May 1–15 vs. April 1–15 since May isn't over yet."
### 3.2 Attribution model default
Check the tenant's lift-test status to choose the default:
- **Tenant has run lift tests** → default to idda (incrementality-adjusted DDA)
- **Tenant has not run lift tests** → default to dda (data-driven attribution)
- **User explicitly named a model** → use exactly what they said. Never silently switch. Never question the choice. Never lecture about model differences. If the user's model differs from the tenant default, add **one** short business-language line in the output (e.g. "Last-click will tend to make bottom-funnel channels look stronger than your usual view.") — and do not repeat that line on subsequent turns in the same conversation.
**Never proactively ask the user "which attribution model do you want?"** — the default is the answer.
**Alias mapping (apply silently — no clarifying question):**

<lark-table rows="8" cols="2" column-widths="371,282">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Map to** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "last touch", "last-click", "last click", "last paid click"
    </lark-td>
    <lark-td>
      last_click
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "first touch", "first-click", "first click"
    </lark-td>
    <lark-td>
      first_click
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "linear", "even"
    </lark-td>
    <lark-td>
      linear
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "time decay", "decay"
    </lark-td>
    <lark-td>
      time_decay
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "data-driven", "data driven", "DDA", "MTA", "multi-touch", "multi touch"
    </lark-td>
    <lark-td>
      dda
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "incrementality-adjusted", "iDDA", "LDDA" (common typo for iDDA)
    </lark-td>
    <lark-td>
      idda
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Shapley", "Markov", "position-based", or any model not in the list above
    </lark-td>
    <lark-td>
      Tell the user that model isn't available; list the 2 closest available options. Do **not** silently substitute.
    </lark-td>
  </lark-tr>
</lark-table>

**iDDA without lift test data** → do not run. Say: "iDDA needs lift test data and this account hasn't run one yet — want me to use DDA for now, or talk to your CSM about a lift test?" Then proceed with DDA after the user confirms. Do not invent results.
### 3.3 Frequency / granularity default
Pick by time-window size — don't ask:

<lark-table rows="5" cols="2" column-widths="109,284">

  <lark-tr>
    <lark-td>
      **Window size** {align="center"}
    </lark-td>
    <lark-td>
      **Default granularity** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      1 day
    </lark-td>
    <lark-td>
      single number (or hourly if supported)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      ≤ 14 days
    </lark-td>
    <lark-td>
      daily
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      15–90 days
    </lark-td>
    <lark-td>
      weekly
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      > 90 days
    </lark-td>
    <lark-td>
      monthly
    </lark-td>
  </lark-tr>
</lark-table>

Mention granularity in one short line if it might surprise the user ("Showing weekly trend since the window is 30 days — say the word for daily.").
## SOP
**Step 1: Parse the request**
Map natural language into the input fields above. Resolve silently:
1. **Today's date** (re-fetch — do not hard-code)
1. **Time window** (apply §3.1 table, anchored to today)
1. **Attribution model** (apply §3.2 default + alias map)
1. **DataSet** (apply §4 Step 2)
1. **Dimensions** — only what the user said. Don't add "by date" or "by country" unsolicited.
1. **Metrics** — alias if needed, validate in Step 4.
**Filters / order / limit** — extract from input.
**Step 2: Pick the DataSet (by dimension)**
- By channel → `channel_attribution`
- By campaign / ad set / ad → `ads_attribution`
- By creative / asset → `creative_attribution`
- Pure sales / orders / no channel split → `order_sales`
- Note: `lift_test_result` exists but belongs to the lift-test domain — route there if user asks about lift test results
- "campaigns spent the most" → **not** channel; use `ads_attribution`
**Step 3: Consult **`**knowledge-base-ask**`** first (MANDATORY)**
Before any SQL execution, ask the knowledge base about the Cube.dev schema patterns needed for this query. The `database-query-sql` tool requires a `ctx` timestamp proving you consulted the knowledge base. **Skipping this step is not allowed and will fail at execution.**
Ask focused questions like:
- "How to query `{dataset}` with filter on `{dimension}` for the last N days?"
- "What are the valid join keys for `{dataset}`?"
- "How to express period-over-period comparison in Cube.dev SQL?"
**Step 4: Validate fields via **`**dashboard-metrics-list**`
This step is **mandatory**. Never guess field names and query directly. Validate:
- The metric field name exists in the chosen DataSet (e.g., `attr_orders`, `attr_roas`, `attr_new_customer_roas`)
- The dimension field name exists (e.g., `ads_platform`, `campaign_name`, `attr_model_name`)
- If user used an alias ("ROAS", "POAS", "return on ad spend") → find closest match in metrics-list. If none, ask once.
- **For **`**ads_attribution**`** / **`**creative_attribution**`** with NC dimensions**: pass `tenantId` to fan out tenant-specific naming-convention propertyNames (e.g., `Product Group`, `Asset Type`, `Creator name`). Use the propertyName **exactly as returned (case-sensitive)**.
**Step 5: Construct and execute SQL via **`**database-query-sql**`
- Use Cube.dev SQL syntax (not raw warehouse SQL)
- Use the field names validated in Step 4
- Pass the `ctx` timestamp from Step 3 (ISO 8601)
- WHERE clauses must correctly reflect user's filter intent (including `NOT LIKE` / `NOT IN` reversals)
- Aggregation granularity must match user intent: "spend > 1000" defaults to **total per campaign**, not per-day
- Convert percentages to decimals: "> 5%" is 0.05, not 5
- For attribution model filtering, use dimension `attr_model_name` (e.g., `WHERE attr_model_name = 'idda'`)
- For time-comparison queries ("vs previous"), use `UNION` or `CASE WHEN` with **length-aligned windows**
- For "this month" mid-month: use **current month-to-date vs same-length prior period**. Never compare full month vs full month when the current month is incomplete
- Tenant isolation is enforced by platform-mcp — **do not add tenant_id filters in SQL**
**Step 6: Return results**
- Small result set (≤ 20 rows): show as a table
- Large result set: top N summary
- Add a **one-sentence** brief reading (what's high, what's low). **No long-form analysis.**
- **Transparent defaults**: state which defaults you used, in business language:
  - Time window: "Last 7 days" — not ISO dates
  - Attribution model: state it only if it differs from the tenant default, or if the user specified one
  - Granularity: only if it might surprise (e.g. weekly view of a 30-day window)
- **Do NOT proactively ask** "Want to save this as a dashboard?" — UI already exposes that
## 5. Tools used

<lark-table rows="5" cols="3" column-widths="232,164,328">

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
      Consult Cube.dev schema patterns before SQL. Produces the `ctx` timestamp that `database-query-sql` requires. **Skipping fails at SQL execution.**
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
      Validate metric / dimension field names exist on the chosen DataSet. For `ads_attribution` / `creative_attribution` with NC dimensions, pass `tenantId` to fan out tenant-specific propertyNames. **Call before every query — never skip.**
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
      Execute the Cube.dev SQL query. Pass the `ctx` from `knowledge-base-ask`. Tenant isolation is injected by platform-mcp — do not add `tenant_id` filters.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenant-list`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Look up `tenantId` when needed to fan out NC dimensions on `dashboard-metrics-list`.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
- **Table first**: small result sets (≤ 20 rows) shown directly in a table
- **Top-N summary**: large result sets show only top 10 or 20 with a note ("N total rows, showing top 10")
- **One-line reading**: what's high / low (≤ 2 sentences)
- **Transparent defaults**: state which defaults you used (time window, attribution model)
- **Cite the data source**: annotate the DataSet name at the end of the response
- **No proactive "save as dashboard"** prompt — UI has that entry
- **No long analysis** — that's the job of `attribution-anomaly-diagnosis`
## 7. Edge cases & routing

<lark-table rows="18" cols="2" column-widths="289,380">

  <lark-tr>
    <lark-td>
      **Edge case** {align="center"}
    </lark-td>
    <lark-td>
      **How to handle** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User's metric isn't an exact match in metrics-list
    </lark-td>
    <lark-td>
      Find the closest field ("blended ROAS" → `blended_roas`) and confirm in one sentence. If no reasonable match, ask once.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User specifies <text color="green">idda</text> but tenant hasn't run lift tests
    </lark-td>
    <lark-td>
      **Do not run idda.** Say: "This tenant hasn't run lift tests yet; running with DDA instead — OK?" Proceed with DDA after confirmation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Vague time words ("recently", "lately")
    </lark-td>
    <lark-td>
      Use default (past 7 days) and announce it transparently. **Do not ask for an exact date.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "This month" / "this quarter" mid-period
    </lark-td>
    <lark-td>
      Current window = month-to-date. Comparison window = same-length prior period (not full month). Tell the user the comparison is apples-to-apples.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Yesterday" but data ingestion has 6–24h delay
    </lark-td>
    <lark-td>
      If results return 0 or unusually low, proactively say: "Yesterday's data has a 6–24h ingestion delay — want to look at the day before?" Offer the most recent fully-loaded window.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "today"
    </lark-td>
    <lark-td>
      Same-day data is typically still aggregating. Flag this and offer yesterday/last 7 days as alternatives.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Future date ("next week", "January 2027")
    </lark-td>
    <lark-td>
      Tell the user that period has no data yet; offer the closest past window.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Conflicting fields ("by channel but show me individual campaigns")
    </lark-td>
    <lark-td>
      Ask one clarifying question: "Channel-level totals or campaign-level breakdown?" Don't decide for the user.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Conflicting filters ("only Meta and only Google")
    </lark-td>
    <lark-td>
      Ask one short clarifying question. Don't guess.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Self-contradictory model ("last touch using DDA")
    </lark-td>
    <lark-td>
      Ask which one. Don't pick.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User adds a follow-up filter ("also where spend > 500")
    </lark-td>
    <lark-td>
      Preserve all previous filters and append the new one. Don't restart from scratch.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Filter too strict, 0 rows returned
    </lark-td>
    <lark-td>
      Say "No matches under this filter — want to relax it?" Never let the user think it's a product bug.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Time range falls outside available data (e.g., 2 years requested but tenant only has 6 months)
    </lark-td>
    <lark-td>
      Tell user the data boundary and offer an alternative window. Route to `attribution-edge-routing` for outright unsupported cases.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Channel not integrated for this tenant (e.g., "Show me TikTok ROAS" but TikTok isn't connected)
    </lark-td>
    <lark-td>
      Tell the user in business language ("TikTok isn't connected to this account yet") and list connected channels. Don't fabricate. Route to `attribution-edge-routing`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Amazon / TikTok Shop sales but the marketplace isn't connected
    </lark-td>
    <lark-td>
      Same as above — name the specific limit, offer the path.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Ratio metric returns <text color="green">inf</text> or extreme value
    </lark-td>
    <lark-td>
      Re-check `NULLIF` guard on denominator; never surface `inf` / `999999` / `null` to the user.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User repeats the same out-of-bound request after being told once
    </lark-td>
    <lark-td>
      Acknowledge briefly and offer the next step (e.g. "Integrations" entry) without re-explaining.
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Skip **`dashboard-metrics-list`** and query directly** — guessing field names causes SQL errors or wrong data
- **Skip **`knowledge-base-ask`** before SQL** — `database-query-sql` requires the `ctx` it produces; without it the query fails at execution
- **Use raw warehouse SQL instead of Cube.dev syntax** — `database-query-sql` only accepts Cube.dev SQL
- **Use **`attribution_model`** as a SQL column** — the actual dimension is `attr_model_name`
- **Hard-code **`propertyNames`** for NC dimensions** — they are tenant-specific and case-sensitive; always pass `tenantId` to `dashboard-metrics-list` first
- **Silently switch **`attribution_model` — if user said "last_click", don't replace it with iDDA / DDA / anything else
- **Proactively ask "which attribution model?"** — use the default
- **Run iDDA without lift test data** — tell the user instead and offer DDA
- **Add dimensions the user didn't ask for** — "ROAS by channel" should not become "ROAS by channel by date by country"
- **Drop information** — "by channel for the last 30 days" must not default to 7 days
- **Hard-code today's date** from training data or from earlier in the conversation — always re-fetch
- **Proactively ask "what chart type?"** — the query path doesn't need a chart type
- **Expose DataSet technical names** — user should never see `channel_attribution` / `ads_attribution` / `creative_attribution` / `order_sales` as literal strings
- **Proactively ask "save as dashboard?"** — UI already exposes this
- **Long-form analysis or attribution-model lectures** — query returns data, not diagnosis or education
- **Guess metric aliases and query anyway** — if "POAS" doesn't exist, don't fabricate `profit_roas`
- **Misaligned time-comparison windows** — "this month vs last month" mid-period must not be full month vs full month
- **Wrong aggregation granularity** — "spend > 1000" must not be applied per-day when the user means aggregate
- **Wrong operator precedence in compound filters** — "(A or B) and C" must not become "A or (B and C)"
- **Surface **`**inf**`** / **`**999999**`** / **`**null**`** on ratio metrics** — always guard with `NULLIF`
- **Fabricate data for un-connected platforms** — tell the user the platform isn't connected
## 9. References & related skills

<lark-table rows="6" cols="2" column-widths="249,400">

  <lark-tr>
    <lark-td>
      **Skill**
    </lark-td>
    <lark-td>
      **Relationship**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution-intent-clarification`
    </lark-td>
    <lark-td>
      Upstream: handles ambiguous requests, then routes back to data-query once clarified
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution-anomaly-diagnosis`
    </lark-td>
    <lark-td>
      Downstream: handles "why" questions
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution-model-comparison`
    </lark-td>
    <lark-td>
      Downstream: handles multi-model comparisons
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution-custom-dimension`
    </lark-td>
    <lark-td>
      Downstream: handles business-label dimensions that require Naming Convention config
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution-edge-routing`
    </lark-td>
    <lark-td>
      Downstream: handles requests outside the Attribution domain's capability
    </lark-td>
  </lark-tr>
</lark-table>
