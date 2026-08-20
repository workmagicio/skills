# Changelog

All notable changes to the WorkMagic public skills are recorded here. This repo follows the
[Agent Skills open standard](https://agentskills.io); each skill is independently versioned in
its `SKILL.md` frontmatter (`version:` / `last-updated:`).

## 2026-08-19
### Removed
- **`attribution-custom-report`** — the skill that built a **native platform** custom dashboard
  (via `wms_dashboard-create`). We no longer build native custom dashboards; "create / build a
  dashboard" now routes to the **`dashboard` skill** (a live-data html/react **artifact** — richer,
  self-refreshing, and it inherits the measurement-identity/sales-platform-scope rules). Routing
  pointers in `attribution-data-query` and `attribution-weekly-report` updated accordingly.

### Changed
- **Single source of truth for shared attribution conventions.** `attribution-data-query`'s
  `references/attribution-model.md` (model default + aliases) and `references/sales-platform-scope.md`
  (sales-platform scope + measurement identity) are now marked **canonical** — other attribution
  skills point here (via `skills_read`) instead of keeping divergent copies (the drift/contradiction
  source found in review). New `scripts/check-shared-conventions.mjs` drift guard (no CI in this
  repo — run before pushing): asserts the canonical markers exist and no SQL template regresses to
  the Shopify-only default measure.
- **`attribution-data-query` (1.2.0 → 1.3.0): report-shaped results become a live artifact.** A
  single number / tiny table still answers in chat; a breakdown / trend / multi-platform / comparison
  now builds a live-data dashboard **artifact** (the `dashboard` skill) carrying the measurement
  identity — not a wall of table dumped in chat.
- **Reports now produce good-looking artifacts (family-wide output upgrade).** The house rule:
  simple pull → chat; anything report-shaped → a beautiful artifact (live where it queries data,
  static HTML where it's a point-in-time narrative). Each of these also drops its duplicated
  conventions in favor of the canonical pointer above:
  - `attribution-weekly-report` (1.1.0 → 1.2.0): the recurring view is now a **live dashboard** built
    first; the schedule pushes an optional snapshot (in-app/Slack link + digest, or an email
    HTML/PDF snapshot + link) — asked as one question, not assumed.
  - `attribution-model-comparison` (1.0.0 → 1.1.0): a multi-model comparison is a **live Comparison
    artifact** (grouped bars × model + the diff-pattern "why they differ" readout), per sales
    platform; a 1-channel check may stay a chat table.
  - `attribution-anomaly-diagnosis` (1.0.0 → 1.1.0): a diagnosis is a **static HTML artifact** (a
    shareable page: What/Why/What-to-do + one anomaly visual), kept static because it's a
    point-in-time explanation.
  - `attribution-custom-dimension` (1.0.0 → 1.1.0): its delegated answer inherits the data-query
    threshold, so a "by <label>" breakdown comes back as an artifact.

## 2026-08-14
### Changed
- **Sales-platform scope is now a first-class part of the measurement identity.** Every attribution
  number states BOTH the **sales-platform scope** and the **attribution model** — the two together
  are what make a figure interpretable (a "$3.87M" reads very differently as all-platform vs
  Shopify-only). New reference `attribution-data-query/references/sales-platform-scope.md`: the
  always-label **law**, the **scoped default** (totals / business overview → all sales platforms
  `attr_all_*`; per-sales-platform model comparison & anomaly diagnosis stay **per platform** on
  purpose, because model validity differs by platform), per-platform breakdown via dedicated
  measures, "Other marketplaces" for platforms without a dedicated measure, no `sales_platform`
  dimension on the attribution dataset, and spend never split by sales platform.
  - `attribution-data-query` (1.1.0 → **1.2.0**): SQL templates/examples default `attr_all_sales`;
    SKILL states scope + model in the source citation; worked example carries the scope label.
  - `attribution-weekly-report` (1.0.0 → **1.1.0**): metrics template uses `attr_all_sales`, and the
    report header + footer now carry `Sales platforms: {sales_scope}` alongside the model — closing
    the gap where all-platform revenue/ROAS shipped to a CMO labeled with the model only.
  - Unchanged on purpose: `attribution-model-comparison` and `attribution-anomaly-diagnosis` stay
    **per sales platform** (model validity differs by platform). Follow-up: their output-scope
    labeling standardization, and the remaining skills' provenance lines.

## 2026-07-14
### Added
- **`npx skills` distribution** — one-command install/update across Claude Code, Codex, Cursor,
  Gemini CLI, and 70+ agents.
- **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json`) — `/plugin marketplace add workmagicio/skills`.
- This changelog.

### Skill versions (current)
| Skill | Version |
| --- | --- |
| attribution-data-query | 1.3.0 |
| attribution-anomaly-diagnosis | 1.1.0 |
| attribution-custom-dimension | 1.1.0 |
| attribution-edge-routing | 1.0.0 |
| attribution-intent-clarification | 1.0.0 |
| attribution-model-comparison | 1.1.0 |
| attribution-weekly-report | 1.2.0 |
| lift-test-creation | 1.0.0 |
| lift-test-readout | 1.0.0 |
| mbo-create-scenario | 1.0.0 |
| mbo-read-scenario | 1.0.0 |
