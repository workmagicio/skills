## Step 4 — Config confirmation (scope entry)

Here's the config I'll use — confirm before I run the design:

Anything else to factor in — budget ceiling, a deadline, geos to leave alone, a CPA you'd rather I use? If not, I'll run the geo-pair design now and won't come back to re-confirm the config.

## Step 4 — Config confirmation (cell-count entry)

Here's the config I'll use — confirm before I run the design:

Anything else to factor in — budget ceiling, a deadline, geos to leave alone? If not, I'll run the design now and won't come back to re-confirm the config.

**Shape note**: a cell count is a complete request. Don't fill in platforms or tactics the user didn't name, and don't ask them to — say the scope is left open and move on.

## Step 5 — Sufficient progress update

Always a table, always with the treatment geos listed by name and a numeric threshold.

**Required rows**: test period · geo size (both the % of orders **and** the geo count) · the treatment geos **by name** · feasibility threshold **as a specific number** · the spend it's being compared against.

### 2-cell

> Design's back:

|Test period|28 days (+ 7-day cooling period)|
|---|---|
|Geo size|6.2% of orders — 12 DMAs|
|**Holdout group**|Cleveland, Pittsburgh, Kansas City, Birmingham, Greenville, Louisville, Buffalo, Richmond, Tulsa, Omaha, Albuquerque, Spokane|
|Feasibility threshold|**$1,820 / day**|
|Your current Meta spend|$2,100 / day — clears it, and under your $3k/day cap ✓|

> Reference group: the remaining 198 DMAs.

> Creating the draft now.

### 3-cell

One column per cell. The test period and the reference group are shared, so they sit outside the per-cell columns.

> Design's back — 28-day test period (+ 7-day cooling period):

||**Meta Ads**|**Google Ads**|
|---|---|---|
|Geo size|6.0% of orders — 11 DMAs|5.4% of orders — 10 DMAs|
|**Holdout group**|Cleveland, Pittsburgh, Kansas City, Birmingham, Greenville, Louisville, Buffalo, Richmond, Tulsa, Omaha, Albuquerque|Hartford, Nashville, Raleigh, Salt Lake City, Jacksonville, Grand Rapids, Harrisburg, Dayton, Wichita, Toledo|
|Feasibility threshold|**$1,820 / day**|**$960 / day**|
|Your current spend|$2,100 / day ✓|$1,150 / day ✓|

> Reference group: the shared remaining 189 DMAs — no geo appears in more than one holdout group.

> Both cells clear their thresholds. Creating the draft now.

The same shape extends to 4- and 5-cell tests: one column per cell, shared facts outside the table. Past three columns, break the geo lists to the top 5 + "+ N more" so the table stays readable.

**Cell-count-only requests**: the columns are "Cell 1 / Cell 2" rather than platform names, and the spend row reads "set once you pick each cell's scope in the draft" — the threshold is still a specific number.

### Rules for both

**Label the geo row by method** — "Holdout group" for PTM, "Exposed group" for LTM. The reference group is the remainder: give its size, never its member list.

**Long geo lists**: at postcode level the list can run to hundreds. Show the top 10 by order volume and "+ N more", and note the full list is on the draft.

**Multi-cell geos never overlap** — say so once, as in the example. It's the question a user is most likely to have about a shared reference group.

**Shape note**: the table plus one line of action. No start-date question, no "does this all still look good?" — that's the double-confirmation regression.

## Step 5 — Design comparison (method not pinned)

> Design's back. Here's the comparison:

||PTM ★|LTM|
|---|---|---|
|Method|PTM (Pause-to-Measure)|LTM (Launch-to-Measure)|
|Test period|21 days|21 days|
|Geo size|6.0% of orders — 11 DMAs|8.6% of orders — 15 DMAs|
|Treatment geos|**Holdout group**: Cleveland, Pittsburgh, Kansas City, Birmingham, Greenville, +6 more|**Exposed group**: Cleveland, Pittsburgh, Kansas City, Birmingham, Greenville, +10 more|
|Feasibility threshold|**$1,820 / day**|**$2,400 / day**|
|Your current spend|$2,100 / day ✓|$2,100 / day ✗ — $300/day short|

> ★ Recommended: PTM — Meta already has significant spend, so pausing ads in a holdout group of DMAs is the cleanest way to measure incremental lift, and your current spend clears its threshold.

**Labeling note**: method-specific labels — "Holdout group" in the PTM column, "Exposed group" in the LTM column. Never reuse "Holdout group" for LTM. Never invent "Treatment group."

## Step 6 — Solve loop, round 1

> At your current spend (~$1.8k/day), 4 weeks won't be enough to detect a meaningful result — we'd need about $2.5k/day, so you're roughly $700/day short.

> Options:

- **Raise daily spend to ~$2.5k**, keep 4 weeks *(breaks your $3k/day cap? no — fits)*
- **Test a larger geo footprint** — the 10% bracket puts more orders on each side and drops the threshold to ~$1.7k/day, which your current spend clears
- **Extend to 6 weeks** at current spend *(breaks your "finish by July 15" constraint)*
- **Let your Google test's geos into this test's reference group** (they'd stay out of the holdout) — gives back 9 DMAs (~14% of orders), threshold drops to ~$1.9k/day, and both readouts still hold up
- **Proceed as-is** — the result may come back inconclusive

> Which way do you want to go?

## Step 6 — Solve loop, round 3 opening

> Last pass before I hand this to Data Science — at the 10% bracket and 6 weeks, the threshold is ~$2.1k/day against your $1.8k/day. The remaining lever is your geo exclusions: New York and LA together are ~18% of your orders.

## Step 6 — DS handoff

> I've hit the limit of what I can design here. Passing to Data Science with the full picture:

> **You asked for**: Meta lift test, tactic level ("Prospecting"), finish before July 15, under $3k/day, New York and LA excluded **Resolved**: US / DMA level · DTC + Amazon · Orders · PTM

1. Default geo size, 4 weeks → threshold $2.5k/day vs. $1.8k/day available — $700/day short
2. 10% geo size, 4 weeks → threshold $2.2k/day — still $400/day short
3. 10% geo size, 6 weeks → threshold $2.1k/day — still short, and past the July 15 deadline

> **Blocker**: available spend can't clear the feasibility threshold within your deadline without dropping the geo exclusions.

> Data Science can look at whether a different design or a longer horizon gets you a readable result.

## Step 7 — Draft created

Single cell:

> Draft created: [draft link]

> Start date isn't set — pick it when you schedule. One thing to know: your Google test runs through Apr 18, so starting after that keeps the two clean.

Multi-cell — still one draft, with the cells named:

> Draft created with both cells — Meta Ads and Google Ads, sharing one reference group: [draft link]
>
> Start date isn't set — pick it when you schedule.

Updating an existing draft:

> Updated your existing draft rather than making a new one: [draft link] — the geo exclusions and the 6-week period are in.

## Step 8 — Design deck

Before building — the two intake answers, one line:

> Building the design deck from draft [draft link] (3-cell, CTV + TikTok). Feasibility threshold on the deck: yes · PTM-vs-LTM comparison page: yes · theme / title: default. Give me a few minutes.

Deck done — the link and what's in it, never the deck's tables retyped:

> Design deck ready: [Slides link] — 17 slides, 25/25 checks passed. Each cell has its own Test Parameters page and two Geos pages (names, then DMA codes). MDL is on the deck, two-sided, marked share-on-request. The internal validation deck is in the same folder, filename ending _INTERNAL-Validation. Want the LTM comparison page added? It re-publishes to the same link.

If the deck skill refuses — duplicate-geo variants, identical holdouts across cells, mixed countries or geo levels — relay its reason and the choice the user has to make. Don't work around it, and don't build slides by hand.

## Out-of-boundary response

> Geo lift can't isolate creative-vs-creative effects — it measures the incrementality of spend on a channel, tactic, or campaign, and a geo split doesn't separate which creative drove the difference.

> I'm passing this to Data Science with everything you've described, including the Meta tactic-level piece — they'll want the full picture before advising on either part.

## Never output

- Internal field names (holdoutPct, experiment_days, MDL, facebookMarketing, attr_model_name)
- ISO timestamps in conversation ("testStartTime: 2026-06-01T00:00:00Z")
- Long-form PTM-vs-LTM lectures
- Six technical questions at once
- A start-date question
- Vague gaps ("a bit short", "might not be enough") — always numbers
