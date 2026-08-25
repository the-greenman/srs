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
  // -- RFC-040 Unit 1 (srs#477) Change B: the seven type.json $defs value objects. (CrossFieldRuleEffect
  // is the eighth — it is a bare string enum, not an object, so it cannot become a Type; it is modelled
  // as the `effect` Field's own closed value domain instead — see cross-field-rule below.)
  [11, 'type-lifecycle'],
  [12, 'lifecycle-state'],
  [13, 'requires-relation'],
  [14, 'lifecycle-transition'],
  [15, 'field-assignment-override'],
  [16, 'cross-field-rule'],
  // -- Change A: extension-owned Type facets, modelled as separate Types extending core `type` via
  // ext:type-inheritance (I-39..43) rather than flattened onto it (Decision 1, #273 2026-07-31).
  [17, 'lifecycle-facet'],
  [18, 'inheritance-facet'],
  [19, 'cross-field-validation-facet'],
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
  // 10: `default_value` — REMOVED (RFC-040 Change D, srs#477; 0225099b, srs#234 2026-08-08). Never reused.
  [11, 'tags', { datatype: 'string', cardinality: 'list' }, 'Free-form classification tags.'],
  [12, 'lineage', ref('lineage', 'inline', 'single'), 'Fork/copy history of this definition.'],
  [13, 'provenance', ref('provenance', 'inline', 'single'), 'Import provenance of this definition.'],
  // 14: `deprecated_at` — REMOVED (RFC-040 Change D, srs#477; srs#234 2026-08-08 ruling). Never reused.
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
  [49, 'semantic_object_type', { datatype: 'string' }, 'Optional canonical semantic classification (e.g. "decision", "policy"). Sanctioned-until-collapsed (#383, 2026-08-15): the collapse to a Type-keyed type-query executes at #272; do not add new consumers meanwhile.'],
  [50, 'fields', ref('field-assignment', 'inline', 'list'), 'Ordered list of FieldAssignments that make up this Type.'],
  // -- FieldAssignment --
  [51, 'field_id', ref('field', 'reference', 'single'), 'References a Field by its stable id (reference mode closes the metacircular loop).'],
  [52, 'order', { datatype: 'integer', constraints: { minimum: 0 } }, 'The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).'],
  [53, 'required', { datatype: 'boolean' }, 'Whether this field must be populated before a Record can be logged.'],
  [54, 'display_label', { datatype: 'string' }, 'Context-specific label override for this field within this Type.'],
  // 55: `assignment_default_value` — REMOVED (RFC-040 Change D, srs#477; 0225099b — explicitly supersedes
  // the #274 ledger's "Generate defaultValue" row). Never reused.
  // -- RFC-040 Unit 1 (srs#477) Change B: field.json's one remaining seed-only property. Presentation
  // (RFC-032 Rev 3), deliberately outside fieldType so 6523cf5e is not contradicted; description carries
  // the seed's own declaration verbatim.
  [56, 'editor_hint', closed(['singleline', 'textarea', 'rich-text', 'date-picker', 'dropdown', 'multi-select', 'voice']), 'Presentation only (not part of the type model — RFC-032). Suggested UI control; implementations and Views may override. Consolidated by the rendering follow-up #262.'],
  // -- LifecycleState --
  [57, 'key', { datatype: 'string' }, 'Machine-readable state key. Unified substrate field (was name pre-RFC-006).'],
  [58, 'label', { datatype: 'string' }, 'Human-readable display label for this lifecycle state.'],
  [59, 'aliases', { datatype: 'string', cardinality: 'list' }, 'Alternate keys this lifecycle state is also known by.'],
  [60, 'is_initial', { datatype: 'boolean' }, 'Whether this is the lifecycle\'s starting state (Invariant 4: exactly one initial state).'],
  [61, 'is_final', { datatype: 'boolean' }, 'Whether this is a terminal state of the lifecycle.'],
  [62, 'status', closed(['active', 'deprecated', 'tombstone', 'retired']), 'The VocabularyEntry status of this lifecycle state itself (distinct from the record-level status a Type\'s Records carry).'],
  [63, 'requires_relation', ref('requires-relation', 'inline', 'single'), 'RFC-022 relational-state obligation gating entry to this lifecycle state.'],
  [64, 'properties', { datatype: 'map', valueRange: 'open' }, 'Open extension bag for state- or transition-specific metadata not otherwise modelled.'],
  // -- TypeLifecycle --
  [65, 'states', ref('lifecycle-state', 'inline', 'list', { minItems: 1 }), 'The lifecycle\'s states; at least one, exactly one marked isInitial (Invariant 4).'],
  [66, 'transitions', ref('lifecycle-transition', 'inline', 'list'), 'The lifecycle\'s named state-to-state edges.'],
  [67, 'initial_state', { datatype: 'string' }, 'Must reference a state key with isInitial: true (Invariant 4).'],
  // -- LifecycleTransition --
  [68, 'from', { datatype: 'string' }, 'The source lifecycle state key this transition departs from.'],
  [69, 'to', { datatype: 'string' }, 'The target lifecycle state key this transition arrives at.'],
  [70, 'transition_name', { datatype: 'string' }, 'Human-readable name of this lifecycle transition.'],
  // -- RequiresRelation --
  [71, 'relation_type', { datatype: 'string', cardinality: 'list', minItems: 1, constraints: { minLength: 1 } }, 'Relation type(s) that satisfy the obligation (any-of interpretation, RFC-022).'],
  [72, 'direction', closed(['incoming', 'outgoing']), 'incoming: an edge whose target is the record. outgoing: an edge whose source is the record. Default incoming.'],
  [73, 'enforcement', closed(['hard', 'advisory']), 'hard (default): the transition MUST be rejected unless the obligation is satisfied. advisory: permitted, with an unsatisfied obligation surfaced only as a warning.'],
  // -- FieldAssignmentOverride --
  [74, 'display_hint', { datatype: 'string' }, 'Rendering-only hint text override for a single inherited FieldAssignment (presentation; stays per 6523cf5e).'],
  // -- CrossFieldRule (CrossFieldRuleEffect folds into `effect`'s own closed value domain) --
  [75, 'kind', closed(['conditional-required', 'field-ordering', 'mutual-exclusion', 'conditional-forbidden']), 'The kind of cross-field constraint.'],
  [76, 'message', { datatype: 'string' }, 'Optional human-readable description of the rule.'],
  [77, 'predicate_field_id', ref('field', 'reference', 'single'), 'Field whose value is tested (conditional-required); RFC-032 Rev-7 I-94.'],
  [78, 'predicate_value', { datatype: 'string' }, 'Value the predicate field must equal to activate the rule (conditional-required).'],
  [79, 'target_field_id', ref('field', 'reference', 'single'), 'Field that is constrained when the rule fires (conditional-required, field-ordering).'],
  [80, 'effect', closed(['must-precede', 'must-follow']), 'Ordering direction for a field-ordering rule: the predicate field must-precede or must-follow the target.'],
  [81, 'field_ids', { datatype: 'string', format: 'uuid', cardinality: 'list', minItems: 2 }, 'Fields of which at most one may be non-empty (mutual-exclusion).'],
  // -- Change A: ext:type-inheritance facet --
  [82, 'extends_type_id', { datatype: 'string', format: 'uuid' }, 'ext:type-inheritance — the UUID of the base Type this Type specializes.'],
  [83, 'extends_type_version', { datatype: 'integer', constraints: { minimum: 1 } }, 'ext:type-inheritance — the version of the base Type being extended.'],
  [84, 'field_order', { datatype: 'string', format: 'uuid', cardinality: 'list' }, 'ext:type-inheritance — explicit declared composition order for the merged (base + own) effective field list, overriding per-field FieldAssignment.order at the Type level.'],
  [85, 'field_assignment_overrides', ref('field-assignment-override', 'inline', 'list'), 'ext:type-inheritance — per-field overrides applied to inherited FieldAssignments.'],
  // -- Change A: ext:lifecycle facet --
  [86, 'lifecycle', ref('type-lifecycle', 'inline', 'single'), 'ext:lifecycle — inline state machine declaration. Mutually exclusive with lifecycleRef.'],
  [87, 'lifecycle_ref', { datatype: 'string' }, 'ext:lifecycle — reference to an installed Lifecycle by id. Mutually exclusive with lifecycle.'],
  // -- Change A: core Type surface (not extension-owned) --
  [88, 'identity_field_id', { datatype: 'string', format: 'uuid' }, 'RFC-020 — names one fieldId from this Type\'s effective field set as the record\'s identity/display field.'],
  // -- Change A: ext:cross-field-validation facet (RFC-019) --
  [89, 'validation_rules', ref('cross-field-rule', 'inline', 'list'), 'ext:cross-field-validation — cross-field validation rules applied to Records of this Type. Per I-97, this array is each Type\'s own complete and exclusive set; it is not inherited by value.'],
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
      a('field_type', true, 'Field Type'), a('editor_hint', false, 'Editor Hint'),
      a('tags', false), a('lineage', false), a('provenance', false), a('created_at', true),
    ],
  },
  type: {
    description: 'A named, versioned composition of Fields. Extension-owned facets (lifecycle, inheritance, cross-field-validation) are modelled as separate Types extending this one via ext:type-inheritance (RFC-040 Change A); tags and identityFieldId are core Type surface.',
    purpose: 'Describes an SRS Type: its identity and its ordered FieldAssignments.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true),
      a('description', true), a('semantic_object_type', false, 'Semantic Object Type'),
      a('ai_guidance', false, 'AI Guidance'), a('fields', true), a('tags', false),
      a('lineage', false), a('provenance', false), a('identity_field_id', false, 'Identity Field Id'),
      a('created_at', true),
    ],
  },
  'field-assignment': {
    description: 'A Field\'s use inside a Type: the reference-mode edge that closes the metacircular loop.',
    purpose: 'Describes how one Field participates in a Type (order, requiredness, label, contextual description).',
    assignments: [
      a('field_id', true, 'Field'), a('order', true), a('required', true),
      a('display_label', false, 'Display Label'), a('description', false),
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
  // -- RFC-040 Unit 1 (srs#477) Change B: the seven type.json value objects. --
  'type-lifecycle': {
    description: 'The inline lifecycle declaration: a state machine of LifecycleStates and LifecycleTransitions (ext:lifecycle).',
    purpose: 'Describes an inline Type.lifecycle value: its states, transitions, and initial state.',
    assignments: [
      a('states', true), a('transitions', true), a('initial_state', true, 'Initial State'),
    ],
  },
  'lifecycle-state': {
    description: 'A single lifecycle state (VocabularyEntry specialization; RFC-006 unified substrate — key was name pre-RFC-006).',
    purpose: 'Describes one state in a TypeLifecycle: its key, labels, and optional relational obligation.',
    assignments: [
      a('id', false), a('version', false), a('namespace', false), a('key', true),
      a('label', false), a('description', false), a('aliases', false),
      a('is_initial', false, 'Is Initial'), a('is_final', false, 'Is Final'),
      a('status', false), a('requires_relation', false, 'Requires Relation'),
      a('properties', false),
    ],
  },
  'requires-relation': {
    description: 'RFC-022 relational state: a record may only be in a lifecycle state if a relation satisfying this obligation exists.',
    purpose: 'Describes the relation-type obligation, direction, and enforcement strength that gates a lifecycle state.',
    assignments: [
      a('relation_type', true, 'Relation Type'), a('direction', false), a('enforcement', false),
    ],
  },
  'lifecycle-transition': {
    description: 'One named edge in a TypeLifecycle, from one state key to another.',
    purpose: 'Describes a lifecycle transition: its name and its from/to state keys.',
    assignments: [
      a('id', false), a('transition_name', true, 'Name'), a('from', true), a('to', true),
      a('description', false), a('properties', false),
    ],
  },
  'field-assignment-override': {
    description: 'ext:type-inheritance — an override applied to a single inherited FieldAssignment.',
    purpose: 'Describes a tighten-only required override plus rendering-only overrides (displayLabel, displayHint) for one inherited field.',
    assignments: [
      a('field_id', true, 'Field'), a('display_label', false, 'Display Label'),
      a('display_hint', false, 'Display Hint'), a('required', false),
    ],
  },
  'cross-field-rule': {
    description: 'ext:cross-field-validation — a constraint that validates a relationship between fields in a Record.',
    purpose: 'Describes one cross-field rule: its kind, the field(s) it examines, and its effect.',
    assignments: [
      a('kind', true, 'Kind'), a('message', false), a('predicate_field_id', false, 'Predicate Field'),
      a('predicate_value', false, 'Predicate Value'), a('target_field_id', false, 'Target Field'),
      a('effect', false), a('field_ids', false, 'Field Ids'),
    ],
  },
  // -- Change A: extension-owned Type facets, modelled as separate Types extending core `type` via
  // ext:type-inheritance (Decision 1, #273 2026-07-31). Each carries ONLY the properties its extension
  // contributes — never re-declaring an inherited fieldId (I-40) — and extends core `type` single-level
  // (I-39, I-97: no facet extends another facet; validationRules is never itself inherited by value).
  'lifecycle-facet': {
    description: 'ext:lifecycle — the lifecycle/lifecycleRef facet, contributed to Type by inheritance (RFC-040 Change A).',
    purpose: 'Models the two mutually exclusive properties ext:lifecycle contributes to a Type: the inline lifecycle or the referenced lifecycleRef.',
    extendsTypeId: typeIdByName.type,
    extendsTypeVersion: 1,
    assignments: [
      a('lifecycle', false), a('lifecycle_ref', false, 'Lifecycle Ref'),
    ],
  },
  'inheritance-facet': {
    description: 'ext:type-inheritance — the specialization facet, contributed to Type by inheritance (RFC-040 Change A).',
    purpose: 'Models the four properties ext:type-inheritance contributes to a Type: the base Type reference, the merged effective field order, and per-field overrides.',
    extendsTypeId: typeIdByName.type,
    extendsTypeVersion: 1,
    assignments: [
      a('extends_type_id', false, 'Extends Type Id'), a('extends_type_version', false, 'Extends Type Version'),
      a('field_order', false, 'Field Order'), a('field_assignment_overrides', false, 'Field Assignment Overrides'),
    ],
  },
  'cross-field-validation-facet': {
    description: 'ext:cross-field-validation (RFC-019) — the validationRules facet, contributed to Type by inheritance (RFC-040 Change A). Per I-97 the array is each Type\'s own complete and exclusive set; it is not inherited by value.',
    purpose: 'Models the one property ext:cross-field-validation contributes to a Type: its own array of CrossFieldRules.',
    extendsTypeId: typeIdByName.type,
    extendsTypeVersion: 1,
    assignments: [
      a('validation_rules', false, 'Validation Rules'),
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
    // RFC-040 (srs#273/#477) is data-model generation 3: RFC-032 (valueType -> fieldType) was
    // migration #1 (fromRevision 0, toRevision 1); the #242/#297 carrier+storage train was
    // migration #2 (toRevision 2); this train's definition-layer removals under reject-unknown
    // (defaultValue both sites, deprecatedAt) and additions (FieldAssignment.description,
    // Type.lineage/provenance) are migration #3, stamped once here at Unit 1 landing.
    dataModelRevision: 3,
    description: 'The self-hosted SRS meta-model (RFC-033/RFC-040): Field, Type, FieldAssignment, and value-objects expressed as SRS Type definitions. Frozen-seed source for docs/schema/2.0/{field,type}.json.',
    fields: FIELD_SPECS.map(([, name]) => `fields/${name}.json`),
    id: PACKAGE_ID,
    name: 'metamodel',
    namespace: NS,
    status: 'active',
    title: 'SRS Meta-Model (frozen seed)',
    types: TYPE_ORDER.map(([, name]) => `types/${name}.json`),
    version: '1.1.0',
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
