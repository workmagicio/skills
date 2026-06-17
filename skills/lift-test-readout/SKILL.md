---
name: lift-test-readout
description: Read and act on completed lift test results — interpreting incremental ROAS, confidence intervals, and making post-test decisions. Use when the user wants to understand or interpret the outcome of a finished lift test. The default interpretation skill in the Lift Test domain.
---

# lift-test-readout

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

<lark-table rows="6" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **Input pattern** {align="center"}
    </lark-td>
    <lark-td>
      **Route to** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Create a lift test for me” / “set up a Meta test”
    </lark-td>
    <lark-td>
      `lift-test-creation`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “What is iROAS?” / “what does PTM mean?” (concept, no specific test)
    </lark-td>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “My test failed — can you fix it?” / “should I rerun this?” / “how do I unblock an inconclusive result”
    </lark-td>
    <lark-td>
      `lift-test-diagnosis`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Status / progress only (“is my test still running”, “when will it end”) — no result interpretation needed
    </lark-td>
    <lark-td>
      Plain test-status query, handle inline
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Compare two creatives” / “compare lift across two time periods”
    </lark-td>
    <lark-td>
      Out of scope — route to CSM
    </lark-td>
  </lark-tr>
</lark-table>

**Boundary with diagnosis**: This skill explains **what the result means** (“not significant means the data couldn’t rule out zero lift”). The diagnosis skill handles **what to do to fix or rerun it** (“here’s why your test came back inconclusive and the three things to change before rerunning”). When the user’s question mixes both (“Amazon is not significant — what should I do?”), readout handles the explanation, then suggests routing to diagnosis for the remediation path.
## Inputs
**Core fields**:

<lark-table rows="6" cols="3" column-widths="176,176,352">

  <lark-tr>
    <lark-td>
      **Field** {align="center"}
    </lark-td>
    <lark-td>
      **Required?** {align="center"}
    </lark-td>
    <lark-td>
      **Description / default** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      testIdentifier
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Test ID, test name, or natural-language reference (“my last Meta test”, “the TikTok test from March”). If the user didn’t name one, resolve via §3.1.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      salesPlatformScope
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Which sales-platform tab to read: All / Primary store / a specific marketplace. Default to **All** unless the user names one (“how did Amazon do”) or the test only has one channel.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      timeframe
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Used only for multi-test queries (“last 3 tests”, “tests from Q1”). Single-test reads ignore this.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      keyMetric
    </lark-td>
    <lark-td>
      Auto
    </lark-td>
    <lark-td>
      Pulled from the test’s stored primaryMetric field (orders / new_customers). Don’t ask.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      decisionContext
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      If the user asks a decision question (“should I scale Meta”), capture which direction they’re considering. Don’t ask if they didn’t volunteer it — go straight to the standard recommendation framework in §6.
    </lark-td>
  </lark-tr>
</lark-table>

**3.1 ****Test resolution rules**
When the user doesn’t give an unambiguous test ID, resolve in this order:

<lark-table rows="7" cols="2" column-widths="264,305">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Resolve to** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “test 20260320-Meta” / explicit name
    </lark-td>
    <lark-td>
      Look up exactly that test
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “my Meta test” / “the Meta one”
    </lark-td>
    <lark-td>
      Most recent **completed** Meta test for this tenant
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “my last test” / “the latest test”
    </lark-td>
    <lark-td>
      Most recent completed test, any platform
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “my last 3 tests” / “recent tests” / “Q1 tests”
    </lark-td>
    <lark-td>
      Multi-test mode (see §4 Step 5 multi-test branch)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “my [partial-name] test” with multiple matches
    </lark-td>
    <lark-td>
      List candidates, ask user to pick
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference to a test that’s still running (“how did Meta do” but no completed Meta test exists)
    </lark-td>
    <lark-td>
      Surface the running test’s status and note results aren’t ready yet — don’t fabricate a readout from partial data
    </lark-td>
  </lark-tr>
</lark-table>

**3.2 Terminology and rendering rules (apply throughout)**
These are non-negotiable and apply to every output of this skill. UI labels are the source of truth — every DB field renders using its UI-visible name.
**Metrics — Orders group (when primary metric = orders)**

<lark-table rows="6" cols="3" column-widths="176,176,176">

  <lark-tr>
    <lark-td>
      **DB field** {align="center"}
    </lark-td>
    <lark-td>
      **UI label** {align="center"}
    </lark-td>
    <lark-td>
      **Format** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      iorders
    </lark-td>
    <lark-td>
      “Incr. orders”
    </lark-td>
    <lark-td>
      integer count (≥ 1,000 → 1,234; < 1,000 → 146)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift_pct
    </lark-td>
    <lark-td>
      “Lift %”
    </lark-td>
    <lark-td>
      percentage, 1 decimal — 13.5%, 0.2%
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      icpa
    </lark-td>
    <lark-td>
      “Cost per incr. order”
    </lark-td>
    <lark-td>
      $XX.XX (overrides rubric’s “incremental cost per order”)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      isales
    </lark-td>
    <lark-td>
      “Incr. sales”
    </lark-td>
    <lark-td>
      $X,XXX
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      iroas
    </lark-td>
    <lark-td>
      “Incr. ROAS”
    </lark-td>
    <lark-td>
      $X.XX always 2 decimals — $2.10, $0.58 (overrides rubric’s generic “iROAS”)
    </lark-td>
  </lark-tr>
</lark-table>

**Metrics — New customers group (when primary metric = new_customers, or for halo readouts)**

<lark-table rows="5" cols="3" column-widths="176,176,176">

  <lark-tr>
    <lark-td>
      **DB field** {align="center"}
    </lark-td>
    <lark-td>
      **UI label** {align="center"}
    </lark-td>
    <lark-td>
      **Format** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      nc_iorders
    </lark-td>
    <lark-td>
      “Incr. new customer orders”
    </lark-td>
    <lark-td>
      integer count
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      nc_icpa
    </lark-td>
    <lark-td>
      “Incr. CAC”
    </lark-td>
    <lark-td>
      $XX.XX (**overrides** rubric’s nc_iCPA → CAC — UI says “Incr. CAC”, use that)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      nc_isales
    </lark-td>
    <lark-td>
      “Incr. new customer sales”
    </lark-td>
    <lark-td>
      $X,XXX
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      nc_iroas
    </lark-td>
    <lark-td>
      “Incr. new customer ROAS”
    </lark-td>
    <lark-td>
      $X.XX 2 decimals
    </lark-td>
  </lark-tr>
</lark-table>

**UI labels NOT directly from lift-test-result — source and verification status**

<lark-table rows="4" cols="3" column-widths="176,227,176">

  <lark-tr>
    <lark-td>
      **UI label** {align="center"}
    </lark-td>
    <lark-td>
      **Source** {align="center"}
    </lark-td>
    <lark-td>
      **Skill handling** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Ad spend
    </lark-td>
    <lark-td>
      NOT in lift-test-result — comes from lift-test-get config or aggregated platform spend
    </lark-td>
    <lark-td>
      Required to interpret any iROAS / CAC value. Pull from the config source, not the result table.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Confidence interval (lift %)
    </lark-td>
    <lark-td>
      In extra_info JSON
    </lark-td>
    <lark-td>
      Render as [X% ~ Y%] matching UI format.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Significance
    </lark-td>
    <lark-td>
      - If extra_info JSON contains Confidence interval, derived from CI crossing zero
      - If extra_info JSON does not contain Confidence interval, then significant by default
    </lark-td>
    <lark-td>
      Render as “Significant” / “Not significant” matching UI badge.
    </lark-td>
  </lark-tr>
</lark-table>

**Fields in lift-test-result that the readout does NOT expose**
These are derived inputs, metadata, or out-of-scope for the readout skill:
- ctrl_orders, test_orders, nc_ctrl_orders, nc_test_orders — counterfactual / treatment-side raw counts; inputs to the lift % calc, not user-facing
- iaov, nc_iaov — UI does not surface these by default; do not render unless the user explicitly asks
- summable, update_time, test_channel_index — metadata
- ads_platform_data JSON — out-of-scope (attribution comparison view; see §7)
- start_date, end_date, cooldown_end_date — test-window metadata; reference them as phrases (“test window: Mar 5 – Mar 26”), don’t dump raw
**Store-family labels (always apply)**

<lark-table rows="5" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **DB field family** {align="center"}
    </lark-td>
    <lark-td>
      **Render as** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      shopify_*
    </lark-td>
    <lark-td>
      “DTC” (never “Shopify” — the store may be a custom site)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      amazon_*
    </lark-td>
    <lark-td>
      “Amazon”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      tiktok_*
    </lark-td>
    <lark-td>
      “TikTok Shop”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      combined_*
    </lark-td>
    <lark-td>
      “Combined” or “combined across all stores”
    </lark-td>
  </lark-tr>
</lark-table>

**Number formatting (always apply)**

<lark-table rows="6" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **Type** {align="center"}
    </lark-td>
    <lark-td>
      **Format** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Per-order count
    </lark-td>
    <lark-td>
      ≥ 1,000 → 1,234; < 1,000 → integer 146
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      ROAS / iROAS / NC iROAS values
    </lark-td>
    <lark-td>
      $X.XX always 2 decimals — $2.10, $0.58
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Percentages
    </lark-td>
    <lark-td>
      X.X% one decimal — 13.5%, 0.2%
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Dollar amounts ≥ $1,000 | `$X,XXX—$10,989| | Per-unit costs < $1,000 |$XX.XX—$76.31| | Confidence intervals |[X% ~ Y%]` matching UI format
    </lark-td>
    <lark-td>
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Significance flag
    </lark-td>
    <lark-td>
      “Significant” / “Not significant” (match UI badge exactly)
    </lark-td>
  </lark-tr>
</lark-table>

**Always round** — never carry source precision through. $2.1287643 is wrong, $2.13 is right.
## SOP
**Step 1 — Resolve the test(s)**
Apply §3.1 rules to identify the target test(s). If ambiguous (multiple matches, partial name), surface candidates and ask the user to pick — **don’t guess**. If the named test is still running, surface its status and stop — don’t read partial data.
**Step 2 — Pull the result data**
From **lift-test-get** (test config / metadata):
- Primary metric (orders / new_customers)
- **Ad spend** (aggregated)
- Test calibration status (Calibrated / Not calibrated, with date)
- Test window dates (start_date, end_date, cooldown_end_date)
From **lift-test-result** (per-sales-platform result rows):
- iorders → “Incr. orders”
- lift_pct → “Lift %”
- icpa → “Cost per incr. order”
- isales → “Incr. sales”
- iroas → “Incr. ROAS”
- nc_iorders, nc_icpa, nc_isales, nc_iroas → NC equivalents (UI labels per §3.2)
- Combined (cross-store) row when applicable
From **extra_info** JSON (if schema verified):
- Confidence interval (lift %)
- Significance flag
**Step 3 — Determine the read shape**
Pick the right structural template based on what the user asked:

<lark-table rows="6" cols="2" column-widths="264,315">

  <lark-tr>
    <lark-td>
      **User intent** {align="center"}
    </lark-td>
    <lark-td>
      **Read shape** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “How did my X test do”
    </lark-td>
    <lark-td>
      **Standard readout**: Summary table → headline observation → per-channel call-outs
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Should I scale / pull back / reallocate”
    </lark-td>
    <lark-td>
      **Decision-oriented readout**: Summary numbers first, then a recommendation framed in §6 vocabulary
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Why is X not significant”
    </lark-td>
    <lark-td>
      **Significance explainer**: short prose on what “not significant” means here + the specific row’s data
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “How did my last N tests do”
    </lark-td>
    <lark-td>
      **Multi-test readout** (see §4 Step 5 branch)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Single specific metric (“what was the iROAS”)
    </lark-td>
    <lark-td>
      Direct answer + the one piece of context that makes it useful (significance, or comparison to target if the user named one)
    </lark-td>
  </lark-tr>
</lark-table>

**Step 4 — Build the readout following the rubric**
Apply these rules from the data-interpretation rubric in every output:
- **Connect every metric to an implication.** Never report a number in isolation. “$2.10 iROAS” is not enough — pair it with significance, or with the user-stated target if there is one, or with the spend it represents in dollar terms.
- **Pair lift with the confidence interval. **Every test runs at a fixed 95% confidence level — what varies is the CI's width and whether it crosses zero. A 13.5% lift with CI `[16% ~ 30%]` is a confirmed result (CI entirely above zero, "Significant"). A 13.5% lift with CI `[-2% ~ 18%]` is not a confirmed result, even though the point estimate looks the same — the data can't rule out zero or negative lift ("Not significant"). Always surface the CI and significance flag alongside the lift %.
- **Comparative framing — only when the reference is in the data.** Compare to: user-stated target (if they mentioned one), prior period (if data has it), or another channel in the same test. **Never invent a target** like “above $1.00 baseline” if the user didn’t state one. If no comparison reference exists, state the magnitude as a fact and let it stand.
- **Frame stakes in dollars where possible.** Use dollar amounts over bare percentages where it fits the moment. “$11k incremental sales on $11k ad spend” lands harder than “13.5% lift.”
- **Acknowledge what wasn’t measured.** If the test was Meta-only, don’t speculate about Google or TikTok. If Amazon halo wasn’t measured (no marketplace in scope), say so when the user asks decision questions.
- **NC ROAS / NC iROAS < $1.00 is normal.** First-purchase revenue typically doesn’t cover full CAC. Don’t flag it as a problem unless the user explicitly framed it that way. Assess against LTV or other-channel CAC if those are in the data.
- **Don’t add evaluative adjectives.** Banned: strong, solid, weak, significant (as adjective; “Significant” as the UI badge is fine), meaningful, substantial, remarkable, considerable, robust, compelling, impressive. Numbers speak for themselves; magnitude descriptors should be tied to a reference (“above your <equation>1.00 target”, “stays above </equation>X”, “diminishing past $X”).
- **Don’t speculate about causes.** No “this is probably because creative was strong” or “targeting may have been too narrow.” Stick to what the data shows.
- **Don’t name specific statistical algorithms.** No SCM, DiD, SARIMAX — DS hasn’t confirmed which model is used. Say “our matched-market model” if you need to reference it at all.
**Step 5 — Make a recommendation (only when the user asked a decision question)**
If the user asked “should I scale / cut / shift” or similar, end with one recommendation from this **fixed vocabulary** — never invent new labels:

<lark-table rows="5" cols="2" column-widths="201,336">

  <lark-tr>
    <lark-td>
      **Label** {align="center"}
    </lark-td>
    <lark-td>
      **When to use** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Scale**
    </lark-td>
    <lark-td>
      Increase budget — marginal returns still healthy at current spend
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Maintain**
    </lark-td>
    <lark-td>
      Keep current spend — near the efficient frontier
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Optimize**
    </lark-td>
    <lark-td>
      Keep total budget but reallocate within the channel (tactics, creatives, geos)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Adjust and retest**
    </lark-td>
    <lark-td>
      Performance below target — modify creative / targeting / pacing and rerun
    </lark-td>
  </lark-tr>
</lark-table>

**Framing rules** (from the rubric):
- Use “consider X” not “we recommend X” in the major narrative recommendation. Suggest, don’t dictate.
- **Never frame the action as a “cut.”** Frame as reallocation toward higher-mROAS bands or channels. (For partner-funded studies especially, “cut” can trigger complications with the partner sponsor.)
- **Never blame the channel for “underperforming.”** Describe what the data shows; let the action follow from comparison to the user’s target or alternative.
- **Surface tradeoffs.** Never recommend X without noting what’s given up. “Consider shifting budget to higher-mROAS channels — at the cost of [what].”
- **Cross-channel allocation, attribution calibration, and similar product-owned decisions belong to the relevant tool** (MBO for budget allocation, attribution model for calibration). Don’t try to own these in the readout — hand off to the tool.
**Data-read slots stay declarative.** Facts are not suggestions. “146 incremental orders, $1.13 iROAS, above your stated $1.00 target” is a data read — it should be declarative, not hedged. The “consider” softening applies only to the recommendation slot.
**Step 5b (multi-test branch) — Handling “my last N tests” requests**
When the user asks about multiple tests at once:
- Pull all resolved tests’ top-line rows in a single comparison table
- Sort by recency by default; let the user re-sort if they ask
- Don’t try to weave a narrative across tests unless the user asked a synthesis question (“which test performed best”) — and even then, compare on the same metric with the same significance treatment
- Flag any test still in progress or with Not significant — these don’t roll up cleanly into “how are my tests doing overall”
**Step 6 — Offer the deck handoff (when appropriate)**
If the readout has produced a substantive interpretation (more than just a single metric pull), end with a soft offer:
“Want this as a deck for sharing internally? I can generate a slide-formatted version.”
Don’t offer the deck for:
- Single-metric queries (“what was the iROAS”) — overkill
- Status checks (“is my test running”) — wrong shape
- Cases where the result is “not significant across the board” — nothing to deck up
When the user accepts the deck offer, trigger the deck-generation pipeline (the rubric document is the system prompt for that pipeline — readout doesn’t duplicate that logic, it just hands off).
## Tools used

<lark-table rows="5" cols="3" column-widths="176,176,238">

  <lark-tr>
    <lark-td>
      **Tool** {align="center"}
    </lark-td>
    <lark-td>
      **Required?** {align="center"}
    </lark-td>
    <lark-td>
      **Purpose** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-list
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Resolve “my last test” / “my last 3 tests” / partial-name matches
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-get
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Pull full test config, status, and stored primary metric
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-readout
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Pull result rows: ad spend, incr. orders, lift %, incr. ROAS, CI, significance, trendline data, calibration status
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Deck generation pipeline
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Hand off when the user accepts the deck offer in Step 6
    </lark-td>
  </lark-tr>
</lark-table>

If a needed field isn’t in the lift-test-result table (e.g., attribution comparison breakdown — explicitly out of scope for this skill version), don’t fabricate it. Either skip that part of the read or tell the user that piece isn’t available here.
## **Output format**
**Standard single-test readout** (most common shape):
Test: 20260320-Meta Ads - 20% DTC orders - PTM (Completed, Calibrated 03/20/2026)
Primary metric: Orders

Summary:
| Channel    | Ad spend  | Incr. orders | Lift % | Incr. ROAS | CI (lift %) | Significance     |
| Combined   | $29,873   | 29,873       | 13.5%  | $2.50      | [22% ~ 38%] | Significant      |
| DTC        | $29,873   | 29,873       | 13.5%  | $2.10      | [16% ~ 30%] | Significant      |
| Amazon     | —         | 29,873       | 13.5%  | $1.80      | [-2% ~ 18%] | Not significant  |

Headline:
- On DTC, the test shows $2.10 incremental ROAS at 13.5% lift, with the confidence interval entirely above zero — the result rules out no-lift.
- The Amazon halo measurement spans below zero in the CI ([-2% ~ 18%]) — the data can't rule out zero halo from this Meta spend.
Want this as a deck for sharing internally?

**Decision-oriented readout** (when user asked “should I scale Meta”):
[Same summary table as above]

Read:
- DTC iROAS is $2.10, above the typical $1.00 break-even for blended-margin businesses. At current spend ($10,989), Meta is producing incremental revenue at a clear positive return on this channel.
- The confidence interval is fully above zero — the lift signal isn't being driven by noise.
- Halo to Amazon couldn't be confirmed in this test — that channel's lift CI spans zero.
Consider: Scale Meta. Marginal returns at current spend look healthy. Tradeoff: this test measured the current spend level — at materially higher daily budgets, expect diminishing returns past the point this test covered. To size up the next budget step with confidence, run an MBO scenario or schedule a follow-up test at the higher spend.
Want this as a deck?

**Significance explainer** (when user asks “why is X not significant”):
The Amazon row shows lift % of 13.5%, but its confidence interval is [-2% ~ 18%].
The CI is the range the true lift % likely falls in, at 95% confidence. Because that range crosses zero, the data can't rule out that the actual halo to Amazon was zero (or even slightly negative). That's what "Not significant" means — not that the result is bad, but that this test didn't have enough signal on the Amazon side to confirm direction.
The DTC row on the same test was significant, so the Meta spend did drive incremental DTC orders. The halo question on Amazon is the part that needs more data to resolve.

**Multi-test readout**:
Last 3 completed tests:
| Test                                          | Channel  | iROAS  | Lift %  | CI            | Significance     |
| 20260320-Meta Ads - 20% DTC orders - PTM     | DTC      | $2.10  | 13.5%   | [16% ~ 30%]   | Significant      |
| 20260215-TikTok - new customer test - LTM    | DTC      | $1.40  | 8.2%    | [3% ~ 13%]    | Significant      |
| 20260108-Google - Prospecting tactic - PTM   | DTC      | $0.90  | 2.1%    | [-1% ~ 5%]    | Not significant  |
Notes:
- Two tests confirmed positive lift; the Google Prospecting test came back not significant — the CI on lift % crossed zero.
- These tests measured different channels at different time windows; direct cross-test comparison should be read with that caveat.
**Banned output shapes**:
- ❌ Raw numbers without context (“DTC iROAS is $2.10. Amazon iROAS is $1.80. Combined is $2.50.”)
- ❌ Evaluative adjectives (“strong DTC lift”, “solid result”, “weak halo”)
- ❌ Speculative causes (“creative probably resonated”, “targeting was likely tight”)
- ❌ Made-up benchmarks (“above the typical $1.50 industry baseline” — unless the user said it)
- ❌ Specific algorithm names (SCM, DiD, SARIMAX, SARIMA)
- ❌ ISO source-precision numbers ($2.1287643, 13.4571%)
- ❌ “Cut Meta spend” framing — always reallocate / shift toward higher-mROAS
- ❌ Blaming the channel (“Meta underperformed”) — describe what the data shows
- ❌ Owning cross-channel allocation decisions in prose — hand off to MBO
- ❌ Inventing fields not in lift-test-result (e.g. fabricating new-customer counts when only NC orders are present, or attribution-model breakdowns that are out of scope here)
## **Edge cases & routing**

<lark-table rows="16" cols="2" column-widths="264,547">

  <lark-tr>
    <lark-td>
      **Edge case** {align="center"}
    </lark-td>
    <lark-td>
      **How to handle** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Test is still running
    </lark-td>
    <lark-td>
      Surface status (Running, with end date). Don’t read partial data. Tell the user when results will be ready.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Test is in cooling period
    </lark-td>
    <lark-td>
      State that the test window has ended but cooling is ongoing; results are preliminary. Offer to come back when cooling closes.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Test came back not significant across **every** row
    </lark-td>
    <lark-td>
      Read it honestly. Don’t manufacture insight. Suggest routing to diagnosis: “This test couldn’t confirm lift in either direction — to figure out what to change before rerunning, the diagnosis skill can walk through the likely causes.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Test failed setup or was terminated early
    </lark-td>
    <lark-td>
      State the status; don’t pretend there are results to read. Route to diagnosis.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Calibration status is **Not calibrated**
    </lark-td>
    <lark-td>
      Surface it as context — the platform / tactic test went through but didn’t roll into attribution calibration. Don’t editorialize on whether that’s a problem.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asked about an Amazon-only or marketplace-only test
    </lark-td>
    <lark-td>
      Same shape, just the marketplace as primary. NC-orders framing per-store applies (~X new Amazon customers).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asked a decision question but the test result is Not significant
    </lark-td>
    <lark-td>
      Honestly say the data doesn’t support a directional recommendation. Suggest **Adjust and retest** from the vocabulary, or recommend running a new test with adjusted parameters (route to creation skill). Don’t pick Scale or Maintain on a non-significant signal.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asked about a specific tactic / campaign-level test
    </lark-td>
    <lark-td>
      Same shape, but flag that campaign-level tests don’t feed attribution calibration (UI also surfaces this).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asked for cross-test synthesis (“how is my measurement program going overall”)
    </lark-td>
    <lark-td>
      Pull recent tests, surface in a table, but **don’t roll up to a single number** — each test measured a different thing under different conditions.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks about a test that doesn’t exist
    </lark-td>
    <lark-td>
      List close matches; ask which one they meant. Don’t guess.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks “what’s the iROAS” and there are multiple sales channels
    </lark-td>
    <lark-td>
      Show the per-channel breakdown (DTC vs. Amazon vs. Combined). Don’t pick one silently.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User claims a target (“I need iROAS above $2”) and the result is at the boundary
    </lark-td>
    <lark-td>
      State the comparison plainly: “$2.10 iROAS — above your $2.00 target, with the CI at [$1.85 ~ $2.40].” Let the boundary speak for itself; don’t editorialize.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks “is this good?” with no stated target
    </lark-td>
    <lark-td>
      Don’t invent a target. Describe the result against significance and the user’s prior tests (if available). State: “iROAS of $X with a CI that doesn’t cross zero — the data confirms incremental return. Whether $X clears your business’s break-even depends on your margin structure.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Result conflicts with the user’s expectation (“I thought Meta was working better”)
    </lark-td>
    <lark-td>
      Don’t validate or dismiss the prior belief. Surface the data and what it does and doesn’t say. <text bgcolor="light-yellow">The platform’s attribution-model number (in the attribution comparison view, when available) may explain why their belief diverged — but reading that is out of scope for this skill version.</text>
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Multiple stores, conflicting signals (DTC significant positive, Amazon significant negative)
    </lark-td>
    <lark-td>
      Read each store’s result on its own. Don’t summarize across with a single label. Note the divergence and recommend the user weigh each store’s economics separately.
    </lark-td>
  </lark-tr>
</lark-table>

## **Failure modes (never do these)**
**On data integrity**:
- ❌ **Inventing fields not in the data**. If “new customers acquired” isn’t a stored count, don’t substitute it for nc_orders. Allowed shorthand: ~X new customers (with tilde) qualified by store (~X new DTC customers).
- ❌ **Made-up benchmarks**. No “above the typical $1.50 baseline” unless the user stated $1.50. No “industry average” claims.
- ❌ **Source-precision numbers**. Always round per §3.2 number formatting.
- ❌ **Naming statistical algorithms** (SCM, DiD, SARIMAX). DS hasn’t confirmed which model is used. Say “our matched-market model” only if you need to refer to it.
- ❌ **Speculating about why the result is what it is** (creative, targeting, pacing). Stick to the data.
- ❌ **Referencing fields that are in the database but whose semantic meaning hasn’t been verified** (e.g. minimum_detectable_lift, factor, expected_daily_spend in result-context). If unsure what a field represents in this context, don’t surface it.
**On terminology**:
- ❌ Saying “underperformed” or “weak” of a channel — describe the data
- ❌ Saying “cut Meta” — always “reallocate toward higher-mROAS” / “shift budget”
- ❌ Evaluative adjectives (strong, solid, weak, meaningful, substantial, remarkable, considerable, robust, compelling, impressive). Use neutral descriptors tied to data (“above,” “below,” “stays above <equation>X,” “diminishing past </equation>X”).
- ❌ Calling NC iROAS < $1 a problem unprompted — it’s normal. First-purchase revenue typically doesn’t cover full CAC.
**On recommendation framing**:
- ❌ Recommending **Scale** on a Not-significant result
- ❌ Recommending without surfacing the tradeoff
- ❌ Inventing recommendation labels outside Scale / Maintain / Optimize / Adjust and retest
- ❌ Owning cross-channel allocation prose (“shift 30% of Meta’s $40k to Google”) — that’s MBO’s job; hand off
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
- ❌<text bgcolor="light-yellow"> </text>Fabricating attribution-comparison interpretation (out of scope for this skill version)
- ❌ Reading test setup details as if they were results
- ❌ Trying to do remediation prose (“here’s how to fix the test”) — that’s diagnosis’s job
- ❌ Trying to teach the methodology in depth (“here’s how PTM works”) — that’s knowledge base’s job
**On deck handoff**:
- ❌ Offering the deck on every read (only when the read is substantive)
- ❌ Generating deck content inline instead of handing off to the deck pipeline
- ❌ Duplicating the rubric’s interpretation logic inline — the deck pipeline owns that; readout produces a chat-shape interpretation
1. **References & related skills**

<lark-table rows="4" cols="2" column-widths="264,455">

  <lark-tr>
    <lark-td>
      **Skill** {align="center"}
    </lark-td>
    <lark-td>
      **Relationship** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-creation`
    </lark-td>
    <lark-td>
      Upstream: how the test being read was set up. Route here when the user follows up with “rerun this with adjusted parameters.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-diagnosis`
    </lark-td>
    <lark-td>
      Sideways: how to diagnose failed or inconclusive tests — implementation drift, data readiness gaps, underpowered designs. Route here when the user’s question shifts from “what does it mean” to “how do I fix / rerun it.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Deck generation pipeline`
    </lark-td>
    <lark-td>
      Downstream: triggered when the user accepts the deck offer. Rubric document is the system prompt for that pipeline.
    </lark-td>
  </lark-tr>
</lark-table>
