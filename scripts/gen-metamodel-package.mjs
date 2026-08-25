#!/usr/bin/env node
/**
 * gen-metamodel-package.mjs — deterministic generator for the RFC-033 frozen-seed
 * meta-model package `com.semanticops.srs/metamodel`.
 *
 * The meta-model (Field, Type, FieldAssignment, FieldType, ExactTypeRef,
 * FieldTypeConstraints, AiGuidance, AiGuidanceExample, Lineage, Provenance, ...) is
 * HAND-AUTHORED here as a compact spec and emitted to srs/package/metamodel/ as
 * field/type definition files that validate against docs/schema/2.0/{field,type}.json.
 *
 * This is the frozen seed's authoring source (the RFC-029 discipline: a deterministic
 * build script + committed output + a `--check` rebuild test). It is NOT the #259
 * emitter (records -> JSON Schema); it is the inverse authoring step (hand-specified
 * fieldTypes -> definition files), because the seed->records direction is lossy and
 * therefore authored, not mechanically inverted.
 *
 * Usage:
 *   node scripts/gen-metamodel-package.mjs           # write files
 *   node scripts/gen-metamodel-package.mjs --check    # fail if committed output drifts
 *
 * Pure/deterministic: no clocks, no randomness. createdAt is a fixed epoch constant.
 *
 * UUID pinning (RFC-040 Unit 1, srs#477): every field/type spec below names its OWN pinned
 * `n` explicitly — never derived from array position. Numbers are append-only and never
 * recycled: removing an entry retires its number (a comment names what claimed it), so a
 * later addition can never silently renumber — and thereby reassign the UUID of — a survivor.
 * This replaces the pre-#477 `fieldUuid(i + 1)` positional derivation (the `4a000001` lesson,
 * #295, applied here to the `4b`/`4c` series after the audit in RFC-040's opening move found it
 * could not survive the removals this same train makes).
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PKG_DIR = join(ROOT, 'srs/package/metamodel');
const NS = 'com.semanticops.srs';
const CREATED_AT = '2026-07-29T00:00:00Z';
const CHECK = process.argv.includes('--check');

// Pinned, patterned UUIDs (RFC-033 Change A): 4a=package, 4b=fields, 4c=types.
const hex6 = (n) => n.toString(16).padStart(6, '0');
const hex12 = (n) => n.toString(16).padStart(12, '0');
const fieldUuid = (n) => `4b${hex6(n)}-0000-4000-a000-${hex12(n)}`;
const typeUuid = (n) => `4c${hex6(n)}-0000-4000-a000-${hex12(n)}`;
// RFC-033 Change A pinned `4a000001` without checking whether the shared 4a package series was
// free — it was not, and the id collided with com.semanticops.spec/spec-authoring-core (#295).
// Taken already: `4a000001` spec-authoring-core, `4a000002` spec-rfc-process, `4a000003` RFC-004's
// proposed spec-authoring-json-schema (superseded, never installed — but a claimed id is not
// recycled). `4a000004` is the first slot no tree in this repo has ever claimed.
const PACKAGE_ID = '4a000004-0000-4000-a000-000000000004';

// ---------------------------------------------------------------------------------------------
// TYPES — the ten self-hosted meta-model entities (Change A table order pinned the original 4c
// numbering 1-10; explicit per RFC-040 Unit 1, append-only from here).
// ---------------------------------------------------------------------------------------------
const TYPE_ORDER = [
  [1, 'field'],
  [2, 'type'],
  [3, 'field-assignment'],
  [4, 'field-type'],
  [5, 'exact-type-ref'],
  [6, 'field-type-constraints'],
  [7, 'ai-guidance'],
  [8, 'ai-guidance-example'],
  [9, 'lineage'],
  [10, 'provenance'],
];
const typeIdByName = Object.fromEntries(TYPE_ORDER.map(([n, name]) => [name, typeUuid(n)]));
const ref = (typeName, mode, cardinality, extra) => {
  const ft = { datatype: 'ref', mode, cardinality, rangeType: { typeId: typeIdByName[typeName], typeVersion: 1 } };
  if (cardinality === 'single') delete ft.cardinality; // single is the default (minimal diff)
  return extra ? { ...ft, ...extra } : ft;
};
const closed = (values) => ({ datatype: 'string', valueDomain: 'closed', allowedValues: values });

// ---------------------------------------------------------------------------------------------
// FIELDS — shared atomic vocabulary (define-once / reference-many; dedup by first appearance).
// Each entry: [n, name, ft, description, purpose?]. `n` is the pinned 4b number — explicit,
// append-only, never recycled (RFC-040 Unit 1).
// ---------------------------------------------------------------------------------------------
const FIELD_SPECS = [
  // -- common identity/lineage-agnostic fields, shared across entities --
  [1, 'id', { datatype: 'string', format: 'uuid' }, 'Globally unique, stable UUID identity of this entity.'],
  [2, 'namespace', { datatype: 'string' }, 'Reverse-DNS logical grouping.'],
  [3, 'name', { datatype: 'string' }, 'Machine-readable name within the namespace; snake_case.'],
  [4, 'version', { datatype: 'integer', constraints: { minimum: 1 } }, 'Positive integer version within the UUID lineage.'],
  [5, 'description', { datatype: 'string' }, 'Human-readable description of this entity.'],
  [6, 'created_at', { datatype: 'date-time' }, 'ISO-8601 creation timestamp.'],
  // -- Field entity --
  [7, 'instructions', { datatype: 'string' }, 'Fuller guidance for a human completing this field.'],
  [8, 'ai_guidance', ref('ai-guidance', 'inline', 'single'), 'Inline LLM guidance for extracting/populating this field or type.'],
  [9, 'field_type', ref('field-type', 'inline', 'single'), 'The decomposed value type (RFC-032): datatype x cardinality x value-domain x format x constraints.'],
  [10, 'default_value', { datatype: 'dependent', dependsOn: 'self' }, 'Default value conforming to this field\'s own fieldType (value-of-self dependent).'],
  [11, 'tags', { datatype: 'string', cardinality: 'list' }, 'Free-form classification tags.'],
  [12, 'lineage', ref('lineage', 'inline', 'single'), 'Fork/copy history of this definition.'],
  [13, 'provenance', ref('provenance', 'inline', 'single'), 'Import provenance of this definition.'],
  [14, 'deprecated_at', { datatype: 'date-time' }, 'ISO-8601 timestamp at which this definition was deprecated.'],
  // -- FieldType --
  [15, 'datatype', closed(['string', 'number', 'integer', 'boolean', 'date', 'date-time', 'ref', 'dependent', 'map']), 'The base datatype facet (RFC-032 Change A).'],
  [16, 'cardinality', closed(['single', 'list']), 'Whether the field holds one value or an ordered list. Default single.'],
  [17, 'min_items', { datatype: 'integer', constraints: { minimum: 0 } }, 'Minimum list length (cardinality == list only).'],
  [18, 'max_items', { datatype: 'integer', constraints: { minimum: 0 } }, 'Maximum list length (cardinality == list only).'],
  [19, 'value_domain', closed(['open', 'closed']), 'Whether a string field is open or bound to a closed vocabulary. datatype == string only.'],
  [20, 'allowed_values', { datatype: 'string', cardinality: 'list' }, 'Inline, field-fixed closed vocabulary (valueDomain == closed).'],
  [21, 'vocabulary_ref', { datatype: 'string', constraints: { pattern: '^[^/@]+/[^/@]+@[0-9]+$' } }, 'RFC-006 Reference (namespace/name@version) to a mode:closed configurable Vocabulary.'],
  [22, 'format', closed(['plain', 'markdown', 'uri', 'uuid', 'email']), 'Semantic string format (JSON-Schema-aligned). datatype == string only.'],
  [23, 'constraints', ref('field-type-constraints', 'inline', 'single'), 'Datatype-appropriate value constraints (min/max length, pattern, numeric bounds).'],
  [24, 'range_type', ref('exact-type-ref', 'inline', 'single'), 'The Type this field\'s range is (datatype == ref only).'],
  [25, 'mode', closed(['inline', 'reference']), 'inline = nested object(s); reference = target instance id(s). datatype == ref only, fixed per Field.'],
  [26, 'depends_on', { datatype: 'string' }, '"self" or a sibling field name whose type the value conforms to (datatype == dependent only).'],
  [27, 'value_range', closed(['string', 'number', 'integer', 'boolean', 'date', 'date-time', 'open']), 'The scalar value datatype of a map, or "open" for a true extension bag. datatype == map only.'],
  // -- FieldTypeConstraints --
  [28, 'min_length', { datatype: 'integer', constraints: { minimum: 0 } }, 'Minimum string length (datatype == string).'],
  [29, 'max_length', { datatype: 'integer', constraints: { minimum: 0 } }, 'Maximum string length (datatype == string).'],
  [30, 'pattern', { datatype: 'string' }, 'An ECMA-262 regular expression (datatype == string).'],
  [31, 'minimum', { datatype: 'number' }, 'Inclusive numeric lower bound (datatype == number/integer).'],
  [32, 'maximum', { datatype: 'number' }, 'Inclusive numeric upper bound (datatype == number/integer).'],
  // -- ExactTypeRef --
  [33, 'type_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID of the referenced Type.'],
  [34, 'type_version', { datatype: 'integer', constraints: { minimum: 1 } }, 'Version of the Type this ref targets (version-exact anchor).'],
  // -- AiGuidance --
  [35, 'purpose', { datatype: 'string' }, 'What this field/type captures (1-2 sentences).'],
  [36, 'extraction', { datatype: 'string' }, 'LLM instruction for how to extract or populate.'],
  [37, 'negative_guidance', { datatype: 'string' }, 'What the LLM must NOT include or do.'],
  [38, 'examples', ref('ai-guidance-example', 'inline', 'list'), 'Worked examples for the guidance.'],
  // -- AiGuidanceExample --
  [39, 'input', { datatype: 'string' }, 'Example input text.'],
  [40, 'output', { datatype: 'string' }, 'Expected output for the example input.'],
  // -- Lineage --
  [41, 'source_definition_id', { datatype: 'string', format: 'uuid' }, 'UUID of the definition this one was derived from.'],
  [42, 'source_version', { datatype: 'integer' }, 'Version of the source definition.'],
  [43, 'forked_from_definition_id', { datatype: 'string', format: 'uuid' }, 'UUID of the definition this one was forked from.'],
  [44, 'forked_from_version', { datatype: 'integer' }, 'Version of the forked-from definition.'],
  // -- Provenance --
  [45, 'publisher', { datatype: 'string' }, 'Publisher of the source package.'],
  [46, 'source_package', { datatype: 'string' }, 'Identifier of the package this definition was imported from.'],
  [47, 'package_version', { datatype: 'string' }, 'Version of the source package.'],
  [48, 'imported_at', { datatype: 'date-time' }, 'ISO-8601 timestamp at which this definition was imported.'],
  // -- Type entity (core facets) --
  [49, 'semantic_object_type', { datatype: 'string' }, 'Optional canonical semantic classification (e.g. "decision", "policy").'],
  [50, 'fields', ref('field-assignment', 'inline', 'list'), 'Ordered list of FieldAssignments that make up this Type.'],
  // -- FieldAssignment --
  [51, 'field_id', ref('field', 'reference', 'single'), 'References a Field by its stable id (reference mode closes the metacircular loop).'],
  [52, 'order', { datatype: 'integer', constraints: { minimum: 0 } }, 'The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).'],
  [53, 'required', { datatype: 'boolean' }, 'Whether this field must be populated before a Record can be logged.'],
  [54, 'display_label', { datatype: 'string' }, 'Context-specific label override for this field within this Type.'],
  [55, 'assignment_default_value', { datatype: 'dependent', dependsOn: 'field_id' }, 'Optional default value conforming to the referenced Field\'s type.'],
];
const fieldIdByName = {};
for (const [n, name] of FIELD_SPECS) fieldIdByName[name] = fieldUuid(n);

// ---------------------------------------------------------------------------------------------
// TYPE DEFINITIONS — each Type's ordered FieldAssignments (field-name, required, optional label).
// ---------------------------------------------------------------------------------------------
const a = (name, required, label) => ({ name, required, label });
const TYPE_SPECS = {
  field: {
    description: 'The atomic semantic unit of SRS. A reusable field definition (RFC-033 self-hosted meta-model).',
    purpose: 'Describes a single SRS Field: its identity, its decomposed value type, and its AI guidance.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true),
      a('description', true), a('instructions', false), a('ai_guidance', true, 'AI Guidance'),
      a('field_type', true, 'Field Type'), a('default_value', false), a('tags', false),
      a('lineage', false), a('provenance', false), a('deprecated_at', false), a('created_at', true),
    ],
  },
  type: {
    description: 'A named, versioned composition of Fields (core definition facets; RFC-033 v1.0.0 defers lifecycle/inheritance/cross-field/field-groups/identity).',
    purpose: 'Describes an SRS Type: its identity and its ordered FieldAssignments.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true),
      a('description', true), a('semantic_object_type', false, 'Semantic Object Type'),
      a('ai_guidance', false, 'AI Guidance'), a('fields', true), a('created_at', true),
    ],
  },
  'field-assignment': {
    description: 'A Field\'s use inside a Type: the reference-mode edge that closes the metacircular loop.',
    purpose: 'Describes how one Field participates in a Type (order, requiredness, label).',
    assignments: [
      a('field_id', true, 'Field'), a('order', true), a('required', true),
      a('display_label', false, 'Display Label'), a('assignment_default_value', false, 'Default Value'),
    ],
  },
  'field-type': {
    description: 'The decomposed value type (RFC-032): datatype x cardinality x value-domain x format x constraints. The recursive heart of the meta-model.',
    purpose: 'Describes a Field\'s value model, including composite ranges (datatype: ref -> another Type).',
    assignments: [
      a('datatype', true), a('cardinality', false), a('min_items', false, 'Min Items'),
      a('max_items', false, 'Max Items'), a('value_domain', false, 'Value Domain'),
      a('allowed_values', false, 'Allowed Values'), a('vocabulary_ref', false, 'Vocabulary Ref'),
      a('format', false), a('constraints', false), a('range_type', false, 'Range Type'),
      a('mode', false), a('depends_on', false, 'Depends On'), a('value_range', false, 'Value Range'),
    ],
  },
  'exact-type-ref': {
    description: 'A version-exact reference to a Type in the package (RFC-009 ExactTypeRef).',
    purpose: 'Names a Type by UUID + exact version.',
    assignments: [a('type_id', true, 'Type Id'), a('type_version', true, 'Type Version')],
  },
  'field-type-constraints': {
    description: 'Datatype-appropriate value constraints carried by a FieldType (RFC-032 Change F).',
    purpose: 'The fixed-shape constraints bag: string length/pattern and numeric bounds.',
    assignments: [
      a('min_length', false, 'Min Length'), a('max_length', false, 'Max Length'),
      a('pattern', false), a('minimum', false), a('maximum', false),
    ],
  },
  'ai-guidance': {
    description: 'LLM guidance for extracting or populating a Field or matching a Type.',
    purpose: 'Carries purpose, extraction/negative guidance, and worked examples.',
    assignments: [
      a('purpose', true), a('extraction', false), a('negative_guidance', false, 'Negative Guidance'),
      a('examples', false),
    ],
  },
  'ai-guidance-example': {
    description: 'One worked example within an AiGuidance.',
    purpose: 'Pairs an optional description + input with an expected output.',
    assignments: [a('description', false), a('input', false), a('output', true)],
  },
  lineage: {
    description: 'The fork/copy history of a definition.',
    purpose: 'Tracks where a Field/Type definition was derived or forked from.',
    assignments: [
      a('source_definition_id', false, 'Source Definition Id'), a('source_version', false, 'Source Version'),
      a('forked_from_definition_id', false, 'Forked-From Definition Id'), a('forked_from_version', false, 'Forked-From Version'),
    ],
  },
  provenance: {
    description: 'The import provenance of a definition.',
    purpose: 'Records the publisher, source package, and import time of a definition.',
    assignments: [
      a('publisher', false), a('source_package', false, 'Source Package'),
      a('package_version', false, 'Package Version'), a('imported_at', false, 'Imported At'),
    ],
  },
};

// ---------------------------------------------------------------------------------------------
// Emit.
// ---------------------------------------------------------------------------------------------
function fieldFile(name, ft, description, purpose) {
  return {
    $schema: 'https://srs.semanticops.com/schema/2.0/field.json',
    aiGuidance: { purpose },
    createdAt: CREATED_AT,
    description,
    id: fieldIdByName[name],
    name,
    namespace: NS,
    fieldType: ft,
    version: 1,
  };
}
function typeFile(name, spec) {
  const out = {
    $schema: 'https://srs.semanticops.com/schema/2.0/type.json',
    aiGuidance: { purpose: spec.purpose },
    createdAt: CREATED_AT,
    description: spec.description,
    fields: spec.assignments.map((asg, i) => {
      const fa = { fieldId: fieldIdByName[asg.name], order: i, required: asg.required };
      if (asg.label) fa.displayLabel = asg.label;
      return fa;
    }),
    id: typeIdByName[name],
    name,
    namespace: NS,
    version: 1,
  };
  if (spec.extendsTypeId) {
    out.extendsTypeId = spec.extendsTypeId;
    out.extendsTypeVersion = spec.extendsTypeVersion;
  }
  return out;
}
function packageIndex() {
  return {
    $schema: 'https://srs.semanticops.com/schema/2.0/package-manifest.json',
    createdAt: CREATED_AT,
    dataModelRevision: 2,
    description: 'The self-hosted SRS meta-model (RFC-033): Field, Type, FieldAssignment, and value-objects expressed as SRS Type definitions. Frozen-seed source for docs/schema/2.0/{field,type}.json.',
    fields: FIELD_SPECS.map(([, name]) => `fields/${name}.json`),
    id: PACKAGE_ID,
    name: 'metamodel',
    namespace: NS,
    status: 'active',
    title: 'SRS Meta-Model (frozen seed)',
    types: TYPE_ORDER.map(([, name]) => `types/${name}.json`),
    version: '1.0.0',
  };
}

const files = new Map();
files.set('package.json', packageIndex());
for (const [, name, ft, description, purpose] of FIELD_SPECS) {
  files.set(`fields/${name}.json`, fieldFile(name, ft, description, purpose ?? description));
}
for (const [, name] of TYPE_ORDER) {
  files.set(`types/${name}.json`, typeFile(name, TYPE_SPECS[name]));
}

const serialize = (obj) => JSON.stringify(obj, null, 2) + '\n';

async function writeAll() {
  await rm(PKG_DIR, { recursive: true, force: true });
  await mkdir(join(PKG_DIR, 'fields'), { recursive: true });
  await mkdir(join(PKG_DIR, 'types'), { recursive: true });
  for (const [rel, obj] of files) await writeFile(join(PKG_DIR, rel), serialize(obj));
  console.log(`✓ wrote ${files.size} files to srs/package/metamodel/ (1 package.json, ${FIELD_SPECS.length} fields, ${TYPE_ORDER.length} types)`);
}

async function check() {
  let drift = 0;
  for (const [rel, obj] of files) {
    let onDisk;
    try { onDisk = await readFile(join(PKG_DIR, rel), 'utf8'); }
    catch { console.error(`✗ missing: ${rel}`); drift++; continue; }
    if (onDisk !== serialize(obj)) { console.error(`✗ drift: ${rel}`); drift++; }
  }
  // detect stray files not in the generated set
  for (const sub of ['fields', 'types']) {
    let entries = [];
    try { entries = await readdir(join(PKG_DIR, sub)); } catch { /* dir absent handled above */ }
    for (const e of entries) if (!files.has(`${sub}/${e}`)) { console.error(`✗ stray: ${sub}/${e}`); drift++; }
  }
  if (drift) { console.error(`\n✗ metamodel package drift: ${drift} file(s) differ. Run: node scripts/gen-metamodel-package.mjs`); process.exit(1); }
  console.log(`✓ metamodel package in sync (${files.size} files)`);
}

if (CHECK) await check(); else await writeAll();
