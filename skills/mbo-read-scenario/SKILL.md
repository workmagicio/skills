---
name: mbo-read-scenario
description: Interpret existing MBO scenario results across 5 modes (basic / compare / vs attribution / vs lift test / vs actual). Read-only.
category: mbo
risk: R0
version: 1.0.0
last-updated: 2026-06-17

references:
  - references/mode-basic.md
  - references/mode-compare.md
  - references/mode-vs-attribution.md
  - references/mode-vs-lift-test.md
  - references/mode-vs-actual.md
  - references/playbook.md
  - references/output-templates.md
  - references/term-policy.md
  - references/edge-cases.md
  - references/failure-modes.md
  - ../_common/mbo-concepts.md
---

# mbo-read-scenario

## 1. Purpose

Help users **interpret existing MBO scenario results** across 5 modes. Read-only — for create / modify see `mbo-create-scenario`.

## 2. When to trigger

**Trigger** when user wants to understand existing MBO output:

- "Explain my Q3 MBO scenario" / "Why is MBO cutting Pinterest?"
- "Compare last week's scenario to this one" / "What changed?"
- "Why does MBO show different ROAS than the dashboard?"
- "Lift test showed 1.5x but MBO shows 3x — why?"
- "Why didn't actual results match the forecast?"

**Do NOT trigger**:

- Create / modify / delete scenario → `mbo-create-scenario`
- "How much should I spend on X?" (recommendation) → `mbo-create-scenario` (must run a scenario; never invent a number from list / historical)
- Historical attribution without MBO → `attribution-data-query` / `attribution-anomaly-diagnosis`
- Tenant not provisioned → exit, route to `attribution-edge-routing`

## 3. Inputs

| **Field** | **Required?** | **Notes** |
|-|-|-|
| `mode` | Detected, not asked | basic_read / scenario_compare / mbo_vs_attribution / mbo_vs_lift_test / mbo_vs_actual |
| `scenario_id(s)` | Detected from context | Use scenario **name** in conversation, never the ID |
| `attribution_metric` | mbo_vs_attribution only | ROAS / orders / sales — validate via `dashboard-metrics-list` |
| `lift_test_id` | mbo_vs_lift_test only | Pull via `lift-test-list` |
| `focus_dimension` | Optional | Default = summary across all (top 2-3 moves) |

## 4. SOP

**Step 1: Provisioning check** — `budget-optimizer-list`. Not provisioned → exit + CSM bridge.

**Step 2: Disambiguate vague asks** — "What's my budget?" → 2-step: clarify type (existing scenario / build new / actual spend), then route.

**Step 3: Detect mode**

| **User signal** | **Mode** |
|-|-|
| "Explain X" / "Why does it recommend Y" | **basic_read** |
| "Compare X and Y" / "What changed since last week" | **scenario_compare** |
| "Why does MBO show different ROAS than dashboard / attribution" | **mbo_vs_attribution** |
| "Lift test showed X but MBO shows Y" | **mbo_vs_lift_test** |
| "Actual didn't match forecast" | **mbo_vs_actual** |
| "How much should I spend on X?" | NOT this skill → `mbo-create-scenario` |

Ambiguous → ask once with 2-3 specific options.

**Step 4: Locate scenario(s)** — `budget-optimizer-list`. Use scenario name in conversation. Multi-scenario → list with name + period + strategy + goal. 0 scenarios → guide to create.

**Step 5: `knowledge-base-ask`** (MANDATORY) — for `ctx` timestamp + canonical interpretation language.

**Step 6: Check forecast status**

| `running` / `not_started` | Tell user it's computing, give link, suggest coming back |
|-|-|
| `ready` | Proceed |
| `error` | Surface failure reason; suggest re-run / CSM |

**Step 7: Execute the mode** — load the matching mode reference for detailed SOP:

- basic_read → `references/mode-basic.md`
- scenario_compare → `references/mode-compare.md`
- mbo_vs_attribution → `references/mode-vs-attribution.md`
- mbo_vs_lift_test → `references/mode-vs-lift-test.md`
- mbo_vs_actual → `references/mode-vs-actual.md`

**Step 8: Output** — follow the mode's output template. **Always end with the MBO link.** Templates → `references/output-templates.md`.

## 5. Tools

| **Tool** | **Used by** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | All | ctx + canonical language |
| `budget-optimizer-list` | All | Provisioning + locate scenarios |
| `budget-optimizer-forecast` | basic_read, mbo_vs\_\* | Per-channel forecast + saturation curve (`includeSaturation=true`) |
| `budget-optimizer-compare` | scenario_compare | Diff two scenarios |
| `budget-optimizer-accuracy` | basic_read | Backtesting; caveat if < 70% |
| `dashboard-metrics-list` | mbo_vs_attribution | Validate metric names |
| `database-query-sql` | mbo_vs_attribution, mbo_vs_actual | Pull realized actuals |
| `lift-test-list` | mbo_vs_lift_test | Pull iROAS data |

All tools are R0 (read-only). No system or skill-level confirmation needed.

## 6. Output rules (universal)

- Always end with the MBO link — full curves and detail live there
- Lead with the takeaway, not methodology
- `mbo_vs_*` modes: **lead with "expected to differ"** before showing the gap
- Use scenario **names** in conversation, never IDs
- Use **business language** for diffs ("more aggressive") not parameter syntax ("strategy=aggressive")
- Pick top 2-3 channels worth naming — full table is in MBO
- Numbers with units + % change ("\$50K → \$80K, +60%")
- Flag special states explicitly (zero ref spend, insufficient data) — don't bury
- Cite backtesting accuracy only when < 70% or user asks
- Technical terms: first use needs inline explanation; subsequent uses don't (→ `references/term-policy.md`)

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Never make up a "how much should I spend" number** — recommendation requires running a scenario → `mbo-create-scenario`
2. **Never treat MBO and attribution as if they should match** — explain methodology gap
3. **Never frame MBO vs lift test as "which is right"** — they're complementary; lift test calibrates MBO
4. **Never blame user's own locks** for projection direction — locks are scope, not failure
5. **Never skip baseline / paid media decomposition** when goal direction ≠ projection direction
6. **Never use scenario IDs** in conversation
7. **Never bury special states** (zero ref spend, insufficient data) inside the channel list
8. **Never hard-interpret a forecast that's still running**

Full failure modes (\~40 items) → `references/failure-modes.md`

## 8. Related skills

- **Sibling**: `mbo-create-scenario`, `attribution-data-query`
- **Upstream**: `attribution-intent-clarification` (vague intent)
- **Routes out to**: `attribution-edge-routing` / `attribution-anomaly-diagnosis` / `mbo-create-scenario`
