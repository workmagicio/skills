# Alert (Heartbeat) — deliberately not a board

Read this before building anything for an alert request.

An alert fires on a **threshold at a moment**. A board reviews a **period**. They are not
the same object, and building a board per alert produces a pile of near-identical pages
nobody maintains and nobody opens.

## So what does an alert produce?

`templates/heartbeat-alert.md` — one-line summary plus links. That template already owns
the format, the emoji semantics, and the three links. Nothing here overrides it.

## The board's role in an alert

The alert **links to** the account's board; it does not create one.

- The account already has a board → link to it. That is the "Open dashboard" link in the
  alert template.
- The account has no board → offer to build one **once**, at the cadence the user actually
  reviews on (usually weekly, `board-weekly.md`), and then have every future alert link to
  that same board.

## What not to do

- Do not build a board scoped to the alert's single metric — the user clicking through
  wants context, which is the whole board.
- Do not build a new board each time an alert fires.
- Do not dump the board's Part 3 verdict text into the alert message. The alert is one
  line; the reasoning lives one click away.
- Do not point "Diagnose this drop" at the board — that link belongs to
  `attribution-anomaly-diagnosis`, which is a different question ("why") from the board's
  ("what happened").
