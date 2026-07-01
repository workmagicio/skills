---
name: lift-test-readout
description: Read and act on completed lift test results — interpret iROAS, confidence intervals, and turn the data into a post-test decision.
category: lift-test
risk: R0
version: 1.0.0
last-updated: 2026-06-29
references:
  - references/test-resolution.md
  - references/terminology.md
  - references/sop-detail.md
  - references/output-templates.md
  - references/edge-cases.md
  - references/failure-modes.md
---

## Purpose

How to read and act on lift test results — interpreting incremental ROAS, confidence intervals, and making post-test decisions. This skill turns a completed test’s raw output into a concise, decision-oriented readout: the headline numbers, what they mean in context, and what to do next. Default interpretation skill in the Lift Test domain.

## When to trigger

**Trigger condition**: The user is asking about results, performance, or implications of one or more completed lift tests.

**Examples that should trigger this skill**:

- “How did my Meta lift test do?”
- “What were the results of test 20260320-Meta?”
- “Should I scale Meta based on this test?”
- “What’s the iROAS on my last TikTok test?”
- “How did my last 3 lift tests perform?”
- “Why is the Amazon row not significant in my Meta test?”

**Examples that should NOT trigger this skill — route to another skill instead**:

| **Input pattern** | **Route to** |
|-|-|
| “Create a lift test for me” / “set up a Meta test” | `lift-test-creation` |
| “What is iROAS?” / “what does PTM mean?” (concept, no specific test) | `knowledge-base-ask` |
| “My test failed — can you fix it?” / “should I rerun this?” / “how do I unblock an inconclusive result” | `lift-test-diagnosis` |
| Status / progress only (“is my test still running”, “when will it end”) — no result interpretation needed | Plain test-status query, handle inline |
| “Compare two creatives” / “compare lift across two time periods” | Out of scope — route to CSM |

**Boundary with diagnosis**: This skill explains **what the result means** (“not significant means the data couldn’t rule out zero lift”). The diagnosis skill handles **what to do to fix or rerun it** (“here’s why your test came back inconclusive and the three things to change before rerunning”). When the user’s question mixes both (“Amazon is not significant — what should I do?”), readout handles the explanation, then suggests routing to diagnosis for the remediation path.

## Inputs

**Core fields**:

| **Field** | **Required?** | **Description / default** |
|-|-|-|
| testIdentifier | Required | Test ID, test name, or natural-language reference (“my last Meta test”, “the TikTok test from March”). If the user didn’t name one, resolve via §3.1. |
| salesPlatformScope | Has default | Which sales-platform tab to read: All / Primary store / a specific marketplace. Default to **All** unless the user names one (“how did Amazon do”) or the test only has one channel. |
| timeframe | Optional | Used only for multi-test queries (“last 3 tests”, “tests from Q1”). Single-test reads ignore this. |
| keyMetric | Auto | Pulled from the test’s stored primaryMetric field (orders / new_customers). Don’t ask. |
| decisionContext | Optional | If the user asks a decision question (“should I scale Meta”), capture which direction they’re considering. Don’t ask if they didn’t volunteer it — go straight to the standard recommendation framework in §6. |

Terminology rules (DB field → UI label, store-family names, number formatting) → references/terminology.md.

## SOP

### 4.1 Steps

1. **Resolve the test(s).** Apply rules in references/test-resolution.md. If ambiguous, surface candidates and ask — don’t guess. If test is still running, surface status and stop.
2. **Pull the data.** From lift-test-get: primary metric, ad spend, calibration status, test window dates. From lift-test-readout: per-sales-platform metric rows, CI / significance from extra_info JSON. Detail → references/sop-detail.md.
3. **Pick the read shape** based on user intent — see §4.1 below.
4. **Build the readout following the rubric.** Connect every metric to an implication, pair lift with CI / significance, use comparative framing only when reference is in the data, no evaluative adjectives, no speculation about causes. Full rubric → references/sop-detail.md.
5. **Make a recommendation** (only if user asked a decision question). One label from fixed vocabulary — Scale / Maintain / Optimize / Adjust and retest. Framing rules and tradeoff surfacing → references/sop-detail.md.
6. **Offer deck handoff** (only when the read is substantive). Skip for single-metric queries, status checks, or all-not-significant reads. On acceptance, hand off to the deck pipeline (rubric document is the deck pipeline’s system prompt — readout doesn’t duplicate it).

### 4.2 Read-shape routing

Match the user’s intent to a read shape; each maps to a template in references/output-templates.md.

| User intent | Read shape | Template |
|-|-|-|
| “How did my X test do” | **Standard readout** — summary table + headline observation + per-channel call-outs | standard-readout |
| “Should I scale / pull back / reallocate” | **Decision-oriented readout** — summary numbers, then recommendation from §5 vocabulary | decision-oriented |
| “Why is X not significant” | **Significance explainer** — short prose on what “not significant” means + the row’s data | significance-explainer |
| “How did my last N tests do” | **Multi-test readout** — comparison table, no cross-test narrative | multi-test |
| Single specific metric (“what was the iROAS”) | **Direct answer** + the one piece of context (significance, or comparison to user-stated target) | single-metric |

## Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| lift-test-list | Required | Resolve “my last test” / “my last 3 tests” / partial-name matches |
| lift-test-get | Required | Pull full test config, status, and stored primary metric |
| lift-test-readout | Required | Pull result rows: ad spend, incr. orders, lift %, incr. ROAS, CI, significance, trendline data, calibration status |
| Deck generation pipeline | Optional | Hand off when the user accepts the deck offer in Step 6 |

If a needed field isn’t in the lift-test-result table (e.g., attribution comparison breakdown — explicitly out of scope for this skill version), don’t fabricate it. Either skip that part of the read or tell the user that piece isn’t available here.

## Output rules

- Use UI labels for every metric (Incr. orders, Lift %, Incr. ROAS, Incr. CAC, etc.) — full mapping in references/terminology.md.
- Pair every lift % with its CI and significance flag — never report lift % alone.
- Confidence level is fixed at **95%** — never talk about it as variable. Discuss the CI (its bounds, whether it crosses zero), not the confidence level.
- Connect every metric to an implication; never report numbers in isolation.
- Comparative framing **only** when the reference exists in the data — user-stated target, prior period, or another channel in the same test. Don’t invent baselines.
- Format numbers per references/terminology.md — \$X.XX for ROAS (2 decimals), X.X% for percentages (1 decimal), [X% \~ Y%] for CI matching UI. Always round.
- Store family naming: shopify\_\* → “DTC” (never “Shopify”), amazon\_\* → “Amazon”, tiktok\_\* → “TikTok Shop”, combined\_\* → “Combined”.
- Output templates per read shape → references/output-templates.md.

## Edge cases

See references/edge-cases.md — 15 cases covering tests still running / in cooling / all-not-significant / terminated / not-calibrated / multiple-store conflicts / user-stated targets at the boundary / “is this good?” without a target / results conflicting with expectations.

## CRITICAL rules (top 6)

1. **Never invent fields or benchmarks.** If “new customers acquired” isn’t a stored count, don’t substitute it for nc_orders (allowed shorthand: \~X new customers with tilde, qualified by store). No “above the typical \$1.50 industry baseline” unless the user stated \$1.50.
2. **Never report lift % without confidence interval / significance.** A 13.5% lift with CI [16% \~ 30%] is a confirmed result; the same 13.5% with CI [-2% \~ 18%] is not. Always surface both alongside.
3. **Never recommend Scale or Maintain on a Not-significant result.** Suggest Adjust and retest, or route to creation skill for a new test with adjusted parameters. Don’t pick a directional recommendation on data that doesn’t support it.
4. **Never use evaluative adjectives.** Banned: strong, solid, weak, meaningful, substantial, remarkable, considerable, robust, compelling, impressive. Use neutral descriptors tied to data (“above your $2 target”, “stays above $X”, “diminishing past \$X”).
5. **Never own cross-channel allocation or attribution calibration prose.** “Shift 30% of Meta’s \$40k to Google” is MBO’s job; attribution-calibration interpretation is the attribution model’s. Hand off, don’t speak their language.
6. **Never name statistical algorithms.** No SCM, DiD, SARIMAX, SARIMA. DS hasn’t confirmed which model is used — say “our matched-market model” if you need to refer to it.

Full failure-modes catalog → references/failure-modes.md.



## References & related skills

| **Skill** | **Relationship** |
|-|-|
| `lift-test-creation` | Upstream: how the test being read was set up. Route here when the user follows up with “rerun this with adjusted parameters.” |
| `lift-test-diagnosis` | Sideways: how to diagnose failed or inconclusive tests — implementation drift, data readiness gaps, underpowered designs. Route here when the user’s question shifts from “what does it mean” to “how do I fix / rerun it.” |
| `knowledge-base-ask` | Upstream: PTM / LTM concepts in isolation, methodology questions |
| Routes out to CSM | out-of-scope requests (creative comparison, cross-time-period lift comparison) |
