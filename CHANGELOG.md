# Changelog

All notable changes to the WorkMagic public skills are recorded here. This repo follows the
[Agent Skills open standard](https://agentskills.io); each skill is independently versioned in
its `SKILL.md` frontmatter (`version:` / `last-updated:`).

## 2026-08-14
### Changed
- **Sales-platform scope is now a first-class part of the measurement identity.** Attributed
  sales / ROAS now default to **all sales platforms** (`attr_all_*`), not Shopify-only, and every
  answer states the sales-platform scope alongside the attribution model — the two together are
  what make a figure interpretable. New reference `attribution-data-query/references/sales-platform-scope.md`
  (default, always-state rule, per-platform breakdown via dedicated measures, "Other marketplaces"
  for platforms without a dedicated measure, no `sales_platform` dimension on the attribution
  dataset, spend never split by sales platform). `attribution-data-query` SQL templates/examples and
  `attribution-weekly-report`'s metrics template flipped `attr_shopify_sales` → `attr_all_sales`.
  Follow-up: `attribution-model-comparison` (its own `sales_platform`-filter mechanism) and the
  remaining skills' output-scope labeling.

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
| attribution-weekly-report | 1.0.0 |
| lift-test-creation | 1.0.0 |
| lift-test-readout | 1.0.0 |
| mbo-create-scenario | 1.0.0 |
| mbo-read-scenario | 1.0.0 |
