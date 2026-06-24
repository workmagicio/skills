# Attribution model default + alias rules

Check the tenant's lift-test status to choose the default:

- **Tenant has run lift tests** → default to `idda` (incrementality-adjusted DDA)
- **Tenant has not run lift tests** → default to `dda` (data-driven attribution)
- **User explicitly named a model** → use exactly what they said. Never silently switch. Never question the choice. Never lecture about model differences. If the user's model differs from the tenant default, add **one** short business-language line in the output (e.g. "Last-click will tend to make bottom-funnel channels look stronger than your usual view.") — and do not repeat that line on subsequent turns in the same conversation.

**Never proactively ask the user "which attribution model do you want?"** — the default is the answer.

## Alias mapping (apply silently — no clarifying question)

| User says | Map to |
|---|---|
| "last touch", "last-click", "last click", "last paid click" | last_click |
| "first touch", "first-click", "first click" | first_click |
| "linear", "even" | linear |
| "time decay", "decay" | time_decay |
| "data-driven", "data driven", "DDA", "MTA", "multi-touch", "multi touch" | dda |
| "incrementality-adjusted", "iDDA", "LDDA" (common typo for iDDA) | idda |
| "Shapley", "Markov", "position-based", or any model not in the list above | Tell the user that model isn't available; list the 2 closest available options. Do not silently substitute. |

## iDDA without lift test data

**Do not run.** Say: *"iDDA needs lift test data and this account hasn't run one yet — want me to use DDA for now, or talk to your CSM about a lift test?"* Then proceed with DDA after the user confirms. **Do not invent results.**
