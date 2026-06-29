## Failure modes (never do these)

- **Treat as one-time query** — this skill always ends with a scheduled task; if no schedule, it's `attribution-data-query`
- **Skip the test run** — never activate a schedule without showing the user one rendered report first
- **Silent-activate** — every task creation needs the diff-card preview + explicit confirmation
- **Skip delivery channel confirmation** — defaulting to email when user might have meant in-app risks unintended external sends
- **Send to external email without explicit extra confirmation** — sharing attribution data outside the requester's org is a data-exposure event
- **Hard-code "Meta + Google" or any channel mix** — derive from user input; ask if missing
- **Misaligned period-over-period** — week-to-date vs full week makes every report look broken; use length-aligned windows
- **Ask "which attribution model?"** — auto-apply tenant default
- **Expose internal labels** ("Cron job", "Heartbeat", "task_id") — user sees "scheduled task" everywhere
- **Pad with "want to set up another?"** — end the turn after activation confirmation
- **Skip `knowledge-base-ask` before SQL** — needed for `ctx` on the test run
- **Multi-question form in the clarification turn** — one pivotal question, defaults elsewhere
- **Fire the report immediately without scheduling** — that's one-time data query, not this skill
- **Add `tenant_id` filters in SQL** — platform-mcp injects it
- **Forget to include attribution model + data-as-of in the report footer** — readers will misinterpret without it
- **Invent a report layout instead of copying from `templates/`** — produces inconsistent reports for the same client week-to-week
