## Example A — "Weekly Meta + Google report every Monday 9am"

The canonical setup engagement. User asks for a recurring weekly report; agent walks through clarification, preview, test run, activation.

### User input

*"Set up a weekly attribution report for Meta and Google. Send it to me every Monday at 9am."*

### Step-by-step

#### Step 1 — Detect intent type

Fixed schedule ("every Monday at 9am") → **Cron**. No CMO / executive context. Channels named (Meta + Google).

#### Step 2 — Collect parameters

One thing missing: **delivery channel**. Ask once: *"Got it — Meta + Google, every Monday 9am. Which delivery channel — in-app message (default), email, or Slack?"*

User answers: *"in-app"*.

Use defaults: prior-week window (Mon–Sun), iDDA (tenant has lift tests), markdown format.

#### Step 3 — knowledge-base-ask

Ask: *"How to create a Cron-driven scheduled task in WM?"* + *"channel_attribution schema for weekly ROAS / NC ROAS / CTR / CPA"*. Returns `ctx`.

#### Step 4 — Build layout

Copy `templates/weekly-report.md`. Resolved channels = [Meta, Google]. Resolved metrics = the template defaults.

#### Step 5 — Diff card preview

User clicks "Confirm and test-run".

#### Step 6 — Test run

Copy `templates/01-weekly-metrics.sql`. Fill: `{start_date}=2026-06-09`, `{end_date}=2026-06-16`, `{tenant_default_model}=idda`, channels = Meta + Google. Execute via `database-query-sql`.

Result populates the `templates/weekly-report.md` placeholders:

<callout emoji="📊">
**Ad Performance Weekly Report · Jun 09 – Jun 15, 2026**
*Period: Jun 09 – Jun 15  ·  Comparison: vs Jun 02 – Jun 08  ·  Attribution model: iDDA*
</callout>

| Channel | Spend | Revenue | ROAS | CTR | NC ROAS | WoW (ROAS) |
|-|-|-|-|-|-|-|
| Meta | \$135K | \$420K | 3.11 | 1.4% | 1.85 | +8% |
| Google | \$80K | \$310K | 3.87 | 2.1% | 2.10 | −12% |
| **Total** | **\$215K** | **\$730K** | **3.40** | — | **1.95** | **−1%** |

**🟢 Highlights**: Meta ROAS reached 3.11x (+8% WoW), driven by the new prospecting bucket Meta launched on Jun 09.

**🔴 Issues & Risks**: Google ROAS dropped from 4.39 → 3.87 (−12% WoW). Suspect brand-search saturation; see anomaly diagnosis.

**💡 Next Week Recommendations**:

1. **Meta**: Increase prospecting bucket budget by 15% — expected impact: maintain ROAS, +\$25K revenue.
2. **Google**: Review brand-search bid caps — expected impact: recover some efficiency.

**Test run looks good**: all channels populated, WoW deltas computed, no empty rows. Activate.

#### Step 7 — Activate

Call `create_scheduled_task` with the resolved params. Confirm:

> Scheduled. Next run: **Monday, Jun 23 at 09:00** (your timezone). You can pause or edit this in **Scheduled Tasks**.

#### Step 8 — End turn

No follow-up question.

### What this example illustrates

- **One pivotal clarification** (delivery channel) — everything else defaulted
- **Template-driven layout** — agent did not invent a report structure; copied `templates/weekly-report.md`
- **Test run before activate** — caught no issues here, but the discipline is what matters
- **WoW length-aligned** — Jun 09–15 (Mon–Sun) vs Jun 02–08 (Mon–Sun)
- **Highlights / Issues thresholds**: Meta +8% didn't auto-qualify for Highlights but it was the only positive mover; Google −12% didn't quite hit the −20% threshold but the SQL test run flagged it as the biggest absolute mover. Threshold rules are guidelines, not strict — agent uses judgment.
- **No internal terms** in the report — no "Cron", no "task_id", no "ctx timestamp"
