---
name: attribution-weekly-report
description: Set up attribution reports that run on a schedule and are delivered automatically, including conditional alerts. Use when the user wants something to run recurringly and be delivered (e.g. "Send me a weekly ROAS report", "Alert me if Meta ROAS drops below 2x"). Not for one-time queries or static saved reports.
---

# attribution-weekly-report

## 1. Purpose
Create **scheduled, recurring attribution reports** delivered to the user via email, in-app message, or Slack — with a structured layout (core metrics + WoW comparison + highlights + recommendations). Different from `attribution-custom-report`: that skill creates a **persistent dashboard** the user opens; this one creates a **Cron-driven task** (or Heartbeat condition trigger) that pushes a report out on schedule. R1 write at the system level (direct execute + audit log). Skill-level convention: surface a preview + confirm, and always do a one-time test run before activating.
## 2. When to trigger
Trigger when the user wants something to **run on a schedule** and **be delivered**. Common phrasings:
- "Send me a weekly Meta report every Monday 9am"
- "Set up a daily attribution summary"
- "I want a monthly creative performance report"
- "Send me an alert if Meta ROAS drops below 2x" (conditional trigger, not pure schedule — still this skill)
- "Create a quarterly attribution report for my CMO"
**Do NOT trigger** when:
- User wants a one-time number in chat → `attribution-data-query`
- User wants a persistent dashboard to open in the UI → `attribution-custom-report`
- User just wants to know "is something wrong right now?" → `attribution-anomaly-diagnosis`
## 3. Inputs

<lark-table rows="8" cols="3" column-widths="208,152,328">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description / default**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `schedule`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Frequency + time: daily / weekly / monthly / quarterly + delivery clock. Parse from input ("every Monday 9am" → weekly · Mon · 09:00 user tz). If only frequency is given, default time is **Monday 9:00 user-local** (weekly), **1st of the month 9:00** (monthly), **9:00 user-local** (daily). Ask once if frequency is ambiguous.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `trigger_type`
    </lark-td>
    <lark-td>
      Detected
    </lark-td>
    <lark-td>
      **Cron** (fixed schedule) or **Heartbeat** (condition-based, e.g., "alert if ROAS < 2x"). Heartbeat default check cadence = hourly. UI shows both as "scheduled tasks" — don't expose the internal distinction to the user.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `content`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      What goes in the report: metrics, dimensions, time window per report (default: prior period of the same length as the cadence — last week for weekly, last day for daily, etc.), channel filter. **Don't hard-code metrics** — ask which channels / metrics if unspecified.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `delivery`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      One or more of: **in-app message** (default if user doesn't specify), **email** (ask for recipient if not the user themselves), **Slack** (requires connector). Always confirm delivery channel; never default to email silently.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `format`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **In-app / Slack:** markdown with tables + emoji highlights. **Email:** rendered HTML (or PDF attachment for executive variants). User can override.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `recipients`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      Required for email / Slack. Default to the requesting user. For shared deliveries (e.g., "send to my CMO"), ask for the email or Slack handle explicitly — never guess.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution_model`
    </lark-td>
    <lark-td>
      Do not ask
    </lark-td>
    <lark-td>
      Auto-apply tenant default (iDDA if lift tests exist, else DDA). Only set if user explicitly named one.
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Detect intent type**
- Fixed time mention ("every Monday", "monthly", "daily at 9am") → **Cron**
- Conditional mention ("when X drops below Y", "alert me if") → **Heartbeat**
- Quarterly + executive context ("for my CMO") → **Cron**, but flag for executive layout (see Step 4)
**Step 2: Collect required parameters (at most one round)**
One question max. Lead with whichever pivotal field is missing — usually **content scope** ("which channels / metrics?") or **delivery channel** ("email or in-app?"). Use defaults for everything else.
**Do not ask**: attribution model, time-window-per-report (derive from cadence), report format (derive from delivery channel).
**Step 3: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Required for the `ctx` timestamp before any SQL execution (the test-run step needs it). Also ask about: scheduled-task creation schema + delivery channel constraints.
**Step 4: Build the report layout**
Use the dataset router from `attribution-custom-report` § 3 to pick the dataset. Validate metric / dimension names via `dashboard-metrics-list`. Default layout (adapt per cadence):
1. **Core metrics table** — per-channel (or per-dimension): spend, revenue, ROAS, CTR, CPA, WoW / period-over-period delta
1. **Highlights** — top 1–2 channels / campaigns with biggest positive delta (≥ 20%)
1. **Issues** — channels / campaigns where CPA exceeds target or ROAS falls below threshold
1. **Recommendations** — 2–3 concrete actions for the next period
**Executive variant** (when user says "for my CMO" or quarterly cadence is requested):
- Shorter — strip campaign-level detail, keep channel-level
- Add period-over-period comparison (quarter vs prior quarter)
- Lead with KPI summary; recommendations should be strategic, not tactical
- Format: PDF if email delivery
**Step 5: Propose the task (diff card preview, R2)**
Before any write fires, show:
```plaintext
**Scheduled task: Meta + Google Weekly Report**

| Setting     | Value                                              |
|-------------|----------------------------------------------------|
| Frequency   | Every Monday at 09:00 (your timezone)              |
| Coverage    | Meta, Google · iDDA · prior week (Mon–Sun)         |
| Contents    | Core metrics, WoW comparison, highlights, actions  |
| Delivery    | In-app message + email to you@example.com          |
| Format      | Markdown (in-app) + HTML (email)                   |

[✓ Confirm and test-run]   [Modify]   [Cancel]    

```

**Step 6: Test-run BEFORE activating**
After user confirmation, **always run the report once immediately** and show the output before scheduling activates. This catches data gaps, broken metric names, and empty-result issues before the user gets a bad report in their inbox.
- If the test run looks good → activate the schedule; tell the user when the next run will fire
- If the test run is empty / broken → don't activate; surface the issue and offer to adjust
**Step 7: Activate via **`**create_scheduled_task**`** (or task-create equivalent)**
Create the underlying Cron / Heartbeat job. Confirm activation with the next-fire timestamp:
<quote-container>
Scheduled. Next run: **Monday, [date] at 09:00** (your timezone). You can pause or edit this in **Scheduled Tasks**.
</quote-container>

**Step 8: Do not pad**
End the turn after confirming activation. Don't ask "want to set up another?" or "should I also create a dashboard for this?" The UI exposes both.
## 5. Tools used

<lark-table rows="7" cols="3" column-widths="232,164,328">

  <lark-tr>
    <lark-td>
      **Tool**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
    <lark-td>
      Required (first)
    </lark-td>
    <lark-td>
      Schema patterns + scheduled-task creation conventions + `ctx` timestamp for the test-run SQL
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Validate metric / dimension field names. Pass `tenantId` for NC propertyNames.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Execute the test run (Step 6) before scheduling activates
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `create_scheduled_task`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      R1 at system level (direct execute + audit). Skill-level convention: fires only after explicit user confirmation and a successful test run.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `list_scheduled_tasks`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      When user says "update my weekly report", first list existing tasks to find the target task ID
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `update_scheduled_task`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      For edits to existing tasks; same R2 confirmation flow
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
Three turns:
1. **Clarification** (at most one round, one question — only if pivotal field is missing)
1. **Task diff card** — table of settings + confirm/modify/cancel + Confirm / Cancel (pure block, no timer)
1. **Test-run result + activation** — show the actual report once + activation confirmation with next-fire time
**Report layout template** (the content that gets delivered each period):
```plaintext
# Ad Performance Weekly Report · [YYYY-MM-DD ~ YYYY-MM-DD]

## Core Metrics

| Channel  | Spend | Revenue | ROAS | CTR | CPA | WoW    |
|----------|-------|---------|------|-----|-----|--------|
| Meta     | $X    | $X      | X.XX | X%  | $X  | +X%    |
| Google   | $X    | $X      | X.XX | X%  | $X  | −X%    |
| **Total**| **$X**| **$X**  |**X.XX**| — | —  |**±X%** |

## Highlights
- 🟢 [Channel] ROAS reached X.X this week (+X% WoW), driven by [campaign]

## Issues & Risks
- 🔴 [Channel] CPA was $X (X% over target) — review audience quality

## Next Week Recommendations
1. **[Channel]**: [specific action] — expected impact: [outcome]
2. ...

---
*Data as of: [query time] · Attribution model: [iDDA / DDA]*

```

**Output rules**:
- Always include **data-as-of timestamp** and **attribution model** in the footer — the user (or their CMO) shouldn't have to guess
- WoW / period-over-period **length-aligned** — for weekly reports compare full Mon–Sun vs full Mon–Sun; never partial-vs-full
- Highlight thresholds: ≥ ±20% change earns mention; smaller changes are noise
- Heartbeat (alert) variant: short message, one-line summary + link to dashboard — don't dump the full layout
## 7. Edge cases & routing

<lark-table rows="11" cols="2" column-widths="328,410">

  <lark-tr>
    <lark-td>
      **Edge case**
    </lark-td>
    <lark-td>
      **Handling**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for a one-time report ("send me last week's Meta numbers")
    </lark-td>
    <lark-td>
      Not this skill — route to `attribution-data-query`. No schedule = no task.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Set up a daily attribution summary" with no other details
    </lark-td>
    <lark-td>
      Ask the most pivotal question once: "Which channels and metrics should it cover?" Don't fan out into a multi-question form. Default everything else (in-app delivery, 9am send, iDDA model, prior-day window).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Send me an alert if Meta ROAS drops below 2x"
    </lark-td>
    <lark-td>
      Detected as Heartbeat. Default check cadence: hourly. Default delivery: in-app + offer to add email. Don't expose "Heartbeat" terminology; user sees a "scheduled task".
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "For my CMO" / quarterly request
    </lark-td>
    <lark-td>
      Switch to executive layout (Step 4 variant). Ask for the CMO's email (if email delivery) and confirm PDF vs HTML.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Creative report request → "monthly creative performance report"
    </lark-td>
    <lark-td>
      Dataset = `creative_attribution`. Ask once: "All creatives, or top N? (Default: top 20 by spend.)"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants a metric / dimension that requires NC config
    </lark-td>
    <lark-td>
      Pause — route to `attribution-custom-dimension` first. After NC setup completes, resume scheduling here.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Test run returns empty
    </lark-td>
    <lark-td>
      Don't activate. Surface: "The test run came back empty — likely cause: [no data in window / filter too narrow / metric not yet enabled]. Want to adjust?"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants to send to an email outside the org
    </lark-td>
    <lark-td>
      Confirm explicitly with extra UX language ("This will share attribution data externally to [email]"). Only proceed on explicit yes; never silently send to external addresses.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Pause" / "edit" / "delete" an existing scheduled task
    </lark-td>
    <lark-td>
      Use `list_scheduled_tasks` → find target → `update_scheduled_task`. Same skill-level preview + confirm flow. For delete, additionally surface the consequences explicitly (the task and its history will be gone).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for a report covering data from a dataset that doesn't exist on their tenant
    </lark-td>
    <lark-td>
      Surface the gap. Offer the available datasets. Don't silently substitute.
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Treat as one-time query** — this skill always ends with a scheduled task; if no schedule, it's `attribution-data-query`
- **Skip the test run** — never activate a schedule without showing the user one rendered report first
- **Silent-activate** — every task creation needs the diff-card preview + explicit (or 60s auto-) confirmation
- **Skip delivery channel confirmation** — defaulting to email when user might have meant in-app risks unintended external sends
- **Send to external email ****without explicit extra confirmation** — sharing attribution data outside the requester's org is a data-exposure event
- **Hard-code "Meta + Google" or any channel mix** — derive from user input; ask if missing
- **Misaligned period-over-period** — week-to-date vs full week makes every report look broken; use length-aligned windows
- **Ask "which attribution model?"** — auto-apply tenant default
- **Expose internal labels** ("Cron job", "Heartbeat", "task_id") — user sees "scheduled task" everywhere
- **Pad with "want to set up another?"** — end the turn after activation confirmation
- **Skip **`**knowledge-base-ask**`** before SQL** — needed for `ctx` on the test run
- **Multi-question form** in the clarification turn — one pivotal question, defaults elsewhere
- **Fire the report immediately without scheduling** — that's one-time data query, not this skill
- **Add **`**tenant_id**`** filters in SQL** — platform-mcp injects it
- **Forget to include attribution model + data-as-of in the report footer** — readers will misinterpret without it
## 9. References & related skills
**Related skills**:
- **Sibling**: `attribution-custom-report` (persistent dashboard, no schedule), `attribution-data-query` (one-time chat answer)
- **Upstream**: `attribution-custom-dimension` (run first if NC config missing), `attribution-intent-clarification` (if the ask is too vague)
- **Downstream**: `attribution-anomaly-diagnosis` (Heartbeat alert fires → user clicks through → diagnosis)
- **Routes out to**: `attribution-edge-routing` for unsupported delivery channels or out-of-scope content
**Risk class**: R1 for task create / update / delete at the system level (direct execute + audit log). Skill-level convention: always preview + confirm before firing; for delete and external-email delivery, surface the consequences explicitly in the confirmation. No countdown timer. See the internal risk-levels reference.
**Key concepts**:
- **Cron vs Heartbeat**: Cron = fixed time trigger ("every Monday 9am"); Heartbeat = condition trigger ("when ROAS < 2x", checked hourly). UI shows both as "scheduled tasks"; don't expose the distinction to the user.
- **Test-run before activate**: this skill's hard rule. Catches empty results, broken metrics, and misconfigured filters before the user's first scheduled delivery.
- **Length-aligned period-over-period**: weekly compares full Mon–Sun to prior full Mon–Sun; monthly compares full months; never compare partial-to-full.
- **Executive variant**: triggered by quarterly cadence or explicit "for my CMO". Strips campaign-level detail, leads with KPIs, prefers PDF email.
