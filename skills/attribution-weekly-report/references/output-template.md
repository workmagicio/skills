## Output rules (all reports)

- Always include **data-as-of timestamp** and **attribution model** in the footer — the user (or their CMO) shouldn't have to guess
- WoW / period-over-period **length-aligned** — for weekly reports compare full Mon–Sun vs full Mon–Sun; never partial-vs-full
- Highlight thresholds: **≥ ±20% change** earns mention; smaller changes are noise
- Heartbeat (alert) variant: short message, one-line summary + link to dashboard — don't dump the full layout

## Per-cadence layout choice

| **Cadence / Intent** | **Template** |
|-|-|
| Daily / weekly / monthly | `templates/weekly-report.md` |
| Quarterly OR "for my CMO" | `templates/executive-report.md` (also see `references/executive-variant.md`) |
| Heartbeat (conditional alert) | `templates/heartbeat-alert.md` |
