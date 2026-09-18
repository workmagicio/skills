---
name: lift-test-creation
description: Turn a natural-language request — a scope or just a cell count, plus any constraints — into an executable lift test draft.
category: lift-test
risk: R0
version: 2.0.0
last-updated: 2026-09-14

references:
  - references/input-parsing.md
  - references/constraints.md
  - references/solve-loop.md
  - references/sop-detail.md
  - references/output-templates.md
  - references/edge-cases.md
  - references/failure-modes.md
---

## 1. Purpose

Turn the user's natural-language request into a **well-configured, executable lift test draft** and land it in the platform. Do not make undisclosed key decisions on the user's behalf, do not expose internal parameter names, do not create a test when conditions aren't met.

Two things are load-bearing:

- **The user may enter from either end** — by naming *what* to test (platform / tactic / campaign), or by naming *how many cells* they want. Both are valid starting points; neither is required if the other is present.
- **The user may attach constraints** (budget, test period, geo inclusion/exclusion, treatment geo size, CPA, concurrency). Every stated constraint is either **honored** or its **gap is quantified** — never silently dropped, never quietly relaxed.

Default creation skill in the Lift Test domain.

## 2. When to trigger

**Trigger condition**: The user's request contains a verb like "create / set up / run / launch / start" plus an object that points to "experiment / lift test / incrementality test / measure incrementality."

**Examples that should trigger this skill**:

- "Create a lift test for me"
- "Run a Meta lift test"
- "Set up a lift test on Meta at the tactic level"
- "Set up a 3-cell test" *(cell-count entry — no platform named)*
- "I want a 2-cell test on my biggest channel"
- "Run a Meta lift test in the US but exclude New York and California"
- "Create a lift test that doesn't overlap with the test I already have scheduled"
- "Meta lift test, keep the holdout under 8% of orders, budget under $3k/day"
- "Run a Meta test assuming a $40 CPA"

**Examples that should NOT trigger this skill — route elsewhere**:

|Input pattern|Route to|
|---|---|
|Query results / progress of an existing lift test|lift-test-readout|
|Compare multiple completed tests|lift-test-readout|
|"Why did my test fail / come back inconclusive?"|lift-test-diagnosis|
|Conceptual questions about PTM vs. LTM / wanting documentation|knowledge-base-ask|
|**Test built on a non-standard metric** (custom SQL, imported feed, bespoke definition)|**Data Science (DS)** — see §3|
|**Creative test** ("compare these two creatives / this ad vs. that ad")|**Data Science (DS)** — see §3|

## 3. Boundary

This skill builds **standard geo lift tests on standard metrics**. Anything outside that is not half-built, not approximated, and not "attempted anyway" — it is routed to DS with a handoff summary.

**In scope**

- Geo-based lift tests, 2–5 cells (up to 4 impact groups), on the 7 supported countries (US / AU / CA / FR / DE / UK / ES) and their geo levels
- Standard metrics from the platform metric registry — **orders** and **new customers**
- Scope at platform / tactic / campaign level
- The six constraint types in §4.C

**Out of boundary — route to DS, do not build**

|Out-of-boundary case|Why|What to say|
|---|---|---|
|**Non-standard metric definition** — custom SQL metric, imported / offline feed, any metric needing bespoke logic to compute|The design and readout engines expect registry metrics; a bespoke definition changes the power calculation and the readout, not just the label|"That metric needs a custom definition before it can be tested — I'm passing this to Data Science with what you've told me."|
|**Creative test** — "creative A vs. creative B", "test this new video"|Geo lift measures the incrementality of *spend* on a channel / tactic / campaign. It cannot isolate creative-level effects; geo splits don't cleanly separate creatives|"Geo lift can't isolate creative-vs-creative effects — it measures incrementality of spend on a channel, tactic, or campaign. Data Science can advise on the right design here."|
|**Solve loop exhausted** — 3 rounds, still no feasible design|Further levers would require assumptions the skill shouldn't invent|See references/solve-loop.md — DS handoff format|
|**≥ 6 cells**|Outside the supported design range — the ceiling is 4 impact groups plus one shared reference group|State the 2–5 range; offer to split or to route|
|**Non-geo design** (user-level split, audience holdout, platform-native experiment)|Different product surface|Route to DS|

**Routing rules**

- Do **not** create a partial draft "to save progress" when the request is out of boundary.
- Do **not** promise DS a turnaround or a specific outcome.
- Do include the handoff summary (what was asked, what was resolved, what blocks it).
- If the request is *partly* out of boundary (e.g. a standard 2-cell Meta test **plus** a creative comparison), **the whole request goes to DS** — don't build the in-scope half and route the rest. Splitting the request splits the design decision, and DS needs the full picture to advise on either part.

## 4. Inputs

### The full field set

Everything to collect or resolve **before** the design call, and where each value comes from. The sections below cover how the non-obvious ones get resolved.

The last six are constraints: optional, not create-payload fields, and they only *bound* a design output rather than set it. Phrasing and interpretation → §4.C and references/constraints.md.

### A. Test structure — `adPlatform` / `testLevel` / `impactCampaignInfos` **⇄** `numberOfCells` (either / or)

These are two ways of describing the same thing. The user supplies **one side**; the skill derives the other and confirms it in Step 4.

|Field|Required?|Description / default|
|---|---|---|
|adPlatform|**Either/or**|The ad platform(s) named (Meta, Google, TikTok…). **Apply alias mapping silently** (FB→Meta, GA→Google Ads, IG→Meta).|
|testLevel|**Either/or**|platform / tactic / campaign. If the user named a scope but not a level, ask in business language ("Test the entire account, a specific tactic, or particular campaigns?").|
|impactCampaignInfos|**Either/or**|Tactic ID(s) when testLevel = tactic; campaign ID(s) when testLevel = campaign. Fetch candidates with lift-test-impact-campaigns.|
|numberOfCells|**Either/or**|2 – 5. **A cell count is a valid complete request on its own.** N cells = (N−1) impact groups + 1 shared reference group, so 5 cells is the ceiling: 4 impact groups.|

**Resolution rules**

|User gave|Do this|
|---|---|
|Scope only ("Meta, tactic level, Prospecting")<br>|Derive numberOfCells = distinct impact groups + 1. Don't ask for the cell count.|
|Scope with multiple things ("Meta and Google")|Two impact groups → **3-cell test with one shared reference group**. Explain the shape in business language in Step 4.|
|Cell count only ("set up a 3-cell test")|Take it at face value. **Don't propose or fill in a platform, tactic or campaign** — run the design on the cell shape and leave the per-cell scope for the user to set in the draft. Say so in Step 4.|
|Both, consistent|Proceed.|
|Both, inconsistent ("4-cell test on Meta only")|Clarify once: is the extra cell a second tactic on Meta, another platform, or did they mean 2-cell?|
|Neither|Ask **one** question that offers both framings: "What should this test measure — a specific platform or tactic, or do you just want a standard 2-cell test on your biggest spender?"|
|≥ 6 cells|Out of boundary — §3.|

### B. Fields with defaults — resolve silently, confirm in Step 4

|Field|Required?|Description / default|
|---|---|---|
|salesChannel|Has default<br>|Query DB for the tenant's connected sales channels, show them for confirmation. Default all selected (every channel in **Ready** or **Not optimal**).|
|primaryMetric|Has default|**orders** or **new customers** — these are the only two. Default orders; switch to new customers when the user says "acquisition / new customer". Anything else → out of boundary (§3).|
|country|Has default|Query trailing-90-day sales share, auto-pick the dominant country. Supported (**7 countries**): **US / AU / CA / FR / DE / UK / ES**. Others error out — never hard-build.|
|geoLevel|Has default|Derive from country: US → DMA; others → postcode. **US state only when the user explicitly says so.**|
|status|Default|Default **draft**. Don't go straight to schedule unless the user explicitly says so.|

### C. Constraints — all optional

**Constraints are volunteered, or invited once.** Don't interrogate the user constraint by constraint in Step 2. Instead, close the Step 4 confirmation with a single open ask — "anything else to factor in? budget ceiling, a deadline, geos to leave alone, a CPA you'd rather I use" — naming two or three examples so the user knows what's on the table, then move on. One open question, one turn. If they say no, don't raise it again.

|Constraint|Typical phrasing|Maps to|Detail|
|---|---|---|---|
|**Concurrent-test requirements**|"don't overlap with the test I have scheduled", "avoid the geos in draft #1183", "that draft is dead, ignore it"|locationSetting auto-exclusion set — which other tests' geos are carved out|references/constraints.md|
|**Geo constraints**|"exclude NY and CA", "only run in the Midwest", "don't pause Texas"|locationSetting include / exclude + treatment-side pinning|references/constraints.md|
|**Treatment geo size**|"keep the holdout small", "no more than 10% of orders", "I can't pause more than a handful of DMAs"|geo-size bracket (Minimum → 5% → 10% → 15%)|references/constraints.md|
|**Budget**|"under $3k/day", "$50k for the whole test"|Feasibility ceiling in the design check. **Daily vs. total must be disambiguated once.**|references/constraints.md|
|**Test period**|"4 weeks", "finish before July 15", "as fast as possible"|testPeriod target, or deadline → back-solve|references/input-parsing.md|
|**CPA estimate**|"assume a $40 CPA", "we run about $35 CPA on Meta"|Input to expected-daily-spend / feasibility computation — replaces the derived estimate|references/constraints.md|

**Default behaviors when no constraint is given** — resolved silently, never raised as questions: the tenant's currently scheduled + active tests are auto-excluded from the geo pool; geo size, period and method come from design; no budget ceiling or CPA override is applied.

### D. Never asked

|Field|Behavior|
|---|---|
|testStartTime|**Optional. Never asked.** Honor it if the user states one (**never accept a past date**). If they don't, leave it unset on the draft and say so in the handoff — the user sets it when they schedule. If the stated date overlaps a scheduled / active test, **check whether that test's geos overlap this design's pool** — surface both the date overlap and the specific geo conflict once, then respect their choice.|

## 5. SOP

### 5.1 Steps

1. **Parse the request.** Resolve every field present in the wording — aliases, scope *or* cell count, time, geo, and **every constraint in §4.C**. Record what's specified; never re-ask it. Check the §3 boundary before anything else.
2. **Resolve the test structure.** Apply the §4.A either/or table. Ask at most one question, and only when neither side was given (or the two sides conflict).
3. **Resolve defaults.** Run lift-test-scan for: current spend, PTM-sufficiency signal, and scheduled / active tests for collision avoidance. Query DB for sales channels and country. Apply any stated constraints to the inputs before design.
4. **Confirm — the ONLY full-config confirmation gate.** Echo all collected + resolved fields in business language: scope or **cell shape**, **sales channels**, **primary metric**, **country + geo level**, method, and a **read-back of every constraint** the user stated. Surface override conflicts once; don't lecture. → references/output-templates.md
5. **Call lift-test-design-prepare → lift-test-design.** One call, one return: geo pair, test period, geo size, feasibility threshold, expected daily spend, **Sufficient / Insufficient**, and the **PTM / LTM recommendation**. Sufficient and every stated constraint honored → Step 7. Anything else — no viable pair, Insufficient, or a violated constraint — is **not** an error message; it enters the solve loop → Step 6.
6. **Solve loop — max 3 rounds.** Insufficient, or a Step 5 failure: quantify the gap in concrete numbers → present the levers, each with the number it moves and the constraint it would break → **the user picks** → re-solve. Three rounds without a feasible design → stop and route to DS with the handoff summary. "Proceed as-is" exits the loop at any round. → references/solve-loop.md
7. **Push the test as a draft via lift-test-create-or-update. **One draft per test, whatever the cell count — a 3-, 4- or 5-cell test is one draft carrying all its cells. Creates a new draft, or updates an existing one when the user is modifying a draft they already have. No second full-config confirmation. Return the draft link, plus the start-date note and any "proceed as-is" caveat. → references/sop-detail.md
8. **Build the design deck — only when asked.** When the user wants a client-facing test plan ("design deck", "test plan deck", "slides I can walk the client through"), don't narrate the design in chat — run the deck skill on the Step 7 draft: a 2-cell draft → 2-cell-test-design-deck; a 3-cell or larger draft → multicell-design-deck, which expands the cells from that one draft. Two intake answers before building: show the feasibility threshold on the deck (yes / no), and for 3 cells or more, add the PTM-vs-LTM comparison page (yes / no). Output: two editable Google Slides in the client's Partnership-drive folder › Lift Test Design — the client design deck and an INTERNAL validation deck. If the skill refuses the draft, relay its reason and the choice the user has to make. Never rebuild the deck by hand, and never paste its MDL or geo lists into chat (§7). → references/output-templates.md, Step 8

### 5.2 Validation checkpoints

Multi-step SOP — the agent must pause and surface at these gates, never autopilot through:

|After step|Pause and surface|
|---|---|
|Step 2|Only if a question is genuinely needed — structure or a conflicting either/or.|
|Step 4|Full-config summary in business language, incl. cell shape + constraint read-back. **This is the only full-config confirmation gate.**|
|Step 5 (design back, Sufficient)|Progress update only: test period + feasibility + method. Do **not** restate full config, and do **not** ask for start date.|
|Step 6 (each round)|Quantified gap + levers with numbers. User picks; **never pick for them**. Say which round this is when on round 2 or 3.|
|Step 6 (exhausted)|DS handoff summary. Nothing gets built.|
|Step 7|Draft link. Done. No final-confirm table.|

**Autopilot is forbidden at these gates.** The Step 4 single-confirmation rule, the no-double-confirm rule (Step 7), and the user-picks-the-lever rule (Step 6) are the most-violated invariants — see §9 CRITICAL.

### 5.3 Input-quality routing

|User provided|Path|Expected quality|
|---|---|---|
|Full spec (platform + level + tactic/campaign)|Resolve defaults → Step 4 → design → create|high|
|Cell count only ("3-cell test")|Resolve defaults → Step 4 (scope left open) → design → create|high|
|Partial spec (platform only)|Ask for the missing structure piece; defaults for the rest, surfaced in Step 4|medium-high|
|"Create a lift test for me"|One structure question offering both framings; defaults elsewhere; cap at ≤ 3 turns|medium|
|Spec + constraints ("Meta, under $3k/day, finish by Jul 15, avoid my running test")|Parse all constraints; conflicts → clarify once; infeasible → solve loop with quantified gaps|medium — depends on feasibility|
|Constraints only, no structure|Resolve structure first (Step 2), then apply constraints|medium|
|Ambiguous geo / time / budget-unit references|Clarify once (not a loop)|depends on clarification|
|Out of boundary (creative test, custom metric)|Don't build; route to DS with handoff|n/a|

## 6. Tools used

|Tool|Required?|Purpose|
|---|---|---|
|lift-test-scan|Required|Current ad spend, scheduled / active tests, PTM-sufficiency signal|
|lift-test-impact-campaigns|Required|Candidate list when testLevel = tactic / campaign|
|lift-test-design-prepare|Required|Package collected + resolved parameters (incl. constraints) into design inputs|
|lift-test-design|Required|The whole design step. Returns the geo pair, test period, geo size, feasibility threshold, expected daily spend, Sufficient / Insufficient, and the PTM / LTM recommendation|
|lift-test-design-analyze|Optional|Standalone re-check when a solve-loop lever changes only a non-geo input (budget ceiling, CPA estimate, daily spend) and a full re-design isn't warranted|
|lift-test-create-or-update|Required (final step)|Push the test as a single draft, all cells included — **create** a new one, or **update** an existing draft the user is modifying|
|lift-test-list|Optional|"What tests have I created before"; resolving a named draft in a concurrency constraint|
|lift-test-get|Optional|Pull an existing draft — mid-flow modification, or reading the geos of a draft named in a concurrency constraint|

**Design-deck skills (Step 8).** 2-cell-test-design-deck and multicell-design-deck are Claude Code / Cowork skills, not MCP tools. They read the warehouse through the workmagic_query connector, need Python 3.10+ and Google Chrome, render an editable .pptx, run their own verification, and publish to Google Drive with a bundled service account. Input is the Step 7 draft link plus the two intake answers — nothing else.

## 7. Output format

- **Business language only** — no holdoutPct, MDL, experiment_days, attr_model_name, facebookMarketing in chat output.
- **UI-aligned field names**: "Test period" (not "Experiment days"), "Feasibility threshold" (not "Expected daily spend"), "Geo size" (not "Geo coverage" / "holdout percentage").
- **Cells are now user-facing vocabulary.** When the user talks in cells, talk back in cells — and explain the shape once: "A 3-cell test means two things measured against one shared reference group." Still never *ask* the user to pick a cell count when they've already told you what to test.
- **Method-specific treatment-side labels** (matches product UI): PTM → "Holdout group"; LTM → "Exposed group"; reference side, any method → "Reference group". Never use "Holdout group" in an LTM column. Never invent a unified "Treatment group".
- **First mention of PTM / LTM** gets a one-line inline explanation: "PTM (pause-to-measure — pause ads in a subset of geos)". After that, the acronym alone is fine.
- **Constraints get read back explicitly** in Step 4, in the user's own terms ("Budget: under $3k/day", "Won't touch the geos in your scheduled Google test").
- **The design result is a table**, not a sentence — test period, geo size, the treatment geos by name, and the feasibility threshold as a specific number against the spend it's compared to.
- **Gaps get numbers**, never adjectives. "~$700/day short" beats "a bit under what's needed".

All output templates (Step 4 summary, solve-loop rounds, design comparison, DS handoff, draft link) → references/output-templates.md

**The design deck is the one output where the banned figures appear.** Chat keeps the rules above — no MDL, no reference-group geo list. The deck built in Step 8 is a client document produced by the deck skills, and it carries what chat must not: the multi-cell deck prints each cell's MDL as a percentage (two-sided, at the test's planned length) under a red framed "ONLY SHARE ON CLIENT'S REQUEST" tag, gives every cell two Geos pages — market names, then the DMA / geo codes — and labels the cost figure by the test's own primary metric (cost per incremental order / incremental CAC / cost per incremental sale), never a blanket "iCAC"; both decks list the Reference group beside the treatment markets, and state the feasibility threshold, when shown, as a floor for the planned window rather than a spend cap. Treatment-side labels follow the method exactly as in chat. Don't copy any of these back into chat — send the link.

## 8. Edge cases & routing

See references/edge-cases.md — covering unsupported country, cell-count conflicts, mid-flow modification, ambiguous geo names, Not-ready sales channels, design failures, dead drafts in concurrency constraints, out-of-boundary requests.

## 9. CRITICAL rules (top 7)

1. **Never hard-build when constraints aren't satisfiable.** State the gap with numbers. Give the levers. Unsupported country, past start date, infeasible budget — surface, never silently default.
2. **Never re-confirm the full config after Step 4.** Step 4 is the ONLY full-config gate. After design, inside the solve loop, before create — progress updates and specific local questions only. "Shall I create the draft now?" is the most common regression.
3. **Never pick the lever for the user.** In the solve loop the skill quantifies and offers; the user chooses. Re-solving with an unrequested lever is a silent override.
4. **Cap the solve loop at 3 rounds, then route to DS.** A fourth round is a failure mode, not persistence. Carry the handoff summary.
5. **Respect the boundary.** Non-standard metric definitions and creative tests are not approximated, not partially built — they go to DS (§3).
6. **Never override a user's explicit choice silently.** LTM when PTM is recommended, a geo they excluded, a budget ceiling they set — surface once, respect the decision.
7. **Never expose internal parameter names.** holdoutPct, MDL, experiment_days, attr_model_name, raw API platform IDs. (numberOfCells is the exception — it is user-facing *when the user raises it*.)

Full failure-modes catalog → references/failure-modes.md

## 10. Related skills

|Skill|Relationship|
|---|---|
|lift-test-readout|Downstream: reading and acting on results — iROAS, confidence intervals, post-test decisions|
|lift-test-diagnosis|Downstream: diagnosing failed or inconclusive tests — implementation drift, data readiness gaps, underpowered designs|
|Data Science (DS)|Escalation target for out-of-boundary requests and exhausted solve loops|
|2-cell-test-design-deck|Downstream (Step 8): turns a 2-cell draft into the client design deck — editable Google Slides in the client's Drive folder|
|multicell-design-deck|Downstream (Step 8): turns a 3-cell or larger draft into one merged client design deck plus an internal validation deck|
