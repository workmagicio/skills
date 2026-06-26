## Example A — "Compare Meta across 4 models" (channel-level, past 30 days)

End-to-end walkthrough of the canonical case: user wants to see why WorkMagic dashboard shows different Meta ROAS than Meta Ads Manager.

### User input

*"Compare Meta ROAS across last_click, DDA, and iDDA — past 30 days. Why is Meta Ads Manager showing 5x but WorkMagic shows 2.3x?"*

### Step-by-step

#### Step 1 — Parse

- Models: user named 3 (last_click, dda, idda). Add `platform_reported` automatically because the user's question references Meta Ads Manager — that's what platform_reported represents.
- `ads_platform=Meta`, `sales_platform=Shopify` (tenant default), `time_range`=past 30 days
- Tenant has lift tests → iDDA available ✓

#### Step 2 — knowledge-base-ask

Ask: *"How to query multiple attribution models in one SQL on channel_attribution?"* + *"Mechanism diff between platform_reported / last_click / dda / idda for Meta"*. Returns `ctx` timestamp + mechanism notes.

#### Step 3 — dashboard-metrics-list

Confirm: `attr_orders`, `attr_sales`, `ad_spend`, `attr_model_name`, `ads_platform`, `event_date` ✓

#### Step 4 — Copy template SQL

Copy `templates/01-multi-model-comparison.sql`, fill `{ads_platform}=Meta`, `{sales_platform}=Shopify`, `{start_date}=2026-05-26`, `{end_date}=2026-06-25`.

#### Step 5 — Compute deltas

Result:

| Channel | Platform-reported | Last Click | DDA | iDDA |
|-|-|-|-|-|
| Meta | 5.2x | 4.8x | 3.1x | 2.3x |

Δ(iDDA − Last Click) = −52%. Δ(platform_reported − iDDA) = −56%.

#### Step 6 — Interpret (diff patterns)

Match against `references/diff-patterns.md`:

- `platform_reported >> last_click` (5.2 → 4.8) → cross-channel de-dup pattern
- `last_click > idda` (4.8 → 2.3) → incrementality discount pattern (the common one)
- Combined: `platform_reported >> idda (extreme)` — the "stacked" pattern

### Output (customer-facing)

<callout emoji="📊">
**Meta attribution across 4 models — past 30 days, Shopify**
</callout>

| Channel | Platform-reported ROAS | Last Click | DDA | iDDA | Δ (iDDA − Last Click) |
|-|-|-|-|-|-|
| Meta | 5.2x | 4.8x | 3.1x | 2.3x | −52% |

**What this shows**: Meta Ads Manager shows 5.2x because the platform claims every conversion it touched, with no de-dup against Google / TikTok / etc. Last Click in WorkMagic deduplicates to 4.8x. The bigger drop to iDDA (2.3x) is the lift-test calibration discounting conversions that would have happened anyway — your latest Meta lift test concluded with limited incremental impact. **For budget decisions, the iDDA number is the closer estimate of Meta's real business impact.**

### What this example illustrates

- **Always include platform_reported** when the user references Meta Ads Manager / Google Ads — it anchors their expectation
- **One CASE WHEN query** guarantees same dedup / filter / window across all model branches
- **Two patterns stacked** (platform vs last_click AND last_click vs idda) — name both, but lead with the bigger gap (iDDA vs last_click) since that's the customer's real concern
- **Lead conclusion with "for budget decisions"**, not "iDDA is correct" — situational guidance, not a verdict
- **No follow-up question** — UI exposes drill-down
