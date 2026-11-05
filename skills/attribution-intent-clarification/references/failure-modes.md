## Failure modes (never do these)

- **Ask multiple questions in one turn** — "which channel? which metric? which window?" overwhelms; pick the most pivotal axis only
- **Use field names in options** — show "by campaign" not `by campaign_name`
- **Offer too many options** — > 4 means the input is too vague; go up a level and ask the pivotal axis
- **Ask without anchoring known parts** — user repeats themselves and loses trust
- **Loop forever** — after 2 rounds of clarification, pick the default and run the query
- **Clarify and then forget** — once user resolves, hand off to `attribution-data-query` with the full resolved query, don't lose anchors
- **Clarify what should be routed** — "why did X drop?" is not ambiguous, it's a diagnosis request; route to `attribution-anomaly-diagnosis`
- **Silently default without telling the user** — always state the default in the same message as the question
