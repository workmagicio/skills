---
name: media-buyer-plan
description: Hand a customer's build request to the AI Media Buyer engines as a task, wait for their drafts, and turn those drafts into a plan the customer approves or rejects. Use whenever a customer on a managed platform asks for something an engine has to draft — new creatives to launch or swap in, new ad sets or campaigns, a restructure, a season switch or a push behind certain products — and again when they say the task is done and ask you to read the plan and continue.
category: media-buyer
requires: wm-media-buyer-capabilities, wm-media-buyer-task-create, wm-media-buyer-task-get, wm-media-buyer-plan-submit, wm-media-buyer-plan-execute
risk: R1
version: 1.1.0
last-updated: 2026-10-20

references:
- references/states-and-rejections.md
---

# media-buyer-plan — from a customer's request to an approved plan

The `media-buyer-task-*` and `media-buyer-plan-*` tool descriptions carry the per-tool rules:
required fields, idempotency keys, error codes, field shapes. Read them there. This skill covers
what no single description can: **which requests go this way, the order of the calls, what you
say to the customer at each step, and where your part stops and the engine's begins.**

Audience: an ecommerce brand owner or marketing lead. Plain English, short turns, no internal
codes, no ids unless they ask for one.

## The lane, in one picture

```
customer request ──▶ you take it down ──▶ capabilities ──▶ task-create ──▶ engine works (minutes to hours)
                                                                              │
customer: "the task is done, read the plan" ◀────────── (no notification) ────┘
        └──▶ task-get ──▶ plan-submit ──▶ customer approves ──▶ plan-execute
                                        └─ customer rejects ──▶ plan-discard ──▶ artifacts? ──▶ cleanup only if they say so
```

Three parties, kept apart in every sentence:

- **The engine** (creative, structure, catalog) decides *how*: which ad sets, which creatives
  where, what budget a new ad set starts on, what to pause. It writes its answer as **drafts** —
  nothing on the account changes until the customer approves.
- **The customer** decides *whether*. Only their approval sends anything live.
- **You** take the request down, file it, relay questions both ways, assemble the drafts into
  one plan, and get a clear yes or no. You do not make the engine's decisions and you do not
  make the customer's.

## Which requests take this lane

| The customer asks for… | Where it goes |
| --- | --- |
| new creatives launched, or old ones swapped out ("here's our new creative sheet") | this skill, owner = creative |
| new ad sets / ad groups, new campaigns, a new channel's first build, a restructure | this skill, owner = structure |
| a season switch, or "push only these products / this collection" | this skill, owner = catalog |
| a plain budget, bid or status change on a managed campaign | not this skill — say it is managed by AI Media Buyer and stop |
| a fact about their promos | `media-buyer-input-capture` |
| a standing limit, target or scope change | their Settings — not a plan |

🔴 **Never fulfil a request in this lane with `connector-action`, `connector-api` or any other
direct write to the ad account** — not as a shortcut, not "just this once", not when the engine
is slow or the capability is missing. A direct write changes the live account underneath the
managed service and skips the customer's approval. If the lane can't take the request, say so
and stop.

**One request, one task.** Each request has exactly one owner engine, decided by what the request
*is*, not by which pieces it will need. New creatives that turn out to need new ad sets are still
the creative engine's task; it asks the structure engine for the ad sets itself. If a request
mixes things, the owner is whatever the customer asked for first.

## Step 1 — Take the request down

Before any call, write down for yourself, from the whole thread:

1. **Every customer message about this request, verbatim**, one line each, with its date. Not
   your summary — the engine reads their words to make its own judgment, and a paraphrase
   quietly makes that judgment for it.
2. **What they gave you to work from**: a Google Sheet, a Drive / Dropbox / Air folder, files
   uploaded in chat, a promo-calendar entry. Keep the links exactly as given.
3. **What they named**: the platform, specific campaigns or ad sets, a deadline, a start date.
4. **What they did not say** that the engine will have to decide or ask about: budget, existing
   vs new ad sets, audience, copy, landing page, offer or code, which old ads to retire, when it
   should go live, who switches it on.

Then ask the customer **only** for what neither you nor the engine can work out: which platform,
if it is genuinely unclear; where the materials are, if they mentioned them but didn't share
them; a hard date, if one matters to them. One question per turn. Everything else on the
not-said list goes to the engine as it is — choosing ad sets or a starting budget is the engine's
job, and asking the customer to pre-decide it turns a request into a form.

## Step 2 — See what can be delegated

Call `media-buyer-capabilities`. It lists, per platform, which engine takes which kind of work,
whether the result comes back within the same turn (`sync`) or later, and whether the engine may
come back with a question.

- **The platform/capability pair is listed** → carry on.
- **It isn't** → no engine can draft this here yet. Tell the customer plainly that this isn't
  something the service can prepare on that platform right now, and stop. Do not build it
  yourself with a write tool, and do not promise when it will be possible.
- **A quick check is listed and they gave you links** (a creative preflight, `sync: true`) → run
  it first, in this turn. It catches the unopenable link, the empty folder, the unsupported file
  format while the customer is still here: "Two of the Drive links come back as private — can you
  share them with anyone-with-the-link? I'll check again right after."

## Step 3 — File the task

`media-buyer-task-create` with:

- the owner's `capability` and the `ads_platform`;
- `objects`: **only** the campaigns or ad sets the customer named. Leave it empty when they named
  none — the engine picks within the managed scope;
- `intent.quote`: the customer's messages verbatim, one per line. If anything is on your not-said
  list, add it **after** the quotes under a clearly separate heading — `Not stated by the
  customer:` — so it can never be read as their words;
- `intent.inputs`: references to the materials (`url` for a Sheet or folder, `customer_input` for a
  ledger entry, `signed_url` for a chat upload — generate that one immediately before the call; it
  expires in minutes). **Pass the reference; don't open or summarise the material yourself.**
- a `taskRequestId` that is stable for this request, so a retry can't file it twice.

Then the acknowledgement, in four parts: what you received, what the engine is going to look at,
roughly how long (from the response when it gives one), and that a plan comes back for their
approval before anything changes.

> "Got it — I've passed the new fall/winter sheet (18 rows) to the creative engine for Meta. It
> will work out which ad sets each concept belongs in and whether any need a new home; that
> usually takes under an hour. You'll get a plan to approve before anything goes live."

🔴 **Claim only what a call confirmed.** "I've filed it with the creative engine" is true only
after `task-create` returned a task. If it errored, say it didn't go through. And read the
response before you speak: objects outside the managed scope are dropped (`not_done`, code
`out_of_scope`), and if every one was dropped the task is already `blocked` — tell the customer
those campaigns aren't under AI Media Buyer, rather than that work has started.

## Step 4 — Wait, then read

> **Running as a workitem?** Then nothing here applies: the workitem watches the task for you —
> see [When the request runs as a workitem](#when-the-request-runs-as-a-workitem).

The engine works asynchronously, and **nothing notifies you when it finishes**. The customer (or
someone on the WorkMagic side) will come back with something like "the task is done, read the
plan and let's continue". Only then:

1. `media-buyer-task-list` by the request (or `media-buyer-task-get` on the task id you have) —
   find the owner's task and its state.
2. Act on the state. The full table is in `references/states-and-rejections.md`; the common ones:
   - **`proposal_ready`** → the engine wrote drafts. Go to Step 5.
   - **`needs_input`** → the engine has a question. See *Engine questions* below.
   - **`done`** → an analysis-only result; tell them what it found.
   - **`wont_do` / `blocked`** → read the reason and every `not_done` line and put them in plain
     words. "The creative engine didn't place the three holiday concepts: the landing pages in the
     sheet return a 404." Don't soften it into "it's still working".
   - **still `forwarded` / `working`** → say it isn't finished yet, and what stage it is at if the
     events say.
3. `children` on the task are the owner's own helpers (e.g. structure building ad sets for the
   creative engine). They are read-only for you: the owner folds their results into its own.

If the customer asks before then — "any news?" — read the task once and report what it says. Do
not poll, and do not guess a finish time the task didn't give.

## Engine questions (`needs_input`)

The engine stops and asks when the choice is genuinely the customer's. Your job is a faithful relay:

- Put the engine's `question` to the customer **with its options in the engine's own words**
  (`options[].label`). Don't reorder them into a recommendation, don't drop one, and don't answer
  for them because one "obviously" fits.
- Send their answer back with `media-buyer-task-answer` using the matching **`value`**, not the
  label and not your paraphrase. If their reply doesn't map to one option, ask again rather than
  rounding it to the nearest.
- `ask_whom: wm_ops` means the question is for the WorkMagic team, not the customer — don't put
  it to them.
- A helper's question shows up on the owner's task under `children`; answer it with **the helper
  task's own id**.

**The budget question.** When a new build would take the platform past the customer's own limit on
new daily budget, the structure engine doesn't refuse — it comes back with three concrete options:
**add budget** (temporarily raise the limit by a stated amount), **do part of it** (build only the
named ad sets that fit), or **reallocate** (take a stated amount from named live ad sets). Show all
three as given, with their numbers, and let the customer choose. Raising their limit is a change
to their own guardrail — say so in those words, so the choice is made knowingly.

## Step 5 — Assemble and show the plan

`media-buyer-plan-submit` with (tool arguments are camelCase; what the tools return keeps the
service's snake_case, e.g. `result.action_ids` — copy values across, not key names):

- `planRequestId`: stable for this request. **Revising the plan = resubmitting under the same
  id**, never discard-and-new;
- `summary`: two or three sentences of customer English — what will change and why;
- `engineActions`: every id in the task's `result.action_ids`, each `{actionId, phase}`.
  Phase 1 unless the engine's result says otherwise;
- `followUps`: the task's `result.follow_ups`, **copied as returned** — these are later phases
  the engine fills in after earlier ones succeed (e.g. "enable the new ads and pause the ones they
  replace");
- `reviewItems`: the task's `result.review_items` as returned — generated copy or variants the
  customer approves together with the plan;
- `sourceTaskIds`: the owner's task id.

Run it with `dryRun: true` first, then for real. The fields are the engine's; you choose none
of the numbers.

**Showing it.** Lead with what goes live where, in the plan's own rendered titles. Then, for
every engine budget, the three numbers side by side:

> "New ad set **Fall Fleece – Prospecting**: the engine suggests **$40/day** (about three times
> your recent cost per purchase), with **$50/day** as its own reference ceiling."

Then any generated copy word for word, anything the engine left out and why (`not_done`), the
later phases, and the one sentence that matters most: nothing spends until they approve, and
later phases only go out after the earlier ones succeed.

**When the submit is refused.** Read `references/states-and-rejections.md`. In short: a problem in
*your* fields you fix and resubmit without bothering the customer. A problem in the *engine's*
drafts is not yours to fix — the service sends it back to that engine automatically (the error
lists it under `bounced`). Tell the customer what was wrong in plain words and that the engine is
redoing it within their limits; when they say the new round is in, read the task again and
resubmit under the same `planRequestId`. **Never edit an engine's number to make a check
pass.**

## Step 6 — Approval

`media-buyer-plan-execute` runs **only on the customer's own clear yes to this plan, in this
conversation.** Not on silence, not on "looks interesting", not on an approval of an earlier
version, not on your reading that they would agree. Approval sends real changes to their ads.

**A budget change at approval.** "Make that ad set $60 and go ahead" is approval with a change.
Pass it in the same call: `paramOverrides: [{actionId, field: "budget", value: 60}]` — major
units, and only for actions whose `budget.editable` is true. Their named figure counts as their
explicit authorisation, so it **may go past the engine's reference ceiling**; read the three
numbers back so they see it: "Engine estimate $40, its reference ceiling $50, yours $60 — going
with your $60." It **may not** go past the limits in their own Settings; if it does, nothing is
approved and nothing changes — say which limit it hit and ask for another figure. Any change other
than a budget on an editable slot is a revision: resubmit the plan under the same id, show it
again, and wait for a fresh yes.

**After the call:**

- The tool can take up to two minutes. If it times out, **don't call it again** — read the plan
  with `media-buyer-plan-get`; an `approved` state means the approval landed.
- Report what actually happened, per action: sent and succeeded, still in progress, held back with
  its reason, failed. If the dispatch mode is not `live` (a test environment), do not tell the
  customer it is live on their account.
- A multi-phase plan keeps going after this turn. Later, `media-buyer-plan-get` shows where it
  is. If it stopped part-way (`halted`), say which phase didn't complete; what already ran stays —
  nothing is rolled back — and the rest can be discarded.

## Step 7 — Rejection and clean-up

When the customer says no to the plan (not "change this" — that is a revision):

1. `media-buyer-plan-discard` with their reason in their words.
2. `media-buyer-plan-artifacts-get` on the plan. To prepare drafts that can be built without
   further questions, an engine sometimes puts things into the customer's ad account **before**
   approval — typically uploading the chosen images and videos to the platform's media library.
   They don't spend and don't show to anyone, but they are in the account.
3. If there are any, tell them by kind and count, and ask: "Before the plan was ready, the creative
   engine uploaded 9 images to your Meta media library. They aren't running anywhere. Want me to
   remove them?"
4. Only on a clear yes, `media-buyer-plan-artifacts-cleanup` — with just the kinds they agreed to.
5. Report each item honestly. Some can't be removed — **Meta currently offers no way to delete
   from its media library**, so those come back as failed with that reason; say exactly that.
   Items still used by something else live in the account are kept, and you say so.

Drafts, the task ledger and WorkMagic's own creative library are WorkMagic's records, not the
customer's account — nothing to clean up there, and nothing to ask about.

If the customer drops the request **before** a plan exists, `media-buyer-task-cancel` it. If they
change what they want mid-way, file the new task with `supersedes` pointing at the old one.

## When the request runs as a workitem

Some hosts track this lane as a **workitem** instead of keeping it in the conversation (Justin does,
where its workitem tool is available — the host's own instructions tell you to). The customer's
experience is the same; what changes is who waits and who comes back:

- **Taking it down (Steps 1–2)** happens in the conversation, as above. Then create the workitem
  for the agent with the **whole request in its brief** — the record of the customer's words, the
  objects, the materials, the open points. The workitem's runs see the brief and its history, not
  this conversation.
- **Filing (Step 3), in a workitem run:** call `media-buyer-task-create`, read the response as
  Step 3 says, then **finish the run**. Don't poll and don't wait — the workitem follows every task
  it filed and starts its next run when there is something to do. A task that came back finished
  at once (a sync capability) is already settled.
- **Engine questions** reach the customer on their own (in the conversation the request came
  from). When several are waiting they arrive as one message, each tagged `[task <id>]`. The run
  that follows the customer's reply gets their answer: send each part with `media-buyer-task-answer`
  to **the task id in its tag** (a helper's question carries the helper's id), mapped to the
  option's `value` exactly as in *Engine questions*. If a part of the reply does not map, ask again.
- **`proposal_ready`:** the run's brief lists the task's outcome under *External tasks*. Read it
  with `media-buyer-task-get`, assemble and submit the plan (Step 5), show it, and finish the run
  asking the customer to approve.
- **Approval (Step 6):** `media-buyer-plan-execute` needs the customer's approval, and a workitem run
  cannot ask for it live — the call is stopped and the exact step is shown on the workitem. Once the
  customer approves it there, the next run executes it once (same `paramOverrides`). Then finish the
  run: the workitem follows the plan phase by phase and comes back when it has `succeeded`, `halted`
  or been `discarded`. Report from `media-buyer-plan-get` (`execution.outcome`, and for a halt
  `progress.halt_reason`) — never from the execute response alone.
- **Rejection (Step 7)** is unchanged.

## Example — Jordan Craig sends a new creative sheet

> **Customer:** Here's our new fall/winter creative sheet — get these live on Meta.
> *(link to a Google Sheet)*

1. Take it down: one verbatim line; the Sheet link; platform Meta named; not stated — budget,
   existing vs new ad sets, copy, which old ads go, when it goes live.
2. `media-buyer-capabilities` → Meta creative work is the creative engine's, with a quick preflight.
   Run the preflight on the Sheet: all links open, 18 rows, 6 themes.
3. `media-buyer-task-create` (creative, Meta, no objects, the quote, the Sheet as a `url` input) →
   acknowledge: received, being placed, a plan follows.
4. Next day: *"The task is done, read the plan and let's continue."* → task-get: `proposal_ready`
   — five new ad sets (built by the structure engine for the creative engine), 35 new ads, a later
   phase that switches them on.
5. `media-buyer-plan-submit` (dry run, then real) → show five new ad sets with each one's three
   budget numbers, the copy, two concepts left out and why, and that nothing runs until they say
   yes and the new ad sets only turn on after the ads are built.
6. *"Fine, but make the outerwear one $60 a day."* → `media-buyer-plan-execute` with that one
   override → report: phase one sent, the rest follows once it succeeds.

## Boundaries

- **No direct writes for this lane** — `connector-action` / `connector-api` never stand in for a
  task or a plan.
- **Never claim a step that didn't happen.** Filed, submitted, approved, live — each only after the
  call that does it succeeded.
- **Never execute without the customer's own yes to the current plan.**
- **Never change an engine's draft numbers** except a budget the customer names at approval.
- **Never choose for the customer** when the engine asked them.
- **Never clean up their account without a clear yes**, and never call something removed that came
  back failed.
- **No internal codes to the customer** — no rule numbers, state strings, task or action ids,
  engine names beyond "the creative / structure / catalog engine".
