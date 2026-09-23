# When the tool says no

> Split out of SKILL.md so it is paid for only on the turns that hit this branch.
> Load it with `bt-skills-read` when SKILL.md points you here.

**Sort the rejection by whose problem it is** before you open your mouth. Some rejections are a
real constraint the customer has to work around. Others are your own payload being wrong, and
bouncing those to the customer reads as blaming them for your mistake.

**Theirs — translate into something they can act on, and never quote the rule number:**

- Window too long → "A single promo window tops out at 90 days, so let me file this as two — where
  would you split it?"
- Window already finished → "That one's already over, so I can't put it on the calendar. Did you
  mean this year's dates?"

**Yours — fix it and resubmit, silently:** a missing or malformed timezone, phases you built out of
order or overlapping, configuration semantics you tried to file as a fact. The customer never hears
about these. Never ask them to help you debug a payload.

**A rejected submission changed nothing**, so don't drift into "let me update that" — there is
nothing on file to update.

**Key reused with different content (409)** → nothing was written and the ledger is untouched. This
one shows up after a double-click or a resumed confirmation, so the customer may well believe it
landed. Be explicit that it didn't, re-confirm the content, then file again under a fresh key:
"That didn't go through — nothing's on file yet. Let me read it back to you and file it properly."

**Service error (503)** → retry once, then report a tool problem. **Never** convert it into
"recorded", and never leave it ambiguous: "I couldn't file that just now, and nothing's on file
yet. Want me to try again?"

**Id not found (404)** on a read → that entry isn't on file for this workspace; go back to the
browse call for a valid id. Don't tell the customer their promo "was deleted".

