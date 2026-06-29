## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| Tenant not provisioned | Exit with CSM bridge. |
| Ambiguous "what's my budget?" / "show me my budget" | 2-step disambiguation: clarify type (existing scenario / build new / actual spend), then route. Don't silently pick. |
| "How much should I spend on X?" | Recommendation question — not this skill. Route to `mbo-create-scenario`. Don't make up a number from list / historical. |
| 1 scenario in account, user says "explain my scenario" | Use it, tell user which one. |
| Multiple scenarios, user says "explain my scenario" | List scenarios with **name + key attributes** (period, strategy, goal); never IDs. Ask user to pick. |
| 0 scenarios in account | Tell user no scenarios exist, guide to create flow. Don't dump "no scenarios found". |
| Scenario was deleted | Tell user. Offer to interpret most recent live scenario instead. |
| Forecast still running | Don't hard-interpret stale data. Tell user it's computing, give link, suggest coming back. |
| Forecast failed | Surface failure reason if available; suggest re-running or CSM. |
| Reference period spend = 0 for a channel | Flag explicitly, don't bury in channel list. Explain the exclusion. |
| Insufficient data for saturation curve on a channel | Flag explicitly. Explain noChange / baseline fallback. |
| Locked-by-default channels (branded search ≥ 90% impression share, etc.) | Mention briefly; user should know why these don't shift. |
| Backtesting accuracy < 70% | Caveat in delivery, don't refuse. |
| Compare more than 2 scenarios | Cap at 2 per comparison; offer pairwise. |
| User compares scenarios with different inputs | Surface input diff first, then output diff. Don't pretend they're directly comparable. |
| User says "MBO is wrong, my dashboard shows X" | Don't agree it's wrong. Explain methodology gap; advise against direct comparison. |
| User asks "should I follow MBO's recommendation?" | Decision question. Give framing (backtesting accuracy, recent lift tests, business constraints), let user decide. |
| MBO vs attribution gap > 3× | Surface as potential data quality issue alongside methodology explanation. Recommend CS check. |
| MBO vs lift test framing as "which is right" | Refuse the framing. Lift test calibrates MBO; they measure different things. Explain complementarity. |
| "Why didn't actual results match the forecast?" | mbo_vs_actual mode. Frame as "actuals influenced by market / creative / seasonality"; don't blame the model. Large weird gaps → CSM. |
| User asks why MMM model itself is wrong | Don't try to explain DS internals. Route to CSM. |
