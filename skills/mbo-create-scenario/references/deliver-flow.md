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

### Interpreting the plan (MANDATORY — same discipline as mbo-read-scenario)

The delivered summary is an **interpretation**, not just a data dump — so it must follow the same rules the read skill uses. Before writing the summary, run this check.

**Goal-vs-projection sanity check.** Compare the projected total-outcome direction to the user's goal direction:

- If they **match** (goal = maximize sales AND total sales projected up) → summarize normally (top 2-3 reallocations + expected lift + excluded channels).
- If they **contradict** (goal = maximize sales but total sales projected **lower**; goal = minimize CAC but CAC projected up) → **decompose into baseline vs paid media BEFORE explaining**. Pull reference and optimized values for: baseline (organic / non-media) sales, paid media sales, total sales, ROAS, marginal ROAS.

  - The **paid component** is what MBO optimizes; the **baseline** is the model's organic projection (seasonality + trend) that MBO does NOT control.
  - Almost always, a total drop under a "maximize" goal is the **baseline component falling**, not the reallocation. State it explicitly, e.g.: "Paid media sales are up \$X (+Y%) and ROAS improved A→B — the reallocation is doing its job. Total is down \$Z because the model projects baseline (non-media) demand to be \~Q% lower next period (seasonal / organic decline). MBO can't optimize baseline, so this drop is outside the recommendation's control."

<callout emoji="💡">
**Don't take the bait — "trading sales for ROAS efficiency."** When total sales drops under a maximize-sales goal, do NOT explain it as "the reallocation shifted budget from high-sales-but-low-marginal channels to higher-marginal-ROAS-but-smaller channels, so you traded sales for efficiency" without first checking baseline. That generic framing is usually **wrong** — the real cause is the baseline (organic / non-media) sales projection falling. Decompose first, then explain.
</callout>

<callout emoji="💡">
**Don't blame the user's locks.** If the user locked tactics and total sales drops, do NOT say "because you locked X / Y / Z this isn't the overall optimum, that's why sales drop." Locks are the user's intent, not a flaw to call out. Run the baseline decomposition — the drop is usually baseline, not the locks.
</callout>

If decomposition can't be computed (scenario covers only a subset of channels, baseline section hidden), say so honestly — don't fabricate a "more efficient channel mix" answer.

### Also carry these from mbo-read (keep it brief)

- **Why each move happened.** For **Maximize** scenarios, frame reallocations as **relative cross-channel efficiency** — money moved from lower- to higher-marginal-return channels toward equalizing marginal return — not "this channel's curve is steep/flat" in isolation. A cut isn't "this channel is bad"; the next dollar just returns more elsewhere. For **Target** scenarios, single-channel curve position is the right lens.
- **Flag special channel states, don't bury them.** Zero reference-period spend → excluded (say why); insufficient data → held at baseline (noChange); locked-by-default channels (e.g. branded search near-saturated) → mention briefly so the user knows why they didn't move.
- **Language discipline.** Explain "marginal ROAS" in one line the first time it appears; never expose internal DS terms (MMM parameters, iROAS posterior, calibration weight, log-saturation, counterfactual model).
