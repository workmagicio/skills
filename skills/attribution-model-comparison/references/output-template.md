## Output — a live Comparison artifact

A multi-model comparison is a report-shaped, screenshot-and-share result → build it as
a **live-data artifact** (the `dashboard` skill, **Comparison** archetype), not a wall
of table in chat. (A quick 1-channel, single-metric check may stay a chat table — the
simple-pull path in `attribution-data-query`.)

### Artifact layout

- **Header = measurement identity:** `<sales platform> · <models compared> · <time
  range>` — e.g. *"Shopify · Platform-reported vs Last Click vs DDA vs iDDA · past 30
  days"*. **One sales platform per artifact** — never mix platforms in one comparison
  (model validity differs by platform; non-DTC platforms have no click-based models).
- **Hero = grouped bars, per channel × model.** Each channel is a group; one bar per
  model in a **fixed categorical slot order** (platform-reported → last_click → dda →
  idda), never cycled (`artifacts` chart method — categorical hues in fixed order).
  Sort channels by absolute `iDDA − Last Click` delta descending; visually flag the
  largest gap.
- **"Why they differ" readout.** For each channel (or the top 2–3 by gap), the cause
  from `references/diff-patterns.md`, in business language. **Name the cause; on an
  unrecognized shape say so — never invent** (a plausible-but-wrong model story is
  worse than "this isn't a typical pattern").
- **Table view underneath (accessibility).** The same numbers as the side-by-side
  table below the chart — so a screen reader / CSV export still works.
- **Keep the platform-reported bar/column** unless the user explicitly excluded it —
  it anchors the user's expectation ("but Meta says 5x") and explains the most common
  confusion.

### Example content (what the artifact renders)

Header: **Shopify · Platform-reported vs Last Click vs DDA vs iDDA · past 30 days**

Table view (also the source for the grouped bars):

| **Channel** | **Platform-reported ROAS** | **Last Click** | **DDA** | **iDDA** | **Δ (iDDA − Last Click)** |
|-|-|-|-|-|-|
| Meta | 5.2x | 4.8x | 3.1x | 2.3x | −52% |

"Why they differ" (Meta): Meta looks strong in last_click (4.8x) but iDDA drops it to
2.3x — a 52% gap. Two causes: (1) platform-reported (5.2x) is higher still because Meta
and other channels each claim the same conversions without de-dup; (2) the latest Meta
lift test concluded with limited incremental impact, so iDDA's calibration further
discounts Meta. **iDDA is the closer estimate of Meta's real business impact** — but we
present, we don't declare a "right" model (see SKILL §6).

### Rules

- **One sales platform per artifact** — run separately per platform.
- Grouped bars: **one fixed slot per model, categorical colour, never cycled**; a model
  keeps its colour across channels.
- Sort channels by absolute delta; flag the largest gap so the user doesn't scan.
- **Never push one model as "correct"** — situational guidance only if asked (SKILL §6).
- Link to `attribution-anomaly-diagnosis` for a single-model drill-down.
- Shared conventions (model aliases, sales-platform scope, measurement identity) are
  canonical in `attribution-data-query` — don't re-derive here.
