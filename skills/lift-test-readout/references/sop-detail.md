- Step 2 — Data sources in detail

From **lift-test-get**:

- Primary metric (orders / new_customers)
- Ad spend (aggregated)
- Test calibration status (Calibrated / Not calibrated, with date)
- Test window dates (start_date, end_date, cooldown_end_date)

From **lift-test-readout**:

- Per-sales-platform metric rows: iorders, lift_pct, icpa, isales, iroas, nc_iorders, nc_icpa, nc_isales, nc_iroas (UI labels per references/terminology.md)
- Combined (cross-store) row when applicable
- extra_info JSON containing CI / significance (rendering per references/terminology.md)

- Step 4 — Rubric for building the readout

Apply these rules in every output:

- **Connect every metric to an implication.** Never report a number in isolation. “\$2.10 iROAS” is not enough — pair it with significance, or with the user-stated target if there is one, or with the spend it represents in dollar terms.
- **Pair lift with the confidence interval.** Every test runs at a fixed 95% confidence level — what varies is the CI’s width and whether it crosses zero. A 13.5% lift with CI [16% \~ 30%] is a confirmed result (CI entirely above zero, “Significant”). A 13.5% lift with CI [-2% \~ 18%] is not a confirmed result, even though the point estimate looks the same — the data can’t rule out zero or negative lift (“Not significant”). Always surface the CI and significance flag alongside the lift %.
- **Comparative framing — only when the reference is in the data.** Compare to: user-stated target (if they mentioned one), prior period (if data has it), or another channel in the same test. Never invent a target like “above \$1.00 baseline” if the user didn’t state one. If no reference exists, state the magnitude as a fact and let it stand.
- **Frame stakes in dollars where possible.** Dollar amounts beat bare percentages where it fits. “\$11k incremental sales on \$11k ad spend” lands harder than “13.5% lift.”
- **Acknowledge what wasn’t measured.** Meta-only test? Don’t speculate about Google or TikTok. Amazon halo not in scope? Say so when the user asks decision questions.
- **NC ROAS / NC iROAS < \$1.00 is normal.** First-purchase revenue typically doesn’t cover full CAC. Don’t flag it as a problem unless the user explicitly framed it that way.
- **No evaluative adjectives.** Banned: strong, solid, weak, meaningful, substantial, remarkable, considerable, robust, compelling, impressive. Magnitude descriptors must be tied to a reference.
- **No speculation about causes.** No “creative was strong” or “targeting may have been too narrow.” Stick to the data.
- **No statistical algorithm names.** No SCM, DiD, SARIMAX — say “our matched-market model” if needed.

- Step 5 — Recommendation framework

Fixed vocabulary, never invent new labels:

| Label | When to use |
|-|-|
| **Scale** | Increase budget — marginal returns still healthy at current spend |
| **Maintain** | Keep current spend — near the efficient frontier |
| **Optimize** | Keep total budget but reallocate within the channel (tactics, creatives, geos) |
| **Adjust and retest** | Performance below target — modify creative / targeting / pacing and rerun |

Framing rules:

- **“Consider X” not “we recommend X”** in the major narrative recommendation. Suggest, don’t dictate.
- **Never frame as a “cut”.** Frame as reallocation toward higher-mROAS bands or channels. (Partner-funded studies especially: “cut” can trigger complications with the partner sponsor.)
- **Never blame the channel for “underperforming.”** Describe what the data shows; let the action follow from comparison to the user’s target or alternative.
- **Surface tradeoffs.** Never recommend X without noting what’s given up.
- **Cross-channel allocation and attribution calibration belong to MBO / the attribution model.** Hand off, don’t try to own those decisions in prose.
- **Data-read slots stay declarative.** Facts are not suggestions. “146 incremental orders, \$1.13 iROAS, above your stated \$1.00 target” is a data read — declarative, not hedged. “Consider” applies only to the recommendation slot.

Multi-test branch (when user asks “last N tests”)

- Pull all resolved tests’ top-line rows in a single comparison table.
- Sort by recency by default; re-sort only if user asks.
- Don’t weave a narrative across tests unless the user asked a synthesis question — and even then, compare on the same metric with the same significance treatment.
- Flag any test still in progress or Not significant — these don’t roll up cleanly into “how are my tests doing overall.”
