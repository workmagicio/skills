---
name: attribution-edge-routing
description: Recognize when a user request falls outside attribution's capability boundary and route it gracefully — to another WM product (MBO / Lift Test / Creative Magic / Ads Magic / Audience Magic), to a human (CSM / DS / Eng), or to a clean decline with a bridge to what attribution can answer. Last-resort fallback for all other attribution skills. Read-only.
category: attribution
risk: R0
version: 1.0.0
last-updated: 2026-06-25

references:
- references/boundary-types.md
- references/routing-matrix.md
- references/output-template.md
- references/wm-products.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/routing-response.md

examples:
- examples/example-A-forecast-ask.md
---

## 1. Purpose

Recognize when a user request falls **outside attribution's capability boundary** and route it gracefully — either to another WM product (MBO / Lift Test / Creative Magic / Ads Magic / Audience Magic), to a human (CSM / DS / Eng), or to a clean decline with a bridge to what attribution *can* answer.

Exists to **prevent fabrication** (the worst failure mode in this domain) and to keep boundary cases from feeling like a dead end. **Cold refusals destroy trust; graceful redirects preserve it.**

## 2. When to trigger

Trigger when the user asks for something attribution cannot answer. **Four boundary types**:

| **Type** | **Definition** | **Example** |
|-|-|-|
| **A. Other-product** | Within WM but outside attribution. Needs MBO / Lift Test / Creative Magic / Ads Magic / Audience Magic. | "Forecast my Meta ROAS for next quarter" → MBO |
| **B. Out-of-scope** | Not a WM capability at all. Different tooling / methodology. | "Show me my organic search rankings" |
| **C. Tenant boundary** | WM could answer in principle, but this tenant lacks the data — channel not integrated, data window too short, sales platform not connected. | "Show me TikTok ROAS" when TikTok isn't integrated |
| **D. Data latency** | WM has the capability + integration, but the data isn't ready yet — recent events not yet processed (T+1 / T+2 / PPS backfill). | "What was yesterday's ROAS?" when data lands T+1 and it's morning |

Detailed boundary type definitions + classification examples → `references/boundary-types.md`

**Do NOT trigger**:

- Request is genuinely answerable by another attribution skill — route there directly (this skill isn't a clearing house for ambiguity; that's `attribution-intent-clarification`)
- Request has a documented default the user is just unaware of (e.g., "what's our attribution model?" → answer it, don't escalate)

## 3. Inputs

| **Field** | **Required?** | **Notes** |
|-|-|-|
| `boundary_type` | Required (detected) | A / B / C / D. Misclassifying leads to wrong routing — be careful. |
| `user_intent_summary` | Required | One-sentence restatement of what user is trying to accomplish (not just the literal words). Used to find the closest alternative. |
| `nearest_supported_question` | Required | The closest thing attribution **can** answer that gets the user partway there. Offered as a bridge, not a substitute. |
| `routing_target` | Required | Where to send: another WM product (with link / activation path), CSM, DS, Eng, or clean decline. |
| `tenant_status` | Conditional (Type C) | Which integration is missing, what data range is available, which sales platforms are connected. Pull via `tenant-list` and `knowledge-base-ask`. |

## 4. SOP

**Step 1: Classify the boundary type** — run this decision sequence:

1. **Prediction / forecast / scenario?** → Type A → MBO
2. **Incrementality / lift / causal impact?** → Type A → Lift Test
3. **Creative content / asset attributes (color, format, theme)?** → Type A → Creative Magic
4. **Non-marketing data domain** (organic SEO, support volume, inventory, finance)? → Type B
5. **Channel / sales platform not integrated?** → Type C
6. **Time range outside tenant's data window?** → Type C
7. **Very recent data (today, yesterday) before lag covers it?** → Type D
8. **None of the above** → re-check; this might not be an edge case

**Step 2: Verify with `tenant-list` + `knowledge-base-ask`** (mandatory for Type C, recommended for D)

- Type C: `tenant-list` shows what integrations / sales platforms exist + what data window is available
- Type D: `knowledge-base-ask` the data-freshness conventions (T+1 for clicks, T+2 for PPS, etc.)
- **Don't guess.** If you'd guess wrong half the time, ask the tools.

**Step 3: Compose the routing response (4 parts)**

<callout emoji="🛑">
**HARD RULE — copy the response template**
Use `templates/routing-response.md`. The 4-part structure is non-negotiable:
1. **Acknowledge** the user's actual goal in their language
2. **State the boundary** in business language — no jargon
3. **Give the specific routing path** — name the product / page / person
4. **Offer a bridge** — closest attribution can answer right now
Type-specific variants (Type A / B / C / D have different intros and routing language) are in the template.
</callout>

**Step 4: Don't pad, don't apologize excessively**

- One acknowledgment line is enough — don't write a paragraph of "I'm sorry"
- End the turn. **Don't ask "is that okay?"** — let the user respond if they want the bridge

<callout emoji="💡">
**Don't take the bait — never fabricate when user pushes back**
If user says *"just give me a guess"* or *"but MBO is overkill, can't you just estimate?"*, **hold the line**. A wrong guess on a forecast question costs the user more than no answer. Reply: *"I'd rather not — a wrong guess on this kind of question costs more than no answer. MBO is the right tool here."* Then re-offer the bridge.
Same applies to "approximate", "ballpark", "best guess" — the request **is** the trap; fabricating is the worst failure mode this skill exists to prevent.
</callout>

<callout emoji="💡">
**Don't take the bait — never silently substitute**
If user asks for TikTok and you show Meta because TikTok isn't integrated, that's **data fraud**. Always state the missing integration FIRST, then offer connected channels as a bridge with explicit framing: *"TikTok isn't connected; here's what you do have"* — never just hand over Meta numbers without the disclosure.
</callout>

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | Required | Confirm what other WM products do + their activation paths; check data-freshness conventions for Type D |
| `tenant-list` | Required for Type C | Verify which integrations / sales platforms are connected, what data window exists. Don't claim "TikTok isn't integrated" without checking. |
| `lift-test-list` | Conditional | For incrementality asks routed to Lift Test — show what tests already exist or how to start one |
| `budget-optimizer-list` / `budget-optimizer-reference-data` | Conditional | For forecasting asks routed to MBO — check whether tenant is provisioned |

This skill is **read-only** — never creates anything itself, only redirects. All R0.

## 6. Output format

One message, 4 parts, in this order. Total length: \~3-5 sentences.

1. **Acknowledge** the user's actual goal (in their language)
2. **State the boundary** in business language — what attribution does vs. doesn't do
3. **Routing path** — named product / person + how to access
4. **Bridge** — closest attribution can answer right now

Type-specific callout examples (A / B / C / D) + full output rules → `references/output-template.md`

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Never fabricate an answer** — if attribution can't answer, route. "I'd estimate Meta ROAS at 2.3x next quarter" is unacceptable unless backed by MBO.
2. **Never silently substitute** — if user asks for TikTok and TikTok isn't integrated, state the missing integration FIRST; never hand over Meta numbers without disclosure
3. **Never cold refuse** — "Sorry, I can't do that" without a routing path or bridge question makes the user feel stuck
4. **Always copy `templates/routing-response.md`** — the 4-part structure (Acknowledge / Boundary / Routing / Bridge) is non-negotiable
5. **Never skip `tenant-list` verification for Type C** — claiming "TikTok isn't integrated" without checking is a credibility risk
6. **Never promise other products do things they don't** — verify via `knowledge-base-ask` before claiming "MBO can answer that"
7. **Never expose internal terminology** — "out-of-scope dataset", "T+1 lag with PPS backfill" — rewrite in business language
8. **Never refuse a multi-part ask wholesale because one part is edge** — split; answer what you can, route what you can't

## 8. Edge cases

Full edge case & pushback handling catalog → `references/edge-cases.md`

## 9. Related skills + WM product reference

- **Last-resort routing target** for all other attribution skills when they detect their own ask is out-of-scope
- **Sibling**: `attribution-intent-clarification` (ambiguous within attribution) — this skill is for *unambiguous* out-of-scope
- **Anti-pattern**: anything routed here should genuinely be out of scope; if it could be answered by another attribution skill, route there instead

Other WM products + non-WM redirects → `references/wm-products.md`

**Key principle**: *graceful redirect > cold refusal > fabrication*. Always.
