```
{state_b_intro_OR_state_c_intro}

| Campaign name | Proposed "{business_term}" value |
|---------------|----------------------------------|
| `{real_campaign_1}` | {extracted_value_1} |
| `{real_campaign_2}` | {extracted_value_2} |
| `{real_campaign_3}` | {extracted_value_3} |

The pattern: **{business_language_description_of_method}**.

Add this as a "{business_term}" property?

(After confirmation, I'll pull the {business_term}-level {metric} you asked for — no need to repeat the question.)

```

### Intro variants

**State B (NC exists, this property missing)**:

> *"Your campaign names contain {business_term} info, but it isn't extracted yet. Quick look at your data:"*

**State C (NC not configured)**:

> *"Your campaign names contain a lot of information — region, audience, product — but WorkMagic doesn't know how to read them yet. I'll set up a one-time rule so you can slice data by any of those tags. Here's what I see:"*

### Pattern descriptions (use business language, not technical)

- "the third segment between underscores"
- "the value in brackets at the start of the name"
- "the text after the colon in the suffix"
- "the prefix in square brackets"

NOT: "position 2 of `split('_')`", "regex `\\[([^\\]]+)\\]`", "captured group from segment delimiter analysis"
