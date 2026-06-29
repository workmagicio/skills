## Proposal message format

The configuration-path proposal (State B / C) has a strict structure to keep the chat conversational and avoid overwhelming the user with technical detail. Full template → `templates/proposal-message.md`.

### Required ingredients

1. **Brief intro** (1-2 sentences). State B: short, no concept introduction. State C: explain NC in business language.
2. **3-row table of real campaigns → proposed value**. Pulled from `templates/01-sample-campaign-names.sql`.
3. **Pattern description** in business language: "the third segment between underscores" — not "position 2 of split('\_')"
4. **One confirmation question**: "Add this as an 'Audience' property?"
5. **Follow-through promise**: "(After confirmation, I'll pull the audience-level ROAS you asked for — no need to repeat the question.)"

### Anti-patterns

- Asking 3+ technical questions in the same message
- Using regex / position-index / SQL terminology in the user-facing text
- Showing fabricated campaign names
- Not telling the user the original query will be answered after
