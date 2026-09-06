#!/usr/bin/env node
/**
 * check-roadmap-cell-mirror.mjs — the roadmap's Pattern Grid copy stays a mirror, not a fork (srs#602).
 *
 * `docs/strategy/roadmap-model.mjs` carries its own capitalised copy of the twelve cell slugs and
 * validates `roadmap.json`'s `cell` fields against it. It cannot import the canonical
 * `scripts/lib/pattern-grid-cells.json`: `docs/strategy/index.html` loads `roadmap-app.mjs` as a
 * browser module, which imports `roadmap-model.mjs`, so that file runs in a browser and has no
 * `fs`. Its zero-import shape is deliberate, not an oversight.
 *
 * A copy that cannot be removed still must not be allowed to drift. This is the same treatment the
 * schema mirrors get: the duplicate is legitimate, so it is declared and checked rather than
 * tolerated. `rfc-decision-cce3c00e` says cell names are "refinable by future ruling", so a rename
 * is a live path — and today it would update the JSON, both checkers, the census tooling and the
 * compass, then silently leave the roadmap validator enforcing the old set.
 *
 * The check is order-sensitive as well as membership-sensitive: reading order carries meaning in
 * the grid (row-by-row it reproduces the zodiac, and the modality diagonals depend on position),
 * so a reordering is a real divergence, not a cosmetic one.
 *
 * Casing is the one permitted difference: canonical slugs are lowercase, the roadmap displays them
 * title-cased. The check title-cases the canonical set rather than accepting any casing, so a
 * genuine rename cannot hide behind a case difference — which is exactly how this fork stayed
 * invisible: even a copy-paste sync from the JSON would not have matched.
 */
import { readFile } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Repo root: argv[2] when given, so tests/guards/run.mjs can point this check at a fixture tree —
// the same convention check-decision-compass-drift.mjs uses. Otherwise the real repository.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL = join(ROOT, "scripts/lib/pattern-grid-cells.json");
const MIRROR = join(ROOT, "docs/strategy/roadmap-model.mjs");

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

const doc = JSON.parse(await readFile(CANONICAL, "utf8"));
const canonical = (doc.cells || []).map(titleCase);
if (canonical.length === 0) {
  fail(`${CANONICAL} declares no cells — refusing to report success against an empty vocabulary.`);
}

const src = await readFile(MIRROR, "utf8");
const m = /export const PATTERN_GRID_CELLS = new Set\(\[([^\]]*)\]\)/.exec(src);
if (!m) {
  fail(
    `Could not find "export const PATTERN_GRID_CELLS = new Set([...])" in docs/strategy/roadmap-model.mjs. ` +
      `If it was renamed or removed, update this check — or delete it if the mirror is genuinely gone.`,
  );
}
const mirror = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);

const same = mirror.length === canonical.length && mirror.every((v, i) => v === canonical[i]);
if (!same) {
  const missing = canonical.filter((c) => !mirror.includes(c));
  const extra = mirror.filter((c) => !canonical.includes(c));
  const reordered = !missing.length && !extra.length;
  fail(
    `docs/strategy/roadmap-model.mjs's PATTERN_GRID_CELLS has drifted from ` +
      `scripts/lib/pattern-grid-cells.json.\n` +
      (missing.length ? `    missing from the mirror: ${missing.join(", ")}\n` : "") +
      (extra.length ? `    present only in the mirror: ${extra.join(", ")}\n` : "") +
      (reordered ? `    same members, different order — reading order carries meaning in the grid\n` : "") +
      `    canonical (title-cased): ${canonical.join(", ")}\n` +
      `    mirror:                  ${mirror.join(", ")}\n` +
      `  The mirror cannot import the canonical file — roadmap-model.mjs runs in a browser — so it ` +
      `is updated by hand to match. Edit the mirror, never the canonical file, to satisfy this check.`,
  );
}

console.log(`✓ roadmap-model.mjs's PATTERN_GRID_CELLS mirrors the canonical vocabulary (${canonical.length} cells, in order).`);
