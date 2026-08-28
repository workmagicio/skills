---
name: attribution-weekly-report
description: Create scheduled, recurring attribution reports (daily / weekly / monthly / quarterly) delivered via in-app / email / Slack. Cron or Heartbeat trigger. Always preview + test-run before activating. R1 write at system level.
category: attribution
risk: R1
version: 1.2.0
last-updated: 2026-08-19

references:
- references/executive-variant.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/weekly-report.md
- templates/executive-report.md
- templates/heartbeat-alert.md
- templates/01-weekly-metrics.sql

examples:
- examples/example-A-meta-google-weekly.md
---

## 1. Purpose

Create **scheduled, recurring attribution reports** delivered to the user via email, in-app message, or Slack — with a structured layout (core metrics + WoW comparison + highlights + recommendations). This skill owns the **schedule + delivery** (a Cron-driven task, or a Heartbeat condition trigger, that pushes a report out on a cadence). For the *view itself*, prefer building a live-data dashboard **artifact** (the `dashboard` skill) and scheduling a push to it — see §4; a one-time interactive dashboard with no schedule is just the `dashboard` skill on its own.

R1 write at the system level (direct execute + audit log). Skill-level convention: surface a preview + confirm, and always do a one-time test run before activating.

> **Shared conventions (canonical elsewhere — don't re-derive):** attribution model default + aliases and sales-platform scope + measurement identity live in **`attribution-data-query`** (`references/attribution-model.md`, `references/sales-platform-scope.md`). Follow those (read via `skills_read` if not loaded); the numbers here default to **all sales platforms** and every snapshot states scope + model.

## 2. When to trigger

Trigger when user wants something to **run on a schedule** and **be delivered**:

- "Send me a weekly Meta report every Monday 9am"
- "Set up a daily attribution summary"
- "I want a monthly creative performance report"
- "Send me an alert if Meta ROAS drops below 2x" (conditional trigger — still this skill)
- "Create a quarterly attribution report for my CMO"

**Do NOT trigger**:

- User wants a one-time number in chat → `attribution-data-query`
- User wants a one-time interactive dashboard (no schedule) → build a live-data dashboard **artifact** with the `dashboard` skill
- User just wants to know "is something wrong right now?" → `attribution-anomaly-diagnosis`

## 3. Inputs

| **Field** | **Required?** | **Default / Notes** |
|-|-|-|
| `schedule` | Required | Frequency + time: daily / weekly / monthly / quarterly + delivery clock. Parse from input ("every Monday 9am" → weekly · Mon · 09:00 user tz). If only frequency given, default time = **Monday 9:00 user-local** (weekly), **1st of month 9:00** (monthly), **9:00 user-local** (daily). Ask once only if frequency is ambiguous. |
| `trigger_type` | Detected | **Cron** (fixed schedule) or **Heartbeat** (condition-based, e.g., "alert if ROAS < 2x"). Heartbeat default check cadence = hourly. UI shows both as "scheduled tasks" — don't expose the internal distinction. |
| `content` | Required | Metrics, dimensions, time window per report (default: prior period of the same length as cadence — last week for weekly, last day for daily). **Don't hard-code metrics** — ask once if unspecified. |
| `delivery` | Required | **in-app message** (default), **email** (ask for recipient if not the user themselves), **Slack** (requires connector). Always confirm delivery channel; **never default to email silently**. |
| `format` | Has default | In-app / Slack: markdown with tables + emoji highlights. Email: rendered HTML (or PDF for executive variants). |
| `recipients` | Conditional | Required for email / Slack. Default to requesting user. For shared deliveries ("send to my CMO"), **ask for the email or Slack handle explicitly** — never guess. |
| `attribution_model` | Do not ask | Auto-apply tenant default (iDDA if lift tests exist, else DDA). Only set if user explicitly named one. |

## 4. SOP

**Step 1: Detect intent type**

- Fixed time ("every Monday", "monthly", "daily at 9am") → **Cron**
- Conditional ("when X drops below Y", "alert me if") → **Heartbeat**
- Quarterly + executive context ("for my CMO") → **Cron**, flag for executive layout

**Step 2: Collect required parameters (at most one round)** — one question max. Lead with whichever pivotal field is missing — usually **content scope** ("which channels / metrics?") or **delivery channel** ("email or in-app?"). Use defaults for everything else.

**Do not ask**: attribution model, time-window-per-report (derive from cadence), report format (derive from delivery channel).

**Step 3: `database-query-ask` (MANDATORY)** — required for `ctx` timestamp before any SQL (test run needs it). Also ask: scheduled-task creation schema + delivery channel constraints.

**Step 4: Build the live dashboard first (the view itself)**

The recurring "weekly performance" **is a live-data dashboard**, not a static table — build it with the `dashboard` skill (Overview archetype: hero + WoW, trend, breakdown; **measurement identity = sales-platform scope + attribution model**, all sales platforms by default). When the recurring view is a whole-business weekly review, use **`attribution-business-review`** — it owns the WorkMagic domain layer for exactly that board (the four warehouse queries, the settled-window rule, and a ready board skeleton) so you are not re-deriving it each time. This is the primary, self-refreshing deliverable: the user opens the link any time and it's fresh. Validate metric / dimension names via `dashboard-metrics-list`. (A one-time dashboard with no schedule ends here — that's just the `dashboard` skill.)

**Step 5: Ask whether to also push a recurring snapshot** — ONE question

The dashboard already stands on its own. Then ask: *"Want me to also send you a **{cadence}** snapshot so it lands in your inbox / Slack?"* — if **no**, you're done: hand over the dashboard link. If **yes**, continue to schedule the push. (Heartbeat/alert asks skip straight to scheduling — the trigger IS the point.)

**Step 6: Pick the snapshot format by delivery channel**

<callout emoji="🛑">
The scheduled push points at the live dashboard; how it renders depends on the channel:
- **in-app / Slack** → a short digest (key numbers + WoW highlights) **+ link to the live dashboard**
- **email** → the live view can't embed, so a **rendered snapshot** of the dashboard (HTML, or PDF for the executive variant) **+ link**
For the rendered snapshot, copy from `templates/` — `weekly-report.md` (default), `executive-report.md` (quarterly / CMO), `heartbeat-alert.md` (alerts: one-line + link, never the full layout). Copy + fill; don't invent a layout (clients get inconsistent snapshots week-to-week otherwise). Every snapshot carries the same measurement identity as the dashboard.
</callout>

**Step 7: Propose the task (diff card) → test-run → activate**

<callout emoji="💡">
**Don't take the bait — never skip the test run**
Activating a schedule without running once first looks faster, but the cost when it fails silently is high: the user (or their CMO) gets a broken or empty snapshot in their inbox on Monday morning, with no chance to catch it. **Always run once immediately and show the output before scheduling activates.** Catches: data gaps, broken metric names, empty filter sets, NC propertyNames not yet enabled.
</callout>

Show the settings diff-card preview → test-run (`templates/01-weekly-metrics.sql`) → on success activate via `create_scheduled_task`, and confirm with the next-fire time:

> *Scheduled. Next run:* ***Monday, [date] at 09:00*** *(your timezone). You can pause or edit this in* ***Scheduled Tasks****.*

**Step 8: End the turn** — don't pad with "want to set up another?". You've already offered the snapshot in Step 5; don't re-ask.

<callout emoji="💡">
**Don't take the bait — never send to external email without explicit double-confirm**
If the user asks to deliver to an email outside their org (e.g., a freelance agency, a partner), **sharing attribution data externally is a data-exposure event**. Use extra UX language in the confirmation: "This will share attribution data externally to [email] every [cadence]. Confirm?" — only proceed on explicit yes. Never silently route attribution data to external addresses.
</callout>

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `database-query-ask` | Required (first) | Schema patterns + scheduled-task conventions + `ctx` for test-run SQL |
| `dashboard-metrics-list` | Required | Validate metric / dimension names. Pass `tenantId` for NC propertyNames. |
| `database-query-run` | Required | Execute the test run (Step 6) before activating |
| `create_scheduled_task` | Required | R1 at system level. Fires only after explicit user confirmation + successful test run. |
| `list_scheduled_tasks` | Conditional | When user says "update my weekly report" — list first to find target ID |
| `update_scheduled_task` | Conditional | Edits to existing tasks; same preview + confirm flow |

## 6. Output format

Three turns:

1. **Clarification** (at most one round, one question — only if pivotal field is missing)
2. **Task diff card** — table of settings + confirm / modify / cancel
3. **Test-run result + activation** — show the actual report once + activation confirmation with next-fire time

Full report layout, rules, and Heartbeat alert variant → `references/output-template.md`

## 7. CRITICAL rules (top 9 — full list in references/failure-modes.md)

1. **Always copy a template from `templates/`** — never invent a layout; clients get inconsistent reports week-to-week otherwise
2. **Never skip the test run** — empty / broken reports landing in inboxes is the worst possible failure mode
3. **Never silent-activate** — every task creation needs the diff-card preview + explicit user confirmation
4. **Never default to email silently** — always confirm delivery channel; defaulting risks unintended external sends
5. **Never send to external email without extra confirmation** — sharing attribution data outside the requester's org is a data-exposure event
6. **Never ask "which attribution model?"** — auto-apply tenant default
7. **Always label the measurement identity** — sales-platform scope + attribution model in the report header AND footer. Revenue/ROAS default to **all sales platforms** (`attr_all_sales`); a report that names only the model ships unlabeled all-platform numbers to a CMO (`attribution-data-query/references/sales-platform-scope.md`)
8. **Never expose internal labels** ("Cron job", "Heartbeat", "task_id") — user sees "scheduled task" everywhere
9. **Never use misaligned period-over-period** — full Mon–Sun vs full Mon–Sun, not partial-vs-full

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Sibling**: the `dashboard` skill (live-data dashboard artifact, no schedule — the view this skill schedules a push to), `attribution-data-query` (one-time chat answer)
- **Upstream**: `attribution-custom-dimension` (run first if NC config missing), `attribution-intent-clarification` (if the ask is too vague)
- **Downstream**: `attribution-anomaly-diagnosis` (Heartbeat alert fires → user clicks through → diagnosis)
- **Routes out to**: `attribution-edge-routing` for unsupported delivery channels or out-of-scope content
