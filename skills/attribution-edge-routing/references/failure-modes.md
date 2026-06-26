## Failure modes (never do these)

- **Fabricate an answer** — the worst failure. If attribution can't answer, route; never invent a number. "I'd estimate Meta ROAS at 2.3x next quarter" is unacceptable unless backed by MBO.
- **Cold refusal with no bridge** — "Sorry, I can't do that" without a routing path or a substitute question makes the user feel stuck. Always offer the next step.
- **Substitute silently** — if user asks for TikTok and you show Meta because TikTok isn't integrated, that's data fraud. State the missing integration first.
- **Expose internal terminology** — "out-of-scope dataset", "unsupported tool", "T+1 lag with PPS backfill" — rewrite in business language
- **Skip `tenant-list` verification for Type C** — claiming "TikTok isn't integrated" without checking is a credibility risk
- **Promise other products do things they don't** — "MBO can answer that" must actually be true; verify via `knowledge-base-ask`
- **Over-apologize** — one acknowledgment line is enough; long apologies feel performative
- **Route everything to "contact CSM"** — that's the dead-end fallback; only use when no product / no self-service path exists
- **Treat "I don't know" as edge-routing** — sometimes attribution can answer and the agent just hasn't tried hard enough. Verify the limitation before declaring an edge case.
- **Mix two edge types in one explanation** — if it's Type C (not integrated), explain that; don't muddy the water with Type A (other product) language
- **End with "is that okay?"** — let the user respond if they want the bridge; don't seek validation
- **Refuse a multi-part ask wholesale because one part is edge** — split; answer what you can, route what you can't
- **Cave on pushback** — when user says "just guess" / "ballpark it" / "best estimate", hold the line. Caving is exactly the failure mode this skill exists to prevent.
