#!/usr/bin/env node
/**
 * migrate-rfc-032-field-type.mjs — RFC-032 Change H, applied.
 *
 * Rewrites every legacy Field DEFINITION (a `.json` under any package `fields/` directory carrying
 * a top-level `valueType`) from the pre-RFC-032 `valueType` (+ `contentFormat`, `allowedValues`,
 * `vocabularyRef`, `validationRules`) to the `fieldType` model, via the single shared transform in
 * scripts/lib/rfc-032-fieldtype.mjs. Key order is preserved for a minimal diff.
 *
 * The transform is pure and reproducible: the same inputs always yield byte-identical outputs, and
 * a second run is a no-op (idempotent — already-migrated files have no `valueType`). Every produced
 * `fieldType` is checked against Conformance Rules R1–R11 before anything is written; a single
 * violation aborts the whole run without writing.
 *
 * This migration touches DEFINITIONS only. Instance-layer carriers (Tier-1 `TypedField.valueType`,
 * `FieldValue.entries`, FieldGroup `groupValues`) are reconciled under #242 — see the RFC.
 *
 *   node scripts/migrate-rfc-032-field-type.mjs           # apply (writes files)
 *   node scripts/migrate-rfc-032-field-type.mjs --check   # dry run: report + validate, write nothing
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve, relative } from "path";
import { migrateFieldObject, validateFieldType } from "./lib/rfc-032-fieldtype.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root
const PACKAGE_ROOTS = [join(ROOT, "srs", "package"), join(ROOT, "srs", "srs", "package")];
const CHECK = process.argv.includes("--check");

async function findFieldFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out; // a package root that doesn't exist is fine (srs/srs/package has no fields today)
  }
  for (const e of entries) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findFieldFiles(abs)));
    else if (e.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

async function main() {
  const files = (await Promise.all(PACKAGE_ROOTS.map(findFieldFiles))).flat().sort();
  const migrated = [];
  const skipped = [];
  const errors = [];

  for (const abs of files) {
    let field;
    try {
      field = JSON.parse(await readFile(abs, "utf8"));
    } catch (e) {
      continue; // not our concern; validate-package.mjs reports structural load failures
    }
    if (field == null || typeof field !== "object" || Array.isArray(field)) continue;
    if (typeof field.valueType !== "string") {
      if ("fieldType" in field) skipped.push(abs); // already migrated
      continue;
    }

    const rel = relative(ROOT, abs);
    let result;
    try {
      result = migrateFieldObject(field);
    } catch (e) {
      errors.push(`${rel}: ${e.message}`);
      continue;
    }
    const ftErrs = validateFieldType(result.fieldType, { where: rel });
    if (ftErrs.length) {
      errors.push(...ftErrs);
      continue;
    }
    migrated.push({ abs, rel, out: result.field, fieldType: result.fieldType });
  }

  // Report.
  console.log(`RFC-032 Change H — field-definition migration (${CHECK ? "CHECK / dry run" : "APPLY"})\n`);
  console.log(`  scanned:  ${files.length} .json files under package trees`);
  console.log(`  to migrate: ${migrated.length}`);
  console.log(`  already migrated (skipped): ${skipped.length}`);
  for (const m of migrated) {
    console.log(`    → ${m.rel}  ::  ${JSON.stringify(m.fieldType)}`);
  }

  if (errors.length) {
    console.log(`\n  ✗ ${errors.length} conformance error(s) — NOTHING WRITTEN:`);
    for (const e of errors) console.log(`      ${e}`);
    process.exit(1);
  }

  if (CHECK) {
    console.log(`\n  ✓ dry run clean — ${migrated.length} field(s) would migrate, all R1–R11 valid.`);
    process.exit(0);
  }

  for (const m of migrated) {
    await writeFile(m.abs, JSON.stringify(m.out, null, 2) + "\n", "utf8");
  }
  console.log(`\n  ✓ wrote ${migrated.length} migrated field definition(s).`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
