## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| Tenant has no lift tests (no iDDA available) | Drop iDDA from the default set. Inform user in one sentence: "Your account doesn't have an iDDA model yet — that requires lift tests. Showing dda, last_click, and platform-reported instead." |
| User asks for a model that doesn't exist for this tenant (e.g., "show me MMM attribution") | Tell user what's available. If they're asking about a different product (MMM), route to `attribution-edge-routing`. |
| User wants comparison across > 6 models | Cap at 6 (all models). Don't fan out to per-attribution-window comparisons; that's a different analysis. |
| User says "why did Meta drop?" but actually wants to compare two models on the drop | Comparison + diagnosis hybrid. Run comparison first, then if a clear pattern (e.g., recent lift test) emerges, hand off to `attribution-anomaly-diagnosis`. |
| User asks "which model should I trust for Meta?" | Educational. Pull data first, then give situational guidance: "For budget / incremental impact decisions → iDDA (or dda if no lift tests). For real-time touchpoint-based performance → last_click / first_click. For reconciling against the platform's own dashboard (Meta Ads Manager / Google Ads UI) → platform_reported. For understanding the discovery path → first_click." **Don't push one model as "correct".** |
| Comparison shows all models within \~10% of each other | Still surface this — it's an informative finding ("no significant divergence; this channel's attribution is consistent across models"). Don't pretend there's a story when there isn't. |
| User compares first_click for a single-channel deep dive ("show me Meta's first_click contribution") | This is more about *discovery path* than model comparison. Run as a single-model query (route to `attribution-data-query`) unless they explicitly want vs another model. |
