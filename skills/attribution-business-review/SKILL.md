---
name: attribution-business-review
description: Build a live weekly business-review board — a self-refreshing dashboard artifact covering store-actual revenue, ads-attributed revenue, ROAS trend, the channel/tactic funnel, and data-derived actions. Use when the user wants a recurring weekly read on the whole business rather than a one-off number. Different from attribution-custom-report (platform dashboard) and attribution-weekly-report (scheduled push).
category: attribution
risk: R1
version: 1.0.0
last-updated: 2026-08-28

references:
- references/board-spec.md
- references/instantiation.md
- references/failure-modes.md

templates:
- templates/weekly-board.tsx
- templates/01-default-model.sql
- templates/02-ads-channel-daily.sql
- templates/03-sales-platform-daily.sql
- templates/04-ads-ad-level.sql
---

## 1. Purpose

Build the **weekly business review** as a **live artifact** — one board per account that the
user opens every Monday and that re-queries the warehouse on open. It answers one question:
*what happened last week, does it matter, and what should we do about it?*

Five parts, one decision each:

| Part | Shows | Answers |
|-|-|-|
| 1 · Headline numbers | store-actual revenue, ads-attributed revenue, ad spend, ROAS | how big was the week |
| 2 · Trends | weekly ads spend / revenue / ROAS, revenue by sales platform | is this week normal |
| 3 · Efficiency verdict | spend move vs efficiency move, plus the one watch item | did anything actually change |
| 4 · Ad channel funnel | channel → tactic, impressions through NC ROAS | where did it come from |
| 5 · Actions | cut / scale candidates above a material-spend floor | what to do next week |

What each part must guarantee — KPI definitions, polarity, the verdict bands, the rule that
keeps Part 5 honest, and why the windows are anchored to the data rather than the clock — is
in `references/board-spec.md`. Read it before changing what the board says.

> **Shared conventions (canonical elsewhere — don't re-derive):** attribution model default +
> aliases and sales-platform scope + measurement identity live in **`attribution-data-query`**
> (`references/attribution-model.md`, `references/sales-platform-scope.md`). Follow those (read
> via `skills_read` if not loaded). This skill states only how the board *renders* that identity
> on the page.

The board is **not** a report you write once. It is a page wired to `database-query-run`
through the host's artifact data bridge, so the same board is correct next week without
being rebuilt.

## 2. When to trigger

- "Build me a weekly business review / weekly overview / Monday dashboard"
- "I want one page I can check every week"
- "Give me a board with revenue, spend, ROAS and what to fix"

**Do NOT trigger**:

| The user wants | Use instead |
|-|-|
| A one-time number in chat | `attribution-data-query` |
| A dashboard that isn't the weekly business review | the host's `dashboard` skill, picking the archetype that fits |
| A report **pushed** on a schedule to email / Slack / in-app | `attribution-weekly-report` |
| To know why a specific number looks wrong | `attribution-anomaly-diagnosis` |

**How this fits the family.** Since 2026-08-19 the house rule is: report-shaped output becomes
a live artifact, and "build a dashboard" routes to the `dashboard` skill. That skill is
deliberately domain-agnostic — it owns the render contract and the archetypes, and defers the
concrete tables, metric definitions and playbooks to the domain skill that owns the question.
This is that domain skill for the weekly business review: the board here is the `dashboard`
skill's **Overview archetype extended** with an efficiency verdict, a channel-to-tactic funnel,
and an actions part. `attribution-weekly-report` §Step 4 ("build the live dashboard first")
lands here when the recurring view is a whole-business weekly review.

## 3. Prerequisites — check before starting

1. **The host must support live artifacts.** This board requires a `window.agents` data
   bridge (Justin AI). In a plain chat client there is no bridge and the board cannot
   refresh — say so and route to `attribution-weekly-report` instead of shipping a page
   that will never be live.
2. **Enable the host's `artifacts` and `dashboard` skills alongside this one.** They own
   the render contract: seed-first rendering, dark mode, chart primitives, the blank-screen
   checklist, and the `num`/`num0` string-coercion rule. **Do not restate or re-derive
   them** — this skill owns only the board's content, SQL and weekly logic.
3. **The account must have attribution data.** If `database-query-run` returns nothing for
   the ads views, stop and route to `attribution-anomaly-diagnosis`.

## 4. SOP

**Step 1 — `database-query-ask` (MANDATORY).** Confirm the Cube schema and the `ctx`
convention before any SQL, exactly as every other attribution skill does. Note the board
itself cannot call this tool at render time, so it passes a load-time ISO timestamp as
`ctx`, set **once per page load** — never per render.

**Step 2 — Probe all four queries yourself, in order.** Run each of
`templates/01-default-model.sql` … `04-ads-ad-level.sql` through `database-query-run` and
read the real results. Confirm for each: the column names, that numeric cells arrive as
**strings**, and that the row count matches the question (a daily, multi-week, multi-channel
query returning one row is a collapsed aggregate, not data — fix the SQL, don't build on it).

Record from the probe: which `sales_platform` values this account actually has, which ad
platforms and tactic names appear, and the account's weekly spend magnitude. All three feed
Step 4.

**Step 3 — Copy `templates/weekly-board.tsx`.** Do not rebuild from scratch and do not
re-derive the plumbing. The template already encodes the load-bearing behaviour: guarded
bridge with no module-scope throw, per-part `<Guard>` error boundaries, the data-anchored
settled window, weekly bucketing, ratio-of-sums everywhere, the efficiency-verdict engine,
and the action rules. It is a large file — fetch it at this step, not earlier.

**Step 4 — Instantiate it for this account.** Four edits, all listed with their failure
modes in `references/instantiation.md`. The one that is not optional:

> 🛑 **Replace the synthetic seed in §5 with values you probed in Step 2.**
> The shipped seed is fake by construction. A seed carrying a real account's figures is a
> data leak the moment the bridge is inert — the page will render another account's revenue
> as if it were this one's. Same column names, same row shape, this account's numbers.

**Step 5 — Save with `bt_artifact_manage`, then self-review the running page.** Re-run one
query and diff it against what the page renders. If the page still shows seed values while
the query succeeds, the mapping is wrong — fix it before handing over. Confirm the status
strip says *Live data*, not *Sample data*.

**Step 6 — Offer the weekly cadence, don't assume it.** The board is live on open; it does
not need to be regenerated weekly. If the user wants a Monday nudge, hand off to
`attribution-weekly-report` with the board's share link — do not build a second delivery
mechanism here.

## 5. Tools used

Tool names are written unprefixed. Justin exposes these as `wm_*`; other MCP clients expose
them unprefixed. The template tries both.

| Tool | Required? | Purpose |
|-|-|-|
| `database-query-ask` | Required (first) | Schema patterns + the `ctx` convention |
| `database-query-run` | Required | Probe all four queries (Step 2); the board's only runtime data source |
| `bt_artifact_manage` | Required | Save the board (R1). Use `action='edit'` for later revisions — the file is large and a full rewrite is expensive |
| `bt_artifact_read` | Conditional | Read the current version before revising |

## 6. Output

One `react` artifact. Title it `<Account> — Weekly Business Review`. On save, record a
`context` note stating: the account, the four queries wired, the attribution model source
(resolved live, never hardcoded), and any account-specific thresholds you changed — a later
edit has to honour these or it will silently regress the board.

Deliver the link with one sentence on what the board says this week. Do not paste the
numbers into chat as well — the board is the artifact.

## 7. CRITICAL rules

1. **Never ship a seed containing another account's real numbers** — replace it with this
   account's probed values, always.
2. **Never hardcode the attribution model** — it is resolved live from the tenant default
   view. Hardcoding it means the board silently disagrees with every other WorkMagic surface
   the day the tenant changes their default.
3. **Measurement identity travels with every number** — sales-platform **scope** first, then
   **model** ("All sales platforms · Incrementality adjusted attribution"). A bare number or a
   model-only label is a defect. The law and the scoped default are canonical in
   `attribution-data-query/references/sales-platform-scope.md`; this board renders them, it does
   not redefine them.
4. **Never present store-actual and ads-attributed revenue as the same thing** — Part 1 shows
   both precisely because they differ; label which is which on every surface that shows them.
5. **Anchor windows to the data, not the clock** — attribution lands 6–24h late, so the
   trailing day is always partial. Trim still-ingesting days and name them on the page.
6. **Ratios are ratio-of-sums** — never the average of daily ratios.
7. **Never invent an action** — Part 5 lists only channels above the material-spend floor
   that moved ROAS beyond the dead band. "No data-backed action this week" is a valid,
   correct output; filling the section on judgement alone is not.
8. **Never let one broken part blank the page** — every part stays inside its `<Guard>`.

## 8. Edge cases

Small accounts, missing sales-platform data, late-reporting marketplaces, single-channel
accounts, and mid-week runs → `references/failure-modes.md`.

## 9. Related skills

- **Siblings**: `attribution-weekly-report` (owns schedule + delivery — pair with it: this board
  is the view, that skill pushes the Monday snapshot linking to it), `attribution-data-query`
  (one-time answers; report-shaped ones become their own artifact)
- **Builds on**: the host's `dashboard` skill (render contract, archetypes, chart primitives) and
  its `artifacts` skill (visual design, dark mode, blank-screen checks)
- **Upstream**: `attribution-custom-dimension` (run first if the user wants the funnel cut by
  a business label that needs a Naming Convention rule)
- **Downstream**: `attribution-anomaly-diagnosis` (the board surfaces a watch item → the user
  asks why), `mbo-create-scenario` (the board says scale → the user asks how much)
