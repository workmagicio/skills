## Step 5: Model-specific diagnostic branches

### Branch A — Rule-based models (Last Click / First Click / Any Click)

**Core mechanism**: pure **click-based**, independent of lift tests. Only two failure modes:

- **Click signal lost** — UTM tracking broken, clicks can't be matched to campaigns
- **Click distribution shift** — new campaign brings a flood of clicks that dilute / steal share from the old tactic

#### A1 — UTM / tracking health

Template → `templates/04-utm-health.sql`

| **unmatch_orders_ratio** | **Meaning** |
|-|-|
| < 20% | ✅ Healthy |
| 20% – 40% | ⚠️ Elevated — some clicks aren't attributable |
| > 40% | 🔴 Severe — attribution heavily distorted |

Per-ad UTM signals:

- `has_set_properly = 'N'`: UTM misconfigured, click signal can be lost → root cause
- `has_set_properly = 'NO_DOMAIN'`: TOF/Reach/VideoViews campaigns have no CTA URL — **expected**, not a bug
- If a campaign with `has_set_properly = 'N'` only appeared during the anomaly window, that's a direct root cause

#### A2 — Click distribution shift

Template → `templates/05-click-distribution.sql`

| **Signal** | **Meaning** |
|-|-|
| `first_seen_date >= anomaly_start` | New campaign that only appeared in the anomaly window |
| Clicks ↑↑ but `ac_orders` ≈ 0 | Lots of clicks, no conversions → dilutes Any Click share |
| `spend_baseline > 0` AND `spend_anomaly ≈ 0` | Old campaign paused → attribution source disappeared |

### Branch B — DDA

**Core mechanism**: DDA = Any Click (Linear All) **plus** handling for three things Any Click can't:

1. **Unmatched** — UTM missing; DDA redistributes those orders across campaigns by model weight; Any Click can't
2. **VTA (View-Through Attribution)** — platform-reported VTA from Meta / TikTok / Pinterest / Snap
3. **PPS (Post-Purchase Survey)** — user fills survey on T, system processes on T+2, then backfills to T (T+2 delay)

**B1 — Compare DDA vs Any Click first.** If trends are identical, the issue is on click/touchpoint side → go back to Branch A. Template → `templates/06-dda-vs-anyclick.sql`

**B2-1 — VTA change.** Only Meta / TikTok / Pinterest / Snap support VTA. If platform-reported VTA suddenly increases or drops to 0, DDA shifts accordingly.

**B2-2 — Unmatched change.** Driven by (a) attribution rule config changes in WM backend, or (b) upstream UTM changes from client. Check `unmatch_orders_ratio` over time — if it moves in lockstep with DDA, this is the cause.

**B2-3 — PPS delay.** If a single day's historical value got revised by a small consistent amount, PPS's T+2 backfill is the most likely cause.

### Branch C — iDDA

**Core mechanism**: iDDA = DDA **plus** calibration from lift test results. Order of diagnosis: DDA layer → PPS → lift test.

**C1 — Check DDA trend first.** If iDDA ≈ DDA in trend, the issue is on touchpoint/DDA side → Branch B. If iDDA diverges from DDA (often dropping more), the iDDA calibration layer introduced the change → continue to C2/C3.

**C2 — PPS.** Same T+2 backfill mechanism as Branch B. If iDDA shows small retro-edits while DDA is stable, PPS is likely.

**C3 — Lift test calibration (the iDDA-specific cause).** When a new lift test result is applied, iDDA **retroactively rewrites** the historical window. A low-lift result lowers the platform's weight and drags historical attribution down. Template → `templates/07-lift-test-results.sql`

| **Signal** | **Meaning** |
|-|-|
| `test_end_date` within 0–30 days before `anomaly_start` | Overlaps anomaly window — very likely the trigger |
| `LIFT_PCT` ≈ 0 or very low | Test concluded near-zero incrementality → iDDA cuts weight sharply |
| `NC_IROAS` noticeably lower than previous test | Calibration was pulled down; NC attribution drops with it |
| `auto_apply = 1` | Result auto-applied, no manual step required |
| `UPDATE_TIME` falls between two client data pulls | Direct evidence of a retroactive change |

**Before concluding the lift test result is correct**: were there atypical conditions during the test (promotions, holiday, major spend changes)? Was the holdout design sound? If in doubt, loop in DS and schedule a lift-test refresh once the environment is stable.
