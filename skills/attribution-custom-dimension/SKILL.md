---
name: attribution-custom-dimension
description: Handle queries that slice attribution data by a business label ("by audience" / "by region" / "by brand") where the label isn't a native field — it lives in campaign names and only becomes a queryable dimension after a Naming Convention (NC) rule is configured. Detects NC state, guides config in business language, then continues the original query without the user having to leave chat.
category: attribution
risk: R1
version: 1.0.0
last-updated: 2026-06-25

references:
- references/state-routing.md
- references/output-template.md
- references/edge-cases.md
- references/failure-modes.md

templates:
- templates/01-sample-campaign-names.sql
- templates/02-nc-sanity-check.sql
- templates/proposal-message.md

examples:
- examples/example-A-audience-state-c.md
---

## 1. Purpose

Handle queries that slice attribution data by a **business label** (e.g., "by region", "by audience", "by brand", "by product line") where the label isn't a native field — it lives inside campaign names and only becomes a real dimension once a **Naming Convention (NC)** rule is configured for the tenant.

This skill detects NC state, guides configuration when needed in business language, and continues the original query after configuration. **The user should rarely (ideally never) have to leave the chat to set up NC themselves.**

## 2. When to trigger

Trigger when the user asks for data **"by <business term>"** where the term isn't a built-in WM dimension:

- "Show me spend by audience"
- "ROAS by product line"
- "How are my brand campaigns doing?"
- "Compare paid social by region"
- "Break down Meta by creator"

**Detection rule**: after `dashboard-metrics-list` with the tenant's `tenantId`, if the requested dimension term isn't in the returned property list (built-in or NC-derived), this skill takes over.

**Do NOT trigger**:

- Dimension is already a built-in field (`ads_platform`, `campaign_name`, `tactic_name`, etc.) → `attribution-data-query`
- Dimension is already an NC-derived property the tenant has configured → `attribution-data-query` (just use the propertyName as returned)
- User is asking about NC configuration in general ("how does NC work?") → answer from `knowledge-base-ask` without entering this skill

## 3. Inputs

| **Field** | **Required?** | **Notes** |
|-|-|-|
| `business_term` | Required | User's natural-language label (e.g., "audience", "region", "brand"). Preserve as candidate propertyName — rephrase later if the tenant already has a slightly different name. |
| `nc_state` | Detected, not asked | One of: **A) configured + property exists**, **B) configured + property missing**, **C) not configured at all**. Determined by `naming-convention-list` + `dashboard-metrics-list`. |
| `tenantId` | Required for tool calls | Pass to `dashboard-metrics-list` for tenant-specific NC propertyNames. Pass to `naming-convention-list` to read existing rules. |
| `original_query` | Required | The full attribution-data-query intent the user came in with (metric, time range, filters). Preserve so we can pick it up after NC config completes. |

## 4. SOP

**Step 1: Detect NC state** — two parallel calls:

1. `dashboard-metrics-list` with `tenantId` → list of available propertyNames (built-in + NC-derived)
2. `naming-convention-list` with `tenantId` → existing NC rules (separators, position, property mappings)

Combine both to classify the tenant state:

| **State** | **How to detect** | **Next step** |
|-|-|-|
| **A. Configured + property exists** | Requested term (fuzzy match, case-insensitive) appears in `dashboard-metrics-list` propertyNames | Use the propertyName **exactly as returned (case-sensitive)** and route to `attribution-data-query`. **Stop here** — no NC interaction visible to user. |
| **B. Configured + property missing** | `naming-convention-list` has existing rules, but the requested term doesn't appear in the propertyName set | Step 2 — add one rule to the existing NC |
| **C. Not configured at all** | `naming-convention-list` returns empty | Step 3 — set up NC from scratch |

Detailed branch handling → `references/state-routing.md`

**Step 2 [State B]: Add one rule to existing NC**

<callout emoji="🛑">
**HARD RULE — read real campaign names first; never fabricate examples**
Before proposing any extraction rule, copy `templates/01-sample-campaign-names.sql` to pull 5–10 real `campaign_name` / `ad_name` values from `database-query-sql`. Then propose a rule that matches the observed pattern. **Fabricated examples destroy user trust the moment they don't match the user's actual campaigns.**
</callout>

1. **Look at real ad names** via `templates/01-sample-campaign-names.sql`
2. **Identify the candidate location**: separator-delimited tokens (`BRAND_REGION_AUDIENCE_DATE`), prefix tags (`[US] Meta Prospecting`), suffix tags (`... | audience: VIP`)
3. **Recommend method in business language**: copy `templates/proposal-message.md`. Show 2-3 example campaigns mapped to the proposed value. **One confirmation question max** — never ask "what separator?" + "what position?" + "case-sensitive?" in the same message.
4. **Apply via `naming-convention-create`** after explicit user confirmation (R1 write at system level + audit log)
5. **Continue the original query** — hand off to `attribution-data-query` with the new propertyName, without asking the user to repeat their original ask

**Step 3 [State C]: Set up NC from scratch**

1. **Explain in business language** (max 2 sentences): "Your campaign names contain a lot of information — region, audience, product — but WorkMagic doesn't know how to read them yet. I'll set up a one-time rule so you can slice data by any of those tags."
2. **Look at real ad names** (same as Step 2)
3. **Detect separators** via `naming-convention-separators` (often `_`, `|`, `-`). Surface this in the confirmation.
4. **Propose the first property ONLY** — don't try to set up all properties at once; focus on the term the user just asked about. "Other properties can be added later when you ask for them."
5. **One confirmation question**
6. **Apply via `naming-convention-create`**
7. **Continue the original query**

**Step 4: Sanity-check after applying**

<callout emoji="💡">
**Don't take the bait — never hand off without sanity-checking the new property**
If most rows resolve to NULL, the rule is wrong and the user will get an empty dashboard. Copy `templates/02-nc-sanity-check.sql` and confirm the new propertyName resolves to non-empty values for > 70% of rows. If lower, surface the failure: *"The rule I tried only caught X% of your campaigns. Here are the ones it missed — want me to adjust?"* Offer 1-2 alternative interpretations; do NOT silently hand off bad data.
</callout>

## 5. Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| `knowledge-base-ask` | Required (first) | NC schema patterns + Cube.dev syntax + `ctx` timestamp for any SQL (sample pull + sanity check) |
| `dashboard-metrics-list` | Required | List propertyNames for this tenant (built-in + NC). **Always pass `tenantId`** — NC properties are tenant-scoped. |
| `naming-convention-list` | Required | Read existing NC rules to determine State A / B / C |
| `naming-convention-separators` | Conditional (State C) | Detect what separators the tenant's campaign names use, before proposing a rule |
| `naming-convention-create` | Conditional (B + C) | Create NC rule after user confirmation. **R1 write (system direct-execute + audit log)**; skill-level requires one explicit confirm before firing. |
| `naming-convention-update-or-delete` | Conditional (State B) | Update existing NC ruleset to add the new property |
| `database-query-sql` | Required | (a) Pull sample real campaign names; (b) sanity-check the new propertyName resolves; (c) execute the original query at the end via `attribution-data-query` |

## 6. Output format

1-2 conversational turns + a final data answer.

- **State A (silent path)**: no NC interaction visible to user — just answer the original query
- **State B / C (configuration path)**: one structured proposal message → user confirms → data answer

Proposal message template (copy this) → `templates/proposal-message.md`

### Output rules

- **Show real campaign names**, not invented examples — user must trust the rule applies to their data
- **Show the proposed value** for each example, not just the position rule
- **One confirmation question max**; never ask multi-question forms
- **Promise the follow-through** ("I'll pull the audience-level ROAS you asked for") so user doesn't worry about losing context
- **Use the user's term** as the property name unless their NC already has a different name for it

## 7. CRITICAL rules (top 8 — full list in references/failure-modes.md)

1. **Always pull real campaign names** via `templates/01-sample-campaign-names.sql` before proposing a rule — fabricated examples destroy trust
2. **Always sanity-check after applying** — if most rows are NULL, surface and adjust; never silently hand off bad data
3. **Never silently substitute a nearby property** — if user asked for "audience" and tenant only has "segment", don't query "segment" without telling them
4. **Never send user to UI to configure NC themselves** — the skill exists precisely so they don't have to
5. **Never ask 3+ technical questions at once** ("what separator? what position? what name?") — lead with one proposal, one confirmation
6. **Never hard-code propertyNames** — tenant-specific + case-sensitive; always pass `tenantId` to `dashboard-metrics-list` and use returned string verbatim
7. **Never apply `naming-convention-create` without explicit confirmation** — R1 system-level write; skill-level requires one explicit confirm
8. **Never lose the original query during configuration** — user wanted ROAS by audience; after config they should get ROAS by audience without restating

## 8. Edge cases

Full edge case & routing catalog → `references/edge-cases.md`

## 9. Related skills

- **Downstream (always)**: `attribution-data-query` — handoff after configuration completes, or directly when State A
- **Upstream**: `attribution-intent-clarification` (when the business term itself is ambiguous, e.g., "by region" could mean campaign tag vs sales region)
- **Sibling**: `attribution-anomaly-diagnosis` (after slicing by NC property, user may ask "why is this segment down?")
- **Out of scope**: `attribution-edge-routing` — if the term genuinely can't be derived from campaign names (e.g., needs CRM enrichment, customer demographics)
