## Step 4 — Config confirmation (scope entry)

Here's the config I'll use — confirm before I run the design:

Anything else to factor in — budget ceiling, a deadline, geos to leave alone, a CPA you'd rather I use? If not, I'll run the design now and show you the result before creating anything.

## Step 4 — Config confirmation (cell-count entry)

Here's the config I'll use — confirm before I run the design:

Anything else to factor in — budget ceiling, a deadline, geos to leave alone? If not, I'll run the design now and show you the result before creating anything.

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

> Shall I create the draft now?

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

> Both cells clear their thresholds. Shall I create the draft now?

The same shape extends to 4- and 5-cell tests: one column per cell, shared facts outside the table. Past three columns, break the geo lists to the top 5 + "+ N more" so the table stays readable.

**Cell-count-only requests**: the columns are "Cell 1 / Cell 2" rather than platform names, and the spend row reads "set once you pick each cell's scope in the draft" — the threshold is still a specific number.

### Rules for both

**Label the geo row by method** — "Holdout group" for PTM, "Exposed group" for LTM. The reference group is the remainder: give its size, never its member list.

**Long geo lists**: at postcode level the list can run to hundreds. Show the top 10 by order volume and "+ N more", and note the full list is on the draft.

**Multi-cell geos never overlap** — say so once, as in the example. It's the question a user is most likely to have about a shared reference group.

**Shape note**: the table plus the design confirmation. No start-date question, no "does this all still look good?" — that's the double-confirmation regression.

**Close with the design confirmation.** End the reply with "Shall I create the draft now?" — once, after the last table (the test-period × feasibility-threshold table; or the first table when there's no period table). Then end the turn; don't call create. The user's "yes" — or their own pick ("use LTM", "make it 28 days") — is the confirmation; create then, in that turn, with no further question.

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

## Step 5 — Test period × feasibility threshold (second table)

Show this **in addition** to the design result / comparison table above — the first table keeps its native (~21-day) test period and feasibility threshold; this second table shows how the threshold moves with the test length so the user can pick the shortest sufficient length.

Derive each period's threshold from the design's native one with the same formula the product uses — no re-run:

> threshold(N) = (feasibility threshold at the design's own length) × √(design length / N)
>
>

Rows: 14 / 21 / 28 days (21 = the design's native length). "Clears it?" = current spend ≥ threshold × 0.95.

> Test-length options — how the daily threshold moves with duration:
>
>

|Test period|Feasibility threshold|Your $933 / day|
|---|---|---|
|14 days|$1,530 / day|✗|
|21 days|$1,250 / day|✗|
|28 days|$1,080 / day|✗ — closest|

> ★ Recommended = **the user's stated test length if they gave one** (say whether it clears; if it doesn't, name the shortest length that does as the alternative). Otherwise the **shortest length that clears**, chosen from **21 / 28 days** only. **14 days is shown for reference but is never the recommendation** (matches the product). If neither 21 nor 28 clears, a longer **custom length** lowers the threshold further — offer it.
>
>

**Rules**:

- A test length the user stated as a constraint is **pinned**: ★ sits on it regardless of whether a shorter length would also clear. Only without a stated length do you pick the shortest that clears.
- 14 days is displayed but **never** the ★ recommendation — pick ★ from {21, 28, and a custom length if set}, shortest that clears.
- Custom length = any integer 14–60 except {14, 21, 28}, with test period + cooling ≤ 60 days.
- Threshold uses √(design length / N) — an estimate scaled from the single design, not a re-solve (same as the product UI).
- Never show MDL in this table.

## Step 6 — Solve loop, round 1

> At your current spend (~$1.8k/day), 4 weeks won't be enough to detect a meaningful result — we'd need about $2.5k/day, so you're roughly $700/day short.
>
> Options:
>
> - **Raise daily spend to ~$2.5k**, keep 4 weeks *(breaks your $3k/day cap? no — fits)*
>
> - **Test a larger geo footprint** — the 10% bracket puts more orders on each side and drops the threshold to ~$1.7k/day, which your current spend clears
>
> - **Extend to 6 weeks** at current spend *(breaks your "finish by July 15" constraint)*
>
> - **Reuse your Google test's geos, starting after it ends Apr 18** — gives back 9 DMAs (~14% of orders), threshold drops to ~$1.9k/day, at the cost of waiting three weeks to start
>
> - **Proceed as-is** — the result may come back inconclusive
>
> Which way do you want to go?
>
>

## Step 6 — Solve loop, round 3 opening

> Last pass before I hand this to Data Science — at the 10% bracket and 6 weeks, the threshold is ~$2.1k/day against your $1.8k/day. The remaining lever is your geo exclusions: New York and LA together are ~18% of your orders.
>
>

## Step 6 — DS hand-off

> I've hit the limit of what I can design here. Here's the full picture for Data Science:
>
> **You asked for**: Meta lift test, tactic level ("Prospecting"), finish before July 15, under $3k/day, New York and LA excluded **Resolved**: US / DMA level · DTC + Amazon · Orders · PTM
>
> 1. Default geo size, 4 weeks → threshold $2.5k/day vs. $1.8k/day available — $700/day short
>
> 2. 10% geo size, 4 weeks → threshold $2.2k/day — still $400/day short
>
> 3. 10% geo size, 6 weeks → threshold $2.1k/day — still short, and past the July 15 deadline
>
>

> **Blocker**: available spend can't clear the feasibility threshold within your deadline without dropping the geo exclusions.
>
> Data Science can look at whether a different design or a longer horizon gets you a readable result.
>
>

Then the CS task preview — ask once and end the turn:

> I can file this as a task for Data Science and open a Lark group for it:
>
> | | |
> |---|---|
> | Title | [Lift Test] Acme — Meta Prospecting 2-cell: no feasible design |
> | Team | Data Science |
> | Priority | P0 |
> | Account | Acme (150024) |
> | Description | The summary above — what you asked, what was resolved, the three rounds and the blocker |
> | Lark group | Your CSM · you · Lift Test team: amyzhou@, liangbo@, lixiaoke@, liminghang@workmagic.io · CS triage: wangyanghua@, jessiezhang@, jessie@, xukai@workmagic.io |
> | Also add | None — name anyone else from WorkMagic you want in it |
>
> Shall I file it?

Default members come from solve-loop.md ("you" only when the user is a WorkMagic employee); the server adds them — don't put them in `inviteEmails`. Only names the user adds go there (WorkMagic emails only). After the user's yes, call cs-task-create, then:

> Filed — Data Science has it, and they'll follow up in the Lark group: [chatShareUrl, only if returned]

Duplicate:

> This one is already with the team — an open task covers the same problem, so I didn't file a second one.

Group not created:

> Filed — Data Science has the task. The Lark group couldn't be created; the team can open it from the task.

Declined:

> No problem — the summary above has everything if you want to pass it on yourself.

## Step 7 — After the design confirmation

Create only once the user has confirmed the design. Their "yes" / "go" / "looks good" — or a pick from the tables ("use LTM", "make it 28 days") — is the confirmation; create directly, in that turn, and reply with the template below. No further question — the yes or the pick is the confirmation.

> Creating the draft with LTM, 28 days.

Then create, and reply in the same turn:

Single cell:

> Draft created: [draft link]

> Start date isn't set — pick it when you schedule. One thing to know: your Google test runs through Apr 18, so starting after that keeps the two clean.

Multi-cell — still one draft, with the cells named:

> Draft created with both cells — Meta Ads and Google Ads, sharing one reference group: [draft link]
>
> Start date isn't set — pick it when you schedule.
>
>

Updating an existing draft:

> Updated your existing draft rather than making a new one: [draft link] — the geo exclusions and the 6-week period are in.
>
>

## Step 8 — Design deck

Before building — the two intake answers, one line:

> Building the design deck from draft [draft link] (3-cell, CTV + TikTok). Feasibility threshold on the deck: yes · PTM-vs-LTM comparison page: yes · theme / title: default. Give me a few minutes.
>
>

Deck done — the link and what's in it, never the deck's tables retyped:

> Design deck ready: [Slides link] — [n] slides, [checks] checks passed. The validation deck is in the same folder, filename ending _INTERNAL-Validation. Want the LTM comparison page added? It re-publishes to the same link.
>
>

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
