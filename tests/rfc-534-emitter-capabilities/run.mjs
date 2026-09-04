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

console.log(`\n✓ RFC-534 (srs#534) emitter-capability fixtures: ${pass} checks passed (untyped integer enum, map-of-$ref, both modes).`);
