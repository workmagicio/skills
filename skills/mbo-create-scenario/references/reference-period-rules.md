## Reference period — the 5 rules

1. **Always ask the user explicitly.** Even if user said nothing, surface the proposed dates and let them override.

<callout emoji="🛑">
**HARD PRECONDITION.** BEFORE proposing any reference period, fetch the MMM model window (`hyp.model_window.start` → `hyp.model_window.end`) from `budget-optimizer-reference-data`. **Every proposed window MUST fall entirely within these bounds — including `model_window.end`.** Do NOT suggest dates after `model_window.end` even if they look "intuitive" (e.g., do NOT suggest September as reference for an October optimization if the model only has data through June 13).
</callout>

1. Reference period **length should match `optimization_period` length exactly** (e.g., 31-day October optimization → 31-day reference window). If the immediately-prior same-length window would extend past `model_window.end`, **clamp** to end at `model_window.end` and start at `model_window.end − optimization_period_length`. Example: October 2026 (31 days) + model_window.end = 2026-06-13 → propose **2026-05-14 → 2026-06-13**, NOT 2026-09-01 → 2026-09-30.
2. If model window is too short to fit a same-length reference (e.g., user wants 90-day optimization but only 60 days of model data left), tell the user the constraint and offer:

   - (a) use the longest available window inside `model_window` with prorated baseline, or
   - (b) shorten the `optimization_period` to match available data.
3. Surface known anomalies in the proposal window (BFCM, major outages, tracking gaps, blowout sales) and suggest a clean alternative.

<callout emoji="💡">
**Don't take the bait — "intuitive" reference dates.** If user asks for an October optimization, the intuitive reference is September. But if `model_window.end` is 2026-06-13, September is OUT-OF-BOUNDS. Propose the clamped window (2026-05-14 → 2026-06-13) instead. The model can only forecast from data it has — anything past `model_window.end` is hallucination.
</callout>
