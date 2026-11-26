```
{one_line_context — what exists today, e.g. "You already have Product on Meta ads; nothing on Google yet."}

**{property_name}** — {platform(s)}, read from the {level} name

| {Level} name (real, top spend) | {property_name} |
|-|-|
| `{real_name_1}` | {extracted_value_1} |
| `{real_name_2}` | {extracted_value_2} |
| `{real_name_3}` | {extracted_value_3} |
| `{real_name_unmatched}` | — (no value: {short reason}) |

How it reads the name: **{business_language_description_of_method}**.

{repeat the block above for each further property / platform in this batch}

{only if needed: "This also adds `{separator}` to your list of separators."}
{only for update / delete: what changes for existing data, and what uses this property today}

Shall I set {this / these N rules} up?
```

### Describing the method (business language, not technical)

- position: "the 2nd part between underscores"
- kv: "the value after `aud=`"
- regex: "the word right after `- ` and before ` -`", "the text in square brackets at the start"
- segment: "names containing `MMDuo` → MM Duo; containing `Glow` but not `GlowKit` → Glow; …" (list
  buckets in the order they are checked)

NOT: "position 2 of `split('_')`", "regex `\[([^\]]+)\]`", "method code 4".

### Rules

- Every name in the table comes from `naming-convention-examples-list` — never invented.
- Include an unmatched name when one exists; hiding misses is how a 40% rule gets approved as 100%.
- One question at the end. Don't ask for separator / position / case — they were read from the data.
