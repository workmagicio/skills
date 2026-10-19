# Task states, plan states, and when a call says no

> Split out of SKILL.md so it is paid for only on the turns that hit this branch.
> Load it with `bt-skills-read` when SKILL.md points you here.

## Task states

| State | What it means | What you do |
| --- | --- | --- |
| `created` | filed, waiting on an earlier task it depends on | wait |
| `forwarded` | handed to the engine, not yet picked up | wait |
| `acknowledged` / `working` | the engine is on it | wait; give the customer its time estimate if the task has one |
| `needs_input` | the engine has a question for a person (`pending_input`) | relay it — SKILL.md *Engine questions* |
| `proposal_ready` | drafts are written (`result.action_ids`) | assemble the plan — SKILL.md Step 5 |
| `done` | an analysis-only result (`result.artifacts`) | tell the customer what it found |
| `wont_do` | the engine judged it shouldn't be done | relay `result.reason` and `not_done` plainly |
| `blocked` | the engine couldn't do it | same — say what stopped it |
| `unassigned` | no engine picked it up | say it couldn't be started; don't build it yourself |
| `expired` | ran past its time limit (an unanswered question lapses after 72 hours) | say it lapsed; offer to file it again |
| `cancelled` | cancelled | — |

**`not_done` is part of the answer, not a footnote.** Every line is an object the engine didn't
touch and why. Put each in the customer's terms ("the Kids campaign is still in its learning
period, so the engine left it alone") — not as codes.

**Partial is normal.** A `proposal_ready` with some `not_done` lines is a real result: plan what
was drafted, and name what wasn't.

**A task back in `working` after a plan was refused** is the engine redoing its drafts. The new
round's result replaces the old one; resubmit only after it is `proposal_ready` again. Each task
can be sent back at most twice — after that the refusal stands, and you tell the customer what the
blocking limit is.

## Plan states

| State | What it means |
| --- | --- |
| `pending_approval` | waiting for the customer |
| `approved` | approved; phases are going out in order |
| `succeeded` | every phase went out successfully |
| `halted` | something failed part-way; later phases won't go out. What ran stays. The rest can be discarded, and the account's leftover uploads can then be offered for clean-up |
| `discarded` | rejected or expired |

A plan past its expiry can't be approved. If the customer approves one that has lapsed, say so,
file a fresh plan under a **new** `plan_request_id` from the same drafts, and show it again.

## When submit or execute says no

**Sort the refusal by whose problem it is** before saying anything.

**Yours — fix and resubmit, silently.** An unknown or extra field, a missing `plan_request_id` or
`summary`, a phase numbering gap, a `follow_ups` entry you altered instead of copying. The
customer never hears about these.

**The engine's — it is sent back automatically.** The error carries `bounced[]`, one entry per
task it went back to:

- `bounced` → the engine is redoing it. Tell the customer what was wrong and that the engine is
  reworking it within their limits: "The plan came to $180/day of new budget on Meta, over the
  $150 limit in your settings — the structure engine is reworking it to fit." Wait for the new
  `proposal_ready`.
- `busy` → the engine is already mid-revision; wait.
- `closed` / `not_routed` / `bounce_failed` → it could not be sent back. Tell the customer the plan
  doesn't fit their limit as drafted and couldn't be reworked automatically; don't change the
  numbers yourself.

**The customer's — they choose.** The over-limit check on new daily budget comes with options
(`raise_cap`, `partial`, `reallocate`): put them to the customer as *raise your limit*, *do part of
it*, *move budget from elsewhere*, and wait for their choice. Normally the structure engine has
already asked this during the task; seeing it at submit or approval means something changed since.

**At approval, settings may have moved.** Approval re-runs every check. If the customer paused the
service, switched off a strategy, or tightened a limit since the plan was shown, approval is
refused and the plan stays waiting. Say what changed; revise under the same `plan_request_id` if
needed.

**A budget override was refused** → nothing was approved and nothing changed. Say which of their
own limits the figure crossed, and ask for another.

**Service unavailable (503)** → retry once with the same ids (both calls are safe to repeat), then
report a tool problem. Never turn it into "submitted" or "approved".

**Not found (404)** → that task or plan isn't in this workspace. Go back to the list call for a
valid id; don't tell the customer it was deleted.
