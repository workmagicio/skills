## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| Tenant not provisioned | Exit with CSM bridge |
| Ambiguous "what's my budget?" / "show me my budget" | 2-step disambiguation: clarify type (existing / build new / actual), then route |
| "How much should I spend on X?" | Recommendation question — route to `mbo-create-scenario`. Don't make up a number from list / historical |
| 1 scenario, user says "explain my scenario" | Use it, tell user which one |
| Multiple scenarios, "explain my scenario" | List with name + period + strategy + goal (never IDs). Ask user to pick |
| 0 scenarios | Tell user none exist, guide to create flow. Don't just dump "no scenarios found" |
| Scenario was deleted | Tell user. Offer most recent live scenario instead |
| Forecast still running | Don't hard-interpret stale data. Tell user it's computing, give link, suggest coming back |
| Forecast failed | Surface failure reason if available; suggest re-running or CSM |
| Reference period spend = 0 for a channel | Flag explicitly. Explain exclusion |
| Insufficient data for saturation curve | Flag explicitly. Explain noChange / baseline fallback |
| Locked-by-default channels (e.g., branded search ≥ 90% IS) | Mention briefly so user knows why they don't shift |
| Backtesting accuracy < 70% | Caveat in delivery; don't refuse |
| Compare > 2 scenarios | Cap at 2 per comparison; offer pairwise |
| Compare scenarios with different inputs | Surface input diff first, then output diff. Don't pretend they're directly comparable |
| User says "MBO is wrong, dashboard shows X" | Don't agree it's wrong. Explain methodology gap; advise against direct comparison |
| User asks "should I follow MBO's recommendation?" | Decision question. Give framing (backtest, recent lift tests, business constraints), let user decide |
| MBO vs attribution gap > 3× | Surface as potential data quality alongside methodology explanation. Recommend CS check |
| MBO vs lift test framed as "which is right" | Refuse the framing. Lift test calibrates MBO; they measure different things |
| "Why didn't actual match the forecast?" | mbo_vs_actual mode. Frame as market / creative / seasonality variance; don't blame the model. Large weird gaps → CSM |
| User asks why MMM model itself is wrong | Don't try to explain DS internals. Route to CSM |
