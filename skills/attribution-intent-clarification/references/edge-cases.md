## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| User input is ambiguous but on a field with a documented default (time window, attribution model) | **Don't clarify.** Apply the default and inform the user in one sentence. Route to `attribution-data-query`. |
| User input is "why" / "diagnosis" style ("why did X drop?") | Route to `attribution-anomaly-diagnosis`. Don't clarify here. |
| User says "just pick one" / "you decide" / "doesn't matter" | Use the default immediately. Don't re-ask. Tell the user which you chose. |
| User answers with a new ambiguous interpretation ("show me the best one" after "compare campaigns") | One more round is OK. After 2 rounds of clarification, pick the default and run — don't loop. |
| User input mixes 2 distinct asks ("show me Meta ROAS and also create a weekly report") | Don't clarify — split. Acknowledge both, run #1, then ask about #2. |
| The ambiguous field is a metric alias ("POAS", "return on ad spend") | Resolve via `dashboard-metrics-list` first. If 1 match — use it, no question. If 0 matches — ask once. |
| User asks for a metric that varies by sales platform (ROAS, `attr_orders`, CAC, NC_ROAS) without specifying sales platform | If the tenant has 1 sales platform connected → use it as default, mention it in the answer. If 2+ → ask which one(s); offer "all (broken out)" as an option when comparing makes sense. |
| User specifies an invalid ads × sales platform combo (e.g., Amazon Ads with Shopify in scope) | Don't clarify — route to `attribution-edge-routing` or surface the product-design constraint directly. (Amazon Ads only attributes to Amazon Store.) |
