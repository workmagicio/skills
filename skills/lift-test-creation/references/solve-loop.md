Step 6 in full.

## Entry conditions

The loop is entered from either failure mode:

|Trigger|Round 1 framing|
|---|---|
|**Design failed** — no viable geo pair|"Couldn't form a workable geo pair" + the structural reason|
|**Design returned Insufficient** — expected daily spend > available spend (or > the user's budget ceiling)|"Design solved, but it won't have the power to detect a result" + the numbers|
|**A stated constraint was violated by the returned design**|"The design came back, but it breaks [constraint]"|

## Round structure

Every round, in order:

**① Quantify the gap.** One or two sentences. Concrete numbers, the binding dimension named.

- Insufficient: "At $1.8k/day you're ~$700/day short of the ~$2.5k/day needed to detect a 5% lift in 4 weeks."
- No-solve: "22 of 210 DMAs are excluded by your list and 9 more are held by your running Google test — that leaves too few comparable pairs to build a holdout."
- Constraint violation: "To stay under 5% geo size the threshold lands at ~$3.4k/day, above your $3k/day cap."

**② Offer the levers.** Only the ones that actually apply, each with (a) the number it moves, and (b) which user constraint it would break, if any.

|Lever|When it applies|Requires re-solve?|
|---|---|---|
|Raise daily spend to $X|Insufficient, no budget ceiling stated|No — re-check with lift-test-design-analyze|
|Increase geo size (Minimum → 5% → 10% → 15%)|Geo-size headroom remains|**Yes**|
|Extend test period to N weeks|Period not pinned, or user willing to break it|**Yes**|
|Relax a geo exclusion (name the specific geos and what they give back)|User-stated exclusions exist|**Yes**|
|Let a concurrent test's geos into the reference group (never the treatment side)|Auto- or user-excluded tests exist|**Yes**|
|Reuse a concurrent test's geos fully, starting after its end date|Auto- or user-excluded tests exist, and the user can wait|**Yes**|
|Revise the CPA assumption — **only if the user says their real CPA differs**|A CPA estimate is driving the threshold|No — re-check with lift-test-design-analyze|
|Drop a cell (5→4, 4→3, 3→2)|numberOfCells ≥ 3|**Yes**|
|Switch method (PTM ⇄ LTM)|The other method is viable at this spend|**Yes**|
|Proceed as-is|Always|No — **exits the loop**|

**③ The user picks.** Never pick for them. Never re-solve with a lever they didn't name. If they say "whatever you recommend", state a recommendation **and** what it costs, then still get a yes.

**④ Re-solve** with the chosen lever, all other constraints intact. Then either Step 7 (solved) or the next round.

## Round budget

- **Maximum 3 rounds** per test.
- Round 1 is the first failed solve. Only failed or Insufficient solves consume a round.
- A **user-initiated scope change** (different platform, different tactic, different cell count) is a new problem — **reset the counter** and say so: "That's a different test, so we're starting the design fresh."
- **Each round must carry new numbers.** Repeating the same lever list with the same figures is a failure mode, not a round.
- Announce position from round 2 on: "Second pass —" / "Last pass before I hand this to Data Science —". The user should never be surprised by the handoff.

## Exhaustion → DS handoff

After a failed round 3, stop. Do not create a draft. Do not suggest a fourth lever. Hand off:

> **Handoff shape**

1. What you asked for — scope, cell shape, and every constraint, in the user's terms
2. What was resolved — country, geo level, sales channels, metric, method
3. What was tried — each round: lever → result → gap, with numbers
4. The specific blocker — the dimension that never cleared
5. One line: this needs Data Science, here's everything they need

Tone: matter-of-fact, not apologetic. The user tried a reasonable thing that needs a human modeler — that's a normal outcome, not a failure of theirs.

## Proceed-as-is

Always on the table, every round. If chosen:

- Go straight to Step 7.
- Put one caveat line in the draft handoff — "Built as configured; at $1.8k/day the result may come back inconclusive."
- Don't re-litigate it. One caveat, then done.
