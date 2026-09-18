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

- Brackets: **Minimum → 5% → 10% → 15%**.
- User-facing name is **"Geo size"**. Never "holdoutPct", never a raw decimal.
- Larger geo size → more orders per side → **lower** feasibility threshold. Say that plainly when offering it as a lever.
- A geo-size cap that blocks the design is a legitimate solve-loop gap: "To clear the threshold at your spend we'd need the 10% bracket; you asked to stay at 5%."

---

## Budget

|User phrasing|Interpretation|
|---|---|
|"under $3k/day"|Daily ceiling on the feasibility check|
|"$50k for the test"|Total budget → divide by the design's test period to get an implied daily ceiling; **restate the implied daily number** so the user can sanity-check it|
|"under $5k" (unit unstated)|**Clarify once**: "Is that a daily cap or the whole test budget?"|
|"whatever it takes"|No ceiling — don't invent one|

- The budget ceiling is compared against the **expected daily spend** in the design return. Ceiling < threshold → Insufficient → solve loop.
- For LTM, the budget constraint bounds the *new* spend introduced in the exposed group; for PTM it bounds the spend that must be sustained in the reference geos. Don't conflate them when quoting numbers back.
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

Users talk about geos in two registers, and they map to different things:

|User means|Maps to|Example phrasing|
|---|---|---|
|Where the test may operate at all|locationSetting include / exclude (the candidate pool)|"only run this in the US Midwest", "exclude Canada"|
|What goes on the treatment side|Treatment-side composition (PTM: Holdout group; LTM: Exposed group)|"don't pause New York", "I want LA in the holdout"|

**Never collapse the two.** "Don't touch New York" almost always means *don't put it on the treatment side* — but it can mean *exclude it entirely*. When the phrasing is "don't touch / leave alone / keep running", clarify once:

> "Do you want New York kept out of the test entirely, or just kept out of the holdout group so ads keep running there?"

Users don't manage the reference group directly — it's the remainder the design pairs against. Don't invite requests about it, and don't offer reference-side controls that aren't there.

### Exclusion mechanics

- Exclusions shrink the candidate pool for **both** sides. A long exclusion list is the most common cause of a no-solve at Step 5.
- Excluding a high-volume geo (a top-5 DMA) disproportionately raises the feasibility threshold — surface that when it happens: "Excluding New York and LA takes ~18% of your orders out of the pool, which pushes the threshold up."
- Inclusion lists ("only run in California") are exclusions of everything else. Treat a narrow include list as a likely no-solve risk and say so *before* design if the named pool is very small.

### Validation after design

Every geo constraint gets checked against the returned design before moving on:

1. Every excluded geo absent from both sides ✓
2. Every geo the user asked to keep out of the treatment side actually out of it ✓
3. Treatment side within the stated geo-size cap ✓

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

Call lift-test-scan. Auto-exclude the union of the **treatment + reference geos** of every test in **scheduled** or **active** state. Mention it in the Step 4 summary in one line — the user should know their pool was reduced, without being asked to manage it:

> "Steering clear of the geos in your Google test that runs through Apr 18."

**Drafts are not auto-excluded** — a draft isn't running. Only exclude a draft's geos if the user names it.

### When the user states a concurrency constraint

|User says|Handle|
|---|---|
|"don't overlap with my other test"|Default behavior, confirmed explicitly in Step 4|
|"avoid the geos in draft #1183"|Pull it with lift-test-get, exclude its geos, and say which test you read|
|"that draft is dead / not going to run — ignore it"|Remove it from the exclusion set. Say what that gives back: "That frees up 11 DMAs including Chicago."|
|"it's fine to overlap"|Only in the two forms below — never unconditionally|
|"don't start until the other one finishes"|Records a start date. Since the skill doesn't ask for one, put it in the draft handoff note; if the user states the date outright, honor it.|
|Names a test that doesn't exist|List their scheduled / active tests and ask which one|

### The two permitted forms of overlap

Full, unconditional overlap is never allowed — two live tests sharing treatment geos in the same window contaminate both readouts. Only these two forms are on the table:

|Form|What it means|When to offer it|
|---|---|---|
|**Reference-group overlap only**|The other test's geos may sit in this test's reference group, but never on its treatment side. Both tests stay readable because no geo is being manipulated by two tests at once.|Default relaxation — offer this first|
|**Full overlap, sequenced**|Any geo may be reused, **provided this test starts after the other test's end date**. Record that start date on the draft and say why it's there.|When reference-only doesn't give back enough, and the user can wait|

If the user asks for unconditional simultaneous overlap, say what it costs and offer the two forms instead:

> "Running both in the same geos at the same time means neither readout can attribute the lift to one test. Two ways to get most of the geos back: let the other test's geos sit in this test's reference group, or reuse them fully and start this one after Apr 18."

### Interaction with the solve loop

Relaxing concurrency is a **lever** — often the highest-value one, because it can return several high-volume geos at once. When offering it, name the form and its cost:

> "Round 2 option: let the Google test's geos sit in this test's reference group rather than excluding them. That gives back 9 DMAs (~14% of orders) and drops the threshold to ~$1.9k/day. They stay out of the holdout, so both readouts hold up."

Never relax concurrency silently to make a design solve. It degrades a test the user already has running.
