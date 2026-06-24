# Time range resolution rules

**Always re-fetch today's date** before resolving any relative phrasing. Do not assume today's date from training data or earlier in the conversation.

Resolve silently, then state the window in **business language (not ISO dates)** in the response:

| User says | Resolve as |
|---|---|
| "today" | today (note: same-day data is usually incomplete — see §8 Data ingestion lag) |
| "yesterday" | yesterday (may still be ingesting — see §8) |
| "this week" | Monday of current week through today |
| "last week" | previous 7 days ending yesterday |
| "this month" / "MTD" | 1st of current month through today |
| "last month" | full previous calendar month |
| "this quarter" | start of current quarter through today |
| "last quarter" | full previous quarter |
| "Q1 2026", "April 2026" | exact calendar bounds |
| "YTD" | Jan 1 of current year through today |
| "last 30 days" / "last N days" | past N days ending yesterday (or today if data is fully loaded) |
| "recently", "lately", "these days" | past 7 days (do not ask back — default + tell) |
| Future date ("next week", "next month") | Tell the user that period has no data yet |
| Invalid date ("May 32") | Ask once to clarify |

## Comparison windows must be length-aligned

The pitfall: today is the 15th, user asks "this month vs last month." Comparing *all of May* (half-empty) against *all of April* (full) makes May look like a ~50% drop that isn't real.

**Fix**: when the current window is partial, clip the comparison window to the same number of elapsed days (MTD vs. same-day-last-month MTD). State this in one line: "Comparing May 1–15 vs. April 1–15 since May isn't over yet."
