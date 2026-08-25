#!/usr/bin/env node
/**
 * rfc-033-closure-test.mjs — bootstrap-closure demonstration for RFC-033 [R4](a).
 *
 * Projects each in-scope metamodel Field's `fieldType` through the RFC-032 `projectField`
 * stand-in (scripts/lib/rfc-032-fieldtype.mjs) and diffs the result against the corresponding
 * fragment of the FROZEN SEED (docs/schema/2.0/field.json, type.json):
 *
 *   - AUTHORITATIVE features (scalar/format/enum/constraint/list) MUST match the seed fragment
 *     byte-for-byte after stripping prose annotations (description/$comment/deprecated).
 *   - APPROXIMATED features (datatype ref/dependent/map — per metamodel-fidelity.md) are asserted
 *     to render in the DOCUMENTED lossy shape ($ref / uuid+x-srs-range-type / broad {} / object+
 *     additionalProperties) and are NOT required to equal the seed (the emitter-owned $defs key and
 *     the seed's inline-vs-$ref choice legitimately differ — RFC-032 Change G; #259 owns the key).
 *
 * This demonstrates closure NOW with the stand-in; full byte-for-byte emitter equality is #259.
 * Runs under scripts/validate-all.mjs. No binary (ADR-004).
 */
import { readFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { projectField, rangeDefKey } from './lib/rfc-032-fieldtype.mjs';
import { loadPackage, effectiveFields } from './lib/schema-emitter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MM = join(ROOT, 'srs/package/metamodel');
const SEED = join(ROOT, 'docs/schema/2.0');

const load = async (p) => JSON.parse(await readFile(p, 'utf8'));
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
// `default` (RFC-040 Unit 1, srs#477): a JSON-Schema ANNOTATION keyword — it never affects validation.
// The model deliberately has no default mechanism at any definition-layer site (Change D); Unit 3
// dropped the two seed sites that carried it (RequiresRelation.direction/enforcement) when the seed
// was regenerated to the emitter's canonical form, so this strip is now belt-and-suspenders.
// `title`/`description` at the ASSIGNMENT level (Change C annotation projection, RFC-040 Unit 3) are
// added by `emitBody` (FieldAssignment.displayLabel/.description), a layer above what this test
// exercises (`projectField(field.fieldType)` alone) — stripped here so this test stays scoped to the
// raw fieldType fragment; whole-entity title/description projection is rfc-035-closure-test's job.
const ANNOT = new Set(['description', 'title', '$comment', 'deprecated', 'default']);
function strip(schema) {
  if (Array.isArray(schema)) return schema.map(strip);
  if (schema && typeof schema === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(schema)) if (!ANNOT.has(k)) out[k] = strip(v);
    return out;
  }
  return schema;
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Correspondence: metamodel Type -> the seed properties bag it self-hosts.
// nameOverride maps a metamodel field name to a differently-named seed property.
// skip lists metamodel fields with no seed counterpart (deferred/renamed carriers).
// `$defsPointer(t)` computes the emitter-owned $defs key (RFC-040 Unit 3, srs#479: the frozen seed's
// $defs keys were renamed from ad hoc PascalCase to this one emitter-owned spelling as part of ending
// $ref-resolution in the byte-closure comparison — the committed layout now equals the emitter's).
const $defsPointer = (t) => ['$defs', rangeDefKey({ namespace: 'com.semanticops.srs', name: t, version: 1 })];
async function seedProps(spec) {
  const doc = await load(join(SEED, spec.file));
  let node = doc;
  for (const seg of spec.pointer) node = node[seg];
  return node.properties;
}
const CORRESPONDENCES = [
  { type: 'field', file: 'field.json', pointer: [] },
  { type: 'field-type', file: 'field.json', pointer: $defsPointer('field-type') },
  { type: 'exact-type-ref', file: 'field.json', pointer: $defsPointer('exact-type-ref') },
  { type: 'field-type-constraints', file: 'field.json', pointer: $defsPointer('field-type-constraints') },
  { type: 'ai-guidance', file: 'field.json', pointer: $defsPointer('ai-guidance') },
  { type: 'ai-guidance-example', file: 'field.json', pointer: $defsPointer('ai-guidance-example') },
  { type: 'lineage', file: 'field.json', pointer: $defsPointer('lineage') },
  { type: 'provenance', file: 'field.json', pointer: $defsPointer('provenance') },
  // `type`'s effective fields (core + every extending facet Type, single-level, RFC-040 Change A) are
  // substituted in below (`effective: true`) — the frozen seed is one flat object; the metamodel
  // deliberately is not. See rfc-035-closure-test.mjs / schema-emitter.mjs `withEffectiveType` for why.
  { type: 'type', file: 'type.json', pointer: [], effective: true },
  { type: 'field-assignment', file: 'type.json', pointer: $defsPointer('field-assignment') },
  // -- RFC-040 Unit 1 (srs#477) Change B: the seven type.json value objects. --
  { type: 'type-lifecycle', file: 'type.json', pointer: $defsPointer('type-lifecycle'), nameOverride: { initial_state: 'initialState' } },
  { type: 'lifecycle-state', file: 'type.json', pointer: $defsPointer('lifecycle-state'), nameOverride: { is_initial: 'isInitial', is_final: 'isFinal', requires_relation: 'requiresRelation' } },
  { type: 'requires-relation', file: 'type.json', pointer: $defsPointer('requires-relation'), nameOverride: { relation_type: 'relationType' } },
  { type: 'lifecycle-transition', file: 'type.json', pointer: $defsPointer('lifecycle-transition'), nameOverride: { transition_name: 'name' } },
  { type: 'field-assignment-override', file: 'type.json', pointer: $defsPointer('field-assignment-override'), nameOverride: { display_label: 'displayLabel', display_hint: 'displayHint' } },
  // RFC-040 Unit 3: `effect` is modelled as a plain closed field (not a ref — CrossFieldRuleEffect
  // cannot become a Type, it is a bare enum), and the emitter now projects it inline; the seed's
  // former separate `$defs.CrossFieldRuleEffect` (never referenced by anything else) is retired along
  // with it, so `effect` compares directly like any other authoritative property — no skip needed.
  { type: 'cross-field-rule', file: 'type.json', pointer: $defsPointer('cross-field-rule'), nameOverride: { kind: 'type', predicate_field_id: 'predicateFieldId', predicate_value: 'predicateValue', target_field_id: 'targetFieldId', field_ids: 'fieldIds' } },
];

// id -> name index over the metamodel package fields (built once).
let ID_INDEX = null;
async function fieldNameForId(id) {
  if (!ID_INDEX) {
    ID_INDEX = {};
    const pkg = await load(join(MM, 'package.json'));
    for (const rel of pkg.fields) {
      const f = await load(join(MM, rel));
      ID_INDEX[f.id] = f.name;
    }
  }
  return ID_INDEX[id];
}

let pass = 0, fail = 0, approx = 0, skipped = 0;
const fails = [];

function isApproximated(ft) {
  return ft.datatype === 'ref' || ft.datatype === 'dependent' || ft.datatype === 'map';
}
function documentedShapeOk(ft, got) {
  if (ft.datatype === 'dependent') return eq(got, {});
  if (ft.datatype === 'map') return got.type === 'object' && 'additionalProperties' in got;
  if (ft.datatype === 'ref') {
    // a list wraps the core shape in {type:array, items:...}; unwrap for the shape check.
    const core = ft.cardinality === 'list' ? (got.type === 'array' ? got.items : null) : got;
    if (!core) return false;
    if (ft.mode === 'reference') return core.type === 'string' && core.format === 'uuid' && 'x-srs-range-type' in core;
    return typeof core.$ref === 'string'; // inline -> $ref (key is emitter-owned)
  }
  return false;
}

const ctx = loadPackage(MM);

for (const corr of CORRESPONDENCES) {
  const typeDef = await load(join(MM, `types/${corr.type}.json`));
  const props = await seedProps(corr);
  const fields = corr.effective ? effectiveFields(ctx, corr.type) : typeDef.fields;
  for (const asg of fields) {
    const field = await load(join(MM, `fields/${await fieldNameForId(asg.fieldId)}.json`));
    const camel = corr.nameOverride?.[field.name] ?? snakeToCamel(field.name);
    if (corr.skip?.includes(field.name)) { skipped++; continue; }
    const seedProp = props[camel];
    if (!seedProp) { skipped++; continue; } // deferred/presentation field with no seed counterpart
    const got = projectField(field.fieldType);
    if (isApproximated(field.fieldType)) {
      if (documentedShapeOk(field.fieldType, got)) { approx++; }
      else { fail++; fails.push(`${corr.type}.${field.name}: approximated shape wrong -> ${JSON.stringify(got)}`); }
      continue;
    }
    const want = strip(seedProp);
    if (eq(got, want)) pass++;
    else { fail++; fails.push(`${corr.type}.${field.name} (seed ${camel}): AUTHORITATIVE mismatch\n    got : ${JSON.stringify(got)}\n    seed: ${JSON.stringify(want)}`); }
  }
}

console.log(`RFC-033 bootstrap closure (projectField vs frozen seed):`);
console.log(`  authoritative matches : ${pass}`);
console.log(`  approximated (documented lossy shape) : ${approx}`);
console.log(`  skipped (deferred/presentation/no seed counterpart) : ${skipped}`);
if (fail) {
  console.error(`\n✗ ${fail} closure failure(s):`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n✓ closure holds: every authoritative fieldType projects to its frozen-seed fragment; approximated features render in the documented lossy shape.`);
