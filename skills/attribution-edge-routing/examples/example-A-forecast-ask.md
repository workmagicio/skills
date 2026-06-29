## Example A — "Forecast next quarter's Meta ROAS"

The most common Type A case: user asks for a forecast, agent routes to MBO with a bridge.

### User input

*"Can you forecast my Meta ROAS for next quarter? I want to plan the Q4 budget."*

### Step-by-step

#### Step 1 — Classify boundary type

Decision sequence:

- Forecast / scenario? **Yes** → Type A → MBO ✓

#### Step 2 — Verify with knowledge-base-ask + check MBO provisioning

Ask `knowledge-base-ask` what MBO can do (confirm: budget scenario optimization with forward-looking projections). Call `budget-optimizer-list` to check if tenant is provisioned for MBO. **Result**: MBO is provisioned, tenant has 2 saved scenarios.

#### Step 3 — Compose 4-part response

Copy `templates/routing-response.md`, fill with Type A variant:

<callout emoji="💡">
Got it — you want to forecast Meta's ROAS for Q4 so you can plan budget. Attribution shows historical performance; forecasting is what our **MBO** does. **Good news — MBO is already enabled on your account, and you have 2 saved scenarios.** You can build a new Q4 scenario at [link to MBO]. Meanwhile, I can pull the last 90 days of Meta ROAS so you have a baseline reference — want me to?
</callout>

#### Step 4 — End turn

Don't pad. Don't ask "is that okay?". User responds if they want the bridge or to go straight to MBO.

### What this example illustrates

- **Acknowledged user's actual goal** (Q4 budget planning), not just literal words ("forecast Meta ROAS")
- **Stated the boundary in business language** — "Attribution shows historical performance" — no jargon like "out-of-scope" or "non-prescriptive dataset"
- **Specific routing path** — named MBO, mentioned the provisioning status, mentioned the saved-scenarios count (this surface-of-existing-context is what makes the response feel grounded, not generic)
- **Bridge offered** — the 90-day Meta ROAS gives the user something useful right now
- **No "is that okay?" suffix** — the bridge offer ends with "want me to?" which IS the user's optional next step, not a validation-seeking question
- **4 sentences total** — within the 3-5 sentence target; not padded with apology

### Variant — what to do if MBO is NOT provisioned

<callout emoji="💡">
Got it — you want to forecast Meta's ROAS for Q4 so you can plan budget. Attribution shows historical performance; forecasting is what our **MBO** does. MBO isn't currently enabled on your account — your CSM can activate it (typically takes a day to provision). Meanwhile, I can pull the last 90 days of Meta ROAS so you have a baseline reference — want me to?
</callout>

### Variant — what to do if user pushes back ("just give me a rough number")

<callout emoji="💡">
**User**: "I don't need MBO, just give me a ballpark forecast."
**Agent (holds the line)**: I'd rather not — a wrong guess on a forecast question costs more than no answer. Past Meta ROAS varies enough quarter-to-quarter that a ballpark from me would mislead more than help. MBO is the right tool here. Want me to pull the last 90 days as a baseline so you have something concrete?
</callout>

This is the canonical hold-the-line response. **Never cave to "just guess"** — fabricating is exactly the failure mode this skill exists to prevent.
