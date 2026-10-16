- Alias mapping (apply silently)

| User says | Map to |
|-|-|
| “FB”, “Facebook”, “Meta” | Meta Ads |
| “GA”, “Google”, “Goggle” (tolerate minor typos) | Google Ads |
| “TT”, “TikTok” | TikTok Ads |
| “Snap” | Snapchat Ads |
| “Pin”, “Pinterest” | Pinterest Ads |
| “Amazon Ads” | **Not a lift-test platform** — say so; don’t map it |
| “UK”, “United Kingdom”, “Britain” | country `GB` |
| “PTM”, “pause”, “pause to measure” | PTM |
| “LTM”, “launch”, “launch to measure” | LTM |
| “auto”, “automatic”, “let WorkMagic do it” | automatic |
| “manual”, “I’ll do it myself”, “I’ll set up on platform” | manual |

Spelling tolerance: “Goggle Ads”, “Snapcaht” → silently corrected to canonical names; surface the canonical name in the Step 4 summary.

- Time-constraint parsing

Distinguish three semantics:

| User says | Parse as |
|-|-|
| “starts June 1” / “start June 1” | testStartTime = June 1 |
| “finish before July 15” / “ends by July 15” | **deadline** — back-solve testStartTime (leave room for design-computed experiment_days + 7d cooling) |
| “run for 4 weeks” / “4-week test” | testPeriod target = 28 days |
| “as fast as possible” | Shortest viable testPeriod (14d); flag the higher daily-budget requirement |
| Past date (“yesterday”, “June 1 2024” when today is 2026) | **Error out** — don’t hard-build. Ask if user meant a different date. |

**Conflicting constraints** (e.g. “finish in 4 weeks + daily spend < \$3k + Meta”): clarify, don’t silently drop part.

**Budget unit ambiguity** (“under \$5k” — daily or total?): clarify once.

- Cell-grouping parsing

| User says | Cells |
|-|-|
| “Meta and Google”, “Meta vs Google”, “compare Meta and TikTok” | one cell each (default when no grouping is stated — don’t ask) |
| “…separately” / “a separate result for each” | one cell each |
| “…together” / “combined” / “as one” | the same cell |
| More than 4 things to measure separately | ask which to drop or combine (max 4 test cells) |

- Geo-constraint parsing

| User says | Handle |
|-|-|
| “exclude New York” with geoLevel = DMA | “New York” is ambiguous (city / DMA / state) — **clarify** |
| “exclude New York” with geoLevel = state | Parse as NY state |
| “exclude Texas, Florida, and Arizona” | locationSetting = exclude + [TX, FL, AZ] |
| “only run in California” | locationSetting = include + [CA] |
| User names a geo not in the geo reference | Error out, list closest candidates |

- Field-level resolution rules (moved verbatim out of SKILL.md §Inputs)

| Field | Rule |
|-|-|
| adPlatform | The ad platform the user named (Meta, Google, TikTok, etc.). **Apply alias mapping silently** (FB→Meta, GA→Google Ads, IG→Meta). |
| testLevel | Ask in business language: “Test the entire account, a specific tactic, or particular campaigns?” |
| impactCampaignInfos | Tactics: tactic-list (impact-campaigns does not return tactics). Accounts / campaigns: lift-test-impact-campaigns. Bound per platform per cell in `testChannel`. |
| testStartTime | Ask last — other fields can be resolved first. |
| salesChannel | Query DB for the tenant’s connected sales channels, show them to the user for confirmation. |
| primaryMetric | Switch to new_customers when the user says “acquisition / new customer.” |
| country | Only **8 countries supported**: US / UK (passed as `GB`) / CA / DE / FR / AU / ES / SE. **Other countries error out** — never hard-build. |
| geoLevel | **US state only when the user explicitly says so.** Non-US countries are postcode only. |
| method | **Honor explicit user choice exactly** — do not silently switch. |
| approach | **MNTN / Walmart Connect / Roku / Universal Ads / Vibe / TikTok GMV Max** are manual-only. |
| coolingPeriod | Suggest 14–28 when the user mentions long-consideration categories (furniture, electronics, etc.). |
