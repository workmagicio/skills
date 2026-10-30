How each constraint enters the design, how it's validated, and how it behaves in the solve loop.

## General rules

1. **A stated constraint is hard** until the user themselves relaxes it in the solve loop.
2. **Read every constraint back in Step 4**, in the user's own terms. An unread-back constraint is a dropped constraint.
3. **Never invent a constraint** the user didn't state — including "reasonable" ones.
4. When two constraints conflict on their face (e.g. "under $1k/day" + "finish in 2 weeks" on a high-spend account), don't pre-judge: run the design, then quantify the conflict with real numbers in the solve loop.
5. **Constraints survive re-solves.** If round 2 changes the geo size, the budget ceiling from round 0 still applies.

---

## Treatment geo size

|User phrasing|Interpretation|
|---|---|
|"keep the holdout small"|Start at the Minimum bracket|
|"no more than 10% of orders"|Cap the bracket at 10%|
|"I can only pause a few DMAs"|Minimum bracket; flag that this raises the feasibility threshold|
|"go bigger if it helps"|Treated as pre-authorization for the geo-size lever in the solve loop — still confirm which bracket before re-solving|

- Brackets: **Minimum → 5% → 10% → 15% -> 20% -> 25% ->30%**.
- User-facing name is **"Geo size"**. Never "holdoutPct", never a raw decimal.
- Larger geo size moves the feasibility threshold **in opposite directions by method**: PTM → **lower** (a larger share of the platform's spend is paused), LTM → **higher or unchanged** (the new spend is spread over more geos). Say which, plainly, when offering it as a lever — and never offer a larger LTM exposed group as a way to lower the threshold.
- A geo-size cap that blocks the design is a legitimate solve-loop gap: "To clear the threshold at your spend we'd need the 10% bracket; you asked to stay at 5%."

---

## Budget

|User phrasing|Interpretation|
|---|---|
|"under $3k/day"|Daily ceiling on the feasibility check|
|"$50k for the test"|Total budget → the implied daily ceiling is total ÷ test period, so it **moves with the period**: restate it at the design's period ("$50k over 21 days ≈ $2,381/day") so the user can sanity-check it, and recompute it whenever the period changes|
|"under $5k" (unit unstated)|**Clarify once**: "Is that a daily cap or the whole test budget?"|
|"whatever it takes"|No ceiling — don't invent one|

- The budget ceiling is compared against each platform's **feasibility threshold** — analyze's `estimator.channel[i][j].minimum_daily_budget_required`, scaled to the period in question by × √(D / N) — never `expected_daily_spend`. Budget < 0.95 × threshold (the product's tolerance) → Insufficient → solve loop.
- **A test budget is an LTM number, not a PTM one.** LTM's threshold is the *new* spend run in the exposed group, so a test budget is compared with it directly. PTM's threshold is the platform's **ongoing daily spend** — the same number the product's Sufficient check holds against current spend; a PTM test buys no new media, so a test budget says nothing about whether PTM fits. With PTM in play, check it against the platform's current daily spend (or the daily spend the user says they will run during the test, e.g. "we'll cut Meta to $3k/day") and say so in one line. **Never raise the PTM geo size to make a test budget fit** — on a high-spend account that turns a PTM that already clears at the smallest geo size into a 30% holdout. Don't conflate the two when quoting numbers back.
- **With a total budget, the shortest period is the cheapest.** Over T days a total B gives B / T per day, which falls faster than the threshold (× √(D / T)): B fits iff B ≥ 0.95 × threshold_D × √(D × T), so a longer test needs *more* in total. Extending the test period is a lever for a **daily** budget only — for a total budget it never helps; check the user's period, else 21 days.
- Never treat a total budget as a daily cap, or vice versa. This is the single most damaging unit error in the skill.

---

## CPA estimate

|User phrasing|Interpretation|
|---|---|
|"assume a $40 CPA"|Override the derived CPA in the feasibility computation|
|"we run about $35 on Meta"|Same — an override, stated conversationally|
|"what CPA are you assuming?"|Not a constraint — answer with the derived figure, offer to override|

- A user-supplied CPA **replaces** the derived estimate in the design inputs; it does not blend with it.
- Always restate it in Step 4 — "Using your $40 CPA rather than the $52 in your trailing data" — because a CPA override materially moves the feasibility threshold and the user should see the delta.
- If the supplied CPA is far off the trailing data (> 2× or < 0.5×), flag it **once**, then use their number: "That's about half your trailing-90-day CPA — using it as you asked; it'll make the threshold look lower than your history suggests."
- **CPA is a valid solve-loop lever**, but only the user may move it. Offer it as "if your CPA on this tactic is closer to $X than the $Y in your trailing data, the threshold drops to $Z — is $X the right number?" Never adjust the assumption yourself to make a design solve, and never present a CPA the user hasn't confirmed as if it were theirs.

---

## Test period

Parsing lives in references/input-parsing.md. Behavior in design:

- A stated duration is passed as a target; the engine's 14–60 day range still binds. A request under 14 days → say the floor, offer 14.
- A deadline back-solves the latest workable start; if the back-solved start is already past, that's a solve-loop gap, not a silent extension.
- Extending the period is the cheapest lever for most Insufficient cases — but only offer it when the user hasn't pinned the period, or offer it explicitly as "this breaks your 4-week constraint".

---

## Geo constraints

Users talk about geos in several ways — "exclude Texas", "only run in the Midwest", "don't pause New York", "I want LA in the holdout". They all land on **one mechanism**: the test's locationSetting include / exclude, which binds the **treatment side only** (PTM: Holdout group; LTM: Exposed group).

|User says|Maps to|
|---|---|
|"exclude X", "avoid X", "don't pause / don't touch X"|locationSetting exclude — X never goes on the treatment side|
|"only run in Y", "only pause in Y"|locationSetting include — the treatment side is chosen only from Y|

The reference group is drawn from geos where ads keep running as usual, so an excluded geo may still show up there — that's harmless, nothing changes in it. There is **no per-test way to remove a geo from the test entirely**, so don't ask "out of the test entirely, or just out of the holdout?" — both answers produce the same design. Confirm in one line instead:

> "I'll keep New York out of the group where ads change — they keep running there as usual." (Name it by method once known: PTM → holdout group, LTM → exposed group.)

Users don't manage the reference group directly — it's the matched set the design pairs against. Don't invite requests about it, and don't offer reference-side controls that aren't there. If the user explicitly needs a geo kept out of the comparison too (e.g. "NY has a promo running, don't compare against it"), say plainly that a per-test setting can't do that; the only control that binds both groups is the account-level **Restricted locations** (Lift Test list page → Geo limitation settings), and it applies to every test in the account.

### Exclusion mechanics

- The candidate pool is bounded by the **account-level geo limitation** (Allowed / Restricted locations), which binds **both** groups and is applied by lift-test-design-prepare — a user constraint can narrow the pool, never widen it past what the account is configured to measure. If the design comes back having dropped a geo the user named, attribute it to the account setting rather than letting it disappear quietly.
- A user include / exclude shrinks the **treatment** candidate pool only. A long exclusion list is still the most common cause of a no-solve at Step 5.
- Excluding a high-volume geo (a top-5 DMA) from the treatment side disproportionately raises the feasibility threshold — surface that when it happens: "Keeping New York and LA out of the holdout takes ~18% of your orders out of the treatment pool, which pushes the threshold up."
- An include list ("only run in California") limits the treatment side to those geos; the reference group may still come from elsewhere. Treat a narrow include list as a likely no-solve risk and say so *before* design if the named pool is very small.

### Validation after design

Every geo constraint gets checked against the returned design before moving on:

1. Every geo the user excluded (or asked to keep off the treatment side) absent from the treatment side ✓
2. With an include list, every treatment geo inside it ✓
3. Every account-restricted geo (and anything outside the account's Allowed list) absent from both sides ✓
4. Treatment side within the stated geo-size cap ✓

A violation is **never** presented as a success. Report it as a solve-loop gap: "The design couldn't keep Texas out of the holdout and still clear the threshold — here's the trade-off."

### Ambiguity

|Phrase|Resolution|
|---|---|
|"New York" at DMA level|Clarify — city / DMA / state|
|"the South", "Midwest", "Bay Area"|Map to the geo reference; if the mapping is more than a handful of geos, **show the resolved list** in Step 4 rather than the colloquial name|
|"the coasts"|Too loose — clarify with a proposed list|
|A geo not in the reference|Error out, list closest candidates|

---

## Concurrent tests

Keeping a new test from colliding with tests the tenant already has.

### Default behavior (no constraint stated)

lift-test-design-prepare keeps this test clear of every test in **scheduled**, **executing** or **active** state (same country), **per group** — the rule platform-api computes and the launch-time check enforces:

- A geo held by another test's **treatment** group (holdout / exposed) is kept out of **both** groups of this test.
- A geo held only by another test's **reference** group is kept out of this test's **treatment** group only — two reference groups may overlap.
- Only what is still occupied on this test's start counts: pass `startTime` once the user states a start date; omitted → today (the safe default). Other tests release their geos in batches as they end, so a later start keeps more geo.
- A DMA-level design also counts state-level tests (their states converted to DMAs); a state-level design does not count DMA-level tests — when scan lists one, say so and offer a start after its end date.
- The test's own sibling cells (re-designing an existing multi-cell test → pass `liftTestGroupId`) never count.

prepare reports the result in `geoConstraints.occupancy` (`concurrentTestCount`, `rangeEndTime`, `geoCodes`, `treatmentGeoCodes`, `releaseTimeline`); lift-test-scan's `runningTests` lists those tests for awareness. If `geoConstraints` comes back `null`, platform-api was unreachable: the design ran **without the concurrent exclusion and without the account geo limitation** (`geoExclusion` is `null` too, which here does not mean "no limitation") — say both in the Step 4 rows (prepare's summary carries the warning) and offer to retry prepare. lift-test-create re-checks once platform-api is reachable (with no start date it runs open-ended from the design's start date — the `restrictStartTime` you save — else from today); the launch-time check always enforces the rule. Mention it in the Step 4 summary in one line — the user should know their pool was reduced, without being asked to manage it:

> "Steering clear of the geos in your Google test that runs through Apr 18."

**Drafts are not surfaced by lift-test-scan and are never auto-excluded** — a draft isn't running. Exclude a draft's geos only if the user names it (pull it with lift-test-get).

### When the user states a concurrency constraint

|User says|Handle|
|---|---|
|"don't overlap with my other test"|Default behavior, confirmed explicitly in Step 4|
|"avoid the geos in draft #1183"|Pull it with lift-test-get, exclude its geos, and say which test you read|
|"that draft is dead / not going to run — ignore it"|Remove it from the exclusion set. Say what that gives back: "That frees up 11 DMAs including Chicago."|
|"it's fine to overlap"|Only in the two forms below — never unconditionally|
|"don't start until the other one finishes"|Records a start date. Since the skill doesn't ask for one, put it in the draft handoff note; if the user states the date outright, honor it.|
|Names a test that doesn't exist|List their scheduled / executing / active tests and ask which one|

### What overlap is allowed

Two tests conflict only when their **time windows overlap** (start → end, including cooling) **and** a group-level clash exists — this test's treatment group touches either group of the other test, or this test's reference group touches the other test's treatment group. So:

- **Reference × reference overlap is allowed** at any time; prepare already lets it through — nothing to offer or ask.
- **Simultaneous overlap involving a treatment group is never allowed** — it contaminates both readouts.
- **Sequenced reuse** — any geo may be reused once the test holding it has ended. Mechanism: re-call prepare with `startTime` after that test's end date (`geoConstraints.occupancy.releaseTimeline` gives each batch's release date; `rangeEndTime` is when everything is released). Only geos still occupied on that date stay excluded, so starting after one test ends frees that test's geos while still keeping clear of the ones running longer. Save that date with the draft as lift-test-create's `restrictStartTime` (and as `testStartTime` too if the user is starting exactly then) — it's stored on the draft, so the schedule can't be set earlier and the assumption survives a new session. This is the one case where the skill records a start constraint without being asked for it, so say the date and why it's there.

lift-test-create re-runs the same conflict check before saving — with no start date it judges conservatively with no end, starting from the design's start date (`restrictStartTime`) or else today, while the draft still keeps no start date. If it returns `geoConflict`, relay its message (conflicting tests, shared geos) and offer starting after its `conflictEndTime`, or re-running prepare with that start and regenerating the design.

If the user asks to overlap while the other test is still running, say what it costs and offer the sequenced form instead:

> "Running both in the same geos at the same time means neither readout can attribute the lift to one test. The way to get those geos back is to reuse them fully and start this one after Apr 18, when the Google test ends."
>
>

### Interaction with the solve loop

Relaxing concurrency is a **lever** — often the highest-value one, because it can return several high-volume geos at once. When offering it, name the form and its cost:

> "Round 2 option: reuse the geos held by your Google test, starting this one after it ends on Apr 18. That gives back 9 DMAs (~14% of orders) and drops the threshold to ~$1.9k/day — the cost is waiting three weeks to start."

Never relax concurrency silently to make a design solve. It degrades a test the user already has running.
