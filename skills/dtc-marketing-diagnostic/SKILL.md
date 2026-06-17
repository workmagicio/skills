---
name: dtc-marketing-diagnostic
description: End-to-end structural growth diagnostic for North American DTC e-commerce brands. From a single tenant_id, produce an operator-voice report + a multi-sheet Excel data pack (and optionally a Lark Doc/Sheet) in ~30 minutes — current channel architecture, unit economics, dimensional gaps, hidden compounding hooks, and a 90-day plan. Use for QBR prep, new-client onboarding audits, scale decisions, and "where are the gaps and opportunities" conversations. Not for same-day anomaly response, this-quarter budget math, or platform-vs-WorkMagic number disputes.
---

# dtc-marketing-diagnostic

## 1. Purpose
Run a **structural quarterly growth diagnostic** for a North American DTC e-commerce brand, end to end, from a single `tenant_id`. The skill walks 7 phases automatically and produces:
- an **operator-voice markdown report** (current channel architecture, unit economics, dimensional gaps, the brand's hidden compounding hook, and a 90-day plan),
- a **multi-sheet Excel data pack** (every row tagged `tenant_id` for cross-customer analysis),
- optionally a **Lark Doc + Lark Sheet** auto-imported via `lark-cli`.

This is a **structural diagnostic** — the brand's current channel architecture, unit economics, dimensional gaps, hidden hooks, and a forward plan. It is **not** a same-day anomaly response and not a budget-math exercise.

## 2. When to trigger / when not to
Trigger when the brand is a North American DTC e-commerce brand at ~$5M+ annualized GMV with ≥ 3 paid channels active, and the ask is one of:
- *"Where should we scale this account next quarter?"* (QBR prep, scale-decision conversations)
- *"Run a growth audit on this new client."* (post-onboarding diagnostic, before the first MBO / lift-test cycle)
- *"What are the gaps and opportunities in this account?"* (architecture review, mid-quarter check)
- *"Show me the winning factors across platforms."* (cross-channel pattern hunt)

Invocation examples (any of these activate the skill):
- `Run a growth audit on tenant <tenant_id>`
- `Prep QBR for tenant <tenant_id>`
- `Scale this customer: tenant_id=<tenant_id>`
- `诊断 tenant_id=<tenant_id>`

**Do NOT trigger** (route elsewhere):

| The ask is… | Right tool |
|---|---|
| "CPA spiked yesterday" / "ROAS dropped this week" | `attribution-anomaly-diagnosis` |
| "How should I reallocate this quarter's budget?" (budget math) | `mbo-create-scenario` |
| "Meta vs WorkMagic numbers disagree" | a platform-vs-WorkMagic number-reconciliation check |
| Tracking unmatch > 20% on a major channel | UTM-health / "account connected but no data" troubleshooting |
| Account has < 90 days of data | Don't run yet — wait for data maturity |

## 3. Prerequisites — don't run the diagnostic until these are all true
- [ ] **Tenant has ≥ 90 days of paid spend data** in the warehouse (180d preferred for seasonality coverage)
- [ ] **All major paid channels connected** (Meta, Google, and at least one of: TikTok / Snapchat / Pinterest / Applovin / Microsoft)
- [ ] **Shopify (or primary store) connected** with order-level data flowing — confirm `ads_view_overview_sales_and_profit_latest` returns rows
- [ ] **Tracking unmatch < 20%** on the major channels (e.g., 15%+ unmatch on Google PMax is a signal to fix tracking *before* believing the diagnostic)
- [ ] **Operator has `lark-cli` authed** with `docs:read docs:write drive:upload base:record:write`
- [ ] **Operator has warehouse access** via the `workmagic_query` MCP

If any box is unchecked → fix that first. **A diagnostic on broken inputs is worse than no output — it looks authoritative but is wrong.**

## 4. SOP — 7 phases from `tenant_id` to a client-ready deliverable
The skill runs all 7 phases in sequence, surfacing decisions at each gate. Each phase below describes what to verify and where to intervene if something looks off. Total runtime ≈ 30 minutes for a comprehensive 180d diagnostic on an 8-channel account.

### Phase 1 — Boundary Recon (~5 min)
Pull a data-completeness manifest: per-channel min/max date, spend, orders, sales, tracking-unmatch ratio. **Goal: confirm the data window is real before drawing conclusions.**
Watch for:
- A channel showing $5M+ spend with **0 attributed orders** → that's a tracking break, not a media problem (commonly a prospecting campaign reporting spend but no attributed orders).
- A GMV-Max-style campaign showing 0 in `attr_model_array` model 31 but real numbers in model 32 → switch to model 32 for omnichannel brands.
- The `attr_enhanced` filter must be `IN (1, 4)` to exclude fully-modeled rows.

### Phase 2 — Archetype + Dimension Discovery (~10 min)
Place the customer on a 5-axis archetype (geo / subscription mix / channel breadth / creative motion / hero product). Then mine for non-obvious dimensions: naming-convention-parsed campaign tags, Shopify `product_type` / tags, audience patterns, creative formats, landing-page URL patterns.
**The Mined dimension is where the differentiated insight comes from.** Examples of Mined dims that are typically *not* in the priors: a whitelisted-video creative format, a specific product line, a pre-order SKU pattern.

### Phase 3 — Unit Economics + Hidden-Hook Hunt (~10 min)
Monthly trend: AOV, gross margin, post-ad net margin, blended CAC, MER, profit-per-dollar-spent. Then run a cross-data-source SKU/cohort hunt for the brand's **compounding hook** — the hidden mechanic that compounds retention/LTV (bundle-attach mechanic, pre-order cash-flow trick, subscription trial, free-gift gating).
**Definition of Done item:** either find the compounding hook, or explicitly state *"no significant cross-product hook found after checking SKU / orders / cohort."*

### Phase 4 — Channel Architecture + Leverage + Calibration (~10 min)
Build a per-channel **"What It's Doing | Verdict"** table — every active channel decoded into operator language. Then run a 5-leverage scan (mismatch fix / untapped / sleeping asset / scale opportunity / measurement gap). Finally, assess lift-test calibration coverage — which channels are tested, which aren't.
**The single most important question this phase answers: "What's the largest untested $ in the account?"** For most $1M+/month DTC brands the answer is Meta — and the recommendation is to run a Meta geo-holdout lift test before approving any Meta scale-up.

### Phase 5 — Risk + Opportunity Map (~5 min)
Verdict every finding into one of: **Must-do / Should-do / Could-do / Defer**. Anything below *Must-do* does not make the 90-day plan.

### Phase 6 — Render Output (~5 min, automated)
Two products + one optional Lark surface:
1. **Markdown report** — fixed 13-chapter structure (Snapshot → CMO Strategic View → Unit Economics → Per-Platform Audit → Dimension Pivots → Hidden-Hook Hunt → 90-Day Plan → What I'd Watch Next).
2. **Excel data pack** — ~22 sheets including a `_TOC` with drill-down questions; every row tagged `tenant_id` for cross-customer union analysis.
3. **Lark Doc + Lark Sheet** (optional) — auto-imported via `lark-cli` so drill-downs work in the browser.

Reports must pass the **Definition of Done** in §5 below before delivery.

### Phase 7 — Pattern Learning (post-delivery)
Append non-obvious findings to a candidate-patterns log: Mined dims not yet in the priors, channel architectures that don't match existing types, compounding-hook variants, failed hypotheses. After 3+ customers show the same candidate, promote it to the priors — **manual review only; the skill never auto-edits priors.**

## 5. Definition of Done — checklist before delivering
- [ ] Every active channel has a **Verdict** table (Phase 4)
- [ ] Every gap has a narrative title (not a bare metric)
- [ ] The action plan is **100% imperative** with keyword / audience / bid-level detail
- [ ] No hedging language (see §6)
- [ ] No self-referential / meta sections
- [ ] The compounding hook is either found or explicitly ruled out (Phase 3)
- [ ] A **methodology / calibration doc** is generated alongside the main report
- [ ] CMO Strategic View reads as a standalone executive summary
- [ ] Excel data pack drill-downs work (in Lark Sheet if imported)
- [ ] **No `tenant_id`, brand name, or API key leaks into any output bound for outside the company.** This diagnostic defaults to *Audience Scope: Internal Only* — there is no client-facing variant; scrub before any external share.

## 6. Calibration philosophy — defending the numbers
Every diagnostic ships with a **methodology doc** explaining each metric's data source, aggregation logic, and confidence rating. This is non-negotiable for client-facing delivery — without it, any number can be challenged into uselessness.

Confidence rating system:
- ⭐⭐⭐⭐⭐ — direct from a warehouse field (spend / orders / sales / margin / `attr_new_customer_net_profit`)
- ⭐⭐⭐ — derived from campaign-name parsing (ABO/CBO/ASC, Brand vs Non-Brand Search) — accuracy depends on naming consistency; ±10% drift expected
- ⭐⭐ — estimation (funnel-stage % allocation, bundle attach rate) — ±20% drift expected; flag explicitly

Hedging is allowed in only two phrases:
- ✅ *"This is a hypothesis worth testing."*
- ✅ *"Insufficient data to call."*

Everything else must be imperative + numbered. No "should" / "suggest" / "consider" / "approximately."

## 7. When to escalate to a lift test
The diagnostic surfaces hypotheses; lift tests close them. Escalate to a paid lift test when:
- Channel spend > $5M/180d **AND** no recent lift test (last 6 months) **AND** the channel is in the top 3 by spend share.
- A recommended channel cut > 30% would represent > $1M/quarter — validate with a holdout before pulling the trigger.
- The diagnostic flags an **attribution-inflated** channel (e.g., catalog/DPA or retargeting-likely) reporting > 10x ROAS — an incrementality test is mandatory before scaling.
- The client pushes back on a recommendation and wants proof before acting.

For Meta specifically: **never approve a Meta budget increase on accounts > $5M/quarter Meta spend without a calibrating lift test on file**, regardless of what the diagnostic recommends.

## 8. How to present to the client
The deliverable is **dual-audience**: the markdown report reads top-to-bottom for an operator (CSM / AM / brand-side media buyer), while the CMO Strategic View section is the executive summary a CMO/CFO can consume in 5 minutes.

Standard QBR framing:
> "We ran a structural diagnostic of your last 180 days across all paid channels using WorkMagic's incrementality-calibrated attribution.
> **Snapshot:** [the one-liner that captures the model's strength + biggest risk in plain English]
> **Three things are working:** [pick 3 verdicts marked ✅]. **Three things are bleeding:** [pick 3 marked 🔴, lead with the largest $ exposure].
> **The 90-day plan:** five actions this week (mostly cuts), seven this month (rebalances), five structural this quarter (lift tests + a retention budget line + LAL diversification).
> **The Excel data pack is the underlying evidence** — every claim in the report has a sheet you can drill into."

For the CFO / leadership angle, lead with the **Profit Health Check + Unit Economics**: gross-margin trend, post-ad net margin, and new-customer net profit by channel (the "first-order P&L" that strips returning-customer credit). This is where the uncomfortable conversations live — e.g., *"Meta is deeply net-negative on new-customer acquisition over 180d, only profitable on aggregate because returning purchases credit back to it."*

## 9. Edge cases & routing

| Symptom | Right tool / action |
|---|---|
| "CPA spiked yesterday" / "ROAS dropped this week" | `attribution-anomaly-diagnosis` |
| Operator wants to reallocate this quarter's budget mathematically | `mbo-create-scenario` |
| Meta self-reported ROAS ≠ WorkMagic ROAS, client confused | platform-vs-WorkMagic number-reconciliation check |
| Tracking unmatch > 20% on a major channel | UTM-health / "account connected but no data" troubleshooting |
| Account has < 90d of data | Don't run this diagnostic yet — wait for data maturity |
| Client wants to present marketing ROI to CFO | Pair the CMO Strategic View output with an executive-ROI presentation |

## 10. Failure modes (never do these)
- **Run on broken inputs** — if any §3 prerequisite fails, fix it first. An authoritative-looking wrong report is the worst outcome.
- **Trust a channel with $5M+ spend and 0 attributed orders as a media problem** — it's a tracking break; diagnose tracking first.
- **Skip the compounding-hook hunt** — either find it or explicitly rule it out.
- **Leave the largest untested $ unflagged** — Phase 4 must name it and recommend a lift test.
- **Approve a Meta scale-up on a >$5M/quarter Meta account with no calibrating lift test on file.**
- **Hedge** — no "should / suggest / consider / approximately." Only the two allowed hypothesis phrases (§6).
- **Ship without the methodology / calibration doc** — every client-facing number must be defensible.
- **Leak `tenant_id` / brand name / API key into any externally-bound output** — Internal Only by default; scrub before sharing.
- **Auto-edit the priors** — Phase 7 promotion is manual review only.
