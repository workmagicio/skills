import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════════════
   WEEKLY BUSINESS REVIEW — board skeleton (WorkMagic live artifact)
   ────────────────────────────────────────────────────────────────────────
   Copy this file, then do the four things in `references/instantiation.md`.
   Nothing else in here needs rewriting — the plumbing, the settled-window
   logic, the verdict engine and the five parts are account-independent.

   MUST DO before saving (in order):
     1. §0  set ACCOUNT to the real account name.
     2. §5  REPLACE the synthetic seed with values you actually probed.
            The seed shipped here is fake by construction (round baselines,
            generic labels) so it can never be mistaken for a real account —
            and so it can never leak one account's numbers into another's.
     3. §7  drop / add sales-platform display labels for this account.
     4. §0  leave MATERIAL_SPEND_ABS at 0 unless Part 5 is noisy (see below).

   Structure — five parts, one decision each:
     Part 1  headline numbers      store-actual total vs ads-attributed
     Part 2  trends                ads spend/revenue/ROAS + revenue by platform
     Part 3  efficiency verdict    what actually moved, and whether it matters
     Part 4  ad channel funnel     channel → tactic, collapsible
     Part 5  actions               only what the data supports; never invented

   MEASUREMENT IDENTITY, everywhere a number appears:
     SCOPE first, then MODEL  →  "All sales platforms · <model label>"
   Store-actual revenue is kept visibly distinct from ads-attributed revenue.
   The attribution model is resolved LIVE from the tenant default, never
   hardcoded.

   Render contract (do not weaken any of these):
     - seed-first: the page renders complete with zero live data, so it is
       readable in preview, in a static share, and anywhere the bridge is inert
     - no throw at module scope; window.agents access is guarded everywhere
     - every part is wrapped in <Guard> — one broken part never blanks the page
     - windows are anchored to the DATA, not the clock (§15 `win`)
     - all ratios are ratio-of-sums, computed client-side
     - live-vs-sample state is always visible in the status strip
   ════════════════════════════════════════════════════════════════════════ */

/* ── 0. constants ─────────────────────────────────────────────────────── */
const ACCOUNT = "Acme Co";                  /* ← REPLACE: real account name */
const TOOL = "wm_database-query-run";
/* Same tool, different prefixes per host: Justin exposes WorkMagic tools as
   `wm_*`, other MCP clients expose them unprefixed. Try in order. */
const TOOL_ALT = ["database-query-run"];
const MODEL_FALLBACK = "incrementality_adjusted";
const MODEL_LABELS = {
  incrementality_adjusted: "Incrementality adjusted attribution",
  data_driven: "Data-driven attribution",
  last_paid_click: "Last paid click",
  last_click: "Last click",
};
const SCOPE_LABEL = "All sales platforms";

const CHART_H = 230;
const TREND_BAND = 0.08;        // ±8% ROAS WoW → Stable
const ROAS_FLAT_BAND = 0.03;
const SPEND_FLAT_BAND = 0.03;
const WATCH_ROAS_DROP = 0.05;
const MATERIAL_SPEND_SHARE = 0.01;   // 1% of the week's paid spend
/* Absolute floor, in dollars, OR-ed with the share floor. Keep it at 0:
   the share floor already scales to the account. A non-zero absolute floor
   silently empties Parts 3 and 5 on any account whose weekly spend is small
   enough that 1% sits below it. Raise it only if Part 5 is actually noisy. */
const MATERIAL_SPEND_ABS = 0;
const SETTLING_RATIO = 0.6;     // day < 60% of prior-7 median revenue → trim it
/* Advisory threshold, NOT a trim threshold. Spend lands immediately; attribution lands
   6–24h later. So a trailing day can sit at ~90% of median revenue — comfortably clearing
   SETTLING_RATIO — while its ROAS is far below the trailing median, because its spend is
   fully in and its attribution is not. Verified on real data: a trailing day at 89.7% of
   median revenue but only 70.2% of median ROAS, on 128.6% of median spend.
   🔴 We FLAG that day, we do not trim it. Trimming on a ROAS signal would silently hide a
   day when efficiency genuinely collapsed — the single thing this board must never do. */
const SETTLING_ROAS_RATIO = 0.8;
const SETTLING_MIN_SPEND_RATIO = 0.5;   // below this, the day is too small to judge by ROAS

/* ── 0b. PERIOD — which cadence this board reports on ────────────────────
   Everything below this block is cadence-independent. Only these values change
   between a daily / weekly / monthly / quarterly board, and each cadence has its
   own spec in references/board-<cadence>.md. Set this ONCE at instantiation.

     days      length of the reporting window, in days
     buckets   how many periods the trend charts show
     baseline  "prior"    compare against the immediately preceding period
               "trailing" compare against a trailing-N median — use for DAILY,
                          where one prior day is too noisy to read as a signal
     noun / labels   the prose the page renders; a monthly board that says
                     "this week" is a defect, so these travel with `days`

   Calendar-aligned cadences (monthly / quarterly) additionally need the alignment
   rule in references/board-monthly.md: a calendar period is reportable only once
   its last day has settled — otherwise label it explicitly as period-to-date
   rather than silently comparing a partial period against a full one. */
const PERIOD = {
  key: "weekly",
  days: 7,
  buckets: 8,
  baseline: "prior",
  noun: "week",
  unitPlural: "buckets",
  adjective: "Weekly",
  priorLabel: "prior 7 days",
  priorShort: "prior 7d",
};
const BUCKET_CHOICES = [6, 8, 12];
/* Trailing-day reference for deciding whether the tail is still ingesting. Stays
   a trailing week for EVERY cadence — ingestion lag is a daily phenomenon, so the
   settling reference does not scale with what the board reports. */
const SETTLE_REF_DAYS = 8;
/* Lower bound for the settling walk: keep enough days to still compute the
   reference median. It is SETTLE_REF_DAYS and NOT anything derived from
   PERIOD.days — tying it to the period length skips trimming entirely whenever
   the account has less history than one period, which silently puts a
   still-ingesting day at the end of the window (caught on a quarterly probe). */
const SETTLE_MIN_DAYS = SETTLE_REF_DAYS;
const BOARD_TITLE = PERIOD.adjective + " Business Review";

/* ── 1. date helpers ──────────────────────────────────────────────────── */
const pad2 = (n) => String(n).padStart(2, "0");
function isoOf(d) {
  return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate());
}
function addDays(s, n) {
  const d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(s) {
  if (!s) return "—";
  const p = String(s).slice(0, 10).split("-");
  if (p.length < 3) return String(s);
  return MON[Number(p[1]) - 1] + " " + Number(p[2]);
}
const TODAY = (() => {
  try { return isoOf(new Date()); } catch (e) { return "2026-08-26"; }
})();
const CTX = (() => {
  try { return new Date().toISOString(); } catch (e) { return "2026-08-26T23:40:00.000Z"; }
})();

/* ── 2. formatters (self-contained; host fmt only as an optional assist) ── */
const HFMT = (() => {
  try {
    const a = typeof window !== "undefined" ? window.agents : null;
    return a && a.fmt ? a.fmt : null;
  } catch (e) { return null; }
})();

function num(v) {                       // → number | null
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
const num0 = (v) => { const n = num(v); return n === null ? 0 : n; };

function usd(v) {
  const n = num(v);
  if (n === null) return "—";
  if (HFMT && typeof HFMT.usd === "function") { try { return HFMT.usd(n); } catch (e) {} }
  return "$" + Math.round(n).toLocaleString("en-US");
}
function moneyC(v) {                    // compact — $1.49M / $815.6k
  const n = num(v);
  if (n === null) return "—";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(1) + "k";
  return s + "$" + a.toFixed(0);
}
function intf(v) {
  const n = num(v);
  return n === null ? "—" : Math.round(n).toLocaleString("en-US");
}
function pctf(v, d) {                   // ratio → "2.1%"
  const n = num(v);
  return n === null ? "—" : (n * 100).toFixed(d === undefined ? 2 : d) + "%";
}
function signPct(v) {
  const n = num(v);
  if (n === null) return "—";
  return (n > 0 ? "+" : n < 0 ? "\u2212" : "") + (Math.abs(n) * 100).toFixed(1) + "%";
}
function roasf(v) {
  const n = num(v);
  return n === null ? "—" : n.toFixed(2) + "x";
}
function money2(v) {
  const n = num(v);
  return n === null ? "—" : "$" + n.toFixed(2);
}
function ratioOfSums(a, b) {            // ratios are ALWAYS ratio-of-sums
  const x = num(a), y = num(b);
  if (x === null || y === null || y === 0) return null;
  return x / y;
}
function delta(cur, pri) {
  const c = num(cur), p = num(pri);
  if (c === null || p === null || p === 0) return null;
  return c / p - 1;
}
function median(arr) {
  const a = arr.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/* ── 3. result adapter — warehouse returns { meta, data: [[…]] } ─────── */
function toRows(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  const cols = ((result.meta && result.meta.schema) || []).map((c) => c && c.name);
  const data = result.data;
  if (!Array.isArray(data)) return [];
  if (!data.length) return [];
  if (!Array.isArray(data[0])) return data;
  return data.map((r) => {
    const o = {};
    for (let i = 0; i < cols.length; i++) o[cols[i]] = r[i];
    return o;
  });
}
const dayOf = (v) => String(v || "").slice(0, 10);

/* ── 4. guarded bridge ───────────────────────────────────────────────── */
function hostQuery(sql, noCache) {
  let A = null;
  try { A = typeof window !== "undefined" ? window.agents : null; } catch (e) { A = null; }
  if (!A || typeof A.query !== "function") {
    const err = new Error("Live data bridge unavailable");
    err.status = "inert";
    return Promise.reject(err);
  }
  const input = { sql: sql, ctx: CTX, account_label: ACCOUNT };
  if (noCache) input._noCache = true;
  const names = [TOOL].concat(TOOL_ALT);
  let i = 0;
  const go = () =>
    A.query(names[i], input).catch((e) => {
      const m = String((e && (e.message || e.error)) || e || "");
      if (i < names.length - 1 && /not\s*found|unknown tool|no such tool|unavailable/i.test(m)) {
        i += 1;
        return go();
      }
      throw e;
    });
  return go();
}

function useHostQuery(sql, seed, enabled) {
  const [st, setSt] = useState({ data: seed, live: false, loading: false, error: null, denied: false });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!enabled || !sql) return undefined;
    let dead = false;
    setSt((s) => ({ ...s, loading: true }));
    hostQuery(sql, nonce > 0)
      .then((res) => {
        if (dead) return;
        setSt({ data: res, live: true, loading: false, error: null, denied: false });
      })
      .catch((err) => {
        if (dead) return;
        const denied = !!(err && err.status === "denied");
        setSt((s) => ({
          ...s,
          loading: false,
          denied: denied,
          error: denied
            ? "Tool not allowed" + (err && err.connectorKey ? " (" + err.connectorKey + ")" : "")
            : String((err && err.message) || err || "unavailable"),
        }));
      });
    return () => { dead = true; };
  }, [sql, enabled, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return [st, refresh];
}

function readTheme() {
  try {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch (e) {}
  return "light";
}
function useHostTheme() {
  const [mode, setMode] = useState(readTheme);
  useEffect(() => {
    const h = () => setMode(readTheme());
    let off = null, mq = null, mo = null;
    try {
      const A = typeof window !== "undefined" ? window.agents : null;
      if (A && typeof A.onThemeChange === "function") off = A.onThemeChange(h);
    } catch (e) {}
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", h);
    } catch (e) { mq = null; }
    try {
      mo = new MutationObserver(h);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    } catch (e) { mo = null; }
    return () => {
      try { if (typeof off === "function") off(); } catch (e) {}
      try { if (mq && mq.removeEventListener) mq.removeEventListener("change", h); } catch (e) {}
      try { if (mo) mo.disconnect(); } catch (e) {}
    };
  }, []);
  return mode;
}

function useWidth(fallback) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback || 880);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(Math.max(320, el.clientWidth || fallback || 880));
    set();
    let ro = null;
    try {
      ro = new ResizeObserver(set);
      ro.observe(el);
    } catch (e) {
      ro = null;
      window.addEventListener("resize", set);
    }
    return () => {
      if (ro) { try { ro.disconnect(); } catch (e) {} }
      else window.removeEventListener("resize", set);
    };
  }, [fallback]);
  return [ref, w];
}

/* ── 5. SEED — SYNTHETIC PLACEHOLDER, REPLACE AT INSTANTIATION ────────
   Deterministic and deliberately fake: round baselines, generic labels, a
   fixed date range in the past. It exists so the page renders complete and
   readable before any live data lands — NOT to look like a real account.

   🔴 Replace every value below with numbers you probed from THIS account,
   keeping the column names and row shape identical. Two reasons, both hard:
     - a seed carrying another account's real figures is a data leak the
       moment the bridge is inert, and the page will show it as if it were
       this account's;
     - an invented channel or platform in the seed leaks into what you say
       about their data.
   ───────────────────────────────────────────────────────────────────────── */
function seedResult(cols, rows) {
  return { meta: { schema: cols.map((c) => ({ name: c })) }, data: rows };
}

const SEED_END = "2026-03-05";   // fixed, in the past — makes "sample" obvious
const SEED_DAYS = 64;
/* Tiny LCG — deterministic wobble, never Math.random() (a per-render value
   would change `input` by value and trigger an infinite refetch loop). */
function seedRand(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
}
const SEED_SERIES = (() => {
  const rnd = seedRand(20260305);
  const days = [];
  for (let i = SEED_DAYS - 1; i >= 0; i--) {
    const d = addDays(SEED_END, -i);
    const wob = 0.9 + rnd() * 0.2;              // ±10%
    const spend = 40000 * wob;                  // round baseline: $40k/day
    const roas = 3 * (0.94 + rnd() * 0.12);     // round baseline: 3.00x
    const partial = i === 0 ? 0.3 : 1;          // last day still ingesting
    days.push({
      d: d,
      spend: spend * partial,
      sales: spend * roas * partial,
      store: spend * roas * 1.9 * partial,      // store-actual > ads-attributed
    });
  }
  return days;
})();
const SEED_PLAT_SPLIT = [["shopify", 0.62], ["amazon", 0.24], ["tiktok", 0.14]];
const f2 = (n) => n.toFixed(2);

const SEED_MODEL = seedResult(["default_attr_model"], [[MODEL_FALLBACK]]);
const SEED_ADS = seedResult(
  ["src_channel", "event_date", "ad_spend", "attr_all_sales", "attr_all_orders"],
  SEED_SERIES.map((x) => ["ads", x.d + "T00:00:00.000", f2(x.spend), f2(x.sales), "0"])
);
const SEED_PLAT = seedResult(
  ["sales_platform", "event_date", "order_total_sales", "order_total_orders"],
  SEED_SERIES.reduce((acc, x) => {
    SEED_PLAT_SPLIT.forEach((p) => {
      acc.push([p[0], x.d + "T00:00:00.000", f2(x.store * p[1]), "0"]);
    });
    return acc;
  }, [])
);

const AD_COLS = ["ads_platform", "tactic_name", "impressions", "clicks", "ad_spend", "ads_conversions",
  "attr_all_orders", "attr_all_sales", "attr_new_customer_all_orders", "attr_new_customer_all_sales"];
/* Generic channels / tactics. Replace with the account's real ones — the
   funnel table and the action cards name these strings on screen. */
const SEED_AD_ROWS = [
  ["Meta", "Prospecting", 8000000, 160000, 120000, 3000, 2400, 336000, 1700, 235000],
  ["Meta", "Retargeting", 1200000, 30000, 24000, 900, 800, 84000, 200, 21000],
  ["Google", "Non-Brand Shopping", 5000000, 20000, 60000, 800, 1200, 174000, 700, 101000],
  ["Google", "Brand Search", 40000, 12000, 6000, 2500, 1400, 60000, 300, 12000],
  ["TikTok", "Prospecting", 3000000, 40000, 30000, 700, 600, 78000, 400, 50000],
  ["Pinterest", "", 2000000, 20000, 12000, 400, 300, 30000, 200, 19000],
];
const SEED_AD_CUR = seedResult(AD_COLS, SEED_AD_ROWS);
/* Prior week = same rows at a different spend level, so week-over-week ROAS
   moves by (multiplier - 1). Chosen so the sample render exercises all three
   Part 5 branches: rows that got worse (cut), rows that got better (scale),
   and a row inside the +/-8% dead band that is correctly left out. */
const SEED_AD_PRI_SPEND = [0.86, 1.15, 0.88, 1.0, 1.18, 1.1];
const SEED_AD_PRI = seedResult(
  AD_COLS,
  SEED_AD_ROWS.map((r, i) =>
    r.map((v, j) => (j === 4 ? v * SEED_AD_PRI_SPEND[i] : v))
  )
);

/* ── 6. SQL builders ─────────────────────────────────────────────────── */
const SQL_MODEL =
  "SELECT default_attr_model FROM dws_view_copilot_default_attr_model_latest LIMIT 1";
const sqlPlat = (a, b) =>
  "SELECT sales_platform, event_date, SUM(order_total_sales) AS order_total_sales, " +
  "SUM(order_total_orders) AS order_total_orders FROM dws_view_copilot_sales_channel_daily_latest " +
  "WHERE event_date >= '" + a + "' AND event_date < '" + b + "' GROUP BY 1, 2";
const sqlAds = (m, a, b) =>
  "SELECT src_channel, event_date, SUM(ad_spend) AS ad_spend, SUM(attr_all_sales) AS attr_all_sales, " +
  "SUM(attr_all_orders) AS attr_all_orders FROM dws_view_copilot_attr_channel_level_daily_latest " +
  "WHERE attr_model_name = '" + m + "' AND src_channel = 'ads' AND event_date >= '" + a +
  "' AND event_date < '" + b + "' GROUP BY 1, 2";
const sqlAdLevel = (m, a, b) =>
  "SELECT ads_platform, tactic_name, SUM(impressions) AS impressions, SUM(clicks) AS clicks, " +
  "SUM(ad_spend) AS ad_spend, SUM(ads_conversions) AS ads_conversions, SUM(attr_all_orders) AS attr_all_orders, " +
  "SUM(attr_all_sales) AS attr_all_sales, SUM(attr_new_customer_all_orders) AS attr_new_customer_all_orders, " +
  "SUM(attr_new_customer_all_sales) AS attr_new_customer_all_sales " +
  "FROM dws_view_copilot_attr_ads_ad_level_daily_latest WHERE attr_model_name = '" + m +
  "' AND event_date >= '" + a + "' AND event_date < '" + addDays(b, 1) + "' GROUP BY 1, 2";

/* ── 7. labels ───────────────────────────────────────────────────────── */
/* Display labels for the `sales_platform` values this account actually has.
   Anything not listed falls through to platLabel()'s underscore-to-space form,
   so an unknown platform still renders — add a label only to prettify it. */
const PLAT_LABEL = {
  shopify: "Shopify", amazon: "Amazon", tiktok: "TikTok Shop",
};
const platLabel = (p) => PLAT_LABEL[p] || (p ? String(p).replace(/_/g, " ") : "Other");
const tacticLabel = (t) => {
  const s = t === null || t === undefined ? "" : String(t).trim();
  return s === "" || s === "-1" ? "All activity" : s;
};
const entityLabel = (p, t) => (t === "All activity" ? p : p + " · " + t);

/* ── 8. Part 3 — efficiency-verdict engine ───────────────────────────── */
function tacticRollup(result) {
  const out = new Map();
  toRows(result).forEach((r) => {
    const platform = String(r.ads_platform === null || r.ads_platform === undefined ? "—" : r.ads_platform).trim() || "—";
    const tactic = tacticLabel(r.tactic_name);
    const key = entityLabel(platform, tactic);
    const spend = num0(r.ad_spend), sales = num0(r.attr_all_sales), imp = num0(r.impressions);
    if (spend === 0 && sales === 0 && imp === 0) return;
    const prev = out.get(key) || { key: key, platform: platform, tactic: tactic, spend: 0, sales: 0 };
    prev.spend += spend;
    prev.sales += sales;
    out.set(key, prev);
  });
  return out;
}

function buildMovement(cur, pri, tacCurResult, tacPriResult) {
  const spendDelta = delta(cur.spend, pri.spend);
  const salesDelta = delta(cur.sales, pri.sales);
  const roasCur = ratioOfSums(cur.sales, cur.spend);
  const roasPri = ratioOfSums(pri.sales, pri.spend);
  const roasDelta = delta(roasCur, roasPri);

  const effUp = roasDelta !== null && roasDelta > ROAS_FLAT_BAND;
  const effDown = roasDelta !== null && roasDelta < -ROAS_FLAT_BAND;
  const spendDown = spendDelta !== null && spendDelta < -SPEND_FLAT_BAND;
  const spendUp = spendDelta !== null && spendDelta > SPEND_FLAT_BAND;
  const dn = (r) => (r === null || r === undefined ? "—" : (Math.abs(r) * 100).toFixed(1) + "%");

  let mode, tone, headline;
  if (roasDelta === null || roasCur === null) {
    mode = "no-read"; tone = "neutral";
    headline = "Not enough settled data to read this week's efficiency";
  } else if (effDown) {
    mode = spendUp ? "scaling-inefficiently" : "efficiency-problem";
    tone = "bad";
    headline = spendUp
      ? "Spend up " + dn(spendDelta) + ", efficiency down " + dn(roasDelta) + " to " + roasf(roasCur) +
        " — scaling into weaker returns"
      : "Efficiency down " + dn(roasDelta) + " to " + roasf(roasCur) +
        " — a genuine efficiency problem, not just a smaller week";
  } else if (effUp && spendDown) {
    mode = "deliberate-pullback"; tone = "good";
    headline = "Spend down " + dn(spendDelta) + ", efficiency up " + dn(roasDelta) + " — a deliberate pullback";
  } else if (effUp && spendUp) {
    mode = "scaling-efficiently"; tone = "good";
    headline = "Spend up " + dn(spendDelta) + " and efficiency up " + dn(roasDelta) + " — scaling efficiently";
  } else if (effUp) {
    mode = "efficiency-gain"; tone = "good";
    headline = "Efficiency up " + dn(roasDelta) + " to " + roasf(roasCur) + " on roughly flat spend";
  } else {
    mode = "steady"; tone = "steady";
    headline = spendDown || spendUp
      ? "Spend " + (spendUp ? "up " : "down ") + dn(spendDelta) + ", efficiency flat at " + roasf(roasCur) +
        " — a steady week"
      : "Steady week — spend and efficiency both flat at " + roasf(roasCur);
  }

  const curMap = tacticRollup(tacCurResult);
  const priMap = tacticRollup(tacPriResult);
  const materialFloor = Math.max(MATERIAL_SPEND_ABS, num0(cur.spend) * MATERIAL_SPEND_SHARE);

  let watch = null;
  curMap.forEach((c) => {
    const p = priMap.get(c.key);
    if (!p) return;
    if (c.spend < materialFloor) return;
    const rc = ratioOfSums(c.sales, c.spend);
    const rp = ratioOfSums(p.sales, p.spend);
    const rd = delta(rc, rp);
    if (rc === null || rp === null || rd === null) return;
    if (rd > -WATCH_ROAS_DROP) return;
    if (!watch || rd < watch.roasDelta) {
      watch = {
        key: c.key, platform: c.platform, tactic: c.tactic,
        spend: c.spend, priorSpend: p.spend,
        roasCur: rc, roasPri: rp, roasDelta: rd,
      };
    }
  });

  const revenueFellLess =
    spendDelta !== null && salesDelta !== null &&
    spendDelta < 0 && salesDelta < 0 && salesDelta > spendDelta;

  let body =
    "Ad spend " + moneyC(cur.spend) + " (" + signPct(spendDelta) + ") against " + moneyC(cur.sales) +
    " of ads-attributed revenue (" + signPct(salesDelta) + "), so paid ads returned " + roasf(roasCur) +
    " versus " + roasf(roasPri) + " the week before.";

  if (revenueFellLess) {
    body += " Revenue fell less than spend, so this is an efficiency gain from pulling back, not a demand problem.";
  } else if (mode === "scaling-efficiently") {
    body += " Revenue grew faster than spend, so the extra budget bought returns rather than just volume.";
  } else if (effDown) {
    body += " Revenue moved worse than spend did, so this is an efficiency loss rather than a scale effect.";
  }

  body += watch
    ? " The one genuine watch item is " + watch.key + ": " + roasf(watch.roasPri) + " \u2192 " +
      roasf(watch.roasCur) + " on " + moneyC(watch.spend) + " of spend."
    : " No channel or tactic at material spend lost efficiency this week.";

  return {
    mode, tone, headline, body, watch,
    spendDelta, salesDelta, roasCur, roasPri, roasDelta, materialFloor,
    curMap, priMap,
  };
}

/* ── 9. small shared UI ──────────────────────────────────────────────── */
const T = {
  text: "var(--text, #17181a)",
  muted: "var(--text-muted, #7a7d84)",
  border: "var(--border, #e3e4e8)",
  surface: "var(--bg-surface, #fbfbfc)",
  radius: "var(--radius, 14px)",
  good: "var(--status-good, #0f9d58)",
  warn: "var(--status-warning, #d99400)",
  crit: "var(--status-critical, #d0433b)",
  c1: "var(--cat-1, #2a78d6)",
  c2: "var(--cat-2, #eda100)",
  c3: "var(--cat-3, #1baf7a)",
  c4: "var(--cat-4, #e87ba4)",
  c5: "var(--cat-5, #4a3aa7)",
  grid: "var(--chart-grid, #e8e9ed)",
  axis: "var(--chart-axis, #c6c8ce)",
};

function Dot({ color, size }) {
  const s = size || 9;
  return (
    <span aria-hidden="true" style={{
      width: s, height: s, borderRadius: "50%", background: color,
      display: "inline-block", flex: "0 0 auto",
    }} />
  );
}

function Chip({ children, tone }) {
  const ink = tone === "warn" ? T.warn : tone === "crit" ? T.crit : tone === "good" ? T.good : T.muted;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5,
      color: T.muted, border: "1px solid " + T.border, borderRadius: 999,
      padding: "3px 10px", whiteSpace: "nowrap", background: T.surface,
    }}>
      <Dot color={ink} size={7} />
      {children}
    </span>
  );
}

function Section({ eyebrow, title, note, children, style }) {
  return (
    <section style={{ marginTop: 26, ...(style || {}) }}>
      {(eyebrow || title) && (
        <div style={{ marginBottom: 12 }}>
          {eyebrow && (
            <div style={{
              fontSize: 10.5, letterSpacing: ".09em", textTransform: "uppercase",
              color: T.muted, marginBottom: 4,
            }}>{eyebrow}</div>
          )}
          {title && (
            <h2 style={{
              margin: 0, fontSize: 16.5, fontWeight: 640, color: T.text, letterSpacing: "-.01em",
            }}>{title}</h2>
          )}
          {note && (
            <div style={{ marginTop: 4, fontSize: 12, color: T.muted }}>{note}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* per-part error boundary — a failure in one part must never blank the page */
class Guard extends React.Component {
  constructor(p) { super(p); this.state = { e: null }; }
  static getDerivedStateFromError(e) { return { e: e }; }
  render() {
    if (this.state.e) {
      return (
        <div style={{
          background: T.surface, border: "1px solid " + T.border, borderRadius: T.radius,
          padding: "14px 16px", fontSize: 12.5, color: T.warn, lineHeight: 1.5,
        }}>
          {this.props.name} could not render: {String((this.state.e && this.state.e.message) || this.state.e)}
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── 10. PART 1 — KPI cards ──────────────────────────────────────────── */
function KpiCard({ label, sub, value, dlt, polarity, foot }) {
  let ink = T.muted, arrow = "";
  if (dlt !== null && dlt !== undefined && Number.isFinite(dlt)) {
    const good = polarity === "neutral" ? null : (polarity === "down" ? dlt < 0 : dlt > 0);
    arrow = dlt > 0 ? "\u25B2" : dlt < 0 ? "\u25BC" : "";
    ink = good === null ? T.muted : good ? T.good : T.crit;
  }
  return (
    <div className="agents-card" style={{
      background: T.surface, border: "1px solid " + T.border, borderRadius: T.radius,
      padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0,
    }}>
      <div style={{ fontSize: 12, fontWeight: 560, color: T.text, letterSpacing: "-.005em" }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 2 }}>{sub}</div>}
      <div style={{
        fontSize: 27, fontWeight: 680, color: T.text, letterSpacing: "-.02em",
        fontVariantNumeric: "tabular-nums", lineHeight: 1.15, marginTop: 6,
      }}>{value}</div>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6, marginTop: 4,
        fontSize: 12.5, fontVariantNumeric: "tabular-nums",
      }}>
        <span style={{ color: ink, fontWeight: 620 }}>{arrow} {signPct(dlt)}</span>
        <span style={{ color: T.muted, fontSize: 11 }}>vs prior 7d</span>
      </div>
      {foot && (
        <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.45, color: T.muted }}>{foot}</div>
      )}
    </div>
  );
}

/* ── 11. PART 2 — charts ─────────────────────────────────────────────── */
function AxisText(props) {
  return <text {...props} style={{ fontSize: 10, fill: "var(--chart-ink-muted, #8a8d94)" }} />;
}

function AdsTrendChart({ buckets }) {
  const [ref, w] = useWidth(880);
  const [hover, setHover] = useState(null);
  const padL = 56, padR = 54, padT = 12, padB = 28;
  const innerW = Math.max(60, w - padL - padR);
  const innerH = CHART_H - padT - padB;
  const n = buckets.length || 1;
  const band = innerW / n;
  const barW = Math.max(4, Math.min(22, band * 0.26));
  const maxMoney = Math.max(1, ...buckets.map((x) => Math.max(x.sales, x.spend))) * 1.12;
  const maxRoas = Math.max(0.5, ...buckets.map((x) => x.roas || 0)) * 1.3;
  const yM = (v) => padT + innerH - (v / maxMoney) * innerH;
  const yR = (v) => padT + innerH - (v / maxRoas) * innerH;
  const cx = (i) => padL + band * i + band / 2;
  const line = buckets.map((x, i) => (i === 0 ? "M" : "L") + cx(i) + " " + yR(x.roas || 0)).join(" ");
  const h = hover !== null && buckets[hover] ? buckets[hover] : null;

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        gap: 12, flexWrap: "wrap", marginBottom: 6, minHeight: 20,
      }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: T.muted }}>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Dot color={T.c1} size={8} />Ads-attributed revenue
          </span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Dot color={T.c2} size={8} />Ad spend
          </span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Dot color={T.c3} size={8} />ROAS (right axis)
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          {h ? (
            <span>
              <b style={{ color: T.text }}>{h.label}</b>{"  "}rev {moneyC(h.sales)} · spend {moneyC(h.spend)} · ROAS {roasf(h.roas)}
            </span>
          ) : "Hover a week for detail"}
        </div>
      </div>
      <svg width="100%" height={CHART_H} viewBox={"0 0 " + w + " " + CHART_H} role="img"
        aria-label="Weekly ads-attributed revenue, ad spend and ROAS">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={padL + innerW} y1={padT + innerH * f} y2={padT + innerH * f}
              stroke={T.grid} strokeWidth="1" />
            <AxisText x={padL - 8} y={padT + innerH * f + 3} textAnchor="end">
              {moneyC(maxMoney * (1 - f))}
            </AxisText>
            <AxisText x={padL + innerW + 8} y={padT + innerH * f + 3} textAnchor="start">
              {(maxRoas * (1 - f)).toFixed(1) + "x"}
            </AxisText>
          </g>
        ))}
        {buckets.map((x, i) => (
          <g key={x.label}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={padL + band * i} y={padT} width={band} height={innerH}
              fill={hover === i ? "var(--chart-plane, rgba(125,130,140,.09))" : "transparent"} />
            <rect x={cx(i) - barW - 2} y={yM(x.sales)} width={barW}
              height={Math.max(1, padT + innerH - yM(x.sales))} rx="3" fill={T.c1} />
            <rect x={cx(i) + 2} y={yM(x.spend)} width={barW}
              height={Math.max(1, padT + innerH - yM(x.spend))} rx="3" fill={T.c2} />
            <AxisText x={cx(i)} y={CHART_H - 9} textAnchor="middle">{x.label}</AxisText>
          </g>
        ))}
        <path d={line} fill="none" stroke={T.c3} strokeWidth="2" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" />
        {buckets.map((x, i) => (
          <circle key={"p" + x.label} cx={cx(i)} cy={yR(x.roas || 0)} r={hover === i ? 5 : 3.6}
            fill={T.c3} stroke="var(--bg-surface, #fff)" strokeWidth="2" />
        ))}
        <line x1={padL + innerW} x2={padL + innerW} y1={padT} y2={padT + innerH}
          stroke={T.axis} strokeWidth="1" />
      </svg>
    </div>
  );
}

function PlatformStackChart({ buckets, platforms }) {
  const [ref, w] = useWidth(880);
  const [hover, setHover] = useState(null);
  const padL = 56, padR = 12, padT = 12, padB = 28;
  const innerW = Math.max(60, w - padL - padR);
  const innerH = CHART_H - padT - padB;
  const n = buckets.length || 1;
  const band = innerW / n;
  const barW = Math.max(6, Math.min(46, band * 0.52));
  const colors = [T.c1, T.c2, T.c3, T.c4, T.c5];
  const maxV = Math.max(1, ...buckets.map((x) => x.total)) * 1.12;
  const y = (v) => padT + innerH - (v / maxV) * innerH;
  const cx = (i) => padL + band * i + band / 2;
  const h = hover !== null && buckets[hover] ? buckets[hover] : null;

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        gap: 12, flexWrap: "wrap", marginBottom: 6, minHeight: 20,
      }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: T.muted }}>
          {platforms.map((p, i) => (
            <span key={p} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Dot color={colors[i % colors.length]} size={8} />{platLabel(p)}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          {h ? (
            <span>
              <b style={{ color: T.text }}>{h.label}</b>{"  "}
              {platforms.map((p) => platLabel(p) + " " + moneyC(h.by[p] || 0)).join(" · ")}
              {" · total " + moneyC(h.total)}
            </span>
          ) : "Store-actual — hover a week for the split"}
        </div>
      </div>
      <svg width="100%" height={CHART_H} viewBox={"0 0 " + w + " " + CHART_H} role="img"
        aria-label="Weekly store-actual revenue by sales platform">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={padL + innerW} y1={padT + innerH * f} y2={padT + innerH * f}
              stroke={T.grid} strokeWidth="1" />
            <AxisText x={padL - 8} y={padT + innerH * f + 3} textAnchor="end">
              {moneyC(maxV * (1 - f))}
            </AxisText>
          </g>
        ))}
        {buckets.map((x, i) => {
          let acc = 0;
          return (
            <g key={x.label}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + band * i} y={padT} width={band} height={innerH}
                fill={hover === i ? "var(--chart-plane, rgba(125,130,140,.09))" : "transparent"} />
              {platforms.map((p, pi) => {
                const v = x.by[p] || 0;
                if (v <= 0) return null;
                const y1 = y(acc + v), y0 = y(acc);
                acc += v;
                return (
                  <rect key={p} x={cx(i) - barW / 2} y={y1} width={barW}
                    height={Math.max(1, y0 - y1 - 2)} rx="2"
                    fill={colors[pi % colors.length]} />
                );
              })}
              <AxisText x={cx(i)} y={CHART_H - 9} textAnchor="middle">{x.label}</AxisText>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── 12. PART 3 — presentation ───────────────────────────────────────── */
const TONE_INK = { good: T.good, bad: T.crit, steady: T.muted, neutral: T.muted };

function Part3Movement({ mv, curStart, curEnd }) {
  const ink = TONE_INK[mv.tone] || TONE_INK.neutral;
  const watchInk = mv.watch && mv.watch.roasDelta <= -0.2 ? T.crit : T.warn;
  return (
    <section key={mv.headline} style={{
      display: "grid", gridTemplateColumns: "minmax(0,1.85fr) minmax(240px,1fr)",
      gap: 18, alignItems: "stretch", background: T.surface,
      border: "1px solid " + T.border, borderRadius: T.radius, padding: "18px 20px",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
          color: T.muted, marginBottom: 8,
        }}>The thing that moved</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span aria-hidden="true" style={{
            width: 10, height: 10, borderRadius: "50%", background: ink,
            flex: "0 0 auto", marginTop: 7,
          }} />
          <h3 style={{
            margin: 0, fontSize: 19, lineHeight: 1.32, fontWeight: 650,
            color: T.text, letterSpacing: "-.01em",
          }}>{mv.headline}</h3>
        </div>
        <p style={{
          margin: "10px 0 0 20px", fontSize: 13.5, lineHeight: 1.6,
          color: T.muted, maxWidth: 660,
        }}>{mv.body}</p>
        <div style={{
          margin: "12px 0 0 20px", display: "flex", flexWrap: "wrap",
          gap: "6px 18px", fontSize: 12, color: T.muted,
        }}>
          <span>Spend <b style={{ color: T.text }}>{signPct(mv.spendDelta)}</b></span>
          <span>Ads revenue <b style={{ color: T.text }}>{signPct(mv.salesDelta)}</b></span>
          <span>ROAS <b style={{ color: ink }}>{roasf(mv.roasPri)} → {roasf(mv.roasCur)}</b></span>
          <span>{shortDate(curStart)} – {shortDate(curEnd)} vs prior 7 days</span>
        </div>
      </div>

      <aside style={{
        borderLeft: "1px solid " + T.border, paddingLeft: 18,
        display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0,
      }}>
        {mv.watch ? (
          <React.Fragment>
            <div style={{
              fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase",
              color: watchInk, fontWeight: 700, marginBottom: 8,
            }}>Watch — biggest efficiency drop</div>
            <div style={{
              fontSize: 14, fontWeight: 620, color: T.text, lineHeight: 1.35, wordBreak: "break-word",
            }}>{mv.watch.key}</div>
            <div style={{
              marginTop: 8, fontSize: 20, fontWeight: 700, color: watchInk,
              fontVariantNumeric: "tabular-nums",
            }}>{roasf(mv.watch.roasPri)} → {roasf(mv.watch.roasCur)}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: T.muted }}>
              ROAS {signPct(mv.watch.roasDelta)} on {usd(mv.watch.spend)} of spend
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.5, color: T.muted }}>
              Worst efficiency move among channels/tactics spending at least {usd(mv.materialFloor)} this
              week — the actionable number, not the largest revenue swing.
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{
              fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase",
              color: T.muted, fontWeight: 700, marginBottom: 8,
            }}>Watch — biggest efficiency drop</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Dot color={T.good} size={8} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>
                No efficiency red flags this week
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.5, color: T.muted }}>
              The revenue move tracks the deliberate spend change. No channel or tactic spending{" "}
              {usd(mv.materialFloor)} or more lost meaningful efficiency.
            </div>
          </React.Fragment>
        )}
      </aside>
    </section>
  );
}

/* ── 13. PART 4 — channel-first collapsible funnel table ─────────────── */
function trendOf(cur, pri) {
  if (!pri) return { kind: "new", d: null };
  const rc = ratioOfSums(cur.sales, cur.spend);
  const rp = ratioOfSums(pri.sales, pri.spend);
  const d = delta(rc, rp);
  if (d === null) return { kind: "new", d: null };
  if (d > TREND_BAND) return { kind: "up", d: d };
  if (d < -TREND_BAND) return { kind: "down", d: d };
  return { kind: "flat", d: d };
}
const TREND_META = {
  up: { g: "\u25B2", t: "Improving", c: T.good },
  flat: { g: "\u25CF", t: "Stable", c: T.muted },
  down: { g: "\u25BC", t: "Declining", c: T.crit },
  new: { g: "\u25C6", t: "New", c: T.c5 },
};
function TrendPill({ tr }) {
  const m = TREND_META[tr.kind] || TREND_META.flat;
  return (
    <span title={tr.d === null ? "No prior week" : "ROAS " + signPct(tr.d) + " WoW"} style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
      color: m.c, border: "1px solid " + T.border, borderRadius: 999,
      padding: "2px 8px", whiteSpace: "nowrap", fontWeight: 560,
    }}>
      <span aria-hidden="true">{m.g}</span>{m.t}
    </span>
  );
}

const NUMCELL = {
  padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap", borderBottom: "1px solid " + T.border,
};
const HEADCELL = {
  padding: "8px 10px", textAlign: "right", fontSize: 10.5, fontWeight: 600,
  color: "var(--text-muted, #7a7d84)", textTransform: "uppercase", letterSpacing: ".05em",
  whiteSpace: "nowrap", borderBottom: "1px solid " + T.border, position: "sticky", top: 0,
  background: T.surface,
};

function FunnelRow({ name, m, tr, depth, expandable, open, onToggle, strong }) {
  const roas = ratioOfSums(m.sales, m.spend);
  const cells = [
    intf(m.imp), intf(m.clicks), pctf(ratioOfSums(m.clicks, m.imp), 2),
    money2(ratioOfSums(m.spend, m.clicks)),
    money2(m.imp ? (m.spend / m.imp) * 1000 : null),
    usd(m.spend), intf(m.conv), intf(m.orders), usd(m.sales),
    roasf(roas), intf(m.ncOrders), roasf(ratioOfSums(m.ncSales, m.spend)),
  ];
  return (
    <tr style={{ background: strong ? "var(--chart-plane, rgba(125,130,140,.06))" : "transparent" }}>
      <th scope="row" style={{
        padding: "7px 10px", textAlign: "left", fontWeight: strong ? 660 : depth ? 440 : 560,
        color: T.text, whiteSpace: "nowrap", borderBottom: "1px solid " + T.border,
        position: "sticky", left: 0, background: strong
          ? "var(--bg-surface, #fbfbfc)" : "var(--bg-surface, #fbfbfc)",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, paddingLeft: depth * 18 }}>
          {expandable ? (
            <button type="button" onClick={onToggle} aria-expanded={open}
              aria-label={(open ? "Collapse " : "Expand ") + name}
              style={{
                width: 17, height: 17, lineHeight: "15px", textAlign: "center", padding: 0,
                fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.muted,
                background: "transparent", border: "1px solid " + T.border, borderRadius: 4,
              }}>{open ? "\u2212" : "+"}</button>
          ) : (
            <span aria-hidden="true" style={{ width: depth ? 0 : 17, display: "inline-block" }} />
          )}
          <span>{name}</span>
        </span>
      </th>
      {cells.map((c, i) => (
        <td key={i} style={{ ...NUMCELL, color: i === 9 ? T.text : T.muted, fontWeight: i === 9 ? 620 : 400 }}>{c}</td>
      ))}
      <td style={{ ...NUMCELL, textAlign: "left" }}>{tr ? <TrendPill tr={tr} /> : null}</td>
    </tr>
  );
}

function emptyM() {
  return { imp: 0, clicks: 0, spend: 0, conv: 0, orders: 0, sales: 0, ncOrders: 0, ncSales: 0 };
}
function addM(a, r) {
  a.imp += num0(r.impressions); a.clicks += num0(r.clicks); a.spend += num0(r.ad_spend);
  a.conv += num0(r.ads_conversions); a.orders += num0(r.attr_all_orders);
  a.sales += num0(r.attr_all_sales); a.ncOrders += num0(r.attr_new_customer_all_orders);
  a.ncSales += num0(r.attr_new_customer_all_sales);
  return a;
}
function rollupFunnel(result) {
  const ch = new Map(), tac = new Map();
  toRows(result).forEach((r) => {
    const p = String(r.ads_platform === null || r.ads_platform === undefined ? "—" : r.ads_platform).trim() || "—";
    const t = tacticLabel(r.tactic_name);
    if (num0(r.ad_spend) === 0 && num0(r.attr_all_sales) === 0 && num0(r.impressions) === 0) return;
    if (!ch.has(p)) ch.set(p, emptyM());
    addM(ch.get(p), r);
    const k = p + "\u0000" + t;
    if (!tac.has(k)) tac.set(k, { platform: p, tactic: t, m: emptyM() });
    addM(tac.get(k).m, r);
  });
  return { ch: ch, tac: tac };
}

function Part4Table({ cur, pri }) {
  const [open, setOpen] = useState({});
  const channels = useMemo(() => {
    const list = [];
    cur.ch.forEach((m, p) => list.push({ p: p, m: m }));
    list.sort((a, b) => b.m.spend - a.m.spend || b.m.sales - a.m.sales);
    return list;
  }, [cur]);
  const tacticsOf = useCallback((p) => {
    const out = [];
    cur.tac.forEach((v, k) => { if (v.platform === p) out.push({ k: k, ...v }); });
    out.sort((a, b) => b.m.spend - a.m.spend || b.m.sales - a.m.sales);
    return out;
  }, [cur]);
  const total = useMemo(() => {
    const t = emptyM();
    cur.ch.forEach((m) => {
      t.imp += m.imp; t.clicks += m.clicks; t.spend += m.spend; t.conv += m.conv;
      t.orders += m.orders; t.sales += m.sales; t.ncOrders += m.ncOrders; t.ncSales += m.ncSales;
    });
    return t;
  }, [cur]);
  const totalPri = useMemo(() => {
    const t = emptyM();
    pri.ch.forEach((m) => {
      t.imp += m.imp; t.clicks += m.clicks; t.spend += m.spend; t.conv += m.conv;
      t.orders += m.orders; t.sales += m.sales; t.ncOrders += m.ncOrders; t.ncSales += m.ncSales;
    });
    return t;
  }, [pri]);

  const HEADS = ["Impressions", "Clicks", "CTR", "CPC", "CPM", "Ad spend", "Conversions",
    "Attributed orders", "Attributed revenue", "ROAS", "NC orders", "NC ROAS"];

  return (
    <div style={{
      border: "1px solid " + T.border, borderRadius: T.radius, overflow: "hidden", background: T.surface,
    }}>
      <div style={{ overflowX: "auto", maxHeight: 620 }}>
        <table style={{
          width: "100%", borderCollapse: "collapse", fontSize: 12, color: T.text, minWidth: 1180,
        }}>
          <thead>
            <tr>
              <th style={{ ...HEADCELL, textAlign: "left", left: 0, zIndex: 2 }}>Ad channel</th>
              {HEADS.map((h) => <th key={h} style={HEADCELL}>{h}</th>)}
              <th style={{ ...HEADCELL, textAlign: "left" }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(({ p, m }) => {
              const tl = tacticsOf(p);
              const expandable = tl.length > 1;
              const isOpen = !!open[p];
              return (
                <React.Fragment key={p}>
                  <FunnelRow name={p} m={m} tr={trendOf(m, pri.ch.get(p))} depth={0}
                    expandable={expandable} open={isOpen}
                    onToggle={() => setOpen((o) => ({ ...o, [p]: !o[p] }))} />
                  {expandable && isOpen && tl.map((t) => (
                    <FunnelRow key={t.k} name={t.tactic} m={t.m}
                      tr={trendOf(t.m, pri.tac.get(t.k) ? pri.tac.get(t.k).m : null)}
                      depth={1} expandable={false} />
                  ))}
                </React.Fragment>
              );
            })}
            <FunnelRow name="All paid channels" m={total} tr={trendOf(total, totalPri)}
              depth={0} expandable={false} strong />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── 14. PART 5 — data-derived actions ───────────────────────────────── */
function buildActions(curMap, priMap, totalSpend) {
  const floor = Math.max(MATERIAL_SPEND_ABS, num0(totalSpend) * MATERIAL_SPEND_SHARE);
  const cuts = [], scales = [];
  curMap.forEach((c) => {
    const p = priMap.get(c.key);
    if (!p || c.spend < floor) return;
    const rc = ratioOfSums(c.sales, c.spend);
    const rp = ratioOfSums(p.sales, p.spend);
    const d = delta(rc, rp);
    if (rc === null || rp === null || d === null) return;
    if (Math.abs(d) <= TREND_BAND) return;
    const item = {
      key: c.key, spend: c.spend, share: totalSpend ? c.spend / totalSpend : null,
      rc: rc, rp: rp, d: d, spendDelta: delta(c.spend, p.spend),
      weight: Math.abs(d) * c.spend,
    };
    (d < 0 ? cuts : scales).push(item);
  });
  cuts.sort((a, b) => b.weight - a.weight);
  scales.sort((a, b) => b.weight - a.weight);
  const picked = cuts.slice(0, 3).map((x) => ({ ...x, kind: "cut" }))
    .concat(scales.slice(0, 3).map((x) => ({ ...x, kind: "scale" })));
  return { items: picked.slice(0, 6), floor: floor };
}

function ActionCard({ a }) {
  const cut = a.kind === "cut";
  const severe = cut && (a.rc < 1 || a.d <= -0.2);
  const ink = cut ? (severe ? T.crit : T.warn) : T.good;
  const tag = cut ? (severe ? "Cut or fix" : "Investigate") : (a.spendDelta !== null && a.spendDelta < 0 ? "Take budget back" : "Scale");
  let action;
  if (cut) {
    action = a.rc < 1
      ? "Returning under $1 per $1 spent. Cut or restructure this before the next budget cycle lands."
      : "Efficiency is falling at material spend. Audit creative and audience before adding any budget here.";
  } else {
    action = a.spendDelta !== null && a.spendDelta < 0
      ? "Efficiency improved on lower spend — the first place to put budget back, in measured steps."
      : "Returns are growing faster than spend — the clearest candidate for incremental budget.";
  }
  return (
    <div className="agents-card" style={{
      background: T.surface, border: "1px solid " + T.border, borderRadius: T.radius,
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Dot color={ink} size={8} />
        <span style={{
          fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase",
          color: ink, fontWeight: 700,
        }}>{tag}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 620, color: T.text, lineHeight: 1.3, wordBreak: "break-word" }}>
        {a.key}
      </div>
      <div style={{ fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums", lineHeight: 1.5 }}>
        ROAS <b style={{ color: T.text }}>{roasf(a.rp)} → {roasf(a.rc)}</b> ({signPct(a.d)}) on{" "}
        {usd(a.spend)}{a.share !== null ? " · " + pctf(a.share, 1) + " of paid spend" : ""}
        {a.spendDelta !== null ? " · spend " + signPct(a.spendDelta) : ""}
      </div>
      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{action}</div>
    </div>
  );
}

/* ── 15. main ────────────────────────────────────────────────────────── */
export default function WeeklyBusinessOverview() {
  useHostTheme();
  const [bucketCount, setBucketCount] = useState(PERIOD.buckets);
  const range = useMemo(() => ({
    start: addDays(TODAY, -(bucketCount * PERIOD.days + SETTLE_REF_DAYS)),
    end: addDays(TODAY, 1),
  }), [bucketCount]);

  const [modelQ, refModel] = useHostQuery(SQL_MODEL, SEED_MODEL, true);
  const model = useMemo(() => {
    const r = toRows(modelQ.data)[0];
    const m = r && r.default_attr_model ? String(r.default_attr_model) : MODEL_FALLBACK;
    return m || MODEL_FALLBACK;
  }, [modelQ.data]);
  const modelLabel = MODEL_LABELS[model] || model;
  const identity = SCOPE_LABEL + " · " + modelLabel;

  const [adsQ, refAds] = useHostQuery(sqlAds(model, range.start, range.end), SEED_ADS, true);
  const [platQ, refPlat] = useHostQuery(sqlPlat(range.start, range.end), SEED_PLAT, true);

  /* ── daily ads series + data-anchored window ── */
  const adsDaily = useMemo(() => {
    const m = new Map();
    toRows(adsQ.data).forEach((r) => {
      const d = dayOf(r.event_date);
      if (!d) return;
      const p = m.get(d) || { d: d, spend: 0, sales: 0 };
      p.spend += num0(r.ad_spend);
      p.sales += num0(r.attr_all_sales);
      m.set(d, p);
    });
    return Array.from(m.values()).sort((a, b) => (a.d < b.d ? -1 : 1));
  }, [adsQ.data]);

  const win = useMemo(() => {
    const days = adsDaily.slice();
    const excluded = [];
    while (days.length > SETTLE_MIN_DAYS) {
      const last = days[days.length - 1];
      const ref = median(days.slice(-SETTLE_REF_DAYS, -1).map((x) => x.sales));
      if (ref && last.sales < ref * SETTLING_RATIO) { excluded.unshift(last.d); days.pop(); }
      else break;
    }
    /* Advisory on the last KEPT day (see SETTLING_ROAS_RATIO): spend in, attribution not
       yet. Flagged on the page, never trimmed. */
    let partiallySettled = null;
    if (days.length > SETTLE_REF_DAYS) {
      const last = days[days.length - 1];
      const ref = days.slice(-SETTLE_REF_DAYS, -1);
      const refSpend = median(ref.map((x) => x.spend));
      const refRoas = median(ref.map((x) => (x.spend ? x.sales / x.spend : NaN)));
      const lastRoas = last.spend ? last.sales / last.spend : null;
      if (
        lastRoas !== null && refRoas && refSpend &&
        last.spend >= refSpend * SETTLING_MIN_SPEND_RATIO &&
        lastRoas < refRoas * SETTLING_ROAS_RATIO
      ) {
        partiallySettled = last.d;
      }
    }
    const curEnd = days.length ? days[days.length - 1].d : addDays(TODAY, -1);
    const curStart = addDays(curEnd, -(PERIOD.days - 1));
    const priEnd = addDays(curStart, -1);
    const priStart = addDays(priEnd, -(PERIOD.days - 1));
    return { curStart, curEnd, priStart, priEnd, excluded, partiallySettled, lastSettled: curEnd };
  }, [adsDaily]);

  /* ── period buckets anchored to curEnd ── */
  const periodEdges = useMemo(() => {
    const out = [];
    for (let i = bucketCount - 1; i >= 0; i--) {
      const b = addDays(win.curEnd, -PERIOD.days * i);
      const a = addDays(b, -(PERIOD.days - 1));
      out.push({ a: a, b: b, label: shortDate(a) });
    }
    return out;
  }, [win.curEnd, bucketCount]);
  const bucketOf = useCallback((d) => {
    for (let i = 0; i < periodEdges.length; i++) {
      if (d >= periodEdges[i].a && d <= periodEdges[i].b) return i;
    }
    return -1;
  }, [periodEdges]);

  const adsBuckets = useMemo(() => {
    const arr = periodEdges.map((e) => ({ label: e.label, a: e.a, b: e.b, spend: 0, sales: 0, roas: 0 }));
    adsDaily.forEach((x) => {
      const i = bucketOf(x.d);
      if (i >= 0) { arr[i].spend += x.spend; arr[i].sales += x.sales; }
    });
    arr.forEach((x) => { x.roas = ratioOfSums(x.sales, x.spend) || 0; });
    return arr;
  }, [adsDaily, periodEdges, bucketOf]);

  /* ── store-actual by platform ── */
  const platDaily = useMemo(() => {
    const rows = [];
    toRows(platQ.data).forEach((r) => {
      rows.push({
        p: String(r.sales_platform || "other"), d: dayOf(r.event_date),
        v: num0(r.order_total_sales), o: num0(r.order_total_orders),
      });
    });
    return rows;
  }, [platQ.data]);

  const platforms = useMemo(() => {
    const tot = new Map();
    platDaily.forEach((r) => tot.set(r.p, (tot.get(r.p) || 0) + r.v));
    return Array.from(tot.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  }, [platDaily]);

  const platBuckets = useMemo(() => {
    const arr = periodEdges.map((e) => ({ label: e.label, by: {}, total: 0 }));
    platDaily.forEach((r) => {
      const i = bucketOf(r.d);
      if (i < 0) return;
      const key = platforms.indexOf(r.p) >= 0 ? r.p : "other";
      arr[i].by[key] = (arr[i].by[key] || 0) + r.v;
      arr[i].total += r.v;
    });
    return arr;
  }, [platDaily, periodEdges, bucketOf, platforms]);

  const storeTotals = useMemo(() => {
    let cur = 0, pri = 0;
    platDaily.forEach((r) => {
      if (r.d >= win.curStart && r.d <= win.curEnd) cur += r.v;
      else if (r.d >= win.priStart && r.d <= win.priEnd) pri += r.v;
    });
    return { cur: cur, pri: pri, d: delta(cur, pri) };
  }, [platDaily, win]);

  /* ── history coverage: a window longer than the account's history silently
     counts missing days as zero, which reads as a collapse. Detect and say so. ── */
  const coverage = useMemo(() => {
    const first = adsDaily.length ? adsDaily[0].d : null;
    if (!first) return { ok: true, firstDay: null, curShort: false, priShort: false };
    return {
      ok: first <= win.priStart,
      firstDay: first,
      curShort: first > win.curStart,
      priShort: first > win.priStart,
    };
  }, [adsDaily, win.curStart, win.priStart]);

  /* ── late-reporting sales platforms ── */
  const latePlatforms = useMemo(() => {
    const last = new Map();
    platDaily.forEach((r) => {
      if (r.v <= 0) return;
      const cur = last.get(r.p);
      if (!cur || r.d > cur) last.set(r.p, r.d);
    });
    const out = [];
    last.forEach((d, p) => { if (d < win.curEnd) out.push({ p: p, through: d }); });
    return out.sort((a, b) => (a.through < b.through ? -1 : 1));
  }, [platDaily, win.curEnd]);

  /* ── ads totals for the two windows ── */
  const adsWindows = useMemo(() => {
    const acc = { cur: { spend: 0, sales: 0 }, pri: { spend: 0, sales: 0 } };
    adsDaily.forEach((x) => {
      if (x.d >= win.curStart && x.d <= win.curEnd) { acc.cur.spend += x.spend; acc.cur.sales += x.sales; }
      else if (x.d >= win.priStart && x.d <= win.priEnd) { acc.pri.spend += x.spend; acc.pri.sales += x.sales; }
    });
    return acc;
  }, [adsDaily, win]);

  /* ── ad-level (stage 2 — inputs derive from the settled window) ── */
  const [adCurQ, refAdCur] = useHostQuery(sqlAdLevel(model, win.curStart, win.curEnd), SEED_AD_CUR, true);
  const [adPriQ, refAdPri] = useHostQuery(sqlAdLevel(model, win.priStart, win.priEnd), SEED_AD_PRI, true);

  const funnelCur = useMemo(() => rollupFunnel(adCurQ.data), [adCurQ.data]);
  const funnelPri = useMemo(() => rollupFunnel(adPriQ.data), [adPriQ.data]);

  const movement = useMemo(
    () => buildMovement(adsWindows.cur, adsWindows.pri, adCurQ.data, adPriQ.data),
    [adsWindows, adCurQ.data, adPriQ.data]
  );
  const actions = useMemo(
    () => buildActions(movement.curMap, movement.priMap, adsWindows.cur.spend),
    [movement, adsWindows]
  );

  const roasCur = ratioOfSums(adsWindows.cur.sales, adsWindows.cur.spend);
  const roasPri = ratioOfSums(adsWindows.pri.sales, adsWindows.pri.spend);

  const anyLive = modelQ.live || adsQ.live || platQ.live || adCurQ.live || adPriQ.live;
  const anyLoading = modelQ.loading || adsQ.loading || platQ.loading || adCurQ.loading || adPriQ.loading;
  const denied = modelQ.denied || adsQ.denied || platQ.denied || adCurQ.denied || adPriQ.denied;
  const refreshAll = useCallback(() => {
    refModel(); refAds(); refPlat(); refAdCur(); refAdPri();
  }, [refModel, refAds, refPlat, refAdCur, refAdPri]);

  const lateNotes = latePlatforms.length
    ? latePlatforms.map((x) => platLabel(x.p) + " reports through " + shortDate(x.through))
    : [];

  return (
    <div style={{
      maxWidth: 1400, margin: "0 auto", padding: "26px 22px 48px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: T.text, opacity: anyLoading ? 0.82 : 1, transition: "opacity .18s ease",
    }}>
      <style>{`
        body { background: transparent; margin: 0; }
        button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent, #2a78d6); outline-offset: 2px; }
        @media (max-width: 860px) {
          .wbo-kpis { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .wbo-charts { grid-template-columns: 1fr !important; }
          .wbo-part3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* header */}
      <header>
        <h1 style={{
          margin: 0, fontSize: 25, fontWeight: 700, letterSpacing: "-.022em", color: T.text,
        }}>Weekly Business Overview</h1>
        <div style={{ marginTop: 6, fontSize: 13, color: T.muted }}>
          {ACCOUNT} · {shortDate(win.curStart)} – {shortDate(win.curEnd)} vs prior 7 days ·{" "}
          <b style={{ color: T.text, fontWeight: 560 }}>{identity}</b>
        </div>
      </header>

      {/* status strip */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 14,
      }}>
        <Chip tone={anyLive ? "good" : "warn"}>
          {anyLive ? "Live data" : denied ? "Access needed" : "Sample data"}
        </Chip>
        {win.excluded.map((d) => (
          <Chip key={d} tone="warn">{shortDate(d)} excluded — still ingesting</Chip>
        ))}
        {win.partiallySettled && (
          <Chip tone="warn">
            {shortDate(win.partiallySettled)} may be partially settled — spend is in, attribution lands 6–24h later
          </Chip>
        )}
        {!coverage.ok && coverage.firstDay && (
          <Chip tone="warn">
            {coverage.curShort
              ? "History starts " + shortDate(coverage.firstDay) + " — shorter than one " + PERIOD.noun
              : "History starts " + shortDate(coverage.firstDay) + " — the " + PERIOD.priorLabel + " comparison is incomplete"}
          </Chip>
        )}
        {lateNotes.map((s) => <Chip key={s} tone="warn">{s}</Chip>)}
        <span style={{ flex: "1 1 auto" }} />
        <label style={{ fontSize: 11.5, color: T.muted, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Trend lookback
          <select value={bucketCount} onChange={(e) => setBucketCount(Number(e.target.value))}
            style={{
              fontSize: 11.5, padding: "3px 6px", borderRadius: 7, color: T.text,
              border: "1px solid " + T.border, background: T.surface,
            }}>
            {BUCKET_CHOICES.map((n) => (
              <option key={n} value={n}>{n} {PERIOD.unitPlural}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={refreshAll} style={{
          fontSize: 11.5, padding: "4px 12px", borderRadius: 999, cursor: "pointer",
          color: T.text, background: T.surface, border: "1px solid " + T.border,
        }}>{anyLoading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {denied && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: T.warn }}>
          The warehouse query tool isn't allowed for this viewer — enable it under Settings → Connectors
          to replace the sample numbers with live data.
        </div>
      )}
      {!denied && !anyLive && (adsQ.error || platQ.error) && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: T.muted }}>
          Couldn't refresh from the warehouse — showing the last probed values.
        </div>
      )}

      {/* PART 1 */}
      <Section eyebrow="Part 1" title="Headline numbers"
        note={"Total revenue is store-actual across all sales platforms. Ads-attributed, ad spend and ROAS are paid ads only · " + identity + "."}>
        <Guard name="Part 1">
        <div className="wbo-kpis" style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14,
        }}>
          <KpiCard label="Total revenue" sub="Store-actual · all sales platforms"
            value={usd(storeTotals.cur)} dlt={storeTotals.d} polarity="up"
            foot={latePlatforms.length
              ? latePlatforms.map((x) => platLabel(x.p) + " reports only through " + shortDate(x.through)).join("; ") +
                ", so the week-over-week decline is overstated."
              : null} />
          <KpiCard label="Ads-attributed revenue" sub="(paid ads only)"
            value={usd(adsWindows.cur.sales)} dlt={delta(adsWindows.cur.sales, adsWindows.pri.sales)}
            polarity="up" foot={"Paid ads only — a subset of total revenue. " + identity + "."} />
          <KpiCard label="Ad spend" sub="All ad platforms"
            value={usd(adsWindows.cur.spend)} dlt={delta(adsWindows.cur.spend, adsWindows.pri.spend)}
            polarity="neutral" foot="Spend direction is neither good nor bad on its own — read it with ROAS." />
          <KpiCard label="ROAS" sub="(paid ads only)"
            value={roasf(roasCur)} dlt={delta(roasCur, roasPri)} polarity="up"
            foot={"Ads-attributed revenue ÷ ad spend, ratio of sums. Prior week " + roasf(roasPri) + "."} />
        </div>
        </Guard>
      </Section>

      {/* PART 2 */}
      <Section eyebrow="Part 2" title="Trends"
        note={"Weekly buckets ending " + shortDate(win.curEnd) + ". Left: paid ads only. Right: store-actual revenue by sales platform."}>
        <Guard name="Part 2">
        <div className="wbo-charts" style={{
          display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16,
        }}>
          <div style={{
            background: T.surface, border: "1px solid " + T.border,
            borderRadius: T.radius, padding: "14px 16px 8px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ads performance</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
              Ads-attributed revenue and ad spend share the left $ axis; ROAS is on the labelled right axis · {identity}
            </div>
            <AdsTrendChart buckets={adsBuckets} />
          </div>
          <div style={{
            background: T.surface, border: "1px solid " + T.border,
            borderRadius: T.radius, padding: "14px 16px 8px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Revenue by sales platform</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
              Store-actual total revenue, stacked — no attribution model applied
            </div>
            <PlatformStackChart buckets={platBuckets} platforms={platforms} />
          </div>
        </div>
        </Guard>
      </Section>

      {/* PART 3 */}
      <Section eyebrow="Part 3" style={{ marginTop: 26 }}>
        <Guard name="Part 3">
          <Part3Movement mv={movement} curStart={win.curStart} curEnd={win.curEnd} />
        </Guard>
      </Section>

      {/* PART 4 */}
      <Section eyebrow="Part 4" title="Ad channel performance"
        note={"Channels are collapsed by default — expand any channel with more than one tactic. " +
          shortDate(win.curStart) + " – " + shortDate(win.curEnd) + " · " + identity +
          ". Trend compares ROAS against the prior 7 days (±8% = Stable)."}>
        <Guard name="Part 4">
          <Part4Table cur={funnelCur} pri={funnelPri} />
        </Guard>
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
          "All paid channels" rolls up the ad-level table and ties to the ads-attributed revenue and ROAS
          headline above (rows that carry no ad-platform key can leave a gap under 0.1%). NC = new customer.
        </div>
      </Section>

      {/* PART 5 */}
      <Section eyebrow="Part 5" title="Things to watch & actions for next week"
        note={"Only channels and tactics spending at least " + usd(actions.floor) +
          " this week and moving ROAS by more than ±8% qualify — nothing is listed on judgement alone."}>
        <Guard name="Part 5">
        {actions.items.length ? (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14,
          }}>
            {actions.items.map((a) => <ActionCard key={a.kind + a.key} a={a} />)}
          </div>
        ) : (
          <div style={{
            background: T.surface, border: "1px solid " + T.border, borderRadius: T.radius,
            padding: "16px 18px", fontSize: 13, color: T.muted, display: "flex", gap: 10, alignItems: "center",
          }}>
            <Dot color={T.good} size={9} />
            No channel or tactic at material spend moved ROAS by more than ±8% this week — there is no
            data-backed action to take, so none is invented.
          </div>
        )}
        </Guard>
      </Section>

      {/* provenance */}
      <footer style={{
        marginTop: 30, paddingTop: 14, borderTop: "1px solid " + T.border,
        fontSize: 10.5, lineHeight: 1.65, color: T.muted,
      }}>
        <div><b style={{ color: T.text, fontWeight: 560 }}>Provenance.</b>{" "}
          {ACCOUNT}, queried live through the WorkMagic warehouse query tool.
          Measurement identity: {identity} — the attribution model is resolved at load time from the
          tenant's default-model view, not hardcoded.
        </div>
        <div style={{ marginTop: 4 }}>
          Store-actual totals come from the daily sales-channel view with no attribution model applied.
          Ads-attributed revenue, ad spend and ROAS come from the attributed channel-level daily view
          filtered to paid ads. The channel/tactic funnel comes from the attributed ad-level daily view.
          All ratios (CTR, CPC, CPM, ROAS, NC ROAS) are ratio of sums, computed client-side.
        </div>
        <div style={{ marginTop: 4 }}>
          Windows are anchored to the data, not the clock: trailing days still ingesting are trimmed and
          named in the status strip above{win.excluded.length ? " (" + win.excluded.map(shortDate).join(", ") + ")" : ""},
          and sales platforms that report late are called out on the revenue card.
          {anyLive ? "" : " Currently rendering probed sample values — the live bridge has not returned yet."}
        </div>
      </footer>
    </div>
  );
}
