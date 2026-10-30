---
name: lift-test-creation
description: Turn a natural-language request — a scope or just a cell count, plus any constraints — into an executable lift test draft.
category: lift-test
risk: R0
version: 2.5.2
last-updated: 2026-10-30
references:
- references/input-parsing.md
- references/constraints.md
- references/solve-loop.md
- references/auto-solve.md
- references/sop-detail.md
- references/create-update-params.md
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
- "Create a lift test with design online-6fec4a9d…d52_1" *(a design id named — §5.5, no new solve)*

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

This skill builds **standard geo lift tests on standard metrics**. Anything outside that is not half-built, not approximated, and not "attempted anyway" — it is routed to DS with a handoff summary, and the hand-off is offered as a CS task — preview first, filed with cs-task-create only on the user's yes (references/solve-loop.md). The same applies to a design that can't be formed (an exhausted solve loop).

**In scope**

- Geo-based lift tests, 2–5 cells (up to 4 impact groups), on the 8 supported countries (US / UK — passed as `GB` / CA / DE / FR / AU / ES / SE) and their geo levels
- Standard metrics from the platform metric registry — **orders** and **new customers**
- Any lift-test-ready sales channel — including **custom** (a self-built store) and **imported** sales channels. The "imported / offline feed" boundary below is about a non-standard **metric definition**, not about which sales channel the orders come from
- Scope at platform / tactic / campaign level
- The six constraint types in §4.C

**Out of boundary — route to DS, do not build**

|Out-of-boundary case|Why|What to say|
|---|---|---|
|**Non-standard metric definition** — custom SQL metric, imported / offline feed, any metric needing bespoke logic to compute|The design and readout engines expect registry metrics; a bespoke definition changes the power calculation and the readout, not just the label|"That metric needs a custom definition before it can be tested — that's Data Science's call. I can file it as a task for them with what you've told me:" → hand-off summary + CS task preview|
|**Creative test** — "creative A vs. creative B", "test this new video"|Geo lift measures the incrementality of *spend* on a channel / tactic / campaign. It cannot isolate creative-level effects; geo splits don't cleanly separate creatives|"Geo lift can't isolate creative-vs-creative effects — it measures incrementality of spend on a channel, tactic, or campaign. Data Science can advise on the right design here — I can file it as a task for them:" → hand-off summary + CS task preview|
|**Solve loop exhausted** — 3 rounds, still no feasible design|Further levers would require assumptions the skill shouldn't invent|Hand-off summary, then file it as a CS task for Data Science with cs-task-create — **preview first, call only on the user's yes**. → references/solve-loop.md|
|**≥ 6 cells**|Outside the supported design range — the ceiling is 4 impact groups plus one shared reference group|State the 2–5 range; offer to split into separate tests, or to file it as a CS task for DS (preview first)|
|**Non-geo design** (user-level split, audience holdout, platform-native experiment)|Different product surface|Hand-off summary + CS task preview for DS|

**Routing rules**

- Do **not** create a partial draft "to save progress" when the request is out of boundary.
- Do **not** promise DS a turnaround or a specific outcome.
- Do include the handoff summary (what was asked, what was resolved, what blocks it).
- **Offer the hand-off as a CS task.** After the summary, show the CS task preview and end the turn; call cs-task-create only on the user's yes, once (references/solve-loop.md). If they decline, leave the summary in chat and stop. Product limits the user can fix themselves — an unsupported country, a past start date, a Not-ready sales channel — are not hand-offs: ask them to change the input.
- If the request is *partly* out of boundary (e.g. a standard 2-cell Meta test **plus** a creative comparison), **the whole request goes to DS** — don't build the in-scope half and route the rest. Splitting the request splits the design decision, and DS needs the full picture to advise on either part.

## 4. Inputs

### The full field set

Everything to collect or resolve **before** the design call, and where each value comes from. The sections below cover how the non-obvious ones get resolved.

The last six are constraints: optional, not create-payload fields, and they only *bound* a design output rather than set it. Phrasing and interpretation → §4.C and references/constraints.md.

### A. Test structure — `adPlatform` / `testLevel` / `impactCampaignInfos` **⇄** `numberOfCells` (either / or)

These are two ways of describing the same thing. The user supplies **one side**; the skill derives the other and confirms it in Step 4.

|Field|Required?|Description / default|
|---|---|---|
|adPlatform|**Either/or**|The ad platform(s) named (Meta, Google, TikTok…). **Apply alias mapping silently** (FB→Meta, GA→Google Ads, IG→Meta). Amazon Ads is not a lift-test platform — say so, don't map it.|
|testLevel|**Either/or**|platform / tactic / campaign. If the user named a scope but not a level, ask in business language ("Test the entire account, a specific tactic, or particular campaigns?").|
|impactCampaignInfos|**Either/or**|Each platform's selected targets, shaped by testLevel (ONE level for the whole test): tactic → one object per tactic `{tacticNames:[name]}` from **tactic-list** (`''` = the Default tactic; impact-campaigns does not return tactics); platform → accounts `{accountId, accountName}`, campaign → `{accountId, accountName, campaignId, campaignName}`, both from **lift-test-impact-campaigns**. A platform with nothing selectable → `[]` (saved as “skip for now”, scope set later in the draft).|
|numberOfCells|**Either/or**|2 – 5. **A cell count is a valid complete request on its own.** N cells = (N−1) impact groups + 1 shared reference group, so 5 cells is the ceiling: 4 impact groups. The cells are bound in prepare's `testChannel` — one array per test cell (§5.1 Step 3).|

**Resolution rules**

|User gave|Do this|
|---|---|
|Scope only ("Meta, tactic level, Prospecting")<br>|Derive numberOfCells = distinct impact groups + 1. Don't ask for the cell count.|
|Scope with multiple things ("Meta and Google")|One cell = one lift result. Default: each named thing is its **own cell** ("Meta and Google" → **3-cell test with one shared reference group**); things the user explicitly wants measured *together* ("combined", "as one") share one cell. Explain the shape in business language in Step 4.|
|Cell count only ("set up a 3-cell test")|Take it at face value. **Don't propose or fill in a platform, tactic or campaign** — run the design on the cell shape and leave the per-cell scope for the user to set in the draft. Say so in Step 4.|
|Both, consistent|Proceed.|
|Both, inconsistent ("4-cell test on Meta only")|Clarify once: is the extra cell a second tactic on Meta, another platform, or did they mean 2-cell?|
|Neither|Ask **one** question that offers both framings: "What should this test measure — a specific platform or tactic, or do you just want a standard 2-cell test on your biggest spender?"|
|≥ 6 cells|Out of boundary — §3.|

### B. Fields with defaults — resolve silently, confirm in Step 4

|Field|Required?|Description / default|
|---|---|---|
|salesChannel|Has default<br>|Use lift-test-scan's `salesChannel` — already only the channels that are lift-test ready (same readiness source as the product's data-health page). Show them for confirmation; default all selected. `custom` / imported channels are ordinary sales channels here.|
|primaryMetric|Has default|**orders** or **new customers** — these are the only two. Default orders; switch to new customers when the user says "acquisition / new customer". Anything else → out of boundary (§3).|
|country|Has default|Query trailing-90-day sales share, auto-pick the dominant country. Supported (**8 countries**): **US / UK / CA / DE / FR / AU / ES / SE** — the UK is passed as **`GB`**. Others error out — never hard-build.|
|geoLevel|Has default|Derive from country: US → DMA; every other country → postcode only (DMA / state are US-only — prepare rejects them elsewhere). **US state only when the user explicitly says so.**|
|status|Default|Default **draft**. Don't go straight to schedule unless the user explicitly says so.|

### C. Constraints — all optional

**Constraints are volunteered, or invited once.** Don't interrogate the user constraint by constraint in Step 2. Instead, close the Step 4 confirmation with a single open ask — "anything else to factor in? budget ceiling, a deadline, geos to leave alone, a CPA you'd rather I use" — naming two or three examples so the user knows what's on the table, then move on. One open question, one turn. If they say no, don't raise it again.

|Constraint|Typical phrasing|Maps to|Detail|
|---|---|---|---|
|**Concurrent-test requirements**|"don't overlap with the test I have scheduled", "avoid the geos in draft #1183", "that draft is dead, ignore it"|per-group concurrent exclusion computed by design-prepare (`geoConstraints`) — which other tests' geos are kept out of which group|references/constraints.md|
|**Geo constraints**|"exclude NY and CA", "only run in the Midwest", "don't pause Texas"|locationSetting include / exclude + treatment-side pinning|references/constraints.md|
|**Treatment geo size**|"keep the holdout small", "no more than 10% of orders", "I can't pause more than a handful of DMAs"|geo-size bracket (Minimum → 5% → 10% → 15% -> 20% -> 25% -> 30%)|references/constraints.md|
|**Budget**|"under $3k/day", "$50k for the whole test"|Feasibility ceiling in the design check — a test budget bounds LTM's new spend; PTM is checked against ongoing platform spend. **Daily vs. total must be disambiguated once**; a total is divided by the period being checked, so a longer test never makes it fit.|references/constraints.md|
|**Test period**|"4 weeks", "finish before July 15", "as fast as possible"|testPeriod target, or deadline → back-solve|references/input-parsing.md|
|**CPA estimate**|"assume a $40 CPA", "we run about $35 CPA on Meta"|Input to expected-daily-spend / feasibility computation — replaces the derived estimate|references/constraints.md|

**Default behaviors when no constraint is given** — resolved silently, never raised as questions: the geos the tenant's scheduled / executing / active tests still hold on this test's start are kept out per group (references/constraints.md); geo size, period and method come from design;  no budget ceiling is applied; CPA is resolved via database-query-run for any budget decision (Step 5), and a user-stated CPA overrides it.

### D. Never asked

|Field|Behavior|
|---|---|
|testStartTime|**Optional. Never asked.** Honor it if the user states one (**never accept a past date**). If they don't, leave it unset on the draft and say so in the handoff — the user sets it when they schedule. If the stated date overlaps a scheduled / executing / active test, don't judge the overlap yourself — pass the date as prepare's `startTime` (or, if the design already exists and the date is not earlier than the design's prepare `startTime`, straight to lift-test-create as `testStartTime` (earlier → re-run prepare with it and regenerate)); platform-api applies the per-group rule, and a real clash comes back as `geoConflict` → references/edge-cases.md.|

## 5. SOP

### 5.1 Steps

1. **Parse the request.** Resolve every field present in the wording — aliases, scope *or* cell count, time, geo, and **every constraint in §4.C**. Record what's specified; never re-ask it. Check the §3 boundary before anything else.
2. **Resolve the test structure.** Apply the §4.A either/or table. Ask at most one question, and only when neither side was given (or the two sides conflict).
3. **Resolve defaults, then call lift-test-design-prepare.** Run lift-test-scan for: current spend, suggested params, existing tests (`runningTests` — scheduled / executing / active; a draft is excluded only if the user names it, pulled via lift-test-get), **and the account-level geo limitation** (`geoExclusion` / `geoExclusionSummary`, `null` when the account has none) — for awareness now; the Step 4 table's account-geo row uses prepare's `geoExclusion` (same shape, at the design's geo level). Query DB for sales channels and country. Apply any stated constraints to the inputs before design. Then call **lift-test-design-prepare** with the scan result verbatim, testLevel, the geo / metric / location inputs, and **`testChannel` — the cells: one array per test cell, each listing that cell's platforms as `{adPlatform, impactCampaignInfos}`** (never the old flat `adPlatform` + `impactCampaignInfos`; never pass numberOfCells — prepare derives it). prepare is where the concurrent-test exclusion (per group, from scheduled / executing / active tests still holding geo on `startTime`) and the account geo limitation are applied — both computed by platform-api; its `geoConstraints.occupancy` feeds the Step 4 concurrency row. Pass `startTime` once the user states a start date (a later start keeps more geo), and `liftTestGroupId` when re-designing an existing test. Re-call prepare whenever Step 4 changes an input. (The PTM / LTM sufficiency call is made later, by lift-test-design-analyze, not by scan.) testChannel rules + examples → references/sop-detail.md
4. **Confirm — the ONLY full-config confirmation gate, and it is never skipped.** Not when the user says "nothing else to factor in", not when an earlier test in the conversation (or in a pasted Slack / Lark thread, a draft link, a previous design) seems to supply the setup — see CRITICAL rule 9. Echo the collected + resolved config as a two-column table in business language, in this order: test scope (or "left open — you'll set each cell's scope in the draft" when the user gave only a cell count) · cell shape · country + geo level · sales channels · primary metric · a read-back of every constraint the user stated, or "none" · the account geo settings row when the account has them set · the concurrency note when the geo pool was reduced. The test scope row names the test level for every cell; when the user never stated a level, ask for it here — lift-test-design-prepare silently defaults to tactic, and the Default tactic (`tacticNames: ['']`) must read "Default tactic", never "(none)". Close with both halves of the closing line: one open ask for anything else to factor in, and one line that this is the last config confirmation. Surface override conflicts once; don't lecture. Row-by-row spec → references/sop-detail.md · wording → references/output-templates.md
5. **Run the design: lift-test-design → lift-test-design-result → lift-test-design-analyze.** design takes prepare's `lift_test_group`, submits the solve and returns a `task_id`; design-result polls that token until the ~3–4 min PTM + LTM solve settles into design IDs; design-analyze turns those IDs into the decision — geo pair, test period, geo size, feasibility threshold, expected daily spend, **Sufficient / Insufficient**, and the **PTM / LTM recommendation**. Present **two tables**: (1) the PTM vs LTM comparison (keeps the native ~21-day test period + feasibility threshold), and (2) a test-period × feasibility-threshold table across 14 / 21 / 28 days (thresholds scaled by √(design length / N), same formula as the product) with ★ on the user's stated test length when they gave one (say whether it clears), otherwise on the shortest sufficient length chosen from 21 / 28 (14 is reference-only; a custom 14–60 length is allowed). → references/output-templates.md. CPA: resolve it yourself, the same way auto-solve does — one database-query-run query scoped to what the user selected, by testLevel (platform → the selected accounts via `account_id`, or the whole platform if none were picked; tactic → the selected tactics via `tactic_name`; campaign → the selected campaigns via `campaign_id`), DDA / iDDA all-channel cost per order capped at 1.5 × AOV (→ references/auto-solve.md, CPA section) — and pass it to design-analyze as `platformSpend[].cpa`. Analyze's auto-CPA (when you omit `platformSpend[].cpa`) now uses the same 30-day grain-aware DDA / iDDA basis (with the 1.5×AOV cap), so it's a safe equivalent fallback — resolving it yourself just keeps the CPA explicit and consistent across the flow. The feasibility threshold is each platform's `estimator.channel[i][j].minimum_daily_budget_required` at the design's length D = `geo_group.estimator.experiment_days` (other lengths: × √(D/N)); never `expected_daily_spend`. A design is Sufficient only when every platform is. Before calling a platform Sufficient, read its `estimator.channel` entry: `cpa` or `ads_daily_reported_spend` null ⇒ feasibility wasn't actually checked for it (analyze still counts it as sufficient, as the product UI does) — say "not checked" and why; `threshold_at_floor: true` ⇒ the threshold is the platform minimum, not CPA-driven — say so (→ references/output-templates.md, Step 5). Sufficient and every stated constraint honored → show the result, confirm the design ("Shall I create the draft now?"), then Step 7 — create only when the user agrees. Anything else — no viable pair, Insufficient, or a violated constraint — is **not** an error message; it enters the solve loop → Step 6. **If the user named a design id, §5.5 replaces lift-test-design + polling** — analyze, the tables and the design confirmation stay the same.
6. **Solve loop — max 3 rounds.** Insufficient, or a Step 5 failure: quantify the gap in concrete numbers → present the levers, each with the number it moves and the constraint it would break → **the user picks** → re-solve. Three rounds without a feasible design → stop, give the handoff summary, preview the CS task for Data Science and file it with cs-task-create only on the user's yes. "Proceed as-is" exits the loop at any round. → references/solve-loop.md
    1. **Auto-solve branch.** When the failure is budget-related and auto-solve's inputs are complete (a budget target — stated or inferable from scan spend — and a CPA resolvable via database-query-run), the skill **runs the geo-size × test-period search itself, automatically** — one progress line, no consent question — instead of one manual lever per round, and shows the result, confirms the design, then Step 7. A geo size or test period the user pinned is never overridden; only a real trade-off (>20% geo size or >35 days) pauses for the user to pick. The user's confirmation (or their own pick of a method / length / trade-off point) is the design confirmation — then create directly. One auto-solve run **is** the loop — it replaces the manual rounds, doesn't stack on them. → references/auto-solve.md
7. **Push the test as a draft — only after the user has confirmed the design.** A brand-new test → **lift-test-create** (default): one draft per test, whatever the cell count — a 3-, 4- or 5-cell test is one draft carrying all its cells, assembled from the chosen analyzed design. Modifying a draft the user already has → **lift-test-create-or-update** with its `id`. Either way, pass `restrictStartTime` (on create-or-update: only together with a new design) = the `startTime` of the prepare run whose design is being saved (omit if that run had none — when prepare was re-run with another date, it's the run the chosen design came from, not necessarily the latest) — the tool stores it on the draft (`extraInfo.restrictStartTime`) so the schedule can't be set earlier and a later session can read the design's start assumption back instead of relying on memory. No second full-config confirmation (the design confirmation in Step 5 / 6 is the gate, not a config re-confirm). **Cross-method check before create:** when `method` differs from the chosen `geo_group`'s own `method` (a design's geos run with the other method), the design confirmation must have shown that on its own line — "This is the PTM design's geo split (`<design id>`), run as LTM" — with the recomputed thresholds, and the user said yes to it; if not, show it and ask now — never create on a silent mismatch (→ references/solve-loop.md, Running a design with the other method). Return the draft link, plus the start-date note and any "proceed as-is" caveat. → references/sop-detail.md
8. **Build the design deck — automatically, right after every new draft.** The deck is part of the flow, not a follow-up request: as soon as Step 7 creates a draft, hand it to the deck skill in the same turn — no extra question. A 2-cell draft → 2-cell-test-design-deck; a 3-cell or larger draft → multicell-design-deck. Skip it only when the user said so ("draft only", "no deck for now", "skip the deck"), and then say in one line that it was skipped and that asking for "the design deck for draft N" builds it later. An update to an existing draft rebuilds the deck only when the change touches what the deck shows (method, period, geos, cells, budget). Pass the draft link; the deck skill asks only what it can't derive, and owns the deck's content, format and where it is filed in the client's Drive (Partnership drive › `<tenant_id> WorkMagic x <client>` › Lift Test Design). Reply with the Drive link it returns; if it returns a local file and the folder instead, give both and say the upload is still to do. If it refuses the draft, relay its reason and the choice the user has to make. Never build or patch slides by hand, and never retype a deck's figures into chat (§7). **Deleting a draft** through this skill also moves its design deck(s) to Drive trash: find the files in that client's Lift Test Design folder whose name starts with the test id, list them in the delete confirmation, and trash them after the user's yes (trash, never permanent delete). A draft deleted in the product UI leaves its deck behind — nothing here sees that. If the deck skills aren't available on this surface (Justin AI, an MCP-only client), say once that the deck needs Claude Code / Cowork with the cs-support `wm-cs` plugin and give the draft link. → references/output-templates.md, Step 8

### 5.2 Validation checkpoints

Multi-step SOP — the agent must pause and surface at these gates, never autopilot through:

|After step|Pause and surface|
|---|---|
|Step 2|Only if a question is genuinely needed — structure or a conflicting either/or.|
|Step 4|Full-config summary in business language, incl. cell shape + constraint read-back. **This is the only full-config confirmation gate.**|
|Step 5 (design back, Sufficient)|The method comparison table + the test-period × feasibility-threshold table (★ = the user's stated test length when they gave one, saying whether it clears; otherwise the shortest sufficient length among 21 / 28 — 14 is reference-only and never starred). **After the tables, ask "Shall I create the draft now?" and wait for the reply.** Do **not** restate full config, and do **not** ask for start date.|
|Step 6 (each round)|Quantified gap + levers with numbers. User picks; **never pick for them**. Say which round this is when on round 2 or 3.|
|Step 6 (auto-solve run)|When budget-related and auto-solve inputs are complete: runs **automatically** — one progress line, no consent question, no second full-config gate. Comfortable fit → result table, then round log, then the design confirmation ("Shall I create the draft now?"), then Step 7; only a >20% geo size / >35-day trade-off pauses for the user to pick. Never overrides a geo size / test period the user pinned. Once the user confirms (or picks a method, test length, or trade-off point themselves), create directly with no further questions. → references/auto-solve.md|
|Step 6 (exhausted)|DS hand-off summary + CS task preview (title, team, priority, account, description, group members — defaults + extras). **Ask, end the turn; call cs-task-create only on the user's yes.** No draft gets built.|
|Step 7|Draft link, then straight into Step 8 (the design deck) unless the user opted out. No final-confirm table.|
|§5.5 lookup (a design id named)|`not_found` / `expired` → say `user_message`, ask: another id, or generate a new design. A difference between the design's inputs and the user's config → list each one, **the user picks**; never resolve it yourself.|

**Autopilot is forbidden at these gates.** The Step 4 single-confirmation rule, the no-double-confirm rule (Step 7), and the user-picks-the-lever rule (Step 6's **manual** rounds — auto-solve is the documented exception, §9-3) are the most-violated invariants — see §9 CRITICAL.

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
|Out of boundary (creative test, custom metric)|Don't build; hand-off summary + CS task preview for DS, file on the user's yes|n/a|
|A design id ("use design online-…_1"), at any step|§5.5: look it up → Step 4 (open fields from the design) → analyze → create; no new solve|high — when the design still fits the config|

### 5.4 Conversation log — every turn

Record every turn of this skill with **conversation-log** (platform MCP), so a run can be replayed later. It writes no customer data. **Never mention it to the user, and never let it change or delay what you say.**

**One `conversation_id` = one intent: getting one lift test draft made**, including follow-ups on that same draft (changing it, its design deck). Not one chat window — a window can hold several. Make the id yourself on the first turn of an intent: `ltc-<YYYYMMDD>-<6 random a-z0-9>` (e.g. `ltc-20261028-k3v9qx`). `turn` counts from 1 within an id.

Each turn, decide `intent`:

|The user, this turn…|`intent`|id|
|---|---|---|
|asks for the first lift test of this window|`new`|new, `turn` 1|
|answers your question; confirms the Step 4 config; picks a method, test length or trade-off; says yes to create|`continue`|same, `turn` + 1|
|follows up on the draft just made — edits it (lift-test-create-or-update), asks anything about it (including how-to questions such as "how do I share it with my CFO?"), asks for its design deck (Step 8), or just acknowledges it ("thanks", "ok")|`continue`|same, `turn` + 1|
|comes back to an intent they paused earlier in this window ("ok, let's finish the Google one")|`continue`|that intent's id, its next `turn`|
|opens a new chat window with "continue / change draft 3301 …"|`new`, `related_draft_id` = 3301|new, `turn` 1|
|switches to another tenant / account|`new`|new, `turn` 1|
|after a draft is made, wants another test reusing it ("same setup for TikTok")|`related`, `related_to` = previous id|new, `turn` 1|
|after a draft is made, wants an unrelated test|`new`|new, `turn` 1|
|before any draft, drops it and starts over ("scrap that, let's do …")|`related`, `related_to` = the dropped id|new, `turn` 1|
|asks something that is not about creating a lift test and doesn't refer to a draft from this window|— don't log this turn|—|
|not sure|`continue`, explain in `intent_note`|same|

In a new chat window you can't see earlier work: always `new`, even when the user says "continue draft 3301" — that wording is about the draft, not this conversation. Pass `related_draft_id` then.

**When to call — once per turn, right before your reply.** As the **last tool call of every logged turn**, after all other tools and immediately before you write the reply, call `conversation-log` with:

- `conversation_id`, `skill: "lift-test-creation"`, `skill_version: "2.5.2"`, `turn`, `intent`;
- `user_message` — this turn's user message, verbatim;
- `assistant_reply` — the reply you are about to send, exactly as you will send it. Then send that same reply, unchanged;
- on turn 1 only: `intent_note` (one line: what the intent is), `related_to` on `related`, and `related_draft_id` when the intent starts from an existing draft (the user names one, or the new test reuses the setup of one);
- `draft_id` only when this turn created or changed a draft;
- `outcome` only on a turn that ends the intent: `draft_created` (lift-test-create) · `draft_updated` (lift-test-create-or-update) · `deck_built` (Step 8 ran this turn and no draft was created or changed; just re-sending an existing deck link carries no `outcome`) · `handed_off_to_ds` (cs-task-create filed) · `stopped_by_user` (the user drops it: "forget it", "cancel") · `paused` (the user puts it off: "I'll come back to this next week"; a later return in this window continues the same id) · `refused` (out of boundary, user declined the task) · `blocked` (a product limit the user must fix first). When a turn both creates / changes the draft and builds the deck, use `draft_created` / `draft_updated`. Follow-ups after the intent ended stay on the same id as `continue` turns: one that does one of those things again (edits the draft → `draft_updated`, rebuilds the deck → `deck_built`) carries that `outcome`; a question or a "thanks" carries none. A dropped intent (the user starts over or switches before a draft exists) gets no `outcome` — the new id's `related_to` is the record.

Leave `user_original_question` / `user_original_contexts` out of conversation-log — `user_message` already holds the message.

**Every other platform-MCP tool call of the intent carries `conversation_id`** — lift-test-scan, lift-test-impact-campaigns, tactic-list, lift-test-design-prepare / -design / -design-result / -design-analyze, database-query-run, lift-test-create / -create-or-update / -get / -list, cs-task-create.

Text fields are verbatim; anything over 8,000 characters is cut to 7,980 and ends with `…[truncated]`. If the call fails, fix what its error says and retry once; if it still fails, carry on without it. If you lose track of the id or turn, take them from the last conversation-log result.

### 5.5 Starting from a specified design — at any step

The user may name a design they already have — at any point in the flow, before or after Step 4, even after a design came back. The id may look like `online-<id>_<n>` (as shown on a geo pair card in the product), `<id>_<n>`, or a bare `<id>`. Then **no new solve is run**: the named design replaces lift-test-design + its polling. Everything else in the SOP still applies.

1. **Look it up.** Call **lift-test-design-result** with `design_id` (the id exactly as the user gave it) and `tenantId` — instead of `task_id`, never both. One call, no polling.
2. **`not_found` / `expired` → stop here.** Tell the user `user_message` (the design does not exist in this account / it was generated more than 33 days ago and its data is out of date). Ask whether to use another design id or generate a new design. Don't call lift-test-design-analyze with it.
3. **`success` → compare, then Step 4.** `design_params` holds what the design was generated with: country (`geo_country_code`), geo level (`group_level`), sales channels (`sales_platform`), primary metric (`metrics`), cell count (`num_of_cells`), geo size (`holdout_pct` — e.g. 0.25 = the 25% geo size), method (`experiment_type`).
   - A field the user hasn't stated → take the design's value; mark it "from the design you specified" in the Step 4 table.
   - A field the user stated that differs from the design → list each difference (theirs vs the design's) and **let the user choose**. Keeping the design's value → the config follows the design. Keeping theirs → the named design no longer fits; say so and generate a new design (normal Step 5).
   - Scope (platforms, test level, targets) is not in the design — resolve it as usual (§4.A); the cell count must match the design's.
   - Step 4 is still the one full-config gate; Step 3 (scan + prepare) still runs — analyze and create need its `testChannel`.
4. **Analyze the named design.** Pass `result.ptmDesignId` / `result.ltmDesignId` to lift-test-design-analyze as returned — only the design's own method has one, the other is null. Present that method only, and say in one line that the other method was not generated for this design (offer a new design if they want to compare). When `selected_design_id` is set, the user meant that exact design: show and create that one, not the solve's top-ranked one. Same tables, same Sufficient check, same "Shall I create the draft now?"; Insufficient → the solve loop (Step 6), where any re-solve means a new design.
5. **Create as usual (Step 7).** Omit `restrictStartTime` — the start date the named design was generated for isn't known. A geo conflict with a test scheduled since the design was made is not pre-checked: lift-test-create rejects it (`geoConflict`) → references/edge-cases.md.

## 6. Tools used

|Tool|Required?|Purpose|
|---|---|---|
|lift-test-scan|Required|Last-28-day daily spend + orders, existing tests as `runningTests` (scheduled / executing / active) for awareness and start-date conflict checks, and suggested params (holdout / cells / metric). The actual concurrent exclusion is computed later by design-prepare (`geoConstraints`, from platform-api), not by scan. Also returns `geoExclusion` / `geoExclusionSummary` — the account-level geo limitation converted to the test's geo level (`null` when none) — for the Step 4 read-back; design-prepare applies it to the design and lift-test-create re-checks it.|
|lift-test-impact-campaigns|Required (account / campaign level)|List ad **accounts or campaigns** to build impactCampaignInfos — `level=account` for a platform-scope test (also the first step before drilling into campaigns), `level=campaign` for a campaign-scope test. **Tactic-level grouping is NOT here — use the tactic MCP tool for tactic candidates.**|
|tactic-list|Required (tactic level)|Fetch the tactic candidates for a tactic-scope test — impact-campaigns does not return tactics|
|lift-test-design-prepare|Required (Step 3, before the Step 4 gate)|Assemble scan output + testLevel + `testChannel` (one array per test cell, each entry `{adPlatform, impactCampaignInfos}`) + geo / metric / location inputs into `lift_test_group`, `create_params`, and a summary; derives numberOfCells and per-entry testChannelIndex / extraInfo; applies the concurrent-test exclusion per group (only what is still occupied on `startTime`; omitted → today) and the account-level geo limitation, returned as `geoConstraints` (concurrent occupancy) and `geoExclusion` (account limitation, at the design's geo level) plus the per-group lists `treatmentExclusion` / `controlExclusion` in `lift_test_group`. (Budget / CPA constraints are not prepare inputs — they are handled at analyze / create.)|
|lift-test-design|Required (not when a design id was named — §5.5)|Submit the design solve. Runs asynchronously — returns a `task_id` immediately (the ~3–4 min PTM + LTM solve runs detached), not the design itself|
|lift-test-design-result|Required|Poll the `task_id` from lift-test-design until the solve settles; returns the PTM / LTM design IDs (or a failed / running state). **Or** look up a design id the user named — `design_id` instead of `task_id` (exactly one), one call: `success` (same `result` + `selected_design_id`, `part_date`, `design_params`) / `not_found` / `expired` → §5.5|
|lift-test-design-analyze|Required|Turn the design IDs into the decision: geo pair, test period, geo size, feasibility threshold, expected daily spend, **Sufficient / Insufficient**, and the **PTM / LTM recommendation**. Always pass `platformSpend[].cpa` — the CPA resolved via database-query-run scoped to the user's selection by testLevel (platform → selected accounts or the whole platform; tactic → selected tactics; campaign → selected campaigns; DDA / iDDA, see references/auto-solve.md); it re-evaluates feasibility + recommendation with it. Left empty it falls back to analyze's own auto-CPA, which now uses the same 30-day grain-aware DDA / iDDA basis (with the 1.5×AOV cap) — a safe equivalent; passing it just keeps the CPA explicit and consistent. **Pass `timezone`** (from scan) so that fallback window, and the 7-day spend window, are built in the tenant timezone — identical to the product UI.|
|lift-test-create|Required (final step — new draft)|**Default for a brand-new test.** Create the single draft from the chosen analyzed design — all cells in one draft. Takes the structured fields (§4) + the design IDs / geoGroup from analyze + `restrictStartTime` (the chosen design's prepare `startTime`, if any) and assembles the payload for you (incl. timezone conversion).|
|lift-test-create-or-update|Optional (update / edit)|Update an existing draft the user is modifying — pull it with lift-test-get, change fields, push the `body` back **with its `id`**. Before saving it runs the same gates as lift-test-create on whatever the body carries — geoGroup / testChannel shape, account-level geo limitation, concurrent geo-conflict, past start date (a body with no design still saves). The caller assembles the body, so prefer lift-test-create for new drafts.|
|lift-test-list|Optional|"What tests have I created before"; resolving a named draft in a concurrency constraint|
|lift-test-get|Optional|Pull an existing draft — mid-flow modification, or reading the geos of a draft named in a concurrency constraint|
|cs-task-create|Required (DS hand-off: out-of-boundary request or Step 6 exhausted)|File the DS hand-off: a CS task on the account CSM's board plus a Lark group. `category: "Lift Test"`. The server adds the default group members (listed in references/solve-loop.md — show them in the preview); pass `inviteEmails` only for extra WorkMagic teammates the user names. **Preview and get an explicit yes first; call once.** Not for product limits the user can fix (unsupported country, past start date, Not-ready channel). Returns `duplicate` when the same problem is already being handled, `groupError` when only the group failed. → references/solve-loop.md|
|conversation-log|Required (every turn)|Last call of each turn, right before the reply: this turn's user message + the reply about to be sent (+ outcome on the ending turn). Writes no customer data; never mentioned to the user. → §5.4|
|database-query-run|Required (auto-solve only)|Compute the per-platform CPA for the Step 6 auto-solve branch — one unified Cube.dev query (`attr_all_orders` / `attr_all_sales`, DDA vs iDDA by `attr_model_name`). Resolving it here keeps one explicit CPA consistent across every probe; analyze's auto-CPA now uses the same basis as the UI and is an equivalent fallback. → references/auto-solve.md|

**Design-deck skills (Step 8).** 2-cell-test-design-deck and multicell-design-deck are Claude Code / Cowork skills (cs-support `wm-cs` plugin), not MCP tools. Since 2026-10-26 this skill is run in Claude, where they are available, so Step 8 chains into them by default. Their requirements, inputs and outputs are defined in those skills, not here.

## 7. Output format

- **Business language only** — no holdoutPct, MDL, experiment_days, attr_model_name, facebookMarketing in chat output.
- **UI-aligned field names**: "Test period" (not "Experiment days"), "Feasibility threshold" (not "Expected daily spend"), "Geo size" (not "Geo coverage" / "holdout percentage").
- **Cells are now user-facing vocabulary.** When the user talks in cells, talk back in cells — and explain the shape once: "A 3-cell test means two things measured against one shared reference group." Still never *ask* the user to pick a cell count when they've already told you what to test.
- **Method-specific treatment-side labels** (matches product UI): PTM → "Holdout group"; LTM → "Exposed group"; reference side, any method → "Reference group". Never use "Holdout group" in an LTM column. Never invent a unified "Treatment group".
- **First mention of PTM / LTM** gets a one-line inline explanation: "PTM (pause-to-measure — pause ads in a subset of geos)". After that, the acronym alone is fine.
- **Constraints get read back explicitly** in Step 4, in the user's own terms ("Budget: under $3k/day", "Won't touch the geos in your scheduled Google test").
- **The design result is a table**, not a sentence — test period, geo size, the treatment geos by name, and the feasibility threshold as a specific number against the spend it's compared to. → output-templates.md, Step 5.
- **Holdout / Exposed geos come from the treated side — everywhere, not just the Step 5 table.** Take them from `display_groups.treated[i]` (analyze / lift-test-get return it ready-labeled; fall back to `geo_group.control[i]`). `geo_group.test` is the **Reference group** — its members are never named (count + share only), and it must never appear in a Holdout / Exposed row. This holds in *every* place you name geos: the design table, a draft summary, a DS-handoff summary, a solve-loop explanation, any supplementary note. If you're unsure which side a geo is on, don't name it. See §9 rule 10.
- **Gaps get numbers**, never adjectives. "~$700/day short" beats "a bit under what's needed".

All output templates (Step 4 summary, solve-loop rounds, design comparison, DS hand-off + CS task preview, draft link) → references/output-templates.md

**Design decks (Step 8) may carry figures chat never shows** (e.g. MDL, the reference-group geo list) — what they contain is defined by the deck skills. Never retype a deck's contents into chat; send the link.

## 8. Edge cases & routing

See references/edge-cases.md — covering unsupported country, cell-count conflicts, mid-flow modification, ambiguous geo names, Not-ready sales channels, design failures, dead drafts in concurrency constraints, out-of-boundary requests.

## 9. CRITICAL rules (top 10)

1. **Never hard-build when constraints aren't satisfiable.** State the gap with numbers. Give the levers. Unsupported country, past start date, infeasible budget — surface, never silently default.
2. **Two confirmation gates, each asked once: the config at Step 4, the design before create.** Step 4 confirms *what to test* — the full config, asked once and never restated afterward. When a design comes back — from Step 5, a solve-loop re-solve, or an auto-solve run — present it, close with "Shall I create the draft now?", and end the turn. When a CPA in the design looks implausible (below $10 per conversion, or the threshold sits at the platform minimum while a CPA exists), that same closing question asks the user to confirm the CPA or give theirs first — references/output-templates.md, Step 5. Call create only after the user says yes; that yes also covers the design deck that follows (Step 8) — don't ask about the deck separately. This question confirms *which design*, not the config — it is required, not a double-confirm. The user's own pick (switching to LTM, choosing a test length or a trade-off point, or "proceed as-is") already counts as the confirmation — create directly, don't ask again. Creating the draft in the same turn the design returns is the most common regression; re-asking after the user already chose is the second. The CS-task preview at a Step 6 hand-off (rule 4) is its own yes for a different action — filing a task — not a double-confirm of either gate.
3. **Never pick the lever for the user.** In the solve loop the skill quantifies and offers; the user chooses. Re-solving with an unrequested lever is a silent override. Exception: auto-solve searches only axes the user left open — a pinned geo size or period is never moved, and any trade-off outside the comfortable band goes back to them.
4. **Cap the solve loop at 3 rounds, then hand off to DS as a CS task — only with the user's yes.** A fourth round is a failure mode, not persistence. Carry the handoff summary, preview the task (title, team, priority, account, description, group members — defaults + extras), end the turn, and call cs-task-create only after the user explicitly agrees. Filing without that yes is a violation. Out-of-boundary requests (rule 5) are handed off the same way.
5. **Respect the boundary.** Non-standard metric definitions and creative tests are not approximated, not partially built — they go to DS (§3), offered as a CS task with the same preview-and-yes as rule 4.
6. **Never override a user's explicit choice silently.** LTM when PTM is recommended, a geo they excluded, a budget ceiling they set — surface once, respect the decision.
7. **Never expose internal parameter names or engine IDs.** `holdoutPct`, `MDL`, `experiment_days`, `attr_model_name`, raw API platform IDs, the raw design-engine fields `design_id`, `minimum_detectable_lift`, `factor`, and the design `task_id` (the async solve token from lift-test-design). None of these ever appear in chat — not in a progress line while the solve polls, **and not in a handoff / continuation note when a solve is still running** (keep the `task_id` internally to resume polling; never print it for the user to "hold"). (numberOfCells is the exception — it is user-facing *when the user raises it*.) A design id the user named themselves (§5.5) is referred to as "the design you specified" — don't print it back, and never print any other engine id.
8. **`minimum_detectable_lift` is an internal field, NOT the user-facing MDL.** It may be used in internal step calculations, but it must never appear in chat and must never be presented or labeled as the test's MDL. Its name is misleading — showing its value to the user, or passing it off as MDL, gives a wrong number.
9. **Every new test starts from Step 1 — nothing is inherited.** A test discussed earlier in the conversation, a draft or design link, or a pasted Slack / Lark thread is background, never the setup. Platforms, test level, targets, cell structure, geo size, period, method and CPA carry over only when they show up in the new Step 4 table and the user confirms them there. Splitting one multi-cell test into separate tests (e.g. a 3-cell into two concurrent 2-cell tests), merging tests, or redesigning for a changed request makes new tests: each one runs Steps 3–7 on its own, with its own Step 4 table and its own design confirmation. Only the update path (an existing draft the user names, via lift-test-create-or-update) edits a setup in place. A design **id** the user explicitly asks to use is an instruction, not background — §5.5: it supplies the open config fields, and still goes through the Step 4 table.
10. **Holdout / Exposed geos come from the treated side — everywhere, not only the Step 5 table.** The Holdout (PTM) / Exposed (LTM) group is `display_groups.treated[i]` (fallback `geo_group.control[i]`); `geo_group.test` is the **Reference group**, whose members are never named (count + share only). The platform naming is inverted (`control` = treated, `test` = reference), so the swaps happen most in prose *outside* the table — a draft summary, a DS-handoff summary, a solve-loop explanation, a supplementary note. Any such mention of Holdout / Exposed geos takes names from the treated side only, never from `geo_group.test`; if unsure which side a geo is on, don't name it. → references/output-templates.md, Step 5.

Full failure-modes catalog → references/failure-modes.md

## 10. Related skills

|Skill|Relationship|
|---|---|
|lift-test-readout|Downstream: reading and acting on results — iROAS, confidence intervals, post-test decisions|
|lift-test-diagnosis|Downstream: diagnosing failed or inconclusive tests — implementation drift, data readiness gaps, underpowered designs|
|Data Science (DS)|Escalation target for out-of-boundary requests and exhausted solve loops — both filed as a CS task via cs-task-create, after the user's yes|
|2-cell-test-design-deck|Downstream (Step 8): builds the design deck from a 2-cell draft — contents defined in that skill|
|multicell-design-deck|Downstream (Step 8): builds the design deck from a 3-cell or larger draft — contents defined in that skill|
