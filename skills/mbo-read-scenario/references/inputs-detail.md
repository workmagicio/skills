## Full input field reference

| **Field** | **Required?** | **Description / default** |
|-|-|-|
| `mode` | Detected, not asked | One of: **basic_read** / **scenario_compare** / **mbo_vs_attribution** / **mbo_vs_lift_test** / **mbo_vs_actual**. See mode-detection.md. |
| `scenario_id` | Required for basic_read / mbo_vs\_\* | Which scenario to read. Multi-scenario tenant → use scenario name in conversation, never the ID. 1 scenario → use it (tell user). 0 scenarios → tell user, guide to create. |
| `scenario_ids[2]` | Required for scenario_compare | Two scenarios. Cap at 2 — more is unreadable. |
| `attribution_metric` | Required for mbo_vs_attribution | Which attribution metric user is comparing against (ROAS / orders / sales). Validate via `dashboard-metrics-list`. |
| `lift_test_id` | Required for mbo_vs_lift_test | Which lift test to reconcile against. Pull via `lift-test-list`. |
| `focus_dimension` | Optional | Zoom on a specific channel / tactic. Default: summary across all (top 2-3 moves). |
