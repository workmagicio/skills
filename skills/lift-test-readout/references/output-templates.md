- **Standard-readout** (most common shape)

Test: 20260320-Meta Ads - 20% DTC orders - PTM (Completed, Calibrated 03/20/2026)

Primary metric: Orders



Summary:

| Channel    | Ad spend  | Incr. orders | Lift % | Incr. ROAS | CI (lift %) | Significance     |

| Combined   | \$29,873   | 29,873       | 13.5%  | \$2.50      | [22% \~ 38%] | Significant      |

| DTC        | \$29,873   | 29,873       | 13.5%  | \$2.10      | [16% \~ 30%] | Significant      |

| Amazon     | —         | 29,873       | 13.5%  | \$1.80      | [-2% \~ 18%] | Not significant  |



Headline:

- On DTC, the test shows \$2.10 incremental ROAS at 13.5% lift, CI entirely above zero — the result rules out no-lift.
- The Amazon halo measurement spans below zero in the CI ([-2% \~ 18%]) — the data can't rule out zero halo from this Meta spend.

Want this as a deck for sharing internally?



- **Decision-oriented**

[Same summary table as standard-readout]



Read:

- DTC iROAS is \$2.10, above the typical \$1.00 break-even for blended-margin businesses. At current spend (\$10,989), Meta is producing incremental revenue at a positive return on this channel.
- The CI is fully above zero — the lift signal isn't being driven by noise.
- Halo to Amazon couldn't be confirmed in this test — that channel's lift CI spans zero.

Consider: Scale Meta. Marginal returns at current spend look healthy. Tradeoff: this test measured the current spend level — at materially higher daily budgets, expect diminishing returns past the point this test covered. To size up the next budget step with confidence, run an MBO scenario or schedule a follow-up test at the higher spend.



Want this as a deck?



- **Significance-explainer**

The Amazon row shows lift % of 13.5%, but its confidence interval is [-2% \~ 18%].



The CI is the range the true lift % likely falls in, at 95% confidence. Because that range crosses zero, the data can't rule out that the actual halo to Amazon was zero (or even slightly negative). That's what "Not significant" means — not that the result is bad, but that this test didn't have enough signal on the Amazon side to confirm direction.



The DTC row on the same test was significant, so the Meta spend did drive incremental DTC orders. The halo question on Amazon is the part that needs more data to resolve.



- **Multi-test**

Last 3 completed tests:



| Test                                          | Channel  | iROAS  | Lift %  | CI            | Significance     |

| 20260320-Meta Ads - 20% DTC orders - PTM     | DTC      | \$2.10  | 13.5%   | [16% \~ 30%]   | Significant      |

| 20260215-TikTok - new customer test - LTM    | DTC      | \$1.40  | 8.2%    | [3% \~ 13%]    | Significant      |

| 20260108-Google - Prospecting tactic - PTM   | DTC      | \$0.90  | 2.1%    | [-1% \~ 5%]    | Not significant  |



Notes:

- Two tests confirmed positive lift; the Google Prospecting test came back not significant — the CI on lift % crossed zero.
- These tests measured different channels at different time windows; direct cross-test comparison should be read with that caveat.



- **Banned output shapes**
- ❌ Raw numbers without context (“DTC iROAS is \$2.10. Amazon iROAS is \$1.80. Combined is \$2.50.”)
- ❌ Evaluative adjectives (“strong DTC lift”, “solid result”, “weak halo”)
- ❌ Speculative causes (“creative probably resonated”, “targeting was likely tight”)
- ❌ Made-up benchmarks (“above the typical \$1.50 industry baseline” — unless the user said it)
- ❌ Specific algorithm names (SCM, DiD, SARIMAX, SARIMA)
- ❌ ISO source-precision numbers (\$2.1287643, 13.4571%)
- ❌ “Cut Meta spend” framing — always reallocate / shift toward higher-mROAS
- ❌ Blaming the channel (“Meta underperformed”) — describe what the data shows
- ❌ Owning cross-channel allocation decisions in prose — hand off to MBO
- ❌ Inventing fields not returned by the readout tool (e.g. fabricating new-customer counts when only NC orders are present, or attribution-model breakdowns that are out of scope here)

#  📄 references/edge-cases.md

| **Edge case** | **How to handle** |
|-|-|
| Test is still running | Surface status (Running, with end date). Don’t read partial data. Tell the user when results will be ready. |
| Test is in cooling period | State that the test window has ended but cooling is ongoing; results are preliminary. Offer to come back when cooling closes. |
| Test came back not significant across **every** row | Read it honestly. Don’t manufacture insight. Suggest routing to diagnosis: “This test couldn’t confirm lift in either direction — to figure out what to change before rerunning, the diagnosis skill can walk through the likely causes.” |
| Test failed setup or was terminated early | State the status; don’t pretend there are results to read. Route to diagnosis. |
| Calibration status is **Not calibrated** | Surface it as context — the platform / tactic test went through but didn’t roll into attribution calibration. Don’t editorialize on whether that’s a problem. |
| User asked about an Amazon-only or marketplace-only test | Same shape, just the marketplace as primary. NC-orders framing per-store applies (\~X new Amazon customers). |
| User asked a decision question but the test result is Not significant | Honestly say the data doesn’t support a directional recommendation. Suggest **Adjust and retest** from the vocabulary, or recommend running a new test with adjusted parameters (route to creation skill). Don’t pick Scale or Maintain on a non-significant signal. |
| User asked about a specific tactic / campaign-level test | Same shape, but flag that campaign-level tests don’t feed attribution calibration (UI also surfaces this). |
| User asked for cross-test synthesis (“how is my measurement program going overall”) | Pull recent tests, surface in a table, but **don’t roll up to a single number** — each test measured a different thing under different conditions. |
| User asks about a test that doesn’t exist | List close matches; ask which one they meant. Don’t guess. |
| User asks “what’s the iROAS” and there are multiple sales channels | Show the per-channel breakdown (DTC vs. Amazon vs. Combined). Don’t pick one silently. |
| User claims a target (“I need iROAS above \$2”) and the result is at the boundary | State the comparison plainly: “\$2.10 iROAS — above your \$2.00 target, with the CI at [\$1.85 \~ \$2.40].” Let the boundary speak for itself; don’t editorialize. |
| User asks “is this good?” with no stated target | Don’t invent a target. Describe the result against significance and the user’s prior tests (if available). State: “iROAS of \$X with a CI that doesn’t cross zero — the data confirms incremental return. Whether \$X clears your business’s break-even depends on your margin structure.” |
| Result conflicts with the user’s expectation (“I thought Meta was working better”) | Don’t validate or dismiss the prior belief. Surface the data and what it does and doesn’t say. The platform’s attribution-model number (in the attribution comparison view, when available) may explain why their belief diverged — but reading that is out of scope for this skill version. |
| Multiple stores, conflicting signals (DTC significant positive, Amazon significant negative) | Read each store’s result on its own. Don’t summarize across with a single label. Note the divergence and recommend the user weigh each store’s economics separately. |

#  📄 references/failure-modes.md

**On data integrity**:

- ❌ **Inventing fields not in the data**. If “new customers acquired” isn’t a stored count, don’t substitute it for nc_orders. Allowed shorthand: \~X new customers (with tilde) qualified by store (\~X new DTC customers).
- ❌ **Made-up benchmarks**. No “above the typical \$1.50 baseline” unless the user stated \$1.50. No “industry average” claims.
- ❌ **Source-precision numbers**. Always round per §3.2 number formatting.
- ❌ **Naming statistical algorithms** (SCM, DiD, SARIMAX). DS hasn’t confirmed which model is used. Say “our matched-market model” only if you need to refer to it.
- ❌ **Speculating about why the result is what it is** (creative, targeting, pacing). Stick to the data.
- ❌ **Referencing fields that are in the database but whose semantic meaning hasn’t been verified** (e.g. minimum_detectable_lift, factor, expected_daily_spend in result-context). If unsure what a field represents in this context, don’t surface it.

**On terminology**:

- ❌ Saying “underperformed” or “weak” of a channel — describe the data
- ❌ Saying “cut Meta” — always “reallocate toward higher-mROAS” / “shift budget”
- ❌ Evaluative adjectives (strong, solid, weak, meaningful, substantial, remarkable, considerable, robust, compelling, impressive). Use neutral descriptors tied to data (“above,” “below,” “stays above $X,” “diminishing past $X”).
- ❌ Calling NC iROAS < \$1 a problem unprompted — it’s normal. First-purchase revenue typically doesn’t cover full CAC.

**On recommendation framing**:

- ❌ Recommending **Scale** on a Not-significant result
- ❌ Recommending without surfacing the tradeoff
- ❌ Inventing recommendation labels outside Scale / Maintain / Optimize / Adjust and retest
- ❌ Owning cross-channel allocation prose (“shift 30% of Meta’s \$40k to Google”) — that’s MBO’s job; hand off
- ❌ Owning attribution-calibration prose — that’s the attribution model’s job
- ❌ “We recommend” language in the narrative recommendation slot — use “consider”
- ❌ Softening data-read slots with “consider” — facts are declarative

**On significance**:

- ❌ Reporting lift % without confidence interval / significance
- ❌ Treating a wide CI as “directional” — if it crosses zero, the data doesn’t support direction
- ❌ Talking about confidence as a variable level (e.g. "at 60% confidence", "with high confidence") — every test runs at fixed **95%** confidence. Talk about the CI (width, whether it crosses zero), not about the confidence level itself.
- ❌ Reading not-significant rows as if they were significant
- ❌ Tucking the significance flag at the end as an afterthought — surface it next to the lift % it qualifies

**On scope**:

- ❌ Reading partial data from a still-running test
- ❌ Fabricating attribution-comparison interpretation (out of scope for this skill version)
- ❌ Reading test setup details as if they were results
- ❌ Trying to do remediation prose (“here’s how to fix the test”) — that’s diagnosis’s job
- ❌ Trying to teach the methodology in depth (“here’s how PTM works”) — that’s knowledge base’s job

**On deck handoff**:

- ❌ Offering the deck on every read (only when the read is substantive)
- ❌ Generating deck content inline instead of handing off to the deck pipeline
- ❌ Duplicating the rubric’s interpretation logic inline — the deck pipeline owns that; readout produces a chat-shape interpretation
