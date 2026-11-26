# Platform quirks — where the signal lives in names

Observed on real WorkMagic tenants, not platform documentation. Accounts differ (some teams do name
their Google RSAs), so always confirm with `naming-convention-examples-list` at `level: "all"`.

Because a property name can live at only **one level per platform**, the job is to find the level
that carries the signal for most of that platform's spend.

| Platform | ad name | ad set name | campaign name | Usual best level |
|-|-|-|-|-|
| Meta | Often highly structured (`PRODUCT_FORMAT_DATE_…`); some accounts auto-name — check | Mixed; sometimes product / audience | Strategy-level, sometimes product | ad |
| TikTok (non-GMV Max) | Usually reuses the Meta ad naming | Test / theme names | Test / theme names | ad |
| TikTok GMV Max | Empty | Empty | `GMVMax_<product>` style | campaign |
| Snapchat | Structured, like Meta | Generic | Generic | ad |
| Pinterest | Mixed; names are **truncated around 50 chars** | **Auto-generated timestamps** (`2025-11-05 16:06 UTC \| Ad group`) — no signal | Often product-themed; covers catalog ads with empty ad names | ad (campaign if catalog-heavy) |
| AppLovin | Structured | Often empty | Sometimes product | ad |
| Google — Shopping / Search | Empty (RSAs have no ad name) | Product- or keyword-tagged | Generic | ad set |
| Google — Performance Max | Empty | Empty / one shared | Generic | not classifiable from names |
| Google — Demand Gen video | `<asset id> \| <PRODUCT>` | Generic | Generic | ad (but Google usually goes ad set; see below) |
| Microsoft Ads | Empty on Search / PMax | Product-tagged on Search | Generic | ad set |
| Amazon Ads | Empty | Empty | Tenant-specific `<TYPE>_<Product>` patterns | campaign |

## Gotchas

- **Google mixes campaign types.** Shopping + Search (usually most of the spend) carry the signal in
  ad set names; Demand Gen carries it in ad names. With one level per platform, choose ad set and
  tell the user Demand Gen will be missed — the fix on their side is to add the product token to
  those ad set names.
- **Dashboard ≠ name field.** For Google RSAs, some Pinterest formats and catalog ads, the dashboard
  "Ad" column shows a rendered preview (headlines, post copy, feed title) when the real ad name is
  empty. Rules read the stored name, not the preview. If the user says "I can see names", check
  `naming-convention-examples-list` before agreeing.
- **Truncation (Pinterest).** A rule looking for a long product name misses truncated names — match
  on a shorter stable token.
- **Casing.** Segment matching is case-sensitive. List each casing that actually appears in the
  names (usually one or two), not every permutation.
- **Imported rule sets** (e.g. exports from another attribution tool) can mix name-based rules with
  rules keyed on ad / product IDs. NC rules only read names; ID-based rules can't be carried over —
  say which ones and offer a name-based alternative or accept the gap.

## A platform not listed here

Pull examples at all three levels; the level with the longest, most varied strings is where the team
puts structure. Look for dominant prefixes (`GMVMax_`, `[BRAND] |`, `Search - ACQ -`). Empty or
auto-generated names at one level say nothing about the others.
