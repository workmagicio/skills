---
name: mbo-explain
description: Explain a saved MBO scenario's recommendation for CS and Strategy review — why Optimized differs from Reference, why a target needs more or less spend, why a row moved — with every reason backed by a figure from the scenario output. Read-only; building or editing a scenario goes to mbo-create-scenario.
category: mbo
risk: R0
version: 1.0.0
last-updated: 2026-11-18

references:
  - references/data-map.md
  - references/queries.md
  - references/sop-detail.md
  - references/interpretation-playbook.md
  - references/output-templates.md
  - references/reconciliation.md
  - references/failure-modes.md
  - references/edge-cases.md

examples:
  - examples/example-fixed-budget-sales-drop.md
---

## 1. Purpose

Given an MBO scenario ID or link, resolve the exact saved run, retrieve its inputs and projections, diagnose the result, then explain the recommendation with supporting numbers for CS and Strategy review. Every reason is backed by a figure from the scenario output; anything the data can't support is named as undiagnosed, not filled in. Read-only: the skill never creates, changes or re-runs a scenario.

## 2. When to trigger

**Trigger condition**: a request to explain, justify or sanity-check a saved MBO scenario, its total result, or one of its row moves.

**Examples that trigger this skill**:

- "Explain scenario 'Q4 max sales flat budget' for [client]"
- "Why is Optimized sales lower than Reference at the same spend?"
- "The 4x ROAS target needs $40k more than current spend — why?"
- "Why did MBO cut Meta Prospecting when its ROAS is the highest?"
- "Why is MBO's Meta ROAS different from the attribution dashboard / the lift test?"
- "This scenario changed since last month — what moved?"

**Do NOT trigger — route out**:

| Input pattern | Route to |
|---|---|
| Build / edit / re-run a scenario, "how much should I spend on X?" | MBO create flow (CSM runs it in product or via budget-optimizer-create) |
| Lift-test result on its own | lift-test-readout / wm-cs:2-cell-lift-deck |
| "How does MMM / saturation / calibration work?" with no scenario | methodology-faq |
| "Is the MMM model wrong?" with no specific scenario | DS |

## 3. Inputs

| Field | Required? | Notes |
|---|---|---|
| Tenant | Required | ID, or client name resolved with tenant-list |
| Scenario reference | Required | ID, link, or name. A link is matched against each scenario's url, never parsed by guesswork |
| Question focus | Has default | Default: full explanation. Or one question (a row, a number). One-question runs still do the portfolio check briefly |
| Comparison target | Optional | Another saved scenario, an attribution period, a lift test, actual results → references/reconciliation.md |

Everything else (goal, outcome, sales scope, level, dates, budget, strategy, locks, bounds) comes from the scenario itself — never asked. Field-to-tool map → references/data-map.md.

## 4. SOP

1. **Resolve the scenario.**  budget-optimizer-list for the tenant to match by id, url or name; then read the scenario row from platform.ads_budget_optimizer_scenario. Write the echo as visible text in the reply. First line: the scenario link, the url field from budget-optimizer-list quoted verbatim (every saved scenario has one; never build a link yourself). Then name, period dates, goal and target, outcome and sales scope, level, budget input in dollars, number of rows), then ask. Never send the confirmation question on its own: the CSM can't confirm what they can't see. Exception: if the request already contains the scenario link and it matches a url exactly, show the echo and go straight to Step 2 without asking — **wait for the CSM to confirm**. Detail → references/sop-detail.md §Step 1.
1. **Pull the forecast.** Latest row in the result table for this forecast_id (= scenario id), by update_date. Proceed only on status: success. Surface rows the optimizer didn't optimize (zero reference spend or zero response) and Insufficient-data rows (unchanged spend, Q6 label) before anything else. → references/sop-detail.md §Step 2.
1. **Pull constraints and evidence.** Row bounds from budget_detail spendBound (manual / noChange / unlimited) and budget-optimizer-reference-data (presets, not stored); curves, calibrated and confidence from the result rows; is_constraints_satisfied from the result. → references/data-map.md.
1. **Normalise.** Budget and bounds to dollars for the period; deltas from raw values; metric type (total / ratio / unit cost); same window and scope. Start the missing-field ledger. → references/data-map.md §Normalise.
1. **Sanity-check goal vs projection.** Classify Outcome Maximization or Target Achievement and test its trigger. A trigger is a prompt to check, not a finding. → references/sop-detail.md §Step 5.
1. **Diagnose in order:** paid vs organic (only paid is comparable) → bounds and feasibility → total spend and paid allocation. No trigger → light pass for the top moves only. → references/sop-detail.md §Step 6.
1. **Escalate or select patterns.** Equal spend + feasible Reference + Reference paid outcome still better → DS, no cause offered. Otherwise pick 2–4 patterns whose evidence was checked. → references/interpretation-playbook.md.
1. **Write the output.** Part A diagnosis (internal) + Part B CS explanation (shorter, supported facts only), marked *Draft for CS review*. → references/output-templates.md.

## 4.5 Validation Checkpoints

| After step | Pause and surface |
|---|---|
| Step 1 | Scenario scope echo. Nothing else is pulled until the CSM confirms the right scenario, unless the request carried the scenario link (exact url match): then echo and continue. |
| Step 2 | Status ≠ success → stop and report status. Rows not optimized listed before interpretation. |
| Step 4 | Environment spot-check: total Reference spend + one row's Optimized spend, confirmed against the scenario page. Unconfirmed → all figures marked unverified. |
| Step 7 | Escalation: say it plainly, attach the package, no likely cause. |
| Step 8 | Draft for CS review. Never a client-ready verdict. |

## 4.6 Input-quality routing

| User provided | Path |
|---|---|
| Scenario ID or link + tenant | Link matching a url exactly: echo, no confirmation, straight to Step 2. ID + tenant: Step 1 confirm |
| Scenario name only | List matches by name, each with its link (url, verbatim), period / goal / strategy and last run time; ask which. One exact match still gets the link in the Step 1 echo and a confirmation |
| Client only ("explain the MBO for Acme") | List the tenant's saved scenarios by name, each with its link (url, verbatim); ask which |
| A question with no scenario ("why does MBO hate Meta?") | Ask for the scenario; don't answer from general MBO behaviour |
| Comparison question | Steps 1–4, then references/reconciliation.md |
| Build / what-if request | Out of scope — suggest the what-if; the CSM runs it |

## 5. Tools

| Tool | Used by | Risk | Purpose |
|---|---|---|---|
| tenant-list | Step 1 | R0 | Resolve tenant |
| budget-optimizer-list | Step 1 | R0 | Match the scenario by id, url or name; url for output |
| WorkMagic-data-query → workmagic_query | Steps 1–4 | R0 | Scenario row (platform.ads_budget_optimizer_scenario) and latest result row (result table, response_json): the same reads as optimizer_ai db/snapshot_builder.py; exact SQL in references/queries.md |
| budget-optimizer-reference-data | Step 3 | R0 | Bounds for conservative / moderate / aggressive rows (bound service; not stored) |
| budget-optimizer-compare | Reconciliation | R0 | Side-by-side of 2–5 saved scenarios |
| lift-test-list, lift-test-get, lift-test-readout | Step 3, reconciliation | R0 | Calibration evidence; lift-test figures |
| database-query-run | Reconciliation | R0 | Attribution figures (attr_model_name required) |

Scenario figures come from those two tables, read and derived exactly as db/snapshot_builder.py does. Use the prod result table. Never call budget-optimizer-create or -update-or-delete.

## 6. Output rules

- Every MBO figure is a projection: "the model projects / estimates", never "will deliver" or "achieved".
- Refer to scenarios by **name**, never numeric ID. Quote url verbatim; never construct a link.
- Every move: Reference → Optimized and %, computed from raw values — "$50.0k → $80.0k (+60.0%)".
- First use of *Reference*, *marginal ROAS*, *saturation* gets a one-line gloss.
- Next steps use "Consider …" with the tradeoff; never an unconditional instruction.
- Business language only — no budget_detail, spendBound, baseline_1, response_json, table or tool names, tenant IDs.
- In Part B, name a row's limit by its setting: the Aggressive / Moderate / Conservative strategy, or the manual range the client set. Never quote a computed bound for a preset; the dollar figure shown is the recommended spend. Part A keeps the bounds.

Templates, glossary and say / don't-say → references/output-templates.md.

## 7. CRITICAL rules (top 8)

1. **Projection, not result.** An unmet Target Achievement projection is never described as met, close, or on track. State P vs T and the gap every time.
1. **Configured is not binding.** A bound or lock explains a move only if the recommended spend sits at it (within max($1, 0.5% of the bound)). Never say what a row "would have" received without its bound.
1. **No evidence, no reason.** Each reason names a marginal-return figure, saturation point, binding bound, lock, or data flag from the output. Never invent curve shape or calibration effects; no change alone doesn't prove saturation.
1. **Reference spend = baseline_1[0] per row, result_overall.spend for the portfolio.** Optimized = baseline_1r[0] / result_overall.spend_r. Never take Reference spend from any other layer.
1. **Compute from raw values, same basis.** Check currency, units, window, sales scope (Halo vs DTC) and metric type before comparing. Percentage-mode budget 100 = equal spend, not zero.
1. **Only paid is comparable.** Reference and Optimized organic are computed differently (actual site-wide KPI × period factor vs a prophet-based remainder), so their difference comes from construction: never a finding, never an effect of reallocation. Compare paid components.
1. **Never interpret a non-ready forecast** (running or no result row).
1. **Escalate without a cause.** Every case in sop-detail §Step 7 goes to DS with the evidence package. Never “the model is wrong”, never a guessed cause.

Full failure-modes catalog → references/failure-modes.md.

## 8. Edge cases

See references/edge-cases.md — partial-media runs, budget below / above reference, locks covering most spend, Reference infeasible under this run's bounds, rows outside bounds in a target run, rows not optimized, non-ready forecasts, changed results between runs.

## 9. Related skills

- **Upstream — methodology-faq**: how MMM, saturation, calibration and lift tests work. Quote at the confidence it gives.
- **Upstream — wm-cs:product-faq**: how an MBO setting behaves in the product (strategy presets, locks, percentage budgets).
- **Sibling — lift-test-readout**: lift-test results; MBO only uses them as calibration evidence.
- **Sibling — data-trust / wm-cs:measurement-audit**: attribution trust and discrepancies without a scenario.
- **Logging — wm-cs:skill-run-log / wm-cs:skill-feedback**: start after preflight, update at Step 1 confirm, finish at hand-over; any CSM correction → feedback. Logging never blocks the run.
- **Routes out to DS**: escalations from Step 7; non-ready forecasts that persist.
