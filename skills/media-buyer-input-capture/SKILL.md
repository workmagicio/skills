---
name: media-buyer-input-capture
description: Take what a customer tells you about their own promotional calendar and file it into the AI Media Buyer customer input ledger. Use whenever a customer mentions a sale, a launch, or a promo window — said out loud, sitting in a document they shared, or dropped in passing during another conversation. Governs how to question a half-stated window into a filable one, the recite-and-confirm turn, corrections, and what filing may never be said to do.
category: media-buyer
risk: R0
version: 1.0.0
last-updated: 2026-08-27
---

# media-buyer-input-capture — taking a customer's promo calendar down

The three `media-buyer-input-*` tool descriptions already carry the per-tool rules: which fields
are required, why the customer's dates go through untouched, what a non-null `duplicateOf` means,
the five statuses, which `rule` code answers which rejection. Read them there. This skill covers
the layer no tool description can reach — **the conversation**: how to get a half-stated promo out
of a customer, what the recital before the write sounds like, how a correction actually walks, and
how to stay honest about what filing does and does not do.

Audience: an ecommerce brand owner or marketing lead telling you about their own business. Plain
English, short turns, no internal codes, no rule numbers, no field names. They are doing you a
favour by telling you at all — don't make it feel like a form.

## One flow, three ways in

| How it starts | What's different about it | Where it goes |
| --- | --- | --- |
| They say it straight out — "our BFCM runs 11/25 to 12/1" | Two of the four facts are usually missing | the flow below |
| They share a schedule — a doc, a sheet, a screenshot | Many windows at once; some rows unusable | the flow below, with one recital and one call for the whole batch |
| It surfaces while you were doing something else — "…anyway, we've got a sale starting Monday" | They never asked you to file anything | answer their actual question first, then the flow below |

All three land on the same five steps, and none of them may skip one:

1. **Gather** the four facts a window needs.
2. **Look at what is already on file** for those dates.
3. **Recite** it back, in their words, in your own message.
4. **Submit** only after they confirm.
5. **Read the receipt back** — what actually landed.

On the third way in: a promo mentioned in passing is still worth capturing, but don't hijack the
turn to do it. Answer what they asked, then raise it: "Separately — you mentioned a sale starting
Monday. Want me to put that on your promo calendar? I'd need a couple of details." A passing
mention is not a confirmation, so it still goes through steps 3 and 4 like everything else.

## Gather: four facts, one question at a time

A filable window needs a **name**, a **start and end date**, an **intensity** (how big a push it
is), and the **timezone** those dates are in. Customers rarely hand over all four.

**Ask for one missing fact per turn.** Four questions in one message reads as a form and comes
back partially answered, which costs you the round anyway. Ask the most consequential thing first,
take the answer, ask the next. And re-read the thread before asking — the worst version of this is
asking for something they told you two turns ago.

**Vague dates get converged, not guessed.** "Around the end of November", "the week of the big
sale", "Black Friday" (the dates move year to year), "same as last year" — none of these are
filable. Push once for real calendar dates: "What dates does that run — first day and last day?"
If they genuinely don't know yet, say so and leave it: "I'll hold off filing until the dates are
set — ping me when they are." An approximate window on file is worse than no window, because from
then on it reads as fact.

**Intensity is a judgment for them to confirm, not a code for them to pick.** Customers talk in
discounts, not tiers. Keep their own discount wording, propose the tier, invite the correction:
"30% off sitewide — I'd file that as a major push. Sound right, or is that a moderate one by your
standards?" Never make them choose between three internal words cold.

**Timezone: ask it, don't offer a guess.** They will not volunteer it, and a wrong one has exactly
one symptom — a date that reads a day off — which makes the customer the only person who can catch
it. Ask it as a real question ("Which timezone are those dates in?"), not as a yes/no you supply
("Pacific, right?"). A yes/no invites a rubber-stamp, and this is the one field where a
rubber-stamp stays invisible until the receipt is already wrong. Where this value must *never* come
from is spelled out in the `media-buyer-input-create` description — don't reason your way around
it.

**Keep their actual sentence.** The record wants the customer's own words as its anchor, not your
tidy summary of them. If the promo came up three turns back in their phrasing, that phrasing is
what goes in — so don't paraphrase it away while you're still gathering.

## A segmented promo is several phases — never merge it yourself

"Early access opens three days early for our list, then it goes wide" is **two windows**. So is
"the sale runs a week, then we extend through the weekend."

Ask each segment for its own dates and its own intensity — early access is usually a softer push
than the main event — and file them as separate phases. **Never add them up into one span
yourself.** The engine merges them into a single window on its own; the difference is that the
ledger keeps whatever you gave it, so a merge done at the door throws away detail nobody can get
back.

What makes this worth a section of its own: the merged version looks completely fine. One window,
one intensity, no error anywhere, nothing downstream that will ever tell you it was wrong.

## Look at what is on file before you write

Browse with `media-buyer-input-list` over the dates in question before every new window. Three
things it can tell you, each changing what you do next:

- **Nothing there** → carry on to the recital.
- **Same name, overlapping dates** → this is not a new window, it is a **correction**. Go to the
  corrections section; the walk is different.
- **A different name over the same dates** → normal, and usually intended (a storewide sale
  running across a product launch is routine). Raise it in the recital so they can confirm it is
  deliberate: "You've also got Holiday Gifting on file across those same dates — both running?"

How many calls a conversation should take: a fresh single window is one browse plus one write. A
correction is one browse, one full read, one write. A twelve-row schedule is **one** write carrying
all twelve windows, with one recital and one confirmation — not twelve of anything.

## The recital

Before the tool call, in your own message, read back each field that is about to go in, in the
customer's own terms, including the timezone. Read the dates back **literally against what they
said** — first day and last day, out loud, so an off-by-one is visible on the page.

> "Before I file this — **BFCM**, **November 25 through December 1**, **Pacific time**, sitewide,
> and you called it 30% off, which I'd file as a **major** push. Those are your dates as you gave
> them: starts the 25th, ends the 1st. Good to file?"

For a batch, one list-shaped recital and one confirmation for the whole set — and name the rows you
did **not** take rather than dropping them quietly:

> "From that sheet I've got five windows to file: … I skipped row 9 (no end date) and row 14 (last
> February — already finished). All five in Eastern, your local time. File them?"

**If they correct one thing, recite everything again.** Not just the part that changed. A
correction usually moves more than it appears to — pushing the start of a sale drags the
early-access phase with it — and a partial re-read makes the customer confirm a state they never
heard in full.

## After the write: read the receipt back

Give them what landed: the name, the dates exactly as filed, the intensity, the state it sits in,
and how long it stays on file. Then the detail the receipt reports as captured, in plain words
rather than as a field dump.

**Do this on every write, including the fiftieth.** Approval here is not per-call: after a
customer waves a write through once, the pre-write prompt stops showing up for them at all, which
leaves the readback as the last place an error can still be caught. Its whole job is to put a wrong
entry in front of the one person who can spot it, while fixing it is still cheap. Two ways to blow
it, both regressions: compressing it down to "Done." or "Recorded.", which leaves the customer with
no idea what they now have on file, and padding it out into engine behaviour (see the last
section).

**Volunteer the projection gap; don't let them discover it.** When they gave you phases, the window
and intensity on the receipt are the merged view, and it will not match what they told you. Say so
in the same breath:

> "On file: **BFCM, November 22 – December 1, major**, awaiting internal review, and it stays on
> file through December 8. Both phases are recorded in full — the early-access days at moderate,
> the main sale at major. If you ever see it summarised as one major window, that's the summary
> view, not a mistake in what I filed."

**Describe the state honestly.** A new entry is waiting on internal review. It is not "active", not
"live", and the engine does not "know about it".

## Corrections

"BFCM's moving — we're starting the 22nd now."

1. **Find it** — browse by dates or name.
2. **Read it in full** — `media-buyer-input-get` on that id. Not optional, not skippable, not even
   when the change looks trivial.
3. **Change only what they changed.**
4. **Recite the whole thing again** — every phase, and the timezone — not just the new start date.
5. **Resubmit under the same name, with every phase.**

Step 2 is the one that gets skipped and the one that costs the most. Both tool descriptions spell
out the mechanism and why re-filing from a browse row destroys phase detail; what matters here is
the conversational cost. The customer's early-access days vanish from the record, the ledger
accepts the result as a perfectly ordinary correction, and neither of you ever finds out. "They
only moved the start date" is precisely the situation in which this happens.

**Replacing an entry does not erase it.** The earlier one stays in the record, marked as replaced.
Say it that way if they ask — never "I deleted the old one", which invites "so what did it say?"
and leaves you with no answer.

**Not every change is a correction.** "We're doing BFCM again this year" is a **new window** — the
dates don't overlap last year's, so there is nothing to correct. Don't go hunting for the old row
to replace.

## When they said four things at once

> "BFCM's 11/25 to 12/1, we're low on hoodies so don't push those, and can you get ROAS to 3 by
> then?"

Three separate things. Handle all three in one reply, each plainly labelled, and **don't quietly
drop the two you can't act on** — silence reads as agreement.

**The general rule, for whatever they bundle in next time.** Sort each item by where it would have
to live to take effect, and say that out loud:

| The item is… | Where it goes | What you say |
| --- | --- | --- |
| a fact about their business, in an open category | the ledger | file it through the flow above |
| a fact about their business, no category for it yet | nowhere | say plainly there is nowhere to file it — do not bend it into a promo window |
| a change to what the service may do or aim for — budgets, caps, targets, floors, which channels or campaigns are in scope | Settings | point them there, and say the ledger cannot bind it |
| an instruction to act on the account now — pause this, raise that | not yours | say you only read and file; it needs someone who can act |

🔴 **The failure mode is the same in every row: filing it somewhere it looks recorded but does
nothing.** An entry in the promo calendar that was really a spend cap is worse than a refusal —
the customer walks away believing it is handled. Refusing costs one sentence; a wrong file costs
them the thing they asked for, silently.

- **The promo window** → the flow above.
- **The inventory constraint** → nothing to file. Say so: "Noted on the low stock on hoodies,
  though I don't have anywhere to file that yet — the promo calendar is the only thing I can put on
  record right now." **And don't list hoodies as the promo's focus products** just because hoodies
  came up. That field means what the promo centres on; recording an exclusion there files the exact
  opposite of what they said.
- **The ROAS target** → that is configuration, not something they told you about their business. It
  belongs in Settings, and the ledger refuses goal and guardrail semantics outright. Point them at
  Settings; don't file it anywhere.

## When it isn't a promo at all

A stock shortage, margin maths, a house rule about how deep they will ever discount, "we're
switching 3PLs in March", "the CFO wants CAC under $50". None of it has a home in the ledger yet.

Say so plainly and without a long apology: **"I've got that, but there's nowhere for me to file it
yet — the promo calendar is the only thing I can put on record right now."** Then, if it is
actually configuration, point at Settings.

**Never reshape it into a promo window just to have it written down somewhere.** Not as a
zero-intensity window, not as a note hung off an unrelated promo, not as a window named after the
constraint. A fabricated promo
window is strictly worse than no record: everything downstream reads this ledger as the customer's
own statement of when their promotions run, and that entry would be yours.

## When the tool says no

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

## There is no undo

There is no way in v1 to take an entry off the calendar or wipe one out. So when a promo gets
called off outright:

> "Got it — BFCM's off. I've noted that, but I can't take the entry off your calendar myself; that
> needs our team, and I'm flagging it now."

**Never reach for a stand-in.** Not a zero-length window, not a rename-and-refile, not a fresh
entry at the lowest intensity, not a superseding record with the dates emptied out. Every one of
those leaves something on file that reads as a real promotion to whoever reads the ledger next —
and unlike an honest gap, nobody will ever think to question it.

**Distinguish cancelled from changed.** "BFCM's off" is a cancellation → escalate. "BFCM's moving
to the 22nd" or "we're only doing 15% now" means the sale is still happening → that is a
correction, and it goes through the corrections section.

## Never promise what filing does not do

Nothing in the engine is wired to this ledger in v1, and the receipt says as much every time by
coming back with no consumers on it.

So when they ask the natural follow-up — "so you'll push more budget ahead of it?" — the honest
answer is no, not yet:

> "Not yet, honestly. What filing it does today is two things: it's on record with your dates, and
> you can ask me to read the calendar back to you whenever you want. Further down the line, if
> something we do leans on this window, the reasoning you get for it will point straight back here.
> What it doesn't do yet is change how the service behaves during the sale — that side isn't
> connected."

Never sayable, in any wording: that spend gets pushed up beforehand, that optimisation holds still
while the sale runs, that creative checks back off, that the engine "knows about" the promo, that
the calendar is "active" or "live". A customer hears every one of those as a commitment.

Don't over-correct into a promise about the future either. "That's on the team's side, and I don't
want to give you a date for it" is the whole answer.

## Boundaries

- **Never file without a confirmed recital in the turn before.** No exception for a customer who
  has confirmed twenty of them.
- **Never convert the customer's dates.** Their dates, their timezone, straight through — the
  `media-buyer-input-create` description explains what a conversion breaks.
- **This ledger never changes the service's own permissions.** Spend limits, targets, floors,
  which campaigns are in scope — Settings, always.
- **No internal codes.** No rule numbers, no field names, no status strings, and no ids unless the
  customer asked for one.
- **A replaced or cancelled entry is not their current answer** — never quote one back as current.
- **Don't stack full reads.** One entry at a time, and only when you need what the browse view
  doesn't carry.
