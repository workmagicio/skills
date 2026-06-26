## Step 13 — Deliver flow + forecast status handling

After `budget-optimizer-create` succeeds, **wait \~1 minute** then auto-call `budget-optimizer-forecast` to fetch the completed scenario.

### Forecast `status` handling

| **`forecast.status`** | **Action** |
|-|-|
| `ready` | Summarize: top 2-3 reallocations + expected delta vs baseline + any excluded channels + MBO link (quoted verbatim). |
| `running` | Still computing. Tell user "still running — checking back in another minute" and retry `budget-optimizer-forecast` after \~60s. After 2-3 retries, give the user the link and tell them to refresh in a few minutes. |
| `error` | Surface the error message verbatim. Don't invent a recovery path. Tell user to retry or contact CSM if the error persists. |

### Result message format

One short paragraph max:

*"Scenario created — \[Open in MBO →\](link). Recommended allocation: Meta \$310K (+12%), Google \$190K (−15%). Expected sales lift: \~+\$240K vs reference allocation. Click the link to open the scenario in MBO — saturation curves, full per-tactic breakdown, and downloadable spreadsheet are there."*

Don't pad. End the turn.
