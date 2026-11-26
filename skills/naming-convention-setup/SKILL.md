---
name: naming-convention-setup
description: Set up, review, change or delete a tenant's Naming Convention (NC) rules — the rules that turn campaign / ad set / ad names into reporting properties such as product, audience, funnel stage or creative angle. Use when the user asks to build or create a naming convention, parse their ad names, add / fix / rename / remove an NC property, or asks why an NC property is empty. When the user asked for data "by <label>" that isn't a property yet, use attribution-custom-dimension instead.
category: attribution
requires: wm-naming-convention-list, wm-naming-convention-create
risk: R1
version: 1.0.0
last-updated: 2026-11-25

references:
- references/platform-quirks.md

templates:
- templates/coverage-check.sql
- templates/proposal-message.md
---

## 1. Purpose

A Naming Convention (NC) rule reads one name field (campaign, ad set or ad) on one ad platform and
extracts a **property** — e.g. `Product` from `MMDuo_UGC_0412_Meta`. Once a rule exists the property
becomes a dimension the tenant can slice attribution data, dashboards and custom metrics by.

This skill takes the user from "set up a naming convention for us" (or "fix / change / remove this
rule") to live rules, built from the tenant's **real** names, confirmed by the user before every
write, and checked afterwards. The user should never have to leave the chat to do it in the web UI.

Tool names below are the WorkMagic MCP names. Some clients show them with a source prefix — in
Justin, `naming-convention-list` is `wm-naming-convention-list`. Same tool.

## 2. When to trigger — and when not

**Trigger**: building a naming convention from scratch; adding a property; reviewing what rules
exist; changing a rule's separator / position / regex / segments / property name; deleting a rule;
"why is `<property>` empty / only partly filled"; adding a custom separator.

**Do NOT trigger — route out**:

| Request | Go to |
|-|-|
| Data "by <label>" where the label isn't a property yet ("ROAS by audience") | `attribution-custom-dimension` — it sets up the one rule it needs, then answers the query |
| Data by a property that already exists | `attribution-data-query` |
| "What is a naming convention / how does it work" with no setup intent | answer briefly; `product-article-search` for the help-center article |
| Tactics, custom metrics, dashboards that *use* NC properties | their own tools / skills — this skill only owns the NC rules |
| Dimension that isn't in any name (SKU from the catalog, customer demographics) | say NC can't produce it; `attribution-edge-routing` |

## 3. Constraints the tools enforce (check before proposing, not after the error)

| Constraint | Detail |
|-|-|
| Levels | `campaign`, `adset`, `ad`, or `all`. **`all` only works with method `segment`.** |
| Methods | `position` (split by separator, take Nth, 1-based) · `kv` (`key=value` pairs; separator + identifier) · `regex` (one capture group, ≤500 chars) · `segment` (named buckets with `contains` / `not_contains` / `is` / `is_not` rules; first match wins; case-sensitive) |
| Property name unique per platform | Across **all levels** of the same ad platform. You can't have `Product` at ad level *and* at ad-set level on Meta — pick one level per platform. The same name on different platforms is fine and rolls up into one dimension. |
| Separators | Built-in `-` `_` `\|` `>` and space are always available. Anything else must first be in the tenant's custom list (`naming-convention-separators-set`), symbols only. |
| Platforms | Only the tenant's integrated platforms that carry names. Values are exact strings (e.g. `Meta`); a wrong value makes `naming-convention-create` return the valid list. |
| Not changeable by update | `adPlatform`, `level`, `method`. To change those: create the new rule, then delete the old one (two writes, both confirmed). |
| Limit | 100 rules per platform + level. |

## 4. SOP

**Step 1 — Read the current state (parallel, read-only, no confirmation needed)**

- `naming-convention-list` (`size: 1000`) → every existing rule: id, platform, level, propertyName,
  methodName, matchingStatus, sample `propertyValues`.
- `naming-convention-separators-get` → the tenant's custom separators.

If the tool says several tenants are available, ask which one (show the names it listed) and pass
`tenantId` on every later call. Summarize what exists in 2–4 lines (properties by platform/level)
before going further — the user often doesn't know what's already there, and a duplicate property
name is the most common create failure.

**Step 2 — Pin the goal (one question at most)**

What do they want to slice by? If the request already says ("split Meta ads by product and
format"), don't ask. Otherwise ask one question with concrete options drawn from common cuts
(product, creative angle / format, funnel stage, audience, geo, offer). Flag immediately any
dimension names can't carry (SKU from the product catalog, customer attributes) instead of
promising it.

**Step 3 — Read real names before proposing anything**

<callout emoji="🛑">
**HARD RULE — never propose a rule from imagined names.** Call `naming-convention-examples-list`
for the platform(s) with `level: "all"` (top-spend active names for campaign, ad set and ad). Build
the rule from what is actually there. A rule built on invented examples will look right in chat and
match nothing in the data.
</callout>

- Check **all three levels** per platform before concluding a platform has no signal: many platforms
  leave ad or ad-set names empty or auto-generated (Google Shopping/Search, TikTok GMV Max, Amazon,
  Pinterest ad sets). Per-platform map → `references/platform-quirks.md`.
- Pick the **one level per platform** where the signal covers the most spend (property names are
  unique per platform, §3).
- If the user has a written spec, still compare it to the real names; report divergences as
  findings, don't silently follow the spec.

**Step 4 — Choose the method per property**

| What the names look like | Method |
|-|-|
| Fixed slot before any free text, same separator throughout (`PROD_FORMAT_DATE`) | `position` |
| Tagged pairs (`geo=US_aud=LAL`) | `kv` |
| Value anchored by a fixed marker, slot position varies (`... - TOF - ...`, `[US] ...`) | `regex` with one capture group |
| Controlled vocabulary, no stable slot, or several spellings mapping to one label | `segment` — most specific bucket first (first match wins); list each spelling actually seen (matching is case-sensitive) |
| Free text with no anchor | don't extract; say so |

Prefer one `segment` property with N buckets over N separate properties — buckets are mutually
exclusive, separate properties double-count names that contain two tokens.

**Step 5 — Propose and confirm (one message, one question)**

Copy `templates/proposal-message.md`. For each rule show: platform, level, property name, method in
plain words, and **3–5 real names from Step 3 with the value each one yields** — including at least
one name the rule leaves empty, if any, so the user sees the coverage honestly. Then ask one yes/no.
Never fire a write before an explicit yes. A new confirmation is needed whenever the plan changes.

**Step 6 — Apply**

Order: separators (only if a new one is needed) → creates → updates / deletes.

- **New separator**: `naming-convention-separators-set` **replaces the whole list** — send the
  current list from Step 1 plus the new one, never just the new one.
- **Create**: `naming-convention-create`; several platforms with the same rule go in one call
  (one rule per platform is created). Record the returned ids.
- **Update**: `naming-convention-update-or-delete` with `action: "update"`. For `segment` rules,
  `segments` **replaces the whole list** — first read the current buckets with
  `naming-convention-list` + `includeValueConditions: true` (filter by `adPlatform` + `level`), then
  send the full edited list.
- **Delete**: `action: "delete"` is permanent. Before confirming, say what depends on the property
  (saved views, dashboards, custom metrics, tactics slicing by it lose that dimension).

If a tool returns an error, show the reason in plain words and fix the proposal; don't retry the
same call unchanged.

**Step 7 — Check the result**

- `naming-convention-list` again: the new rule is there, with its id. `propertyValues` lists
  extracted values once matching has run; `matchingStatus` 0 → 1 when it has.
- The property can take **several hours** to appear as a queryable dimension. Tell the user that
  rather than reporting "it's broken". Once it's there, `templates/coverage-check.sql` (after
  `database-query-ask`, via `database-query-run`) shows the share of spend that got a value.
- Coverage well below what Step 5 showed → say which names were missed and offer one adjustment.
  Low coverage on a property the user said is optional is expected — say so.

End with a short recap: rules created / changed / deleted (platform · level · property · id),
anything left out and why, and when the property will be usable.

## 5. Tools used

| Tool | Required? | Purpose |
|-|-|-|
| `naming-convention-list` | Required | Existing rules (Step 1), full segment rules before an update (`includeValueConditions`), post-write check |
| `naming-convention-separators-get` | Required | Custom separators before any position / kv proposal |
| `naming-convention-examples-list` | Required | Real top-spend names per platform and level — the basis of every proposal |
| `naming-convention-create` | Write | Create rules after confirmation |
| `naming-convention-update-or-delete` | Write | Change or delete rules after confirmation |
| `naming-convention-separators-set` | Write, conditional | Add a custom separator (full-list replace) |
| `database-query-ask` → `database-query-run` | Optional | Coverage check once the property is queryable |

`naming-convention-separators` (no suffix) is deprecated — always use the `-get` / `-set` pair.

## 6. CRITICAL rules

1. **Read before proposing**: existing rules + separators + real names (Steps 1 and 3), every time.
2. **Never invent example names or extracted values** — every example shown comes from
   `naming-convention-examples-list`.
3. **No write without an explicit yes** to a proposal that names platform, level, property, method
   and shows real examples. Separators-set, create, update and delete are all writes.
4. **One property name per platform** — check existing rules first; never plan the same property at
   two levels of one platform.
5. **Full-list replace**: separators-set and segment updates overwrite the whole list; always send
   current + changes.
6. **Don't ask the user technical questions** (separator? position? regex?) — read the names, propose,
   and ask one confirmation question.
7. **Never send the user to the web UI** to do what these tools can do.
8. **Don't call a fresh rule broken** because the property isn't queryable yet; it can take hours.

## 7. Related skills

- `attribution-custom-dimension` — query-driven path: user wants data by a label that needs one rule
- `attribution-data-query` — querying by an NC property once it exists
- `attribution-edge-routing` — dimensions names can't carry
