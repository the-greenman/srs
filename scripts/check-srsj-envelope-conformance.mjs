#!/usr/bin/env node
/**
 * check-srsj-envelope-conformance.mjs — srs#534/#522/RFC-038/RFC-039.
 *
 * Validates every genuine `.srsj` repository-archive envelope instance in the corpus against the
 * newly-authored `docs/schema/2.0/srsj-envelope.json` (the {srsj, manifest, data} bundle schema
 * RFC-038/RFC-039 recorded as owed-and-absent — authored and modelled at srs#534, see the
 * generation-ledger.md row).
 *
 * Discovery: every `**\/*.srsj` file in the repo, MINUS `packages/com.semanticops.core/1.0.0/
 * core-bundle.srsj`, which RFC-038 states explicitly is a bare package-bundle artifact with no
 * `srsj`/`manifest`/`data` envelope at all — the .srsj membership rule does not apply to it. This is
 * a structural test (does the shape validate against the schema), not a semantic re-check of
 * `manifest`'s own content — that is `validate-package.mjs`/`srs repo validate`'s job elsewhere.
 *
 * Node pipeline only (ADR-004): uses the repo's existing lite JSON-Schema validator
 * (scripts/lib/json-schema-lite.mjs — internal $ref resolution, no cross-file $ref support, which
 * is why srsj-envelope.json inlines a local copy of manifest.json's own committed $defs rather than
 * a cross-file $ref by $id). Runs under scripts/validate-all.mjs.
 */
import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadSchema, validateJsonSchema } from "./lib/json-schema-lite.mjs";
import { latestGovernanceVersion } from "./lib/governance-versions.mjs";
import { createHash } from "crypto";

const HERE = resolve(fileURLToPath(new URL(".", import.meta.url)));
// The schema is the rule, read from beside THIS script; the corpus root is optional so a guard can
// point the check at a fixture tree (`node scripts/check-srsj-envelope-conformance.mjs [root]`).
const REPO = process.argv[2] ? resolve(process.argv[2]) : resolve(HERE, "..");
const SCHEMA_PATH = join(HERE, "..", "docs/schema/2.0/srsj-envelope.json");

// RFC-038: "core-bundle.srsj is a package bundle with no data/manifest envelope at all, so the
// .srsj membership rule does not apply to it" — the one named, permanent exclusion from this check.
const EXCLUDED = new Set([join(REPO, "packages/com.semanticops.core/1.0.0/core-bundle.srsj")]);

// RFC-052 Change C (srs#948, owner ruling 2026-10-23): a published com.mudemocracy.governance seed
// below dataModelRevision 10 is immutable history. It is never rewritten and opens through the
// loader's in-memory migration, so it is not held to this revision's envelope schema. Pinned to the
// exact five published files by path AND sha256 (srs#957 review N3): any other file, or one of these
// paths with different bytes, is checked like everything else. Never the CURRENT version.
const PUBLISHED_BELOW_10 = new Map([
  ["packages/com.mudemocracy.governance/1.0.0/seed/empty-governance-document.srsj", "c66d7a5d8c5d356b2744bc2410a4d1a7bdf14ce3f238ecdb4a2c0949d77e3dd5"],
  ["packages/com.mudemocracy.governance/1.1.0/seed/empty-governance-document.srsj", "e39b65accbc440435bf0199ec8e1929524f673af11d043738230d897d3ce19e7"],
  ["packages/com.mudemocracy.governance/1.2.0/seed/empty-governance-document.srsj", "b90649c1623966c7605e994f0abb85c53e3af7ac79b7fc0f69dfd6ea795d1f6d"],
  ["packages/com.mudemocracy.governance/1.2.1/seed/empty-governance-document.srsj", "4640a7251a35cda4efcd9db51ad16f2502b41b48ef3fb237bfcd60aa5cff6193"],
  ["packages/com.mudemocracy.governance/1.2.2/seed/empty-governance-document.srsj", "4f5578b7bc41f08f6cebb15866d853515182f719a5ac11f8b96c790a1fad663a"],
]);
const CURRENT_GOVERNANCE = latestGovernanceVersion(REPO);
const isPublishedHistoryBelow10 = (rel, text) =>
  PUBLISHED_BELOW_10.get(rel) === createHash("sha256").update(text).digest("hex") &&
  !rel.startsWith(`packages/com.mudemocracy.governance/${CURRENT_GOVERNANCE}/`);

async function findSrsjFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) {
      // Skip anything that is itself a repository root — a nested git worktree carries a `.git`
      // FILE (a gitdir pointer), a clone carries a `.git` directory. Either way its contents belong
      // to a different checkout and this run does not own them.
      //
      // Without this, a worktree under the repo (the documented per-unit workflow puts them at
      // ../.worktrees, but nothing stops one landing inside) is walked as if it were this tree. The
      // failure is worse than noise: EXCLUDED is keyed by absolute path from REPO, so the worktree's
      // copy of packages/com.semanticops.core/1.0.0/core-bundle.srsj does not match the exclusion
      // its own twin has, and the run goes red on a file that is deliberately excluded three
      // directories away. CI never sees it — CI has no worktrees — so it is a local-only false
      // failure, which is the shape that teaches people to distrust a gate (srs-rust#874's
      // stale-sibling trap, in a different costume).
      if (existsSync(join(abs, ".git"))) continue;
      out.push(...(await findSrsjFiles(abs)));
    } else if (e.name.endsWith(".srsj")) out.push(abs);
  }
  return out;
}

const schema = await loadSchema(SCHEMA_PATH);
const allFiles = (await findSrsjFiles(REPO)).sort();
const targets = allFiles.filter((f) => !EXCLUDED.has(f));

if (targets.length === 0) {
  console.error("✗ check-srsj-envelope-conformance: no genuine .srsj envelope instances found — nothing to validate");
  process.exit(1);
}

let fail = 0;
const historical = [];
for (const path of targets) {
  const rel = path.slice(REPO.length + 1);
  let doc;
  let text;
  try {
    text = await readFile(path);
    doc = JSON.parse(text.toString("utf8"));
  } catch (err) {
    console.error(`  ✗ ${rel}: failed to parse JSON — ${err.message}`);
    fail++;
    continue;
  }
  if (isPublishedHistoryBelow10(rel, text)) {
    historical.push(rel);
    continue;
  }
  const errors = validateJsonSchema(doc, schema);
  if (errors.length) {
    fail++;
    console.error(`  ✗ ${rel}: ${errors.length} violation(s)`);
    for (const e of errors) console.error(`      - ${e}`);
  } else {
    console.log(`  ✓ ${rel}`);
  }
}

console.log(`\nchecked ${targets.length - historical.length} genuine .srsj envelope instance(s) against srsj-envelope.json`);
console.log(`exempt (published governance seed history below revision 10, RFC-052 Change C): ${historical.join(", ") || "none"}`);
console.log(`excluded (bare package-bundle, no envelope): ${[...EXCLUDED].map((p) => p.slice(REPO.length + 1)).join(", ") || "none"}`);

if (fail) {
  console.error(`\n✗ ${fail} .srsj file(s) failed srsj-envelope.json conformance.`);
  process.exit(1);
}
console.log("\n✓ every genuine .srsj envelope instance in the corpus validates against docs/schema/2.0/srsj-envelope.json.");
