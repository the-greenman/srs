#!/usr/bin/env node
/**
 * tests/rfc-534-emitter-capabilities/run.mjs — golden fixtures proving srs#534's two
 * binary-parity-gated emitter capabilities work correctly: map-of-$ref values and untyped integer
 * enums (the third capability, $defs-only bundle emission, is exercised directly against the real
 * corpus in scripts/rfc-534-closure-test.mjs, since discovery.json's four entities carry no
 * binary-parity risk).
 *
 * WHY A SEPARATE FIXTURE, not the live `com.semanticops.srs/metamodel` corpus: `Theme.assets`
 * (map-of-$ref) and `DiscoveryQuery.tier` (untyped integer enum) are the two properties that would
 * naturally exercise these capabilities, but populating them in the LIVE self-hosted metamodel
 * corpus makes `srs repo validate --repo srs` (and therefore rendering) fail to load the catalog
 * entirely under the pinned srs-rust binary (build.320) — its embedded copy of field.json's
 * FieldType schema predates both capabilities. Same class of gap srs-rust#868 already parked a
 * schema-touching srs-side change for (FieldAssignment.description, packageDependencies): the
 * mechanism and schema capability land now; corpus population is deferred until a compatible
 * srs-rust release ships (srs-rust#932). This fixture — outside
 * srs/package/** and packages/**, so scripts/validate-all.mjs's package walker never discovers it as
 * a live package — proves the mechanism correct on its own terms in the meantime, the same role
 * tests/rfc-040-unit3/ plays for that unit's own capabilities.
 *
 * Fixture package: tests/rfc-534-emitter-capabilities/fixture-package/ — `widget` composes `name`
 * (plain string), `priority` (closed integer enum [0,1,2]), and `annotations` (a map of names to
 * inline `annotation` refs).
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity } from "../../scripts/lib/schema-emitter.mjs";
import { validateFieldType } from "../../scripts/lib/rfc-032-fieldtype.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixture-package");
let pass = 0;
function check(label, cond) {
  assert.ok(cond, label);
  pass++;
  console.log(`  ✓ ${label}`);
}

const ctx = loadPackage(FIXTURE);
const widget = emitEntity(ctx, "widget");

// --- untyped integer enum ------------------------------------------------------------------------
check("priority: closed integer enum projects to a BARE {enum:[...]} with no `type` keyword",
  JSON.stringify(widget.properties.priority) === JSON.stringify({ enum: [0, 1, 2], title: "Priority" }));
check("priority: validateFieldType accepts datatype:integer + valueDomain:closed (R3)",
  validateFieldType({ datatype: "integer", valueDomain: "closed", allowedValues: [0, 1, 2] }).length === 0);
check("R3: valueDomain still rejected for a datatype it is not meaningful for (e.g. boolean)",
  validateFieldType({ datatype: "boolean", valueDomain: "closed", allowedValues: [true] })
    .some((e) => e.includes("[R3]")));

// --- map-of-$ref ----------------------------------------------------------------------------------
const annotationsDef = widget.properties.annotations;
check("annotations: map-of-$ref projects additionalProperties as a $ref, not a scalar node",
  annotationsDef.type === "object" && typeof annotationsDef.additionalProperties.$ref === "string");
const defKey = annotationsDef.additionalProperties.$ref.replace("#/$defs/", "");
check("annotations: the referenced $def exists and carries the Annotation Type's own shape",
  widget.$defs[defKey] && widget.$defs[defKey].required.includes("color"));
check("R9: map valueRange accepts \"ref\" (in addition to a scalar datatype or \"open\")",
  validateFieldType({ datatype: "map", valueRange: "ref", rangeType: { typeId: "x", typeVersion: 1 } }).length === 0);
check("R9: map valueRange still rejects an unknown value",
  validateFieldType({ datatype: "map", valueRange: "bogus" }).some((e) => e.includes("[R9]")));
check("R2: rangeType/mode still forbidden outside ref/map-of-ref (e.g. plain string)",
  validateFieldType({ datatype: "string", rangeType: { typeId: "x", typeVersion: 1 } }).some((e) => e.includes("[R2]")));

// map-of-ref with mode:"reference" projects the id-shape, not a $ref, and contributes no $def.
const refModeFt = {
  datatype: "map",
  valueRange: "ref",
  mode: "reference",
  rangeType: { namespace: "test.rfc534", name: "annotation", version: 1 },
};
const refModeCtx = { typesById: {}, typesByName: {} }; // renderNode not needed: rangeType already resolved
const { projectField } = await import("../../scripts/lib/rfc-032-fieldtype.mjs");
const refModeProjection = projectField(refModeFt);
check("map-of-$ref with mode:reference projects an id-shape (type/format/x-srs-range-type), no $ref",
  refModeProjection.additionalProperties.type === "string" &&
  refModeProjection.additionalProperties.format === "uuid" &&
  refModeProjection.additionalProperties["x-srs-range-type"] === "test.rfc534/annotation@1" &&
  !("$ref" in refModeProjection.additionalProperties));

// --- field.json's OWN structural allOf gate (srs#551) --------------------------------------------
// srs#534/#546 widened field.json's `valueRange` enum (+ "ref") and `allowedValues.items.type`
// (+ "integer"), but never widened the FIRST allOf branch's `if` — so a map-of-$ref FieldType was
// semantically valid (validateFieldType/R2 above already accepts it) yet still failed field.json's
// own structural co-occurrence rule for rangeType/mode (confirmed empirically in srs-rust#932/#944:
// `map_of_ref_is_semantically_valid_pending_a_spec_side_seed_fix`). This is a minimal, purpose-built
// evaluator of exactly that one rule's shape (if[.anyOf]/then/else, all `properties.const` +
// `required` — not a general JSON-Schema engine); it is run against the REAL committed seed, not a
// reimplementation of the rule, so it fails if the JSON drifts from the intended shape.
function ifMatches(obj, node) {
  if (node.anyOf) return node.anyOf.some((branch) => ifMatches(obj, branch));
  const propsOk = Object.entries(node.properties ?? {}).every(([k, v]) => obj[k] === v.const);
  const reqOk = (node.required ?? []).every((k) => k in obj);
  return propsOk && reqOk;
}
function rangeTypeModeForbidden(rule, obj) {
  // else.not.anyOf[{required:[rangeType]},{required:[mode]}] — true iff either is present.
  return rule.else.not.anyOf.some((branch) => branch.required.some((k) => k in obj));
}

const fieldJson = JSON.parse(readFileSync(join(HERE, "..", "..", "docs/schema/2.0/field.json"), "utf8"));
const rangeTypeRule = fieldJson.$defs["com.semanticops.srs__field-type__v1"].allOf[0];

const mapOfRefFt = { datatype: "map", valueRange: "ref", rangeType: { typeId: "x", typeVersion: 1 } };
const plainStringWithRangeType = { datatype: "string", rangeType: { typeId: "x", typeVersion: 1 } };
const refFt = { datatype: "ref" };

// RED (pre-#551) shape: `if` only matched datatype:"ref" — reproduced verbatim from git history so
// this test documents the bug it fixed, not just the fix.
const preFix551Rule = {
  if: { properties: { datatype: { const: "ref" } }, required: ["datatype"] },
  else: rangeTypeRule.else,
};
check("PRE-#551 seed rule: rejected the RFC-032-conformant map-of-$ref shape (the bug)",
  !ifMatches(mapOfRefFt, preFix551Rule.if) && rangeTypeModeForbidden(preFix551Rule, mapOfRefFt));

check("POST-#551 seed rule: permits rangeType for the ratified map-of-$ref shape (datatype:map, valueRange:ref)",
  ifMatches(mapOfRefFt, rangeTypeRule.if) && rangeTypeRule.then.required.includes("rangeType"));
check("POST-#551 seed rule: still requires rangeType for plain datatype:ref (unchanged)",
  ifMatches(refFt, rangeTypeRule.if));
check("POST-#551 seed rule: still forbids rangeType/mode outside ref/map-of-ref (regression guard)",
  !ifMatches(plainStringWithRangeType, rangeTypeRule.if) &&
  rangeTypeModeForbidden(rangeTypeRule, plainStringWithRangeType));

console.log(`\n✓ RFC-534 (srs#534) emitter-capability fixtures: ${pass} checks passed (untyped integer enum, map-of-$ref, both modes).`);
