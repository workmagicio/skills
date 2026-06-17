---
name: attribution-intent-clarification
description: Resolve genuinely ambiguous attribution queries by asking one focused clarifying question, then handing the resolved query to attribution-data-query. Use when the user's request has two or more plausible interpretations that materially change the answer (e.g. "Show me my numbers", "How is Meta doing?"). Never use for already-clear requests.
---

# attribution-intent-clarification

## 1. Purpose
Resolve **genuinely ambiguous** attribution queries by asking **one focused clarifying question**, then handing the resolved query off to `attribution-data-query` (or another skill). This skill exists so we don't silently guess on multi-meaning inputs — but it must **never become a wall of questions**.
## 2. When to trigger
Trigger this skill when the user's request has **≥ 2 plausible interpretations** on a dimension that materially changes the answer. Common ambiguity types:
- **Granularity ambiguity** — "Where should I cut spend?" (channel? campaign? creative?)
- **Metric ambiguity** — "Show me top performers" (by ROAS? spend? orders? new customers?)
- **Sales-platform ambiguity** — "Show me Meta ROAS" (against which sales platform? Amazon Store / Shopify / TikTok Shop). Attribution in WM is computed **per sales platform**, so the same ads_platform × metric can have very different values depending on which sales platform is in scope. Common with ROAS, `attr_orders`, `attr_new_customer_orders`, CAC.
- **Scope ambiguity** — "How are my ads doing?" (which channels? which time window? compared to what?)
- **Comparison ambiguity** — "Compare last month to this month" (which metric? which dimension?)
- **Subject ambiguity** — "Look at my best campaign" (best by what? in what window?)
**Do NOT trigger this skill** when:
- The request is clear enough that a sensible default exists (just use the default + tell the user)
- The ambiguity is on a field that has a documented default (e.g., time window → 7 days, attribution model → idda/dda)
- The tenant has only **one** sales platform connected — use it as the default sales platform, no question needed. Only clarify when 2+ sales platforms are connected.
- <text bgcolor="light-yellow">The request belongs to another skill (route, don't clarify)</text>
## 3. Inputs
**Fields to detect from the raw user input**:

<lark-table rows="5" cols="3" column-widths="250,244,244">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Description**
    </lark-td>
    <lark-td>
      **Example**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `ambiguity_type`
    </lark-td>
    <lark-td>
      Granularity / Metric / Scope / Comparison / Subject (one of the 5 above). If none apply — exit this skill.
    </lark-td>
    <lark-td>
      Granularity
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `candidate_interpretations`
    </lark-td>
    <lark-td>
      2–4 plausible readings of the user's request. **Must be concrete and mutually exclusive.**
    </lark-td>
    <lark-td>
      ["by channel", "by campaign", "by creative"]
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `known_anchors`
    </lark-td>
    <lark-td>
      Anything in the input that is **not** ambiguous — keep these fixed so the clarifying question doesn't re-ask them.
    </lark-td>
    <lark-td>
      "Meta", "last 30 days"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `default_if_user_skips`
    </lark-td>
    <lark-td>
      The interpretation you'll fall back to if the user doesn't answer in this turn. Stated to the user in the same message.
    </lark-td>
    <lark-td>
      "by campaign"
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Detect ambiguity type**
Scan the request against the 5 ambiguity types above. If no ambiguity type fits (or only a defaulted field is unclear) → **exit this skill** and route to `attribution-data-query` with the default.
**Step 2: Build 2–4 candidate interpretations**
- Each candidate must be a **complete, executable query** in business language — not a half-question
- Candidates must be **mutually exclusive** — if user picks one, the other answers a different question
- Cap at 4 options — more than 4 means the input is too vague and you should go down a level (ask the most pivotal axis first)
**Step 3: Anchor what's known**
List back the parts you already understood ("Meta · last 30 days") so the clarifying question doesn't repeat them. This is a trust signal — the user sees you parsed most of the input.
**Step 4: Pick a sensible default**
Choose the most likely interpretation as fallback. State it in the same message: "If you don't tell me, I'll go with X."
**Step 5: Ask ONE question**
- Format: anchor + question + 2–4 numbered options + default note
- Use **business language**, not field names ("by campaign", not "by `campaign_name`")
- **Never stack multiple questions** ("which metric? which dimension? which window?") — pick the most pivotal axis only
- If the user explicitly waves you off ("just pick one", "you decide") → use the default immediately and run the query
**Step 6: Route resolved query**
Once the user picks (or accepts the default), hand off to `attribution-data-query` with the resolved interpretation. Do **not** re-clarify inside the next skill.
## 5. Tools used

<lark-table rows="2" cols="3" column-widths="306,104,317">

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
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Only if you need to check whether a user-supplied alias maps to a real field before showing it as an option. Most of the time you don't need this.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
One message, three parts, in this order:
1. **Anchor**: a single line restating the known parts ("Got it — Meta, last 30 days.")
1. **Question + options**: one sentence + a numbered list of 2–4 concrete interpretations
1. **Default + escape hatch**: "If you don't say, I'll go with [default]." or "Tell me '1', '2', '3' or 'just pick'."
**Example output**:
<callout emoji="speech_balloon" background-color="light-gray" border-color="gray">
Got it — you want to know where to cut spend. To answer that, I need to know the granularity:
1. By **channel** (which platform to pull back from)
1. By **campaign** (which specific campaigns are underperforming)
1. By **creative** (which ad creatives are dragging ROAS down)
If you don't say, I'll go with **by campaign** — that's usually the most actionable level.
</callout>

## 7. Edge cases & routing

<lark-table rows="7" cols="2" column-widths="443,328">

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
      User input is ambiguous but on a field with a documented default (time window, attribution model)
    </lark-td>
    <lark-td>
      **Don't clarify.** Apply the default and inform the user in one sentence. Route to `attribution-data-query`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User input is "why" / "diagnosis" style ("why did X drop?")
    </lark-td>
    <lark-td>
      Route to `attribution-anomaly-diagnosis`. Don't clarify here.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "just pick one" / "you decide" / "doesn't matter"
    </lark-td>
    <lark-td>
      Use the default immediately. Don't re-ask. Tell the user which you chose.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User answers with a new ambiguous interpretation ("show me the best one" after "compare campaigns")
    </lark-td>
    <lark-td>
      One more round is OK. After 2 rounds of clarification, pick the default and run — don't loop.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User input mixes 2 distinct asks ("show me Meta ROAS and also create a weekly report")
    </lark-td>
    <lark-td>
      Don't clarify — split. Acknowledge both, run #1, then ask about #2.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      The ambiguous field is a metric alias ("POAS", "return on ad spend")
    </lark-td>
    <lark-td>
      Resolve via `dashboard-metrics-list` first. If 1 match — use it, no question. If 0 matches — ask once.
    </lark-td>
  </lark-tr>
</lark-table>


<lark-table rows="3" cols="2" column-widths="328,328">

  <lark-tr>
    <lark-td>
      **Sales-platform handling (continued)**
    </lark-td>
    <lark-td>
      **What to do**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks for a metric that varies by sales platform (ROAS, `attr_orders`, CAC, NC_ROAS) without specifying sales platform
    </lark-td>
    <lark-td>
      If the tenant has 1 sales platform connected → use it as default, mention it in the answer. If 2+ → ask which one(s); offer "all (broken out)" as an option when comparing makes sense.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User specifies an invalid ads × sales platform combo (e.g., Amazon Ads with Shopify in scope)
    </lark-td>
    <lark-td>
      Don't clarify — route to `attribution-edge-routing` or surface the product-design constraint directly. (Amazon Ads only attributes to Amazon Store.)
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Ask multiple questions in one turn** — "which channel? which metric? which window?" overwhelms; pick the most pivotal axis only
- **Use field names in options** — show "by campaign" not "`by campaign_name`"
- **Offer too many options** — > 4 means the input is too vague; go up a level and ask the pivotal axis
- **Ask without anchoring known parts** — user repeats themselves and loses trust
- **Loop forever** — after 2 rounds of clarification, pick the default and run the query
- **Clarify and then forget** — once user resolves, hand off to `attribution-data-query` with the full resolved query, don't lose anchors
- **Clarify what should be routed** — "why did X drop?" is not ambiguous, it's a diagnosis request; route to `attribution-anomaly-diagnosis`
- **Silently default without telling the user** — always state the default in the same message as the question
## 9. References & related skills
- **Downstream**: `attribution-data-query` (after resolution, most common)
- **Route to instead**: `attribution-anomaly-diagnosis` (for "why" questions), `attribution-model-comparison` (for "X vs Y model" questions), `attribution-edge-routing` (for out-of-scope)
- **Sibling**: `attribution-custom-dimension` (when ambiguity is "by <business term>" that needs NC config)
