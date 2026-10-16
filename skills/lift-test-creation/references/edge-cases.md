| **Edge case** | **How to handle** |
|-|-|
| User says only “Create a lift test for me” | Must ask ad platform and test level; use defaults / inferences for everything else. Cap at ≤ 4 turns. |
| User specifies LTM but PTM is the recommendation | State the difference once. If the user holds firm, use LTM. **Don’t lecture twice.** |
| User specifies automatic but the platform is manual-only (MNTN / Roku / Walmart Connect, etc.) | Tell the user “This platform only supports manual setup,” walk through the steps. **Don’t silently switch.** |
| User picks a country not in the supported list (“Japan”, “Brazil”) | Error out, list the 8 supported countries (US / UK / CA / DE / FR / AU / ES / SE), ask which one. **Don’t hard-build.** |
| User-named tactic / campaign doesn’t exist in the ad account | After tactic-list (tactics) or lift-test-impact-campaigns (campaigns), say “Couldn’t find a tactic called ‘X’ — candidates are: …” |
| User picked a sales channel that’s Not ready | Name the specific readiness check that’s failing, point to Settings. **Don’t silently drop the channel.** |
| Design fails (can’t form a geo pair / “no feasible solution”) | Give the directions that apply: ① running tests took many geos → start after they end (`restrictStartDate: true`); ② did the user set too many excludes? ③ do we need a larger holdout? **Never expose “holdoutPct” by name** — say “more geos in the holdout side.” |
| Design output is Insufficient | Design output is Insufficient → Offer **4 next steps** (raise budget / increase geo size / extend time / proceed and accept) with concrete numbers. |
| User’s testStartTime collides with a currently running test | Say “Another test is running through [date]; suggest starting after that.” |
| User gives a past date as testStartTime | Error out and ask if they meant something else. **Never hard-build.** |
| User modifies a field mid-flow (“make it manual”, “push start to July 1”) | Identify dependent fields: method / setup change after the design → just use the user’s choice (both designs already exist); cells / targets / country change → re-call prepare (country → re-pick geoLevel) + re-run design. **Tell the user “Changed X, so I need to re-run design, one moment”** — then show the new summary for confirmation. |
| User names multiple platforms (“Meta and Google”) | One test, one cell per platform (3-cell), unless they say “together” → both in one cell. Explain the cell shape in business language in the summary. **Never split into separate tests; never ask the user to pick numberOfCells.** |
| More than 4 things to measure separately | Max 4 test cells — ask which to drop or combine. **Don’t hard-build.** |
| A named platform has no selectable account / tactic / campaign | Keep it in its cell with an empty target list (saved as “skip for now”); tell the user to set its scope in the draft. |
| User asks for something out of scope (“compare two creatives”, “15 countries simultaneously”, “measure offline store traffic”) | Don’t hard-build. Say “I can do X; for Y you’ll need your CSM,” and provide CSM contact guidance. |
| User has been re-clarified repeatedly and still no clear intent | Stop guessing. Route to CSM. |
| Minor spelling errors (“Goggle Ads”, “Snapcaht”) | Auto-correct to the right platform; show the correct name in the summary. |
| User uses short aliases (“FB”, “GA”) | Silent mapping; surface the official name in the summary. |
| User’s budget constraint is ambiguous (“under \$5k” — daily or total?) | Clarify once: “Is \$5k a daily cap or total test budget?” |
