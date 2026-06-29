## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| Tenant not provisioned | Don't collect settings. "MBO isn't enabled on your account yet — CSM can turn it on." Route to `attribution-edge-routing`. |
| "How much should I spend on X?" (recommendation question) | Only honest answer: run a scenario. Don't search list, don't pull historical, don't make up a number. Lead with: "Optimal budget depends on total budget, period, and goal — let me build a scenario." Then collect inputs. |
| "What's my budget?" / "Show me my budget" (ambiguous) | 2-step disambiguation: clarify type (existing scenarios / build new / attribution actuals), then route or continue. |
| Channel not in tenant integration | Tell user, list available. Don't silently drop. Offer to proceed without it. |
| Channel exists but not MBO Ready | Tell user, point to Settings → Platform Integrations. Offer to run without it. |
| User says "Meta only" / "exclude Amazon" | Respect scope. Don't expand. |
| User specifies tactic names ("Meta's video and prospecting") | Set level=tactic, filter to named tactics. |
| Past optimization period | Reject. Tell user start must be in future. Propose next-week start. |
| Optimization period beyond max supported horizon | Reject. Tell user the max + suggest shortening. |
| Reference period exceeds MMM model window | Clamp to `[hyp.model_window.start → hyp.model_window.end]`. Tell user and offer the clamped period. |
| Reference period length ≠ optimization period length | Default: re-propose to match. If user insists on a different length, tell them MBO prorates (e.g., 30d ref → 14d opt = baseline halved). Don't silently proceed without explaining. |
| Offline / un-integrated channel ("retail stores") | Reject. MBO only supports digital. Route to CSM. |
| Mixed in-scope + out-of-scope | Handle in-scope half. Tell user the offline half needs CSM. Don't silently drop. |
| Negative or zero budget | Reject. |
| Constraint sum > total budget | Flag pre-create. Tell user where + by how much. Give 3 concrete options. **Never** silently adjust. |
| Reference period contains known anomaly (BFCM, outage) | Surface in proposal. Suggest a clean alternative window. |
| Goal unsupported by MBO ("maximize impression share") | Tell user the 12 supported goals. Suggest closest match. Don't substitute silently. |
| User questions MMM model itself ("why is MMM wrong?") | Don't explain model internals. Route to CSM. |
| Modify intent: rename only | Update name. Don't trigger forecast re-run. |
| Modify intent: change any other field | Tell user the change will recompute. Show preview, confirm, apply. If period changes, re-validate reference period length match. |
| Delete intent | Require explicit second confirmation with consequences ("can't be undone"). |
