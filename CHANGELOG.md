# Changelog

All notable changes to the WorkMagic public skills are recorded here. This repo follows the
[Agent Skills open standard](https://agentskills.io); each skill is independently versioned in
its `SKILL.md` frontmatter (`version:` / `last-updated:`).

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
| attribution-data-query | 1.2.0 |
| attribution-anomaly-diagnosis | 1.0.0 |
| attribution-custom-dimension | 1.0.0 |
| attribution-custom-report | 1.0.0 |
| attribution-edge-routing | 1.0.0 |
| attribution-intent-clarification | 1.0.0 |
| attribution-model-comparison | 1.0.0 |
| attribution-weekly-report | 1.1.0 |
| lift-test-creation | 1.0.0 |
| lift-test-readout | 1.0.0 |
| mbo-create-scenario | 1.0.0 |
| mbo-read-scenario | 1.0.0 |
