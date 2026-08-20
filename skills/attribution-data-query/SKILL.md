---
name: attribution-data-query
description: Translate explicit data requests into Cube.dev SQL and return results. Default skill for query-type asks in the Attribution domain. No estimation, no fabrication, no proactive dashboards.
category: attribution
risk: R0
version: 1.3.0
last-updated: 2026-08-19

references:
  - references/time-range-resolution.md
  - references/attribution-model.md
  - references/sales-platform-scope.md
  - references/granularity-default.md
  - references/sql-examples.md
  - references/edge-cases.md
  - references/failure-modes.md

templates:
  - templates/01-channel-roas.sql
  - templates/02-top-n-campaigns.sql
  - templates/03-period-over-period.sql
  - templates/04-creative-headlines.sql
  - templates/05-actual-store-sales.sql

examples:
  - examples/example-A-meta-roas-last-week.md
---

# attribution-data-query

## 1. Purpose

Translate the user's explicit data request into a precise Cube.dev SQL query and return results. **No estimation, no fabrication, no proactive dashboard creation.** This is the default skill for all query-type requests in the Attribution domain.

## 2. When to trigger

**Trigger condition**: the user's request explicitly states (or strongly implies) **most** of:

- A specific metric (ROAS, spend, new_customers, conversion_rate, etc.)
- A specific dimension (channel, campaign, creative, sales_channel)
- A time range (explicit or common phrasing like "last week", "last 30 days")
- Optional: filters, attribution model, sort order

**Examples that should trigger**:

- "Show me ROAS by channel for the last 30 days"
- "Which campaigns spent the most last week?"
- "Pull total sales of TikTok Shop for last week"

**Examples that should NOT trigger — route to another skill instead**:

| Input pattern | Route to |
|---|---|
| Ambiguous request ("Show me my numbers" / "How is Meta doing") | `attribution-intent-clarification` |
| "Why" question ("Why did sales drop?") | `attribution-anomaly-diagnosis` |
| Comparing 2+ attribution models ("Compare iDDA vs last_click") | `attribution-model-comparison` |
| Business-label dimension ("by region" / "by audience" / "by brand") | `attribution-custom-dimension` |
| "Create / build a dashboard" | build a live-data dashboard **artifact** — the `dashboard` skill (an html/react live view), not a native platform dashboard |
| "Send me a weekly/daily report" | `attribution-weekly-report` |

## 3. Inputs

**Fields to parse from user input**:

| Field | Required? | Description / default |
|---|---|---|
| dataset | Required | One of: channel_attribution (by channel) / ads_attribution (by campaign/ad) / creative_attribution (by creative) / order_sales (raw orders, no attribution split). Infer from user phrasing; never ask user to pick a DataSet name. |
| metric | Required | Extract from user input. Always call dashboard-metrics-list to validate the field name before using it. Never guess. |
| dimension | Required | Validate against dashboard-metrics-list. For ads_attribution / creative_attribution with NC dimensions (Product Group, Asset Type, Creator name, etc.), pass tenantId to fan out tenant-specific propertyNames. |
| time_range | Has default | Default: past 7 days. When user doesn't specify, use the default and inform them in one sentence ("Defaulting to the past 7 days — let me know if you want a different window"). Do not ask back. |
| attribution_model | Has default | Resolved per §3.2. Filter via WHERE attr_model_name = '<resolved>'. |
| sales_platform_scope | Has default | **Default: all sales platforms** — use `attr_all_sales` / `attr_all_orders`, NOT Shopify-only. Use `attr_shopify_sales` only when the user explicitly asks for Shopify / DTC alone. Per-platform breakdown via the dedicated measures → `references/sales-platform-scope.md`. |
| filters | Optional | Extract from input ("only Meta", "ROAS > 2", "exclude test"). |
| order_by / limit | Optional | "top 10" / "most" implies sorting — order descending by the implied key. |

**Default resolution rules** (see references for details):

- **Time range**: always re-fetch today's date silently; comparison windows must be length-aligned → `references/time-range-resolution.md`
- **Granularity**: auto-pick by window size, do not ask → `references/granularity-default.md`

## 4. SOP

**Step 1: Parse the request**

Map natural language into the input fields. Resolve silently: today's date (re-fetch — never hard-code) → time window → attribution model → sales-platform scope (default all platforms, `attr_all_*`) → DataSet → dimensions → metrics.

**Step 2: Pick the DataSet (by dimension)**

- By channel → `channel_attribution`
- By campaign / ad set / ad → `ads_attribution`
- By creative / asset → `creative_attribution`
- Pure sales / orders / no channel split → `order_sales`
- "campaigns spent the most" → **not** channel; use `ads_attribution`
- `lift_test_result` exists but belongs to lift-test domain — route there if user asks about lift test results

**Step 3: `database-query-ask` first (MANDATORY)**

Ask `database-query-ask` about the warehouse's Cube.dev schema patterns. `database-query-run` requires the `ctx` timestamp it produces. **Skipping fails execution.**

**Step 4: Validate fields via `dashboard-metrics-list`**

- Confirm metric / dimension field names exist on the chosen DataSet
- For aliases ("POAS", "return on ad spend") → find closest match. If none, ask once.
- **For NC dimensions on `ads_attribution` / `creative_attribution`**: pass `tenantId` to fan out tenant-specific propertyNames (e.g., `Product Group`, `Asset Type`). Use propertyName **exactly as returned (case-sensitive)**.

**Step 5: Construct & execute SQL via `database-query-run`**

> 🛑 **HARD RULE — copy a template first, then fill placeholders**
>
> BEFORE writing any SQL, you **MUST** match the user's query pattern to one of the 5 templates in `templates/`:
> - `templates/01-channel-roas.sql` — single-platform channel-level ROAS
> - `templates/02-top-n-campaigns.sql` — Top-N campaigns by metric
> - `templates/03-period-over-period.sql` — WoW / MoM comparison (2 separate queries)
> - `templates/04-creative-headlines.sql` — creative-level (JSON-array headlines)
> - `templates/05-actual-store-sales.sql` — actual store sales (NOT attribution)
>
> **Copy the template, then fill placeholders** (`<tenant_id>` / `<attr_model>` / `<platform>` / `<start_date>` / `<end_date>`). Do NOT write SQL from scratch — past agents have produced wrong queries (case-sensitive platform names, missing `HAVING SUM(ad_spend) > 0`, average-of-ratios ROAS, window functions Cube rejects).
>
> If none of the 5 templates fit — pause and tell the user what's requested is outside the verified set, ask CSM, do NOT improvise. Pitfalls + when-to-use guidance for each template → `references/sql-examples.md`. Full worked walkthrough → `examples/example-A-meta-roas-last-week.md`.

> 💡 **Don't take the bait — never average ROAS across rows**
>
> Tempting design: when comparing campaigns / days, compute ROAS per row first, then average. **Don't.** That's "average of ratios" and is mathematically wrong — a \$64-spend campaign with one lucky order produces 122.76x ROAS that buries real top performers (vs the correct ratio-of-sums 3.44x).
>
> **Always** `SUM(sales) / NULLIF(SUM(spend), 0)` at the final aggregation level. Same applies to CAC, ROAS, conversion rate — any ratio metric.

- Cube.dev SQL syntax only (no raw warehouse SQL, no CTE / UNION / window functions)
- Pass the `ctx` timestamp from Step 3 (ISO 8601)
- WHERE clauses must reflect user filter intent (incl. `NOT LIKE` / `NOT IN`)
- Aggregation granularity must match user intent ("spend > 1000" defaults to total per campaign, not per-day)
- Percentages → decimals ("> 5%" = 0.05)
- Model filter uses `attr_model_name` dimension
- Time-comparison → 2 separate queries with length-aligned windows (Cube SQL has no UNION / CTE / LAG)
- **5 verified SQL templates** covering channel ROAS / Top-N campaigns / WoW comparison / creative headlines / actual store sales → `references/sql-examples.md`. **Required reading before writing SQL.**

**Step 6: Return results**

- Small (≤ 20 rows): table
- Large: top N summary
- One-sentence brief reading (what's high / low). **No long-form analysis.**
- **Transparent defaults**: state the time window in business language; state attribution model only if it differs from tenant default or user specified; state granularity only if surprising
- **Don't proactively ask** "save as dashboard?" — UI exposes that

## 5. Tools used

| Tool | Required? | Purpose |
|---|---|---|
| database-query-ask | Required (first) | Consult Cube.dev schema patterns before SQL. Produces the ctx timestamp that database-query-run requires. Skipping fails at SQL execution. |
| dashboard-metrics-list | Required | Validate metric / dimension field names exist on the chosen DataSet. For ads_attribution / creative_attribution with NC dimensions, pass tenantId to fan out tenant-specific propertyNames. Call before every query — never skip. |
| database-query-run | Required | Execute the Cube.dev SQL query. Pass the ctx from database-query-ask. |
| tenant-list | Optional | Look up tenantId when needed to fan out NC dimensions on dashboard-metrics-list. |

## 6. Output format

- **Simple pull → chat; report-shaped → a live artifact.** A single number / single
  metric / tiny table = answer in chat (below). But if the result is a **breakdown, a
  trend over time, multi-channel / multi-platform, or a comparison** — anything a
  person would screenshot and send to their boss — build it as a **live-data dashboard
  artifact** (the `dashboard` skill: an html/react view wired to the data), not a wall
  of table dumped in chat. Carry the same measurement identity (sales-platform scope +
  model) onto the artifact. When in doubt between the two, a clean chat table is fine —
  don't force an artifact for a genuinely simple ask.
- **Table first** (for the chat path): small result sets (≤ 20 rows) shown directly
- **Top-N summary**: large sets → top 10 / 20 with "N total rows" note
- **One-line reading**: what's high / low (≤ 2 sentences)
- **Transparent defaults**: state which defaults applied (window, model, sales-platform scope)
- **Cite the data source** in business language at end — **sales-platform scope + attribution model** + data-as-of window (e.g. "Source: all sales platforms, data-driven attribution, last 7 days ending Jul 20"). **State the sales-platform scope every time**, the same way the model is stated — a sales / ROAS figure is ambiguous without it (all-platform vs Shopify-only read very differently) → `references/sales-platform-scope.md`. **Never print the raw DataSet technical name** (`channel_attribution` / `ads_attribution` / `creative_attribution` / `order_sales`) — see rule 8 below; those are internal identifiers, not customer-facing labels
- **Don't pad with a "save as dashboard?" prompt** — a report-shaped result just
  becomes the live artifact above; a simple one stays in chat
- **No long analysis** — that's `attribution-anomaly-diagnosis`

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Always match the query to a verified SQL template in** `references/sql-examples.md` **BEFORE writing SQL** — do not write SQL from scratch. The 5 templates cover channel ROAS / Top-N campaigns / WoW comparison / creative headlines / actual store sales. If none fit, pause and ask CSM; do not improvise.
2. **Never skip `database-query-ask` before SQL** — `database-query-run` requires the `ctx` it produces; will fail at execution
3. **Never skip `dashboard-metrics-list`** — guessing field names causes SQL errors / wrong data
4. **Never use raw warehouse SQL** — Cube.dev syntax only (no CTE, UNION, subqueries, LAG, window functions)
5. **Never silently switch the attribution model** — if user said "last_click", don't replace it. Never lecture.
6. **Never run iDDA without lift test data** — tell user, offer DDA, then proceed after confirm
7. **Never hard-code today's date** from training data or earlier in conversation — always re-fetch
8. **Never expose DataSet technical names** (`channel_attribution` / `ads_attribution` etc.) to user
9. **Never compare full month vs full month mid-period** — use MTD vs same-day prior MTD; misaligned windows make ~50% drops appear that aren't real

## 8. Edge cases & routing

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

| Skill | Relationship |
|---|---|
| attribution-intent-clarification | Upstream: handles ambiguous requests, then routes back to data-query once clarified |
| attribution-anomaly-diagnosis | Downstream: handles "why" questions |
| attribution-model-comparison | Downstream: handles multi-model comparisons |
| attribution-custom-dimension | Downstream: handles business-label dimensions that require Naming Convention config |
| attribution-edge-routing | Downstream: handles requests outside the Attribution domain's capability |
