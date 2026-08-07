#!/usr/bin/env node
/**
 * rfc-032-migration-test.mjs — unit coverage for the RFC-032 Change H transform.
 *
 * Locks every migration-table row (RFC-032 Change H) to an exact expected `fieldType`, asserts the
 * result is R1–R11 conformant and projects to well-formed JSON Schema, and proves the transform is
 * idempotent and total. Mirrors the rfc-032-paper-proof.mjs style: no deps, exit 1 on any failure.
 */
import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import {
  migrateFieldType,
  migrateFieldObject,
  projectField,
  validateFieldType,
} from "./lib/rfc-032-fieldtype.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);

let pass = 0, fail = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`); }
}

// A minimal well-formedness check for a projected fragment (same contract as the paper proof).
const VALID_TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
function wellFormed(node) {
  if (node == null || typeof node !== "object") return false;
  if ("$ref" in node) return /^#\/\$defs\/.+$/.test(node.$ref);
  if ("type" in node && !VALID_TYPES.has(node.type)) return false;
  if (node.type === "array" && !node.items) return false;
  return true;
}

const field = (extra) => ({ id: "x", namespace: "com.example", name: "f", version: 1, ...extra });

// ---- Change H rows: (legacy field) -> exact expected fieldType -----------------------------------
const ROWS = [
  ["string", field({ valueType: "string" }), { datatype: "string" }],
  ["string + contentFormat markdown", field({ valueType: "string", contentFormat: "markdown" }), { datatype: "string", format: "markdown" }],
  ["text (no contentFormat) -> plain", field({ valueType: "text" }), { datatype: "string", format: "plain" }],
  ["text + contentFormat markdown", field({ valueType: "text", contentFormat: "markdown" }), { datatype: "string", format: "markdown" }],
  ["text + contentFormat plain", field({ valueType: "text", contentFormat: "plain" }), { datatype: "string", format: "plain" }],
  ["number", field({ valueType: "number" }), { datatype: "number" }],
  ["date", field({ valueType: "date" }), { datatype: "date" }],
  ["url -> string/uri", field({ valueType: "url" }), { datatype: "string", format: "uri" }],
  ["boolean", field({ valueType: "boolean" }), { datatype: "boolean" }],
  ["select + allowedValues", field({ valueType: "select", allowedValues: ["a", "b"] }), { datatype: "string", valueDomain: "closed", allowedValues: ["a", "b"] }],
  ["multiselect + allowedValues", field({ valueType: "multiselect", allowedValues: ["a", "b"] }), { datatype: "string", cardinality: "list", valueDomain: "closed", allowedValues: ["a", "b"] }],
  ["select + vocabularyRef", field({ valueType: "select", vocabularyRef: "com.example/v@1" }), { datatype: "string", valueDomain: "closed", vocabularyRef: "com.example/v@1" }],
  // Change F — validationRules dissolve into facets (no live repo instances, but the transform is total).
  ["validationRules minLength -> constraints", field({ valueType: "string", validationRules: [{ type: "minLength", value: 3 }] }), { datatype: "string", constraints: { minLength: 3 } }],
  ["validationRules pattern -> constraints", field({ valueType: "string", validationRules: [{ type: "pattern", value: "^x" }] }), { datatype: "string", constraints: { pattern: "^x" } }],
  ["validationRules enum -> closed/allowedValues", field({ valueType: "string", validationRules: [{ type: "enum", value: ["a", "b"] }] }), { datatype: "string", valueDomain: "closed", allowedValues: ["a", "b"] }],
];

console.log("RFC-032 migration (Change H) — per-row transform\n");
for (const [label, input, expected] of ROWS) {
  const { fieldType } = migrateFieldType(input);
  check(`${label}`, eq(fieldType, expected), `got ${JSON.stringify(fieldType)}  expected ${JSON.stringify(expected)}`);
  // every produced fieldType is conformant and projectable
  const ftErrs = validateFieldType(fieldType, { where: label });
  check(`${label} — R1–R11 conformant`, ftErrs.length === 0, ftErrs.join("; "));
  check(`${label} — projects to well-formed JSON Schema`, wellFormed(projectField(fieldType)), JSON.stringify(projectField(fieldType)));
}

// ---- opts.repeatable — the #276/#286 defect class: assignment-level `repeatable` must not be lost
// (see governance/external_links: valueType "url" + repeatable: true on governance/decision@1) -----
console.log("\nAssignment-level `repeatable` (#276/#286)\n");
const REPEATABLE_ROWS = [
  ["url + repeatable -> string/uri, cardinality list", field({ valueType: "url" }), { datatype: "string", format: "uri", cardinality: "list" }],
  ["string + repeatable -> string, cardinality list", field({ valueType: "string" }), { datatype: "string", cardinality: "list" }],
  ["select + allowedValues + repeatable -> list cardinality added", field({ valueType: "select", allowedValues: ["a", "b"] }), { datatype: "string", valueDomain: "closed", cardinality: "list", allowedValues: ["a", "b"] }],
  ["multiselect + repeatable -> cardinality list (already there, no-op)", field({ valueType: "multiselect", allowedValues: ["a", "b"] }), { datatype: "string", cardinality: "list", valueDomain: "closed", allowedValues: ["a", "b"] }],
];
for (const [label, input, expected] of REPEATABLE_ROWS) {
  const { fieldType } = migrateFieldType(input, { repeatable: true });
  check(label, eq(fieldType, expected), `got ${JSON.stringify(fieldType)}  expected ${JSON.stringify(expected)}`);
  const ftErrs = validateFieldType(fieldType, { where: label });
  check(`${label} — R1–R11 conformant`, ftErrs.length === 0, ftErrs.join("; "));
}
check(
  "opts.repeatable === false (or absent) does not force list cardinality",
  !("cardinality" in migrateFieldType(field({ valueType: "url" })).fieldType) &&
    !("cardinality" in migrateFieldType(field({ valueType: "url" }), { repeatable: false }).fieldType),
);

// ---- key order + absorbed-key removal (minimal-diff guarantee) -----------------------------------
console.log("\nStructure & idempotency\n");
{
  const f = { id: "x", namespace: "n", name: "m", version: 1, description: "d", aiGuidance: { purpose: "p" }, valueType: "select", allowedValues: ["a"], defaultValue: "a", editorHint: "dropdown", createdAt: "t" };
  const { field: out, changed } = migrateFieldObject(f);
  check("fieldType occupies the valueType slot; editorHint/defaultValue retained after it", eq(Object.keys(out), ["id", "namespace", "name", "version", "description", "aiGuidance", "fieldType", "defaultValue", "editorHint", "createdAt"]), Object.keys(out).join(","));
  check("absorbed keys removed (valueType/allowedValues gone)", !("valueType" in out) && !("allowedValues" in out), Object.keys(out).join(","));
  check("changed === true for a legacy field", changed === true);
  // idempotency: re-running on the migrated object is a no-op
  const again = migrateFieldObject(out);
  check("idempotent: second pass leaves fieldType field unchanged", again.changed === false && eq(again.field, out));
}

// ---- totality: unknown valueType throws, never passes silently -----------------------------------
{
  let threw = false;
  try { migrateFieldType(field({ valueType: "bogus" })); } catch { threw = true; }
  check("unknown valueType throws (never silently dropped)", threw);
}

// ---- sanity against the real repo: the transform is total over every live legacy field ----------
console.log("\nReal-repo sanity\n");
{
  async function findJson(dir) {
    const out = [];
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) out.push(...(await findJson(abs)));
      else if (e.name.endsWith(".json")) out.push(abs);
    }
    return out;
  }
  const files = (await Promise.all([
    join(ROOT, "srs/package"),
    join(ROOT, "srs/srs/package"),
    join(ROOT, "docs/spec/examples/gallery-project-v2/package"),
  ].map(findJson))).flat();
  // State-independent: a legacy field (valueType) must migrate to a conformant fieldType; an
  // already-migrated field (fieldType) must itself be R1–R11 conformant. Either way, every field
  // definition in the repo carries a valid fieldType — the post-migration invariant.
  let legacy = 0, migratedAlready = 0, ftErrTotal = 0;
  for (const abs of files) {
    let f;
    try { f = JSON.parse(await readFile(abs, "utf8")); } catch { continue; }
    if (!f || typeof f !== "object") continue;
    if (typeof f.valueType === "string") {
      legacy++;
      ftErrTotal += validateFieldType(migrateFieldType(f).fieldType, { where: abs }).length;
    } else if (f.fieldType && typeof f.fieldType === "object") {
      migratedAlready++;
      ftErrTotal += validateFieldType(f.fieldType, { where: abs }).length;
    }
  }
  check(`every field definition carries a valid fieldType (${legacy} legacy + ${migratedAlready} migrated)`, (legacy + migratedAlready) > 0 && ftErrTotal === 0, `conformance errors: ${ftErrTotal}`);

  // The named #286 case: governance/external_links (gallery-project-v2) is repeatable: true on
  // governance/decision@1 and nowhere else expresses list-ness. If the migration ever regresses to
  // ignoring assignment-level repeatable, this Field silently goes single-valued while its instance
  // data (arrays) stays exactly as it is — this is the concrete failure #276/#286 describe.
  const externalLinksPath = join(ROOT, "docs/spec/examples/gallery-project-v2/package/fields/externallinks-fc434475.json");
  let externalLinks;
  try { externalLinks = JSON.parse(await readFile(externalLinksPath, "utf8")); } catch { externalLinks = null; }
  check(
    "governance/external_links (gallery-project-v2) migrated with cardinality: list",
    externalLinks?.fieldType?.cardinality === "list",
    `fieldType: ${JSON.stringify(externalLinks?.fieldType)}`,
  );
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"}: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
