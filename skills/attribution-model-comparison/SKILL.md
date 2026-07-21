---
name: attribution-model-comparison
description: Pull attribution numbers under multiple attribution models side-by-side and explain why they differ in business language. Default 4-way comparison (idda / dda / last_click / platform_reported). Includes the canonical diff-pattern playbook so the agent doesn't invent reasons.
category: attribution
risk: R0
version: 1.0.0
last-updated: 2026-06-25

references:
- references/model-reference.md
- references/diff-patterns.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/01-multi-model-comparison.sql

examples:
- examples/example-A-meta-multi-model.md
---

## 1. Purpose

Pull attribution numbers under **multiple attribution models side-by-side** and explain **why they differ**, using business-language interpretation grounded in how each model works. Exists because users frequently see different numbers in different places (WorkMagic dashboard vs Meta Ads Manager vs Google Ads) and want to understand the discrepancy.

**This skill is NOT**:

- Diagnosis of why a single model dropped → `attribution-anomaly-diagnosis`
- Judgment of which model is "correct" — give situational guidance only if asked; never push one as the right answer
- A pure data pull — must include the interpretation step

## 2. When to trigger

Trigger when user wants to **compare attribution under different models**:

- "Compare Meta under last_click vs iDDA"
- "Why is WorkMagic showing lower ROAS than Meta Ads Manager?"
- "Show me the difference between data_driven and first_click for all channels"
- "How do my channels look across all attribution models?"
- "Which attribution model should I trust for Meta?" (educational variant — answer + optionally pull data)

**Do NOT trigger**:

- User wants a single model's number → `attribution-data-query`
- User asks "why did X drop?" on a single model → `attribution-anomaly-diagnosis`
- Pure educational ("what is iDDA?") → answer from `knowledge-base-ask` without pulling data

## 3. Inputs

| **Field** | **Required?** | **Default / Notes** |
|-|-|-|
| `models` | Has default | **DTC sales platform**: `[idda, dda, last_click, platform_reported]`  <br/>**Non-DTC sales platform**: `[idda, dda, platform_reported]` (no click-based models — see references/model-reference.md) |
| `ads_platform` | Required | Meta / Google / TikTok / Pinterest / Snap / Amazon Ads / "all" |
| `sales_platform` | Has default | If 1 connected → use it; if multiple → ask once. **Never mix sales platforms in one comparison row.** |
| `metric` | Has default | `attr_orders` + `roas` (most commonly compared). If user specifies one, use it. |
| `dimension` | Has default | By `ads_platform` (channel level). "All channels" / "across channels" → channel level. Named single channel → drill to `tactic_name` or `campaign_name`. |
| `time_range` | Has default | **Past 30 days.** Model comparison needs enough volume to be stable; 7 days is too noisy. |

**Model → model_id mapping + DTC vs non-DTC availability** → `references/model-reference.md`

## 4. SOP

**Step 1: Parse the request**

- Identify which models user wants. 0 specified → use default 4-way (DTC) or 3-way (non-DTC). 1 specified → assume comparison against default set; ask once to confirm. 2+ specified → use exactly what they named.
- Check tenant has `idda` available by probing for `attr_model_name = 'idda'` data via `dashboard-metrics-list` or a quick `database-query-sql` count on model 32 — **not via `lift-test-list`** (a tenant can have ran lift tests historically without having current iDDA data). If no model 32 data, replace `idda` with `dda` in the default set and inform the user.
- Cap at **6 models**; more than that is unreadable.

**Step 2: `knowledge-base-ask` (MANDATORY)**

- How to query multiple models in one SQL via `attr_model_name` / `attr_model_array`
- Mechanism diff between the chosen models (powers Step 6 interpretation)
- Whether the tenant has active lift tests affecting the time window (relevant for iDDA interpretation)

Required for the `ctx` timestamp `database-query-sql` needs.

**Step 3: Validate fields via `dashboard-metrics-list`** — confirm metric names + `attr_model_name` dimension.

**Step 4: Build the SQL**

<callout emoji="🛑">
**HARD RULE — copy the template, then fill placeholders**
Copy `templates/01-multi-model-comparison.sql`. Single `CASE WHEN` query with one branch per model, NOT N separate queries — guarantees comparison is on the same row set (same time range, filters, dedup).
Fill: `{ads_platform}` / `{sales_platform}` / `{start_date}` / `{end_date}`, then add the rows for the model variants the user asked for.
</callout>

**Step 5: Compute deltas**

- For each row, compute `delta = idda − last_click` (or whichever anchor pair makes the user's question clearest)
- Express as absolute and percentage: "Meta: 4.8x → 2.3x (−52%)"
- Sort by absolute delta descending — biggest gaps first

**Step 6: Interpret using diff patterns** — match observed gap to `references/diff-patterns.md` (10 patterns):

<callout emoji="💡">
**Don't take the bait — don't invent reasons for unfamiliar diff patterns**
If the observed gap doesn't match any of the 10 documented patterns, **say so explicitly**: "This differential isn't from a typical pattern; worth checking the lift test calendar / VTA configuration." Do NOT make up a plausible-sounding explanation — that's how bad model intuition spreads.
</callout>

For few channels → 1-2 sentences **per row**. For many channels → cover the 2-3 most striking rows only.

**Step 7: Return — table + interpretation, NO follow-up question**

- Output: side-by-side table + 1-3 sentences of interpretation
- **Don't ask** "want me to also look at X?" — UI exposes drill-down
- **Don't append** "which model should I use?" guidance unless user explicitly asked

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | Required (first) | Model mechanism explanations + Cube.dev schema patterns + `ctx` timestamp. **This skill especially depends on KB for interpretation** — never invent model behavior. |
| `dashboard-metrics-list` | Required | Validate `attr_orders`, `attr_roas`, `attr_model_name` and other field names |
| `database-query-sql` | Required | Execute the multi-model CASE WHEN SQL in one shot |
| `lift-test-list` | Conditional | Optional context for grounding the dda-vs-idda interpretation (e.g., "iDDA dropped after this lift test"). **Do NOT use to check iDDA availability** — probe model 32 data via `dashboard-metrics-list` instead. |

## 6. Output format

One message, two parts: **side-by-side table → 1-3 sentence interpretation**. No question at the end.

- Table first, interpretation second
- Always show **which sales platform** + **time range** (one line above table)
- Sort by absolute delta descending if comparing multiple channels
- Highlight the largest gap explicitly
- One paragraph of interpretation max (\~3 sentences); link to `attribution-anomaly-diagnosis` if user wants drill-down

Full output template with example → `references/output-template.md`

<callout emoji="💡">
**Don't take the bait — never push one model as "correct"**
If user asks "which model should I trust?", do NOT answer "iDDA is the right one" or anything similar. Give **situational guidance**:
- **For budget / incremental impact decisions** → iDDA (or dda if no lift tests)
- **For real-time touchpoint-based performance** (what each touch just did) → last_click / first_click
- **For reconciling against the platform's own dashboard** (Meta Ads Manager, Google Ads UI) → platform_reported (that IS what the platform reports)
- **For understanding the discovery path** specifically → first_click
The user picks based on their decision context. Pushing one as the answer presumes the user's question.
</callout>

## 7. CRITICAL rules (top 9 — full list in references/failure-modes.md)

1. **Always copy the template SQL** (`templates/01-multi-model-comparison.sql`) — never run N separate queries; they can drift on filters / dedup and produce non-comparable numbers
2. **Never compare click-based models on a non-DTC sales platform** — last_click / first_click / any_click are NOT valid on Amazon Store and similar; only iDDA / DDA / platform_reported are. Dropping click models silently is also wrong — tell user once.
3. **Never mix multiple sales platforms in one comparison row** — attribution is per sales platform AND valid model set differs. Run separately per sales platform.
4. **Never skip `knowledge-base-ask`** before SQL — `ctx` required
5. **Never invent a reason for a diff that doesn't match a known pattern** — say "this isn't a typical pattern" instead
6. **Never push one model as "the right answer"** — give situational guidance only when asked
7. **Never default to a 7-day window** — too noisy; use 30 days
8. **Never compare iDDA when no lift tests exist** — surface missing-lift-test and use dda instead
9. **Never expose internal terminology** — use business-language model names (Platform-reported, Last Click, DDA, iDDA), never the raw dimension / DataSet identifiers `attr_model_name` / `channel_attribution` / `ads_attribution` / `model_id` as literal strings in the answer. A leaked identifier is a customer-facing defect.

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Upstream**: `attribution-intent-clarification` (when "compare attribution" is too vague — which models? which channel?)
- **Sibling**: `attribution-data-query` (single-model number), `attribution-anomaly-diagnosis` (why a single model changed)
- **Downstream**: `attribution-anomaly-diagnosis` (if comparison surfaces a one-off anomaly — e.g., iDDA fell off a cliff because a new lift test was applied)
- **Out of scope**: `attribution-edge-routing` (MMM, forecasting, non-WM attribution products)
