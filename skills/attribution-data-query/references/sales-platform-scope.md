# Sales-platform scope — default all platforms, always stated

Every attributed sales / ROAS number carries **two** scoping choices that define what
it means: the **attribution model** (see `attribution-model.md`) and the
**sales-platform scope** (this file). State BOTH, every time — a figure with only one
of them named is ambiguous.

## Default: all sales platforms

Default the sales measure to **`attr_all_sales` / `attr_all_orders`** — Shopify DTC
**plus** Amazon, TikTok Shop, and other marketplaces — NOT Shopify-only. A brand's
"sales" or "ROAS" means its whole business unless the user narrows it. Use
`attr_shopify_sales` only when the user explicitly asks for Shopify / DTC alone.

> These templates historically defaulted to `attr_shopify_sales` (Shopify-only). That
> default is now **`attr_all_sales`**. The only intentional Shopify-only spots are an
> explicit "Shopify / DTC only" ask and the per-platform breakdown row below.

## Always state the scope

In every answer, name the sales-platform scope next to the model — e.g. "all sales
platforms · incrementality-adjusted" — exactly the way the model is already stated.
Never surface a sales / ROAS figure without its scope: "$3.87M" means something
different as all-platform vs Shopify-only, and the reader can't tell which without the
label.

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
