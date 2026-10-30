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
|Increase geo size (Minimum → 5% → 10% → 15% -> 20% -> 25% -> 30%)|Geo-size headroom remains|**Yes** — re-call prepare with only `scanResult.suggested.holdout_pct` changed (prepare has no holdout parameter)|
|Extend test period to N weeks|Period not pinned, or user willing to break it — **daily budget or current spend only**; with a total budget a longer test needs more in total, so never offer it (references/constraints.md, Budget)|**No** — re-pick by formula: threshold(N) = `minimum_daily_budget_required` × √(D / N), D = `geo_group.estimator.experiment_days`; N in 14–60 days, test + cooling ≤ 60. The design engine takes no test length, so a re-solve would only return another D-day design and may swap the geo pair|
|Relax a geo exclusion (name the specific geos and what they give back)|User-stated exclusions exist|**Yes**|
|Reuse a concurrent test's geos, starting after its end date|Concurrent tests hold geos (`geoConstraints.occupancy`), and the user can wait — a draft the user asked to avoid is a user exclude and isn't released by waiting|**Yes** — re-call prepare with `startTime` after that test's end (`geoConstraints.occupancy.releaseTimeline` / `rangeEndTime`); geos still held on that date stay excluded (references/constraints.md)|
|Revise the CPA assumption — **only if the user says their real CPA differs**|A CPA estimate is driving the threshold|No — re-check with lift-test-design-analyze|
|Drop a cell (5→4, 4→3, 3→2)|numberOfCells ≥ 3|**Yes**|
|Switch method (PTM ⇄ LTM)|The other method is viable at this spend|**No** — one design run returns both methods: use the other method's design from the same analyze result first. If that method has no design, run the current design with the other method (a PTM design may run as LTM and vice versa): compute its threshold yourself (below) and confirm with the user before creating|
|Proceed as-is|Always|No — **exits the loop**|

**Running a design with the other method (no design of that method).** Compute each platform's threshold yourself with the target method's formula — internal inputs, never shown: CPA = `estimator.channel[i][j].cpa`, MDL = `geo_group.control[i].minimum_detectable_lift`, r = `geo_group.control[i].orders`, D = `geo_group.estimator.experiment_days`, N = the chosen test length:

- LTM: threshold(N) = max(200, CPA × MDL) × √(D / N)
- PTM: threshold(N) = max(200 / r, CPA × MDL × (1 − r) / r) × √(D / N)
- No CPA → the max() is the platform minimum (200, or 200 / r for PTM) — say so, as in Step 5.

Show the threshold per platform against current spend (Sufficient = spend ≥ threshold × 0.95), state that it's the same design run with the other method, and get the user's yes before creating. Then pass the target `method` to create / create-or-update — the tool recomputes the stored per-cell thresholds with the same formula.

**③ The user picks.** Never pick for them. Never re-solve with a lever they didn't name. If they say "whatever you recommend", state a recommendation **and** what it costs, then still get a yes.

**④ Re-solve** with the chosen lever, all other constraints intact. Then:

- **Solved** → present the new design in the Step 5 format (output-templates.md), close with "Shall I create the draft now?", and end the turn. Create (Step 7) only after the user says yes. Picking the lever is **not** the confirmation — the user hasn't seen the result yet (§9-2).
- **Not solved** → quantify the new gap and open the next round. On round 3, DS hand-off (below).

## Round budget

- **Maximum 3 rounds** per test.
- Round 1 is the first failed solve. Only failed or Insufficient solves consume a round.
- A **user-initiated scope change** (different platform, different tactic, different cell count) is a new problem — **reset the counter** and say so: "That's a different test, so we're starting the design fresh."
- **Each round must carry new numbers.** Repeating the same lever list with the same figures is a failure mode, not a round.
- Announce position from round 2 on: "Second pass —" / "Last pass before I hand this to Data Science —". The user should never be surprised by the handoff.

## Exhaustion → DS hand-off (as a CS task)

After a failed round 3, stop. Do not create a draft. Do not suggest a fourth lever. Hand off.

The same hand-off applies to the other ways a design can't be formed: auto-solve comes back infeasible at the rails and the user doesn't want the manual levers. It also applies to out-of-boundary requests (SKILL.md §3): the summary then says what was asked and why it is outside what this skill builds, in place of the rounds tried — and the title names the ask, e.g. `[Lift Test] Creative A vs. B test: outside skill scope`.

> **Handoff shape**

1. What you asked for — scope, cell shape, and every constraint, in the user's terms
2. What was resolved — country, geo level, sales channels, metric, method
3. What was tried — each round: lever → result → gap, with numbers
4. The specific blocker — the dimension that never cleared
5. One line: this needs Data Science, here's everything they need

Tone: matter-of-fact, not apologetic. The user tried a reasonable thing that needs a human modeler — that's a normal outcome, not a failure of theirs.

### Filing it — preview, confirm, then cs-task-create

The hand-off is filed with **cs-task-create**: a CS task on the account CSM's work board plus a Lark group for it. It is a write the user must approve.

**Default group members** — the server adds these automatically; show them in the preview so the user knows who will be in the group, and never pass them in `inviteEmails`:

- The account's CSM (from HubSpot)
- The user, when they are a WorkMagic employee
- Lift Test team: amyzhou@workmagic.io, liangbo@workmagic.io, lixiaoke@workmagic.io, liminghang@workmagic.io
- CS triage: wangyanghua@workmagic.io, jessiezhang@workmagic.io, jessie@workmagic.io, xukai@workmagic.io

Show people by email, never by a guessed name. This list mirrors server config (platform-api `cs-todo.category-config` for the Lift Test team, cs-support `csroster.DefaultGroupInvites` for CS triage) — when either changes, update it here.

Steps:

1. **Preview, then end the turn.** After the hand-off summary, show what will be filed and ask once — template in output-templates.md (Step 6 — DS hand-off):
   - Title — `[Lift Test] <scope> <cell shape>: no feasible design`, ≤ 512 chars. Leave the account name out: the group name is `【CS Task】 <account> · <title>`, cut at 60 characters, so repeating it pushes the problem off the end
   - Responsible team — Data Science
   - Priority — P0 (the Lift Test default) unless the user asks otherwise; pass `priority` only when they change it
   - Account — tenant name + id (the account the test is for)
   - Description — the five-part hand-off shape above, in plain business language
   - Lark group — the default members above, plus any extra WorkMagic teammates the user named (they can add more)
2. **Call only on an explicit yes.** "Yes" / "file it" / "go ahead" is the approval. If the user edits anything (title, priority, wording, people to add), show the updated preview and ask again. If they decline, leave the summary in chat and stop — nothing is filed, and don't ask again.
3. **Call once.** `cs-task-create` with `tenantId` (the same one used for scan / prepare), `category: "Lift Test"`, `title`, `description`; `priority` only if the user changed it; `inviteEmails` only for extra WorkMagic teammates the user named; `liftTestGroupId` only when an existing draft is being modified — a design that failed during creation has no draft, so omit it.
4. **Relay the result as returned.** Created → the task is with the team, they'll follow up in the Lark group; share the CRM ticket link and `chatShareUrl` only when they came back — the ticket link is `taskUrl` if returned, else `https://crm.workmagic.io/csm-workspace?task=<todoId>` from the returned `todoId` (both fields are returned to WorkMagic employees only — never invent a link). `duplicate: true` → the same problem is already being handled; say so, nothing new was filed. `groupError` → the task was filed but the group wasn't; say so. A tool error → tell the user it failed; retry only if they ask.

Never claim the task exists before the tool returns, and never promise what Data Science will do or when.

## Proceed-as-is

Always on the table, every round. Choosing it **is** the design confirmation (§9-2) — the user is approving the current design as it stands. If chosen:

- Go straight to Step 7 — don't ask "Shall I create the draft now?" again.
- Put one caveat line in the draft handoff — "Built as configured; at $1.8k/day the result may come back inconclusive."
- Don't re-litigate it. One caveat, then done.
