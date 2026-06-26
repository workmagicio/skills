## Output template

One message, two parts: **side-by-side table → 1-3 sentence interpretation**. No question at the end.

### Example output

<callout emoji="📊">
**Meta attribution across 4 models — past 30 days, Shopify**
</callout>

| **Channel** | **Platform-reported ROAS** | **Last Click** | **DDA** | **iDDA** | **Δ (iDDA − Last Click)** |
|-|-|-|-|-|-|
| Meta | 5.2x | 4.8x | 3.1x | 2.3x | −52% |

**What this shows**: Meta looks strong in last_click (4.8x) but iDDA drops it to 2.3x — that's a 52% gap. The reason is two-fold: (1) platform-reported (5.2x) is even higher because Meta and other channels each claim the same conversions without de-dup, and (2) the latest Meta lift test concluded with limited incremental impact, so iDDA's calibration further discounts Meta's contribution. **The iDDA number is the closer estimate of Meta's real business impact.**

### Output rules

- Table first, interpretation second (never the other way)
- Always show **which sales platform** and **time range** were used (one line above the table)
- Sort by absolute delta descending if comparing multiple channels
- Highlight the largest gap explicitly — don't make the user scan
- One paragraph of interpretation max (\~3 sentences); link to `attribution-anomaly-diagnosis` if user wants to drill deeper
- Hide the platform-reported column only if the user explicitly excluded it — it anchors the user's expectation ("but Meta says 5x") and explains the most common confusion
