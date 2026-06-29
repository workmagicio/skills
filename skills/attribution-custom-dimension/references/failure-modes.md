## Failure modes (never do these)

- **Silently substitute a nearby property** — if user asked for "audience" and tenant only has "segment", don't just query "segment" without telling them
- **Send the user to the UI to configure NC themselves** — the skill exists precisely so they don't have to. Only escalate to UI if config is genuinely impossible from chat (e.g., needs admin permissions the agent doesn't have).
- **Ask 3+ technical questions at once** — "what separator? what position? what property name? case-sensitive?" overwhelms; lead with one proposal and one confirmation
- **Hard-code propertyNames** — they're tenant-specific and case-sensitive; always pass `tenantId` to `dashboard-metrics-list` first and use the returned string verbatim
- **Use `naming_convention.X` as a SQL field prefix** — the propertyName is used directly as a dimension; no namespace prefix
- **Skip the sample-name lookup** — guessing patterns from the user's verbal description without reading actual campaign names leads to rules that match 30% of data
- **Skip the post-config sanity check** — high-NULL ratios are a silent failure; surface them before handing off
- **Fabricate campaign-name examples** — always pull real ones from `database-query-sql`. Invented examples destroy user trust.
- **Apply `naming-convention-create` without explicit confirmation** — naming-convention writes are R1 at the system level, but skill-level convention requires one explicit confirmation step before firing
- **Lose the original query during configuration** — the user wanted ROAS by audience; after config they should get ROAS by audience without restating
- **Skip `knowledge-base-ask` before SQL** — required for `ctx` timestamp on both the sample pull and the sanity check
- **Treat State A as needing configuration** — if the propertyName already exists, just use it; don't show the user a configuration message
- **Propose all NC properties at once on State C** — focus on the term the user just asked about; other properties can be added later
