# Instantiating the board for an account

`templates/board.tsx` is account- and cadence-independent everywhere except the places
below. Make these edits, in this order, then run the self-review at the bottom. Everything
else in the file — the bridge, the settled-window walk, the verdict engine, the funnel, the
action rules — is portable as-is and should not be rewritten.

## Edit 0 · §0b — `PERIOD`, the cadence

The skeleton ships configured for **weekly**, the one cadence whose numbers are verified
against a real account. For any other cadence, copy the `PERIOD` block out of that cadence's
spec (`board-daily.md` / `board-monthly.md` / `board-quarterly.md`).

`PERIOD` is now the whole switch — window length, comparison-window length
(`baselineDays`), rolling vs calendar alignment (`align` / `unit`) and bucket count are all
config, and the skeleton handles length-normalisation and calendar to-date on its own. What
`PERIOD` does **not** carry, and what you must still take from the cadence spec by hand:
dead bands, KPI additions, and what Part 5 is allowed to recommend. None of those are
derivable from `PERIOD.days`.

Two things that are **not** cadence-dependent and must not be re-tuned: the settling
reference (`SETTLE_REF_DAYS`, a trailing week at every cadence) and the material-spend share
(already a share of the period's own spend). See `board-spine.md`.

An alert / Heartbeat request is **not a board** — read `board-alert.md` before building
anything.

## Edit 1 · §0 — `ACCOUNT`

```js
const ACCOUNT = "Acme Co";   // ← the real account name
```

It appears in the header line, the provenance footer, and the `account_label` sent with
every query. Nothing else in §0 needs to change for a normal account.

## Edit 2 · §5 — the seed (the one that is not optional)

> 🛑 **Replace every seed value with numbers you probed from THIS account.**

The shipped seed is synthetic by construction — round baselines ($40k/day at 3.00x), generic
channel names, a fixed date range in the past. That is deliberate: it renders a complete,
readable page before live data lands, and it cannot be mistaken for a real account.

Two failure modes it exists to prevent, both of which are shipped defects:

- **Leaking another account's data.** A seed copied from an existing board carries that
  account's real revenue. Whenever the bridge is inert — preview, static share, a viewer
  without tool access — the page renders those figures as if they belonged to this account.
- **Fabricated entities.** A channel or sales platform in the seed that the account does not
  have will be shown to the user, and will leak into what you say about their data.

Keep the column names and row shape exactly as they are; only the values change. The four
seeds map 1:1 to the board queries: `SEED_MODEL` ← `02-default-model.sql`, `SEED_ADS` ←
`03-ads-channel-daily.sql`, `SEED_PLAT` ← `04-sales-platform-daily.sql`, `SEED_AD_CUR` /
`SEED_AD_PRI` ← `05-ads-ad-level.sql` run over the two windows. (`01-weekly-metrics.sql` is
the *snapshot* test-run query, not a board query.)

## Edit 3 · §7 — `PLAT_LABEL`

Add the account's real `sales_platform` values with the display names their team uses.
Unlisted values still render (underscores become spaces), so this is polish, not plumbing —
but a marketplace shown under its raw warehouse key looks broken to the customer.

## Edit 4 · §0 — `MATERIAL_SPEND_ABS`, only if needed

Leave it at `0`. The material-spend floor is `max(MATERIAL_SPEND_ABS, weekly_spend × 1%)`,
and the share term already scales to the account. A non-zero absolute floor inherited from a
larger account silently empties Parts 3 and 5 on any account whose 1% sits below it — the
page looks fine and simply never has anything to say. Raise it only after seeing Part 5
produce noise on this specific account.

The same reasoning applies to the other bands (`TREND_BAND`, `ROAS_FLAT_BAND`,
`SPEND_FLAT_BAND`, `SETTLING_RATIO`): they are ratios, not amounts, so they port. Do not
convert any of them to absolute dollars.

## What ports without any edit

- All four board queries. They carry no account identifier — the query tool injects tenant
  isolation — so the SQL is identical across accounts *and* across cadences; only the window
  arguments differ.
- The attribution model, resolved live from the tenant default view.
- The settled-window walk: it reads the shape of the account's own data rather than assuming
  a fixed reporting lag.
- Per-part `<Guard>` error boundaries, so an account missing one data source loses one part
  rather than the page.
- Sales-platform discovery: the top platforms are taken from whatever the account actually
  returns, with the remainder grouped as "other".

## Self-review before handing over

1. Re-run one query and diff it against what the page renders. A page still showing seed
   numbers while the query succeeds means the mapping is wrong.
2. The status strip reads **Live data**, not Sample data.
2b. Read the status strip's warnings before quoting any number: a "partially settled" flag
   means the period's revenue and ROAS are understated, and a "history starts" flag means the
   prior-period comparison is incomplete.
3. The headline window is recent — if the board's latest week is weeks old while the
   warehouse runs to yesterday, it is still on seed.
4. Store-actual revenue exceeds ads-attributed revenue. If it does not, the scope labels are
   probably crossed.
5. Every number carries scope + model. No bare figures, no model-only labels.
6. Part 5 either lists qualifying channels or explicitly says there is no data-backed action.
   It never contains a recommendation you reasoned your way to.
