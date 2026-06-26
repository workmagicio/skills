## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| User asks for a one-time report ("send me last week's Meta numbers") | Not this skill — route to `attribution-data-query`. No schedule = no task. |
| "Set up a daily attribution summary" with no other details | Ask the most pivotal question once: "Which channels and metrics should it cover?" Don't fan out. Default everything else (in-app delivery, 9am send, iDDA model, prior-day window). |
| "Send me an alert if Meta ROAS drops below 2x" | Detected as Heartbeat. Default check cadence: hourly. Default delivery: in-app + offer to add email. Don't expose "Heartbeat" terminology; user sees a "scheduled task". Use `templates/heartbeat-alert.md`. |
| "For my CMO" / quarterly request | Switch to executive layout. Use `templates/executive-report.md`. Ask for the CMO's email (if email delivery) and confirm PDF vs HTML. |
| Creative report request → "monthly creative performance report" | Dataset = `creative_attribution`. Ask once: "All creatives, or top N? (Default: top 20 by spend.)" |
| User wants a metric / dimension that requires NC config | Pause — route to `attribution-custom-dimension` first. After NC setup completes, resume scheduling here. |
| Test run returns empty | Don't activate. Surface: "The test run came back empty — likely cause: [no data in window / filter too narrow / metric not yet enabled]. Want to adjust?" |
| User wants to send to an email outside the org | Confirm explicitly with extra UX language ("This will share attribution data externally to [email]"). Only proceed on explicit yes; never silently send to external addresses. |
| "Pause" / "edit" / "delete" an existing scheduled task | Use `list_scheduled_tasks` → find target → `update_scheduled_task`. Same preview + confirm flow. For delete, additionally surface consequences (the task and its history will be gone). |
| User asks for a report covering data from a dataset that doesn't exist on their tenant | Surface the gap. Offer available datasets. Don't silently substitute. |
