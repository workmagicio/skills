## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| User says "why?" but the metric is on an unsupported channel | Route to `attribution-edge-routing` |
| User wants to compare two models on purpose ("does last_click see Meta the same way iDDA does?") | Route to `attribution-model-comparison` |
| Spend dropped proportionally with attribution | Stop after Step 3a. Explain to client; don't run the full tree. |
| Amazon Ads → Shopify combo, attribution = 0 | Stop after Step 3b with the product-design snippet. |
| Retroactive change but no recent lift test | Check PPS first (Step B2-3 / C2); if clean, escalate to DS. |
| Lift test result looks abnormal (test ran during holiday / promo) | Surface in Internal section and recommend a lift-test refresh; do not silently dismiss the model output. |
