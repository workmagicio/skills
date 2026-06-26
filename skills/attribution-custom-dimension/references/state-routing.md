## NC state routing (detailed)

The three states the tenant can be in, and how each branch should run.

### State A — Configured + property exists (silent path)

This is the happy path. The tenant has already configured an NC rule, and the propertyName the user asked for (or a fuzzy match) is in `dashboard-metrics-list` response.

- Use the propertyName **exactly as returned (case-sensitive)**
- Hand off directly to `attribution-data-query`
- **No NC interaction visible to user** — they just see the data answer to their original ask
- If the user's term doesn't exactly match (e.g., user says "Region", tenant has "region") — use the tenant's exact spelling, no message needed

### State B — Configured + property missing (add one rule)

Tenant has existing NC rules but not for the term the user just asked about. They've been through this process before — keep the explanation short.

- Skip the "what's NC?" preamble (they know)
- Inherit existing separators / position conventions where possible — match the style of their existing rules
- Use `naming-convention-update-or-delete` if the new property fits into an existing ruleset; otherwise `naming-convention-create`
- One confirmation, then apply, then continue the original query

### State C — Not configured at all (set up from scratch)

Tenant has never set up NC. First-time experience — explain the concept briefly.

- Lead with 2-sentence explanation in business language: "Your campaign names contain a lot of information but WorkMagic doesn't know how to read them yet. I'll set up a one-time rule so you can slice data by [user's term]."
- Detect separators with `naming-convention-separators`
- Propose the **first property only** — don't try to set up Region + Audience + Brand all at once. Note: "Other properties can be added later when you ask for them."
- One confirmation, then apply, then continue the original query
