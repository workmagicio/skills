- Alias mapping (apply silently)

| User says | Map to |
|-|-|
| “FB”, “Facebook”, “Meta” | Meta Ads |
| “GA”, “Google”, “Goggle” (tolerate minor typos) | Google Ads |
| “TT”, “TikTok” | TikTok Ads |
| “Snap” | Snapchat Ads |
| “Pin”, “Pinterest” | Pinterest Ads |
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

- Geo-constraint parsing

| User says | Handle |
|-|-|
| “exclude New York” with geoLevel = DMA | “New York” is ambiguous (city / DMA / state) — **clarify** |
| “exclude New York” with geoLevel = state | Parse as NY state |
| “exclude Texas, Florida, and Arizona” | locationSetting = exclude + [TX, FL, AZ] |
| “only run in California” | locationSetting = include + [CA] |
| User names a geo not in the geo reference | Error out, list closest candidates |
