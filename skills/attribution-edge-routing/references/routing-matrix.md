## Routing matrix (15 common cases)

| **User ask** | **Type** | **Routing** |
|-|-|-|
| "Forecast next quarter's ROAS" | A | MBO. If not provisioned → CSM activation path. |
| "What's the real incremental impact of Meta?" | A | Lift Test. iDDA shows calibrated attribution; full incrementality measurement = Lift Test. |
| "Which creative theme drives the most ROAS?" | A | Creative Magic (asset-level attributes). Attribution's `creative_attribution` can break down by creative ID but not by inferred theme. |
| "Should I bid higher on Meta tomorrow?" | A | Ads Magic / MBO. Attribution is historical, not prescriptive. |
| "Build me an audience to target next week" | A | Audience Magic. |
| "Show me organic search rankings" | B | Not a WM product. Decline + bridge to paid-search attribution if relevant. |
| "How's my customer support volume trending?" | B | Not WM. Decline. |
| "What's my inventory turnover?" | B | Not WM. Decline. |
| "Show me TikTok ROAS" — TikTok not integrated | C | Tell user TikTok isn't connected; route to **Integrations** page; offer to show connected channels meanwhile. |
| "Show me 2 years of data" — tenant only has 6 months | C | Tell user the available window; offer that range as the alternative. Don't return partial data without explanation. |
| "Show me Shopify orders" — only Amazon Store integrated | C | Tell user only Amazon is connected; route to **Integrations**. |
| "What was yesterday's ROAS?" at 9am on T+1 lag data | D | Tell user yesterday's data lands by [time]; offer to run for the day before yesterday, or to set up a scheduled report that fires after data is ready. |
| "Why does my last week's data keep changing?" — PPS backfill | D | Not actually edge-routing — route to `attribution-anomaly-diagnosis` (retroactive change explanation). Caught here only if misclassified. |
| "How do I set up my account?" / "How do I add a user?" | B (or product-onboarding) | Route to CSM or product docs; not attribution. |
| "My iDDA numbers seem wrong — can you check?" | Not edge-routing | Route to `attribution-anomaly-diagnosis` — it's the right tool, not an edge case. |
