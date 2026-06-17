---
name: lift-test-creation
description: Turn a natural-language request into a well-configured, executable geo lift test draft and create it in the WorkMagic platform. Use when the user wants to create, set up, run, launch, or start a lift test / incrementality test / experiment (e.g. "Run a Meta lift test", "Set up a lift test at the tactic level"). Not for reading existing test results or diagnosing failed tests.
---

# lift-test-creation

## 1. Purpose
Turn the user’s natural-language request into a **well-configured, executable lift test draft**, and land it in the platform. **Do not make undisclosed key decisions on the user’s behalf**, **do not expose internal parameter names**, and **do not create a test when conditions aren’t met**. This is the default creation skill in the Lift Test domain.
## 2. When to trigger
**Trigger condition**: The user’s request contains a verb like “create / set up / run / launch / start” plus an object that points to “experiment / lift test / incrementality test / measure incrementality.”
**Examples that should trigger this skill**:
- “Create a lift test for me”
- “Run a Meta lift test”
- “Set up a lift test on Meta at the tactic level”
- “Create a Meta lift test that finishes before July 15”
- “Run a lift test on both Meta and Google”
- “Run a Meta lift test in the US but exclude New York and California”
**Examples that should NOT trigger this skill — route to another skill instead**:

<lark-table rows="5" cols="2" column-widths="264,264">

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
      Query results / progress of an existing lift test
    </lark-td>
    <lark-td>
      `lift-test-readout`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Compare multiple completed tests
    </lark-td>
    <lark-td>
      `lift-test-readout`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Why did my test fail / come back inconclusive?”
    </lark-td>
    <lark-td>
      `lift-test-diagnosis`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Conceptual questions about PTM vs. LTM / wanting documentation
    </lark-td>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
  </lark-tr>
</lark-table>

## 3. Inputs
**Core fields**:

<lark-table rows="18" cols="3" column-widths="176,176,437">

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
      adPlatform
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The ad platform the user named (Meta, Google, TikTok, etc.). **Apply alias mapping silently** (FB→Meta, GA→Google Ads, IG→Meta). If the user didn’t name one, **ask**.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      testLevel
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      platform / tactic / campaign. If the user didn’t say, **ask in business language** (“Test the entire account, a specific tactic, or particular campaigns?”).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      impactCampaignInfos
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Tactic ID(s) when testLevel = tactic; campaign ID(s) when testLevel = campaign. **Must ask** (unless the user already named specific tactics/campaigns). Use lift-test-impact-campaigns to fetch the candidate list.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      testStartTime
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      If the user didn’t say, **ask last** — other fields can be resolved first. **Never** accept a past date.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      salesChannel
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Query DB for the tenant’s connected sales channels, show them to the user for confirmation. Default to all selected (every channel in **Ready** or **Not optimal** state).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      primaryMetric
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Default orders. Switch to new_customers when the user says “acquisition / new customer.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      country
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Query trailing-90-day sales share, auto-pick the dominant country. Only **7 countries supported**: US / AU / CA / FR / DE / UK. **Other countries error out** — never hard-build.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      geoLevel
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Derive from country: US → DMA; others → postcode. **US state only when the user explicitly says so.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      method
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Derive from ad spend: if PTM is Sufficient → PTM; otherwise LTM. **Honor explicit user choice exactly** — do not silently switch.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      approach
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Derive from liftTestAdsPlatformList: if the platform supports automatic → automatic; otherwise manual. **MNTN / Walmart Connect / Roku / Universal Ads / Vibe / TikTok GMV Max** are manual-only.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      timezone
    </lark-td>
    <lark-td>
      Auto
    </lark-td>
    <lark-td>
      Query dwd_view_analytics_tenant_timezone. Don’t ask the user.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      locationSetting
    </lark-td>
    <lark-td>
      Auto + user override
    </lark-td>
    <lark-td>
      By default, query the tenant’s currently scheduled + active tests and auto-exclude the union of their control + test geos (**to avoid colliding with running tests**). Layer the user’s explicit exclude / include on top.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      numberOfCells
    </lark-td>
    <lark-td>
      Auto
    </lark-td>
    <lark-td>
      When the user names multiple platforms, automatically split into multiple 2-cell tests. **Don’t ask the user to pick this.** Explain in the summary in business language: “I’ll split this into N separate 2-cell tests, one per platform.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      holdoutPct
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Default 0.05. **The user should never see this field name**, unless design fails and the value needs adjusting.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      testPeriod
    </lark-td>
    <lark-td>
      Design output
    </lark-td>
    <lark-td>
      Computed by the design engine, 14–60 days. When the user states a constraint like “4 weeks,” check whether it’s feasible.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      coolingPeriod
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Default 7 days. Range 1–28. Suggest 14–28 when the user mentions long-consideration categories (furniture, electronics, etc.).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      status
    </lark-td>
    <lark-td>
      Default
    </lark-td>
    <lark-td>
      Default draft. Don’t go straight to schedule unless the user explicitly says so.
    </lark-td>
  </lark-tr>
</lark-table>

**3.1 Alias mapping (apply silently)**

<lark-table rows="10" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Map to** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “FB”, “Facebook”, “Meta”
    </lark-td>
    <lark-td>
      Meta Ads
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “GA”, “Google”, “Goggle” (tolerate minor typos)
    </lark-td>
    <lark-td>
      Google Ads
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “TT”, “TikTok”
    </lark-td>
    <lark-td>
      TikTok Ads
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Snap”
    </lark-td>
    <lark-td>
      Snapchat Ads
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “Pin”, “Pinterest”
    </lark-td>
    <lark-td>
      Pinterest Ads
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “PTM”, “pause”, “pause to measure”
    </lark-td>
    <lark-td>
      PTM
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “LTM”, “launch”, “launch to measure”
    </lark-td>
    <lark-td>
      LTM
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “auto”, “automatic”, “let WorkMagic do it”
    </lark-td>
    <lark-td>
      automatic
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “manual”, “I’ll do it myself”, “I’ll set up on platform”
    </lark-td>
    <lark-td>
      manual
    </lark-td>
  </lark-tr>
</lark-table>

**3.2 Time-constraint parsing**
When the user mentions time, distinguish three semantics correctly:

<lark-table rows="6" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Parse as** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “starts June 1” / “start June 1”
    </lark-td>
    <lark-td>
      testStartTime = June 1
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “finish before July 15” / “ends by July 15”
    </lark-td>
    <lark-td>
      **deadline** — back-solve testStartTime (must leave room for design-computed experiment_days + 7d cooling)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “run for 4 weeks” / “4-week test”
    </lark-td>
    <lark-td>
      testPeriod target = 28 days
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “as fast as possible”
    </lark-td>
    <lark-td>
      Use the shortest viable testPeriod (14d), but flag the higher daily-budget requirement
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Past date (“yesterday”, “June 1 2024” when today is 2026)
    </lark-td>
    <lark-td>
      **Error out** — don’t hard-build. Ask whether the user meant a different date.
    </lark-td>
  </lark-tr>
</lark-table>

**Conflicting constraints** (e.g. “finish in 4 weeks + daily spend < $3k + Meta”): clarify, don’t silently drop part of it.
**3.3 Geo-constraint parsing**

<lark-table rows="6" cols="2" column-widths="264,264">

  <lark-tr>
    <lark-td>
      **User says** {align="center"}
    </lark-td>
    <lark-td>
      **Handle** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “exclude New York” (geoLevel = DMA)
    </lark-td>
    <lark-td>
      “New York” is ambiguous (city / state / DMA?) — **clarify**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “exclude New York” (geoLevel = state)
    </lark-td>
    <lark-td>
      Parse as NY state
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “exclude Texas, Florida, and Arizona”
    </lark-td>
    <lark-td>
      locationSetting = exclude + [TX, FL, AZ]
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      “only run in California”
    </lark-td>
    <lark-td>
      locationSetting = include + [CA]
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User names a geo that doesn’t exist in our geo reference
    </lark-td>
    <lark-td>
      Error out and list the closest candidates
    </lark-td>
  </lark-tr>
</lark-table>

## SOP
**Step 1 — Parse the user’s request to collect parameters**
Scan the user’s wording against the §3 table; resolve every field you can (alias mapping, time parsing, geo parsing all apply here). **Record fields the user already specified — never re-ask them later.**
---

**Step 2 — Ask for ad platform or impactCampaignInfos if they’re missing**
There are only two minimum-mandatory ask fields:
- **ad platform** (if the user didn’t name one)
- **impactCampaignInfos**: when testLevel = tactic or campaign, you need the specific tactic / campaign. **Ask for testLevel first** (in business language: “Test the entire Meta account, a specific tactic, or just a few campaigns?”), then call lift-test-impact-campaigns to pull the candidate list based on the answer.
**Asking rules**:
- At most 1–2 questions per turn
- Use business language — never expose numberOfCells / holdoutPct / MDL / experiment_days
- Don’t ask for country / salesChannel / primaryMetric / timezone / coolingPeriod — these have defaults or can be inferred. Let the user confirm them in Step 4.
---

**Step 3 — Resolve defaults**
Resolve every “has default” field from the §3 table:
- **salesChannel** — query DB for the tenant’s connected channels (only **Ready** / **Not optimal**), default all selected
- **country** — query trailing-90-day sales share, auto-pick the dominant country
- **geoLevel** — derive from country (US→DMA, others→postcode)
- **approach** — derive from liftTestAdsPlatformList (whether the platform supports automatic)
- **method** — call lift-test-scan to check whether the current ad spend makes PTM Sufficient
- **timezone** — query dwd_view_analytics_tenant_timezone
- **locationSetting** — call lift-test-scan to fetch currently scheduled + active tests, auto-exclude the union of their control + test geos
- **holdoutPct** — default 0.05
- **status** — default draft
---

**Step 4 — Generate API parameters, echo them back in business language, and ask the user to confirm**
**This is the ONLY full-configuration confirmation in the flow.**
**Single-confirmation rule**: Step 4 is the only point where the user is asked to confirm the full configuration. After this confirmation, subsequent steps (design call, Sufficient check, start-date question, create call) MUST NOT re-prompt for full-config confirmation. They may surface progress updates (“Design came back — here’s the test period and feasibility”) and may ask for input on a SPECIFIC new decision (e.g. “Design came back Insufficient — pick a lever” or “When should this start?”), but they **never** restate the full config and ask “is this still OK?”. The next confirmation gate is the draft link in Step 8, where the user reviews in the UI — not in chat.
Show all collected + resolved fields to the user with these rules:
- **Business language only**: no attr_model_name, holdoutPct, numberOfCells, experiment_days, MDL, etc.
- **Surface override preferences explicitly**: “You chose LTM, but our recommendation is PTM because Meta already has significant spend. Want to stick with LTM?” — ask once. If the user holds firm, respect it. **Do not lecture.**
- **Flag conflicts**: when the user’s preference differs from the system recommendation, name the difference, ask once, do not force-override.
- **Explain multi-platform**: when the user names multiple platforms, say plainly: “I’ll split this into N separate 2-cell tests, one per platform — Meta and Google.”
- **Don’t expose internal mappings**: never say “mapping Meta to facebookMarketing” — just say Meta.
---

**Step 5 — After user confirmation, call lift-test-design**
Call the design API to generate the geo pair. Possible failures:

<lark-table rows="5" cols="2" column-widths="264,304">

  <lark-tr>
    <lark-td>
      **Design failure** {align="center"}
    </lark-td>
    <lark-td>
      **How to handle** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      holdoutPct too low, not enough data
    </lark-td>
    <lark-td>
      Don’t silently raise holdoutPct — ask the user: “We’d need a larger holdout (more geos in the holdout side) — OK with that?”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Too many locationSetting excludes
    </lark-td>
    <lark-td>
      Tell the user “Too many geos excluded — the engine can’t form enough candidate pairs,” recommend loosening.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Sales-channel readiness insufficient
    </lark-td>
    <lark-td>
      Name the specific channel that’s not ready, suggest removing it or fixing the data.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Country not supported / data volume too low
    </lark-td>
    <lark-td>
      Name the specific limit, offer at least 2 next steps.
    </lark-td>
  </lark-tr>
</lark-table>

---

**Step 6 — Based on the design, determine Sufficient / Insufficient**
Call lift-test-design-analyze to compute expected daily spend; compare to historical daily spend:
- **Sufficient** → proceed
- **Insufficient** → tell the user: “Current daily spend is X;thetestneeds Y to detect a meaningful lift within N weeks.” 
Offer the **three standard levers** (raise budget / increase geo size / extend test period), plus the option to proceed anyway:
- **Raise daily spend** to $Y (keep current geo size and test period)
- **Increase geo size** — re-run design with a larger geo footprint (more orders per geo lowers the feasibility threshold; current daily spend may already be enough)
- **Extend test period** to N+2 weeks (longer tests reduce the daily-spend requirement)
- **Proceed with current config** (result may come back inconclusive)
Re-running design with a larger geo size means calling `lift-test-design` again with a higher geo-size bracket (e.g. Minimum → 5% → 10%). Other levers don't require a new design call.
---

**Step 7 — Ask for testStartTime if not yet provided**
At this point design has produced testPeriod, so you can tell the user “The test will run N days + 7 days cooling — when should it start?”
**Avoid collisions**: when there are currently scheduled / active tests, note “There’s another test running through [date] — suggest starting after that.”
---

**Step 8 — Call lift-test-create-or-update to build the draft**
Parameter list (API field name → business-language label mapping):
- adPlatform ← ad platform
- testLevel ← test level
- impactCampaignInfos ← selected account / tactic / campaign
- testChannel ← built from ad platform + cell config (split into multiple cells for multi-platform)
- salesChannel ← sales channel
- primaryMetric ← primary metric
- country / geoLevel ← test country / geo granularity
- method ← test method (PTM/LTM)
- approach ← setup method (automatic/manual)
- locationSetting ← location settings
- testStartTime ← start date
- testPeriod ← test period (from design)
- coolingPeriod ← cooling period
- holdoutPct ← from design, never shown to user
- numberOfCells ← system-determined, never shown to user
- timezone ← auto
- status ← default draft
After creation, **return the draft link** so the user can review in the UI.
## Tools used

<lark-table rows="9" cols="3" column-widths="176,176,422">

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
      lift-test-scan
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Pull current ad spend, currently scheduled / active tests, PTM-Sufficient check
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-impact-campaigns
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Fetch candidate list when testLevel = tactic / campaign
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-design-prepare
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Package collected + resolved parameters into design inputs
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-design
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Generate geo pair; returns testPeriod, holdoutPct, feasibility threshold
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-design-analyze
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Compute expected daily spend, determine Sufficient / Insufficient, recommend PTM or LTM
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-create-or-update
    </lark-td>
    <lark-td>
      Required (final step)
    </lark-td>
    <lark-td>
      Create draft / update draft
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-list
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      When the user asks “what tests have I created before”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      lift-test-get
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Pull an existing draft when the user wants to modify mid-flow
    </lark-td>
  </lark-tr>
</lark-table>

## Output format
Format for each key stage:
**Step 4 user-confirmation summary** (the most important one):
Here's the config I'll use — confirm before I run the design:

Ad platform: Meta Ads
Test scope: tactic level — "Prospecting" tactic (12 campaigns)
Test method: PTM (pause Meta in a subset of geos to measure lift from removed exposure)
Setup: Automatic (WorkMagic handles the platform config and reverts at the end)
Country: United States (DMA level)
Sales channels: Shopify, Amazon (all your connected channels)
Primary metric: Orders
Excluded geos: New York DMA, Los Angeles DMA (per your request)

Anything to change? If not, I'll run the geo-pair design next.
**Step 6 Insufficient prompt**:
At your current daily spend (~$1.8k/day), 4 weeks likely won't be enough to detect a meaningful result.
We'd need roughly $2.5k/day to detect a 5% lift within 4 weeks.
A few options:
1. Raise daily spend to $2.5k, keep 4 weeks
2. Test a larger geo footprint (more orders per geo, so the threshold drops — current daily spend may be enough)
3. Keep current spend, extend to 6 weeks
4. Proceed with current config (result may come back inconclusive)
**Step 5/6 Design comparison** (when method wasn’t pinned in Step 4 and the design surfaces both PTM and LTM for the user to pick):
Design's back. Here's the comparison:

|                          | PTM ★                          | LTM                             |
| Method                   | PTM (Pause-to-Measure)         | LTM (Launch-to-Measure)         |
| Test period              | 21 days                        | 21 days                         |
| Treatment geos           | Holdout group: ~6% of orders   | Exposed group: ~8.6% of orders  |
| Feasibility threshold    | Auto-calculated ✓              | Auto-calculated ✓               |
| Budget sufficient        | ✓ Yes                          | ✓ Yes                           |

★ Recommended: PTM — Meta already has significant spend (~$131K/day), so pausing ads in a holdout group of DMAs is the ideal way to measure incremental lift.
**Note the labeling**: the “Treatment geos” row uses **method-specific** labels in each column — “Holdout group” for PTM, “Exposed group” for LTM. Do NOT use “Holdout group” in the LTM column; do NOT invent a unified “Treatment group” term. This matches the product UI.
**Step 8 after the draft is created**:
Draft created: [draft link]
Open it to finalize any last details, then schedule.
**Never output**:
- ❌ Internal field names (holdoutPct, numberOfCells, experiment_days, MDL, facebookMarketing)
- ❌ ISO timestamps in conversation (“testStartTime: 2026-06-01T00:00:00Z”)
- ❌ Long-form PTM-vs-LTM lectures
- ❌ Six technical questions at once
## Edge cases & routing

<lark-table rows="18" cols="2" column-widths="458,578">

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
      User says only “Create a lift test for me”
    </lark-td>
    <lark-td>
      Must ask ad platform and test level; use defaults / inferences for everything else. Cap at ≤ 4 turns.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User specifies LTM but PTM is the recommendation
    </lark-td>
    <lark-td>
      State the difference once. If the user holds firm, use LTM. **Don’t lecture twice.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User specifies automatic but the platform is manual-only (MNTN / Roku / Walmart Connect, etc.)
    </lark-td>
    <lark-td>
      Tell the user “This platform only supports manual setup,” walk through the steps. **Don’t silently switch.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User picks a country not in the supported list (“Japan”, “Brazil”)
    </lark-td>
    <lark-td>
      Error out, list the 7 supported countries, ask which one. **Don’t hard-build.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User-named tactic / campaign doesn’t exist in the ad account
    </lark-td>
    <lark-td>
      After lift-test-impact-campaigns, say “Couldn’t find a tactic called ‘X’ — candidates are: …”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User picked a sales channel that’s Not ready
    </lark-td>
    <lark-td>
      Name the specific readiness check that’s failing, point to Settings. **Don’t silently drop the channel.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Design fails (can’t form a geo pair)
    </lark-td>
    <lark-td>
      Give two directions: ① did the user set too many excludes? ② do we need a larger holdout? **Never expose “holdoutPct” by name** — say “more geos in the holdout side.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Design output is Insufficient
    </lark-td>
    <lark-td>
      Design output is Insufficient → Offer **4 next steps** (raise budget / increase geo size / extend time / proceed and accept) with concrete numbers.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User’s testStartTime collides with a currently running test
    </lark-td>
    <lark-td>
      Say “Another test is running through [date]; suggest starting after that.”
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User gives a past date as testStartTime
    </lark-td>
    <lark-td>
      Error out and ask if they meant something else. **Never hard-build.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User modifies a field mid-flow (“make it manual”, “push start to July 1”)
    </lark-td>
    <lark-td>
      Identify dependent fields: method change → re-run design; country change → re-pick geoLevel + re-run design. **Tell the user “Changed X, so I need to re-run design, one moment”** — then show the new summary for confirmation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User names multiple platforms (“Meta and Google”)
    </lark-td>
    <lark-td>
      Split into multiple 2-cell tests, explain in business language in the summary. **Never ask the user to pick numberOfCells.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for something out of scope (“compare two creatives”, “15 countries simultaneously”, “measure offline store traffic”)
    </lark-td>
    <lark-td>
      Don’t hard-build. Say “I can do X; for Y you’ll need your CSM,” and provide CSM contact guidance.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User has been re-clarified repeatedly and still no clear intent
    </lark-td>
    <lark-td>
      Stop guessing. Route to CSM.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Minor spelling errors (“Goggle Ads”, “Snapcaht”)
    </lark-td>
    <lark-td>
      Auto-correct to the right platform; show the correct name in the summary.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User uses short aliases (“FB”, “GA”)
    </lark-td>
    <lark-td>
      Silent mapping; surface the official name in the summary.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User’s budget constraint is ambiguous (“under $5k” — daily or total?)
    </lark-td>
    <lark-td>
      Clarify once: “Is $5k a daily cap or total test budget?”
    </lark-td>
  </lark-tr>
</lark-table>

## Failure modes (never do these)
**On mandatory asks**:
- ❌ **Building without asking for ad platform** — must be explicit
- ❌ **Defaulting testLevel to platform without asking** — must ask
- ❌ **Re-asking fields the user already specified** (user said “Meta tactic level”, then asking “which platform?”)
**On defaults**:
- ❌ **Hard-building with defaults when the user gave almost nothing** (e.g., “create a lift test for me” → Meta + platform + PTM + US silently)
- ❌ **Override the user’s preference without surfacing it** (user picks LTM, system flips to PTM without saying)
**On internal terminology**:
- ❌ Using PTM / LTM **without a brief inline explanation on first mention** — first use should be e.g. "PTM (pause-to-measure — pause Meta in a subset of geos to measure lift from removed exposure)"; after that, just "PTM" is fine
- ❌ **Using method-incorrect treatment-side labels** — the treatment side’s label depends on the test method, matching product UI:
  - **PTM** treatment side → **“Holdout group”** (ads paused here)
  - **LTM** treatment side → **“Exposed group”** (new spend introduced here)
  - **Reference / baseline side, any method** → **“Reference group”** Do NOT label the LTM treatment side as “Holdout group” — that contradicts the UI and confuses users. Do NOT invent a unified term like “Treatment group” — the product doesn’t use it.
- ❌ **Asking the user to fill holdoutPct / numberOfCells / experiment_days / MDL** — these are internal parameters
- ❌ **Showing facebookMarketing / attr_model_name / liftTestAdsPlatformList in the summary** — use business names
- ❌ **Exposing internal field labels (“Test DMAs”, “Control DMAs”)** — use “Holdout group” / “Reference group” to match the product UI
- ❌ **Using “Geo coverage” or “Expected daily spend” in design output** — use **“Geo size”** and **“Feasibility threshold”** to match the product UI
- ❌ **Including MDL in design output** — the UI doesn’t show it; don’t give it to the user
**On time**:
- ❌ **Treating a deadline as the start date** (“finish before July 15” → testStartTime = July 15)
- ❌ **Treating duration as a deadline** (“run for 4 weeks” → testEndTime = a specific date 4 weeks from now)
- ❌ **Hard-building with a past date**
- ❌ **Recommending a start date without avoiding running tests** — must call scan to check collisions
**On constraints**:
- ❌ **Building a draft when constraints can’t be satisfied** — state the gap and give next steps first
- ❌ **Silently dropping part of a multi-constraint request** — clarify
- ❌ **Misreading budget units** (treating total budget as daily)
- ❌ **Saying “can’t do it” without giving at least 2 actionable directions** when infeasible
**On platform / geo**:
- ❌ **Hard-building for an unsupported country** (Japan, Brazil, etc.) — error out and list supported
- ❌ **Silently switching to manual when the user said automatic but the platform is manual-only** — must surface
- ❌ **Misresolving an ambiguous geo name** (“New York” is a city / state / DMA — clarify, don’t guess)
- ❌ **Dropping a geo the user asked to exclude**
- ❌ **Silently dropping a Not-ready sales channel** — must surface
**On multi-platform**:
- ❌ **Dropping one of the platforms the user named**
- ❌ **Telling the user “I’ll split this into multiple cells” but then asking them to pick numberOfCells**
- ❌ **Not telling the user the test will be split into multiple 2-cell experiments**
**On mid-flow modification**:
- ❌ **Re-running design silently after a user-requested change** — say “Changed X, re-running design, one moment”
- ❌ **Partial updates** (platform changed, but country / approach / other derived fields not refreshed)
- ❌ **Making the user redo the whole flow from scratch**
**On the final draft**:
- ❌ **Final confirmation table missing fields** — must include primary metric and feasibility threshold
- ❌ **Double-confirming the config** — asking the user to confirm the full configuration a second time after Step 4 (e.g. echoing the full config again before calling create, or asking “shall I go ahead and create the draft?”). Step 4 is the only confirmation gate; Step 8 calls create directly. Progress updates and specific local questions (Insufficient lever choice, start date) are fine, but re-confirming the whole config is a regression.
- ❌ **Field labels not matching the UI** — Experiment days → Test period; treatment-side labels follow the method (PTM → Holdout group, LTM → Exposed group) — see the terminology rule above
- ❌ **Sales channel not defaulted to all selected**
- ❌ **Going straight to schedule instead of draft** (unless the user explicitly asked)
## 9. References & related skills

<lark-table rows="3" cols="2" column-widths="249,400">

  <lark-tr>
    <lark-td>
      **Skill**
    </lark-td>
    <lark-td>
      **Relationship**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-readout`
    </lark-td>
    <lark-td>
      Downstream: how to read and act on lift test results — interpreting iROAS, confidence intervals, and making post-test decisions.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-diagnosis`
    </lark-td>
    <lark-td>
      Downstream: diagnosing failed or inconclusive tests — implementation drift, data readiness gaps, and underpowered designs.
    </lark-td>
  </lark-tr>
</lark-table>
