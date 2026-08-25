#!/usr/bin/env node
/**
 * tests/rfc-032/run.mjs — the RFC-032 conformance fixture (acceptance for Task #257).
 *
 * A single package + Type exercising EVERY mode of the fieldType model, plus range Types and
 * instance records. It is both the fixture generator (it emits reviewable package/record artifacts
 * under tests/rfc-032/) and the checker. For every fixture field it asserts, end to end:
 *
 *   1. the Field definition validates against the live docs/schema/2.0/field.json (runtime schema,
 *      via json-schema-lite — NOT the embedded `srs` binary, which still carries the pre-RFC-032
 *      schema per ADR-004 and would reject `fieldType`);
 *   2. the fieldType is R1–R11 conformant (scripts/lib/rfc-032-fieldtype.mjs::validateFieldType);
 *   3. its Change-G projection matches a committed golden (tests/rfc-032/goldens/projections.json);
 *   4. every range/showcase Type validates against the live docs/schema/2.0/type.json;
 *   5. the showcase Type's projected object schema ACCEPTS a conforming instance and REJECTS a
 *      non-conforming one — proving the projection is enforceable at the instance level for the
 *      storable (scalar + reference-mode) modes. The emitted showcase instance is the
 *      inline-composite instance golden RFC-032 deferred to #242: `fieldValues` is the
 *      RFC-039 name-keyed carrier, and `guidance`/`examples` carry inline-composite values
 *      (no conforming carrier until then), per RFC-032 §Testability "Fixture scope".
 *
 *   node tests/rfc-032/run.mjs            # assert against committed goldens + emit artifacts
 *   node tests/rfc-032/run.mjs --update   # (re)write goldens, then assert
 */
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { loadSchema, validateJsonSchema } from "../../scripts/lib/json-schema-lite.mjs";
import { projectField, validateFieldType, rangeDefKey } from "../../scripts/lib/rfc-032-fieldtype.mjs";

const HERE = resolve(new URL(".", import.meta.url).pathname);
const REPO = resolve(HERE, "../..");
const SCHEMA_DIR = join(REPO, "docs/schema/2.0");
const UPDATE = process.argv.includes("--update");
const NS = "com.semanticops.rfc032fixture";
const CREATED = "2026-07-29T00:00:00Z";

// ---- range Types (targets of ref fields) --------------------------------------------------------
const TYPES = {
  author:               { id: "70000001-0000-4000-8000-000000000001", version: 1 },
  ai_guidance:          { id: "70000002-0000-4000-8000-000000000002", version: 1 },
  ai_guidance_example:  { id: "70000003-0000-4000-8000-000000000003", version: 1 },
  rfc032_showcase:      { id: "70000004-0000-4000-8000-000000000004", version: 1 },
};
const exactRef = (name) => ({ typeId: TYPES[name].id, typeVersion: TYPES[name].version });
// Resolve an ExactTypeRef -> the {namespace,name,version} the emitter needs for the $defs key /
// x-srs-range-type (the resolution #259 does against the package; here from the local registry).
const resolveRange = (rangeType) => {
  const name = Object.keys(TYPES).find((n) => TYPES[n].id === rangeType.typeId);
  return { ...rangeType, namespace: NS, name, version: rangeType.typeVersion };
};

// Vocabulary resolution (gen-time input): vocabularyRef -> effective Term keys (Change G).
// Keys are LINEAGE bare UUIDs (rfc-decision-c8704763 item 6) — deterministically derived from the
// pre-migration "namespace/name@version" strings by scripts/migrate-vocabulary-ref-to-lineage.mjs's
// UUIDv5 formula, so this fixture's generated output matches what that migration produces.
const VOCAB = {
  "28da3300-7f68-543a-8965-4e6743acc772": ["draft", "active", "archived"], // was lifecycle_state@1
  "bf2fcfd7-47a1-5495-a7fa-8969a500a160": ["supersedes", "refines", "depends-on"], // was relation_type@1
};

// ---- the fixture Fields: one per fieldType branch ----------------------------------------------
let uidN = 0;
const uid = () => `f0000000-0000-4000-8000-${String(++uidN).padStart(12, "0")}`;
const F = (name, fieldType, purpose) => ({ name, id: uid(), fieldType, purpose });

const FIELDS = [
  F("plain_string", { datatype: "string" }, "A bare string (also the CrossFieldRule.predicateValue shape — a plain, non-polymorphic string)."),
  F("markdown_body", { datatype: "string", format: "markdown" }, "Markdown-formatted prose (former valueType:text)."),
  F("homepage", { datatype: "string", format: "uri" }, "A URI-formatted string (former valueType:url)."),
  F("title_constrained", { datatype: "string", constraints: { minLength: 1, maxLength: 200 } }, "String length constraints (former minLength/maxLength ValidationRule)."),
  F("code_pattern", { datatype: "string", constraints: { pattern: "^[A-Z][A-Z0-9]*$" } }, "Pattern constraint (former pattern ValidationRule)."),
  F("count", { datatype: "integer", constraints: { minimum: 0 } }, "Integer with a numeric lower bound (the meta-model's own version>=1 / order>=0 shape)."),
  F("ratio", { datatype: "number", constraints: { minimum: 0, maximum: 1 } }, "Number with numeric bounds."),
  F("active", { datatype: "boolean" }, "Boolean."),
  F("due_date", { datatype: "date" }, "Date."),
  F("created_at", { datatype: "date-time" }, "Date-time."),
  F("status_inline", { datatype: "string", valueDomain: "closed", allowedValues: ["draft", "active", "archived"] }, "Closed string domain with an inline, field-fixed allowedValues set (former valueType:select)."),
  F("state_vocab", { datatype: "string", valueDomain: "closed", vocabularyRef: "28da3300-7f68-543a-8965-4e6743acc772" }, "Closed string domain bound to a configurable, package-managed Vocabulary; projects to a pure enum of its effective keys."),
  F("keywords", { datatype: "string", cardinality: "list", minItems: 1, maxItems: 5 }, "List cardinality with min/max items (former multiselect / repeatable)."),
  F("relation_type_selector", { datatype: "string", valueDomain: "closed", vocabularyRef: "bf2fcfd7-47a1-5495-a7fa-8969a500a160", cardinality: "list", minItems: 1 }, "RequiresRelation.relationType declaration: a list of relation-type keys from a configurable closed vocabulary (min 1) — NOT instance UUID refs."),
  F("guidance", { datatype: "ref", mode: "inline", cardinality: "single", rangeType: exactRef("ai_guidance") }, "Inline composite, single (2-level nesting via ai_guidance.examples)."),
  F("examples", { datatype: "ref", mode: "inline", cardinality: "list", rangeType: exactRef("ai_guidance_example") }, "Inline composite, list."),
  F("author_ref", { datatype: "ref", mode: "reference", cardinality: "single", rangeType: exactRef("author") }, "Reference composite, single — a target instance UUID (a value, not a Relation)."),
  F("reviewer_refs", { datatype: "ref", mode: "reference", cardinality: "list", rangeType: exactRef("author") }, "Reference composite, list — target instance UUIDs."),
  F("default_holder", { datatype: "dependent", dependsOn: "self" }, "Dependent value-of-self (the Field.defaultValue shape)."),
  F("meta", { datatype: "map", valueRange: "open" }, "Open extension bag (map, open value range)."),
  F("counts_by_key", { datatype: "map", valueRange: "integer" }, "Scalar-valued map (string key -> integer)."),
];
const byName = Object.fromEntries(FIELDS.map((f) => [f.name, f]));

// ---- build full, valid Field-definition objects (per docs/schema/2.0/field.json) ---------------
const fieldDef = (f) => ({
  $schema: "https://srs.semanticops.com/schema/2.0/field.json",
  id: f.id,
  namespace: NS,
  name: f.name,
  version: 1,
  description: f.purpose,
  aiGuidance: { purpose: f.purpose },
  fieldType: f.fieldType,
  createdAt: CREATED,
});

// ---- build Type definitions (per docs/schema/2.0/type.json) ------------------------------------
const assign = (fieldName, order, required = false) => ({ fieldId: byName[fieldName].id, order, required });
const typeDef = (name, description, fieldNames) => ({
  $schema: "https://srs.semanticops.com/schema/2.0/type.json",
  id: TYPES[name].id,
  namespace: NS,
  name,
  version: TYPES[name].version,
  description,
  fields: fieldNames.map((fn, i) => assign(fn, i, false)),
  createdAt: CREATED,
});

// Range Types need their own member Fields; add them to the fixture field set.
FIELDS.push(
  F("author_name", { datatype: "string", constraints: { minLength: 1 } }, "Author display name."),
  F("author_email", { datatype: "string", format: "email" }, "Author email."),
  F("example_output", { datatype: "string" }, "Example output text."),
);
Object.assign(byName, Object.fromEntries(FIELDS.map((f) => [f.name, f])));

const TYPE_DEFS = [
  typeDef("author", "A referenced author record.", ["author_name", "author_email"]),
  typeDef("ai_guidance_example", "An AiGuidance example.", ["example_output"]),
  // ai_guidance embeds an inline list of ai_guidance_example -> 2-level nesting.
  typeDef("ai_guidance", "AiGuidance with an inline example list.", ["plain_string", "examples"]),
  typeDef(
    "rfc032_showcase",
    "Exercises every fieldType mode.",
    FIELDS.filter((f) => !["author_name", "author_email", "example_output"].includes(f.name)).map((f) => f.name),
  ),
];

// ---- checks -------------------------------------------------------------------------------------
let pass = 0, fail = 0;
const ok = (label, cond, detail) => (cond ? (pass++, console.log(`  ✓ ${label}`)) : (fail++, console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`)));

const fieldSchema = await loadSchema(join(SCHEMA_DIR, "field.json"));
const typeSchema = await loadSchema(join(SCHEMA_DIR, "type.json"));

console.log("RFC-032 conformance fixture — every fieldType mode\n");
console.log("1) Field definitions validate against the live field.json + are R1–R11 conformant\n");
for (const f of FIELDS) {
  const def = fieldDef(f);
  const schemaErrs = validateJsonSchema(def, fieldSchema);
  const ruleErrs = validateFieldType(f.fieldType, { where: f.name });
  ok(`${f.name}`, schemaErrs.length === 0 && ruleErrs.length === 0, [...schemaErrs, ...ruleErrs].join("; "));
}

console.log("\n2) Type definitions validate against the live type.json\n");
for (const t of TYPE_DEFS) {
  const errs = validateJsonSchema(t, typeSchema);
  ok(`${t.name}`, errs.length === 0, errs.join("; "));
}

// ---- projections (Change G) -> goldens ----------------------------------------------------------
console.log("\n3) Change-G projections match committed goldens\n");
const projectOne = (ft) => {
  // resolve ref range + vocab enum for gen-time projection (mirrors #259)
  const eff = { ...ft };
  if (ft.datatype === "ref") eff.rangeType = resolveRange(ft.rangeType);
  if (ft.datatype === "string" && ft.valueDomain === "closed" && ft.vocabularyRef) eff._resolvedVocabKeys = VOCAB[ft.vocabularyRef];
  return projectField(eff);
};
const projections = {};
for (const f of FIELDS) projections[f.name] = projectOne(f.fieldType);

const goldenPath = join(HERE, "goldens", "projections.json");
if (UPDATE) {
  await mkdir(join(HERE, "goldens"), { recursive: true });
  await writeFile(goldenPath, JSON.stringify(projections, null, 2) + "\n", "utf8");
  console.log("  (goldens written)");
}
if (existsSync(goldenPath)) {
  const golden = JSON.parse(await readFile(goldenPath, "utf8"));
  for (const f of FIELDS) {
    ok(`${f.name} projection`, JSON.stringify(projections[f.name]) === JSON.stringify(golden[f.name]), `got ${JSON.stringify(projections[f.name])}\n      want ${JSON.stringify(golden[f.name])}`);
  }
} else {
  ok("goldens present", false, "run with --update to create tests/rfc-032/goldens/projections.json");
}

// ---- instance-level enforcement (scalar + reference-mode only; inline-composite is #242) --------
console.log("\n4) The showcase Type's projected object schema accepts valid / rejects invalid instances\n");
// Build the object schema for the storable subset of the showcase Type.
const STORABLE = FIELDS.filter((f) => {
  if (["author_name", "author_email", "example_output"].includes(f.name)) return false;
  if (f.fieldType.datatype === "dependent") return false; // value-of-self, no standalone carrier here
  return true;
});
// RFC-039 (srs#242): an inline-composite value is a fieldValues map for the
// range Type, recursively — so the projected object schema composes the range
// Type's own object schema in place ([R3]/[R17]), instead of excluding the
// field as the pre-#242 fixture did.
const composeFieldSchema = (ft) => {
  if (ft.datatype === "ref" && (ft.mode ?? "inline") === "inline") {
    const rangeName = Object.keys(TYPES).find((n) => TYPES[n].id === ft.rangeType.typeId);
    const rangeDef = TYPE_DEFS.find((t) => t.name === rangeName);
    const inner = { type: "object", additionalProperties: false, properties: {}, required: [] };
    for (const fa of rangeDef.fields) {
      const member = FIELDS.find((f) => fieldDef(f).id === fa.fieldId);
      inner.properties[member.name] = composeFieldSchema(member.fieldType);
      if (fa.required) inner.required.push(member.name);
    }
    if (inner.required.length === 0) delete inner.required;
    if (ft.cardinality === "list") {
      const arr = { type: "array", items: inner };
      if (ft.minItems != null) arr.minItems = ft.minItems;
      if (ft.maxItems != null) arr.maxItems = ft.maxItems;
      return arr;
    }
    return inner;
  }
  return projectOne(ft);
};
const objSchema = { type: "object", additionalProperties: false, properties: {} };
for (const f of STORABLE) objSchema.properties[f.name] = composeFieldSchema(f.fieldType);

const validInstance = {
  plain_string: "hello",
  markdown_body: "# Title",
  homepage: "https://example.com",
  title_constrained: "A valid title",
  code_pattern: "ABC1",
  count: 3,
  ratio: 0.5,
  active: true,
  due_date: "2026-07-29",
  created_at: "2026-07-29T12:00:00Z",
  status_inline: "active",
  state_vocab: "draft",
  keywords: ["alpha", "beta"],
  relation_type_selector: ["supersedes"],
  author_ref: "aaaaaaaa-0000-4000-8000-000000000001",
  reviewer_refs: ["bbbbbbbb-0000-4000-8000-000000000002"],
  meta: { anything: 1, nested: { x: true } },
  counts_by_key: { a: 1, b: 2 },
  // RFC-039 [R3]: an inline-composite value IS a fieldValues map for the range
  // Type, recursively — `guidance` nests two levels (ai_guidance.examples is
  // itself an inline-composite list). This is the instance golden RFC-032
  // deferred to #242.
  guidance: {
    plain_string: "Demonstrate the recursive carrier.",
    examples: [
      { example_output: "a table" },
      { example_output: "a longer table" },
    ],
  },
  examples: [
    { example_output: "rendered" },
  ],
};
const invalidInstance = {
  ...validInstance,
  status_inline: "not-a-status",       // enum violation
  count: -1,                            // minimum violation
  code_pattern: "lowercase",           // pattern violation
  relation_type_selector: [],          // minItems:1 violation
};
ok("valid instance accepted (0 errors)", validJson(validInstance).length === 0, validJson(validInstance).join("; "));
const badErrs = validJson(invalidInstance);
ok("invalid instance rejected (>=4 distinct violations)", badErrs.length >= 4, `errors: ${badErrs.join("; ")}`);

function validJson(instance) {
  return validateJsonSchema(instance, objSchema);
}

// ---- emit reviewable artifacts ------------------------------------------------------------------
await mkdir(join(HERE, "package", "fields"), { recursive: true });
await mkdir(join(HERE, "package", "types"), { recursive: true });
await mkdir(join(HERE, "records"), { recursive: true });
for (const f of FIELDS) await writeFile(join(HERE, "package", "fields", `${f.name}.json`), JSON.stringify(fieldDef(f), null, 2) + "\n", "utf8");
for (const t of TYPE_DEFS) await writeFile(join(HERE, "package", "types", `${t.name}.json`), JSON.stringify(t, null, 2) + "\n", "utf8");
await writeFile(join(HERE, "records", "showcase-instance.json"), JSON.stringify({
  $schema: "https://srs.semanticops.com/schema/2.0/record.json",
  instanceId: "cccccccc-0000-4000-8000-000000000009",
  typeId: TYPES.rfc032_showcase.id,
  typeNamespace: NS,
  typeName: "rfc032_showcase",
  typeVersion: 1,
  fieldValues: validInstance,
  createdAt: CREATED,
}, null, 2) + "\n", "utf8");

console.log(`\n${fail === 0 ? "PASS" : "FAIL"}: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
