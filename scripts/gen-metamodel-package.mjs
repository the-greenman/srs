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
  // -- srs#526 (Task 4b/2, epic #256/#272): instance-layer entities. Value objects before the
  // entities that reference them; order is for readability only (numbering is what's pinned).
  [20, 'source-reference'],
  [21, 'note-section'],
  [22, 'note'],
  [23, 'record'],
  [24, 'relation'],
  [25, 'container'],
  [26, 'relation-spec'],
  [27, 'blueprint'],
  [28, 'term'],
  [29, 'promotion-window'],
  [30, 'vocabulary'],
  [31, 'lifecycle'],
  [32, 'source-anchor'],
  [33, 'source-excerpt'],
  [34, 'source-document-meta'],
  // -- srs#541 (Task 4b/6 residual): the six entities #526 parked (Composition, DiscoveryQuery, the
  // shared ExportConfig, View, Manifest, RelationTypeDefinition), plus their nested value objects.
  // Value objects ordered before the entities that reference them; numbering itself is pinned and
  // append-only, order is for readability only.
  [35, 'relation-type-definition'],
  [36, 'discovery-query'],
  [37, 'export-config'],
  [38, 'package-ref'],
  [39, 'rendered-presentation'],
  [40, 'upstream-package'],
  [41, 'slice-origin'],
  [42, 'slice-spec'],
  [43, 'slice-external-ref'],
  [44, 'slice'],
  [45, 'repository-ai-guidance'],
  [46, 'manifest'],
  [47, 'relation-presentation-entry'],
  [48, 'relations-presentation'],
  [49, 'navigation-link'],
  [50, 'theme-reference'],
  [51, 'theme-variant'],
  [52, 'composite-renderer-directive'],
  [53, 'section-ordering'],
  [54, 'document-section'],
  [55, 'composition'],
  [56, 'composite-renderer-binding'],
  [57, 'view-ai-guidance'],
  [58, 'field-view'],
  [59, 'record-property-view'],
  [60, 'view'],
  // -- srs#379: ext:protocol (a package-declared definition entity like Blueprint, not an
  // instance-layer entity — value objects before the entity that references them).
  [61, 'field-ref'],
  [62, 'protocol-stage'],
  [63, 'protocol'],
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
  [21, 'vocabulary_ref', { datatype: 'string', format: 'uuid' }, 'A LINEAGE reference (bare UUID; rfc-decision-c8704763, migrated from the namespace/name@version pattern) to a mode:closed configurable Vocabulary.'],
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
  // 49: `semantic_object_type` — REMOVED (owner ruling on #383, srs#372/#481/#524, rfc-decision-c8704763;
  // collapsed onto the Type system at srs#523/#524, dataModelRevision 6). Never reused.
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
  [64, 'meta', { datatype: 'map', valueRange: 'open' }, 'Open extension bag for state- or transition-specific metadata not otherwise modelled (rfc-decision-6fc7e142: the one escape-bag name, was `properties`).'],
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
  [81, 'field_ids', ref('field', 'reference', 'list', { minItems: 2 }), 'Fields of which at most one may be non-empty (mutual-exclusion).'],
  // -- Change A: ext:type-inheritance facet --
  [82, 'extends_type_id', ref('type', 'reference', 'single'), 'ext:type-inheritance — the UUID of the base Type this Type specializes.'],
  [83, 'extends_type_version', { datatype: 'integer', constraints: { minimum: 1 } }, 'ext:type-inheritance — the version of the base Type being extended.'],
  [84, 'field_order', ref('field', 'reference', 'list'), 'ext:type-inheritance — explicit declared composition order for the merged (base + own) effective field list, overriding per-field FieldAssignment.order at the Type level.'],
  [85, 'field_assignment_overrides', ref('field-assignment-override', 'inline', 'list'), 'ext:type-inheritance — per-field overrides applied to inherited FieldAssignments.'],
  // -- Change A: ext:lifecycle facet --
  [86, 'lifecycle', ref('type-lifecycle', 'inline', 'single'), 'ext:lifecycle — inline state machine declaration. Mutually exclusive with lifecycleRef.'],
  [87, 'lifecycle_ref', { datatype: 'string', format: 'uuid' }, 'ext:lifecycle — a LINEAGE reference (bare UUID; rfc-decision-c8704763) to an installed Lifecycle. Mutually exclusive with lifecycle.'],
  // -- Change A: core Type surface (not extension-owned) --
  [88, 'identity_field_id', ref('field', 'reference', 'single'), 'RFC-020 — names one fieldId from this Type\'s effective field set as the record\'s identity/display field.'],
  // -- Change A: ext:cross-field-validation facet (RFC-019) --
  [89, 'validation_rules', ref('cross-field-rule', 'inline', 'list'), 'ext:cross-field-validation — cross-field validation rules applied to Records of this Type. Per I-97, this array is each Type\'s own complete and exclusive set; it is not inherited by value.'],
  // -- srs#526 (Task 4b/2): instance-layer entities (Record/Note/Relation/Container/Blueprint/
  // Term/Vocabulary/Lifecycle(installable)/SourceDocumentMeta) and their value objects. Reuses the
  // shared identity/lineage Fields above wherever semantics genuinely match (id/namespace/name/
  // version/description/created_at/tags/label/status/meta/key/imported_at/exact-type-ref); instance
  // identity (instanceId/relationId/containerId) gets its own Fields, distinct from the
  // definition-layer id+namespace/name/version lineage (srs#526's own open decomposition question,
  // resolved: instance tiers are NOT definition lineages).
  [90, 'instance_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition\'s id+namespace/name/version lineage.'],
  [91, 'type_namespace', { datatype: 'string' }, 'Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins.'],
  [92, 'type_name', { datatype: 'string' }, 'Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins.'],
  [93, 'lifecycle_state', { datatype: 'string' }, 'ext:lifecycle — current lifecycle state of this Record.'],
  [94, 'field_values', { datatype: 'dependent', dependsOn: 'type_id' }, 'RFC-039: the name-keyed recursive value carrier, shaped by the Record\'s bound Type (resolved via typeId). Deliberately lossy at this envelope layer (approximated, per metamodel-fidelity.md); the Type\'s own projected schema validates the interior.'],
  [95, 'source_refs', ref('source-reference', 'inline', 'list'), 'References to source material this instance was derived from or attaches to (RFC-017/RFC-023).'],
  [96, 'updated_at', { datatype: 'date-time' }, 'ISO-8601 timestamp of the most recent update.'],
  [97, 'title', { datatype: 'string' }, 'Human-readable title.'],
  [98, 'sections', ref('note-section', 'inline', 'list'), 'Ordered list of named text sections (Tier 0 Note).'],
  [99, 'content', { datatype: 'string' }, 'Free text content.'],
  [100, 'content_hint', closed(['text', 'markdown', 'plain']), 'Rendering hint for a Note section\'s content. Default: text.'],
  [101, 'relation_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID for this standalone Relation (RFC-038).'],
  [102, 'relation_type_name', { datatype: 'string' }, 'The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication).'],
  [103, 'source_instance_id', { datatype: 'string', format: 'uuid' }, 'The asserting instance. Reads: source [relationType] target.'],
  [104, 'target_instance_id', { datatype: 'string', format: 'uuid' }, 'The related instance.'],
  [105, 'notes', { datatype: 'string' }, 'Free-form annotation on a Relation.'],
  [106, 'source_type', closed(['transcript-chunk', 'transcript-segment', 'external-document', 'repository-document']), 'RFC-023 SourceReference kind. repository-document is added by ext:repository.'],
  [107, 'source_id', { datatype: 'string' }, 'Free-form when sourceType is transcript-chunk/transcript-segment/external-document. When sourceType is repository-document, MUST be a SourceDocumentMeta.documentId.'],
  [108, 'source_standard', { datatype: 'string' }, 'Identifies the standard/convention the sourceId is expressed in.'],
  [109, 'stream_id', { datatype: 'string', format: 'uuid' }, 'Identifies a stream this source reference belongs to.'],
  [110, 'source_role', closed(['evidence', 'extracted-from', 'quoted-from', 'inspired-by', 'attaches']), 'RFC-023 — the role the source material plays for this instance. attaches added by RFC-017.'],
  [111, 'confidence', { datatype: 'number', constraints: { minimum: 0, maximum: 1 } }, 'Confidence score for this source reference, 0-1.'],
  [112, 'note', { datatype: 'string' }, 'Free-form human clarification. Shared by SourceReference.note and SourceAnchor.note.'],
  [113, 'container_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID for this Container. Must not appear in Relation.sourceInstanceId or targetInstanceId.'],
  [114, 'root_instance_ids', { datatype: 'string', format: 'uuid', cardinality: 'list' }, 'Top-level instances this Container was created to hold.'],
  [115, 'member_instance_ids', { datatype: 'string', format: 'uuid', cardinality: 'list' }, 'Explicit membership list for all instances in scope.'],
  [116, 'identity_instance_id', { datatype: 'string', format: 'uuid' }, 'RFC-013/RFC-029 — the instance id of this Container\'s identity/purpose record.'],
  [117, 'anchor_instance_id', { datatype: 'string', format: 'uuid' }, 'RFC-009 (amended srs#446) — the instance id whose Type is this Container\'s typing anchor.'],
  [118, 'root_types', ref('exact-type-ref', 'inline', 'list'), 'ext:blueprint — the Record Type(s) this Blueprint produces as root Records.'],
  [119, 'structure', ref('relation-spec', 'inline', 'list'), 'ext:blueprint — expected Relation structure between extracted Records.'],
  [120, 'required_types', ref('exact-type-ref', 'inline', 'list'), 'ext:blueprint — TypeIds that must be present for this Blueprint to be considered complete.'],
  [121, 'spec_source_type', ref('exact-type-ref', 'inline', 'single'), 'ext:blueprint — the Record Type on the source end of a RelationSpec.'],
  [122, 'spec_target_type', ref('exact-type-ref', 'inline', 'single'), 'ext:blueprint — the Record Type on the target end of a RelationSpec.'],
  [123, 'relation_spec_cardinality', closed(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']), 'ext:blueprint — expected multiplicity constraint for a RelationSpec.'],
  [124, 'roles', { datatype: 'string', cardinality: 'list' }, 'Semantic roles of a Term. Well-known values: foundation, navigation.'],
  [125, 'vocabulary_mode', closed(['open', 'closed']), 'open: values not in any Term are valid. closed: values MUST resolve to a Term.'],
  [126, 'extends_vocabulary_id', { datatype: 'string', format: 'uuid' }, 'When this Vocabulary adds terms to an upstream Vocabulary.'],
  [127, 'extends_vocabulary_version', { datatype: 'integer', constraints: { minimum: 1 } }, 'Must match the upstream Vocabulary\'s version exactly.'],
  [128, 'until', { datatype: 'string' }, 'ISO8601 date or target package version bounding a Vocabulary promotion window.'],
  [129, 'extends_lifecycle_id', { datatype: 'string', format: 'uuid' }, 'When this installable Lifecycle extends an upstream Lifecycle.'],
  [130, 'extends_lifecycle_version', { datatype: 'integer', constraints: { minimum: 1 } }, 'Must match the upstream Lifecycle\'s version exactly.'],
  [131, 'document_id', { datatype: 'string', format: 'uuid' }, 'ext:repository — stable identifier for a source document, used as SourceReference.sourceId when sourceType is repository-document.'],
  [132, 'content_path', { datatype: 'string' }, 'Relative path from source-documents/ to the document file (RFC-017).'],
  [133, 'content_type', { datatype: 'string' }, 'MIME type of the source document content.'],
  [134, 'encoding', { datatype: 'string' }, 'Character encoding of the content file, e.g. utf-8.'],
  [135, 'language', { datatype: 'string' }, 'BCP 47 language tag, e.g. en-GB.'],
  [136, 'processing_note', { datatype: 'string' }, 'Caveats about quality or completeness of the source material.'],
  [137, 'excerpt', ref('source-excerpt', 'inline', 'single'), 'ext:repository — repository-local excerpt provenance (RFC-017).'],
  [138, 'date', { datatype: 'date' }, 'Date the source document was produced or recorded.'],
  [139, 'source_document_id', { datatype: 'string', format: 'uuid' }, 'documentId of the repository-local parent source document an excerpt was captured from.'],
  [140, 'anchor', ref('source-anchor', 'inline', 'single'), 'Locator of an excerpt within its parent source document.'],
  [141, 'captured_at', { datatype: 'date-time' }, 'When an excerpt was extracted from its parent source.'],
  [142, 'captured_by', { datatype: 'string' }, 'Who or what extracted an excerpt.'],
  [143, 'source_checksum_at_capture', { datatype: 'string', constraints: { pattern: '^[a-z0-9]+:.+$' } }, 'Optional digest of the parent source content at extraction time: "<algorithm>:<hex>".'],
  [144, 'anchor_kind', closed(['line-range', 'char-range', 'timestamp-range', 'message-id', 'json-pointer', 'custom']), 'How an excerpt location is expressed in the parent source document.'],
  [145, 'value', { datatype: 'string' }, 'Locator value, e.g. "241-260", or a human-readable note.'],
  [146, 'terms', ref('term', 'inline', 'list'), 'The Vocabulary\'s Term entries.'],
  [147, 'promotion_window', ref('promotion-window', 'inline', 'single'), 'RFC-006 V10 — grace window for a Vocabulary\'s open-to-closed promotion.'],
  // -- srs#541 (Task 4b/6 residual): DiscoveryQuery (docs/schema/2.0/discovery.json, modelled minus
  // `tier` — a bare untyped-integer enum, the same #534-tracked emitter gap discovery.json's own
  // standalone generation is gated on; this is a documented per-entity exclusion, same latitude
  // Container.containerType already has, not a fix to #534 here).
  [148, 'tag', { datatype: 'string', cardinality: 'list' }, 'AND-conjunction: the instance\'s tags array must contain ALL of the specified values (ext:discovery DiscoveryQuery.tag).'],
  [149, 'discovery_container_id', { datatype: 'string', format: 'uuid' }, 'ext:discovery DiscoveryQuery.containerId — instance is a member of this container (RFC-009 I-66).'],
  [150, 'lifecycle_states', { datatype: 'string', cardinality: 'list' }, 'ext:discovery DiscoveryQuery.lifecycleStates — inclusive multi-value lifecycle filter, OR semantics (RFC-012 Rev 11, srs#525).'],
  [151, 'exclude_lifecycle_states', { datatype: 'string', cardinality: 'list' }, 'ext:discovery DiscoveryQuery.excludeLifecycleStates — exclusion filter, applied after lifecycleState/lifecycleStates.'],
  [152, 'content_match', { datatype: 'string' }, 'ext:discovery DiscoveryQuery.contentMatch — free-text recall-floor predicate over the Text Projection.'],
  // -- RelationTypeDefinition (docs/schema/2.0/relation-type.json, closes #254's remainder).
  [153, 'category', closed(['composition', 'refinement', 'dependency', 'sequence', 'derivation', 'evidence', 'governance', 'association', 'lifecycle', 'provenance', 'other']), 'Structural category of a relation type.'],
  [154, 'canonical_direction', { datatype: 'string' }, 'Human-readable description of which end is source and which is target, or what members represent.'],
  [155, 'inverse_type', { datatype: 'string' }, 'Key of the derived inverse (e.g. supersedes -> superseded-by); need not resolve — display-only (Invariant 16).'],
  [156, 'irreflexive', { datatype: 'boolean' }, 'When true, a relation from an instance to itself is invalid.'],
  [157, 'require_same_type', { datatype: 'boolean' }, 'When true, source and target must resolve to the same bound Type (srs-rust#910, re-keyed onto the Type system).'],
  // -- ExportConfig (shared: Composition.exportConfig, View.exportConfig, srs#525 "one shape, two
  // attachment points") and RenderedPresentation.format (manifest.json), which reuses the same
  // `format` Field — same meaning, different owning Types.
  [158, 'export_format', { datatype: 'string' }, 'Target output format. Portable values: markdown, adoc, html, text.'],
  [159, 'preamble', { datatype: 'string' }, 'Template string rendered before field values.'],
  [160, 'omit_empty_fields', { datatype: 'boolean' }, 'Default: false. When true, fields with no value are omitted from output.'],
  // -- Manifest (docs/schema/2.0/manifest.json, RFC-038 descriptor-only shape) and its value objects.
  [161, 'srs_version', { datatype: 'string' }, 'SRS spec version this repository conforms to, e.g. \'2.0\' or \'2.0-draft\'.'],
  [162, 'data_model_revision', { datatype: 'integer', constraints: { minimum: 0 } }, 'RFC-033/#265 — monotonic integer generation stamp for operational data-model migrations. Absent means revision 0.'],
  [163, 'repository_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID for this repository (or, on a Slice, the source repository it was exported from). Never changes on copy or export.'],
  [164, 'declared_extensions', { datatype: 'string', cardinality: 'list' }, 'SRS extensions this repository conforms to, e.g. [\'ext:lifecycle\', \'ext:views-l1\'].'],
  [165, 'container', ref('container', 'inline', 'single'), 'Embedded Container record — canonical source of truth for this repository\'s identity.'],
  [166, 'package_ref_mode', closed(['local', 'remote']), 'LOCATOR (rfc-decision-c8704763). local: definitions live in the repository under package/. remote: pre-installed in the consumer\'s registry.'],
  [167, 'path', { datatype: 'string' }, 'Relative path to a referenced file (a package directory/package.json, or a Theme JSON file).'],
  [168, 'package_id', { datatype: 'string', format: 'uuid' }, 'Stable UUID of a package.'],
  [169, 'package_name', { datatype: 'string' }, 'Human-readable name of a package.'],
  [170, 'package_ref', ref('package-ref', 'inline', 'single'), 'Reference to the SRS Package that supplies field and type definitions (single package).'],
  [171, 'package_refs', ref('package-ref', 'inline', 'list'), 'References to one or more SRS Packages (RFC-014 Change C, multi-package/multi-version repositories).'],
  [172, 'composition_id', { datatype: 'string', format: 'uuid' }, 'UUID of the Composition (Composition.id) constituting a declared presentation (srs-rust#910: renamed from viewId).'],
  [173, 'is_default', { datatype: 'boolean' }, 'When true, this is the presentation a viewer opens by default.'],
  [174, 'output_path', { datatype: 'string' }, 'Relative path hint for rendered export scripts. Informational only.'],
  [175, 'rendered_presentations', ref('rendered-presentation', 'inline', 'list'), 'RFC-015 [N+31] — declared presentations for this repository.'],
  [176, 'upstream_semver', { datatype: 'string' }, 'Semver of the upstream Package recorded at install/upgrade time, e.g. \'1.0.0\'.'],
  [177, 'installed_at', { datatype: 'date-time' }, 'When this upstream Package version was installed into the repository.'],
  [178, 'upstream_package', ref('upstream-package', 'inline', 'single'), 'RFC-014 (ext:import-tracking) — top-level normative provenance stamp for a repository initialised from an upstream Package.'],
  [179, 'slice_spec_type', closed(['container']), 'Closure rule identifying the boundary that scoped a Slice. \'container\' = container-membership closure.'],
  [180, 'slice_origin', ref('slice-origin', 'inline', 'single'), 'ext:slices (RFC-026) — identifies the source repository a Slice was exported from.'],
  [181, 'exported_at', { datatype: 'date-time' }, 'When a Slice was produced.'],
  [182, 'external_relation_refs', ref('slice-external-ref', 'inline', 'list'), 'RFC-026 — Relations cut at export because exactly one endpoint fell outside the closure.'],
  [183, 'spec', ref('slice-spec', 'inline', 'single'), 'Identifies the closure rule and boundary that scoped a Slice.'],
  [184, 'slice', ref('slice', 'inline', 'single'), 'ext:slices (RFC-026) — present when this archive is a partial export (slice) of a source repository.'],
  [185, 'source_documents_path', { datatype: 'string' }, 'Relative path from manifest.json to the source-documents/ directory.'],
  [186, 'summary', { datatype: 'string' }, 'Repository-level AI comprehension summary.'],
  [187, 'suggested_entry_points', { datatype: 'string', cardinality: 'list' }, 'Suggested entry points for an AI agent reading this repository.'],
  [188, 'navigation_hints', { datatype: 'string' }, 'Navigation hints for an AI agent reading this repository.'],
  [189, 'repository_ai_guidance', ref('repository-ai-guidance', 'inline', 'single'), 'Comprehension guidance for AI agents reading this repository (Manifest.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object).'],
  // -- Composition (docs/schema/2.0/composition.json, renamed from document-view.json) and its
  // nested value objects.
  [190, 'section_id', { datatype: 'string' }, 'Stable identifier for a DocumentSection within its Composition.'],
  [191, 'render_view_id', { datatype: 'string', format: 'uuid' }, 'View (ext:views-l1) used to render each instance in a DocumentSection.'],
  [192, 'type_dispatch', { datatype: 'map', valueRange: 'string' }, 'RFC-008 (ext:views-l2) — map from a record\'s resolved type key to the ext:views-l1 View UUID used to render records of that type within a DocumentSection.'],
  [193, 'title_field_id', { datatype: 'string', format: 'uuid' }, 'The fieldId whose value provides the per-record heading within a DocumentSection.'],
  [194, 'sort_direction', closed(['asc', 'desc']), 'Sort direction for a DocumentSection\'s field-based ordering. Default: asc.'],
  [195, 'member_order', { datatype: 'string', format: 'uuid', cardinality: 'list' }, 'RFC-015 [N+29] — view-owned explicit presentation sequence for container-subset sections.'],
  [196, 'section_ordering', ref('section-ordering', 'inline', 'single'), 'DocumentSection.ordering — field-based or explicit member-order presentation directive.'],
  [197, 'empty_behavior', closed(['hide', 'show-placeholder']), 'What to do when a DocumentSection has no records. Default: hide.'],
  [198, 'composite_renderers', ref('composite-renderer-directive', 'inline', 'list'), 'RFC-036 — composite renderer dispatch declared at a Composition or a DocumentSection.'],
  [199, 'relations_presentation', ref('relations-presentation', 'inline', 'single'), 'RFC-027 — when present, render a deterministic per-member links block after each member a DocumentSection renders.'],
  [200, 'include', ref('relation-presentation-entry', 'inline', 'list', { minItems: 1 }), 'RFC-027 — which relation types a RelationsPresentation displays, in display order.'],
  [201, 'directions', closed(['forward', 'inverse', 'both']), 'Which edge directions a RelationPresentationEntry displays for the member. Default: forward.'],
  [202, 'forward_label', { datatype: 'string' }, 'Row-label override for edges where the member is the source.'],
  [203, 'inverse_label', { datatype: 'string' }, 'Row-label override for edges where the member is the target.'],
  [204, 'from_section_id', { datatype: 'string' }, 'The sectionId a NavigationLink departs from.'],
  [205, 'to_section_id', { datatype: 'string' }, 'The sectionId a NavigationLink arrives at.'],
  [206, 'bidirectional', { datatype: 'boolean' }, 'Default: false. Whether a NavigationLink should also be read in reverse.'],
  [207, 'theme_reference_mode', closed(['local', 'remote', 'bundled']), 'A ThemeReference\'s locator mode: local/remote/bundled, following the same mode-discriminated pattern as PackageRef.'],
  [208, 'url', { datatype: 'string' }, 'URL to a referenced file (e.g. a Theme JSON file, ThemeReference.mode === remote).'],
  [209, 'theme_id', { datatype: 'string', format: 'uuid' }, 'References Theme.id in Package.themes[] (ThemeReference.mode === bundled).'],
  [210, 'theme_ref', ref('theme-reference', 'inline', 'single'), 'A pointer to a Theme (ext:themes-l1): Composition.themeRef, or a ThemeVariant\'s own themeRef.'],
  [211, 'theme_variants', ref('theme-variant', 'inline', 'list'), 'Named alternative themes selectable at render invocation.'],
  [212, 'renderer', { datatype: 'string', constraints: { minLength: 1 } }, 'Composite renderer identifier (RFC-036). \'baseline\' is the reserved sentinel meaning explicitly no renderer.'],
  [213, 'renderer_roles', { datatype: 'map', valueRange: 'string' }, 'RFC-036 — explicit, UUID-anchored role -> Field.id binding, overriding the by-name defaults of a composite renderer.'],
  [214, 'document_sections', ref('document-section', 'inline', 'list'), 'Ordered list of sections that make up a Composition.'],
  [215, 'root_type_refs', ref('exact-type-ref', 'inline', 'list'), 'RFC-009 — when set, a Composition applies to Containers whose root Record\'s resolved Type matches one of these refs.'],
  [216, 'navigation_links', ref('navigation-link', 'inline', 'list'), 'Assembly-time cross-section reading aids. Do not appear in the Relation graph.'],
  [217, 'export_config', ref('export-config', 'inline', 'single'), 'The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points).'],
  [218, 'depth_offset', { datatype: 'integer', constraints: { minimum: 0 } }, 'Shifts all auto-rendered heading levels by this amount. Default: 0.'],
  // -- View (docs/schema/2.0/view.json, ext:views-l1) and its nested value objects.
  [219, 'compatible_types', { datatype: 'string', cardinality: 'list' }, 'Optional Type-key hints (namespace/name) a View was designed for. Informational only.'],
  [220, 'view_ai_guidance', ref('view-ai-guidance', 'inline', 'single'), 'Guidance for AI agents using a View (View.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object: purpose + extraction only).'],
  [221, 'visible', { datatype: 'boolean' }, 'Default: true. Whether a FieldView/RecordPropertyView row is shown.'],
  [222, 'editor_hint_override', { datatype: 'string' }, 'Presentation only (RFC-036 [CR-036-20]/[CR-036-21]). Supersedes Field.editorHint for Records rendered/edited through this View.'],
  [223, 'composite_renderer', ref('composite-renderer-binding', 'inline', 'single'), 'RFC-036 — render a FieldView\'s composite-range value through a named composite renderer.'],
  [224, 'property', closed(['lifecycleState', 'tags', 'createdAt', 'updatedAt']), 'Record-level property presented by a RecordPropertyView row.'],
  // -- srs#379: Protocol/ProtocolStage/FieldRef (ext:protocol). Reuses shared identity Fields
  // (id/namespace/name/version/description/created_at/tags, #1-6/#11), `ai_guidance` (#8, reused
  // for ProtocolStage's own guidance — structured over serialised, no string alternative), `order`
  // (#52, reused with a stage-specific desc override), `field_id`/`type_id` (#51/#33, reused for
  // FieldRef). New Fields below are the ones with no existing semantic match.
  [225, 'stage_id', { datatype: 'string' }, 'Stable key within this Protocol. Referenced by other stages\' dependsOn (Invariant 29).'],
  [226, 'stage_depends_on', { datatype: 'string', cardinality: 'list' }, 'stageId values within the enclosing Protocol — epistemic dependencies, not just ordering. A stage may not depend on itself (Invariant 29).'],
  [227, 'completion_criteria', { datatype: 'string' }, 'How to know this stage is sufficient to proceed.'],
  [228, 'question', { datatype: 'string' }, 'The core question this stage answers.'],
  [229, 'contributes_to', ref('field-ref', 'inline', 'list'), 'The Record Fields this stage feeds (Invariant 30).'],
  [230, 'output_type', { datatype: 'string', format: 'uuid' }, 'Present when this stage produces its own intermediate Record. A LINEAGE reference (bare UUID; rfc-decision-c8704763) to the Type this stage produces its own intermediate Record as — the effective package set resolves it. typeVersion is dropped (version-optional hybrids are forbidden).'],
  [231, 'target_type', { datatype: 'string', format: 'uuid' }, 'The Record type this Protocol converges on — a LINEAGE reference (bare UUID; rfc-decision-c8704763), never the canonical namespace/name@version form (DISPLAY-only, never stored). Empty string for loose, exploratory Protocols whose output is input context for a tighter Protocol.'],
  [232, 'stages', ref('protocol-stage', 'inline', 'list'), 'The stages, in declaration order. Execution sequence is determined by dependsOn resolution, not array position; order is the declared composition order (Invariant 31).'],
];
const fieldIdByName = {};
for (const [n, name] of FIELD_SPECS) fieldIdByName[name] = fieldUuid(n);

// ---------------------------------------------------------------------------------------------
// TYPE DEFINITIONS — each Type's ordered FieldAssignments (field-name, required, optional label).
// ---------------------------------------------------------------------------------------------
// RFC-040 Unit 3 (srs#479): `a()` gains a 4th positional arg, `desc` — a FieldAssignment.description
// override (Change C: documentation-only annotation, projected to the property's JSON Schema
// `description`). Assignment-level only, opt-in: the emitter never falls back to the Field's own
// (generic, cross-context) `description` for a property fragment — see schema-emitter.mjs `emitBody`.
// Values below are the seed's PRE-Unit-3 exact text (docs/schema/2.0/{field,type}.json as committed
// before this unit regenerated them without per-property descriptions — see the PARK note above the
// `fields:` mapper, a few lines down, for why they are authored but not yet written to records).
// Carried in from that prior text rather than freshly authored, so that WHEN the srs-rust mirror-sync
// follow-up unblocks corpus population, flipping the one line back on reproduces exactly what the
// seed used to say — not new prose invented at that point. This is NOT currently exercised by the
// byte-closure gate: the CURRENT committed seed carries no per-property descriptions (this text is
// write-only until un-parked); no test asserts these strings until then.
const a = (name, required, label, desc) => ({ name, required, label, desc });
const TYPE_SPECS = {
  field: {
    description: 'An atomic, reusable field definition. Fields are the shared vocabulary of SRS — defined once, referenced across many Types.',
    purpose: 'Describes a single SRS Field: its identity, its decomposed value type, and its AI guidance.',
    assignments: [
      a('id', true, undefined, 'Globally unique, stable identifier for this Field.'),
      a('namespace', true, undefined, "Logical grouping. 'core' is reserved for SRS standard definitions."),
      a('name', true, undefined, 'Machine-readable name within the namespace; snake_case.'),
      a('version', true),
      a('description', true), a('instructions', false, undefined, 'Fuller guidance for a human completing this field.'),
      a('ai_guidance', true, 'AI Guidance'),
      a('field_type', true, 'Field Type', 'RFC-032 — the decomposed value type: datatype × cardinality × value-domain × format × constraints. Replaces the pre-RFC-032 closed scalar `valueType` enum and its companion properties (`contentFormat`, `allowedValues`, `vocabularyRef`, `validationRules`).'),
      a('editor_hint', false, 'Editor Hint', 'Presentation only (not part of the type model — RFC-032). Suggested UI control; implementations and Views may override. Consolidated by the rendering follow-up #262.'),
      a('tags', false), a('lineage', false), a('provenance', false), a('created_at', true),
    ],
  },
  type: {
    description: 'A named, versioned composition of Fields. Extension-owned facets (lifecycle, inheritance, cross-field-validation) are modelled as separate Types extending this one via ext:type-inheritance (RFC-040 Change A); tags and identityFieldId are core Type surface.',
    purpose: 'Describes an SRS Type: its identity and its ordered FieldAssignments.',
    assignments: [
      a('id', true), a('namespace', true, undefined, "Logical grouping, e.g. 'governance', 'finance'."),
      a('name', true, undefined, 'Machine-readable name within the namespace, snake_case.'), a('version', true),
      a('description', true),
      a('ai_guidance', false, 'AI Guidance', 'Guidance for AI agents determining whether source material matches this Type.'),
      a('fields', true, undefined, 'Ordered list of fields that make up this Type.'), a('tags', false),
      a('lineage', false), a('provenance', false),
      a('identity_field_id', false, 'Identity Field Id', "RFC-020 — names one fieldId from this Type's effective field set (own fields plus, under ext:type-inheritance, inherited fields) as the record's identity/display field. MUST reference a fieldId present in the effective field set (Rule [N+33]). Under ext:type-inheritance, a Type that declares no identityFieldId of its own inherits the effective identityFieldId of its base Type, resolved transitively up the ancestor chain (Rule [N+34]) — this cascading inheritance is specific to identityFieldId and is not shared with fieldOrder, which is single-level only."),
      a('created_at', true),
    ],
  },
  'field-assignment': {
    description: 'A Field\'s use inside a Type: the reference-mode edge that closes the metacircular loop.',
    purpose: 'Describes how one Field participates in a Type (order, requiredness, label, contextual description).',
    assignments: [
      a('field_id', true, 'Field', 'References a Field by its stable id.'),
      a('order', true, undefined, 'The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).'),
      a('required', true, undefined, 'Whether this field must be populated before a Record can be logged.'),
      a('display_label', false, 'Display Label', 'Context-specific label override for this field within this Type.'),
      a('description', false, undefined, "Documentation-only contextual description of this field's use within this Type (RFC-040 Change C). On conflict, the Field's own semantics and aiGuidance win: a contextual description that contradicts them is a data error, not an override. MUST NOT be projected to a constraint keyword."),
    ],
  },
  'field-type': {
    description: 'RFC-032 Change A — orthogonal type facets. Conditional requirements (R2/R3/R9/R10) are expressed in the allOf branches below; the full semantic conformance check (R1–R11) is scripts/lib/rfc-032-fieldtype.mjs::validateFieldType.',
    purpose: 'Describes a Field\'s value model, including composite ranges (datatype: ref -> another Type).',
    assignments: [
      a('datatype', true, undefined, 'The base datatype. `ref` = range is another Type (Change B); `dependent` = value-of-a-sibling-type (Change C); `map` = open string-keyed collection (Change D).'),
      a('cardinality', false, undefined, 'Whether the field holds one value or an ordered list. Default: single. The sole cardinality mechanism (R4) — former `multiselect` and standalone `repeatable` are subsumed here.'),
      a('min_items', false, 'Min Items', 'cardinality == list only (R4). 0 ≤ minItems ≤ maxItems.'),
      a('max_items', false, 'Max Items', 'cardinality == list only (R4).'),
      a('value_domain', false, 'Value Domain', 'datatype == string only (R3). Default: open. When closed, exactly one of allowedValues or vocabularyRef is present.'),
      a('allowed_values', false, 'Allowed Values', 'Inline, field-fixed closed vocabulary (valueDomain == closed). Mutually exclusive with vocabularyRef.'),
      a('vocabulary_ref', false, 'Vocabulary Ref', 'A CONFIGURABLE data range: a LINEAGE reference (bare UUID; rfc-decision-c8704763, migrated from the namespace/name@version pattern) to a mode:closed Vocabulary whose Terms are managed in package config — the effective package set resolves it. Mutually exclusive with allowedValues. Projects to a pure enum of the Vocabulary\'s effective Term keys at schema-generation time (Change G).'),
      a('format', false, undefined, 'datatype == string only. Semantic string format (JSON-Schema-aligned); date/date-time are first-class datatypes, not formats.'),
      a('constraints', false, undefined, 'Datatype-appropriate value constraints (R10). Carries the former ValidationRule facets (Change F).'),
      a('range_type', false, 'Range Type', 'datatype == ref only, REQUIRED (R2). The Type this field\'s range is (Change B).'),
      a('mode', false, undefined, 'datatype == ref only. inline = nested object(s) conforming to rangeType; reference = target instance id(s). Default: inline. Fixed per Field (R8).'),
      a('depends_on', false, 'Depends On', 'datatype == dependent only, REQUIRED (R6). "self" (the field\'s own fieldType) or a sibling field name whose type the value conforms to (Change C).'),
      a('value_range', false, 'Value Range', 'datatype == map only, REQUIRED (R9). The scalar value datatype, or "open" for a true extension bag (Change D). Composite value ranges are out of scope.'),
    ],
  },
  'exact-type-ref': {
    description: 'RFC-009 I-78. A version-exact reference to a Type in the Package (PINNED, rfc-decision-c8704763). Both typeId and typeVersion are required. The pre-RFC-009 version-optional Protocol TypeRef this once contrasted with is retired — Protocol.outputType is now a bare-UUID LINEAGE reference (typeVersion dropped; version-optional hybrids are forbidden).',
    purpose: 'Names a Type by UUID + exact version.',
    assignments: [
      a('type_id', true, 'Type Id', 'Stable UUID of the Type.'),
      a('type_version', true, 'Type Version', 'Version of the Type this ref targets (required — version-exact anchor validated against the Package).'),
    ],
  },
  'field-type-constraints': {
    description: 'Datatype-appropriate value constraints carried by a FieldType (RFC-032 Change F).',
    purpose: 'The fixed-shape constraints bag: string length/pattern and numeric bounds.',
    assignments: [
      a('min_length', false, 'Min Length', 'datatype == string.'), a('max_length', false, 'Max Length', 'datatype == string.'),
      a('pattern', false, undefined, 'datatype == string; an ECMA-262 regular expression.'),
      a('minimum', false, undefined, 'datatype == number/integer.'), a('maximum', false, undefined, 'datatype == number/integer.'),
    ],
  },
  'ai-guidance': {
    description: 'LLM guidance for extracting or populating a Field or matching a Type.',
    purpose: 'Carries purpose, extraction/negative guidance, and worked examples.',
    assignments: [
      a('purpose', true, undefined, 'What this field/type captures (1-2 sentences).'),
      a('extraction', false, undefined, 'LLM instruction for how to extract or populate.'),
      a('negative_guidance', false, 'Negative Guidance', 'What the LLM must NOT include or do.'),
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
      a('states', true), a('transitions', true),
      a('initial_state', true, 'Initial State', 'Must reference a state key with isInitial: true (Invariant 4).'),
    ],
  },
  'lifecycle-state': {
    description: 'A lifecycle state (VocabularyEntry specialization). key is the unified substrate field (was name pre-RFC-006).',
    purpose: 'Describes one state in a TypeLifecycle: its key, labels, and optional relational obligation.',
    assignments: [
      a('id', false), a('version', false), a('namespace', false),
      a('key', true, undefined, 'Machine-readable state key. Unified substrate field (was name).'),
      a('label', false), a('description', false), a('aliases', false),
      a('is_initial', false, 'Is Initial'), a('is_final', false, 'Is Final'),
      a('status', false), a('requires_relation', false, 'Requires Relation'),
      a('meta', false),
    ],
  },
  'requires-relation': {
    description: 'RFC-022 relational state: a record may only be in this state if a relation satisfying this obligation exists.',
    purpose: 'Describes the relation-type obligation, direction, and enforcement strength that gates a lifecycle state.',
    assignments: [
      a('relation_type', true, 'Relation Type', 'Relation type(s) that satisfy the obligation (any-of interpretation, unchanged from RFC-022). RFC-032 Change F normalized this declaration form from string|string[] to a list (length ≥ 1); the single-string form is removed. The distinct scalar fulfillment.relationType selector is untouched.'),
      a('direction', false, undefined, 'incoming: an edge whose target is the record (e.g. successor → predecessor supersedes). outgoing: an edge whose source is the record.'),
      a('enforcement', false, undefined, 'hard (default): a transition into this state MUST be rejected unless the obligation is satisfied or fulfilled (definitional relational states whose meaning is the relationship, e.g. superseded). advisory: the transition is permitted even when unsatisfied, and an unsatisfied obligation is surfaced as a warning at rest, never a rejection (evidentiary obligations that may be established later).'),
    ],
  },
  'lifecycle-transition': {
    description: 'One named edge in a TypeLifecycle, from one state key to another.',
    purpose: 'Describes a lifecycle transition: its name and its from/to state keys.',
    assignments: [
      a('id', false, undefined, 'Stable UUID identity for this transition edge.'),
      a('transition_name', true, 'Name'), a('from', true), a('to', true),
      a('description', false), a('meta', false),
    ],
  },
  'field-assignment-override': {
    description: 'ext:type-inheritance — overrides for a single inherited FieldAssignment.',
    purpose: 'Describes a tighten-only required override plus rendering-only overrides (displayLabel, displayHint) for one inherited field.',
    assignments: [
      a('field_id', true, 'Field', 'The fieldId of the inherited field being overridden.'),
      a('display_label', false, 'Display Label', 'Rendering-only label override.'),
      a('display_hint', false, 'Display Hint', 'Rendering-only hint text override.'),
      a('required', false, undefined, 'May tighten (false→true) but not relax (true→false) the base field\'s required status.'),
    ],
  },
  'cross-field-rule': {
    description: 'ext:cross-field-validation — a constraint that validates a relationship between fields in a Record.',
    purpose: 'Describes one cross-field rule: its kind, the field(s) it examines, and its effect.',
    assignments: [
      a('kind', true, 'Kind', 'The kind of cross-field constraint.'),
      a('message', false, undefined, 'Optional human-readable description of the rule.'),
      a('predicate_field_id', false, 'Predicate Field', 'Field whose value is tested. RFC-032 Rev-7 I-94: for conditional-required it must be effective-single (fieldType.cardinality absent/single — the sole cardinality mechanism since the #242 Phase-B cutover removed FieldAssignment.repeatable, RFC-039 [R7]) with datatype string, date, or date-time; string format/valueDomain do not restrict eligibility. Field-ordering uses I-92.'),
      a('predicate_value', false, 'Predicate Value', 'Value the predicate field must equal to activate the rule (conditional-required).'),
      a('target_field_id', false, 'Target Field', 'Field that is constrained when the rule fires (conditional-required, field-ordering).'),
      a('effect', false, undefined, 'Ordering direction for a field-ordering rule.'),
      a('field_ids', false, 'Field Ids', 'Fields of which at most one may be non-empty (mutual-exclusion).'),
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
      a('lifecycle', false, undefined, 'ext:lifecycle — inline state machine declaration. Mutually exclusive with lifecycleRef.'),
      a('lifecycle_ref', false, 'Lifecycle Ref', 'ext:lifecycle — a LINEAGE reference (bare UUID; rfc-decision-c8704763) to an installed Lifecycle — the effective package set resolves it. Mutually exclusive with lifecycle.'),
    ],
  },
  'inheritance-facet': {
    description: 'ext:type-inheritance — the specialization facet, contributed to Type by inheritance (RFC-040 Change A).',
    purpose: 'Models the four properties ext:type-inheritance contributes to a Type: the base Type reference, the merged effective field order, and per-field overrides.',
    extendsTypeId: typeIdByName.type,
    extendsTypeVersion: 1,
    // RFC-040 Unit 3 (srs#479): exercises the Type.fieldOrder facet it itself models (I-41) to pin the
    // frozen `type.json` seed's own hand-curated property order across the flattened core+facets merge
    // — without it, the default `.order`-tie-broken-by-declaration-position sort interleaves the three
    // facets' properties in a way the seed's narrative grouping does not follow.
    fieldOrder: [
      'id', 'namespace', 'name', 'version', 'description', 'ai_guidance', 'fields',
      'lifecycle', 'lifecycle_ref', 'tags', 'extends_type_id', 'extends_type_version', 'field_order',
      'field_assignment_overrides', 'identity_field_id', 'validation_rules', 'lineage', 'provenance', 'created_at',
    ],
    assignments: [
      a('extends_type_id', false, 'Extends Type Id', 'ext:type-inheritance — the UUID of the base Type this Type specializes.'),
      a('extends_type_version', false, 'Extends Type Version', 'ext:type-inheritance — the version of the base Type being extended.'),
      a('field_order', false, 'Field Order', 'ext:type-inheritance — explicit declared composition order for the merged field list (base + own), overriding per-field FieldAssignment.order at the Type level. Must contain every fieldId from the effective field set exactly once.'),
      a('field_assignment_overrides', false, 'Field Assignment Overrides', 'ext:type-inheritance — per-field overrides applied to inherited FieldAssignments.'),
    ],
  },
  'cross-field-validation-facet': {
    description: 'ext:cross-field-validation (RFC-019) — the validationRules facet, contributed to Type by inheritance (RFC-040 Change A). Per I-97 the array is each Type\'s own complete and exclusive set; it is not inherited by value.',
    purpose: 'Models the one property ext:cross-field-validation contributes to a Type: its own array of CrossFieldRules.',
    extendsTypeId: typeIdByName.type,
    extendsTypeVersion: 1,
    assignments: [
      a('validation_rules', false, 'Validation Rules', 'ext:cross-field-validation — cross-field validation rules applied to Records of this Type.'),
    ],
  },
  // -- srs#526 (Task 4b/2, epic #256/#272): instance-layer entities. Generated from
  // docs/schema/2.0/{record,note,relation,container,blueprint,term,vocabulary,lifecycle,
  // source-document-meta}.json (the current hand-authored seeds); proven via
  // scripts/rfc-272-closure-test.mjs (emitter ⊆ committed seed), never overwriting them (the
  // authorship flip is #260, same as RFC-033/RFC-040). Deliberately excluded from every entity
  // below (documented, not silent): each entity's own hand-authored `$schema` const-pin property
  // (no per-entity string-const fieldType primitive exists yet), and any bare
  // "implementation-defined, additionalProperties:true" bag with no real internal structure to
  // model (Blueprint.aiGuidance/lineage/provenance). `meta` is NOT modelled as a Field on Record/
  // Note/Relation/Container/SourceDocumentMeta — those five are emitted with
  // `emitEntity(ctx, name, { facing: "instance" })`, whose synthetic `meta: {type:"object"}`
  // property matches their bare (no additionalProperties) committed shape exactly; Term instead
  // gets a REAL `meta` FieldAssignment (reusing the existing `meta` Field, #64) because Term is
  // also emitted as a NESTED $def (vocabulary.json $defs.Term), where the facing synthesis does
  // not apply, and because Term's committed `meta` carries `additionalProperties:true` (matching
  // the map/open Field, unlike the other four's bare form).
  'source-reference': {
    description: 'RFC-023/RFC-017 — a reference to source material an instance was derived from, evidenced by, or attaches. Modelled once and referenced by Record, Note, and Relation (srs#526, per #272\'s "model SourceReference once" acceptance criterion).',
    purpose: 'Describes one SourceReference: what kind of source it is, its locator, and the role it plays.',
    assignments: [
      a('source_type', true, 'Source Type'), a('source_id', true, 'Source Id'),
      a('source_standard', false, 'Source Standard'), a('stream_id', false, 'Stream Id'),
      a('source_role', false, 'Source Role'), a('confidence', false), a('note', false),
    ],
  },
  'note-section': {
    description: 'One named text section within a Tier 0 Note.',
    purpose: 'Describes a NoteSection: its key, optional label, content, and content hint.',
    assignments: [
      a('name', true, undefined, 'Section key; unique within the Note; snake_case recommended.'),
      a('label', false), a('content', true), a('content_hint', false, 'Content Hint'), a('tags', false),
    ],
  },
  note: {
    description: 'Tier 0 — a lightweight instance with no Type binding. The lowest-ceremony entry point in SRS.',
    purpose: 'Describes a Note: its identity, ordered sections, and source references.',
    assignments: [
      a('instance_id', true, 'Instance Id'), a('title', false), a('tags', false),
      a('sections', true), a('source_refs', false, 'Source Refs'),
      a('created_at', false), a('updated_at', false, 'Updated At'),
    ],
  },
  record: {
    description: 'Tier 2 — an instantiated Type with field values. A fully structured, settled instance.',
    purpose: 'Describes a Record: its bound Type, its field values, and its lifecycle/source/discovery metadata.',
    assignments: [
      a('instance_id', true, 'Instance Id'), a('type_id', true, 'Type Id'), a('type_version', true, 'Type Version'),
      a('type_namespace', true, 'Type Namespace'), a('type_name', true, 'Type Name'),
      a('lifecycle_state', false, 'Lifecycle State'), a('field_values', true, 'Field Values'),
      a('source_refs', false, 'Source Refs'), a('tags', false),
      a('created_at', false), a('updated_at', false, 'Updated At'),
    ],
  },
  relation: {
    description: 'RFC-038 — a single standalone Relation: a typed binary edge between two instance UUIDs.',
    purpose: 'Describes a Relation: its type, its source and target instances, and provenance.',
    assignments: [
      a('relation_id', true, 'Relation Id'), a('relation_type_name', true, 'Relation Type'),
      a('source_instance_id', true, 'Source Instance Id'), a('target_instance_id', true, 'Target Instance Id'),
      a('created_at', false), a('notes', false), a('source_refs', false, 'Source Refs'),
    ],
  },
  container: {
    description: 'A lightweight grouping boundary over a collection of instances.',
    purpose: 'Describes a Container: its identity, membership, typing anchor, and identity record.',
    assignments: [
      a('container_id', true, 'Container Id'), a('title', true), a('namespace', false), a('name', false),
      a('description', false), a('root_instance_ids', false, 'Root Instance Ids'),
      a('member_instance_ids', false, 'Member Instance Ids'), a('identity_instance_id', false, 'Identity Instance Id'),
      a('anchor_instance_id', false, 'Anchor Instance Id'), a('tags', false),
      a('created_at', false), a('updated_at', false, 'Updated At'),
    ],
  },
  'relation-spec': {
    description: 'ext:blueprint — declares an expected Relation between two Record types within a Blueprint.',
    purpose: 'Describes a RelationSpec: its relation type, source/target Types, and cardinality/required constraints.',
    assignments: [
      a('relation_type_name', true, 'Relation Type'), a('spec_source_type', true, 'Source Type'),
      a('spec_target_type', true, 'Target Type'), a('relation_spec_cardinality', false, 'Cardinality'),
      a('required', false),
    ],
  },
  blueprint: {
    description: 'ext:blueprint — declares a document type for Record extraction and container instantiation.',
    purpose: 'Describes a Blueprint: the root Record Types it produces, its Relation structure, and required Types.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true), a('description', true),
      a('root_types', true, 'Root Types'), a('structure', false), a('required_types', false, 'Required Types'),
      a('tags', false), a('created_at', true),
    ],
  },
  term: {
    description: 'A defined entry within a Vocabulary. Terms carry stable identity, a key, optional enrichment, and status.',
    purpose: 'Describes a Term: its key, aliases, roles, and status.',
    assignments: [
      a('id', true), a('version', true), a('namespace', true),
      a('key', true, undefined, 'The string that appears in instance data. Unified substrate key field.'),
      a('label', false), a('description', false), a('aliases', false), a('roles', false),
      a('status', false), a('meta', false), a('created_at', false), a('updated_at', false, 'Updated At'),
    ],
  },
  'promotion-window': {
    description: 'RFC-006 V10 — a grace window for a Vocabulary\'s open-to-closed promotion.',
    purpose: 'Describes the bound (date or package version) after which open-mode violations become errors.',
    assignments: [a('until', true)],
  },
  vocabulary: {
    description: 'A named, versioned set of Term entries. Mode open means usage-authoritative; mode closed means vocabulary-authoritative.',
    purpose: 'Describes a Vocabulary: its mode, its Terms, and optional upstream-extension/promotion-window metadata.',
    assignments: [
      a('id', true), a('version', true), a('namespace', true), a('name', true),
      a('vocabulary_mode', true, 'Mode'), a('terms', true),
      a('extends_vocabulary_id', false, 'Extends Vocabulary Id'), a('extends_vocabulary_version', false, 'Extends Vocabulary Version'),
      a('promotion_window', false, 'Promotion Window'), a('description', false), a('tags', false), a('created_at', true),
    ],
  },
  lifecycle: {
    description: 'A standalone, installable, referenceable lifecycle container — a closed vocabulary of states plus transitions and an initial state (distinct from the inline type-lifecycle facet).',
    purpose: 'Describes an installable Lifecycle: its states, transitions, and initial state.',
    assignments: [
      a('id', true), a('version', true), a('namespace', true), a('name', true),
      a('states', true), a('transitions', true), a('initial_state', true, 'Initial State'),
      a('extends_lifecycle_id', false, 'Extends Lifecycle Id'), a('extends_lifecycle_version', false, 'Extends Lifecycle Version'),
      a('description', false), a('tags', false), a('created_at', true),
    ],
  },
  'source-anchor': {
    description: 'RFC-017 — locates an excerpt within its parent source document.',
    purpose: 'Describes a SourceAnchor: how the excerpt location is expressed and its locator value.',
    assignments: [a('anchor_kind', true, 'Kind'), a('value', true), a('note', false)],
  },
  'source-excerpt': {
    description: 'RFC-017 — repository-local excerpt provenance: the content file is a frozen captured snippet from another source document in the same repository.',
    purpose: 'Describes a SourceExcerpt: its parent document, locator, and capture provenance.',
    assignments: [
      a('source_document_id', true, 'Source Document Id'), a('anchor', false),
      a('captured_at', false, 'Captured At'), a('captured_by', false, 'Captured By'),
      a('source_checksum_at_capture', false, 'Source Checksum At Capture'),
    ],
  },
  'source-document-meta': {
    description: 'ext:repository — metadata sidecar for a source document in source-documents/.',
    purpose: 'Describes a SourceDocumentMeta: the document\'s content locator, type, and provenance.',
    assignments: [
      a('document_id', true, 'Document Id'), a('content_path', true, 'Content Path'), a('content_type', true, 'Content Type'),
      a('encoding', false), a('language', false), a('title', false), a('description', false),
      a('processing_note', false, 'Processing Note'), a('excerpt', false), a('date', false),
      a('tags', false), a('created_at', true), a('imported_at', false, 'Imported At'),
    ],
  },
  // -------------------------------------------------------------------------------------------
  // srs#541 (Task 4b/6 residual): the six entities #526 parked, plus their nested value objects.
  // Per-entity exclusions (documented, not silent — the seed may always carry more, same latitude
  // every prior entity already has): DiscoveryQuery.tier (bare untyped-integer enum, the #534-
  // tracked emitter gap); Container.containerType (already modelled, reused here); Manifest.
  // changelogPath (deprecated, no per-property deprecation mechanism — same reason as Container.
  // containerType) and Manifest.meta (an openly-shaped bag with one documented-but-optional legacy
  // key, not a clean map — unlike RelationTypeDefinition.meta/lifecycle-state.meta, which ARE plain
  // maps and reuse the `meta` Field as a real FieldAssignment); Composition/View's own aiGuidance
  // is EITHER excluded (Composition: bare `{type:object}`, no structure to model, same as
  // Blueprint's own aiGuidance/lineage/provenance) OR modelled via its own narrower value-object
  // Type when the seed genuinely has structure (Manifest.aiGuidance, View.aiGuidance — each
  // distinct in shape from the generic `ai-guidance` Type and each other); Composition/View's
  // lineage/provenance are bare `{type:object}` in the committed seed (unlike the definition-layer
  // Lineage/Provenance value objects) and are excluded for the same reason as Blueprint's.
  //
  // DocumentSection.source (SectionSource) and View.fieldViews are NOT modelled at all — both are
  // JSON-Schema `oneOf` unions (SectionSource: two anonymous, differently-required, discriminated
  // object branches with no base `properties` bag outside the union; View.fieldViews: an array
  // whose `items` is `oneOf` of two DIFFERENT $refs). The metamodel's FieldType system has no
  // discriminated-union datatype — every Type composes to one flat object — so nothing here can
  // emit a shape that would close against either seed's `oneOf` (which itself collapses to `{}`
  // under scripts/lib/schema-closure.mjs's envelope-stripping, since neither has a flat properties
  // bag alongside the union). This is a genuine FINDING (the #535 lifecycle precedent), not
  // sloppiness or an #534 gap (#534's own three gaps — map-of-$ref, $defs-only bundles, untyped-
  // integer enums — do not cover a discriminated union): filed as its own emitter-capability gap,
  // srs#543, sibling to #534. FieldView and RecordPropertyView are each independently
  // modelled and closure-proven against their OWN `$def` (view.json#/$defs/FieldView and
  // #/$defs/RecordPropertyView, both plain flat objects on their own) — the exclusion is scoped to
  // exactly the discriminated wrapper, not the row shapes themselves.
  // -------------------------------------------------------------------------------------------
  'relation-type-definition': {
    description: 'Declares a named relation type within a package\'s relation type vocabulary. Relation types describe the semantic meaning and structural shape of a class of relations.',
    purpose: 'Describes a RelationTypeDefinition: its key, category, direction/inverse hints, and structural constraints.',
    assignments: [
      a('id', true), a('version', true), a('key', true), a('namespace', true), a('label', true),
      a('description', true), a('category', true), a('canonical_direction', false, 'Canonical Direction'),
      a('inverse_type', false, 'Inverse Type'), a('irreflexive', false), a('require_same_type', false, 'Require Same Type'),
      a('status', false), a('created_at', true), a('updated_at', false, 'Updated At'), a('meta', false),
    ],
  },
  'discovery-query': {
    description: 'ext:discovery (RFC-012) — a conjunction of zero or more structured filter predicates. An instance matches if and only if it satisfies all predicates whose values are specified. Modelled minus `tier` (a bare untyped-integer enum — the #534-tracked emitter gap; documented exclusion, same latitude every other entity already has, e.g. Container.containerType).',
    purpose: 'Describes a DiscoveryQuery: its structured filter predicates over type, container, tags, lifecycle state, and free text.',
    assignments: [
      a('type_id', false, 'Type Id'), a('type_namespace', false, 'Type Namespace'), a('type_name', false, 'Type Name'),
      a('discovery_container_id', false, 'Container Id'), a('tag', false),
      a('lifecycle_state', false, 'Lifecycle State'), a('lifecycle_states', false, 'Lifecycle States'),
      a('exclude_lifecycle_states', false, 'Exclude Lifecycle States'), a('content_match', false, 'Content Match'),
    ],
  },
  'export-config': {
    description: 'ext:views-l1 — configuration for rendering a Record (or a Composition\'s document-level output) as an exportable document. Shared by View.exportConfig and Composition.exportConfig (srs#525: one shape, two attachment points, no override semantics between them).',
    purpose: 'Describes an ExportConfig: target output format, preamble template, and empty-field handling.',
    assignments: [a('export_format', false, 'Format'), a('preamble', false), a('omit_empty_fields', false, 'Omit Empty Fields')],
  },
  'package-ref': {
    description: 'A reference to an SRS Package that supplies field and type definitions, either local (in-repository) or remote (pre-installed in the consumer\'s registry).',
    purpose: 'Describes a PackageRef: its locator mode and package identity hints.',
    assignments: [
      a('package_ref_mode', true, 'Mode'), a('path', false), a('package_id', false, 'Package Id'),
      a('package_name', false, 'Package Name'), a('package_version', false, 'Package Version'),
    ],
  },
  'rendered-presentation': {
    description: 'RFC-015 [N+31] — a declared presentation of a repository: a Composition that a conformant viewer should offer as a rendered entry point.',
    purpose: 'Describes a RenderedPresentation: which Composition it points to, and rendering hints.',
    assignments: [
      a('composition_id', true, 'Composition Id'), a('is_default', false, 'Is Default'),
      a('export_format', false, 'Format'), a('output_path', false, 'Output Path'),
    ],
  },
  'upstream-package': {
    description: 'RFC-014 (ext:import-tracking) — normative provenance stamp recording the upstream Package a repository was initialised from.',
    purpose: 'Describes an UpstreamPackage: its identity, version, and install time.',
    assignments: [
      a('package_id', true, 'Package Id'), a('namespace', true), a('name', true),
      a('upstream_semver', true, 'Version'), a('installed_at', true, 'Installed At'),
    ],
  },
  'slice-origin': {
    description: 'ext:slices (RFC-026) — identifies the source repository a Slice was exported from.',
    purpose: 'Describes a Slice\'s origin: the source repositoryId.',
    assignments: [a('repository_id', true, 'Repository Id')],
  },
  'slice-spec': {
    description: 'ext:slices (RFC-026) — identifies the closure rule and boundary that scoped a Slice.',
    purpose: 'Describes a SliceSpec: its closure rule type and boundary UUID.',
    assignments: [a('slice_spec_type', true, 'Type'), a('id', true)],
  },
  'slice-external-ref': {
    description: 'ext:slices (RFC-026) — a relation cut at export time because exactly one endpoint was outside the closure.',
    purpose: 'Describes a SliceExternalRef: the cut relation\'s identity, endpoints, and type.',
    assignments: [
      a('relation_id', true, 'Relation Id'), a('source_instance_id', true, 'Source Instance Id'),
      a('target_instance_id', true, 'Target Instance Id'), a('relation_type_name', true, 'Relation Type'),
    ],
  },
  slice: {
    description: 'ext:slices (RFC-026) — present when this archive is a partial export (slice) of a source repository.',
    purpose: 'Describes a Slice: its origin, closure spec, export time, and cut external relation refs.',
    assignments: [
      a('slice_origin', true, 'Origin'), a('spec', true), a('exported_at', true, 'Exported At'),
      a('external_relation_refs', false, 'External Relation Refs'),
    ],
  },
  'repository-ai-guidance': {
    description: 'Comprehension guidance for AI agents reading a repository (Manifest.aiGuidance) — distinct in shape from the generic AiGuidance value object (RFC-033), which serves Field/Type guidance instead.',
    purpose: 'Describes a repository\'s AI guidance: a summary, suggested entry points, and navigation hints.',
    assignments: [a('summary', false), a('suggested_entry_points', false, 'Suggested Entry Points'), a('navigation_hints', false, 'Navigation Hints')],
  },
  manifest: {
    description: 'RFC-038 — root file for an ext:repository: the repository identity and entry point. Membership is the tree (RFC-038 [R1]); the manifest carries no index.',
    purpose: 'Describes a repository Manifest: its identity, package references, root Container, and declared presentations.',
    assignments: [
      a('srs_version', true, 'Srs Version'), a('data_model_revision', false, 'Data Model Revision'),
      a('repository_id', true, 'Repository Id'), a('namespace', false),
      a('title', true), a('description', false), a('declared_extensions', false, 'Declared Extensions'),
      a('container', true), a('package_ref', false, 'Package Ref'), a('package_refs', false, 'Package Refs'),
      a('upstream_package', false, 'Upstream Package'), a('source_documents_path', false, 'Source Documents Path'),
      a('repository_ai_guidance', false, 'Ai Guidance'), a('rendered_presentations', false, 'Rendered Presentations'),
      a('slice', false), a('created_at', true), a('updated_at', false, 'Updated At'),
    ],
  },
  'relation-presentation-entry': {
    description: 'RFC-027 — declares which relation type a RelationsPresentation displays for a member, and how.',
    purpose: 'Describes a RelationPresentationEntry: its relation type, display directions, and label overrides.',
    assignments: [
      a('relation_type_name', true, 'Relation Type'), a('directions', false),
      a('forward_label', false, 'Forward Label'), a('inverse_label', false, 'Inverse Label'),
    ],
  },
  'relations-presentation': {
    description: 'RFC-027 — when present on a DocumentSection, render a deterministic per-member links block after each member the section renders.',
    purpose: 'Describes a RelationsPresentation: which relation types to display, in order.',
    assignments: [a('include', true), a('label', false)],
  },
  'navigation-link': {
    description: 'Assembly-time cross-section reading aid within a Composition. Does not appear in the Relation graph.',
    purpose: 'Describes a NavigationLink: the two sections it connects, an optional label, and directionality.',
    assignments: [
      a('from_section_id', true, 'From Section Id'), a('to_section_id', true, 'To Section Id'),
      a('label', false), a('bidirectional', false),
    ],
  },
  'theme-reference': {
    description: 'ext:themes-l1 — a pointer to a Theme, following the same mode-based reference pattern as Manifest.packageRef.',
    purpose: 'Describes a ThemeReference: its locator mode and theme identity hints.',
    assignments: [
      a('theme_reference_mode', true, 'Mode'), a('path', false), a('url', false), a('theme_id', false, 'Theme Id'),
    ],
  },
  'theme-variant': {
    description: 'A named alternative theme selectable at render time instead of Composition.themeRef.',
    purpose: 'Describes a ThemeVariant: its name and the ThemeReference it selects.',
    assignments: [a('name', true), a('description', false), a('theme_ref', true, 'Theme Ref')],
  },
  'composite-renderer-directive': {
    description: 'RFC-036 Change B (ext:views-l2) — a CompositeRendererBinding plus the composite-range Field it binds. Presentation only.',
    purpose: 'Describes a CompositeRendererDirective: which Field it binds and which renderer dispatches it.',
    assignments: [a('field_id', true, 'Field'), a('renderer', true), a('renderer_roles', false, 'Roles')],
  },
  'section-ordering': {
    description: 'DocumentSection.ordering — field-based sort direction, or an explicit member-order presentation sequence, for a DocumentSection.',
    purpose: 'Describes a DocumentSection\'s ordering directive.',
    assignments: [a('field_id', false, 'Field'), a('sort_direction', false, 'Direction'), a('member_order', false, 'Member Order')],
  },
  'document-section': {
    description: 'One section within a Composition. `source` (SectionSource) is excluded — a JSON-Schema `oneOf` of two anonymous discriminated branches with no flat properties bag outside the union; no discriminated-union datatype exists in the metamodel today (srs#541 finding, filed as its own emitter-capability gap).',
    purpose: 'Describes a DocumentSection: its identity, ordering, rendering dispatch, and per-record presentation directives.',
    assignments: [
      a('section_id', true, 'Section Id'), a('title', false), a('description', false), a('order', true),
      a('render_view_id', false, 'Render View Id'), a('type_dispatch', false, 'Type Dispatch'),
      a('title_field_id', false, 'Title Field Id'), a('section_ordering', false, 'Ordering'),
      a('required', false), a('empty_behavior', false, 'Empty Behavior'),
      a('composite_renderers', false, 'Composite Renderers'), a('relations_presentation', false, 'Relations Presentation'),
    ],
  },
  composition: {
    description: 'RFC-038/srs#523 (renamed from DocumentView) — a versioned, Container-level projection assembling multiple Records from a Container into a coherent, ordered document (ext:views-l2). `containerType` (deprecated, no per-property deprecation mechanism modelled), `aiGuidance`/`lineage`/`provenance` (bare implementation-defined bags in this file, no real internal structure — same reasoning as Blueprint\'s own) are excluded.',
    purpose: 'Describes a Composition: its identity, sections, rendering configuration, and theming.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true), a('description', true),
      a('root_type_refs', false, 'Root Type Refs'), a('document_sections', true, 'Sections'),
      a('composite_renderers', false, 'Composite Renderers'), a('navigation_links', false, 'Navigation Links'),
      a('export_config', false, 'Export Config'), a('depth_offset', false, 'Depth Offset'),
      a('theme_ref', false, 'Theme Ref'), a('theme_variants', false, 'Theme Variants'),
      a('tags', false), a('created_at', true), a('updated_at', false, 'Updated At'),
    ],
  },
  'composite-renderer-binding': {
    description: 'RFC-036 Change A (ext:views-l1) — a view-owned composite rendering dispatch record. Presentation only.',
    purpose: 'Describes a CompositeRendererBinding: which named renderer to dispatch to, and role bindings.',
    assignments: [a('renderer', true), a('renderer_roles', false, 'Roles')],
  },
  'view-ai-guidance': {
    description: 'Guidance for AI agents using a View (View.aiGuidance) — a narrower shape than the generic AiGuidance value object (RFC-033): purpose + extraction only, no negativeGuidance/examples.',
    purpose: 'Describes a View\'s AI guidance: its purpose and extraction instruction.',
    assignments: [a('purpose', false), a('extraction', false)],
  },
  'field-view': {
    description: 'ext:views-l1 — presentation configuration for one Field within a View.',
    purpose: 'Describes a FieldView: which Field it presents, its order, and rendering overrides.',
    assignments: [
      a('field_id', true, 'Field'), a('order', true), a('required', false), a('visible', false),
      a('display_label', false, 'Display Label'), a('display_hint', false, 'Display Hint'),
      a('editor_hint_override', false, 'Editor Hint Override'), a('composite_renderer', false, 'Composite Renderer'),
    ],
  },
  'record-property-view': {
    description: 'ext:views-l1 — presentation configuration for one record-level property (lifecycleState/tags/createdAt/updatedAt) within a View.',
    purpose: 'Describes a RecordPropertyView: which record-level property it presents, its order, and rendering overrides.',
    assignments: [
      a('property', true), a('order', true), a('display_label', false, 'Display Label'), a('visible', false),
    ],
  },
  view: {
    description: 'ext:views-l1 — a versioned presentation and export configuration over a field set. `fieldViews` (a `oneOf` of FieldView | RecordPropertyView) and `lineage`/`provenance` (bare implementation-defined bags in this file) are excluded — see the srs#541 finding above.',
    purpose: 'Describes a View: its identity, compatible types, export configuration, and AI guidance.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true), a('description', true),
      a('compatible_types', false, 'Compatible Types'), a('export_config', false, 'Export Config'),
      a('view_ai_guidance', false, 'Ai Guidance'), a('tags', false), a('created_at', true), a('updated_at', false, 'Updated At'),
    ],
  },
  // -- srs#379: ext:protocol. Generated from docs/schema/2.0/protocol.json (the ruled, unprefixed
  // shape a decision record settled — the interim `protocol`-prefixed shape #297/#378 shipped no
  // longer matches this prose); proven via scripts/rfc-379-closure-test.mjs, same discipline as
  // rfc-272/rfc-541 (emitter ⊆ committed seed, never overwriting it — the authorship flip is #260).
  // A package-declared definition entity, exactly parallel to Blueprint, not an instance-layer one.
  'field-ref': {
    description: 'ext:protocol — a reference to a Field within a Type, optionally scoped to which Type it appears in.',
    purpose: 'Describes a FieldRef: the Field it points to, and which Type it appears in when the same fieldId appears in several.',
    assignments: [
      a('field_id', true, 'Field', 'References a Field by its stable id.'),
      a('type_id', false, 'Type Id', 'Which Type this Field appears in, when the same fieldId appears in several.'),
    ],
  },
  'protocol-stage': {
    description: 'ext:protocol — a named stage in a Protocol. Stages carry epistemic dependencies (dependsOn), not merely ordering: a stage may proceed only when its dependencies are sufficient.',
    purpose: 'Describes a ProtocolStage: its identity, composition order, epistemic dependencies, and what it contributes.',
    assignments: [
      a('stage_id', true, 'Stage Id'),
      a('name', true, undefined, 'Short, human-readable stage name (e.g. "Background", "Key requirements") — not the definitional snake_case name every other entity\'s `name` property carries.'),
      a('order', true, undefined, 'The declared composition order of the stages — structure, not presentation; provides the render default. Execution order is determined by dependsOn (Invariant 31).'),
      a('purpose', false, undefined, 'What understanding this stage builds.'),
      a('question', false),
      a('stage_depends_on', false, 'Depends On'),
      a('completion_criteria', false, 'Completion Criteria'),
      a('contributes_to', false, 'Contributes To'),
      a('output_type', false, 'Output Type'),
      a('ai_guidance', false, 'AI Guidance', 'Extraction guidance for an AI assistant working this stage.'),
    ],
  },
  protocol: {
    description: 'ext:protocol — an epistemically ordered process for building quality Records through structured conversation or facilitation. A package definition (package.json `protocols[]`), not an instance Record.',
    purpose: 'Describes a Protocol: its identity, the Type it converges on, and its ordered stages.',
    assignments: [
      a('id', true), a('namespace', true), a('name', true), a('version', true), a('description', false),
      a('target_type', true, 'Target Type'), a('stages', true),
      a('tags', false), a('created_at', true),
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
      // RFC-040 Unit 3 (srs#479): `asg.desc` text is authored (matching the frozen seed's exact
      // per-property annotation strings) but deliberately NOT written to `fa.description` yet. Every
      // metamodel Type record's `fields[]` validates against `type.json#/$defs/FieldAssignment` in
      // the PINNED srs-rust binary's own EMBEDDED schema copy (build.284, and no later release up to
      // build.294 either) — which predates Change C and has `additionalProperties:false` there, so
      // populating `description` on ANY FieldAssignment entry makes `srs repo validate --repo srs`
      // fail to LOAD the catalog at all (16+ fatal diagnostics, not one). This is the exact class
      // srs-rust#868 already parked a schema-touching srs-side change for (packageDependencies): land
      // the mechanism, park the corpus data until the srs-rust mirror-sync ships a compatible release.
      // Flip this back on (`if (asg.desc) fa.description = asg.desc;`) once that follow-up lands and
      // the pin advances — the text is already here, byte-matched against the seed, ready to go.
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
  if (spec.fieldOrder) out.fieldOrder = spec.fieldOrder.map((n) => fieldIdByName[n]);
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
