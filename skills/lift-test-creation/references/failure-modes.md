Complete catalog. Top 6 most-violated are inline in SKILL.md §7 CRITICAL; the rest are here.

**On mandatory asks**:

- ❌ **Building without asking for ad platform** — must be explicit
- ❌ **Defaulting testLevel to platform without asking** — must ask
- ❌ **Re-asking fields the user already specified** (user said “Meta tactic level”, then asking “which platform?”)

**On defaults**:

- ❌ **Hard-building with defaults when the user gave almost nothing** (e.g., “create a lift test for me” → Meta + platform + PTM + US silently)
- ❌ **Override the user’s preference without surfacing it** (user picks LTM, system flips to PTM without saying)

**On internal terminology**:

- ❌ Using PTM / LTM **without a brief inline explanation on first mention** — first use should be e.g. "PTM (pause-to-measure — pause Meta in a subset of geos to measure lift from removed exposure)"; after that, just "PTM" is fine
- ❌ **Using method-incorrect treatment-side labels** — the treatment side’s label depends on the test method, matching product UI:

  - **PTM** treatment side → **“Holdout group”** (ads paused here)
  - **LTM** treatment side → **“Exposed group”** (new spend introduced here)
  - **Reference / baseline side, any method** → **“Reference group”** Do NOT label the LTM treatment side as “Holdout group” — that contradicts the UI and confuses users. Do NOT invent a unified term like “Treatment group” — the product doesn’t use it.
- ❌ **Asking the user to fill holdoutPct / numberOfCells / experiment_days / MDL** — these are internal parameters
- ❌ **Showing facebookMarketing / attr_model_name / liftTestAdsPlatformList in the summary** — use business names
- ❌ **Exposing internal field labels (“Test DMAs”, “Control DMAs”)** — use “Holdout group” / “Reference group” to match the product UI
- ❌ **Using “Geo coverage” or “Expected daily spend” in design output** — use **“Geo size”** and **“Feasibility threshold”** to match the product UI
- ❌ **Including MDL in design output** — the UI doesn’t show it; don’t give it to the user

**On time**:

- ❌ **Treating a deadline as the start date** (“finish before July 15” → testStartTime = July 15)
- ❌ **Treating duration as a deadline** (“run for 4 weeks” → testEndTime = a specific date 4 weeks from now)
- ❌ **Hard-building with a past date**
- ❌ **Recommending a start date without avoiding running tests** — must call scan to check collisions

**On constraints**:

- ❌ **Building a draft when constraints can’t be satisfied** — state the gap and give next steps first
- ❌ **Silently dropping part of a multi-constraint request** — clarify
- ❌ **Misreading budget units** (treating total budget as daily)
- ❌ **Saying “can’t do it” without giving at least 2 actionable directions** when infeasible

**On platform / geo**:

- ❌ **Hard-building for an unsupported country** (Japan, Brazil, etc.) — error out and list supported
- ❌ **Silently switching to manual when the user said automatic but the platform is manual-only** — must surface
- ❌ **Misresolving an ambiguous geo name** (“New York” is a city / state / DMA — clarify, don’t guess)
- ❌ **Dropping a geo the user asked to exclude**
- ❌ **Silently dropping a Not-ready sales channel** — must surface

**On multi-platform**:

- ❌ **Dropping one of the platforms the user named**
- ❌ **Telling the user “I’ll split this into multiple cells” but then asking them to pick numberOfCells**
- ❌ **Not telling the user the test will be split into multiple 2-cell experiments**

**On mid-flow modification**:

- ❌ **Re-running design silently after a user-requested change** — say “Changed X, re-running design, one moment”
- ❌ **Partial updates** (platform changed, but country / approach / other derived fields not refreshed)
- ❌ **Making the user redo the whole flow from scratch**

**On the final draft**:

- ❌ **Final confirmation table missing fields** — must include primary metric and feasibility threshold
- ❌ **Double-confirming the config** — asking the user to confirm the full configuration a second time after Step 4 (e.g. echoing the full config again before calling create, or asking “shall I go ahead and create the draft?”). Step 4 is the only confirmation gate; Step 8 calls create directly. Progress updates and specific local questions (Insufficient lever choice, start date) are fine, but re-confirming the whole config is a regression.
- ❌ **Field labels not matching the UI** — Experiment days → Test period; treatment-side labels follow the method (PTM → Holdout group, LTM → Exposed group) — see the terminology rule above
- ❌ **Sales channel not defaulted to all selected**
- ❌ **Going straight to schedule instead of draft** (unless the user explicitly asked)
