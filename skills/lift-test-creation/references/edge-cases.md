| **Edge case** | **How to handle** |
|-|-|
| User says only “Create a lift test for me” | Must ask ad platform and test level; use defaults / inferences for everything else. Cap at ≤ 4 turns. |
| User specifies LTM but PTM is the recommendation | State the difference once. If the user holds firm, use LTM. **Don’t lecture twice.** |
| User specifies automatic but the platform is manual-only (MNTN / Roku / Walmart Connect, etc.) | Tell the user “This platform only supports manual setup,” walk through the steps. **Don’t silently switch.** |
| User picks a country not in the supported list (“Japan”, “Brazil”) | Error out, list the 7 supported countries, ask which one. **Don’t hard-build.** |
| User-named tactic / campaign doesn’t exist in the ad account | After lift-test-impact-campaigns, say “Couldn’t find a tactic called ‘X’ — candidates are: …” |
| User picked a sales channel that’s Not ready | Name the specific readiness check that’s failing, point to Settings. **Don’t silently drop the channel.** |
| Design fails (can’t form a geo pair) | Give two directions: ① did the user set too many excludes? ② do we need a larger holdout? **Never expose “holdoutPct” by name** — say “more geos in the holdout side.” |
| Design output is Insufficient | Design output is Insufficient → Offer **4 next steps** (raise budget / increase geo size / extend time / proceed and accept) with concrete numbers. |
| User’s testStartTime collides with a currently running test | Say “Another test is running through [date]; suggest starting after that.” |
| User gives a past date as testStartTime | Error out and ask if they meant something else. **Never hard-build.** |
| User modifies a field mid-flow (“make it manual”, “push start to July 1”) | Identify dependent fields: method change → re-run design; country change → re-pick geoLevel + re-run design. **Tell the user “Changed X, so I need to re-run design, one moment”** — then show the new summary for confirmation. |
| User names multiple platforms (“Meta and Google”) | Split into multiple 2-cell tests, explain in business language in the summary. **Never ask the user to pick numberOfCells.** |
| User asks for something out of scope (“compare two creatives”, “15 countries simultaneously”, “measure offline store traffic”) | Don’t hard-build. Say “I can do X; for Y you’ll need your CSM,” and provide CSM contact guidance. |
| User has been re-clarified repeatedly and still no clear intent | Stop guessing. Route to CSM. |
| Minor spelling errors (“Goggle Ads”, “Snapcaht”) | Auto-correct to the right platform; show the correct name in the summary. |
| User uses short aliases (“FB”, “GA”) | Silent mapping; surface the official name in the summary. |
| User’s budget constraint is ambiguous (“under \$5k” — daily or total?) | Clarify once: “Is \$5k a daily cap or total test budget?” |
