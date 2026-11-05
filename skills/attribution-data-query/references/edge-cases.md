# Edge cases & routing

| Edge case | How to handle |
|---|---|
| User's metric isn't an exact match in metrics-list | Find the closest field ("blended ROAS" → blended_roas) and confirm in one sentence. If no reasonable match, ask once. |
| User specifies idda but tenant hasn't run lift tests | Do not run idda. Say: "This tenant hasn't run lift tests yet; running with DDA instead — OK?" Proceed with DDA after confirmation. |
| Vague time words ("recently", "lately") | Use default (past 7 days) and announce it transparently. Do not ask for an exact date. |
| "This month" / "this quarter" mid-period | Current window = month-to-date. Comparison window = same-length prior period (not full month). Tell the user the comparison is apples-to-apples. |
| "Yesterday" but data ingestion has 6–24h delay | If results return 0 or unusually low, proactively say: "Yesterday's data has a 6–24h ingestion delay — want to look at the day before?" Offer the most recent fully-loaded window. |
| User says "today" | Same-day data is typically still aggregating. Flag this and offer yesterday/last 7 days as alternatives. |
| Future date ("next week", "January 2027") | Tell the user that period has no data yet; offer the closest past window. |
| Conflicting fields ("by channel but show me individual campaigns") | Ask one clarifying question: "Channel-level totals or campaign-level breakdown?" Don't decide for the user. |
| Conflicting filters ("only Meta and only Google") | Ask one short clarifying question. Don't guess. |
| Self-contradictory model ("last touch using DDA") | Ask which one. Don't pick. |
| User adds a follow-up filter ("also where spend > 500") | Preserve all previous filters and append the new one. Don't restart from scratch. |
| Filter too strict, 0 rows returned | Say "No matches under this filter — want to relax it?" Never let the user think it's a product bug. |
| Time range falls outside available data (e.g., 2 years requested but tenant only has 6 months) | Tell user the data boundary and offer an alternative window. Route to attribution-edge-routing for outright unsupported cases. |
| Channel not integrated for this tenant (e.g., "Show me TikTok ROAS" but TikTok isn't connected) | Tell the user in business language ("TikTok isn't connected to this account yet") and list connected channels. Don't fabricate. Route to attribution-edge-routing. |
| Amazon / TikTok Shop sales but the marketplace isn't connected | Same as above — name the specific limit, offer the path. |
| Ratio metric returns inf or extreme value | Re-check NULLIF guard on denominator; never surface inf / 999999 / null to the user. |
| User repeats the same out-of-bound request after being told once | Acknowledge briefly and offer the next step (e.g. "Integrations" entry) without re-explaining. |
