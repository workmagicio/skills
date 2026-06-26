---
name: attribution-weekly-report
description: Create scheduled, recurring attribution reports (daily / weekly / monthly / quarterly) delivered via in-app / email / Slack. Cron or Heartbeat trigger. Always preview + test-run before activating. R1 write at system level.
category: attribution
risk: R1
version: 1.0.0
last-updated: 2026-06-25

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

Create **scheduled, recurring attribution reports** delivered to the user via email, in-app message, or Slack — with a structured layout (core metrics + WoW comparison + highlights + recommendations). Different from `attribution-custom-report`: that skill creates a **persistent dashboard** the user opens; this one creates a **Cron-driven task** (or Heartbeat condition trigger) that pushes a report out on schedule.

R1 write at the system level (direct execute + audit log). Skill-level convention: surface a preview + confirm, and always do a one-time test run before activating.

## 2. When to trigger

Trigger when user wants something to **run on a schedule** and **be delivered**:

- "Send me a weekly Meta report every Monday 9am"
- "Set up a daily attribution summary"
- "I want a monthly creative performance report"
- "Send me an alert if Meta ROAS drops below 2x" (conditional trigger — still this skill)
- "Create a quarterly attribution report for my CMO"

**Do NOT trigger**:

- User wants a one-time number in chat → `attribution-data-query`
- User wants a persistent dashboard to open in the UI → `attribution-custom-report`
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

**Step 3: `knowledge-base-ask` (MANDATORY)** — required for `ctx` timestamp before any SQL (test run needs it). Also ask: scheduled-task creation schema + delivery channel constraints.

**Step 4: Build the report layout**

<callout emoji="🛑">
**HARD RULE — copy from `templates/` first**
Use one of:
- `templates/weekly-report.md` — default weekly / daily / monthly layout (channel-level, with WoW table + Highlights + Issues + Recommendations)
- `templates/executive-report.md` — quarterly / "for my CMO" variant (channel-level only, KPI summary lead, strategic recommendations)
- `templates/heartbeat-alert.md` — alert variant (one-line summary + dashboard link, never full layout)
Copy the template, fill placeholders. Do NOT invent a layout — the templates are vetted; ad-hoc layouts produce inconsistent reports for the same client across weeks.
</callout>

Validate metric / dimension names via `dashboard-metrics-list`.

**Step 5: Propose the task (diff card preview)**

Before any write fires, show a settings preview:

**Step 6: Test-run BEFORE activating**

<callout emoji="💡">
**Don't take the bait — never skip the test run**
Activating a schedule without running once first looks faster, but the cost when it fails silently is high: the user (or their CMO) gets a broken or empty report in their inbox on Monday morning, with no chance to catch it. **Always run once immediately and show the output before scheduling activates.** Catches: data gaps, broken metric names, empty filter sets, NC propertyNames not yet enabled.
- Test run looks good → activate; tell user the next-fire time
- Test run is empty / broken → don't activate; surface the issue and offer to adjust
</callout>

Use `templates/01-weekly-metrics.sql` as the test-run query template.

**Step 7: Activate via `create_scheduled_task`**

Confirm activation with the next-fire timestamp:

> *Scheduled. Next run:* ***Monday, [date] at 09:00*** *(your timezone). You can pause or edit this in* ***Scheduled Tasks****.*

**Step 8: End the turn** — don't pad with "want to set up another?" or "should I also create a dashboard?". The UI exposes both.

<callout emoji="💡">
**Don't take the bait — never send to external email without explicit double-confirm**
If the user asks to deliver to an email outside their org (e.g., a freelance agency, a partner), **sharing attribution data externally is a data-exposure event**. Use extra UX language in the confirmation: "This will share attribution data externally to [email] every [cadence]. Confirm?" — only proceed on explicit yes. Never silently route attribution data to external addresses.
</callout>

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | Required (first) | Schema patterns + scheduled-task conventions + `ctx` for test-run SQL |
| `dashboard-metrics-list` | Required | Validate metric / dimension names. Pass `tenantId` for NC propertyNames. |
| `database-query-sql` | Required | Execute the test run (Step 6) before activating |
| `create_scheduled_task` | Required | R1 at system level. Fires only after explicit user confirmation + successful test run. |
| `list_scheduled_tasks` | Conditional | When user says "update my weekly report" — list first to find target ID |
| `update_scheduled_task` | Conditional | Edits to existing tasks; same preview + confirm flow |

## 6. Output format

Three turns:

1. **Clarification** (at most one round, one question — only if pivotal field is missing)
2. **Task diff card** — table of settings + confirm / modify / cancel
3. **Test-run result + activation** — show the actual report once + activation confirmation with next-fire time

Full report layout, rules, and Heartbeat alert variant → `references/output-template.md`

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Always copy a template from `templates/`** — never invent a layout; clients get inconsistent reports week-to-week otherwise
2. **Never skip the test run** — empty / broken reports landing in inboxes is the worst possible failure mode
3. **Never silent-activate** — every task creation needs the diff-card preview + explicit user confirmation
4. **Never default to email silently** — always confirm delivery channel; defaulting risks unintended external sends
5. **Never send to external email without extra confirmation** — sharing attribution data outside the requester's org is a data-exposure event
6. **Never ask "which attribution model?"** — auto-apply tenant default
7. **Never expose internal labels** ("Cron job", "Heartbeat", "task_id") — user sees "scheduled task" everywhere
8. **Never use misaligned period-over-period** — full Mon–Sun vs full Mon–Sun, not partial-vs-full

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Sibling**: `attribution-custom-report` (persistent dashboard, no schedule), `attribution-data-query` (one-time chat answer)
- **Upstream**: `attribution-custom-dimension` (run first if NC config missing), `attribution-intent-clarification` (if the ask is too vague)
- **Downstream**: `attribution-anomaly-diagnosis` (Heartbeat alert fires → user clicks through → diagnosis)
- **Routes out to**: `attribution-edge-routing` for unsupported delivery channels or out-of-scope content
