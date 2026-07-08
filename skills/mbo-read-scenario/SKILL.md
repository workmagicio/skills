---
name: mbo-read-scenario
description: Interpret existing MBO scenario results across five modes — basic_read (single scenario), scenario_compare (diff two), mbo_vs_attribution / mbo_vs_lift_test / mbo_vs_actual (reconcile MBO against other measurement sources). Routes "how much should I spend" to mbo-create-scenario; this skill is read-only.
category: mbo
risk: R0
version: 1.0.0
last-updated: 2026-06-25

references:
  - references/inputs-detail.md
  - references/mode-detection.md
  - references/basic-read-mode.md
  - references/scenario-compare-mode.md
  - references/mbo-vs-attribution-mode.md
  - references/mbo-vs-lift-test-mode.md
  - references/mbo-vs-actual-mode.md
  - references/interpretation-playbook.md
  - references/term-usage.md
  - references/output-format.md
  - references/edge-cases.md
  - references/failure-modes.md
  - references/key-concepts.md

templates:
  - templates/basic-read-output.md
  - templates/scenario-compare-output.md
  - templates/mbo-vs-attribution-output.md
  - templates/mbo-vs-lift-test-output.md

examples:
  - examples/example-goal-vs-projection-mismatch.md
---

## 1. Purpose

Help users **interpret existing MBO scenario results** — five modes:

1. **basic_read** — explain a single scenario's recommended allocation: direction / reason / magnitude / impact for the top channels, plus marginal-vs-average ROAS, baseline vs paid media, special states
2. **scenario_compare** — diff two scenarios and explain why recommendations shifted (input changes vs underlying-data drift)
3. **mbo_vs_attribution** — when user asks "why is MBO showing different ROAS than my dashboard?", pull both numbers, explain the methodology gap, advise against direct comparison
4. **mbo_vs_lift_test** — when user asks "lift test showed 1.5x but MBO shows 3x marginal ROAS, which is right?", explain that lift test calibrates MBO and these measure different things (incremental vs marginal)
5. **mbo_vs_actual** — when user asks "why didn't actual results match the forecast?", compare forecast vs realized actuals and diagnose at a high level

Different from `mbo-create-scenario` (creates / modifies a scenario) and from `attribution-anomaly-diagnosis` (diagnoses historical attribution swings). This skill is purely interpretation — no writes.

## 2. When to trigger

Trigger when the user wants to **understand existing MBO results**. Common phrasings:

- "Explain my Q3 MBO scenario" / "Walk me through what's changing in this scenario"
- "Why is MBO recommending I cut Pinterest?" / "Why should Meta get more budget?"
- "What changed between the scenario I ran last week and this week?"
- "What's the biggest move the model is making?"
- "Why does MBO show Meta ROAS as 2.1x when my dashboard says 3.5x?"
- "My lift test showed 1.5x but MBO shows marginal ROAS of 3x — why?"
- "Why didn't actual results match the forecast?"

**Do NOT trigger** when:

- User wants to **create** a new scenario → `mbo-create-scenario`
- **"How much should I spend on X?"** — this is a recommendation question; the only honest answer requires running a scenario → `mbo-create-scenario`. Don't use historical or list data to make up a number.
- User wants to **modify** an existing scenario (rename, change inputs, delete) → `mbo-create-scenario` (modify is part of that skill)
- User wants why historical attribution moved (no MBO involved) → `attribution-anomaly-diagnosis`
- User wants historical attribution numbers without MBO context → `attribution-data-query`
- Tenant not provisioned for MBO → exit, route to `attribution-edge-routing`

## 3. Inputs

| **Field** | **Required?** | **Description / default** |
|-|-|-|
| `mode` | Detected, not asked | One of: **basic_read** / **scenario_compare** / **mbo_vs_attribution** / **mbo_vs_lift_test** / **mbo_vs_actual**. Detection rules in mode-detection.md. |
| `scenario_id` | Required for basic_read / mbo_vs\_\* | Which scenario to read. Multi-scenario tenant → use scenario name in conversation, never the ID. 1 scenario → use it (tell user). 0 scenarios → tell user, guide to create. |
| `scenario_ids[2]` | Required for scenario_compare | Two scenarios. Cap at 2 — more is unreadable. |
| `attribution_metric` | Required for mbo_vs_attribution | Which attribution metric user is comparing against (ROAS / orders / sales). Validate via `dashboard-metrics-list`. |
| `lift_test_id` | Required for mbo_vs_lift_test | Which lift test to reconcile against. Pull via `lift-test-list`. |
| `focus_dimension` | Optional | Zoom on a specific channel / tactic. Default: summary across all (top 2-3 moves). |

Full per-field semantics live in references/inputs-detail.md.

## 4. SOP

### Step 1: Check provisioning

Call `budget-optimizer-list`. Not provisioned → exit with CSM bridge, don't attempt to interpret.

### Step 2: Handle ambiguous "show me my budget" asks (2-step disambiguation)

"What's my budget?" / "Show me my budget" / "Check my budget for Q3" — these are ambiguous. Don't silently pick.

1. **Clarify type**: give 2-4 options that match user's phrasing context:

   - "Existing scenario recommendations (you have N saved)" — if list has scenarios
   - "Build a new scenario for [period]" — route to create
   - "Actual historical spend on the attribution dashboard" — route to data-query
2. **If user picks "existing"** → continue with mode detection. If "build new" → route to `mbo-create-scenario`. If "actual" → route to `attribution-data-query`.

### Step 3: Detect mode

- Single scenario reference / "explain X" / "why does it recommend Y" → **basic_read**
- Two scenarios named / "compare X and Y" / "what changed since last week" → **scenario_compare**
- "Why is MBO different from [dashboard / MTA / attribution / iDDA]" → **mbo_vs_attribution**
- "Lift test showed X but MBO shows Y" → **mbo_vs_lift_test**
- "Actual didn't match forecast" / "why didn't we hit predicted sales" → **mbo_vs_actual**
- "How much should I spend on X?" → not this skill; route to `mbo-create-scenario`
- Ambiguous → ask once with 2-3 specific options

### Step 4: Locate scenario(s)

- `budget-optimizer-list` to find scenarios
- **1 scenario** matching context → use it, tell user which one
- **Multiple scenarios** → list them with **name + key attributes** (period, strategy, goal) for user to choose; never list scenario IDs
- **0 scenarios** → tell user none exist, guide to create flow
- If user named a scenario precisely ("my Q3 conservative plan") → use it, don't re-ask

### Step 5: Consult knowledge-base-ask (MANDATORY)

Required for `ctx` timestamp (any SQL) + canonical interpretation language.

### Step 6: Pull data and check forecast status

Before interpreting, always check the forecast state:

| **State** | **Action** |
|-|-|
| status = `running` / `not_started` | Don't interpret stale data. Tell user the forecast is still computing, give the link, suggest coming back when ready. |
| status = `ready` | Proceed with interpretation. |
| status = `error` | Tell user the forecast failed, surface the failure reason if available, suggest re-running or CSM. |

### Step 7: Branch by mode

| **Mode** | **Reference** |
|-|-|
| **basic_read** — 4-dimensional interpretation (direction / reason / magnitude / impact) + goal-vs-projection sanity check | basic-read-mode.md |
| **scenario_compare** — diff two scenarios | scenario-compare-mode.md |
| **mbo_vs_attribution** — reconcile MBO vs attribution dashboard | mbo-vs-attribution-mode.md |
| **mbo_vs_lift_test** — reconcile MBO vs lift test iROAS | mbo-vs-lift-test-mode.md |
| **mbo_vs_actual** — reconcile forecast vs realized actuals | mbo-vs-actual-mode.md |

## 5. Tools used

| **Tool** | **Required?** | **System risk** | **Purpose** |
|-|-|-|-|
| `knowledge-base-ask` | Required (first) | R0 | Canonical interpretation language + `ctx` timestamp |
| `budget-optimizer-list` | Required | R0 | Provisioning check + locate scenarios |
| `budget-optimizer-forecast` | Required (basic_read, mbo_vs\_\*) | R0 | Per-channel forecast + saturation curve data (pass `includeSaturation=true`) |
| `budget-optimizer-compare` | Required (scenario_compare) | R0 | Diff two scenarios programmatically |
| `budget-optimizer-accuracy` | Required (basic_read) | R0 | Backtesting accuracy; caveat if < 70% |
| `budget-optimizer-reference-data` | Optional | R0 | Ready-platform context + baseline spend (useful when explaining excluded channels) |
| `dashboard-metrics-list` | Required (mbo_vs_attribution) | R0 | Validate attribution metric names |
| `database-query-sql` | Required (mbo_vs_attribution, mbo_vs_actual) | R0 | Pull attribution actuals / realized outcome for the scenario period |
| `lift-test-list` | Required (mbo_vs_lift_test) | R0 | Pull iROAS data + identify recent calibrations (also useful in scenario_compare to explain curve shifts) |

## 6. Output format

Structure depends on mode. **Always end with the MBO link.**

Per-mode output templates:

- templates/basic-read-output.md
- templates/scenario-compare-output.md
- templates/mbo-vs-attribution-output.md
- templates/mbo-vs-lift-test-output.md

Output rules across all modes live in references/output-format.md.

## 7. CRITICAL rules (top 8)

1. **For mbo_vs\_\* modes: lead with "expected to differ"** BEFORE showing the gap. Leading with the gap makes user think there's a bug.
2. **Goal-vs-projection mismatch → baseline / paid media decomposition first.** If projected total moves opposite to user's goal (e.g., maximize sales but total sales projected lower), the explanation is almost always baseline vs paid media decomposition — NOT "more efficient channel mix". Skipping decomposition produces a misleading answer.
3. **Don't blame user's own budget locks for the projection outcome.** Locks are intent, not a flaw. Saying "because you locked X, Y, Z, this isn't the best plan overall" is condescending. Run the baseline decomposition instead.
4. **Never frame MBO vs lift test as "which is right".** Lift test calibrates MBO; they measure different things (iROAS vs marginal ROAS) and are complementary.
5. **"How much should I spend on X?" routes to `mbo-create-scenario`.** Never make up a number from list / historical.
6. **Always check forecast status** before interpreting. Don't hard-interpret a forecast that's `running` or `error`.
7. **Use scenario names, never IDs** in conversation.
8. **Always end with the MBO link.** Saturation curves and full detail live in MBO.

Full failure-mode catalog lives in references/failure-modes.md. Edge cases & routing live in references/edge-cases.md. Canonical interpretation language (playbook patterns) lives in references/interpretation-playbook.md. Term usage rules in references/term-usage.md.

## 8. Output artifacts

- **basic_read** — single scenario reading per templates/basic-read-output.md
- **scenario_compare** — diff table + decision-oriented summary per templates/scenario-compare-output.md
- **mbo_vs_attribution** — methodology-gap explanation per templates/mbo-vs-attribution-output.md
- **mbo_vs_lift_test** — complementarity explanation per templates/mbo-vs-lift-test-output.md

## 9. Related skills

- **Sibling**: `mbo-create-scenario` (build / modify scenarios), `attribution-data-query` (historical numbers without MBO)
- **Upstream**: `attribution-intent-clarification` (if ask is too vague to detect mode even after 2-step)
- **Routes out to**: `attribution-edge-routing` (not provisioned), `attribution-anomaly-diagnosis` (if user wanted historical attribution diagnosis not MBO interpretation), `mbo-create-scenario` ("how much should I spend?" + modify + create intents)
- **Worked example**: examples/example-goal-vs-projection-mismatch.md — maximize-sales but total projected lower (baseline decomposition case)

**Risk class**: all tools used are R0. No system-level or skill-level confirmation needed.

**Reference docs**: [Media Budget Optimizer knowledge base](https://mc10lxkn1j7.sg.larksuite.com/wiki/R59swl3L2iW4BNkGq2Kle3jdgeb) — Reading Your Results + FAQ.
