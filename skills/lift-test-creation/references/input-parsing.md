## Alias mapping (apply silently)

|User says|Map to|
|---|---|
|"FB", "Facebook", "Meta"|Meta Ads|
|"GA", "Google", "Goggle" (tolerate typos)|Google Ads|
|"TT", "TikTok"|TikTok Ads|
|"Snap"|Snapchat Ads|
|"Pin", "Pinterest"|Pinterest Ads|
|"PTM", "pause", "pause to measure"|PTM|
|"LTM", "launch", "launch to measure"|LTM|

Spelling tolerance: "Goggle Ads", "Snapcaht" → silently corrected; surface the canonical name in the Step 4 summary.

## Cell-count parsing

|User says|Parse as|
|---|---|
|"2-cell", "two cell", "a standard test", "simple A/B geo test"|numberOfCells = 2 → 1 impact group + 1 reference group|
|"3-cell", "test two things at once"|numberOfCells = 3 → 2 impact groups + 1 shared reference group|
|"4-cell"|numberOfCells = 4 → 3 impact groups + 1 shared reference group|
|"5-cell"|numberOfCells = 5 → 4 impact groups + 1 shared reference group — the maximum|
|"6-cell" or more|Out of boundary → §3|
|"test Meta and Google"|2 impact groups → 3-cell. Do **not** ask the user to pick the number.|
|"run separate tests on Meta and Google"|Two independent 2-cell tests — the user asked for separation explicitly|

**Ambiguity rule**: "Meta and Google" alone → default to **one 3-cell test with a shared reference group** and say so in Step 4 ("one test, two cells measured against a shared reference group — say the word if you'd rather have two separate tests"). Confirm, don't re-ask.

## Time-constraint parsing

|User says|Parse as|
|---|---|
|"starts June 1"|testStartTime = June 1 (validate: not in the past)|
|"finish before July 15" / "ends by July 15"|**Deadline** — back-solve, leaving room for design-computed test period + cooling period|
|"run for 4 weeks" / "4-week test"|testPeriod target = 28 days|
|"as fast as possible"|Shortest viable test period (14d); flag the higher daily-budget requirement|
|Past date ("yesterday", "June 1 2024")|**Error out** — don't hard-build. Ask what they meant.|
|*(nothing said about timing)*|**Don't ask.** Leave testStartTime unset; note it in the draft handoff.|

**Conflicting constraints** ("finish in 4 weeks + daily spend < $3k + Meta"): surface the conflict, don't silently drop a piece — this is the solve loop's job, not a quiet resolution.

**Budget unit ambiguity** ("under $5k" — daily or total?): clarify once, before design.

## Geo-constraint parsing

|User says|Handle|
|---|---|
|"exclude New York" with geoLevel = DMA|"New York" is ambiguous (city / DMA / state) — **clarify**|
|"exclude New York" with geoLevel = state|Parse as NY state|
|"exclude Texas, Florida, Arizona"|locationSetting = exclude + [TX, FL, AZ]|
|"only run in California"|locationSetting = include + [CA]|
|A geo not in the geo reference|Error out, list closest candidates|
|Anything about which geos get paused vs. excluded entirely|→ references/constraints.md|

## Constraint detection

A constraint is any user statement that narrows the design space. Detect and record all of them in Step 1 — the most common regression is parsing the scope and missing the constraint riding along in the same sentence.

|Signal|Constraint type|
|---|---|
|"$", "budget", "spend", "can't go above"|Budget|
|"weeks", "days", "by [date]", "fast"|Test period|
|"CPA", "cost per acquisition", "we run about $X per order"|CPA estimate|
|"holdout", "pause", "% of orders", "how many DMAs"|Treatment geo size|
|"exclude", "only", "avoid", "don't pause", named geos|Geo constraints|
|"other test", "already running", "scheduled", "draft #"|Concurrent-test requirements|
