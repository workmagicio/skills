# Sales-platform scope — default all platforms, always stated

> **🔒 SINGLE SOURCE OF TRUTH — sales-platform scope + measurement identity.** This
> file is the canonical definition for the whole attribution family. Other skills must
> **point here** (read via `skills_read` if not loaded), never keep a divergent copy.
> Change the rule here, once.

Every attributed sales / ROAS number carries **two** scoping choices that define what
it means: the **attribution model** (see `attribution-model.md`) and the
**sales-platform scope** (this file).

## The law: always state the scope

**State BOTH — sales-platform scope AND attribution model — on every number, every
time.** A figure with only one of them named is ambiguous ("$3.87M" reads very
differently as all-platform vs Shopify-only, and the reader can't tell which). This is
non-negotiable and applies to *all* attribution outputs — chat answers, reports,
dashboards, diagnoses — including when the scope is "all platforms". How the default is
*chosen* varies by context (below); how it is *labeled* never does.

## The default is scoped by context

- **Totals / business overview** (an overall "sales", "ROAS", "how's the business"
  ask, and this query skill's generic default) → **all sales platforms**:
  `attr_all_sales` / `attr_all_orders` (Shopify DTC **plus** Amazon, TikTok Shop, and
  other marketplaces). A brand's business is its whole business unless the user
  narrows it. This skill (`attribution-data-query`) defaults here; offer a per-platform
  breakdown when useful.
- **Per-sales-platform-specific analysis** — attribution-**model comparison** and
  anomaly **diagnosis** — stays **per sales platform**, on purpose: model *validity*
  differs by platform (non-DTC platforms like Amazon have no click-based models), so
  aggregating them into one all-platform row would compare undefined things. Those
  skills default to a single sales platform and say which. That is intentional, not
  drift — don't "fix" them to all-platform.
- Use `attr_shopify_sales` only when the user explicitly asks for Shopify / DTC alone.

> These templates historically defaulted to `attr_shopify_sales` (Shopify-only). The
> overview/total default is now **`attr_all_sales`**. Intentional Shopify-only spots:
> an explicit "Shopify / DTC only" ask, and the per-platform breakdown row below.

## The measurement-identity line

Emit the scope next to the model wherever a number appears — one consistent string:
**`<sales-platform scope> · <attribution model>`** (e.g. "all sales platforms ·
incrementality-adjusted", or "Shopify · data-driven"). Same phrasing in a chat footer,
a report header/footer, a dashboard subtitle, or a diagnosis — so a reader always sees
both halves of what a number means.

## Breaking down by sales platform

Per-platform attributed sales come from **dedicated Cube measures**:

| Platform | Measure |
|---|---|
| Shopify (DTC) | `attr_shopify_sales` / `attr_shopify_orders` |
| Amazon | `attr_amazon_sales` / `attr_amazon_orders` |
| TikTok Shop | `attr_tiktok_sales` / `attr_tiktok_orders` |
| **All platforms (total)** | `attr_all_sales` / `attr_all_orders` |

Rules for a breakdown:

- Sum the dedicated measures you have; the remainder (`attr_all − the known platforms`)
  is **"Other marketplaces"**. Some marketplaces (e.g. Ulta) have real attributed
  sales but **no dedicated Cube measure** — never fabricate a per-platform number for
  them; fold them into "Other marketplaces" so the parts still tie to `attr_all`.
- There is **no `sales_platform` dimension** on the attribution dataset
  (`dws_view_copilot_attr_channel_level_daily_latest`): `GROUP BY sales_platform`
  fails, and the raw `attr_sales_platform_sales` map column returns `null` through
  Cube. Use the dedicated per-platform measures, not a group-by.
- The store-actual dataset `order_sales` **does** have a `sales_platform` dimension
  (`shopify` / `amazon` / `other`) — but that is *store-reported* sales, a different
  dataset from *attributed* sales. Don't cross them.

## Ad spend is not a sales-platform concept

Never split `ad_spend` by sales platform — spend is a marketing-channel concept (which
ad platform paid), not a checkout-platform one. So there is **no per-sales-platform
ROAS**. At the all-platform scope, ROAS is **blended**: every attributed sale across
all sales platforms ÷ total ad spend. Say "blended" when the scope is all-platform.
