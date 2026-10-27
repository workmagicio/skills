Complete catalog. The top 9 most-violated are inline in SKILL.md §9 CRITICAL; the rest live here.

## On the either/or structure

❌ **Asking for a platform when the user gave a cell count** — the cell count is enough
❌ **Picking platforms or tactics for the user** when they only gave a cell count
❌ **Asking for a cell count when the user gave a scope** — derive it
❌ **Silently splitting two platforms into two separate tests** when the user asked for one test — or silently merging them when they asked for separate ones
❌ **Building a 6-cell test** instead of routing
❌ **Putting things the user wants measured separately into one cell** (or splitting things they asked to measure together)
❌ **Calling lift-test-design-prepare with the old flat `adPlatform` + `impactCampaignInfos`** — it takes `testChannel`, grouped by cell (one array per test cell)
❌ **Calling lift-test-design-prepare after Step 4** — prepare runs in Step 3; the concurrency row the user confirms comes from it
❌ **Using lift-test-impact-campaigns for tactics** — tactics come from tactic-list
❌ **Passing “UK” as the country** — the code is `GB`; and non-US countries are postcode only

## On constraints

❌ **Parsing the scope and missing the constraint in the same sentence** ("Meta tactic test under $3k/day" → building with no budget ceiling)

❌ **Not reading constraints back in Step 4** — an unread-back constraint is a dropped constraint

❌ **Silently relaxing a constraint to make the design solve** — especially geo exclusions and concurrency

❌ **Misreading budget units** (treating a total as daily, or vice versa)

❌ **Inventing a constraint the user never stated**

❌ **Adjusting the user's CPA estimate yourself** to reach feasibility — it's a lever only the user can pull

❌ **Dropping a constraint on a re-solve** — constraints survive every round

❌ **Interrogating the user constraint by constraint** — one open ask at the end of Step 4, not six questions

❌ **Omitting the open constraint ask** from the Step 4 summary

❌ **Re-raising the open ask** after the user has said there's nothing else

## On the solve loop

❌ **Picking the lever for the user** and re-solving
❌ **Offering levers without numbers** ("you could try a bigger footprint")
❌ **Repeating the same lever list** with unchanged figures and calling it a new round
❌ **Running a 4th round** instead of routing to DS
❌ **Routing to DS without the handoff summary**
❌ **Calling cs-task-create without showing the preview and getting an explicit yes** — or in the same turn the preview is shown
❌ **Calling cs-task-create twice** for one hand-off, or retrying after a failure the user didn't ask to retry
❌ **Passing `liftTestGroupId` when no draft exists** — a design that failed during creation has none
❌ **Saying the task / group exists before the tool returns**, or inventing a group link the tool didn't return
❌ **Not saying which round you're on** from round 2 onward — the handoff should never be a surprise
❌ **Not offering proceed-as-is**, or re-litigating it after the user picks it
❌ **Treating a user-initiated scope change as a consumed round**
❌ **Building a draft after an exhausted loop**

## On the boundary

❌ **Attempting a creative test** with a geo design
❌ **Approximating a non-standard metric** with the nearest registry metric without saying so
❌ **Half-building an out-of-boundary request** "to save progress"
❌ **Building the in-scope half** of a request that also contains an out-of-boundary ask — the whole request goes to DS
❌ **Promising what DS will do or when**
❌ **Filing a CS task for a product limit the user can fix** (unsupported country, past start date, Not-ready channel) — ask them to change the input instead

## On mandatory asks

❌ **Re-asking fields the user already specified**
❌ **Asking for a start date** — it is never asked
❌ **Asking more than 1–2 questions in a turn**

## On defaults

❌ **Hard-building with defaults when the user gave almost nothing** — one structure question first
❌ **Overriding the user's preference without surfacing it** (user picks LTM, system flips to PTM)
❌ **Not defaulting sales channels to all selected**

## On internal terminology

❌ Using PTM / LTM **without a brief inline explanation on first mention** — first use should be e.g. "PTM (pause-to-measure — pause Meta in a subset of geos to measure lift from removed exposure)"; after that the acronym alone is fine
❌ **Method-incorrect treatment-side labels** — PTM treatment side → **"Holdout group"** (ads paused here); LTM treatment side → **"Exposed group"** (new spend introduced here); reference side, any method → **"Reference group"**. Never label an LTM treatment side "Holdout group". Never invent "Treatment group".
❌ **Asking the user to fill holdoutPct / experiment_days / MDL**
❌ **Showing facebookMarketing / attr_model_name** in the summary
❌ **Exposing internal field labels** ("Test DMAs", "Control DMAs") — use "Holdout group" / "Reference group"
❌ **Using "Geo coverage" or "Expected daily spend"** — use "Geo size" and "Feasibility threshold"
❌ **Reporting the design result as prose** instead of the table — or omitting the treatment geo list, the geo count, or the spend comparison
❌ **A feasibility threshold without a specific number** ("auto-calculated", "within range", "~$2k-ish") ❌ **Listing the reference group's geos** — the design picks it, not something the user manages ❌ **Listing `geo_group.test` names as the Holdout / Exposed group** — `test` is the Reference group; the treated geos are `geo_group.control[i].name` (output-templates.md, Step 5) ❌ **Including MDL in design output**
❌ **Exposing raw internal fields — `design_id`, `minimum_detectable_lift`, `factor`, the design `task_id`** — never surface these in chat; they are internal design-engine fields / async tokens, not user-facing values.
❌ **Printing the design `task_id` in a handoff or progress note while a solve is still running** — don't paste it for the user to "hold" or feed a background run; keep it internally and resume polling yourself.
❌ **Re-submitting lift-test-design while a solve is still running** — when the platform refuses another design-result call in the same turn, write one progress line and poll again; never resubmit the design, never hand the solve to a background automation
❌ **Describing the setup method (Automatic / Manual) while the user is choosing a design** — the design tables carry test period, geo size, threshold and spend; setup appears once, in the Step 7 handoff
❌ **Relaying analyze's "What date would you like the test to start?"** — the tool text asks; this skill does not. Leave the start date unset unless the user volunteered one (§4.D)
❌ **Quoting a floor-derived cost as a CPA** — when a platform's `expect_cpa` exists only because the threshold sat at the floor (no measured CPA, `threshold_at_floor: true` with `cpa` null), it is an artifact: never present it as cost per incremental order in chat, handoffs or decks; say the cost can't be estimated from recent spend
❌ **Treating `minimum_detectable_lift` as MDL** — `minimum_detectable_lift` is NOT MDL; it may be used in internal step calculations, but never use it as the MDL value or present it as such

## On time

❌ **Treating a deadline as a start date** ("finish before July 15" → start = July 15)
❌ **Treating a duration as a deadline** ("run for 4 weeks" → a fixed end date)
❌ **Hard-building with a past date**
❌ **Inventing a start date** because one is missing

## On geo

❌ **Collapsing "don't pause X" into "exclude X entirely"** without clarifying
❌ **Returning a design that puts a geo on the treatment side the user asked to keep off it** without saying so
❌ **Offering the user control over the reference group** — they don't manage it
❌ **Dropping a geo the user asked to exclude**
❌ **Misresolving an ambiguous geo name** — clarify, don't guess
❌ **Not surfacing the order-volume cost** of excluding a top-5 geo

❌ **Omitting the account geo settings row** from the Step 4 table, or presenting it as something the user can change in this flow

❌ **Letting a user-named geo vanish** because the account excludes it, instead of saying so

## On concurrency

❌ **Auto-excluding draft-state tests** — only scheduled and active
❌ **Not telling the user their geo pool was reduced** by a running test
❌ **Relaxing concurrency silently** to make a design solve
❌ **Allowing simultaneous overlap** — reuse is only ever sequenced, on a start date after the other test ends
❌ **Passing holdout_pct as a prepare argument** — prepare has none; change only `suggested.holdout_pct` inside the scan result

❌ **Offering sequenced reuse without naming the delay** — the gain and the wait go in the same sentence

## On mid-flow modification

❌ **Re-running design silently after a user-requested change**
❌ **Partial updates** — platform changed but derived fields not refreshed
❌ **Making the user redo the whole flow from scratch**

## On the final draft

❌ **Creating the draft without asking "Shall I create the draft now?"** — including creating it in the same turn the design returns. The design confirmation is a required gate; create only after the user says yes.
❌ **Waiting to be asked for the design deck, or asking "do you want a deck?"** — after a new draft the deck is built in the same turn; only an explicit opt-out skips it
❌ **Deleting a draft and leaving its design deck in the client's Drive** — when this skill deletes a draft, its deck files go to Drive trash in the same confirmed step
❌ **Continuing to ask after the user has already picked a design** — their pick (LTM, a test length, a trade-off point, "proceed as-is") *is* the confirmation; create directly, don't re-ask.
❌ **Double-confirming the config** — asking the user to confirm the full configuration a second time after Step 4. Step 4 is the only full-config gate. "Shall I create the draft now?" after the design is the required design confirmation, not a double-confirm; Step 7 calls create once the user approves the design.
❌ **Inheriting an earlier test's setup** — copying the platforms, level, targets or cell structure of a test discussed earlier (or of a pasted thread / draft link) into a new test without it appearing in the new Step 4 table
❌ **Skipping the Step 4 table** — because the user said "nothing else to factor in", because an earlier test already had the answers, or because a split / redesign "is the same test"
❌ **Leaving the test level to prepare's default** — a level the user never stated is asked at Step 4; "tactic: (none)" in the summary means the Default tactic and must be written as such
❌ **Creating the draft on an implausible CPA without asking** — a CPA below $10 per conversion, or a threshold at the platform minimum while a CPA exists, gets one confirmation question first (output-templates.md, Step 5)
❌ **Field labels not matching the UI** — Experiment days → Test period; treatment-side labels follow the method
❌ **Omitting the start-date note** when testStartTime is unset
❌ **Omitting the proceed-as-is caveat** when the user chose it
❌ **Creating a duplicate draft** when the user was modifying an existing one — update it and say so
❌ **Splitting a multi-cell test into one draft per cell** — it's one draft, one link
❌ **Going straight to schedule instead of draft** unless explicitly asked
