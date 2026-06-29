---
name: attribution-custom-report
description: Turn a user's data request into a saved platform dashboard — discover available metrics via dashboard-metrics-list, preview each section inline so the user can confirm or iterate, then create atomically with undo support. Single-file skill — content is short enough that SKILL.md is the only file.
category: attribution
risk: R1
version: 1.0.0
last-updated: 2026-06-25
---

**Description:** Turn a user's data request into a saved platform dashboard — by discovering available metrics, previewing each section inline so the user can confirm or iterate, then creating atomically with undo support.

## Goal

Turn a user's data request into a saved platform dashboard — by discovering available metrics, previewing each section inline so the user can confirm or iterate, then creating atomically with undo support.

## Dataset Routing

Pick the dataset based on the user's intent. When in doubt, use `channel_attribution`.

<sheet sheet-id="JBszrO" token="VZjnsa8LxhZ4rptUsaDlexHGgfc"></sheet>

If the user wants metrics from multiple datasets, preview one section per dataset, then create them together in a single `wms_dashboard-create` call.

## Steps

### Step 1: Clarify Requirements (at most one round)

Confirm:

- **Metrics**: what numbers to show (ROAS, CPA, spend, revenue…)
- **Dimensions**: how to break it down (by channel, by date, by campaign…)
- **Time range**: default `-30d` if not specified
- **Goal**: new dashboard, or add a section to an existing one

Do not ask about attribution model unless the user raises it — it will auto-apply the tenant default.

### Step 2: Discover Valid Fields

Call `wms_dashboard-metrics-list(dataSet=<chosen>)`. From the response, find:

- The exact `field` names matching the user's requested metrics
- The exact `field` names for the dimensions
- Any relevant filter fields (channel names, campaign status…)

Never invent field names. Only use fields returned by `wms_dashboard-metrics-list`.

### Step 3: Preview Each Section

**Always preview before creating.** Emit one fenced code block per section with language `dashboard_section_preview` and a JSON body. The frontend intercepts the fence and renders an inline preview card. If the JSON is malformed it falls back to a regular code block — so always emit valid JSON.

Example:

> Here's a draft section for the ROAS trend you described:
> 
> ```Plain Text
> {
>   "name": "Daily ROAS by Channel",
>   "chartType": "line",
>   "dataSet": "channel_attribution",
>   "metrics": ["roas"],
>   "dimensions": ["date", "channel"],
>   "dateType": "live",
>   "dateRange": "-30d"
> }
> ```
> 
> Want a different metric, dimension, or time range? Or should I save it?

**Preview JSON schema** (strict subset of `wms_dashboard-section-create`, forwardable verbatim at commit):

<sheet sheet-id="DVPj6X" token="VZjnsa8LxhZ4rptUsaDlexHGgfc"></sheet>

**Chart type selection guide:**

- Trend over time → `line`
- Comparison across categories (channel, campaign) → `bar`
- Share / proportion → `pie`
- Detail rows / export → `table`
- Single KPI callout → `numeric`

**Preview conventions:**

- Always include a one-sentence summary above each fence — the conversation should read naturally without the card.
- Always invite iteration below the fence ("let me know if you want to adjust X / save it / add another section").
- Multiple sections → multiple fences in one reply, in display order.
- Do not wrap the fence in a blockquote or nested list — fence must be at the top level of the message.
- One fence = one card. Never put two JSON objects inside one fence.

### Step 4: Iterate on Preview

When the user pushes back ("change to bar chart", "add CPA", "switch to last 14 days"), emit a **new** preview fence with the updated spec — don't paraphrase the change in prose. The visual card is the source of truth during iteration; the user shouldn't have to read JSON to know what changed.

### Step 5: Create After Explicit Confirmation

Only after the user says "save it" / "create" / equivalent:

**New dashboard** — use `wms_dashboard-create` with all confirmed sections in one call:

```JSON
{
  "dashboardName": "<name>",
  "dateRange": "-30d",
  "sections": [
    {
      "sectionName": "<name>",
      "chartType": "line",
      "dataSet": "channel_attribution",
      "metrics": ["roas", "spend"],
      "dimensions": ["date"]
    }
  ]
}
```

**Add to existing dashboard** — first call `wms_dashboard-list` to find the target dashboard ID, then use `wms_dashboard-section-create` with `dashboardId` for each confirmed section.

Reuse the preview JSON verbatim — preview schema is a strict subset of the create schema.

### Step 6: Deliver the Result

After creation succeeds, present the `dashboardUrl` prominently so the user can click directly to view their new dashboard:

> Dashboard created: [**View Dashboard →**](https://platform-preview.workmagic.io/agents/embeds/dashboardUrl)
> 
> You have 60 seconds to undo this action if needed.

## Constraints

- Always preview before creating — never go straight from clarification to `wms_dashboard-create`.
- Always call `wms_dashboard-metrics-list` before previewing — never guess field names.
- `naming_convention` is a placeholder; pass the actual property name (e.g., `channel`) as the dimension field.
- Attribution datasets automatically receive an `attr_model_name` filter — do not add it manually.
- `filters[].operator` must match the field's `filterBehavior` from the metrics library.
- Creation is R2: shows a diff card with 60-second undo.
