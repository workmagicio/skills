---
name: attribution-edge-routing
description: Recognize when an attribution request falls outside attribution's capability boundary and route it gracefully — to another WorkMagic product (MBO / Lift Test / Creative Magic / Ads Magic), to a human, or to a clean decline that bridges to what attribution can answer. Exists to prevent fabrication. Use when the user asks for something attribution cannot answer (forecasts, out-of-scope data, etc.).
---

# attribution-edge-routing

## 1. Purpose
Recognize when a user request falls **outside attribution's capability boundary** and route it gracefully — either to another WM product (MBO / Lift Test / Creative Magic / Ads Magic), to a human (CSM / DS / Eng), or to a clean decline with a bridge to what attribution *can* answer. The skill exists to **prevent fabrication** (the worst failure mode in this domain) and to keep boundary cases from feeling like a dead end. Cold refusals destroy trust; graceful redirects preserve it.
## 2. When to trigger
Trigger when the user asks for something attribution cannot answer. The four boundary types:

<lark-table rows="5" cols="3" column-widths="150,294,294">

  <lark-tr>
    <lark-td>
      **Type**
    </lark-td>
    <lark-td>
      **Definition**
    </lark-td>
    <lark-td>
      **Example**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **A. Other-product**
    </lark-td>
    <lark-td>
      Within the WM product family but outside attribution. Needs MBO / Lift Test / Creative Magic / Ads Magic / Audience Magic.
    </lark-td>
    <lark-td>
      "Forecast my Meta ROAS for next quarter" → MBO
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **B. Out-of-scope**
    </lark-td>
    <lark-td>
      Not a WM product capability at all. Different tooling / methodology.
    </lark-td>
    <lark-td>
      "Show me my organic search rankings"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **C. Tenant boundary**
    </lark-td>
    <lark-td>
      WM could answer in principle, but this tenant lacks the data — channel not integrated, data window too short, sales platform not connected.
    </lark-td>
    <lark-td>
      "Show me TikTok ROAS" when TikTok isn't integrated
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **D. Data latency**
    </lark-td>
    <lark-td>
      WM has the capability and the integration, but the data isn't ready yet — recent events not yet processed (T+1 / T+2 / PPS backfill).
    </lark-td>
    <lark-td>
      "What was yesterday's ROAS?" when data lands T+1 and it's morning
    </lark-td>
  </lark-tr>
</lark-table>

**Do NOT trigger** when:
- The request is genuinely answerable by another attribution skill — route there directly, this skill isn't a clearing house for ambiguity (that's `attribution-intent-clarification`)
- The request has a documented default that the user is just unaware of (e.g., "what's our attribution model?" → answer it, don't escalate)
## 3. Inputs

<lark-table rows="6" cols="3" column-widths="258,201,279">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `boundary_type`
    </lark-td>
    <lark-td>
      Required (detected)
    </lark-td>
    <lark-td>
      A / B / C / D as defined above. Misclassifying leads to wrong routing — be careful.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `user_intent_summary`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      One-sentence restatement of what the user is trying to accomplish (not just the literal words). Use it to find the closest alternative product / answer / next step.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `nearest_supported_question`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The closest thing attribution **can** answer that gets the user partway there. Offered as a bridge, not a substitute.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `routing_target`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Where to send the user: another WM product (with link / activation path), CSM, DS, Eng, or just a clean decline.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenant_status`
    </lark-td>
    <lark-td>
      Conditional (Type C)
    </lark-td>
    <lark-td>
      For tenant-boundary cases: which integration is missing, what data range is available, which sales platforms are connected. Pull via `tenant-list` and `knowledge-base-ask`.
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Classify the boundary type**
Run through this decision sequence:
1. **Is the user asking for a prediction / forecast / scenario?** → Type A → MBO
1. **Is the user asking about incrementality / lift / true causal impact?** → Type A → Lift Test
1. **Is the user asking about creative content / asset performance per asset attribute (color, format, theme)?** → Type A → Creative Magic
1. **Is the user asking about a non-marketing data domain** (organic SEO rankings, customer support volume, inventory, finance)? → Type B
1. **Is the user asking for a channel / sales platform that isn't integrated?** → Type C
1. **Is the user asking for a time range outside the tenant's data window?** → Type C
1. **Is the user asking for very recent data (today, yesterday) that data lag hasn't covered yet?** → Type D
1. **None of the above** → re-check; this might not be an edge case after all
**Step 2: Verify with **`**tenant-list**`** + **`**knowledge-base-ask**` (mandatory for Type C, recommended for D)
- For Type C: `tenant-list` shows what integrations / sales platforms exist + what data window is available
- For Type D: `knowledge-base-ask` the data freshness conventions (T+1 for clicks, T+2 for PPS, etc.)
- **Don't guess.** If you'd guess wrong half the time, ask the tools.
**Step 3: Compose the routing response (4 parts)**
1. **Acknowledge what the user wants** — in their language, not yours. "Got it, you want to forecast next quarter's ROAS."
1. **State the boundary in business language** — no jargon. Not "out-of-scope dataset", but "Attribution shows historical performance, not forecasts."
1. **Give the specific routing path** — name the product / person + how to get there. "Forecasting is what our MBO tool does — it lives at [link]. If you're not provisioned, your CSM can turn it on."
1. **Offer a bridge** — the closest attribution can answer that's still useful. "While we wait on MBO, I can show you Meta's last 90 days of ROAS trend so you have a baseline."
**Step 4: Don't pad, don't apologize excessively**
- One acknowledgment line is enough — don't write a paragraph of "I'm sorry"
- End the turn. Don't ask "is that okay?" — let the user respond if they want the bridge
## 5. Routing matrix

<lark-table rows="16" cols="3" column-widths="259,194,285">

  <lark-tr>
    <lark-td>
      **User ask**
    </lark-td>
    <lark-td>
      **Type**
    </lark-td>
    <lark-td>
      **Routing**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Forecast next quarter's ROAS"
    </lark-td>
    <lark-td>
      A
    </lark-td>
    <lark-td>
      MBO. If not provisioned → CSM activation path.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "What's the real incremental impact of Meta?"
    </lark-td>
    <lark-td>
      A
    </lark-td>
    <lark-td>
      Lift Test. iDDA shows calibrated attribution; full incrementality measurement = Lift Test.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Which creative theme drives the most ROAS?"
    </lark-td>
    <lark-td>
      A
    </lark-td>
    <lark-td>
      Creative Magic (asset-level attributes). Attribution's `creative_attribution` can break down by creative ID but not by inferred theme.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Should I bid higher on Meta tomorrow?"
    </lark-td>
    <lark-td>
      A
    </lark-td>
    <lark-td>
      Ads Magic / MBO. Attribution is historical, not prescriptive.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Build me an audience to target next week"
    </lark-td>
    <lark-td>
      A
    </lark-td>
    <lark-td>
      Audience Magic.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Show me organic search rankings"
    </lark-td>
    <lark-td>
      B
    </lark-td>
    <lark-td>
      Not a WM product. Decline + bridge to paid-search attribution if relevant.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "How's my customer support volume trending?"
    </lark-td>
    <lark-td>
      B
    </lark-td>
    <lark-td>
      Not WM. Decline.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "What's my inventory turnover?"
    </lark-td>
    <lark-td>
      B
    </lark-td>
    <lark-td>
      Not WM. Decline.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Show me TikTok ROAS" — TikTok not integrated
    </lark-td>
    <lark-td>
      C
    </lark-td>
    <lark-td>
      Tell user TikTok isn't connected; route to **Integrations** page; offer to show connected channels meanwhile.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Show me 2 years of data" — tenant only has 6 months
    </lark-td>
    <lark-td>
      C
    </lark-td>
    <lark-td>
      Tell user the available window; offer that range as the alternative. Don't return partial data without explanation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Show me Shopify orders" — only Amazon Store integrated
    </lark-td>
    <lark-td>
      C
    </lark-td>
    <lark-td>
      Tell user only Amazon is connected; route to **Integrations**.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "What was yesterday's ROAS?" at 9am on T+1-lag data
    </lark-td>
    <lark-td>
      D
    </lark-td>
    <lark-td>
      Tell user yesterday's data lands by [time]; offer to run for the day before yesterday, or to set up a scheduled report that fires after data is ready.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Why does my last week's data keep changing?" — PPS backfill
    </lark-td>
    <lark-td>
      D
    </lark-td>
    <lark-td>
      Not actually edge-routing — route to `attribution-anomaly-diagnosis` (retroactive change explanation). Caught here only if misclassified.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "How do I set up my account?" / "How do I add a user?"
    </lark-td>
    <lark-td>
      B (or product-onboarding)
    </lark-td>
    <lark-td>
      Route to CSM or product docs; not attribution.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "My iDDA numbers seem wrong — can you check?"
    </lark-td>
    <lark-td>
      Not edge-routing
    </lark-td>
    <lark-td>
      Route to `attribution-anomaly-diagnosis` — it's the right tool, not an edge case.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Tools used

<lark-table rows="6" cols="3" column-widths="299,150,289">

  <lark-tr>
    <lark-td>
      **Tool**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Confirm what other WM products do + their activation paths; check data-freshness conventions for Type D
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenant-list`
    </lark-td>
    <lark-td>
      Required for Type C
    </lark-td>
    <lark-td>
      Verify which integrations / sales platforms are connected, what data window exists. Don't claim "TikTok isn't integrated" without checking.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-list`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      For incrementality asks routed to Lift Test — show what tests already exist or how to start one
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-list` / `budget-optimizer-reference-data`
    </lark-td>
    <lark-td>
      Conditional
    </lark-td>
    <lark-td>
      For forecasting asks routed to MBO — check whether tenant is provisioned
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      (no write tools)
    </lark-td>
    <lark-td>
      —
    </lark-td>
    <lark-td>
      This skill is read-only — never creates anything itself, only redirects.
    </lark-td>
  </lark-tr>
</lark-table>

## 7. Output format
One message, 4 parts in this order. Total length: ~3–5 sentences.
1. **Acknowledge** the user's actual goal (in their language)
1. **State the boundary** in business language — what attribution does vs. doesn't do
1. **Routing path** — named product / person + how to access
1. **Bridge** — closest attribution can answer right now
<callout emoji="bulb" background-color="light-gray" border-color="gray">
**Type A example** — "Forecast my Meta ROAS for next quarter"
Got it — you want to forecast Meta's ROAS for next quarter. Attribution shows historical performance; forecasting is what our **MBO** tool does. If MBO isn't turned on for your account, your CSM can activate it. Meanwhile, I can pull the last 90 days of Meta ROAS so you have a baseline — want me to?
</callout>

<callout emoji="bulb" background-color="light-gray" border-color="gray">
**Type B example** — "Show me my organic search rankings"
Organic search rankings aren't something WorkMagic measures — we focus on paid attribution across channels. For SEO data you'd want a tool like Ahrefs or Search Console. If you'd like, I can show you your **paid Google** performance over the same window so you have one half of the picture.
</callout>

<callout emoji="bulb" background-color="light-gray" border-color="gray">
**Type C example** — "Show me TikTok ROAS" (TikTok not integrated)
I checked your integrations — TikTok isn't connected yet, so we don't have any TikTok attribution data. You can add it from **Settings → Integrations**; once connected it usually takes a day or two for data to populate. In the meantime, here are the channels you do have ROAS for: Meta, Google, Pinterest.
</callout>

<callout emoji="bulb" background-color="light-gray" border-color="gray">
**Type D example** — "What was yesterday's ROAS?" (T+1 lag, currently 9am)
Yesterday's numbers aren't fully ready yet — click and conversion data lands by around 2pm your time on T+1. I can show you the day before (with complete data), or I can schedule this report to run automatically at 3pm daily so you always get a complete picture.
</callout>

**Output rules**:
- **Business language only** — "out-of-scope dataset", "unsupported integration", "T+1 data lag" are jargon; rewrite
- **Always name a specific product / page / person** — "use MBO" beats "use another product"; "Settings → Integrations" beats "the integrations page"
- **Always offer a bridge** — never a flat "no, can't do that"
- **Don't over-apologize** — one acknowledgment is enough; "sorry I'm so limited" is annoying
- **Don't promise capabilities you can't verify** — "MBO can do X" should be true; check via `knowledge-base-ask` if unsure
## 8. Edge cases & routing

<lark-table rows="9" cols="2" column-widths="328,410">

  <lark-tr>
    <lark-td>
      **Edge case**
    </lark-td>
    <lark-td>
      **Handling**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User pushes back: "But MBO is overkill, can't you just guess?"
    </lark-td>
    <lark-td>
      Hold the line. "Forecasts from attribution data alone would be wrong often enough to mislead you. The honest answer is MBO or no forecast." Don't cave to fabricate a number.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User's ask is a mix — "Show me last week's Meta ROAS AND forecast next quarter"
    </lark-td>
    <lark-td>
      Split. Answer the attribution half directly; route the forecast half via this skill. Don't refuse the whole thing.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Tenant has MBO / Lift Test but user doesn't know
    </lark-td>
    <lark-td>
      Surface that — "Good news, MBO is already enabled on your account. Here's how to get to it: [path]."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for a feature that exists but they don't have permission for
    </lark-td>
    <lark-td>
      "That feature requires admin access — your CSM or account admin can enable it for you." Don't expose internal permission models.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User explicitly says "just give me a guess"
    </lark-td>
    <lark-td>
      Decline politely. "I'd rather not — a wrong guess on this kind of question costs more than no answer. MBO is the right tool here." Same as the pushback case.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks a question that *could* fit another attribution skill if reframed
    </lark-td>
    <lark-td>
      Reframe before escalating. "Did you mean [reframed version]?" If yes, route to the right skill. Edge-routing is the last resort, not the first.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Data freshness ambiguous (T+1 most days, T+2 on Mondays due to weekend backfill)
    </lark-td>
    <lark-td>
      State the worst case + the bridge to set up scheduled delivery. Don't promise specific freshness without checking.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks about a competitor / industry benchmarks
    </lark-td>
    <lark-td>
      Type B. WM doesn't have industry benchmark data. Decline + bridge to their own historical performance ("you can compare against your own baseline").
    </lark-td>
  </lark-tr>
</lark-table>

## 9. Failure modes (never do these)
- **Fabricate an answer** — the worst failure. If attribution can't answer, route; never invent a number. "I'd estimate Meta ROAS at 2.3x next quarter" is unacceptable unless backed by MBO.
- **Cold refusal with no bridge** — "Sorry, I can't do that" without a routing path or a substitute question makes the user feel stuck. Always offer the next step.
- **Substitute silently** — if user asks for TikTok and you show Meta because TikTok isn't integrated, that's data fraud. State the missing integration first.
- **Expose internal terminology** — "out-of-scope dataset", "unsupported tool", "T+1 lag with PPS backfill" — rewrite in business language
- **Skip **`**tenant-list**`** verification for Type C** — claiming "TikTok isn't integrated" without checking is a credibility risk
- **Promise other products do things they don't** — "MBO can answer that" must actually be true; verify via `knowledge-base-ask`
- **Over-apologize** — one acknowledgment line is enough; long apologies feel performative
- **Route everything to "contact CSM"** — that's the dead-end fallback; only use when no product / no self-service path exists
- **Treat "I don't know" as edge-routing** — sometimes attribution can answer and the agent just hasn't tried hard enough. Verify the limitation before declaring an edge case.
- **Mix two edge types in one explanation** — if it's Type C (not integrated), explain that; don't muddy the water with Type A (other product) language
- **End with "is that okay?"** — let the user respond if they want the bridge; don't seek validation
- **Refuse a multi-part ask wholesale because one part is edge** — split; answer what you can, route what you can't
## 10. References & related skills
**Related skills**:
- **Last-resort routing target** for all other attribution skills when they detect their own ask is out-of-scope
- **Sibling**: `attribution-intent-clarification` (ambiguous within attribution) — this skill is for unambiguous out-of-scope
- **Anti-pattern**: anything routed here should genuinely be out of scope; if it could be answered by another attribution skill, route there instead
**Other WM products this skill routes to**:

<lark-table rows="6" cols="2" column-widths="307,431">

  <lark-tr>
    <lark-td>
      **Product**
    </lark-td>
    <lark-td>
      **What it does (verify via knowledge-base-ask before claiming)**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **MBO** (Marketing Budget Optimization)
    </lark-td>
    <lark-td>
      Forecasting + budget scenario optimization. Historical attribution → future allocation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Lift Test**
    </lark-td>
    <lark-td>
      Geo / audience holdout experiments to measure true incremental impact. Attribution shows calibrated credit; lift tests measure causality.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Creative Magic**
    </lark-td>
    <lark-td>
      Asset-level analysis by creative attributes (theme, format, hook). Attribution can group by creative ID; Creative Magic infers semantic attributes.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Ads Magic**
    </lark-td>
    <lark-td>
      Automated bid / budget management on platforms. Prescriptive; attribution is descriptive.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Audience Magic**
    </lark-td>
    <lark-td>
      Audience generation / segmentation for activation. Attribution shows performance of existing audiences; Audience Magic creates new ones.
    </lark-td>
  </lark-tr>
</lark-table>

**Non-WM redirects**:
- **SEO / organic data** → Search Console, Ahrefs, Semrush
- **Inventory / finance / support** → tenant's ERP / Zendesk / NetSuite / etc.
- **Industry benchmarks** → no WM source; suggest comparison against own historical baseline
- **Account / billing / permissions** → CSM
**Key principle**: *graceful redirect > cold refusal > fabrication*. Always.
