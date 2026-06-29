## Failure modes (never do these)

- **Run N separate queries instead of one CASE WHEN** — separate queries can drift on filters / dedup and produce non-comparable numbers
- **Compare click-based models on a non-DTC sales platform** — last_click / first_click / any_click are NOT valid on Amazon Store and similar; only iDDA, DDA, and platform-reported are. Dropping click models silently is also wrong — tell the user once.
- **Mix multiple sales platforms in one comparison row** — attribution is per sales platform AND the valid model set differs (DTC vs non-DTC). Run separately per sales platform; never merge into one row.
- **Skip `knowledge-base-ask` before SQL** — `database-query-sql` requires the `ctx` timestamp
- **Invent a reason for a diff that doesn't match any known pattern** — say "this pattern isn't typical; worth checking lift test calendar / VTA config" instead
- **Push one model as "the right answer"** — give situational guidance only when asked; the user picks based on their decision context
- **Default to a 7-day window** — too noisy for model comparison; use 30 days as the default
- **Compare iDDA to anything when no lift tests exist** — surface the missing-lift-test state and use dda instead
- **Hide the platform-reported column when comparing** — it anchors the user's expectation ("but Meta says 5x") and explains the most common confusion
- **Use `attribution_model` as a SQL column** — the actual dimension is `attr_model_name`
- **Ask "want to look deeper?" at the end** — the UI exposes drill-down; don't pad
- **Append a "which model should I use" guide when the user didn't ask** — pad-y and presumptuous
- **Add `tenant_id` filters in SQL** — platform-mcp injects it
- **Write SQL from scratch instead of copying from `templates/`** — increases risk of platform casing / Cube-syntax / aggregation errors
