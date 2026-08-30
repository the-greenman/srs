#!/usr/bin/env node
/**
 * Keep RecordPropertyView.property's closed enum derived from record.json's declared top-level
 * properties (RFC-041 Change B / [R5]). Identity and type-binding keys, value carriers, the open
 * implementation-local meta bag, and sourceRefs (whose composite-array rendering is deferred) are
 * excluded by the RFC; every other declared property is addressable through RecordPropertyView.
 *
 *   node scripts/gen-record-property-view-enum.mjs           # update view.json
 *   node scripts/gen-record-property-view-enum.mjs --check   # fail if committed output drifts
 */
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const SCHEMA_DIR = join(ROOT, "docs/schema/2.0");
const RECORD_SCHEMA = join(SCHEMA_DIR, "record.json");
const VIEW_SCHEMA = join(SCHEMA_DIR, "view.json");
const CHECK = process.argv.includes("--check");

const EXCLUDED_PROPERTIES = new Set([
  "$schema",
  "instanceId",
  "typeId",
  "typeVersion",
  "typeNamespace",
  "typeName",
  "fieldValues",
  "fieldMeta",
  "meta",
  "sourceRefs",
]);

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const record = await readJson(RECORD_SCHEMA);
  const view = await readJson(VIEW_SCHEMA);
  const recordProperties = record.properties;
  const target = view.$defs?.RecordPropertyView?.properties?.property;

  if (!recordProperties || typeof recordProperties !== "object" || Array.isArray(recordProperties)) {
    console.error("✗ record.json's top-level properties object is missing.");
    process.exit(1);
  }
  if (!target) {
    console.error("✗ view.json's $defs.RecordPropertyView.properties.property is missing.");
    process.exit(1);
  }

  const expectedEnum = Object.keys(recordProperties).filter(
    (property) => !EXCLUDED_PROPERTIES.has(property),
  );
  const currentEnum = target.enum;
  const drift = JSON.stringify(currentEnum) !== JSON.stringify(expectedEnum);

  if (CHECK) {
    if (drift) {
      console.error("✗ view.json's RecordPropertyView.property enum has drifted from record.json.");
      console.error(`  committed: ${JSON.stringify(currentEnum)}`);
      console.error(`  derived:   ${JSON.stringify(expectedEnum)}`);
      process.exit(1);
    }
    console.log(
      `✓ view.json's RecordPropertyView.property enum matches record.json (${expectedEnum.length} properties).`,
    );
    return;
  }

  target.enum = expectedEnum;
  await writeFile(VIEW_SCHEMA, `${JSON.stringify(view, null, 2)}\n`);
  console.log(
    `✓ wrote RecordPropertyView.property enum (${expectedEnum.length} properties): ${expectedEnum.join(", ")}`,
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
