Step 6's automated branch — budget-fit auto-solve.

The manual loop (solve-loop.md) quantifies a gap and asks the user to pick one lever
at a time. **Auto-solve is the same loop, run by the skill**: instead of one lever per
round, it searches the geo-size × test-period space itself until it lands a design that
fits the budget — or proves nothing fits. **It runs automatically**, the same way the geo
and concurrency constraints are applied without asking — a budget constraint is just
another constraint the system resolves. §9-3 still holds where it matters: a geo size or
test period the user **pinned is never overridden**, and a fit that needs a real trade-off
(geo size >20% or period >35 days) pauses for the user to pick. The search itself is
deterministic and fully disclosed here.

Inside creation this is NOT FIND-only — a solved design flows straight to Step 7 and
becomes a draft.

## When it runs

Only from inside Step 6 — i.e. Step 5 came back **Insufficient**, or the returned
design **violates the stated budget**. Then check whether auto-solve's inputs are
complete:

|Input|Complete when|
|---|---|
|**Budget target**|The user stated a daily budget, **or** it's inferable from scan current spend (tactic → 30-day `ad_spend ÷ window_days`; account / platform → `scan.platformMetrics[platform].daily_spend`). No budget and none inferable → **nothing to fit** — auto-solve doesn't run; stay in the manual loop.|
|**CPA**|Resolvable via `database-query-run` (口径 below), or the user gives it. Analyze's auto-CPA does **not** count — it is too low (see CPA section).|
|Scope / level / geo / metric|Already resolved by Step 4 — always present at this point.|

Inputs complete → **run the search below without asking** — announce it in one progress
line and go:

> "Your current $X/day doesn't clear the feasibility threshold — I'm searching for a geo
> size and test length that fits, trying a few designs. One moment."
>
>

No consent question, no second full-config confirmation (Step 4 already gated it — §9-2).
Inputs incomplete (no budget and none inferable) → nothing to fit → the manual lever loop
(solve-loop.md).

**Pinned axes are respected, never widened.** If the user stated a geo size or a test
period as a constraint, that axis is fixed: search only the other one (a pinned geo size
→ probe that one bucket; a pinned period → step 2's pinned branch). If the pinned
combination cannot fit, say so with the gap in numbers and hand over to the manual levers —
don't silently move a value the user set.

## The search

Two axes, handled differently:

- **Geo size (holdout) → real designs.** Search the 5% buckets {0.05, 0.10, 0.15, 0.20,
0.25, 0.30} with a three-state binary search anchored at **21 days**. No formula —
every geo size reported was actually designed + analyzed.

- **Test period → one formula.** From the 21-day design's feasibility threshold,
extrapolate any other length by `required(T) = required₂₁ × √(21/T)` (more days →
lower threshold, both methods).

**Method:** explore **both PTM and LTM** unless the user pinned one — one design run
returns both `ptmDesignId` + `ltmDesignId`, so both methods come from the same runs at
no extra cost.

**Pass rule:** a platform passes when `budget ≥ required × 0.95` — the same 0.95 tolerance
the product's **Sufficient** check uses. The only difference is the left-hand side: the
product compares *current reported spend*, auto-solve compares the *budget target*; when the
budget is inferred from current spend the two are identical.
**Comfortable:** geo size ≤ 20% **and** test period ≤ 35 days (ideally 21 / 28).

```
0. Budget resolved (or inferred). CPA resolved (CPA section). Method = both unless pinned.
1. Geo-size search @ 21 days:
   - User pinned a geo size → probe only that bucket (1 run).
   - Else three-state binary over the ladder, seeded at the 0.05 rail:
       probe(h) = design(holdout=h, 21) → poll design-result in-loop → design-analyze(real CPA)
       ① Submit probe 0.05, then — 15s later, WITHOUT waiting for its result — submit
          probe 0.15 as well (design is fire-and-forget: two task_ids, polled in parallel,
          roughly halving wall-clock). 0.05 PASS → done (smallest & comfortable); ignore
          the 0.15 result. 0.05 fail → keep its result and fall into the binary with 0.15
          already in hand (reused, not re-run).
       ② Binary from 0.15's result, then:
          PASS (budget ≥ 0.95×required₂₁, every platform) → record; seek smaller (hi=mid-1)
          NO SOLUTION (design returns "no feasible geo pair", fast) → log the round as
                                                             "no solution"; too small; seek larger (lo=mid+1)
          TIMED OUT (design-result ends failed with no rows, ~5 min) → log the round as
                                                             "timed out"; move on to the next larger
                                                             size — do NOT stop the search
          spend短缺 (required₂₁ > budget/0.95)            → LTM: hi=mid-1 · PTM: lo=mid+1
          until lo>hi → smallest feasible geo size.
       Each probe waits for design-result's terminal state (success / failed; solves
       are P95 < 300s). Keep a ROUND LOG — one line per probe: geo size → passed /
       short by $X per day / no solution / timed out — and put it in the final answer.
2. Test-period fit (formula, no extra runs), per method, at that geo size:
   - period pinned T0 → required = required₂₁·√(21/T0); pass iff budget ≥ 0.95×required.
   - else smallest fitting length: T_need = 21 × (0.95 × required₂₁ / budget)²
       Snap to the standard lengths first — they are what the product recommends:
         T_need ≤ 21 → 21;  21 < T_need ≤ 28 → 28;
         only above 28 use a custom length T = ⌈T_need⌉ (create then needs
         geoGroup.test_length = T and estimator.custom_test_length = T).
       T ≤ 35 → take it.  35 < T ≤ 60 → take ONLY if geo size is at a rail.
       T > 60 → infeasible at this geo size.
3. EARLY STOP → single design. The moment a comfortable solution appears (geo size ≤20%
   AND period ≤35, passing every platform for the method), stop and take it. Don't chase
   a still-smaller geo size — ≤20% is good enough.
4. Else (only geo size >20% or period >35 fits) → build a small geo-size ↔ period
   TRADE-OFF list on the iso-budget curve (e.g. 20% / 40d · 25% / 33d · 30% / 28d), each
   with its threshold + coverage, and **let the user pick** (still §9-3: the user chooses).
5. Infeasible: even the rail geo size at 60 days won't fit (LTM 0.05/60, PTM 0.30/60) →
   say so explicitly; don't silently drop a method. → DS handoff or manual levers.
```

### Gotchas

- **Geo size is a left-closed 5% bucket.**`0.05` designs `[5%,10%)`, `0.10` → `[10%,15%)`,
… Max usable is **0.30** (→ 30–35%). Never pass 0.35.

- **Geo size moves PTM and LTM in opposite directions.** Bigger → LTM *more* expensive,
PTM *cheaper*. This sets the binary-search direction on a shortfall (LTM smaller, PTM larger).

- **A $200 LTM feasibility threshold is the floor** (MIN_EXPECTED_DAILY_SPEND), not a real
value — if you see it, the real required is below $200, usually a wrong CPA.

## CPA — one unified query, not analyze's auto-CPA

Resolve CPA per platform and pass it to `lift-test-design-analyze` via `platformSpend[].cpa`.
Priority: `database-query-run` → ask the user → stop. **Never** fall back to analyze's
auto-CPA (platform/reported-level, far too low — it under-states budget and can wrongly
recommend PTM).

The口径 is **pure Cube.dev, one query** — `attr_all_orders` / `attr_all_sales` already
bake in the **(All)-channels** sum (Shopify scalar + every other channel), and
`attr_model_name` splits DDA vs iDDA. No raw ADB, no `element_at` / `json_overlaps`, no
shopify-vs-multi-channel split.

- **Scope = what the user selected, by testLevel** (query `dws_view_copilot_attr_ads_ad_level_daily_latest`, which carries all three dimensions; `GROUP BY ads_platform, attr_model_name`):
    - **platform** → the selected accounts: `account_id IN (...)`; if the user picked no account, the whole platform (no grain filter — `dws_view_copilot_attr_channel_level_daily_latest` also works then).
    - **tactic** → the selected tactics: `tactic_name IN (...)`.
    - **campaign** → the selected campaigns: `campaign_id IN (...)`.

```sql
SELECT ads_platform, attr_model_name,
       MEASURE(ad_spend)        AS ad_spend,
       MEASURE(attr_all_orders) AS all_orders,   -- (All) 口径: shopify + every channel
       MEASURE(attr_all_sales)  AS all_sales
FROM dws_view_copilot_attr_ads_ad_level_daily_latest
WHERE tenant_id = <tid>
  AND event_date >= '<30d-ago>' AND event_date < '<today>'
  AND attr_model_name IN ('data_driven', 'incrementality_adjusted')   -- DDA, iDDA
  AND ads_platform = '<Meta|Google|…>' AND <grain filter>
GROUP BY ads_platform, attr_model_name
-- CLIENT-SIDE (Cube.dev has no NULLIF/CASE): pivot the two model rows, then
--   cpo = ad_spend / all_orders ;  aov = all_sales / all_orders   (per model)
--   CPA = min(cpo, 1.5 × aov)                     ← frontend caps CPA at 1.5×AOV
```

- **iDDA vs DDA is TENANT-level.** If the tenant has ANY calibration row, use the **iDDA**
cpo (`incrementality_adjusted`) for EVERY platform, else DDA. Not per-platform; the
1.5×AOV cap always prefers iDDA AOV. Check:

```sql
SELECT test_level, ads_platform
FROM ads_view_analytics_lift_test_calibrated_ads_platform_latest
WHERE tenant_id = <tid> AND test_level != 'campaign'
GROUP BY test_level, ads_platform    -- non-empty ⇒ use iDDA for ALL platforms
```

## Multi-cell geo-size conflict

Geo size is a property of **one design**: within a design every cell shares one geo size; a different cell count is a different design and may land on a different geo size (a 2-cell at 5% redesigned as 3-cell may well come back at 10%) — that is the normal re-design path, not a per-cell setting.

One design uses ONE geo size for ALL cells (shared geo split). When cells' budget-feasible
windows differ, pick the single geo size deterministically:

1. **Majority vote** — each cell votes for the bucket its window lands in (a window spanning
two buckets votes for both); pick the most-voted bucket.

2. **Tie-break** — `mid = (highest + lowest cell holdout) / 2`, clamped to [0.05, 0.30],
snapped down to the bucket's lower edge.

3. Run ONE real design at that geo size and verify **every cell, and every ads platform
inside each cell**, passes the budget rule (budget ≥ 0.95 × required) — the goal is that
each cell × platform fits its budget as far as possible. Any cell / platform still short
→ surface it (next step).

If a cell still fails at the chosen geo size (truly disjoint windows), surface it — rebalance
per-platform budget, or split into separate per-platform tests — **don't silently split**.

## Reconciling with creation's invariants

- **§9-2 no second full-config gate.** Step 4 already confirmed the config. Auto-solve does
**not** re-run a prepare-summary confirmation; it runs designs directly. The only thing it
surfaces mid-search is a CPA assumption if that wasn't in the Step 4 read-back — one line, not the whole config.

- **§9-4 round budget.** One auto-solve run **is** the automated solve loop — it replaces the
manual rounds, it does not stack on top of them. If it lands a design → Step 7. If it comes
back infeasible-at-rails → DS handoff (solve-loop.md) or offer the manual levers once; do
not loop auto-solve again.

- **§7 output.** The result is narrated in business language — **Geo size**, **Test period**,
**Feasibility threshold** vs budget + coverage %. **No holdout_pct, no MDL, no designId,
no `lift_test_group` in chat.** The design IDs / geoGroup are carried **internally** into
the Step 7 `lift-test-create` call, never printed. Gaps get numbers, never adjectives.

## Output → Step 7

- **Comfortable → one design.** Per method in scope: method, Geo size, Test period, and per-platform Feasibility threshold vs budget + coverage %, **followed by the round log** (what each geo size did: passed / short / no solution / timed out). Then straight to Step 7 (create the draft) — this is inside creation, so it builds. No "shall I create?" (§9-2).
- **Trade-off shortlist** (only if the fit needs geo size >20% or period >35) — a few
(geo size, period) points with threshold + coverage; the user picks one, then Step 7.

- **Infeasible at the rails** → state it, and route: DS handoff or the manual levers. Nothing
gets built silently.
