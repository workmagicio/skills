## Full input field reference

MBO has 9 scenario settings. The skill must mirror UI defaults — if UI has a default, the skill applies it automatically and surfaces it via `appliedDefaults` in the preview so the user can override.

| **Field** | **Required from user or use default** | **Default value** | **Notes** |
|-|-|-|-|
| `level` | Has default | **tactic** | Switch to `channel` only if user explicitly manages budget at platform level. |
| `channels` | Has default | **All available** channels/tactics under selected outcome + level | If user named a subset ("Meta only"), respect scope. Don't expand. |
| `sales_platform` | Has default | All Ready platforms selected (combined) | Default selects all Ready platforms. Only narrow to a subset if user explicitly says ("only Shopify", "exclude Amazon"). |
| `optimization_period` (`periodStartDate` + `periodEndDate`) | Required | Next ISO week (Monday → Sunday) | Future planning window. Parse "next month" / "Q3" / "next 30 days" → explicit dates. **Past dates invalid**. If user didn't say a window, apply default (next week) and surface in preview. |
| `reference_period` (`modelReferenceStartDate` + `modelReferenceEndDate`) | **Required (always ask user)** | **Propose**: same length as `optimization_period`, immediately prior within the MMM model window | See reference-period-rules.md for the 5-rule list including the HARD PRECONDITION on `model_window.end`. |
| `goalMethod` | Has default | Maximum | Parses from user intent: `maximum` (under a budget cap) or `target` (hit a specific metric value). |
| `optimization goal` | Has default | **sales** | One of 12 metrics — parses from user intent: `sales` / `roas` / `profit` / `poas` / `orders` / `cost_per_order` / `new_customer_sales` / `new_customer_roas` / `new_customer_profit` / `new_customer_poas` / `new_customer_orders` / `cac` |
| `budget` + `budgetChangeType` | Conditional (only when `goalMethod=maximum`) | `budgetChangeType=percentage`, `budget=100` (= keep current spend flat) | See budget-parsing.md for amount vs percentage semantics. |
| `goalTarget` | Conditional (only when `goalMethod=target`) | No default | Must ask user explicitly. |
| `budget_constraints` | Has default | None (model runs free) | **Don't ask proactively**. Honor if user mentions. Pre-check sum vs total budget (see constraint-conflicts.md). |
| `perChannelBudgetChecked` | Has default | **false** | Per-tactic budget lock panel — default closed; only set `true` if user explicitly locks tactics. |
