Complete catalog. The top 7 most-violated are inline in SKILL.md §9 CRITICAL; the rest live here.

## On the either/or structure

❌ **Asking for a platform when the user gave a cell count** — the cell count is enough
❌ **Picking platforms or tactics for the user** when they only gave a cell count
❌ **Asking for a cell count when the user gave a scope** — derive it
❌ **Silently splitting two platforms into two separate tests** when the user asked for one test — or silently merging them when they asked for separate ones
❌ **Building a 6-cell test** instead of routing

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
❌ **A feasibility threshold without a specific number** ("auto-calculated", "within range", "~$2k-ish")
❌ **Listing the reference group's geos** — it's the remainder, not something the user manages
❌ **Including MDL in design output**

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

## On concurrency

❌ **Auto-excluding draft-state tests** — only scheduled and active
❌ **Not telling the user their geo pool was reduced** by a running test
❌ **Relaxing concurrency silently** to make a design solve
❌ **Allowing unconditional simultaneous overlap** — only reference-group overlap, or full reuse with a later start date

## On mid-flow modification

❌ **Re-running design silently after a user-requested change**
❌ **Partial updates** — platform changed but derived fields not refreshed
❌ **Making the user redo the whole flow from scratch**

## On the final draft

❌ **Double-confirming the config** — asking the user to confirm the full configuration a second time after Step 4. Step 4 is the only confirmation gate; Step 7 calls create directly. Progress updates and specific local questions are fine; re-confirming the whole config is a regression.
❌ **Field labels not matching the UI** — Experiment days → Test period; treatment-side labels follow the method
❌ **Omitting the start-date note** when testStartTime is unset
❌ **Omitting the proceed-as-is caveat** when the user chose it
❌ **Creating a duplicate draft** when the user was modifying an existing one — update it and say so
❌ **Splitting a multi-cell test into one draft per cell** — it's one draft, one link
❌ **Going straight to schedule instead of draft** unless explicitly asked
