---
name: attribution-weekly-report
description: Build the recurring business-review board — a live, self-refreshing page covering store-actual revenue, ads-attributed revenue, the ROAS trend, the channel-to-tactic funnel, and data-derived actions — at whatever cadence the user reviews on (daily / weekly / monthly / quarterly), and optionally push a snapshot of it on a schedule to in-app / email / Slack. The board is the deliverable; the schedule is optional. Also owns condition-based alerts (Heartbeat). Use for any recurring view of attribution performance; a one-off number is attribution-data-query.
category: attribution
risk: R1
version: 2.0.0
last-updated: 2026-08-28

references:
- references/board-spine.md
- references/board-daily.md
- references/board-weekly.md
- references/board-monthly.md
- references/board-quarterly.md
- references/board-alert.md
- references/instantiation.md
- references/executive-variant.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/board.tsx
- templates/02-default-model.sql
- templates/03-ads-channel-daily.sql
- templates/04-sales-platform-daily.sql
- templates/05-ads-ad-level.sql
- templates/01-weekly-metrics.sql
- templates/weekly-report.md
- templates/executive-report.md
- templates/heartbeat-alert.md

examples:
- examples/example-A-meta-google-weekly.md
---

## 1. Purpose

Own the **recurring view** of attribution performance, end to end:

1. **The board** — a live-data artifact the user opens whenever they want, always fresh.
   This is the primary deliverable and it stands on its own.
2. **The optional push** — a Cron-driven snapshot (or a Heartbeat condition alert) that
   lands in in-app / email / Slack and links back to the board.

**A schedule is not required to be in scope.** "Give me a page I can check every Monday"
is this skill with step 7 answered "no". That is the common case, not an edge case.

> **Shared conventions (canonical elsewhere — don't re-derive):** attribution model default
> + aliases and sales-platform scope + measurement identity live in
> **`attribution-data-query`** (`references/attribution-model.md`,
> `references/sales-platform-scope.md`). Follow those (read via `skills_read` if not
> loaded); the numbers here default to **all sales platforms** and every surface — board and
> snapshot — states scope + model.

The board's content is specified in two layers, and this split is load-bearing:
`references/board-spine.md` holds what every cadence guarantees; `board-daily.md` /
`board-weekly.md` / `board-monthly.md` / `board-quarterly.md` hold only that cadence's
deltas. **Never copy spine content into a cadence file.** An alert is **not a board** —
`board-alert.md` says why before you build one.

## 2. When to trigger

Any request for a **recurring view** of attribution performance, or for something delivered
on a cadence:

- "Give me a weekly business review board" / "one page I can check every Monday" — **no
  schedule needed**
- "Send me a weekly Meta report every Monday 9am"
- "Set up a daily attribution summary"
- "I want a monthly creative performance report"
- "Build a quarterly review for my CMO"
- "Send me an alert if Meta ROAS drops below 2x" (condition trigger — still this skill)

**Do NOT trigger**:

| The user wants | Use instead |
|-|-|
| A one-time **number** or small table in chat | `attribution-data-query` |
| A dashboard that is **not** a periodic business review (a comparison, a funnel study, a one-off exploration) | the host's `dashboard` skill, picking the archetype that fits |
| To know **why** a specific number looks wrong | `attribution-anomaly-diagnosis` |
| A breakdown by a business label that needs a Naming Convention rule | `attribution-custom-dimension` first, then come back |

## 3. Inputs

| **Field** | **Required?** | **Default / Notes** |
|-|-|-|
| `cadence` | Required (detected) | daily / weekly / monthly / quarterly, or **alert**. Drives which board spec applies. Default **weekly** when the user says "recurring" without naming one — it is the cadence people actually review on. |
| `push` | Asked once (step 7) | Whether to also deliver a snapshot on a schedule. **Never assumed in either direction.** |
| `schedule` | Conditional (`push` = yes) | Frequency + delivery clock. If only frequency is given: **Mon 9:00 user-local** (weekly), **1st of month 9:00** (monthly), **9:00** (daily). |
| `trigger_type` | Detected | **Cron** (fixed schedule) or **Heartbeat** (condition-based). UI shows both as "scheduled tasks" — don't expose the distinction. |
| `content` | Has default | The board's own KPI set per the cadence spec. Only ask if the user narrows scope (specific channels, a specific dataset). |
| `delivery` | Conditional (`push` = yes) | **in-app** (default), **email** (ask for recipient), **Slack** (needs connector). Always confirm; **never default to email silently**. |
| `recipients` | Conditional | Required for email / Slack. For "send to my CMO", ask for the address explicitly — never guess. |
| `attribution_model` | Do not ask | Auto-apply tenant default; the board resolves it live. |

## 4. SOP

**Step 1 — Detect cadence and intent.** Fixed time → Cron. Condition ("alert me if") →
Heartbeat, and go read `references/board-alert.md`; an alert does not get its own board.
Quarterly or "for my CMO" → flag the executive variant.

**Step 2 — At most one clarifying question.** Lead with the one pivotal missing field —
usually content scope. **Do not ask** about the attribution model, the comparison window
(derive from cadence), or the snapshot format.

**Step 3 — `database-query-ask` (MANDATORY).** Confirm the Cube schema and the `ctx`
convention before any SQL. The board itself cannot call this tool at render time, so it
passes a load-time ISO timestamp as `ctx`, set **once per page load** — never per render.

**Step 4 — Probe all four board queries yourself.** Run `templates/02-default-model.sql` …
`05-ads-ad-level.sql` through `database-query-run` and read the real results: column names,
the fact that numeric cells arrive as **strings**, and whether the row count matches the
question (a daily, multi-week, multi-channel query returning one row is a collapsed
aggregate, not data). Record which `sales_platform` values, ad platforms and tactic names
this account actually has, plus its spend magnitude — all three feed step 5.

**Step 5 — Build the board.** Read `references/board-spine.md`, then the one cadence spec,
then copy `templates/board.tsx` and follow `references/instantiation.md`. Do not rebuild
from scratch: the skeleton already encodes the guarded bridge, per-part error boundaries,
the settled-window walk, period bucketing, ratio-of-sums, the verdict engine and the action
rules. It ships configured for **weekly**; other cadences change the `PERIOD` block plus the
deltas their spec lists.

> 🛑 **Replace the synthetic seed with values you probed in step 4.** The shipped seed is
> fake by construction. A seed carrying a real account's figures is a data leak the moment
> the bridge is inert — the page renders another account's revenue as if it were this one's.

**Step 6 — Self-review the running board, then save** with `bt_artifact_manage` and a
`context` note. Re-run one query and diff it against what the page renders; if the page
still shows seed values while the query succeeds, the mapping is wrong. Confirm the status
strip says *Live data*. Full checklist at the end of `instantiation.md`.

**Step 7 — Ask once whether to also push a snapshot.** *"Want me to also send you a
{cadence} snapshot so it lands in your inbox / Slack?"* If **no** — you are done: hand over
the board link. Do not treat that as a failure and do not re-ask. (Heartbeat/alert asks skip
to step 8 — the trigger is the point.)

**Step 8 — Pick the snapshot format by delivery channel.** in-app / Slack → short digest +
link. email → rendered HTML (PDF for executive) + link, because the live view can't embed.
Copy from `templates/`; don't invent a layout. Details + the per-cadence table:
`references/output-template.md`.

**Step 9 — Propose (diff card) → test-run → activate.**

<callout emoji="💡">
**Don't take the bait — never skip the test run**
Activating a schedule without running once first looks faster, but the cost when it fails
silently is high: the user (or their CMO) gets a broken or empty snapshot on Monday morning
with no chance to catch it. Run once, show the output, then activate. Catches data gaps,
broken metric names, empty filter sets, NC propertyNames not yet enabled.
</callout>

Test-run query: `templates/01-weekly-metrics.sql`. On success, activate via
`create_scheduled_task` and confirm with the next-fire time:

> *Scheduled. Next run:* ***Monday, [date] at 09:00*** *(your timezone). You can pause or
> edit this in* ***Scheduled Tasks****.*

**Step 10 — End the turn.** You already offered the snapshot in step 7; don't re-ask.

<callout emoji="💡">
**Don't take the bait — never send to external email without explicit double-confirm**
Delivering to an address outside the requester's org is a data-exposure event. Say so
plainly — "This will share attribution data externally to [email] every [cadence]. Confirm?"
— and proceed only on explicit yes.
</callout>

## 5. Tools used

Tool names are unprefixed here. Justin exposes WorkMagic tools as `wm_*`; other MCP clients
expose them unprefixed. The board template tries both.

| Tool | Required? | Purpose |
|-|-|-|
| `database-query-ask` | Required (first) | Schema patterns + the `ctx` convention |
| `database-query-run` | Required | Probe the four board queries (step 4); the board's only runtime data source; the snapshot test run |
| `bt_artifact_manage` | Required | Save the board (R1). Use `action='edit'` for later revisions — the file is large and a full rewrite is expensive |
| `bt_artifact_read` | Conditional | Read the current version (and its `context` note) before revising |
| `dashboard-metrics-list` | Conditional | Validate metric / dimension names for the snapshot. Pass `tenantId` for NC propertyNames |
| `create_scheduled_task` | Conditional (`push` = yes) | R1 at system level. Only after explicit confirmation + a successful test run |
| `list_scheduled_tasks` / `update_scheduled_task` | Conditional | "Update my weekly report" — list first, then edit with the same preview + confirm flow |

**Never** call `dashboard-create` / `dashboard-section-create` — we no longer build native
platform dashboards (`attribution-edge-routing` §7 rule 9).

## 6. Output

One `react` artifact titled `<Account> — <Cadence> Business Review`, plus — only if the user
asked — one scheduled task. Record on save: the account, the cadence, the four queries
wired, that the attribution model resolves live, and any account-specific thresholds you
changed. A later edit has to honour those or it silently regresses the board.

Deliver the link with one sentence on what the board says this period. Don't also paste the
numbers into chat — the board is the artifact.

## 7. CRITICAL rules

1. **Never ship a seed containing another account's real numbers** — replace it with this
   account's probed values, always.
2. **Never hardcode the attribution model** — the board resolves it live from the tenant
   default view.
3. **Measurement identity travels with every number** — sales-platform **scope** first, then
   **model**, on the board *and* every snapshot. The law is canonical in
   `attribution-data-query/references/sales-platform-scope.md`.
4. **Never present store-actual and ads-attributed revenue as the same thing** — Part 1
   shows both precisely because they differ.
5. **Anchor windows to the data, not the clock** — trim still-ingesting days and name them
   on the page. Never compare a partial period against a full one.
6. **Never carry one cadence's dead bands to another** — the weekly 3% band on a daily board
   turns day-of-week rhythm into a verdict. Each cadence spec states its own.
7. **Never let a daily board recommend a budget action** — one day is a watch item, not
   evidence (`board-daily.md`).
8. **Ratios are ratio-of-sums** — never the average of daily ratios.
9. **Never invent an action** — "no data-backed action this period" is a correct, complete
   Part 5.
10. **Never assume a schedule, in either direction** — build the board, ask once, accept the
    answer. Never withhold the board because the user declined a push.
11. **Never skip the test run** and **never silent-activate** — diff-card preview + explicit
    confirmation, every time.
12. **Never default to email silently**, and never send externally without the extra confirm.
13. **Never expose internal labels** ("Cron job", "Heartbeat", "task_id") — the user sees
    "scheduled task".
14. **Never let one broken part blank the page** — every part stays inside its `<Guard>`.

## 8. Edge cases

`references/edge-cases.md` (routing + tenant situations) and `references/failure-modes.md`
(§A scheduling & delivery, §B board).

## 9. Related skills

- **Upstream**: `attribution-custom-dimension` (run first when a requested cut needs a
  Naming Convention rule), `attribution-intent-clarification` (ask is too vague)
- **Builds on**: the host's `dashboard` skill (render contract, archetypes, chart
  primitives) and its `artifacts` skill (visual design, dark mode, blank-screen checks) —
  this skill supplies the WorkMagic domain layer they defer to
- **Downstream**: `attribution-anomaly-diagnosis` (the board surfaces a watch item → the
  user asks why), `mbo-create-scenario` (the board says scale → the user asks how much),
  `lift-test-creation` (the board can't tell whether a channel is incremental)
- **Routes out to**: `attribution-edge-routing` for unsupported delivery channels or
  out-of-scope content
