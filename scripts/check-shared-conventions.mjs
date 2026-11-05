#!/usr/bin/env node
// Drift guard for the attribution skill family — this repo has no CI, so run this
// before pushing convention changes:  node scripts/check-shared-conventions.mjs
//
// It enforces the "single source of truth" rule: the canonical convention files own
// the shared rules; siblings point at them and must not re-introduce a divergent copy.
// Two concrete checks (kept low-false-positive on purpose):
//   1. The canonical files exist AND carry their SINGLE SOURCE OF TRUTH marker.
//   2. No SQL template defaults to the Shopify-only sales measure — the whole family
//      defaults to all sales platforms (attr_all_sales); attr_shopify_sales is only a
//      per-platform breakdown component, documented in the canonical scope file, and
//      must never be the default measure a query template pulls.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SKILLS = join(ROOT, "skills");
const errors = [];

const CANON = [
  {
    file: "skills/attribution-data-query/references/attribution-model.md",
    marker: "SINGLE SOURCE OF TRUTH",
  },
  {
    file: "skills/attribution-data-query/references/sales-platform-scope.md",
    marker: "SINGLE SOURCE OF TRUTH",
  },
];

// Check 1 — canonical files present + marked.
for (const c of CANON) {
  let body = "";
  try {
    body = readFileSync(join(ROOT, c.file), "utf8");
  } catch {
    errors.push(`canonical file missing: ${c.file}`);
    continue;
  }
  if (!body.includes(c.marker)) {
    errors.push(`canonical file lost its "${c.marker}" marker: ${c.file}`);
  }
}

// Walk every file under skills/.
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Check 2 — no SQL template defaults to the Shopify-only measure.
for (const p of walk(SKILLS)) {
  if (!p.endsWith(".sql")) continue;
  const body = readFileSync(p, "utf8");
  if (/attr_shopify_sales|attr_shopify_orders/.test(body)) {
    errors.push(
      `SQL template still uses the Shopify-only measure (default must be attr_all_*): ${p.replace(ROOT, "")}`,
    );
  }
}

if (errors.length) {
  console.error("✗ shared-convention drift detected:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("✓ shared conventions intact (canonical markers present; no Shopify-only SQL default)");
process.exit(0);
