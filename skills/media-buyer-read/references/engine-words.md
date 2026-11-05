# When the engine's own words can't be passed on

> Split out of SKILL.md so it is paid for only on the turns that hit this branch.
> Load it with `bt-skills-read` when SKILL.md points you here.

`reason` / `reasonBrief` / `title` / `keyResult` are the engine's own rendered text, and on some
accounts they are not fit to show anyone: build-plan node codes (`bp_…`, `node cs1`), raw entity ids,
platform API constants (`MANAGE_AD_LEVEL_STATUS`), internal doc links, and whole paragraphs written
in Chinese — sometimes mid-sentence, in the same field. That is a real state of the data, not an
error you can retry away. It is on you to carry the meaning across.

**You may restate. You may not re-decide.**

RESTATE — the information is unchanged, only the wording is yours:
- Internal jargon into the customer's words — "pull from the envelope or freed pool" → "using budget
  freed up elsewhere in the account".
- A Chinese passage into English, keeping every fact it carries.
- Platform API constants into what they did — `MANAGE_AD_LEVEL_STATUS` → "switched it on".
- Drop blueprint codes, node names, raw entity ids and internal links entirely. They carry nothing
  the customer can use, and a link into our own workspace must never be pasted into a reply.
- Mechanics in plain words — "wave 2/2, auto-relayed by chain-launcher once the create receipt
  landed" → "the second and final step of that plan, which ran automatically once we'd confirmed the
  first step had actually taken effect".

NEVER — these are re-deciding, not restating:
- Supplying a cause the engine did not state, because the reply reads better with one.
- Turning "the note on record doesn't explain this" into a plausible-sounding reason.
- Changing a fact because the original is awkward, unflattering, or hard to phrase.

**When a note is beyond restating** — it is pure internal debug material with nothing in it for the
customer — do not force it, and do not pretend the engine gave no reason. Say what the step did, and
say where that came from.

Say it **once, where it matters**: when the customer asked why that step happened, or when the note
is the only thing that would have answered them. Listing six actions does not mean six sentences
about unusable notes — describe what each did, and spend the disclosure on the one they are actually
asking about.
- OK: "That step switched the creative set on — that's the moment it could start spending. The note
  on record for it is an internal technical one, so I'm describing the change itself rather than
  quoting it."
- NEVER (silent): describing the action and letting the customer assume no rationale was recorded.
- NEVER (raw): quoting the note as-is because "it's what the record says".

**Prose and configuration are two separate records, and the prose can be wrong about the
configuration.** A `reason` is what got written down when the action ran; `settings-get` is what the
account is set to, read live. They are produced separately and they do drift — a note citing "the
account floor" on a tenant whose goals are configured per channel is describing a setup that does not
exist there, and the number it quotes belongs to one channel rather than the account. The customer
has usually read that same sentence, so it is often where their question came from.

The action is still ours either way. An unusable note is a problem with our own writing, never a
reason to hedge on whose action it was — see the three actors above.

