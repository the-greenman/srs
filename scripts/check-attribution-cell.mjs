#!/usr/bin/env node
/**
 * check-attribution-cell.mjs — a fieldMeta key names a field that actually exists (srs#650).
 *
 * The grid census cycle-three read-out (`scripts/grid-census/readout-2026-09-06.md`, PR #645)
 * found the **attribution** cell carrying zero enforcement checks, against three corpus
 * statements: `I-133`, `rfc-decision-16b20c56`, `07-6-ext-views-l1#r19`.
 *
 * `I-133`'s normative statement (RFC-039 [R6]) has three clauses:
 *   1. `fieldMeta`, when present, MUST be an object whose keys are a subset of the sibling
 *      `fieldValues` keys.
 *   2. Its values MUST be objects of `{source?, editedAt?, sourceRefs?}`.
 *   3. `fieldMeta` MUST NOT appear inside an inline-composite value.
 *
 * This check guards clause 1 only, and clauses 2 and 3 are deliberately left out — not missed:
 *
 *   - Clause 2 already has an enforcement mechanism: `docs/schema/2.0/record.json`'s `FieldMeta`
 *     $def declares `additionalProperties: false`, an enum on `source`, and a `date-time` format
 *     on `editedAt`, and `validate-records.mjs` (cell: conformance, the `validate-records` entry
 *     in checks.json) already validates every instance under `srs/records/**` against that schema
 *     via `scripts/lib/json-schema-lite.mjs` on every run. Re-implementing the identical shape
 *     check here under a second id would be a second mechanism for a goal clause 2 already has one
 *     for — the Charter's one-way-per-goal test this unit's Classify stage is required to run.
 *     What clause 1 needs that clause 2's schema pass cannot give it: JSON Schema has no built-in
 *     way to say "this object's keys must be a subset of a SIBLING object's keys" — that is a
 *     cross-property constraint standard schema validation cannot express, so clause 1 is the part
 *     of I-133 genuinely uncovered, and this check exists for exactly that gap.
 *   - Clause 3 (no `fieldMeta` nested inside a composite field's own interior) needs walking into
 *     each Field's `fieldType`-declared composite shape to know which nested objects are even
 *     candidate sites — a materially bigger unit than a flat key-subset comparison, the same class
 *     of scope `07-6-ext-views-l1#r19` (diagnostic-emission sites, not data shape) was deferred as
 *     in the read-out. Left for a follow-up, not silently dropped.
 *
 * Scope: `srs/records/**`, matching `validate-records.mjs` exactly — `fieldMeta`/`fieldValues` are
 * Tier-2 Record properties (`docs/schema/2.0/note.json` has neither), so packages/, conformance/
 * and docs/spec/examples/ (Field and Type definitions, not Record instances) are out of scope.
 *
 * Measured against the corpus at HEAD: 527 Record instances, only one (`rfc-004-language-neutral-
 * schema-notation`'s stub record) carries a `fieldMeta` block at all, and its one key
 * (`proposal_artifact_path`) is a real `fieldValues` key — the cell's own finding
 * (`rfc-decision-16b20c56`: the attribution machinery is dormant by design) holds structurally,
 * near-vacuously, too. No allowlist file: there is nothing to grandfather.
 *
 *   node scripts/check-attribution-cell.mjs [root]   # root defaults to the repo root
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RECORDS_DIR = join(ROOT, "srs", "records");

const isObject = (o) => o != null && typeof o === "object" && !Array.isArray(o);

async function findRecordFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await findRecordFiles(abs)));
      continue;
    }
    // `.revisions.json` is an ext:addressability sidecar (per-field revision history), not an
    // instance — same exclusion as validate-records.mjs's findRecordFiles.
    if (e.name.endsWith(".json") && !e.name.endsWith(".revisions.json")) out.push(abs);
  }
  return out;
}

async function main() {
  const files = (await findRecordFiles(RECORDS_DIR)).sort();

  const violations = [];
  const unreadable = [];
  let checked = 0;
  let withFieldMeta = 0;

  for (const abs of files) {
    const relPath = relative(ROOT, abs);
    let doc;
    try {
      doc = JSON.parse(await readFile(abs, "utf8"));
    } catch (error) {
      unreadable.push({ path: relPath, error: error.message });
      continue;
    }
    // A Tier-2 Record instance: has fieldValues. Anything else (a Note, a malformed file) is out
    // of scope here — structural load/shape failures are validate-package.mjs/validate-records.mjs's
    // job to report.
    if (!isObject(doc) || !isObject(doc.fieldValues)) continue;
    checked += 1;
    if (!isObject(doc.fieldMeta)) continue;
    withFieldMeta += 1;

    const fieldValueKeys = new Set(Object.keys(doc.fieldValues));
    for (const key of Object.keys(doc.fieldMeta)) {
      if (!fieldValueKeys.has(key)) {
        violations.push({ path: relPath, key, instanceId: doc.instanceId });
      }
    }
  }

  if (unreadable.length > 0) {
    console.log(`✗ ${unreadable.length} record file(s) could not be parsed as JSON:`);
    for (const u of unreadable) {
      console.log(`  - ${u.path}: ${u.error}`);
    }
  }

  if (violations.length > 0) {
    console.log(
      `✗ attribution cell: ${violations.length} fieldMeta key(s) with no corresponding fieldValues key (I-133):`,
    );
    for (const v of violations) {
      console.log(`  - ${v.path} (${v.instanceId ?? "?"}): fieldMeta."${v.key}" has no fieldValues."${v.key}"`);
    }
  }

  if (checked === 0) {
    console.log(`✗ No Record instances (fieldValues-carrying files) found under ${relative(ROOT, RECORDS_DIR)} — check the root argument.`);
    process.exit(1);
  }

  if (unreadable.length > 0 || violations.length > 0) {
    process.exit(1);
  }

  console.log(
    `✓ attribution cell: ${checked} Record instance(s) checked, ${withFieldMeta} carrying a fieldMeta block — every fieldMeta key names a field that exists in fieldValues (I-133)`,
  );
}

main();
