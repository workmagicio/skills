## Example A — "Meta ROAS dropped last week" (swing diagnosis)

End-to-end walkthrough of the most common case: a sudden ROAS drop on Meta, diagnosed through the 5-step tree.

### User input

*"Why did Meta ROAS drop last week? It used to be 4.2x, now showing 2.6x."*

### Step-by-step

#### Step 0 — knowledge-base-ask

Ask: *"How to compare attribution models in dws_view_analytics_attribution_channel_level_latest?"* → returns ctx timestamp.

#### Step 1 — Lock the scope

Copy `templates/01-scope-lookup.sql`, fill: `ads_platform=Meta`, baseline = prev 7 days, anomaly = last 7 days. Result: iDDA dropped 38%, DDA dropped 12%, Any Click flat. **iDDA is the diverging model.**

#### Step 2 — Classify

Numeric value exists, sharp drop. **Type: attribution swing.**

#### Step 3a — Spend check

Copy `templates/02-spend-vs-attribution.sql`. Spend flat WoW (\~\$50K both weeks). **Not proportional → continue.**

#### Step 5, Branch C — iDDA

**C1**: iDDA diverges from DDA significantly (38% vs 12%). → continue to C2/C3.

**C2 PPS**: no daily revisions, value drop is week-on-week not retro-edits. → unlikely PPS.

**C3 Lift test**: copy `templates/07-lift-test-results.sql`. Latest lift test for Meta completed 5 days before the anomaly window. `LIFT_PCT` = 0.18 (down from 0.42 previous), `auto_apply=1`. **This is the trigger.**

#### Step 6 — Skip (cause found at C3)

### Output (customer-facing)

<callout emoji="📊">
**Attribution Diagnosis · Meta / All tactics**
**Period**: Jun 8–14 (baseline: Jun 1–7) · **Sales platform**: Shopify · **Attribution model**: iDDA
**What we found**  
Meta ROAS dropped from 4.2x → 2.6x (−38%) week-over-week. Spend was flat, so the drop comes from attribution, not investment.
**Why it happened**  
A new lift test for Meta completed on Jun 3 with a 0.18 incrementality result (down from 0.42 in the previous test). iDDA retroactively recalibrated Meta's weight downward when this result was applied — the new ROAS reflects a more accurate estimate of true incrementality, not a real performance drop.
**What you can do**  
1. Treat the new ROAS as the better baseline going forward.  
2. If you suspect the test ran in atypical conditions (promo / holiday), loop in your CSM to schedule a refresh once the environment is stable.
*Diagnosis attribution model: iDDA. Data as of: 2026-06-15 10:32 PT.*
</callout>

### What this example illustrates

- **Step 1 locks scope first** — without it you don't know iDDA is the broken one
- **Step 3a stops early when spend is proportional** — but here spend was flat, so continue
- **Branch C order matters**: DDA → PPS → lift test (don't jump to lift test first)
- **Lead with "expected behavior"** — the recalibration is the system working as designed; the customer-facing explanation says so explicitly so they don't think it's a bug
- **No internal terms in output** — no `model_id`, no Branch C3, no table names
