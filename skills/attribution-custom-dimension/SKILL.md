---
name: attribution-custom-dimension
description: Handle attribution queries that slice by a business label (region, audience, brand, product line) that isn't a native field and requires a Naming Convention (NC) rule. Detects NC state, guides configuration in business language, then continues the original query. Use when the user asks for data "by <business term>" that isn't a built-in WorkMagic dimension.
---

# attribution-custom-dimension

## 1. Purpose
Handle queries that slice attribution data by a **business label** (e.g., "by region", "by audience", "by brand", "by product line") where the label isn't a native field — it lives inside campaign names and only becomes a real dimension once a **Naming Convention (NC)** rule is configured for the tenant. This skill detects NC state, guides configuration when needed in business language, and continues the original query after configuration. The user should rarely (ideally never) have to leave the chat to set up NC themselves.
## 2. When to trigger
Trigger when the user asks for data **"by <business term>"** where the term isn't a built-in WM dimension. Common phrasings:
- "Show me spend by audience"
- "ROAS by product line"
- "How are my brand campaigns doing?"
- "Compare paid social by region"
- "Break down Meta by creator"
**Detection rule**: after `dashboard-metrics-list` with the tenant's `tenantId`, if the requested dimension term isn't in the returned property list (built-in or NC-derived), this skill takes over.
**Do NOT trigger** when:
- The dimension is already a built-in field (`ads_platform`, `campaign_name`, `tactic_name`, etc.) → `attribution-data-query`
- The dimension is already an NC-derived property the tenant has configured → `attribution-data-query` (just use the propertyName as returned)
- The user is asking about NC configuration in general ("how does NC work?") → answer from `knowledge-base-ask` without entering this skill
## 3. Inputs

<lark-table rows="5" cols="3" column-widths="160,234,328">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description / default**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `business_term`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The user's natural-language label (e.g., "audience", "region", "brand", "product line"). Preserve it as a candidate **propertyName** — but rephrase later if the tenant already has a slightly different name for it.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `nc_state`
    </lark-td>
    <lark-td>
      Detected, not asked
    </lark-td>
    <lark-td>
      One of: **A) configured + property exists**, **B) configured + property missing**, **C) not configured at all**. Determined by `naming-convention-list` + `dashboard-metrics-list`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenantId`
    </lark-td>
    <lark-td>
      Required for tool calls
    </lark-td>
    <lark-td>
      Pass to `dashboard-metrics-list` to fan out tenant-specific NC propertyNames. Pass to `naming-convention-list` to read existing rules.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `original_query`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The full attribution-data-query intent the user came in with (metric, time range, filters). Preserve so we can pick it up after NC config completes.
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Detect NC state**
Two parallel calls (no need to be sequential):
1. `dashboard-metrics-list` with `tenantId` → list of available propertyNames (built-in + NC-derived)
1. `naming-convention-list` with `tenantId` → existing NC rules (separators, position, property mappings)
Combine both to classify the tenant state:

<lark-table rows="4" cols="3" column-widths="228,255,255">

  <lark-tr>
    <lark-td>
      **State**
    </lark-td>
    <lark-td>
      **How to detect**
    </lark-td>
    <lark-td>
      **Next step**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **A. Configured + property exists**
    </lark-td>
    <lark-td>
      Requested term (fuzzy match, case-insensitive) appears in `dashboard-metrics-list` propertyNames
    </lark-td>
    <lark-td>
      Use the propertyName **exactly as returned (case-sensitive)** and route to `attribution-data-query`. **Stop here.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **B. Configured + property missing**
    </lark-td>
    <lark-td>
      `naming-convention-list` has existing rules, but the requested term doesn't appear in the propertyName set
    </lark-td>
    <lark-td>
      Go to Step 2 — add one rule to the existing NC
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **C. Not configured at all**
    </lark-td>
    <lark-td>
      `naming-convention-list` returns empty
    </lark-td>
    <lark-td>
      Go to Step 3 — set up NC from scratch
    </lark-td>
  </lark-tr>
</lark-table>

**Step 2: [State B] Add one rule to existing NC**
1. **Look at real ad names first.** Pull a sample of 5–10 actual `campaign_name` (or `ad_name`) values for this tenant via `database-query-sql`. Don't guess naming patterns — read them.
1. **Identify the candidate location.** Where in the name does the business term appear? Common patterns: separator-delimited tokens (`BRAND_REGION_AUDIENCE_DATE`), prefix tags (`[US] Meta Prospecting`), suffix tags (`... | audience: VIP`).
1. **Recommend a method in business language.** Don't dump position indices and regex on the user. Say: "Looking at your campaign names, the audience tag is usually the third segment between underscores (like `Meta_Prospecting_VIP_Holiday2025` → `VIP`). Should I add that as an 'Audience' property?" Show 2–3 example campaigns mapped to the proposed value.
1. **One confirmation question.** Cap at one round; multi-question forms break the conversational flow.
1. **Apply via **`**naming-convention-create**`** (or **`**naming-convention-update-or-delete**`**).** Use the propertyName the user agreed to (case-sensitive).
1. **Continue the original query.** Hand off to `attribution-data-query` with the new propertyName, without asking the user to repeat their original ask.
**Step 3: [State C] Set up NC from scratch**
1. **Explain in business language what's about to happen.** Two sentences max: "Your campaign names contain a lot of information — region, audience, product — but WorkMagic doesn't know how to read them yet. I'll set up a one-time rule so you can slice data by any of those tags."
1. **Look at real ad names.** Same sample-and-read step as State B.
1. **Detect separators.** Call `naming-convention-separators` to see what separators the tenant uses (often `_`, `|`, `-`). Surface this in the confirmation.
1. **Propose the first property only.** Don't try to set up all properties at once. Focus on the term the user just asked about. "I'll add 'Audience' as the third segment between underscores — example: `Meta_Prospecting_VIP_Holiday2025` → VIP." Note: other properties can be added later when the user asks for them.
1. **One confirmation question.** Same constraint as State B.
1. **Apply via **`**naming-convention-create**`**.**
1. **Continue the original query.** Same as State B.
**Step 4: Sanity-check after applying**
Before handing off, run a small `database-query-sql` sanity check (e.g., `SELECT <new_propertyName>, COUNT(*) FROM ads_attribution GROUP BY 1 LIMIT 10`) and confirm the propertyName resolves to non-empty values. If most rows map to `NULL`, the rule is wrong — surface this to the user and offer to revise, don't silently hand off bad data.
## 5. Tools used

<lark-table rows="8" cols="3" column-widths="322,189,227">

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
      Required (first)
    </lark-td>
    <lark-td>
      Get NC schema patterns + Cube.dev syntax + `ctx` timestamp for any SQL execution in this skill (the sample-name pull and the sanity check)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      List available propertyNames for this tenant (built-in + NC). **Always pass **`**tenantId**` — NC properties are tenant-scoped.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `naming-convention-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Read existing NC rules to determine State A / B / C
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `naming-convention-separators`
    </lark-td>
    <lark-td>
      Conditional (State C)
    </lark-td>
    <lark-td>
      Detect what separators the tenant's campaign names use, before proposing a rule
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `naming-convention-create`
    </lark-td>
    <lark-td>
      Conditional (B + C)
    </lark-td>
    <lark-td>
      Create the NC rule after user confirmation. **This is an R1 write (system direct-execute + audit log); skill-level convention is to surface a confirm before firing** — only fires after explicit confirmation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `naming-convention-update-or-delete`
    </lark-td>
    <lark-td>
      Conditional (State B)
    </lark-td>
    <lark-td>
      Update existing NC ruleset to add the new property
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      (a) Pull sample of real campaign names; (b) sanity-check the new propertyName resolves; (c) execute the original query at the end via `attribution-data-query`.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
This skill produces 1–2 conversational turns + a final data answer.
**State A (silent path)**: no NC interaction visible to the user — just answer the original query.
**State B / C (configuration path)**: one structured proposal message, then (after user confirmation) the data answer.
<callout emoji="bulb" background-color="light-gray" border-color="gray">
Your campaign names contain audience info, but WorkMagic doesn't have a rule to read it out yet. I can add one for you — quick look at your data:
</callout>


<lark-table rows="4" cols="2" column-widths="328,262">

  <lark-tr>
    <lark-td>
      **Campaign name**
    </lark-td>
    <lark-td>
      **Proposed "Audience" value**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Meta_Prospecting_VIP_Holiday2025`
    </lark-td>
    <lark-td>
      VIP
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Meta_Retargeting_Lookalike1_Evergreen`
    </lark-td>
    <lark-td>
      Lookalike1
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `Google_Brand_NewCustomer_Q4`
    </lark-td>
    <lark-td>
      NewCustomer
    </lark-td>
  </lark-tr>
</lark-table>

The pattern: **third segment between underscores**. Add this as an "Audience" property?
(After confirmation, I'll pull the audience-level ROAS you asked for — no need to repeat the question.)
**Output rules**:
- **Show real campaign names**, not invented examples — the user must trust the rule applies to their data
- **Show the proposed value** for each example, not just the position rule
- **One confirmation question** max; never ask "what should we call it?" + "what separator?" + "what position?" in the same message
- **Promise the follow-through** ("I'll pull the audience-level ROAS you asked for") so the user doesn't worry about losing context
- **Use the user's term** as the property name unless their NC already has a different name for it
## 7. Edge cases & routing

<lark-table rows="8" cols="2" column-widths="328,410">

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
      The user's term is similar to an existing propertyName (e.g., user says "region", tenant has "Region" already)
    </lark-td>
    <lark-td>
      Use the existing one. Don't create a duplicate. Mention case-sensitivity match in the answer: "Using your existing 'Region' property."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      The user's term partially matches (e.g., user says "audience type", tenant has "Audience")
    </lark-td>
    <lark-td>
      Surface this once: "You have an 'Audience' property — is that what you mean, or a separate 'Audience Type'?" One question, not multi-round.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Campaign names look inconsistent — no clear pattern
    </lark-td>
    <lark-td>
      Tell the user honestly: "Your campaign names don't follow a consistent pattern, so I can't extract this reliably. Best path: standardize the naming going forward, and we can revisit then." Don't fabricate a rule that won't apply to most data.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Most rows resolve to NULL after applying the rule (sanity check fails)
    </lark-td>
    <lark-td>
      Don't hand off. Surface the failure: "The rule I tried only caught X% of your campaigns. Here are the ones it missed — want me to adjust?" Offer 1–2 alternative interpretations.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks to set up NC without an underlying data question
    </lark-td>
    <lark-td>
      Route to a general NC setup flow (could be a separate skill or product onboarding); this skill is data-query-driven. Don't run setup steps without a pending query to answer afterward.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      The business term applies to a different DataSet than ads_attribution / creative_attribution (e.g., user asks "by region" but means by sales platform region)
    </lark-td>
    <lark-td>
      Disambiguate once: "By campaign region tag, or by sales platform region (where the order shipped)?" The second is a different data source entirely.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants to remove or rename an existing NC property
    </lark-td>
    <lark-td>
      This is admin-level. Confirm explicitly with extra UX confirmation ("This will affect all dashboards using this property"), then use `naming-convention-update-or-delete`.
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Silently substitute a nearby property** — if user asked for "audience" and tenant only has "segment", don't just query "segment" without telling them
- **Send the user to the UI to configure NC themselves** — the skill exists precisely so they don't have to. Only escalate to UI if config is genuinely impossible from chat (e.g., needs admin permissions the agent doesn't have).
- **Ask 3+ technical questions at once** — "what separator? what position? what property name? case-sensitive?" overwhelms; lead with one proposal and one confirmation
- **Hard-code propertyNames** — they're tenant-specific and case-sensitive; always pass `tenantId` to `dashboard-metrics-list` first and use the returned string verbatim
- **Use **`**naming_convention.X**`** as a SQL field prefix** — the propertyName is used directly as a dimension; no namespace prefix
- **Skip the sample-name lookup** — guessing patterns from the user's verbal description without reading actual campaign names leads to rules that match 30% of data
- **Skip the post-config sanity check** — high-NULL ratios are a silent failure; surface them before handing off
- **Fabricate campaign-name examples** — always pull real ones from `database-query-sql`. Invented examples destroy user trust.
- **Apply **`**naming-convention-create**`** without explicit confirmation** — naming-convention writes are R1 at the system level, but the skill-level convention requires one explicit confirmation step before firing
- **Lose the original query during configuration** — the user wanted ROAS by audience; after config they should get ROAS by audience without restating
- **Skip **`**knowledge-base-ask**`** before SQL** — required for `ctx` timestamp on both the sample pull and the sanity check
- **Treat State A as needing configuration** — if the propertyName already exists, just use it; don't show the user a configuration message
## 9. References & related skills
**Related skills**:
- **Downstream (always)**: `attribution-data-query` — handoff after configuration completes, or directly when State A
- **Upstream**: `attribution-intent-clarification` (when the business term itself is ambiguous, e.g., "by region" could mean campaign tag vs sales region)
- **Sibling**: `attribution-anomaly-diagnosis` (after slicing by NC property, user may ask "why is this segment down?")
- **Out of scope**: `attribution-edge-routing` — if the term genuinely can't be derived from campaign names (e.g., needs CRM enrichment, customer demographics)
**Key concepts**:
- **Naming Convention (NC)**: a tenant-scoped ruleset that parses structured info out of campaign / ad names into queryable properties. Properties become real dimensions in `ads_attribution` / `creative_attribution`.
- **propertyName**: the user-facing dimension name (e.g., "Audience", "Product Group", "Creator name"). **Case-sensitive**; pass through verbatim from `dashboard-metrics-list`.
- **State A / B / C**: the three tenant configurations this skill must distinguish. Determined by `naming-convention-list` + `dashboard-metrics-list`, not by guessing.
