## § 4.7 — Modify existing scenario

If user wants to change an existing scenario instead of creating new:

1. **Locate the scenario** via `budget-optimizer-list`. Use scenario name in conversation, never scenario_id.
2. **Identify what field changes**: rename / budget / channels / strategy / outcome / level / period / goal / constraints / etc.
3. **Rename only** → do **not** trigger forecast re-run. Just update the name.
4. **Any other field change** → triggers re-run. Tell user: "This change will recompute the recommendations, takes a few minutes."
5. **If reference period or optimization period changes**, re-check that lengths match. Re-propose reference period if length now mismatched.
6. **Show preview + confirm** (same diff-card pattern as create).
7. **Apply via `budget-optimizer-update-or-delete`**.
8. **For delete** → require **explicit second confirmation** with consequences ("this will delete the scenario and its history; cannot be undone").
