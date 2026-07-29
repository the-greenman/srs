#!/usr/bin/env node
/**
 * rfc-032-paper-proof.mjs — the RFC-032 "paper test" made runnable.
 *
 * Confirms the two goals the model must support (owner acceptance condition):
 *   1. EXPRESSIBLE  — every hard meta-model shape is expressible as an RFC-032 `fieldType`.
 *   2. PROJECTABLE  — each `fieldType` projects to well-formed JSON Schema 2020-12 (the codegen goal),
 *                     with the 2-level AiGuidance case resolving via $defs/$ref.
 *
 * This is a stand-in for the #259 emitter over exactly the fixture shapes in RFC-032 §Testability.
 * Change G's projection now lives in scripts/lib/rfc-032-fieldtype.mjs (the single source of truth
 * shared with the migration and the conformance fixture); this file consumes it and checks the
 * produced schema is well-formed and matches the paper-exercise expectation. No external deps.
 */
import { projectField, rangeDefKey } from "./lib/rfc-032-fieldtype.mjs";

// ---- well-formedness check for a produced JSON Schema fragment -----------------------------------
const VALID_TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
function checkWellFormed(node, $defs, path = "$") {
  const errs = [];
  if (node == null || typeof node !== "object") { errs.push(`${path}: not an object`); return errs; }
  if ("$ref" in node) {
    const m = /^#\/\$defs\/(.+)$/.exec(node.$ref);
    if (!m) errs.push(`${path}: malformed $ref ${node.$ref}`);
    else if (!(m[1] in $defs)) errs.push(`${path}: dangling $ref -> ${m[1]} (not in $defs)`);
    return errs; // $ref node is otherwise opaque
  }
  if ("type" in node && !VALID_TYPES.has(node.type)) errs.push(`${path}: invalid type ${node.type}`);
  if ("enum" in node && (!Array.isArray(node.enum))) errs.push(`${path}: enum not an array`);
  if (node.type === "array") {
    if (!node.items) errs.push(`${path}: array without items`);
    else errs.push(...checkWellFormed(node.items, $defs, `${path}.items`));
  }
  if (node.type === "object" && node.properties) {
    for (const [k, v] of Object.entries(node.properties)) errs.push(...checkWellFormed(v, $defs, `${path}.${k}`));
  }
  if (node.additionalProperties && typeof node.additionalProperties === "object")
    errs.push(...checkWellFormed(node.additionalProperties, $defs, `${path}.additionalProperties`));
  return errs;
}

// ---- the meta-model $defs (range Types), built from RFC-032 §Testability paper exercise ---------
// Each range Type is itself a Type-of-Fields; we project its members to a $defs object schema.
const T = (namespace, name, version) => ({ namespace, name, version });
const typeToObjectSchema = (fields, $defs) => {
  const properties = {}, required = [];
  for (const f of fields) { properties[f.name] = projectField(f.ft, $defs); if (f.required) required.push(f.name); }
  const s = { type: "object", properties, additionalProperties: false };
  if (required.length) s.required = required;
  return s;
};

const $defs = {};
// AiGuidanceExample = { description, input, output* }
$defs[rangeDefKey(T("com.semanticops.srs", "ai_guidance_example", 1))] = typeToObjectSchema([
  { name: "description", ft: { datatype: "string" } },
  { name: "input", ft: { datatype: "string" } },
  { name: "output", ft: { datatype: "string" }, required: true },
], $defs);
// AiGuidance = { purpose*, extraction, negativeGuidance, examples: list<AiGuidanceExample> }
$defs[rangeDefKey(T("com.semanticops.srs", "ai_guidance", 1))] = typeToObjectSchema([
  { name: "purpose", ft: { datatype: "string" }, required: true },
  { name: "extraction", ft: { datatype: "string" } },
  { name: "negativeGuidance", ft: { datatype: "string" } },
  { name: "examples", ft: { datatype: "ref", mode: "inline", cardinality: "list", rangeType: T("com.semanticops.srs", "ai_guidance_example", 1) } },
], $defs);
// FieldAssignment (referenced by Type.fields) — minimal
$defs[rangeDefKey(T("com.semanticops.srs", "field_assignment", 1))] = typeToObjectSchema([
  { name: "fieldId", ft: { datatype: "ref", mode: "reference", cardinality: "single", rangeType: T("com.semanticops.srs", "field", 1) }, required: true },
  { name: "order", ft: { datatype: "integer", constraints: { minimum: 0 } }, required: true },
  { name: "required", ft: { datatype: "boolean" } },
], $defs);

// ---- the hard fixture fields (RFC-032 §Testability), each with its expectation ------------------
const CASES = [
  { label: "Field.aiGuidance (2-level inline nesting)",
    ft: { datatype: "ref", mode: "inline", cardinality: "single", rangeType: T("com.semanticops.srs", "ai_guidance", 1) },
    expect: (s) => s.$ref && $defs[s.$ref.split("/").pop()] } ,
  { label: "Type.fields (composite list)",
    ft: { datatype: "ref", mode: "inline", cardinality: "list", rangeType: T("com.semanticops.srs", "field_assignment", 1) },
    expect: (s) => s.type === "array" && s.items.$ref },
  { label: "FieldAssignment.fieldId (typed reference)",
    ft: { datatype: "ref", mode: "reference", cardinality: "single", rangeType: T("com.semanticops.srs", "field", 1) },
    expect: (s) => s.type === "string" && s.format === "uuid" && s["x-srs-range-type"] },
  { label: "Field.version (integer + minimum:1 — self-hosting its own model)",
    ft: { datatype: "integer", constraints: { minimum: 1 } },
    expect: (s) => s.type === "integer" && s.minimum === 1 },
  { label: "removed union -> constraints (title minLength)",
    ft: { datatype: "string", constraints: { minLength: 1 } },
    expect: (s) => s.type === "string" && s.minLength === 1 },
  { label: "Field.defaultValue (dependent)",
    ft: { datatype: "dependent", dependsOn: "self" },
    expect: (s) => typeof s === "object" && Object.keys(s).length === 0 },
  { label: "configurable closed range -> pure enum (status via vocabularyRef)",
    ft: { datatype: "string", valueDomain: "closed", vocabularyRef: "com.semanticops.srs/lifecycle_state@1", _resolvedVocabKeys: ["draft", "active", "archived"] },
    expect: (s) => s.type === "string" && Array.isArray(s.enum) && s.enum.length === 3 },
  { label: "RequiresRelation.relationType (closed vocab, list)",
    ft: { datatype: "string", valueDomain: "closed", cardinality: "list", minItems: 1, vocabularyRef: "com.semanticops.srs/relation_type@1", _resolvedVocabKeys: ["supersedes", "refines", "depends-on"] },
    expect: (s) => s.type === "array" && s.items.type === "string" && Array.isArray(s.items.enum) && s.minItems === 1 },
  { label: "CrossFieldRule.predicateValue (plain string per RFC-019 — NOT polymorphic)",
    ft: { datatype: "string" },
    expect: (s) => s.type === "string" && !("enum" in s) },
  { label: "Record.meta (open extension bag = map)",
    ft: { datatype: "map", valueRange: "open" },
    expect: (s) => s.type === "object" && s.additionalProperties === true },
];

// ---- run ----------------------------------------------------------------------------------------
let pass = 0, fail = 0;
console.log("RFC-032 paper proof — EXPRESSIBLE (fieldType) + PROJECTABLE (valid JSON Schema)\n");
for (const c of CASES) {
  const projected = projectField(c.ft, $defs);
  const wf = checkWellFormed(projected, $defs);
  const expectOk = c.expect(projected);
  const ok = wf.length === 0 && expectOk;
  console.log(`${ok ? "  ✓" : "  ✗"} ${c.label}`);
  if (!ok) { fail++; if (wf.length) console.log(`      well-formedness: ${wf.join("; ")}`); if (!expectOk) console.log(`      projection: ${JSON.stringify(projected)}`); }
  else pass++;
}
// also fully well-form-check every $defs range Type (proves the recursive nest is valid end to end)
let defErrs = [];
for (const [k, v] of Object.entries($defs)) defErrs.push(...checkWellFormed(v, $defs, `$defs.${k}`));
console.log(`\n  ${defErrs.length === 0 ? "✓" : "✗"} all $defs range Types are well-formed JSON Schema (recursive nest resolves)`);
if (defErrs.length) { console.log("      " + defErrs.join("; ")); fail++; } else pass++;

console.log(`\n${fail === 0 ? "PASS" : "FAIL"}: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
