---
name: attribution-anomaly-diagnosis
description: Diagnose "why" questions about attribution anomalies — attribution=0 (no attributed orders) and attribution swings (sudden drops, spikes, or retroactive changes). 5-step diagnostic tree (scope → classify → basic checks → model routing → fallback). Produces internal report + client-facing explanation. Do NOT use for "show me numbers" — that's attribution-data-query.
category: attribution
risk: R0
version: 1.0.0
last-updated: 2026-06-25

references:
- references/basic-checks.md
- references/model-branches.md
- references/fallback-structure.md
- references/scenario-snippets.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/01-scope-lookup.sql
- templates/02-spend-vs-attribution.sql
- templates/03-measurement-readiness.sql
- templates/04-utm-health.sql
- templates/05-click-distribution.sql
- templates/06-dda-vs-anyclick.sql
- templates/07-lift-test-results.sql

examples:
- examples/example-A-meta-roas-drop.md
---

## 1. Purpose

Diagnose **"why" questions** about attribution anomalies — specifically **attribution = 0** (a tactic shows no attributed orders) and **attribution swings** (sudden drops / spikes / retroactive changes to historical numbers). 5-step diagnostic tree → internal report + client-facing explanation.

**Do NOT use this skill for "show me the numbers" queries** — those belong to `attribution-data-query`.

## 2. When to trigger

Trigger when user is asking **why** attribution looks wrong, not just **what** the numbers are:

- "Why did Meta ROAS drop last week?"
- "Why is my [tactic] attribution showing 0?"
- "The numbers I pulled last week are different from this week for the same date range — why?" (**retroactive change**)
- "Something looks wrong with my Google attribution"
- "Why is my new-customer count so low this quarter?"

**Do NOT trigger**:

- User just wants the numbers (no "why") → `attribution-data-query`
- User wants to compare two models on purpose → `attribution-model-comparison`
- Anomaly is on an out-of-scope channel/tenant → `attribution-edge-routing`

## 3. Inputs

| **Field** | **Required?** | **Notes** |
|-|-|-|
| `tenant_id` | Required | Injected by platform-mcp; never appears in SQL filters |
| `ads_platform` | Required | Meta / Google / TikTok / Pinterest / Snap / Amazon Ads... |
| `tactic_name` | Optional | If not given, scan all and pick biggest contributor to the anomaly |
| `sales_platform` | Required | Amazon Store / Shopify / TikTok Shop. Attribution is computed **per sales platform**; wrong combo (Amazon Ads → Shopify) always returns 0 by design. |
| `attribution_model` | Optional | `idda`(32) / `dda`(31) / `last_click`(1) / `first_click`(2) / `any_click`(21). If unspecified, Step 1 scans all to locate which is broken. SQL dimension: `attr_model_name`. |
| `metric` | Required | `roas` / `attr_orders` / `attr_new_customer_orders` / `cac` |
| `anomaly_period` | Required | Window where the user sees the anomaly |
| `baseline_period` | Optional | Comparison window. Default: same-length period immediately before `anomaly_period`. |

**Ask for missing required fields once before running diagnostics.**

## 4. SOP

**Step 0: `knowledge-base-ask` (MANDATORY)** — produces the `ctx` timestamp `database-query-sql` requires. Skipping fails at execution.

**Step 1: Lock the scope** — pinpoint *whose* attribution is broken before diagnosing why. If `attribution_model` is unspecified, compare all models in anomaly vs baseline windows to find which one diverged.

<callout emoji="🛑">
**HARD RULE — copy a template first, then fill placeholders**
BEFORE writing any SQL, **copy from `templates/`**:
- `templates/01-scope-lookup.sql` — Step 1 cross-model comparison
- `templates/02-spend-vs-attribution.sql` — Step 3a spend check
- `templates/03-measurement-readiness.sql` — Step 3c readiness
- `templates/04-utm-health.sql` — Branch A1 UTM
- `templates/05-click-distribution.sql` — Branch A2 click shift
- `templates/06-dda-vs-anyclick.sql` — Branch B1
- `templates/07-lift-test-results.sql` — Branch C3 lift-test recalibration
Copy template, fill placeholders (`{ads_platform}` / `{sales_platform}` / `{baseline_start}` / `{baseline_end}` / `{anomaly_start}` / `{anomaly_end}`). Do NOT write SQL from scratch.
</callout>

After Step 1: **confirm with user** which `ads_platform` + `tactic` + `sales_platform` + `attribution_model` before continuing.

**Step 2: Classify — "attribution = 0" or "swing"?**

| **Type** | **How to detect** | **Next** |
|-|-|-|
| **Attribution = 0** | `attr_orders` / `attr_sales` exactly 0, or tactic row missing | Step 3b → 3c → 3d (config / product-design first) |
| **Attribution swing** | Sharp jump up/down, OR same window returns different numbers on different pull dates | Step 3a (spend check) → Step 5 (model routing) |

**Step 3: Basic checks** — rule out config / product-design causes before model branches. Detail → `references/basic-checks.md`

- **3a** Did spend change? (most "swings" are proportional spend drops)
- **3b** [=0 only] Is the platform × sales-platform combo valid? (Amazon Ads → Amazon Store only)
- **3c** [=0 only] Measurement Readiness
- **3d** [Row missing] Dashboard view & channel config

**Step 4: Attribution-model quick reference**

| **Model** | **model_id** | **Mechanism** |
|-|-|-|
| Last Click | 1 | Last click before conversion gets 100% credit |
| First Click | 2 | First click before conversion gets 100% credit |
| Any Click | 21 | Linear: every click in window gets equal share |
| DDA | 31 | Any Click + handling for Unmatched, VTA, PPS |
| iDDA | 32 | DDA + spend-change weighting + lift-test calibration |

**Step 5: Model-specific branches** — detail → `references/model-branches.md`

- **Branch A** Rule-based (Last Click / First Click / Any Click): UTM health → click distribution shift
- **Branch B** DDA: DDA vs Any Click → VTA → Unmatched → PPS
- **Branch C** iDDA: DDA trend → PPS → lift-test recalibration

<callout emoji="💡">
**Don't take the bait — iDDA retroactive change is NOT a bug**
If the user says "last week it was X, this week the same date range shows Y", this is iDDA's **retro-recalibration mechanism**, not a data issue. When a new lift test is applied, the model rewrites attribution back over the historical window. **Diagnose it (Branch C3), don't treat it as broken.** Lead the client-facing explanation with "this is expected" before the mechanism, otherwise the customer assumes there's a bug.
</callout>

<callout emoji="💡">
**Don't take the bait — if spend dropped proportionally, STOP**
Step 3a is the fastest check for a reason. If spend ↓ X% and `attr_orders` ↓ \~X%, attribution dropping proportionally is **correct**, not an anomaly. Stop here and explain to the client. Do NOT continue down the model branches looking for a more "interesting" cause — most "swings" are just proportional spend changes.
</callout>

**Step 6: Fallback — campaign-structure shift** — if all branches come up clean, check whether campaign mix actually changed (a competing tactic squeezed share, or upper-funnel campaigns flooded delivery). Detail → `references/fallback-structure.md`

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | Required (first) | Cube.dev schema patterns + `ctx` timestamp |
| `dashboard-metrics-list` | Required | Validate field names (e.g., `attr_model_name`, `calibrated_orders`) |
| `database-query-sql` | Required | Execute Cube.dev SQL. Pass `ctx` from `knowledge-base-ask`. Tenant isolation is injected — do not add `tenant_id` filters. |
| `lift-test-list` / `lift-test-get` | Conditional | Branch C / C3 — pull lift test metadata when iDDA retroactive change is suspected |

## 6. Output format

Diagnosis output is **customer-facing** — written for the client (or CSM relaying to client). Three sections only: **What we found / Why it happened / What you can do**. Quantify the change in the first sentence (X → Y, ±%). Pick one root-cause story, not a buffet. Action items concrete. Footer always names attribution model + data-as-of time.

Full template + 7 reusable scenario snippets → `references/output-template.md` + `references/scenario-snippets.md`

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Always copy a verified SQL template from `templates/`** before writing SQL — do not write from scratch
2. **Never skip `knowledge-base-ask` before SQL** — `database-query-sql` requires the `ctx`
3. **Never skip Step 3a (spend check)** — most "swings" are just proportional spend changes; stop there if proportional
4. **Never jump straight into lift-test diagnosis** on a rule-based or DDA anomaly — lift tests only affect iDDA
5. **Never treat iDDA retroactive change as a bug** — it's expected; lead the client explanation with "this is expected"
6. **Never conclude "WM bug"** without verifying against platform-reported orders — if Meta Ads Manager also shows the drop, it's real
7. **Never expose internal terminology** — no `model_id = 32`, no `dws_view_*` table names, no Branch A/B/C labels in customer output
8. **Never add `tenant_id` filters in SQL** — platform-mcp injects it

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Upstream**: `attribution-intent-clarification` (if the "why" question is too vague to scope)
- **Sibling**: `attribution-model-comparison` (user wants two models compared, not a diagnosis), `attribution-data-query` (user just wants numbers, no diagnosis)
- **Route to**: `attribution-edge-routing` (out-of-scope channel/tenant)
