## Output rules (all reports)

- Always include **sales-platform scope**, **attribution model**, and **data-as-of timestamp** in the header + footer — the user (or their CMO) shouldn't have to guess. The revenue/ROAS in this report are **all sales platforms** by default (`attr_all_sales`); label that scope, because it reads very differently from Shopify-only (`attribution-data-query/references/sales-platform-scope.md`)
- WoW / period-over-period **length-aligned** — for weekly reports compare full Mon–Sun vs full Mon–Sun; never partial-vs-full
- Highlight thresholds: **≥ ±20% change** earns mention; smaller changes are noise
- Heartbeat (alert) variant: short message, one-line summary + link to dashboard — don't dump the full layout

## Per-cadence layout choice

| **Cadence / Intent** | **Template** |
|-|-|
| Daily / weekly / monthly | `templates/weekly-report.md` |
| Quarterly OR "for my CMO" | `templates/executive-report.md` (also see `references/executive-variant.md`) |
| Heartbeat (conditional alert) | `templates/heartbeat-alert.md` |
