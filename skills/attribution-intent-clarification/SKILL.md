---
name: attribution-intent-clarification
description: Resolve genuinely ambiguous attribution queries by asking ONE focused clarifying question, then hand off to attribution-data-query (or another skill). Never become a wall of questions.
category: attribution
risk: R0
version: 1.0.0
last-updated: 2026-06-17

references:
- references/ambiguity-types.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md
---

## 1. Purpose

Resolve **genuinely ambiguous** attribution queries by asking **one focused clarifying question**, then hand the resolved query off to `attribution-data-query` (or another skill). Exists so we don't silently guess on multi-meaning inputs — but it must **never become a wall of questions**.

## 2. When to trigger

**Trigger** when the user's request has **≥ 2 plausible interpretations** on a dimension that materially changes the answer.

**5 ambiguity types** (detailed examples → `references/ambiguity-types.md`):

- **Granularity** — channel / campaign / creative?
- **Metric** — by ROAS / spend / orders / new customers?
- **Sales-platform** — Amazon Store / Shopify / TikTok Shop? (attribution computed per sales platform)
- **Scope** — which channels / window / vs what?
- **Comparison / Subject** — best by what / which window?

**Do NOT trigger** when:

- The request is clear enough that a sensible default exists (use the default + tell the user)
- The ambiguity is on a field with a documented default (time window → 7 days; attribution model → idda/dda)
- Tenant has only **one** sales platform connected — use it as default, no question. Only clarify when 2+ connected.
- The request belongs to another skill (route, don't clarify)

## 3. Inputs

| **Field** | **Description** | **Example** |
|-|-|-|
| `ambiguity_type` | One of the 5 types. If none — exit this skill. | Granularity |
| `candidate_interpretations` | 2–4 plausible readings. **Concrete + mutually exclusive.** | ["by channel", "by campaign", "by creative"] |
| `known_anchors` | Non-ambiguous parts of input — keep these fixed | "Meta", "last 30 days" |
| `default_if_user_skips` | Fallback interpretation. State it in the same message. | "by campaign" |

## 4. SOP

**Step 1: Detect ambiguity type** — scan against the 5 types. None apply (or only a defaulted field is unclear) → **exit** and route to `attribution-data-query` with the default.

**Step 2: Build 2–4 candidate interpretations**

- Each is a **complete executable query** in business language, not a half-question
- **Mutually exclusive** — picking one excludes the others
- Cap at 4 — > 4 means input is too vague; go up a level and ask the most pivotal axis first

**Step 3: Anchor what's known** — restate parsed parts ("Meta · last 30 days") so the question doesn't re-ask them. Trust signal.

**Step 4: Pick a sensible default** — choose the most likely interpretation as fallback. State it in the same message.

**Step 5: Ask ONE question**

- Format: anchor + question + 2–4 numbered options + default note
- **Business language**, not field names ("by campaign", not `campaign_name`)
- **Never stack multiple questions** — pick the most pivotal axis only
- User waves off ("just pick one", "you decide") → use the default immediately and run
- Output template → `references/output-template.md`

**Step 6: Route resolved query** — once user picks (or accepts default), hand off to `attribution-data-query` with the resolved interpretation. **Don't re-clarify inside the next skill.**

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `dashboard-metrics-list` | Optional | Only if you need to check whether a user-supplied alias maps to a real field before showing it as an option. Most of the time you don't need this. |

## 6. Output format

One message, three parts, in this order:

1. **Anchor**: single line restating the known parts ("Got it — Meta, last 30 days.")
2. **Question + options**: one sentence + numbered list of 2–4 concrete interpretations
3. **Default + escape hatch**: "If you don't say, I'll go with [default]." or "Tell me '1', '2', '3' or 'just pick'."

Full example → `references/output-template.md`

## 7. CRITICAL rules (top 5 — full list in references/failure-modes.md)

1. **Never stack multiple questions in one turn** — pick the most pivotal axis only
2. **Never use field names** in options — "by campaign", not `campaign_name`
3. **Never offer > 4 options** — input is too vague, go up a level
4. **Never loop forever** — after 2 rounds of clarification, pick the default and run
5. **Never silently default** — always state the chosen default in the same message as the question

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Downstream**: `attribution-data-query` (after resolution, most common)
- **Route to instead**: `attribution-anomaly-diagnosis` (for "why" questions), `attribution-model-comparison` (for "X vs Y model" questions), `attribution-edge-routing` (for out-of-scope)
- **Sibling**: `attribution-custom-dimension` (when ambiguity is "by <business term>" that needs NC config)
