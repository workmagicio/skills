|Edge case|How to handle|
|---|---|
|User says only "Create a lift test for me"|One question offering both framings (scope or cell count); defaults elsewhere. Cap at ≤ 3 turns.|
|User says only "set up a 3-cell test"|Build it as asked. **Don't ask them to name platforms, and don't pick platforms for them** — the per-cell scope is set in the draft.|
|User gives both a cell count and a scope that don't match ("4-cell on Meta only")|Clarify once: a second Meta tactic, another platform, or did they mean 2-cell?|
|User asks for ≥ 6 cells|Out of boundary — state the 2–5 range (4 impact groups max), offer to split into separate tests or route to DS.|
|User names two platforms|One 3-cell test with a shared reference group; say so in Step 4 and offer separate tests as the alternative. **Never ask them to pick a cell count.**|
|User specifies LTM but PTM is recommended|State the difference once. If they hold firm, use LTM. **Don't lecture twice.**|
|User picks an unsupported country ("Japan", "Brazil")|Error out, list the 7 supported countries, ask which. **Don't hard-build, don't route to DS** — this is a product limit, not a modeling question.|
|User-named tactic / campaign doesn't exist|After lift-test-impact-campaigns: "Couldn't find a tactic called 'X' — candidates are: …"|
|User picked a Not-ready sales channel|Name the specific failing readiness check, point to Settings. **Don't silently drop the channel.**|
|Design fails to form a geo pair|Solve loop round 1 — structural reason + levers. **Never expose "holdoutPct"** — say "more geos on the holdout side".|
|Design comes back Insufficient|Solve loop round 1 with quantified gap.|
|Design violates a stated constraint|Treated as a failure, not a success. Solve loop with the trade-off stated.|
|Solve loop hits round 3 without a solution|Stop. DS handoff. **No draft.**|
|User states a start date in the past|Error out, ask what they meant. **Never hard-build.**|
|User's stated start date overlaps a scheduled / active test|Check that test's geos against this design's pool. No geo overlap → one line noting the dates overlap but the geos don't. Geo overlap → name the shared geos and what it costs the readouts, and suggest starting after [end date]. Then respect their choice.|
|User states no start date|**Don't ask.** Leave unset; note it in the draft handoff.|
|User names a draft in a concurrency constraint that doesn't exist|List their scheduled / active tests and ask which one they meant.|
|User says a draft is "dead, ignore it"|Remove from the exclusion set; state what geos that gives back.|
|User says overlap is fine|Unconditional simultaneous overlap isn't offered. Give the two forms: the other test's geos in this test's reference group only, or full reuse with a start date after that test ends.|
|"Don't touch New York"|Clarify once: out of the test entirely, or just out of the holdout group?|
|Ambiguous geo name ("New York" at DMA level, "the coasts")|Clarify with a proposed resolved list — don't guess.|
|Ambiguous budget unit ("under $5k")|Clarify once: daily cap or total test budget?|
|User supplies a CPA far off their trailing data|Flag once, then use their number. Never quietly substitute your own.|
|User modifies an existing draft ("change the period on draft #1183")|Pull it with lift-test-get, run the flow from Step 3, and **update** that draft at Step 7 — don't create a duplicate.|
|User modifies a field mid-flow ("make it 3-cell", "switch to Google")|Identify dependents, say "Changed X, re-running the design, one moment", re-run, show the new summary. **Reset the solve-loop counter.**|
|User asks for a creative test|Out of boundary — DS. Route the whole request, even if part of it is a standard test.|
|User asks for a custom / imported metric|Out of boundary — DS.|
|User asks for something else out of scope ("15 countries at once", "offline store traffic")|Don't hard-build. Say what's possible, route the rest.|
|User has been re-clarified repeatedly with no clear intent|Stop guessing. Route to CSM / DS with what was gathered.|
|Minor spelling errors ("Goggle Ads", "Snapcaht")|Auto-correct; show the canonical name in the summary.|
|Short aliases ("FB", "GA")|Silent mapping; surface the official name in the summary.|
