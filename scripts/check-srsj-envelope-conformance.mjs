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
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadSchema, validateJsonSchema } from "./lib/json-schema-lite.mjs";

const HERE = resolve(fileURLToPath(new URL(".", import.meta.url)));
const REPO = resolve(HERE, "..");
const SCHEMA_PATH = join(REPO, "docs/schema/2.0/srsj-envelope.json");

// RFC-038: "core-bundle.srsj is a package bundle with no data/manifest envelope at all, so the
// .srsj membership rule does not apply to it" — the one named, permanent exclusion from this check.
const EXCLUDED = new Set([join(REPO, "packages/com.semanticops.core/1.0.0/core-bundle.srsj")]);

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
    if (e.isDirectory()) out.push(...(await findSrsjFiles(abs)));
    else if (e.name.endsWith(".srsj")) out.push(abs);
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
for (const path of targets) {
  const rel = path.slice(REPO.length + 1);
  let doc;
  try {
    doc = JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    console.error(`  ✗ ${rel}: failed to parse JSON — ${err.message}`);
    fail++;
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

console.log(`\nchecked ${targets.length} genuine .srsj envelope instance(s) against srsj-envelope.json`);
console.log(`excluded (bare package-bundle, no envelope): ${[...EXCLUDED].map((p) => p.slice(REPO.length + 1)).join(", ") || "none"}`);

if (fail) {
  console.error(`\n✗ ${fail} .srsj file(s) failed srsj-envelope.json conformance.`);
  process.exit(1);
}
console.log("\n✓ every genuine .srsj envelope instance in the corpus validates against docs/schema/2.0/srsj-envelope.json.");
