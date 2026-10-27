|Edge case|How to handle|
|---|---|
|User says only "Create a lift test for me"|One question offering both framings (scope or cell count); defaults elsewhere. Cap at ≤ 3 turns.|
|User says only "set up a 3-cell test"|Build it as asked. **Don't ask them to name platforms, and don't pick platforms for them** — the per-cell scope is set in the draft.|
|User gives both a cell count and a scope that don't match ("4-cell on Meta only")|Clarify once: a second Meta tactic, another platform, or did they mean 2-cell?|
|User asks for ≥ 6 cells|Out of boundary — state the 2–5 range (4 impact groups max), offer to split into separate tests, or to file it as a CS task for DS (preview first).|
|User names two platforms|One 3-cell test with a shared reference group (one cell each); say so in Step 4 and offer separate tests as the alternative. “Together / combined” → both in one cell (2-cell). **Never ask them to pick a cell count.**|
|A named platform has no selectable account / tactic / campaign|Keep it in its cell with an empty target list (saved as “skip for now”); tell the user to set its scope in the draft.|
|User asks for Amazon Ads|Not a lift-test platform — say so and offer the supported platforms. Don't map it to anything.|
|User specifies LTM but PTM is recommended|State the difference once. If they hold firm, use LTM. **Don't lecture twice.**|
|User picks an unsupported country ("Japan", "Brazil")|Error out, list the 8 supported countries (US / UK / CA / DE / FR / AU / ES / SE), ask which. **Don't hard-build, don't route to DS** — this is a product limit, not a modeling question.|
|User-named tactic / campaign doesn't exist|Campaigns: after lift-test-impact-campaigns. Tactics: after tactic-list — impact-campaigns doesn't return tactics. Either way: "Couldn't find a tactic called 'X' — candidates are: …"|
|User picked a sales channel that isn't lift-test ready (not in scan's `salesChannel`)|Say it isn't ready yet and point to the data-health / Settings page for the reason — the failing checks aren't visible to this skill. Offer to drop it. **Don't silently drop the channel.**|
|Design fails to form a geo pair|Solve loop round 1 — structural reason + levers. **Never expose "holdoutPct"** — say "more geos on the holdout side".|
|Design comes back Insufficient|Solve loop round 1 with quantified gap.|
|Design violates a stated constraint|Treated as a failure, not a success. Solve loop with the trade-off stated.|
|Solve loop hits round 3 without a solution|Stop. DS hand-off summary + CS task preview; file with cs-task-create only on the user's yes. **No draft.**|
|User declines the CS task|Leave the summary in chat. Nothing is filed; don't ask again.|
|User edits the CS task preview (priority, wording, someone to add)|Show the updated preview and ask again — a changed preview needs a fresh yes.|
|cs-task-create returns `duplicate`|The same problem is already with the team — say so; nothing new was filed. Don't file again.|
|cs-task-create returns `groupError`|The task was filed but the Lark group wasn't — say so; the team still has it.|
|cs-task-create fails|Tell the user it failed. Retry only if they ask.|
|User states a start date in the past|Error out, ask what they meant. **Never hard-build.**|
|User's stated start date overlaps a scheduled / active test|Check that test's geos against this design's pool. No geo overlap → one line noting the dates overlap but the geos don't. Geo overlap → name the shared geos and what it costs the readouts, and suggest starting after [end date]. Then respect their choice.|
|User states no start date|**Don't ask.** Leave unset; note it in the draft handoff.|
|User names a draft in a concurrency constraint that doesn't exist|List their scheduled / active tests and ask which one they meant.|
|User says a draft is "dead, ignore it"|Remove from the exclusion set; state what geos that gives back.|
|User says overlap is fine|Simultaneous overlap isn't offered. Give the one form that is: reuse those geos with a start date after the other test ends.|
|"Don't touch New York"|Clarify once: out of the test entirely, or just out of the holdout group?|
|Ambiguous geo name ("New York" at DMA level, "the coasts")|Clarify with a proposed resolved list — don't guess.|
|Ambiguous budget unit ("under $5k")|Clarify once: daily cap or total test budget?|
|User supplies a CPA far off their trailing data|Flag once, then use their number. Never quietly substitute your own.|
|User modifies an existing draft ("change the period on draft #1183")|Pull it with lift-test-get, run the flow from Step 3, and **update** that draft at Step 7 — don't create a duplicate.|
|User modifies a field mid-flow ("make it 3-cell", "switch to Google")|Identify dependents, say "Changed X, re-running the design, one moment", re-run, show the new summary. **Reset the solve-loop counter.**|
|User asks for a creative test|Out of boundary — DS. Hand-off summary + CS task preview; file on the user's yes. Route the whole request, even if part of it is a standard test.|
|User asks for a custom / imported metric|Out of boundary — DS. Hand-off summary + CS task preview; file on the user's yes.|
|User asks for something else out of scope ("15 countries at once", "offline store traffic")|Don't hard-build. Say what's possible; for the part that needs DS, offer the CS task (preview first).|
|User has been re-clarified repeatedly with no clear intent|Stop guessing. Route to CSM / DS with what was gathered, in words only (no CS task).|
|Minor spelling errors ("Goggle Ads", "Snapcaht")|Auto-correct; show the canonical name in the summary.|
|Short aliases ("FB", "GA")|Silent mapping; surface the official name in the summary.|
|User answers the design confirmation "yes" / "go" / "looks good"|Create with the ★ design — no extra question.|
|User answers with a pick ("use LTM", "make it 28 days")|Create with that choice directly — the pick is the confirmation, don't ask again.|
|User answers with a change that needs a fresh design (geo size, geos, scope)|Re-run the design (no draft exists yet, so this isn't the update path), then show the new result and ask again.|
|User asks for a new test after another test was set up or discussed in the same conversation (or pastes a thread / draft link about one)|Treat it as a new test from Step 1. The earlier setup is background only: every platform, level, target, cell structure, geo size, period, method and CPA goes into the new Step 4 table to be confirmed — never copied over silently.|
|User asks to split a multi-cell test into separate tests (e.g. a 3-cell into two concurrent 2-cell tests), or to merge tests|Each resulting test is a new test: its own Step 4 table (level stated per cell — a cell that was tactic level in the old test may need to be platform level now), its own design, its own confirmation, its own draft. The original draft is untouched unless the user asks to change or delete it.|
|The design's CPA for a platform is below $10, or the threshold sits at the platform minimum while a CPA exists|Ask once to confirm the CPA or give theirs, in the design-confirmation line (output-templates.md, Step 5). Confirmed → create. New CPA → re-run analyze with it, show the new tables, confirm again.|
