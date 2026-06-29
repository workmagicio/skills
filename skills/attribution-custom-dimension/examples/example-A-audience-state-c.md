## Example A — "ROAS by audience" (State C, NC from scratch)

The first-time experience: a tenant that's never set up NC asks for a query that needs an NC property.

### User input

*"Show me ROAS by audience for Meta, last 30 days."*

### Step-by-step

#### Step 1 — Detect NC state

- Call `dashboard-metrics-list` with tenantId. Result: built-in propertyNames only — no "Audience", no "audience", no fuzzy match.
- Call `naming-convention-list` with tenantId. Result: **empty** — no existing NC rules.
- → **State C**: not configured at all.

#### Step 2 — Knowledge base + sample campaign names

Ask `knowledge-base-ask` for NC schema. Get `ctx`.

Copy `templates/01-sample-campaign-names.sql`, filter to Meta. Returns:

| campaign_name | spend_last_30d |
|-|-|
| `Meta_Prospecting_VIP_Holiday2025` | \$48,210 |
| `Meta_Retargeting_Lookalike1_Evergreen` | \$32,440 |
| `Meta_Brand_NewCustomer_Q4` | \$28,150 |
| `Meta_Conversion_VIP_BlackFriday` | \$22,000 |
| `Meta_Prospecting_Lookalike2_LandingPage` | \$18,900 |

Pattern observed: underscore-separated. Audience appears to be the **third token** (VIP / Lookalike1 / NewCustomer / VIP / Lookalike2).

#### Step 3 — Detect separators

Call `naming-convention-separators`. Returns: `_` as the dominant separator across the tenant's campaigns.

#### Step 4 — Propose (one confirmation question)

Copy `templates/proposal-message.md`, fill with the 3 highest-spend samples:

<callout emoji="💡">
Your campaign names contain a lot of information — region, audience, product — but WorkMagic doesn't know how to read them yet. I'll set up a one-time rule so you can slice data by any of those tags. Here's what I see:
</callout>

| Campaign name | Proposed "Audience" value |
|-|-|
| `Meta_Prospecting_VIP_Holiday2025` | VIP |
| `Meta_Retargeting_Lookalike1_Evergreen` | Lookalike1 |
| `Meta_Brand_NewCustomer_Q4` | NewCustomer |

The pattern: **the third segment between underscores**.

Add this as an "Audience" property?

*(After confirmation, I'll pull the audience-level ROAS you asked for — no need to repeat the question.)*

User: *"yes"*.

#### Step 5 — Apply NC rule

Call `naming-convention-create` with: propertyName="Audience", method=position, separator="\_", index=2 (zero-indexed third segment).

#### Step 6 — Sanity check

Copy `templates/02-nc-sanity-check.sql`, fill `{new_property_name}=Audience`. Result: 14 distinct non-NULL audiences (VIP / Lookalike1 / Lookalike2 / NewCustomer / etc.), NULL row share = 4%. ✓ Hand off.

#### Step 7 — Continue original query

Hand off to `attribution-data-query` with: metric=ROAS, dimension=Audience, ads_platform=Meta, time_range=last 30 days.

<callout emoji="📊">
**Meta ROAS by audience — last 30 days (iDDA)**
</callout>

| Audience | Spend | Revenue | ROAS |
|-|-|-|-|
| VIP | \$72K | \$310K | 4.31 |
| Lookalike1 | \$48K | \$155K | 3.23 |
| NewCustomer | \$45K | \$132K | 2.93 |
| Lookalike2 | \$26K | \$58K | 2.23 |

**Reading**: *VIP audiences are returning 4.3x — strongest segment. Lookalike2 is the laggard at 2.2x.*

### What this example illustrates

- **Real campaign names** from `templates/01-sample-campaign-names.sql` — agent did not invent `Meta_Prospecting_VIP_Holiday2025`
- **Business-language pattern description** ("the third segment between underscores") — not "position 2 of split('\_')"
- **One confirmation question** only — no multi-question form about separator, position, name, case-sensitivity
- **Follow-through promise** ("I'll pull the audience-level ROAS you asked for") — agent did not require user to restate
- **Sanity check before handoff** — 4% NULL is well under the 30% threshold; safe to proceed. If it had been 50%, the agent would surface the failure instead.
- **Single property only** — agent did NOT propose Region + Audience + Brand all at once on State C; just the term the user asked about
