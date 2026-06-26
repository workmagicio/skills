## Attribution model reference

### Model → model_id mapping

Used in SQL via the `attr_model_name` dimension.

| **Model** | **model_id** | **What it represents** |
|-|-|-|
| `platform_reported` | 0 | What the ads platform (Meta / Google / TikTok) reports natively — uncalibrated, no cross-channel de-dup |
| `last_click` | 1 | Last click before conversion gets 100% credit |
| `first_click` | 2 | First click before conversion gets 100% credit |
| `any_click` | 21 | Linear: every click in the conversion window gets equal share |
| `dda` | 31 | Data-driven attribution: any_click + handling for Unmatched / VTA / PPS |
| `idda` | 32 | Incremental DDA: dda + lift test calibration; reflects true incremental contribution |

### Model availability by sales platform

<callout emoji="💡">
**Not all models work on all sales platforms:**
- **DTC platforms** (Shopify, TikTok Shop, etc.): all 6 models valid (platform_reported, last_click, first_click, any_click, dda, idda)
- **Non-DTC platforms** (Amazon Store, etc.): only **iDDA, DDA, and platform_reported** are valid. Click-based models (last_click, first_click, any_click) are NOT available because click signal can't be observed off-site on these platforms.
For a scientific comparison, **pin a single sales platform** and use only its valid model set. Mixing DTC and non-DTC into one comparison row is not meaningful — run them as separate comparisons if the user wants to see both.
</callout>
