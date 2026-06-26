## Edge cases & routing

| **Edge case** | **Handling** |
|-|-|
| User's term is similar to an existing propertyName (e.g., user says "region", tenant has "Region" already) | Use the existing one. Don't create a duplicate. Mention case-sensitivity match in the answer: "Using your existing 'Region' property." |
| User's term partially matches (e.g., user says "audience type", tenant has "Audience") | Surface this once: "You have an 'Audience' property — is that what you mean, or a separate 'Audience Type'?" One question, not multi-round. |
| Campaign names look inconsistent — no clear pattern | Tell the user honestly: "Your campaign names don't follow a consistent pattern, so I can't extract this reliably. Best path: standardize the naming going forward, and we can revisit then." Don't fabricate a rule that won't apply to most data. |
| Most rows resolve to NULL after applying the rule (sanity check fails) | Don't hand off. Surface the failure: "The rule I tried only caught X% of your campaigns. Here are the ones it missed — want me to adjust?" Offer 1-2 alternative interpretations. |
| User asks to set up NC without an underlying data question | Route to a general NC setup flow (could be a separate skill or product onboarding); this skill is data-query-driven. Don't run setup steps without a pending query to answer afterward. |
| Business term applies to a different DataSet (e.g., user asks "by region" but means sales-platform region) | Disambiguate once: "By campaign region tag, or by sales platform region (where the order shipped)?" The second is a different data source entirely. |
| User wants to remove or rename an existing NC property | Admin-level. Confirm explicitly with extra UX confirmation ("This will affect all dashboards using this property"), then use `naming-convention-update-or-delete`. |
