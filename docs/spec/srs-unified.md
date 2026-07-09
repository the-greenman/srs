# Semantic Record System Specification

## Specification

### Purpose and Scope

**Content**: 
#### What this specification defines

**Content**: The Semantic Record System (SRS) specification defines an interoperable standard for semantic field and type definitions, records, relations, and the mechanisms by which these artefacts are created, shared, versioned, and distributed across independent implementations.

This specification covers:

- **Field** — atomic reusable semantic unit
- **Type** — named composition of fields for a specific semantic object type
- **Record** — instantiated type with field values; three semantic maturity tiers (Note, Typed Record, Record)
- **Relation** — first-class typed link between records
- **Container** — grouping boundary for record collections
- **Distribution** — Package, Reference, Lineage, Provenance
- **Extensions** — optional, independently adoptable capabilities declared by conforming implementations

#### What this specification does not define

**Content**: - **Session** — live collaborative process model (future version)
- **Registry protocol** — how registries communicate, authenticate, or federate; this specification defines data shapes only
- **Universal semantic ontology** — domain-specific vocabularies are the responsibility of namespace authors

#### Relationship to implementing systems

**Content**: This specification is implementation-neutral. Implementations are expected to validate inputs against these schemas at their system boundaries. The specification does not constrain persistence technology, API design, UI rendering, or prompt assembly strategy.

#### Extension conformance model

**Content**: Implementations declare conformance as:

```
SRS Core [+ ext:<name> ...]
```

**Core** requires the Foundation group and Distribution group in full. No extension is required for core conformance. Extensions are independently adoptable; some declare dependencies on other extensions.

| Extension | Identifier | Depends on | Notes |
|---|---|---|---|
| Addressability | `ext:addressability` | — | For live facilitation, declare together with `ext:protocol` |
| Lifecycle | `ext:lifecycle` | — | |
| Protocol | `ext:protocol` | `ext:lifecycle` (recommended) | For live facilitation, declare together with `ext:addressability` |
| Type Inheritance | `ext:type-inheritance` | — | |
| Views L1 | `ext:views-l1` | — | |
| Views L2 | `ext:views-l2` | `ext:views-l1` | |
| Repeatable Fields | `ext:repeatable-fields` | — | |
| Field Groups | `ext:field-groups` | — | Group repeatability is self-contained; `ext:repeatable-fields` is not required |
| Cross-Field Validation | `ext:cross-field-validation` | — | |
| Recommended Relations | `ext:recommended-relations` | — | |
| Import Tracking | `ext:import-tracking` | — | |
| Registry | `ext:registry` | — | |
| Federation | `ext:federation` | — | Cross-repository instance references, repository registry, and federation event log |
| Repository | `ext:repository` | — | File-based live repository and archive (export/import) format |

`ext:protocol` and `ext:addressability` are formally independent but are a functional co-dependency for live facilitation: a Protocol without `AttentionState` produces no live conversation tagging; `AttentionState` without Protocol stages has no stage context to capture. Implementations supporting live facilitation should declare both.

**Blueprint is a core package definition**, not a declarable extension. `Blueprint` is included in `Package.blueprints[]` when needed; no `ext:blueprint` declaration is required or defined.

Example declaration: `SRS Core + ext:lifecycle + ext:protocol + ext:views-l1 + ext:addressability`

---


### Namespace Format

**Content**: 
#### Convention

**Content**: Namespaces are dot-separated identifiers using lowercase alphanumeric characters and hyphens.

```
<component>[.<component>]*

component = [a-z0-9][a-z0-9-]*
```

Examples:
```
core
community.adr
com.acme.hr
org.cooperative-name
```

#### Reserved namespaces

**Content**: `core` is reserved for definitions maintained by the SRS standard. Implementations must not allow user-created definitions in the `core` namespace.

#### Reference format

**Content**: A specific version of a definition is referenced using the canonical form:

```
namespace/name@version
```

Examples:
```
core/decision_statement@2
community.adr/review_rationale@1
com.acme.hr/headcount_impact@3
```

The `/` and `@` characters are reserved separators. They must not appear within a namespace component or a name.

#### Name convention

**Content**: Field and Type names are programmatic keys in `snake_case`. Names are stable within a namespace and version lineage. A new name means a new definition.

---


### Schema Notation

**Content**: Types are described using TypeScript-style notation. Optional fields are marked with `?`. All `UUID` values are RFC 4122 UUID strings. All `ISO8601` values are datetime strings with timezone offset. `integer` means a positive integer unless otherwise noted.
#### Version semantics

**Content**: Version numbers are positive integers scoped to a definition's UUID lineage.

| Change | Version action |
|---|---|
| Documentation, typo, formatting only | Optional bump |
| `description`, `instructions`, or `aiGuidance.purpose` reworded without semantic change | Minor bump recommended |
| `aiGuidance.extraction` or `aiGuidance.purpose` changed in meaning | Version bump required |
| `valueType`, `selectOptions`, or `validationRules` changed | Version bump required |
| `name` changed | New definition required (new UUID) |
| `namespace` changed | New definition required (new UUID) |

When in doubt: if a downstream consumer's AI extraction, validation, or governance logic would behave differently, a version bump is required.

---


### Foundation Group (Core)

**Content**: The Foundation group is required for all conforming implementations.
#### Supporting types

**Content**: #### `ValidationRule`

A constraint applied to a field value.

```typescript
{
  type: "required" | "minLength" | "maxLength" | "pattern" | "enum"
  value?: string | number | string[]  // required for minLength, maxLength, pattern, enum
  message?: string
}
```

#### `AiGuidanceExample`

A single example for AI guidance.

```typescript
{
  description?: string  // labels this example
  input?: string        // sample source text; omit for output-only examples
  output: string        // the ideal value the AI should produce
}
```

`output` is required. An example without `input` demonstrates expected output form without requiring a specific source.

#### `AiGuidance`

Structured AI guidance for a Field or Type.

```typescript
{
  purpose: string            // what this field/type captures (1-2 sentences)
  extraction?: string        // LLM instruction for how to extract or populate
  negativeGuidance?: string  // what the LLM must NOT include or do
  examples?: AiGuidanceExample[]
}
```

The minimum valid `AiGuidance` is `{ purpose: "..." }`.

---

#### Field

**Content**: The atomic reusable semantic unit. Fields are defined once and composed into Types. A Field's `aiGuidance`, `validationRules`, and `valueType` belong to the Field, not to any Type that includes it.

```typescript
{
  // Stable identity
  id: UUID
  namespace: string
  name: string       // snake_case programmatic key
  version: integer   // min: 1; increments within this id's lineage

  // Semantic content
  description: string      // one-sentence user-facing summary
  instructions?: string    // fuller guidance for a human completing this field
  aiGuidance: AiGuidance

  // Value semantics — stable across renderers
  valueType: "string" | "text" | "number" | "boolean" | "date" | "url" | "select" | "multiselect"
  selectOptions?: string[]   // required when valueType is "select" or "multiselect"
  validationRules?: ValidationRule[]
  contentFormat?: "plain" | "markdown"
  // Meaningful only when valueType is "string" or "text". Default: "plain".
  // Describes the content of the value, not the editing surface (see editorHint).
  // "plain"    — unformatted prose; renderers must not interpret markup
  // "markdown" — CommonMark subset; renderers should parse and display formatting
  // AI extractors must produce output conforming to this format: a field with
  // contentFormat "markdown" should receive structured markdown from extraction.

  // Editor hint — projection-specific default; implementations and Views may override
  editorHint?: "singleline" | "textarea" | "rich-text" | "date-picker" | "dropdown" | "multi-select" | "voice"

  // Classification
  tags?: string[]

  // Metadata
  createdAt: ISO8601
  lineage?: Lineage      // see Distribution group
  provenance?: Provenance
}
```

**`valueType` semantics:**

| Value | Meaning |
|---|---|
| `"string"` | Short single-value text (typically one line) |
| `"text"` | Potentially long multi-paragraph prose |
| `"number"` | Numeric value |
| `"boolean"` | True/false |
| `"date"` | ISO 8601 date or datetime |
| `"url"` | A URL string |
| `"select"` | One value from `selectOptions` |
| `"multiselect"` | One or more values from `selectOptions` |

`valueType` is the stable semantic data type. `editorHint` is a rendering default. AI extraction, validation, and export formatting must depend only on `valueType`. `contentFormat` refines how `string` and `text` values should be produced and rendered, but does not alter the `valueType`.

#### `vocabularyRef` — binding select fields to shared vocabularies

When `valueType` is `"select"` or `"multiselect"`, a Field declares exactly one of:

```typescript
selectOptions?: string[]   // inline anonymous closed vocabulary (sugar; retained for simple cases)
vocabularyRef?: Reference  // bind to a named, installed Vocabulary (id + version)
```

`selectOptions` is formally sugar for an anonymous inline closed vocabulary. `vocabularyRef` is used when the value set is shared, extensible, or needs Term identity. A `vocabularyRef` MUST resolve to a `Vocabulary` with `mode: closed` (V3). Declaring both, or neither when `valueType` is `select`/`multiselect`, is a validation error (V3).

---

#### Type

**Content**: A named, versioned composition of Fields for a specific semantic object type.

```typescript
{
  // Stable identity
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  // Content
  description: string        // when to use this Type; what semantic object it defines
  aiGuidance?: AiGuidance    // Type-level LLM framing; see AI guidance composition in rationale

  // Semantic object type (optional, informative)
  semanticObjectType?: string
  // e.g. "decision", "task", "risk", "budget_line", "requirement"
  // Free-form. Implementations may use as a rendering or grouping hint.
  // No conforming implementation is required to act on it.

  // Composition
  fields: FieldAssignment[]
  // type inheritance, fieldGroups, and validationRules are extensions; see
  // ext:type-inheritance, ext:field-groups, and ext:cross-field-validation

  // lifecycle is an extension; see ext:lifecycle

  // Classification
  tags?: string[]

  // Metadata
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

#### `FieldAssignment`

A Field reference within a Type. Configures presentation without redefining field semantics.

```typescript
{
  fieldId: UUID     // references Field.id
  order: integer    // min: 0; display and processing order within the Type
  required?: boolean  // default: true

  // Presentation-only — must NOT affect AI guidance, extraction, valueType, or validation
  displayLabel?: string
  displayHint?: string
}
```

`displayLabel` and `displayHint` are strictly for rendering. If a materially different label or meaning is needed, a distinct Field with its own lineage is required.

Repeatability fields (`repeatable`, `minItems`, `maxItems`) are defined in `ext:repeatable-fields`.

The Type's effective field list is `fields[]` unless `ext:type-inheritance` is declared and the Type extends another Type. In that case, the effective field list also includes inherited fields as defined by `ext:type-inheritance`.

**AI guidance composition order** (recommended):

1. Type framing (`Type.aiGuidance.extraction`) — establishes the semantic object type
2. View framing (`View.aiGuidance.extraction`, if `ext:views-l1` is in use) — workflow-specific context
3. Field extraction guidance (`Field.aiGuidance.extraction`)
4. Negative guidance (`Field.aiGuidance.negativeGuidance`)
5. Examples (`Field.aiGuidance.examples`)

This is a recommended default, not a required invariant. Implementations that compose differently will produce different AI behaviour from the same definitions.

**On instance migration when a Type version changes:**
A Record binds to a specific `typeVersion` at creation time. Existing Records do not automatically migrate when a new Type version is published. Conformance is measured against the version the Record was instantiated under. When a Record is migrated and exchanged, it should carry the version it now conforms to, and the original Record should be preserved and linked via a `supersedes` Relation.

#### `lifecycleRef` — referencing shared lifecycle definitions

When `ext:lifecycle` is in use, a Type declares a lifecycle in exactly one of two mutually exclusive forms (V7):

```typescript
// Inline — simple cases; effective set is own states/transitions only:
lifecycle?: { states: LifecycleState[]; transitions: LifecycleTransition[]; initialState: string }

// Referenced — shared, installable Lifecycle:
lifecycleRef?: Reference   // resolves to an installed Lifecycle (V8)
```

Declaring both is a validation error. An inline lifecycle cannot extend; use `lifecycleRef` when the same state machine is needed across multiple Types.

---

#### Record tiers

**Content**: SRS supports three semantic maturity tiers. Implementations are not required to support all three; they may begin at Tier 2.

| Tier | Type | Structure | Semantics |
|---|---|---|---|
| **0** | `Note` | Named sections + free text | None |
| **1** | `Typed Record` | Named fields with types and values | Minimal |
| **2** | `Record` | Fields bound to a `Type` definition | Full |

Graduation path: Note → Typed Record → Record.

#### `NoteSection`

A named text section within a Note.

```typescript
{
  name: string          // section key; unique within the Note; snake_case recommended
  label?: string
  content: string
  contentHint?: "text" | "markdown" | "plain"  // hint only; default: "text"
  tags?: string[]       // section-level topic labels; supplements or narrows Note-level tags
}
```

#### `Note`

A lightweight instance with no Type binding.

```typescript
{
  instanceId: UUID

  title?: string
  tags?: string[]           // free-form topic labels; snake_case recommended
  sections: NoteSection[]

  graduatedAt?: ISO8601
  // When set, signals full formalisation. Authoritative record of successors
  // is in derived-from Relations from the successor Records.

  sourceRefs?: SourceReference[]
  // Instance-level source references. Because Notes have no Fields, this is
  // the only place to record provenance for a Note as a whole.

  createdAt?: ISO8601
  updatedAt?: ISO8601
  meta?: Record<string, unknown>
}
```

`tags` are free-form labels that allow Notes to be grouped and discovered by topic. A tag is a key that *may* resolve to a `Term` in an open `Vocabulary`, giving it a label, aliases, roles, and lineage — without changing the fact that the instance stores only the string (V2). Undefined tags in an open vocabulary are valid and unenriched. Use tags for navigation and filtering; use Relations for semantic claims.

#### `TypedField`

A field within a Typed Record.

```typescript
{
  name: string
  label?: string
  valueType?: "string" | "text" | "number" | "boolean" | "date" | "url" | "select" | "multiselect"
  selectOptions?: string[]
  value: string | number | boolean | string[] | null
  source?: "human" | "ai" | "imported" | "derived"
  editedAt?: ISO8601
}
```

#### `Typed Record`

A structured instance with named, typed fields but no Type binding.

```typescript
{
  instanceId: UUID

  title?: string
  instanceType?: string  // lightweight semantic hint; not a formal type declaration

  fields: TypedField[]

  graduatedAt?: ISO8601

  sourceRefs?: SourceReference[]
  // Instance-level source references. TypedField has no sourceRefs of its own,
  // so this is the appropriate place to record provenance for the record as a whole.

  createdAt?: ISO8601
  updatedAt?: ISO8601
  meta?: Record<string, unknown>
}
```

#### `SourceReference`

A pointer from a field value or instance back to source material.

```typescript
{
  sourceType: "transcript-chunk" | "transcript-segment" | "external-document"
  sourceId: string
  sourceStandard?: string   // versioned standard the source conforms to
  streamId?: UUID           // for transcript sources: originating stream

  relationType?: "evidence" | "derived-from" | "quoted-from" | "inspired-by" | "supersedes-context"

  confidence?: number       // 0.0–1.0
  note?: string
}
```

`"transcript-chunk"` and `"transcript-segment"` are intended for implementations that have a stable conversation or time-stream layer with durable chunk or segment identifiers. A standalone repository that stores transcript exports, chat dumps, email threads, or similar source material directly under `source-documents/` should generally cite those files using `sourceType: "repository-document"` (see `ext:repository`) rather than inventing pseudo-chunk IDs.

#### `FieldValue`

The current value of a Field within a Record.

```typescript
{
  fieldId: UUID

  // Non-repeatable — use value
  value?: string | number | boolean | string[] | null

  // Repeatable — use entries (ext:repeatable-fields)
  entries?: FieldValueEntry[]

  source?: "human" | "ai" | "imported" | "derived"
  editedAt?: ISO8601

  sourceRefs?: SourceReference[]
}
```

`FieldValueEntry` is defined in `ext:repeatable-fields`.

#### `Record`

An instantiated Type with field values.

```typescript
{
  instanceId: UUID
  typeId: UUID         // references Type.id
  typeVersion: integer
  typeNamespace: string
  typeName: string

  // lifecycleState is ext:lifecycle
  lifecycleState?: string

  fieldValues: FieldValue[]

  // groupValues is ext:field-groups
  groupValues?: FieldGroupValue[]

  sourceRefs?: SourceReference[]

  createdAt?: ISO8601
  updatedAt?: ISO8601
  meta?: Record<string, unknown>
  // Use meta for implementation-local concerns: lock state, visibility,
  // session references. Cross-system keys should be namespaced,
  // e.g. "com.acme.locking.locked-by".
}
```

`typeNamespace` and `typeName` are denormalised convenience fields. If they conflict with the resolved Type, the `typeId`/`typeVersion` identity takes precedence and the Record is considered invalid until corrected.

**On instance revision:**
- **In-place edits** (`updatedAt` advances, `fieldValues` mutate): for minor corrections that do not alter semantic meaning.
- **Semantic updates**: produce a new Record linked to the prior by a `supersedes` or `refines` Relation. The prior Record remains valid.
- **Immutable records + Relation graph**: all Records append-only; a new Record for every change. A valid implementation strategy that naturally preserves history.

**Semantic meaning must not be silently rewritten.** When a change would alter what a Record means — not merely correct a transcription or formatting error — implementations must produce a successor Record linked to the prior by `supersedes` or `refines`. The prior Record remains valid. What constitutes a semantic change is determined by the Type's intended use; when in doubt, prefer a successor.

---

#### Relation

**Content**: A first-class typed link between instances. Relations allow implementations to construct semantic graphs for navigation, analysis, projection, and reasoning.

```typescript
{
  relationId: UUID

  relationType: string
  // Free-form. See ext:recommended-relations for canonical types and conventions.

  // source [relationType] target
  sourceInstanceId: UUID    // the asserting instance
  targetInstanceId: UUID    // the related instance

  assertedBy?: "human" | "ai" | "imported"
  confidence?: number       // 0.0–1.0; meaningful for ai-asserted
  createdAt?: ISO8601
  createdBy?: string

  status?: "proposed" | "active" | "rejected" | "superseded"
  validFrom?: ISO8601
  validUntil?: ISO8601

  notes?: string
  sourceRefs?: SourceReference[]
  meta?: Record<string, unknown>
}
```

**Directionality convention:**
`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target."

| Relation | source | target |
|---|---|---|
| `supersedes` | the newer Record | the older Record |
| `contains` | the stage | the task inside it |
| `depends-on` | the dependent task | the task it needs |
| `refines` | the detailed version | the rough version |
| `derived-from` | the successor | the source Note or Record |
| `evidences` | the source material | the claim it supports |

This convention must be consistent across implementations. See Invariant 16.

Relations span tiers. A Note may be the target of `derived-from` Relations from the Records it graduated into.

**Canonical relation types** (use these exact strings for cross-system interoperability):

`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`

Custom types not covered by these should use `namespace/name` format (e.g. `com.acme.hr/transferred-to`) to prevent collision. Extended relation type metadata is defined in `ext:recommended-relations`.

**Relations do not change lifecycle state.** A `supersedes` Relation does not mutate the prior Record's `lifecycleState`. Lifecycle state changes are explicit acts by an implementation's transition mechanism.

---

#### Container

**Content**: A lightweight grouping boundary over a collection of instances. Containers answer scoping questions — which instances belong together, what constitutes "this project" — that the Relation graph alone cannot answer.

Containers are not semantic objects with Fields. They do not own semantic state; Records do. A `contains` Relation asserts "A is part of B" (a semantic claim); a Container asserts "these instances form a unit for boundary purposes" (a scope claim). Both are needed; neither replaces the other.

```typescript
{
  containerId: UUID

  namespace?: string
  name?: string

  title: string              // human-readable label

  containerType?: string     // free-form hint; e.g. "project", "meeting", "sprint"

  rootInstanceIds?: UUID[]
  // Top-level instances this Container was created to hold. Implementations may
  // derive nested members by traversing contains Relations from these roots.

  memberInstanceIds?: UUID[]
  // Explicit membership list for all instances in scope.
  // When present, allows membership queries without graph traversal.
  // When omitted, membership is defined by traversing contains Relations.

  createdAt?: ISO8601
  updatedAt?: ISO8601
  meta?: Record<string, unknown>
}
```

`Container.containerId` is not an instance ID and must not appear in `Relation.sourceInstanceId` or `targetInstanceId`. See Invariant 19.

---

#### Vocabulary and Term

**Content**: SRS defines four controlled vocabularies — sets of strings that appear in instance data and must mean something stable. They share a common substrate: a `VocabularyEntry` contract satisfied by `Term`, `LifecycleState`, and `RelationTypeDefinition`.

### `VocabularyEntry` (substrate contract)

`VocabularyEntry` is a contract, not a serialised type. Every conforming entry carries:

```typescript
{
  id: UUID                  // stable identity
  version: integer          // min: 1
  namespace: string
  key: string               // the string in instance data — unified across all specialisations
  label?: string            // optional in substrate; specialisations MAY tighten to required
  description?: string      // optional in substrate; specialisations MAY tighten to required
  aliases?: string[]        // alternate keys resolving to this entry
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active (normative)
  properties?: Record<string, unknown>   // arbitrary metadata; unknown top-level fields rejected
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

**Absent `status` MUST be treated as `active`.** This is normative: all resolution rules (V1, V6, V9, V10) treat absent identically to `"active"`.

**Entries are keyed, not named.** Entries carry `key`, not `name`, and are addressed within their container. They are not independently `Reference`-able. Containers (`Vocabulary`, `Lifecycle`) have `name` and are the `Reference` targets.

**Required-field tightening.** `label` and `description` are optional so an emergent `Term` is valid before prose is written. A specialisation MAY tighten an optional substrate field to required; it MUST NOT relax a required one. `RelationTypeDefinition` requires both `label` and `description` (unchanged from RFC-005).

**One forward-compatibility policy.** Unknown top-level fields are rejected; arbitrary entry metadata goes in `properties`.

### `Vocabulary`

A named, versioned set of `Term` entries.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer          // min: 1

  mode: "open" | "closed"
  // open   — instances define what exists; Vocabulary is a curation overlay
  // closed — values MUST resolve to a Term (V1)

  terms: Term[]

  extendsVocabularyId?: UUID
  extendsVocabularyVersion?: integer   // required when extendsVocabularyId is present

  promotionWindow?: {
    until: string            // ISO8601 date or target package version; required when present
  }

  description?: string
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

### `Term`

The generalisation of `TagDefinition`. A defined option within a `Vocabulary`.

```typescript
{
  id: UUID
  version: integer
  namespace: string
  key: string
  label?: string
  description?: string
  aliases?: string[]
  roles?: string[]          // e.g. "foundation", "navigation"
  status?: "active" | "deprecated" | "tombstone" | "retired"
  properties?: Record<string, unknown>
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

### `RelationTypeDefinition`

A substrate specialisation that gives semantic meaning and validation rules to a class of relations. `key` is the string stored in `Relation.relationType`; this unifies the key-role field across all three substrate specialisations (RFC-006). `label` and `description` are tightened to required.

```typescript
{
  id: UUID
  version: integer
  namespace: string
  key: string               // the string stored in Relation.relationType; was "relationType" pre-RFC-006
  label: string             // required (tightened from substrate)
  description: string       // required (tightened from substrate)
  aliases?: string[]
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active
  properties?: Record<string, unknown>   // arbitrary metadata; unknown top-level fields rejected
  category: "composition" | "refinement" | "dependency" | "sequence" | "derivation" | "evidence" | "governance" | "association" | "lifecycle" | "provenance" | "other"
  canonicalDirection?: string
  inverseType?: string      // key of the inverse RelationTypeDefinition
  irreflexive?: boolean
  allowedSourceTypes?: string[]
  allowedTargetTypes?: string[]
  requireSameSemanticObjectType?: boolean
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

Relation type definitions live in `package.relationTypes[]` (distributable bundle) or `package/relation-types/` (repository layout). They are resolved repo-globally — all installed relation type definitions form a single flat namespace. Key uniqueness (V5) applies across this flat set.

### The four vocabularies

| Vocabulary | Binding scope | Container | Mode |
|---|---|---|---|
| Tags | ambient (whole repo) | `Vocabulary` (typically local, open) | `open` |
| Relation types | repo-global (any edge) | `package.relationTypes[]` (flat global set) | closed-extensible |
| Lifecycle states | type-bound, shareable | `Lifecycle` (inline or referenced) | `closed` |
| Field values | field-bound | `Vocabulary` via `vocabularyRef` or inline `selectOptions` | `closed` (V3) |

### Package integration

Vocabularies are Foundation-group definition types installed in packages alongside fields, types, and relationTypes:
- the distributable `Package` holds inline definitions: `vocabularies?: Vocabulary[]`
- the repository `package/package.json` holds relative paths: `"vocabularies": ["vocabularies/foo.json", ...]`

### Emergent vocabularies (open vocabularies)

For an open vocabulary, the authoritative set of values is `DISTINCT(tag keys across instances)` — not the `terms[]`. The `Vocabulary` is a curation overlay that may lag usage or be empty.

A conforming implementation MUST be able to compute the live tag set and classify each key as: **used-and-defined**, **used-but-undefined**, or **defined-but-unused**.

**Emergence lifecycle** (mirrors tier graduation):
1. Free string — exists, undefined, valid.
2. Curate → `Term` — non-destructive; instance carries the same string.
3. Alias-merge — a surviving Term absorbs another: absorbed key+aliases move to the survivor, absorbed entry removed (its `id` recorded in `properties.mergedFrom` and redirected); zero instance rewrites.
4. Optional normalize — opt-in operation that rewrites instance strings to the canonical key.
5. Optional close — promote `mode: open → closed` (V10).

### Resolution invariants

**V1 — Closed-vocabulary resolution.** Any value in a closed vocabulary must resolve to exactly one entry (matched by `key` or `alias`) in the effective entry set with `status` in {`active`, `deprecated`, `tombstone`} for reads and `active` for new writes.

Applies to: `Relation.relationType`, `select`/`multiselect` field values, `Record.lifecycleState`.

**V2 — Open-vocabulary resolution.** A value in an open vocabulary need not resolve; if it matches a `Term`, enrichment applies. When a value matches more than one entry (a warned V5 collision), resolution is deterministic: key match outranks alias match; ties broken by lexicographically smallest `id`.

Applies to: `Note.tags`, `NoteSection.tags`.

**V3 — Field binding exclusivity and closedness.** A `select`/`multiselect` Field must declare exactly one of `selectOptions` or `vocabularyRef`. A `vocabularyRef` on a `select`/`multiselect` Field MUST resolve to a `Vocabulary` with `mode: closed`.

**V4 — Vocabulary reference resolution.** A `vocabularyRef` must resolve to an installed `Vocabulary` in the effective package set.

**V5 — Effective entry set.** The effective entry set of a `Vocabulary` or `Lifecycle` is constructed as:
1. Include entries with effective `status` in {`active`, `deprecated`, `tombstone`}. Exclude `retired` entirely (before uniqueness, before V1).
2. Add transitively the entries of any extended container. The `extends*Version` must match the resolved upstream version; a mismatch is a hard validation error (not silent degradation).
3. Check uniqueness: duplicate `id`s are an error. In closed vocabularies, the union of all `key`s and `aliases` must be globally unique (key/key, key/alias, alias/alias collisions are errors). In open vocabularies, collisions are warnings (resolved by V2 tie-break).

Inline `Type.lifecycle` cannot extend; its effective set is its own `states`/`transitions`. V5 and V9 apply to inline lifecycles identically to referenced ones.

Excluding `retired` before uniqueness frees a retired key for reuse by a new entry. `tombstone` remains in the effective set and keeps occupying its key. When retiring a key that will be reused, implementations MUST surface stale references to the retiring key for operator resolution before reuse.

**V6 — Closed value status.** A value resolving to `deprecated` or `tombstone` follows RFC-005 E1 write semantics (resolves; new writes rejected). `retired` entries do not resolve under V1 — values referencing them are invalid as if absent.

**V10 — Open→closed promotion.** Version-bumping change with a mandatory pre-flight classifying in-use keys as:
- *will-be-invalid*: used-but-undefined, or resolving only to a `retired` entry (reads do NOT survive).
- *read-only-after-close*: resolves to `deprecated` or `tombstone` (reads survive; new writes rejected).
- *used-and-active*: fine.

A grace window is declared in `Vocabulary.promotionWindow.until`. Until that bound, violations are warnings; after it, V1 applies unconditionally. Absent `promotionWindow` means the promotion takes effect immediately. There is no unbounded window.


### Distribution Group (Core)

**Content**: The Distribution group is required for all conforming implementations.
#### Package

**Content**: The distributable artefact. Contains Field, Type, View, and Relation type definitions with a complete dependency manifest.

```typescript
{
  schemaVersion: string      // SRS spec version, e.g. "2.0"
  packageId: UUID
  packageName: string
  packageVersion: string     // semver, e.g. "1.2.0"
  publishedAt: ISO8601
  publisher?: string
  description?: string
  homepage?: string

  // Content (at least one of fields or types must be non-empty)
  fields: Field[]
  types: Type[]
  views?: View[]             // ext:views-l1; omit if not in use
  documentViews?: DocumentView[]  // ext:views-l2; omit if not in use
  blueprints?: Blueprint[]   // core; omit if not in use
  protocols?: Protocol[]     // ext:protocol; omit if not in use
  relationTypes?: RelationTypeDefinition[]  // relation type definitions
  vocabularies?: Vocabulary[]               // RFC-006: named vocabulary definitions
  lifecycles?: Lifecycle[]                  // RFC-006 ext:lifecycle: referenceable lifecycle definitions

  mode: "bundled" | "standalone"

  dependencyRefs: Reference[]
}
```

**`mode` semantics:**

| Mode | Meaning |
|---|---|
| `"bundled"` | All Field records referenced by any Type, all Type records referenced by any Type or View, and all View records referenced by any DocumentView are included in their respective arrays. Self-contained. |
| `"standalone"` | Dependencies are expected pre-installed in the consumer's registry. `dependencyRefs` is the required manifest. |

`dependencyRefs` is required in both modes. Consumers use it to validate completeness without parsing content internals.

---

#### Reference

**Content**: A stable pointer to a specific definition version.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1
  definitionType?: "field" | "type" | "view" | "blueprint" | "protocol"
}
```

Canonical string form: `namespace/name@version`

---

#### Lineage

**Content**: Upstream and fork tracking for a specific definition version.

```typescript
{
  sourceDefinitionId?: UUID     // UUID of the upstream definition
  sourceVersion?: integer       // upstream version at derivation time
  forkedFromDefinitionId?: UUID // UUID of the definition deliberately forked from
  forkedFromVersion?: integer   // version at the fork point
}
```

| Field pair | Meaning |
|---|---|
| `sourceDefinition*` | Tracked copy; consumer expects upstream updates |
| `forkedFrom*` | Deliberately diverged; no upstream tracking |

Both may be present during a transition from tracking to forking.

---

#### Provenance

**Content**: Publisher and package origin metadata.

```typescript
{
  publisher?: string        // namespace or org of the original author
  sourcePackage?: string    // package name that bundled this definition
  packageVersion?: string   // semver of the source package
  importedAt?: ISO8601
}
```

`packageVersion` is distinct from `Field.version`. A package at `1.3.0` may contain `decision_statement@3` and `context@2`.

---


### Conversation Layer

**Content**: > **Standalone repository note**: The conversation layer is optional infrastructure. An implementation declaring only `SRS 2.0 Core + ext:repository` does not require a TSS, ext:protocol, ext:addressability, AttentionState, or any live conversation store. Source documents stored in `source-documents/` are sufficient evidence storage for standalone use. This section describes the full-stack integration model; implementers building file-based or offline repositories may skip it entirely.

The conversation layer is a permanent architectural boundary distinct from SRS. It captures raw multimodal source material; SRS captures negotiated semantic state. They reference each other bidirectionally via `SourceReference` (document → conversation) and `AttentionState` tags (conversation → document, via `ext:addressability`).

```
Conversation layer  →  raw multimodal source material (speech, threads, annotations)
                        elements tagged with Address at production time
Protocol layer      →  structures the facilitation process; advances AttentionState
SRS layer          →  captures negotiated semantic state; Records carry SourceReferences
Presentation layer  →  renders SRS state via Views
```

Three conversation types are in scope:

| Type | Structure | Anchoring |
|---|---|---|
| Meeting transcript | Linear, time-ordered chunks | Tagged with AttentionState at production time |
| Threaded conversation | Tree of replies | Thread root anchored to a document element Address |
| Web UI annotations | Attached to content | Anchored to a Field or Record Address |

Transcript chunks referenced in `SourceReference` are source material — addressable evidence. They do not become Notes or Records automatically. A transcript chunk referenced in `sourceRefs` is evidence supporting a field value; it is not itself a Note unless someone deliberately models it as one.

---

### Extensions

**Content**: Extensions are optional, independently adoptable. Each extension section declares its identifier, dependencies, and the types it defines.

---
#### ext:addressability

**Content**: **Required for**: any implementation with live facilitation or multi-session extraction.

Defines a universal addressing scheme and the mechanisms that connect conversation material to document elements.

#### `Address`

A stable, resolvable identifier for any element across document space, process space, and conversation space.

```typescript
type Address =
  | {
      space: "document"
      containerId: UUID
      recordId?: UUID
      fieldId?: UUID
      revisionId?: UUID    // requires ext:addressability Revision
    }
  | {
      space: "process"
      runId: UUID          // Protocol run ID; requires ext:protocol
      stageId?: string
    }
  | {
      space: "conversation"
      sessionId: UUID
      chunkId?: UUID
      annotationId?: UUID
    }
```

Every element that can be referred to has an Address. A transcript chunk and a field Revision are co-addressable because assertions about one referencing the other require both to be resolvable.

#### `AttentionState`

The current focus of an active Protocol run — a live cursor across the address space. `AttentionState` and `Address` are structurally related but serve distinct roles: an `Address` is a stable, resolvable identifier for a specific element; `AttentionState` is the mutable cursor that records *where focus currently is* during an active session. An `AttentionState` value at a point in time resolves to a document-space `Address`, but it is stored separately because it changes continuously as the Protocol advances.

Conversation material is tagged with the active `AttentionState` as it is produced. This makes context assembly efficient: "all chunks produced while focus was on this Field" is a queryable address predicate.

```typescript
{
  containerId: UUID
  recordId?: UUID
  fieldId?: UUID
  protocolRunId?: UUID
  stageId?: string
}
```

`AttentionState` is set live by the session or Protocol runner. `SourceReference` is set retrospectively at extraction or editorial review time. Both are needed; they answer different questions.

#### `Revision`

A first-class, addressable snapshot of a `FieldValue` at a point in time. Carries the value, the agent, a timestamp, and source references to the conversation that produced the change.

```typescript
{
  revisionId: UUID
  fieldId: UUID
  recordId: UUID

  value: FieldValue
  agent: "human" | "ai" | "imported"
  createdAt: ISO8601

  sourceRefs?: SourceReference[]
  priorRevisionId?: UUID  // chain to the previous Revision for this field
}
```

Revision does not replace the edit-in-place vs. new-Record judgment. Minor corrections remain in-place edits at the implementation layer. Revision is the addressable audit trail for interoperability — it makes field history queryable: "what did this field say before the last Protocol run?", "which conversation produced the change from revision 2 to revision 3?"

#### Context Query (behavioural requirement)

A conforming `ext:addressability` implementation must be able to assemble relevant material given an address and a purpose. This is a behavioural requirement, not a data shape.

**Required query patterns:**

| Pattern | Address | Returns |
|---|---|---|
| Field context | `{recordId}/{fieldId}` | Current value, Revision history, chunks tagged to this Field, Field `aiGuidance` |
| Record context | `{recordId}` | All field values, chunks tagged to this Record, Relations, Protocol run history |
| Stage context | `{runId}/{stageId}` | All chunks produced during this stage, Fields active in this stage |
| Revision trace | `{fieldId}/{revisionId}` | Value at that Revision, the conversation that produced it, prior Revision chain |

**Recommended assembly order for AI assistance:**

1. Type and Field `aiGuidance` — what this field captures, how to extract it
2. Current value and recent Revision history — what has already been established
3. Chunks tagged to this Field via AttentionState — most focused context
4. Chunks tagged to the parent Record — broader session context
5. Related Records via Relations — structural context

---

#### ext:lifecycle

**Content**: **Required for**: governance tools, decision logs, any implementation where records progress through defined states.

`ext:lifecycle` is fully integrated with the vocabulary substrate (RFC-006). `Lifecycle` is an installable, referenceable container — a `VocabularyEntry` specialisation whose container holds states and transitions. `LifecycleState` satisfies the `VocabularyEntry` substrate contract with `key` (was `name`) as its key-role field.

#### `LifecycleState` (VocabularyEntry specialisation)

```typescript
{
  id: UUID                  // stable identity
  version: integer
  namespace: string
  key: string               // was name; the string stored in Record.lifecycleState
  label?: string
  description?: string
  aliases?: string[]
  isInitial?: boolean       // valid starting state for new Records
  isFinal?: boolean         // no outgoing transitions permitted (V9)
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active
  properties?: Record<string, unknown>
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

#### `LifecycleTransition` (edge between state keys)

```typescript
{
  id: UUID                  // stable identity for lossless future migration
  name: string              // e.g. "promote", "approve", "supersede"
  from: string              // a LifecycleState.key in the effective state set
  to: string                // a LifecycleState.key in the effective state set
  description?: string
  properties?: Record<string, unknown>
}
```

`LifecycleTransition` is an edge, not a `VocabularyEntry` (no `key`), but carries `id` so it is addressable. It follows the same forward-compatibility policy as substrate entries: unknown top-level fields rejected; arbitrary metadata in `properties`.

#### `Lifecycle` container

An installable, referenceable state machine — a closed vocabulary of states plus transitions.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer          // min: 1

  states: LifecycleState[]
  transitions: LifecycleTransition[]
  initialState: string      // the key of the single isInitial state

  extendsLifecycleId?: UUID
  extendsLifecycleVersion?: integer   // required when extendsLifecycleId is present

  description?: string
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

The distributable `Package` holds inline definitions: `lifecycles?: Lifecycle[]`. The repository `package/package.json` holds relative paths: `"lifecycles": ["lifecycles/foo.json", ...]`.

#### Type lifecycle declaration (added by this extension)

`Type` gains a lifecycle, declared in exactly one of two mutually exclusive forms (V7):

```typescript
// Inline (simple cases; cannot extend):
lifecycle?: {
  states: LifecycleState[]
  transitions: LifecycleTransition[]
  initialState: string
}

// Referenced (shared, installable):
lifecycleRef?: Reference   // resolves to an installed Lifecycle (V8)
```

Declaring both is a validation error (V7). An inline lifecycle's effective state set is exactly its own `states`/`transitions`; V5 and V9 apply identically.

#### Record lifecycle state

`Record.lifecycleState` must resolve to a state `key` in the Type's effective state set under V1.

#### Validation invariants (V7–V9)

**V7 — Lifecycle exclusivity.** A Type declares exactly one of `lifecycle` or `lifecycleRef`.

**V8 — Lifecycle reference resolution.** A `lifecycleRef` must resolve to an installed `Lifecycle` in the effective package set.

**V9 — Lifecycle integrity.** Over the effective state set (V5):
- Exactly one state MUST have `isInitial: true`; `initialState` MUST reference that state's `key`.
- The initial state MUST have effective `status: active`. A lifecycle whose initial state is deprecated, tombstone, or retired is invalid.
- Every `transition.from`/`transition.to` must reference a state `key` in the effective state set.
- A state with `isFinal: true` MUST NOT appear as the `from` of any transition.
- Transition `id`s must be unique within the effective transition set.
- `Record.lifecycleState` resolves under V1.

---

#### ext:protocol

**Content**: **Required for**: facilitation tools, structured deliberation, any implementation that guides users through epistemic stages.

Replaces `TemplateFacilitationStep` from v1. Protocol is epistemically richer: stages have explicit dependencies, completion criteria, and may produce intermediate Records.

#### `TypeRef`

A reference to a specific Type, used within Protocol and Blueprint.

```typescript
{
  typeId: UUID
  typeVersion?: integer
}
```

#### `FieldRef`

A reference to a Field within a Type.

```typescript
{
  fieldId: UUID
  typeId?: UUID    // which Type this Field appears in
}
```

#### `ProtocolStage`

A named stage in a Protocol. Stages have epistemic dependencies (`dependsOn`) — not just ordering. A stage may only proceed when its dependencies are sufficient.

```typescript
{
  stageId: string       // stable key within this Protocol
  order: integer        // min: 0; display/presentation order only — see note below
  purpose: string       // what understanding this stage builds
  question: string      // the core question this stage answers
  dependsOn: string[]   // stageId values; epistemic dependencies, not just ordering
  completionCriteria: string   // how to know this stage is sufficient to proceed
  contributesTo: FieldRef[]    // which Record Fields this stage feeds
  outputType?: TypeRef         // if this stage produces its own intermediate Record
  aiGuidance: AiGuidance
}
```

**`order` vs `dependsOn`:** `order` is the display and presentation sequence — how stages are shown in a UI or facilitation guide. Execution sequence is determined by `dependsOn` resolution: a stage runs when all its declared dependencies are satisfied, regardless of its `order` value. Authors must ensure `order` is consistent with the partial order implied by `dependsOn` (i.e. a stage's `order` value should be greater than the `order` of any stage it depends on). See Invariant 31.

#### `Protocol`

An epistemically ordered process for building quality Records through structured conversation or facilitation.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string

  targetType?: TypeRef
  // The Record type this Protocol produces. Absent for loose / exploratory Protocols
  // (Brain Dump, Decomposition) whose output is input context for a tighter Protocol.

  stages: ProtocolStage[]

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

**The Protocol spectrum:**

```
Loose                                                    Tight
─────────────────────────────────────────────────────────────
Brain Dump → Decomposition → Options Analysis → Decision
```

Loose Protocols produce open material. Tight Protocols converge on a specific Record type. The output of a loose Protocol is the input context for something tighter.

**Generic Protocols** (reusable across domains):
- Brain Dump — externalise all thinking without constraint
- Decomposition — identify major components from raw material
- Review — what is established, what is still open
- Prioritisation — which components to resolve first

**Domain-specific Protocols** (target a specific Record type):
- Decision — context → criteria → options → evaluation → decision
- Proposal — problem → solution shape → constraints → proposal

**Protocol chaining and provenance**: The output of one Protocol is the input context for the next. This derivation chain is traceable through `derived-from` Relations, making the quality and history of the final Record auditable.

**Non-normative example — Protocol chain for a governance decision:**

```
Brain Dump Protocol (loose, no targetType)
  → AttentionState: { containerId: C1 }
  → Produces: Note N1 (unstructured brainstorm)

Decomposition Protocol (loose, targetType: Component)
  → AttentionState: { containerId: C1, recordId: N1 }
  → Produces: Notes N2, N3, N4  [derived-from N1]

Decision Protocol (tight, targetType: Decision)
  → AttentionState: { containerId: C1, protocolRunId: R1, stageId: "criteria" }
  → Stage "criteria" produces: Options Analysis Record R-OA  [derived-from N2, N3]
  → Stage "decision" produces: Decision Record R-D           [derived-from R-OA]

Conversation chunks produced during Decision stage:
  chunk-42: { AttentionState: { containerId: C1, recordId: R-OA, fieldId: F-criteria, ... } }
  chunk-43: { AttentionState: { containerId: C1, recordId: R-D, fieldId: F-outcome, ... } }

Context query for R-D / F-outcome:
  → Field aiGuidance from Decision Type + outcome Field
  → Current value + Revision history for F-outcome
  → Chunks tagged with { recordId: R-D, fieldId: F-outcome } — chunk-43
  → Chunks tagged with { recordId: R-D } — broader session context
  → Related Records via Relations — R-OA via derived-from
```

The final Decision Record is auditable because every Protocol stage left addressable artefacts. The quality of the outcome is traceable to the conversation that produced it.

Views (`ext:views-l1`) no longer contain facilitation logic. A View is a presentation concern; a Protocol is an epistemic one.

---

#### ext:blueprint

**Content**: **Required for**: extraction pipelines, founding document workflows, any system that needs to specify what a document type IS before assembling it.

#### `RelationSpec`

Declares an expected Relation between two Record types within a Blueprint.

```typescript
{
  relationType: string
  sourceType: TypeRef
  targetType: TypeRef
  cardinality?: "one-to-one" | "one-to-many" | "many-to-many"
  required?: boolean
}
```

#### `Blueprint`

The definition of a complete document type — which Types it contains, what Relations exist between resulting Records, and what "complete" means. A Blueprint is the artefact handed to an extraction pipeline.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string

  rootTypes: TypeRef[]        // Types to extract
  structure: RelationSpec[]   // expected Relations between extracted Records
  requiredTypes: TypeRef[]    // what "complete" means for this document type

  aiGuidance?: AiGuidance
  // purpose: what kind of document type this Blueprint defines
  // extraction: framing for extraction pipelines

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

**Blueprint vs View:**

| | Blueprint | View / Document View |
|---|---|---|
| Question it answers | What IS this document type? What should be extracted? | How are existing Records assembled into readable output? |
| Operates at | Definition time | Projection time |
| Input | Source material (transcripts, conversations) | Existing Records in a Container |
| Output | Extraction instructions → Records | Rendered document |

---

#### ext:type-inheritance

**Content**: **Required for**: Type libraries that need formal specialization while preserving base-Type processability.

Defines single inheritance for Types. A specializing Type inherits the fields and semantics of a base Type, may add fields, and remains processable as the base Type by systems that know the base Type but not the specialization.

When `ext:type-inheritance` is in use, `Type` gains:

```typescript
{
  extendsTypeId?: UUID
  // UUID of the base Type this Type specializes.
  // When present, the effective field list consists of inherited fields
  // followed by this Type's own fields[], unless fieldOrder is present.

  extendsTypeVersion?: integer
  // Version of the base Type targeted by this specialization.

  fieldOrder?: UUID[]
  // Optional explicit ordering of all fields in the effective field list:
  // inherited fields plus this Type's own fields[].
  // This is an ordering declaration only; it does not re-declare field
  // assignments or change Field semantics.

  fieldAssignmentOverrides?: FieldAssignmentOverride[]
  // Presentation and workflow overrides for inherited fields only.

  identityFieldId?: UUID
  // RFC-020 — names one fieldId from this Type's effective field set
  // (own fields plus inherited fields) as the record's identity/display
  // field. Cascades across the ancestor chain independently of
  // fieldOrder (see `identityFieldId` below).
}
```

#### `identityFieldId`

Names one field, from the Type's effective field set, as the record's identity/display field — the field a conformant implementation SHOULD use to resolve a Record's display label (e.g. in list, tree, discovery, and container views), in preference to any implementation-specific heuristic (Rule [N+36]).

`identityFieldId` MUST reference a `fieldId` present in the Type's effective field set (Rule [N+33]).

**Inheritance is cascading, unlike `fieldOrder`.** The *effective* `identityFieldId` of a Type is its own `identityFieldId`, if declared; otherwise, the effective `identityFieldId` of its base Type, resolved transitively up the ancestor chain; otherwise absent (Rule [N+32], [N+34]). A Type overrides an inherited effective `identityFieldId` by declaring its own, which need not match the base Type's and MAY point at a field the Type itself adds. This differs from `fieldOrder`, which is read only from the Type being resolved and does not search the ancestor chain when absent — `identityFieldId`'s inheritance rule is specific to this property, not a reuse of `fieldOrder`'s behavior.

`identityFieldId` scopes to Tier 2 Records only; it has no defined meaning for Tier 0 (Note) or Tier 1 (TypedRecord) instances, which carry no Type binding (Rule [N+35]).

**Interaction with `DocumentSection.titleFieldId` (`ext:views-l2`).** For any `DocumentSection` that does not declare `titleFieldId` — whether that section's field content renders via the Default Rendering Baseline or a dispatched L1 View — implementations SHOULD render the per-record heading using the value of the field named by the record's Type's effective `identityFieldId`, if present, in place of omitting the heading. `titleFieldId`, when declared, MUST continue to take precedence for that section's per-record heading (Rule [N+37]; see `ext:views-l2` § Heading Hierarchy).

#### `FieldAssignmentOverride`

Overrides presentation or workflow constraints for an inherited Field in a specializing Type. It does not change the Field's semantics.

```typescript
{
  fieldId: UUID
  displayLabel?: string
  displayHint?: string
  required?: boolean
}
```

`displayLabel` and `displayHint` are presentation-only. `required` may tighten an inherited optional field (`false` to `true`) for the specializing Type. It must not relax an inherited required field (`true` to `false`), because a Record instantiated against the specializing Type must remain valid when processed as the base Type.

The effective field list for a specializing Type is the inherited effective field list of its base Type plus the specializing Type's own `fields[]`. A specializing Type must not duplicate an inherited `fieldId` in its own `fields[]`.

Example:

```text
Type: core/decision
  fields: decision_statement, context, rationale, options_considered

Type: org.example/governance_decision
  extendsTypeId: core/decision
  adds: ratification_method, quorum_threshold, voting_record
```

A system that knows `core/decision` but not `org.example/governance_decision` can still read the inherited decision fields. The specializing fields are unknown extension content to that system and should be preserved rather than discarded.

---

#### ext:views-l1

**Content**: **Required for**: rendering and export workflows.

Defines Views — versioned presentations over a field set.

#### `FieldView`

A field reference within a View. Controls presentation for this View without altering field semantics.

```typescript
{
  fieldId: UUID       // must reference a valid Field.id in the effective package set
  order: integer      // min: 0; display order within this View
  required?: boolean  // View-level workflow constraint; does not alter Field contract
  visible?: boolean   // default: true

  // Presentation overrides — View scope only
  displayLabel?: string
  displayHint?: string
  editorHintOverride?: string
}
```

A Field hidden with `visible: false` remains in the Record and may appear in other Views.

#### `ExportConfig`

Configuration for rendering a Record through this View as an exportable document.

```typescript
{
  format?: string        // target format hint, e.g. "markdown", "adoc", "json"
  preamble?: string
  // Template string rendered before field values.
  // Variable substitution uses {{variable-name}} syntax.
  // Standard variables: {{instance-id}}, {{date}}, {{status}}, {{namespace}}, {{name}}

  fieldOrder?: UUID[]    // explicit export field ordering; defaults to fieldViews[].order
  omitEmptyFields?: boolean  // default: false
}
```

#### `View`

A versioned presentation and export configuration over a field set. A View is compatible with any Record containing its required fields.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string    // when to use this View; what workflow or audience it serves

  aiGuidance?: AiGuidance
  // purpose: the workflow context this View serves
  // extraction: session-level framing injected before field extraction

  fieldViews: FieldView[]

  compatibleTypes?: string[]
  // Optional semanticObjectType hints this View was designed for.
  // Informative only. Compatibility is determined by field presence.

  protection?: "none" | "read-only" | "fill-in"
  // Default: "none".
  // "read-only" — Records rendered through this View cannot be edited.
  // "fill-in"   — only null or empty Field values may be populated.
  // Protection is a View-level workflow constraint. It does not modify
  // the Record or replace lifecycle states.

  exportConfig?: ExportConfig

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

Compatibility is field-centric:
- A Record is renderable through a View when it contains all `FieldView` entries with `required: true`.
- Fields with `visible: true` but not required are rendered when present and omitted when absent.
- Omitted Fields in `fieldViews[]` are treated as `visible: false`.

A View may not reference unknown Fields: every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set.

`View.protection` applies only to interactions through that View. A Record may be editable through one View and read-only through another. For record-level settlement, use `ext:lifecycle` states such as `isFinal`.

Facilitation steps have been removed from View. Use `ext:protocol` Protocol stages instead.

---

#### ext:views-l2

**Content**: **Depends on**: `ext:views-l1`

**Required for**: document projection — assembling multiple Records into a coherent document.

#### `SectionSource`

Defines how a section's instances are selected from a Container.

```typescript
type SectionSource =
  | {
      type: "fixed-instances"
      instanceIds: UUID[]
      // Explicit list. For preamble, cover page, or curated sections.
    }
  | {
      type: "type-query"
      semanticObjectType: string
      // For cross-system portability, use namespace/name format (e.g. "core/decision").
      // A bare string like "decision" is a single-system convention.
      lifecycleState?: string
      // Single-state filter (back-compat). Prefer lifecycleStates for new DocumentViews.
      lifecycleStates?: string[]
      // RFC-011. When present and non-empty, restricts to Records whose lifecycleState
      // matches any listed value (OR semantics). Requires ext:lifecycle. Invariant I-011-1.
      excludeLifecycleStates?: string[]
      // RFC-011. When present and non-empty, excludes Records whose lifecycleState matches
      // any listed value. Applied after lifecycleStates. Requires ext:lifecycle. Invariant I-011-2.
      containerIds?: UUID[]
      containerScope?: "explicit" | "repository" | "subtree"
      // RFC-011. Controls which containers are queried. Default: "explicit" (scope to
      // containerIds[]). "repository": all containers; containerIds[] ignored.
      // "subtree": context container and its contains-reachable descendants.
      // Absent is equivalent to "explicit". Invariant I-011-3.
    }
  | {
      type: "relation-query"
      fromInstanceId: UUID
      relationType: string
      direction?: "forward" | "inverse"  // default: "forward"
    }
  | {
      type: "container-subset"
      containerId: UUID
      containerType?: string
      typeFilter?: string[]   // RFC-008. namespace/name keys, version-independent.
      // When present and non-empty, restricts members to the listed Types. Ordering is
      // the container-wide precedes order (below) projected onto the survivors. Absent or
      // empty = all members. Exclusive to container-subset.
      // Default ordering: when DocumentSection.ordering is absent, members are ordered
      // by the precedes relation chain among them; createdAt ascending is the tiebreak
      // for members not connected by any precedes relation.
    }
```

#### `DocumentSection`

One section in a Document View.

```typescript
{
  sectionId: string
  title?: string
  description?: string
  order: integer   // min: 0

  source: SectionSource

  renderViewId?: UUID    // View (ext:views-l1) used to render each instance in this section
  // When absent, implementations MUST use the default rendering baseline (see below).
  // When typeDispatch matches the record's resolved type, it takes precedence over renderViewId.

  typeDispatch?: { [typeKey: string]: UUID }   // RFC-008
  // Maps a record's resolved type (namespace/name, version-independent) to the
  // ext:views-l1 View used to render records of that Type within this section. Consulted
  // before renderViewId; unmatched Types fall back to renderViewId then the default
  // baseline. Lets one heterogeneous section render each Type with its own L1 View.
  // typeDispatch never changes member order (order follows the source).

  titleFieldId?: UUID
  // The fieldId whose value provides the per-record heading within this section.
  // Constraints:
  //   - The referenced field must have valueType "string" or "text".
  //   - The referenced field must not be repeatable (FieldAssignment.repeatable !== true).
  //   - When a record's type does not carry this field, the per-record heading is
  //     omitted silently — this is not a render failure. This enables heterogeneous
  //     sections (e.g. container-subset) where some record types carry the heading
  //     field and others do not.
  // When absent, no per-record heading is emitted.
  // Enforced at render time; implementations SHOULD also enforce at package validation time
  // when the section source is statically determinable.

  ordering?: {
    fieldId?: UUID
    direction?: "asc" | "desc"  // default: "asc"
  }

  required?: boolean
  emptyBehavior?: "hide" | "show-placeholder"
}
```

#### `NavigationLink`

An assembly-time cross-section link in a Document View. Navigation links are reading aids for the rendered document, not semantic assertions about Records. They do not appear in the Relation graph.

```typescript
{
  fromSectionId: string
  toSectionId: string
  label?: string
  bidirectional?: boolean  // default: false
}
```

#### `ThemeReference`

A pointer to a Theme (ext:themes-l1). Follows the same `mode`-based reference pattern as `packageRef` in the manifest.

```typescript
{
  mode: "local" | "remote" | "bundled"
  path?: string     // required when mode === "local"
  url?: string      // required when mode === "remote"
  themeId?: UUID    // references Theme.id in Package.themes[]; required when mode === "bundled"
}
```

#### `ThemeVariant`

A named alternative theme selectable at render time instead of `DocumentView.themeRef`.

```typescript
{
  name: string           // case-sensitive; MUST be unique within DocumentView.themeVariants
  description?: string
  themeRef: ThemeReference
}
```

Variant name uniqueness is enforced at package validation time.

#### `DocumentView`

A versioned, Container-level projection. Defines how a Container's Records are assembled into a readable document.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string    // what kind of document this produces; intended audience

  containerType?: string  // when set, intended for Containers of this type

  sections: DocumentSection[]

  navigationLinks?: NavigationLink[]

  preamble?: string
  // Template string rendered before all sections.
  // Standard variables: {{container-title}}, {{date}}, {{container-id}},
  //   {{heading-1}}, {{heading-2}}
  // When absent and format is "markdown", "html", or "adoc", implementations MUST
  // render a document title heading at level 1 + depthOffset containing container-title.

  format?: string
  // Portable values: "markdown", "adoc", "html", "text", "json".
  // Implementations MAY support additional values; non-portable values MUST NOT
  // cause a validation error. When absent, output format is implementation-defined.
  // DocumentView.format governs all section rendering; ExportConfig.format on a
  // referenced L1 View is ignored for section rendering.
  //
  // When format is "json", implementations MUST produce a structured JSON
  // projection conforming to the document-view-output.json schema instead of
  // rendered markup. In json mode: theme application, heading injection, and
  // depthOffset do not apply; {{heading-N}} variables in preamble templates
  // MUST be substituted as empty strings; containerId is resolved from the
  // first container-subset SectionSource, or null when none is present.

  depthOffset?: integer   // min: 0; default: 0
  // Shifts all auto-rendered heading levels by this amount.
  // At depthOffset 0: document title H1, sections H2, records H3.
  // At depthOffset 1: H2, H3, H4 respectively.
  // Implementations SHOULD emit a warning diagnostic when depthOffset > 4.

  themeRef?: ThemeReference
  // Default Theme (ext:themes-l1). Applied when no variant is selected at render time.
  // When ext:themes-l1 is not declared, implementations MUST ignore this field
  // and MUST NOT error on its presence.

  themeVariants?: ThemeVariant[]
  // Named alternative themes selectable at render invocation.
  // When ext:themes-l1 is not declared, implementations MUST ignore this field.

  aiGuidance?: AiGuidance
  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

A `DocumentView` may reference one or more `View` records (via `DocumentSection.renderViewId`). A single field-centric View may render mixed Record Types when the Records contain the required fields. The DocumentView orchestrates; it does not replace L1 Views.

`DocumentSection.renderViewId` references a `View.id` (from `ext:views-l1`). A `DocumentView.id` is not a valid value for `renderViewId` — Document Views are not nestable.

Use `navigationLinks` when a rendered document should include "see also" or related-section links. Use `Relation` only when the relationship is a semantic assertion about Records.

---

#### Heterogeneous Section Rendering

A `container-subset` section can mix Record Types — it draws all Container members, ordered by the `precedes` chain (Rule [N+12]). Two optional fields make such sections precise:

- **`typeFilter`** (on the `container-subset` source) restricts the section to a subset of member Types by `namespace/name`, preserving the container-wide `precedes` order projected onto the survivors — filter-then-project (Rule [N+21]).
- **`typeDispatch`** (on `DocumentSection`) selects a different L1 View per Record Type within the one section, so interleaved Types each render with their own View (Rules [N+14]–[N+18]).

A record's **resolved type** for both fields is the canonical `namespace/name` of the Type its `typeId` resolves to — not the denormalized `typeNamespace`/`typeName` hints — compared version-independently (Rule [N+13]). These compose with the per-record heading behaviour of `titleFieldId` (Rule [N+1]) for heterogeneous sections, and leave intra-record group rendering inside a dispatched L1 View unaffected.

---

#### Default Rendering Baseline

When `DocumentSection.renderViewId` is absent, implementations MUST render each instance using the following baseline. No L1 View influences this path.

**Step 1 — Field ordering.** Order fields ascending by `FieldAssignment.order`. With `ext:type-inheritance`, use `fieldOrder` from the Type if declared; otherwise use `FieldAssignment.order`.

**Step 2 — Resolve values.** A field is present if `FieldValue.value` is non-null and non-empty-string, or (with `ext:repeatable-fields`) `FieldAssignment.repeatable === true` and `FieldValue.entries` is a non-empty array. Fields with neither are absent.

**Step 3 — Labels.** Use `FieldAssignment.displayLabel`; fall back to `Field.name`.

**Step 4 — Render.** Render only present fields. Absent fields are omitted unless `DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true`, in which case implementations MAY render a placeholder. For repeatable fields, render each entry in `FieldValue.entries` in sequence; presentation (list vs inline) is implementation-defined.

The baseline is a floor, not a ceiling. An L1 View via `renderViewId` always takes precedence.

`emptyBehavior` in the L1 View path: when `renderViewId` is set, empty field handling is governed by `ExportConfig.omitEmptyFields` on the referenced L1 View. `DocumentSection.emptyBehavior` does not apply in the L1 View rendering path.

---

#### L1/L2 ExportConfig Boundary

When `DocumentSection.renderViewId` is set, the referenced L1 View's `ExportConfig` properties apply as follows:

| Property | In section rendering context |
|---|---|
| `format` | **Superseded.** `DocumentView.format` governs. |
| `preamble` | **Applies.** Rendered before each record's field values. |
| `fieldOrder` | **Applies.** Overrides `FieldAssignment.order` for field rendering. |
| `omitEmptyFields` | **Applies.** Controls absent field rendering. |

When `ExportConfig.preamble` renders inside a section, the variable `{{heading-3}}` is available, resolving to heading prefix at level `3 + depthOffset`. In standalone export context, `{{heading-3}}` MUST resolve to the empty string — implementations MUST NOT emit the literal token.

---

#### Heading Hierarchy

For `format: "markdown"`, `"html"`, or `"adoc"`:

| Element | Heading level | Condition |
|---|---|---|
| Document title | `1 + depthOffset` | When `preamble` is absent |
| Section title | `2 + depthOffset` | When `DocumentSection.title` is set |
| Per-record heading | `3 + depthOffset` | When `titleFieldId` is set on the section, or (RFC-020, Rule [N+37]) as a fallback when it is not — see below |
| Field label | Bold/formatted text — not a heading | Always |

For `format: "text"` or implementation-defined values, heading level semantics do not apply.

**`identityFieldId` fallback (RFC-020, Rule [N+37]).** For any `DocumentSection` that does not declare `titleFieldId` — whether that section's field content renders via the Default Rendering Baseline or a dispatched L1 View — implementations SHOULD emit the per-record heading using the value of the field named by the record's Type's effective `identityFieldId` (`ext:type-inheritance`), if present, in place of omitting the heading. `titleFieldId`, when declared, MUST continue to take precedence for that section's per-record heading.

#### Preamble Template Variables

Standard variables in `DocumentView.preamble`:

| Variable | Resolves to |
|---|---|
| `{{container-title}}` | Container title from manifest |
| `{{container-id}}` | Container UUID |
| `{{date}}` | Render date |
| `{{heading-1}}` | Heading prefix at level `1 + depthOffset` (empty string in json mode) |
| `{{heading-2}}` | Heading prefix at level `2 + depthOffset` (empty string in json mode) |

In json mode all `{{heading-N}}` variables MUST resolve to `""`. Implementations MUST NOT emit the literal token.

---

#### Theme Variant Selection (ext:themes-l1)

When `ext:themes-l1` is declared and a variant name is supplied at render invocation:

1. Find `ThemeVariant` in `themeVariants` matching the requested name (case-sensitive).
2. If found: resolve its `ThemeReference` and apply Rule [T-2] (targets check). If format matches, use that Theme. If format does not match, render **without a theme** — do NOT fall back to `themeRef`.
3. If not found: fall back to `themeRef` (applying Rule [T-2]). If absent or format-incompatible, render without a theme.
4. If no variant name is supplied: use `themeRef` (applying Rule [T-2]).

#### ext:repeatable-fields

**Content**: **Required for**: any Record type that needs lists of values within a single Field.

Adds repeatability to `FieldAssignment` and defines `FieldValueEntry`.

#### `FieldValueEntry`

A single entry in a repeatable field.

```typescript
{
  value: string | number | boolean | string[] | null
  source?: "human" | "ai" | "imported" | "derived"
  editedAt?: ISO8601
}
```

#### FieldAssignment additions

When `ext:repeatable-fields` is in use, `FieldAssignment` gains:

```typescript
repeatable?: boolean  // default: false; when true, multiple values are allowed
minItems?: integer    // meaningful only when repeatable === true
maxItems?: integer    // meaningful only when repeatable === true
```

And `FieldValue.entries` becomes active: use `entries` when `repeatable === true`, `value` otherwise.

A repeatable field entry does not create a new semantic instance. Use separate Records connected by Relations when repeated items need their own identity, lifecycle, or graph position.

---

#### ext:field-groups

**Content**: **Required for**: Record types where multiple Fields are semantically paired and repeat together as a unit.

Use when parallel `multiselect` arrays would lose pairing (e.g. a contact record with `name` + `email`). Preserves internal pairing across repeated items.

#### `FieldGroup`

A named, ordered group of Fields that repeat together as a unit within a Type.

```typescript
{
  groupId: string        // stable key within the Type
  label?: string
  description?: string

  order: integer         // min: 0; position relative to other Fields and Groups

  required?: boolean     // default: false
  repeatable?: boolean   // default: false
  minItems?: integer
  maxItems?: integer

  fields: FieldAssignment[]
}
```

#### `FieldGroupEntry`

One entry in a repeatable Field Group.

```typescript
{
  entryId?: UUID         // stable key for this entry; allows referencing or updating
  fieldValues: FieldValue[]
}
```

#### `FieldGroupValue`

The current value of a Field Group within a Record.

```typescript
{
  groupId: string           // references FieldGroup.groupId in the Type definition
  entries: FieldGroupEntry[]
}
```

A `FieldGroup` does not create a new semantic instance. Its entries are embedded structured context within the enclosing Record. Use separate Records connected by Relations when group entries need their own identity, lifecycle, provenance, or reuse across Records.

`FieldGroup.repeatable`, `minItems`, and `maxItems` define group-level repeatability — whether the group as a whole can appear multiple times within a Record. This is structurally independent from `ext:repeatable-fields`, which adds scalar repeatability to individual Fields. An implementation may adopt `ext:field-groups` without `ext:repeatable-fields`; the repeatability mechanics in each extension are self-contained.

When `ext:field-groups` is in use, `Type` gains `fieldGroups?: FieldGroup[]` and `Record` gains `groupValues?: FieldGroupValue[]`.

**Repeatability pattern guide:**

| Pattern | Use | Example |
|---|---|---|
| Repeatable scalar | `FieldAssignment.repeatable` (ext:repeatable-fields) | Multiple assigned person names |
| Repeatable structured context | `FieldGroup` | Contacts with name + email pairs |
| Repeated semantic objects | Separate Records + Relations | Tasks assigned to roles |

---

#### ext:cross-field-validation

**Content**: **Required for**: Types with constraints that span multiple Fields.

`ValidationRule` handles single-field constraints. `CrossFieldRule` handles constraints that require evaluating more than one Field together.

#### `CrossFieldRule`

```typescript
{
  type: "conditional-required" | "field-ordering" | "mutual-exclusion"
  message?: string

  // conditional-required: targetFieldId becomes required when predicateFieldId equals predicateValue
  predicateFieldId?: UUID
  predicateValue?: string
  targetFieldId?: UUID

  // field-ordering: targetFieldId must precede or follow predicateFieldId
  // Applies only to fields with valueType "date" or "number".
  effect?: "must-precede" | "must-follow"

  // mutual-exclusion: at most one of the listed fields may have a non-empty value
  fieldIds?: UUID[]   // min: 2
}
```

| Rule type | Required fields |
|---|---|
| `conditional-required` | `predicateFieldId`, `predicateValue`, `targetFieldId` |
| `field-ordering` | `predicateFieldId`, `targetFieldId`, `effect` |
| `mutual-exclusion` | `fieldIds` (min 2) |

When `ext:cross-field-validation` is in use, `Type` gains `validationRules?: CrossFieldRule[]`.

---

#### ext:recommended-relations

**Content**: **Retired as of RFC-005.** The canonical SRS relation vocabulary (`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`) is now provided as installed `RelationTypeDefinition` records in the `com.semanticops.srs` package. See §5 (Package).

Implementations that previously declared `ext:recommended-relations` may remove it. The canonical definitions are unconditionally available to any repository using the SRS package.

The statement that "`RelationTypeDefinition` is optional metadata" is superseded. As of RFC-005, every `Relation.relationType` string must resolve to an installed `RelationTypeDefinition` in the effective package set before a Relation is accepted. A missing or conflicting definition is a validation error. See §9-1 (Core conformance requirements).

#### `RelationTypeDefinition` as a VocabularyEntry specialisation (RFC-006)

`RelationTypeDefinition` satisfies the `VocabularyEntry` substrate contract. As of RFC-006, its key-role field is renamed from `relationType` to `key`. Instance-side reference fields (`Relation.relationType`) are unchanged.

It gains `properties?: Record<string, unknown>` under the one forward-compatibility policy: unknown top-level fields are rejected; arbitrary entry metadata goes in `properties`.

It **requires** both `label` and `description` (unchanged from RFC-005). The substrate making these optional in the general contract does not relax this obligation.

The V1 mandatory resolution requirement (every `Relation.relationType` must resolve to an installed `RelationTypeDefinition`) is a named instance of the general closed-vocabulary resolution rule. See §9 (Conformance) and the Foundation Vocabulary and Term subsection.

#### ext:import-tracking

**Content**: **Required for**: implementations that receive packages from upstream publishers and need to track update and conflict state.

#### `ImportMode`

```typescript
"upstream-tracked" | "local-copy" | "local-fork"
```

| Mode | Meaning |
|---|---|
| `"upstream-tracked"` | Consumer expects updates from the source Package. Conflicts surfaced when local and upstream diverge. |
| `"local-copy"` | Imported as a snapshot. No update tracking. |
| `"local-fork"` | Deliberately diverged. Upstream lineage preserved for reference. |

#### `ImportRecord`

One record per imported definition in a consumer's local registry.

```typescript
{
  definitionId: UUID
  definitionType: "field" | "type" | "view" | "blueprint" | "protocol"
  namespace: string
  name: string
  version: integer

  mode: ImportMode
  importedAt: ISO8601

  sourcePackageId: UUID
  sourcePackageName: string
  sourcePackageVersion: string

  latestKnownUpstreamVersion?: integer
  updateAvailable?: boolean
  updateCheckedAt?: ISO8601

  conflictState?: "clean" | "local-ahead" | "upstream-ahead" | "diverged"
  conflictDetectedAt?: ISO8601

  localVersion?: integer
  localEditedAt?: ISO8601
}
```

#### `ImportSummary`

A consumer's complete picture of its imported definitions.

```typescript
{
  generatedAt: ISO8601
  fields: ImportRecord[]
  types: ImportRecord[]
  views: ImportRecord[]
  blueprints: ImportRecord[]
  protocols: ImportRecord[]
}
```

---

#### ext:registry

**Content**: **Required for**: multi-publisher ecosystems; discoverable definition catalogs.

#### `RegistryEntry`

One entry in a Registry catalog.

```typescript
{
  packageId: UUID
  packageName: string
  packageVersion: string
  publisher: string
  description?: string
  publishedAt: ISO8601
  homepage?: string
  tags?: string[]
  fieldCount: integer       // min: 0
  typeCount: integer        // min: 0
  viewCount?: integer
  schemaCount?: integer
  protocolCount?: integer
  relationTypeCount?: integer
  downloadUrl?: string
  checksum?: string         // SHA-256 hex digest for integrity verification
}
```

#### `Registry`

A registry's published index.

```typescript
{
  schemaVersion: string
  registryId: UUID
  registryName: string
  catalogVersion: string    // registry's own version (semver)
  updatedAt: ISO8601
  homepage?: string
  entries: RegistryEntry[]
}
```

Multiple Registries may coexist. A consumer may index multiple catalogs. The specification does not define registry authority, authentication, or federation.

---

#### ext:federation

**Content**: **Required for**: implementations that maintain multiple SRS repositories within a single system, link instances across repository boundaries, or need to record merge, split, and import operations.

`ext:registry` covers catalogs of Field and Type definition packages. `ext:federation` covers catalogs of SRS document repositories — the repositories that hold Notes, Records, and Relations — and the cross-repository links between their instances.

#### Design principles

- **Local-first**: every construct defined here works offline with no network connectivity and no central infrastructure. Federation is an optional layer, not a prerequisite.
- **Unresolved references are not errors**: a cross-repository instance reference whose target repository cannot be located is a citation — preserved, surfaced, but not invalid.
- **Join at whatever level makes sense**: a standalone repository, a team-level registry, an org-level registry, and a community-level registry are all structurally identical. A repository joins federation by pointing at whichever registry level it needs; the rest of the chain is followed automatically.

---

#### Cross-repository relations

A standard `Relation` references instances within the same repository using bare UUIDs. When `ext:federation` is declared, `Relation` gains two optional qualifier fields:

```typescript
// Additional optional fields on Relation (ext:federation only):
sourceRepositoryId?: UUID   // absent = source is in the current repository
targetRepositoryId?: UUID   // absent = target is in the current repository
```

When `sourceRepositoryId` or `targetRepositoryId` is present, the corresponding `sourceInstanceId` or `targetInstanceId` is the instance's UUID within the named foreign repository. Because SRS instance IDs are globally unique UUIDs, an unqualified UUID is unambiguous as an identity key — the repository qualifier is a resolution hint, not a disambiguation mechanism.

A cross-repository `Relation` degrades gracefully when the named repository cannot be located: the relation is preserved with its external qualifier; the instance is treated as an unresolved citation. Implementations must not discard the relation or treat the unknown repository as an error during normal operation.

---

#### `RepositoryRegistryEntry`

One entry in a repository registry.

```typescript
{
  repositoryId: UUID    // stable identity key; matches the repository's own repositoryId
  title: string         // human-readable name; for display and disambiguation only
  location?: string     // local path or URL; absent = ID-only citation (location unknown)
  lastSeen?: ISO8601    // when this entry was last confirmed reachable
  tags?: string[]
}
```

`location` may be any form the implementation can resolve: a relative or absolute filesystem path, or a URL. When absent, the entry records that a repository with this `repositoryId` exists, but its location is not known to this registry.

---

#### `RepositoryRegistry`

A local file listing the SRS document repositories known to this system or team. May be used standalone or as part of a federated hierarchy.

```typescript
{
  registryId: UUID
  title: string
  updatedAt: ISO8601
  entries: RepositoryRegistryEntry[]

  childRegistries?: string[]
  // Paths or URLs to subordinate RepositoryRegistry files.
  // Resolution follows the chain: this registry → child registries → their children.
  // Cycles must be detected and halted (Invariant 62).
}
```

A registry is just a file. There is no registry server; no authentication is specified. A registry may live at any level of a filesystem or URL hierarchy. Teams may share a registry file in a shared folder; organisations may publish one at a stable URL; communities may federate by pointing at each other. Any of these are valid — none are required.

Resolution order when locating a repository by `repositoryId`: search `entries[]` of the current registry first, then follow each `childRegistries` pointer in declaration order, depth-first. Stop when a matching entry is found or the chain is exhausted.

---

#### `FederationEvent`

A record of a merge, split, or import operation between repositories. Stored in a federation events file (not in the instance index) so that provenance of structural operations remains readable and auditable without polluting the instance graph.

```typescript
{
  eventId: UUID
  event: "merge" | "split" | "import"

  at: ISO8601             // when the operation was performed
  performedBy?: string    // name or identifier of the actor

  sourceRepositoryId?: UUID
  // Required for "merge" and "import": the repository instances arrived from.

  targetRepositoryId?: UUID
  // Required for "split": the new repository instances were moved into.

  affectedInstanceIds: UUID[]
  // The instance IDs involved. For "merge"/"import": IDs as they appear
  // in the receiving repository after the operation. For "split": IDs as
  // they appeared in the source repository before the operation.

  strategy?: "preserve-ids" | "new-ids-with-lineage"
  // The copy strategy used (see Section 7, Copy Semantics).
  // Absent when strategy is not applicable or unknown.

  note?: string
  // Human-readable explanation of why the operation was performed.
}
```

A `FederationEvent` with `event === "merge"` is recorded in the receiving repository. A `FederationEvent` with `event === "split"` is recorded in both the source repository (what left) and the new repository (what arrived). A `FederationEvent` with `event === "import"` is recorded in the consuming repository.

---

#### `FederationEventsFile`

The file that holds `FederationEvent` records for a repository.

```typescript
{
  repositoryId: UUID       // the repository these events belong to; must match the enclosing repository's repositoryId
  events: FederationEvent[]
}
```

---

#### Manifest extensions (`ext:federation`)

When `ext:federation` is declared, `RepositoryManifest` gains two optional fields:

```typescript
// Optional additions to RepositoryManifest when ext:federation is declared:
federationPath?: string
// Path to the RepositoryRegistry file for this repository.
// Default when absent: "federation/registry.json"
// Implementations must not fail if the file does not exist; absence means standalone.

federationEventsPath?: string
// Path to the FederationEventsFile for this repository.
// Default when absent: "federation/events.json"
// Implementations must not fail if the file does not exist; absence means no events recorded.
```

---

#### ext:repository

**Content**: **Required for**: any implementation that stores SRS content as files, produces sharable SRS archives, or supports interoperable export and import.

Defines the **SRS Live Repository Format**: a normative directory layout, manifest, and file conventions for SRS content stored on a filesystem. The **SRS Archive** — the shareable export format — is a self-contained snapshot of a live repository packaged as a ZIP file. The live repository is the working format; the archive is the export. Both are defined here because an archive is structurally identical to a repository snapshot.

A conforming implementation must be able to round-trip between a live repository and an archive without data loss.

#### Value assessment

The repository format is valuable when it improves independent inspection, import/export, re-import, collaboration, provenance, and conflict handling without requiring a running service. It is not valuable if it makes simple archives tool-dependent, hides semantic identity behind filenames or storage history, or confuses storage history with SRS semantic history.

For that reason, SRS repository identity remains inside SRS data (`repositoryId`, `instanceId`, `relationId`, `documentId`, Field/Type IDs, and package IDs). Optional storage or backup systems may record how files changed, but they do not replace SRS IDs, Relations, lifecycle state, `createdAt`, or `updatedAt`.

#### Repository layout

A conforming repository has the following root structure:

```
<repository-root>/
  .srs                           ← required marker (empty or format version on first line)
  manifest.json                  ← required: root manifest and instance index
  source-documents/              ← raw source material with sidecar metadata
  notes/                         ← Tier 0 Note instances
  typed-records/                 ← Tier 1 TypedRecord instances
  records/                       ← Tier 2 Record instances
  relations/                     ← Relation records
  package/                       ← local Package, field, type, and view definitions
```

The `.srs` marker file identifies the repository root. It may be empty or contain a single line with the format version (e.g. `1.0`). A reader must locate the marker before treating a directory as a repository.

Only `manifest.json` and `.srs` are required at root. Other folders are created as content is added. Implementations may add folders for application-local purposes; folder names defined by this extension are reserved.

Reserved content folders may contain implementation-defined subfolders. For example, a repository may store Tier 2 instances under `records/decisions/`, `records/articles/`, or `records/roles/` so long as every instance remains listed in `RepositoryManifest.instanceIndex` with its full relative path.

**Folder responsibilities:**

| Folder | Contents | Required when |
|---|---|---|
| `source-documents/` | Raw source files with `.meta.json` sidecars | Source documents are present |
| `notes/` | `Note` instance files (Tier 0) | Notes are present |
| `typed-records/` | `TypedRecord` instance files (Tier 1) | Typed Records are present |
| `records/` | `Record` instance files (Tier 2) | Records are present |
| `relations/` | `Relation` record files | Relations are present |
| `package/` | Local `Package` and definition source files | Local definitions are present |

#### File naming

Instance files may be named by the implementation. The authoritative identifier (`instanceId`, `relationId`, `documentId`) is stored inside the file; it is not derived from the filename.

Recommended convention: `<human-readable-slug>.json`. Where uniqueness within a folder cannot be guaranteed, `<slug>-<first-8-chars-of-uuid>.json` is recommended.

#### `RepositoryManifest`

The root manifest. Must be present at `manifest.json` in the repository root.

```typescript
{
  formatVersion: string      // SRS repository format version, e.g. "1.0"
  srsVersion: string         // SRS spec version, e.g. "2.0"
  conformance: string        // full conformance declaration string

  repositoryId: UUID         // stable identifier; does not change on export or copy
  title: string              // human-readable name for this repository

  container: Container       // inline Container — canonical; authoritative over
                             // any separate container.json in the root

  packageRef?: PackageRef    // reference to local or external package definitions

  instanceIndex: InstanceIndexEntry[]
  // Authoritative list of all SRS instances in this repository.
  // An instance not in the index is not a member, even if its file is present.

  relationsPath?: string | string[]
  // Relative path(s) to relation file(s). Default: "relations/relations.json"

  sourceDocumentsPath?: string
  // Relative path to source documents folder. Default: "source-documents/"

  sourceDocumentIndex?: SourceDocumentIndexEntry[]
  // Optional explicit index of source documents. When present, implementations
  // may use this for discovery instead of scanning for *.meta.json files.
  // When absent, discovery is by sidecar scan. See Invariant 52.

  relationsChecksums?: RelationsChecksumEntry[]
  // Optional checksums for each relations file declared in relationsPath.
  // Enables fast no-op detection for relation collections during re-import.

  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

#### `PackageRef`

Reference to the package supplying Field and Type definitions for this repository.

```typescript
{
  mode: "local" | "external"

  // local: definitions live in the repository under package/
  path?: string           // relative path to package.json; default: "package/package.json"

  // external: definitions are expected pre-installed in the consumer's registry
  packageId?: UUID
  packageName?: string
  packageVersion?: string
}
```

When `packageRef` is absent, all Type and Field definitions are expected pre-installed. When `mode` is `"local"`, the package at `path` must be `mode: "bundled"` and must include all Fields and Types referenced by any Tier 2 Record in the repository (see Invariant 50).

#### `InstanceIndexEntry`

One entry in the manifest instance index.

```typescript
{
  instanceId: UUID
  tier: 0 | 1 | 2         // 0: Note, 1: TypedRecord, 2: Record
  path: string            // relative path from repository root
                          // e.g. "records/decisions/decision-mounting-system.json"

  typeId?: UUID           // Tier 2 only: the Type this Record instantiates
  typeName?: string       // denormalised convenience; not authoritative
  title?: string          // denormalised for display; not authoritative

  checksum?: string       // digest of the instance file: "<algorithm>:<hex>"
                          // e.g. "sha256:4b2c...". Enables fast no-op detection
                          // during re-import without reading file content.
}
```

`path` is the authoritative locator. If `typeName` or `title` conflict with the resolved instance file, the file content takes precedence.

#### `SourceDocumentIndexEntry`

One entry in the optional `sourceDocumentIndex`.

```typescript
{
  documentId: UUID          // matches SourceDocument.documentId in the sidecar
  sidecarPath: string       // relative path from sourceDocumentsPath to the .meta.json sidecar
  contentPath: string       // relative path from sourceDocumentsPath to the content file
  title?: string            // denormalised for display; not authoritative

  sidecarChecksum?: string  // digest of the .meta.json sidecar: "<algorithm>:<hex>"
  contentChecksum?: string  // digest of the content file: "<algorithm>:<hex>"
}
```

When `sourceDocumentIndex` is present, every entry must correspond to a valid sidecar that satisfies Invariant 52. The index does not replace sidecar resolution; consumers must still parse the sidecar to obtain the full `SourceDocument` record.

#### `RelationsChecksumEntry`

One entry in the optional `relationsChecksums` manifest field.

```typescript
{
  path: string       // matches an entry in relationsPath
  checksum: string   // digest of the relations file: "<algorithm>:<hex>"
}
```

#### `SourceAnchor`

A lightweight locator for a position within a source document. Used primarily when capturing a repository-local excerpt from a larger mutable source document in a standalone repository.

```typescript
{
  kind: "line-range" | "char-range" | "timestamp-range" | "message-id" | "json-pointer" | "custom"
  value: string
  note?: string
}
```

#### `SourceDocument`

A raw source document stored within the repository. Source documents are source material — transcripts, recordings, founding documents, email threads — that Records cite via `SourceReference`. They are not SRS instances and do not appear in the instance index.

```typescript
{
  documentId: UUID

  title?: string
  description?: string

  contentType: string        // MIME type, e.g. "text/plain", "audio/mp4", "application/pdf"
  encoding?: string          // e.g. "utf-8"; meaningful for text content types
  language?: string          // BCP 47 language tag, e.g. "en-GB"
  date?: string              // ISO 8601 date; when the source material itself was produced or recorded

  contentPath: string        // filename of the content file, relative to source-documents/

  processingNote?: string
  // Free-form note about how this document was produced or processed.
  // e.g. "auto-transcribed via speech-to-text; transcript not reviewed"

  excerpt?: {
    sourceDocumentId: UUID         // repository-local parent source document, when this file is an excerpt
    anchor?: SourceAnchor          // where the excerpt came from in the parent source, if known
    capturedAt?: ISO8601           // when the excerpt was extracted
    capturedBy?: string            // who or what extracted it
    sourceChecksumAtCapture?: string
    // optional checksum of the parent source content as it existed when the excerpt was captured
  }

  createdAt: ISO8601
  importedAt?: ISO8601
  meta?: Record<string, unknown>
}
```

Each source document is stored as a content file paired with a metadata sidecar in `source-documents/`:

```
source-documents/
  <stem>.<ext>               ← the content file (text, audio, PDF, etc.)
  <stem>.meta.json           ← SourceDocument metadata record (sidecar)
```

The content file and sidecar share the same filename stem. `contentPath` in the sidecar is the content filename (including extension), making the pair resolvable by scanning for `.meta.json` files without requiring the content extension to be derivable from the `documentId`.

Source documents may themselves be excerpts. This supports manual, one-off chunking for provenance when the underlying source is large, awkward to cite precisely, or not guaranteed to remain immutable. An excerpt is still just a `SourceDocument`: it lives in `source-documents/`, has its own `documentId`, and is cited via `sourceType: "repository-document"` like any other repository-local source.

When `excerpt` is present, the content file is the frozen captured snippet. `excerpt.sourceDocumentId` identifies the repository-local parent source document it was taken from, and `excerpt.anchor` records where it came from using a lightweight locator such as a line range, message ID, timestamp range, or JSON Pointer. `sourceChecksumAtCapture`, when present, records the parent content digest at extraction time to preserve provenance even if the parent source later changes.

#### `SourceReference` additions

When `ext:repository` is declared, `SourceReference.sourceType` gains the value `"repository-document"`. A reference with `sourceType: "repository-document"` uses `sourceId` to carry the `SourceDocument.documentId`. The content file is located via the matching sidecar in `sourceDocumentsPath`.

`"external-document"` remains valid for documents that are genuinely external to the repository. `"repository-document"` must be used for documents stored within the same repository.

For standalone transcript and chat repositories, the recommended pattern is:

- store the full export or dump as a `SourceDocument`
- cite it using `sourceType: "repository-document"`
- when exact quoted provenance matters and the parent source may change, capture a repository-local excerpt as its own `SourceDocument` and cite the excerpt instead of the mutable parent

#### Relations storage

Relations are stored as a **JSON object** conforming to the relations-collection schema: a `$schema` key and a `relations` array. A bare JSON array is not a conforming relations file. The default location is `relations/relations.json`. When `relationsPath` is an array of paths, their `relations` arrays are concatenated for resolution. A `relationId` must be unique across all relation files in the repository.

#### Repository mutability and semantic evolution

SRS repositories may evolve over time. Mutation policy is tiered:

- Notes and Typed Records may be edited in place; `updatedAt` advances when the file's semantic content changes.
- Tier 2 Records may receive non-semantic corrections in place; `updatedAt` advances.
- Semantic changes to Tier 2 Records create a new Record linked to the prior Record by `refines` or `supersedes`.

Storage history does not replace semantic history. A filesystem backup, archive timestamp, or application log may prove that a JSON file changed, but SRS Relations express what the change means. A conforming repository implementation must not treat storage history as a substitute for `supersedes`, `refines`, `derived-from`, lifecycle state, or object timestamps.

#### Schema conventions

Every JSON file in a repository should declare its schema via a `$schema` key as the first property. This makes the repository self-describing to JSON Schema validators and AI agents without requiring external tooling.

**Canonical schema URLs** (SRS 2.0 structural schemas):

| File type | `$schema` value |
|-----------|----------------|
| `manifest.json` | `https://srs.semanticops.com/schema/2.0/manifest.json` |
| Notes (Tier 0) | `https://srs.semanticops.com/schema/2.0/note.json` |
| TypedRecords (Tier 1) | `https://srs.semanticops.com/schema/2.0/typed-record.json` |
| Records (Tier 2) | `https://srs.semanticops.com/schema/2.0/record.json` |
| Relations collection | `https://srs.semanticops.com/schema/2.0/relations-collection.json` |
| Source document sidecar | `https://srs.semanticops.com/schema/2.0/source-document-meta.json` |
| Field definition | `https://srs.semanticops.com/schema/2.0/field.json` |
| Type definition | `https://srs.semanticops.com/schema/2.0/type.json` |
| Package | `https://srs.semanticops.com/schema/2.0/package.json` |

**Domain schemas**: A package may supply additional domain schemas that validate type-specific field constraints. These narrow the structural Record schema with `allOf` and are placed in `package/schemas/`. A domain schema's `$id` should follow the pattern `https://srs.semanticops.com/schema/domain/<namespace>/<typeName>/<version>.json`. Records conforming to a specific Type may declare the domain schema `$id` instead of the generic record schema URL.

**Relations collection format**: The relations file must be a JSON object with a `$schema` key and a `relations` array — not a bare array. This ensures the file is self-identifying.

**Offline use**: Conforming implementations are not required to fetch schema files at runtime. The `$schema` key is a documentation and tooling hint, not a live reference. A repository may include a local copy of the structural schemas in a `schemas/` directory at the repository root for offline validation.

**AI comprehension**: The presence of `$schema` in every file allows an AI agent to identify the purpose of any file without reading its full content. Combined with the `instanceIndex` in `manifest.json` and any `aiGuidance` blocks, a repository becomes traversable by an LLM without prior knowledge of its structure.

#### Archive format

An archive is a self-contained, shareable snapshot of a live repository.

**Format**: ZIP file. Recommended file extension: `.srs`.

**Archive root**: The repository root maps to the ZIP root. `manifest.json` must be at the ZIP root, not inside a subdirectory.

**Self-containment requirements**: A conforming archive must include:
- `manifest.json` and the `.srs` marker
- All instance files referenced in the manifest instance index
- All relation files declared in `relationsPath`
- All source document content files and sidecars referenced by any `SourceReference` within any instance **or Relation** in the archive
- When `PackageRef.mode === "local"`: the full local package

External package dependencies (`mode: "external"`) are declared in `packageRef` and expected pre-installed at the consumer. They are not bundled in the archive.

**Producing an archive:**
1. Verify the manifest instance index is complete and consistent with the filesystem
2. Collect all files per the self-containment requirements above
3. ZIP from the repository root such that `manifest.json` is at the ZIP root
4. Verify the archive contains `manifest.json` at root before publishing

**Consuming an archive:**
1. Unzip to a staging or working location
2. Locate and parse `manifest.json`
3. Read `conformance`; surface any unsupported extensions to the user before proceeding
4. Load all instances via the instance index
5. Load relations from `relationsPath`
6. Resolve `repository-document` source references via `sourceDocumentsPath`

A conforming consumer must not silently discard instances, relations, or source documents present in the archive. Unknown extension content should be preserved and surfaced rather than dropped.

When importing into an existing store, apply the identity-based import rules defined in the next section.

#### Import / re-import semantics

Import operations are **identity-based**, not path- or filename-based. A consumer receiving an archive or syncing a live repository must never create a duplicate object solely because the archive path, filename, or repository directory name differs from what already exists locally.

**Repository identity**

`repositoryId` is the sync key for a repository. If an incoming repository has a `repositoryId` that already exists in the consumer's local store, the operation is a sync/update of that repository — not a new repository alongside it.

**Object-level identity rules**

Each object type has a stable identity key:

| Object | Identity key |
|--------|-------------|
| Note, TypedRecord, Record | `instanceId` |
| Relation | `relationId` |
| Source document | `documentId` |
| Field definition | `id` + `version` |
| Type definition | `id` + `version` |
| Package | `packageId` + `packageVersion` |

Resolution rules for each incoming object:

- **Same key, same content** (or matching checksum): **no-op**. Do not write, overwrite, or create a duplicate.
- **Same key, different content** (or mismatched checksum): **conflict**. Surface the conflict explicitly. Silent overwrite is not conformant; silent discard is not conformant.
- **New key**: insert.

**Checksum-assisted comparison**

`InstanceIndexEntry.checksum`, `SourceDocumentIndexEntry.sidecarChecksum`, `SourceDocumentIndexEntry.contentChecksum`, and `relationsChecksums[*].checksum` allow fast no-op detection without reading file content. If an incoming checksum matches the locally stored checksum for the same identity key, the object is unchanged and the import step may skip it without further comparison.

Checksum format: `<algorithm>:<hex-encoded-digest>`. SHA-256 is strongly recommended: `sha256:<64-char-hex>`. The algorithm prefix makes the format self-identifying; other algorithms are permitted when both producer and consumer agree.

When checksums are absent, a conforming importer must compare content directly, or treat every write as idempotent if the implementation does not track prior state.

**Copy semantics**

To create an independent copy of a repository — not a sync — the importer must mint a **new `repositoryId`**. For inner objects, two strategies are valid:

1. **Preserve inner IDs**: the copy carries the same `instanceId`, `relationId`, and `documentId` values as the source. Appropriate for read-only snapshots and archive mirrors.
2. **Mint new inner IDs with lineage**: the copy mints fresh UUIDs and adds `derived-from` Relations from each new instance to the source `instanceId`. Appropriate when the copy will evolve independently.

An importer must not mix strategies within a single copy operation.

---

#### ext:json-store

**Content**: **Required for**: any implementation that stores an SRS repository as a single portable JSON file.

**Depends on**: `ext:repository`

Defines the **SRS JSON Store format** (`.srsj`): a single-file, self-contained serialization of a complete SRS repository. The JSON Store is an alternative to the filesystem layout defined by `ext:repository`. Both formats carry identical semantic content; an implementation must be able to convert between them losslessly.

#### Purpose and trade-offs

The JSON Store is valuable when portability matters more than human readability of individual files: emailing a repository, committing a snapshot to version control as a single artifact, embedding a repository in a test fixture, or transferring between systems without ZIP tooling.

The filesystem layout (`ext:repository`) is preferred when independent inspection of individual records, partial checkout, or per-file storage history is valuable.

#### File format

A `.srsj` file is a pretty-printed UTF-8 JSON object with the following top-level structure:

```json
{
  "srsj": "1",
  "manifest": { ... },
  "data": {
    "package/package.json": { ... },
    "package/fields/<id>.json": { ... },
    "records/<type>/<slug>.json": { ... },
    "relations/relations.json": { ... }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `srsj` | string | Format version. Current value: `"1"`. Implementations must reject files with unrecognised versions. |
| `manifest` | object | The `RepositoryManifest` object as defined by `ext:repository`. `manifest.instanceIndex` is authoritative. |
| `data` | object | Flat key-value store. Keys are forward-slash-normalised relative paths as they would appear in a filesystem repository. Values are the parsed JSON content of each file. |

The `.srsj` extension is conventional; an implementation may accept any filename. The extension must not be used as an authoritative indicator of format — implementations must inspect the `srsj` field to confirm the format and version.

#### Path conventions in `data`

Keys in `data` follow the same relative-path conventions as `ext:repository`:

- `package/package.json` — package index
- `package/fields/<filename>.json` — field definitions
- `package/types/<filename>.json` — type definitions
- `package/views/<filename>.json` — view definitions
- `records/<subfolder>/<filename>.json` — Tier 2 Record instances
- `notes/<filename>.json` — Tier 0 Note instances
- `typed-records/<filename>.json` — Tier 1 TypedRecord instances
- `relations/<filename>.json` — relation collections

The `instanceIndex` in `manifest` is the authoritative list of members. A key present in `data` but absent from `instanceIndex` is not a repository member.

#### Conformance requirements

1. A conforming producer must write every instance listed in `manifest.instanceIndex` as an entry in `data` under its declared `path`.
2. A conforming producer must write all relation files declared in `manifest.relationsPath` as entries in `data`.
3. A conforming producer must write the local package under `package/package.json` when `packageRef.mode === "local"`.
4. A conforming consumer must reject a `.srsj` file whose `srsj` value is not a recognised version string.
5. A conforming consumer must apply the same identity-based import rules as `ext:repository` when loading a `.srsj` file into an existing store.
6. A conforming implementation must be able to round-trip a repository between the JSON Store format and the filesystem layout without data loss.

#### Source documents

Binary source document content is not included in the JSON Store. An implementation converting from a filesystem repository to `.srsj` must omit source document content files and should surface the omission to the user. Source document sidecars (`.meta.json`) may be included in `data` if they are pure JSON; their content files must not be.

#### Interoperability

A `.srsj` file is semantically equivalent to the `.srs` ZIP archive defined by `ext:repository`, with the following differences:

| | `.srsj` JSON Store | `.srs` ZIP Archive |
|---|---|---|
| Format | Single JSON file | ZIP of directory tree |
| Manifest location | Top-level `manifest` key | `manifest.json` at ZIP root |
| Instance storage | Embedded in `data` object | Individual files in ZIP |
| Source document content | Not included | Included as files |
| Primary use | Tooling, fixtures, snapshots | Sharing, export, long-term storage |

---

#### Discovery

**Extension ID**: ext:discovery
**Depends On**: ext:lifecycle
**Content**: **Required for**: any implementation that supports querying and filtering instances across a repository — CLI, web UI, search engine, or API.

Defines the **Discovery Contract**: a portable, implementation-agnostic specification of how SRS repositories are queried. Covers structured filter axes, the Text Projection algorithm, normalization rules, and the consistency rule separating exact-match structured filters from the content-match recall floor.

#### `DiscoveryQuery`

```typescript
{
  typeId?:         UUID      // exact match on Record.typeId
  typeNamespace?:  string    // exact match on Record.typeNamespace
  typeName?:       string    // exact match on Record.typeName
  containerId?:    UUID      // instance is a member of this container (RFC-009 I-66)
  tag?:            string[]  // AND semantics: all tags must be present
  lifecycleState?: string    // exact match on Record.lifecycleState (ext:lifecycle)
  tier?:           0 | 1 | 2 // instance tier (Note=0, TypedRecord=1, Record=2)
  contentMatch?:   string    // free-text recall-floor predicate
}
```

An instance matches a `DiscoveryQuery` if and only if it satisfies all predicates whose values are specified. Unspecified predicates are wildcards.

#### `TextSegment`

```typescript
{
  fieldId:   string  // UUID for package-resolved fields; sentinel string for special segments
  fieldName: string  // field name or sentinel
  text:      string  // raw stored value (normalization applied at match time)
}
```

Sentinels: `"note-title"`, `"note-section"`, `"typed-record-title"`, `"typed-record-field"`, `"tag"`, `"label"`.

#### Searchable `valueType` classification

Searchable (contribute segments): `string`, `text`, `url`, `select`, `multiselect`.

Non-searchable (excluded from projection): `number`, `boolean`, `date`.

#### Text Projection algorithm

**Tier 2 (Record):** for each `fieldValue` in `fieldValues` array order — if `valueType` is searchable and value is non-empty, emit one `TextSegment` per value (one per array element for `multiselect`). After all field values, emit one segment per tag. Optionally emit `displayLabel` segments after tags.

**Tier 0 (Note):** if `title` is non-empty, emit a leading `note-title` segment. For each `section[]` in order, emit a `note-section` segment if `content` is non-empty. After sections, emit tag segments.

**Tier 1 (TypedRecord):** if `title` is non-empty, emit a leading `typed-record-title` segment. For each `TypedField` in `fields[]` array order — if `valueType` is searchable (or absent with a string/array value) and value is non-empty, emit one or more `typed-record-field` segments. After fields, emit tag segments.

#### Normalization (applied at match time, not at segment construction time)

1. Apply Unicode NFC.
2. Fold to lowercase (Unicode simple case folding).
3. Do not strip punctuation, diacritics, or whitespace.

#### Consistency rule

Structured filter axes (`typeId`, `typeNamespace`, `typeName`, `containerId`, `tag`, `lifecycleState`, `tier`) are **exact-match predicates**: two conforming implementations with identical data MUST return identical result sets.

Content matching (`contentMatch`) is a **recall-floor rule**: implementations MUST include every instance whose Text Projection contains a segment whose normalized text contains the normalized query as a substring. Additional results and alternative ranking are explicitly permitted.

When both structured filters and `contentMatch` are specified, an instance MUST satisfy both the exact-match structured predicates AND the content recall-floor predicate.

#### Conformance fixture

A self-contained fixture repository with expected result sets lives at:

```
srs/conformance/discovery/
  fixture-repo/   # valid SRS repository with 8 Tier-2 Records, 2 Tier-1, 1 Tier-0, 2 Containers
  scenarios.json  # named query scenarios with expectedInstanceIds and exactMatch flags
```

An implementation that declares `ext:discovery` MUST pass all fixture scenarios (exactMatch:true scenarios exactly; exactMatch:false scenarios as a superset).

---


### Key Invariants

Conforming implementations must uphold the following invariants.
#### core — Field

**1.** `FieldAssignment.displayLabel` and `FieldAssignment.displayHint` are for rendering only. They must not affect AI guidance, extraction logic, `valueType` interpretation, or validation.

**2.** A `Type` must not redefine, override, or duplicate the semantic content of any `Field` it includes. If different semantics are needed for a Field in a specific Type context, a distinct `Field` with its own identity and lineage must be created.

**3.** A `Field`'s `aiGuidance` belongs to the Field. Type-level `aiGuidance` provides session framing only.

#### ext:lifecycle

**4.** `Type.lifecycle.initialState` must reference a `name` that appears in `lifecycle.states[]` and where `isInitial === true`.

**5.** Every `from` and `to` value in `lifecycle.transitions[]` must reference a `name` that appears in `lifecycle.states[]`.

**6.** `Record.lifecycleState`, when present, must reference a `name` in the associated `Type.lifecycle.states[]`.

#### core — Package

**7.** Every `fieldId` referenced in any `FieldAssignment` within a `Package.types[]` must appear as the `id` of an entry in `Package.dependencyRefs`.

**8.** If `Package.mode === "bundled"`: every `Reference` in `dependencyRefs` must have a matching `Field` in `fields[]` (matched on `id` and `version`).

**9.** `Field.id` is stable across versions. A new `id` means a new definition, not a new version of an existing one.

#### ext:cross-field-validation

**10.** All `fieldId` values in any `CrossFieldRule` within `Type.validationRules[]` must appear in the Type's effective field list. Cross-field rules cannot reference Fields outside the Type.

**11.** A `conditional-required` rule must supply `predicateFieldId`, `predicateValue`, and `targetFieldId`. A `field-ordering` rule must supply `predicateFieldId`, `targetFieldId`, and `effect`. A `mutual-exclusion` rule must supply `fieldIds` with at least two entries.

#### ext:views-l1

**12.** Every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set. View compatibility is field-centric (based on required field presence), not Type-bound.

**13.** `FieldView.displayLabel`, `FieldView.displayHint`, and `FieldView.editorHintOverride` are for rendering only. They must not affect AI guidance, extraction logic, `valueType` interpretation, or validation.

**14.** A `View` must not override, redefine, or duplicate the semantic content of any `Field` or `Type` it references. View-level `aiGuidance` is workflow framing; it does not redefine Field extraction semantics.

#### ext:views-l1 — Distribution

**15.** Every `typeId` referenced by any `View` in `Package.views[]` must appear in `Package.dependencyRefs` with `definitionType: "type"`. If `mode === "bundled"`, that `Type` must be present in `types[]`.

#### core — Relation

**16.** In a `Relation`, `sourceInstanceId` is the asserting instance and `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target." This convention must not be reversed.

**17.** `Relation` is reserved for assertions that carry semantic consequence beyond simple mention or citation. Lightweight prose references that do not assert structural, causal, or governance relationships must not be modelled as `Relation` records.

#### core — Note/TypedRecord

**18.** `NoteSection.name` values must be unique within a `Note`.

**19.** `TypedField.name` values must be unique within a `Typed Record`.

#### core — Container

**20.** `Container.containerId` is not an instance ID. It must not appear in `Container.rootInstanceIds`, `Container.memberInstanceIds`, `Relation.sourceInstanceId`, or `Relation.targetInstanceId`.

**21.** `Container.rootInstanceIds` and `Container.memberInstanceIds`, when present, must reference valid SRS instance IDs (`Note.instanceId`, `Typed Record.instanceId`, or `Record.instanceId`).

#### ext:repeatable-fields

**22.** If `FieldAssignment.repeatable` is false or absent, its corresponding `FieldValue` must use `value` and must not include `entries`.

**23.** If `FieldAssignment.repeatable` is true, its corresponding `FieldValue` may use `entries`. If `minItems` is specified, `entries` must contain at least that many items. If `maxItems` is specified, `entries` must not exceed that count. For repeatable fields, `Field.validationRules` are evaluated against each `FieldValueEntry.value` individually, not against the array as a whole.

**24.** `FieldAssignment.minItems` and `maxItems` are valid only when `repeatable === true`. They must be ignored when `repeatable` is false or absent.

#### ext:field-groups

**25.** Every `groupId` in `Record.groupValues[]` must reference a `groupId` declared in the associated `Type.fieldGroups[]`.

**26.** Within a `FieldGroupEntry.fieldValues[]`, every `fieldId` must appear in the enclosing `FieldGroup.fields[].fieldId`.

**27.** A `FieldGroupValue.entries` list must satisfy `FieldGroup.minItems` and `maxItems` where specified.

#### core — Record

**28.** `Record.typeId` and `Record.typeVersion` are the authoritative Type binding. `typeNamespace` and `typeName` are denormalised convenience fields. If they conflict with the resolved `Type`, the `typeId`/`typeVersion` identity takes precedence and the Record is considered invalid until corrected.

#### ext:protocol

**29.** Every `stageId` in `ProtocolStage.dependsOn[]` must reference a `stageId` declared in the enclosing `Protocol.stages[]`. A stage may not declare a dependency on itself.

**30.** Every `fieldId` in `ProtocolStage.contributesTo[]` must reference a `fieldId` that appears in the stage's own `outputType`'s effective field list (when `outputType` is declared), or in `Protocol.targetType`'s effective field list (when `outputType` is absent). A single stage must not contribute to both its own `outputType` and the enclosing `Protocol.targetType`. When neither `outputType` nor `Protocol.targetType` is declared, `contributesTo` must be empty.

**31.** For every pair of stages A and B within a `Protocol` where B.dependsOn includes A.stageId, B.order must be greater than A.order. `order` is display order; execution sequence is determined by `dependsOn` resolution. The two must not contradict each other.

#### ext:views-l2

**32.** Any `DocumentView` in `Package.documentViews[]` that contains a `SectionSource` with `type === "type-query"` must use `namespace/name` format for `semanticObjectType` (e.g. `"core/decision"`, not `"decision"`). Bare strings are acceptable only in single-system `DocumentView` records not included in a Package. Implementations receiving a `DocumentView` from a Package with a bare `semanticObjectType` in a `type-query` section should treat the portability of that section as undefined.

**I-63.** When DocumentView.rootTypeRefs is present and non-empty, each ExactTypeRef entry MUST resolve to a Type that exists in the Package (the union of all packages in scope per packageRef/packageRefs; matched by both typeId and typeVersion). An entry that does not resolve MUST produce a diagnostic and MUST NOT be used for Container matching.

#### ext:addressability

**33.** `Revision.priorRevisionId`, when present, must reference a `Revision.revisionId` for the same `fieldId` and `recordId`. Revision chains must be acyclic.

**34.** `AttentionState.containerId` must reference a valid `Container.containerId`. Other Address components (`recordId`, `fieldId`, `protocolRunId`, `stageId`) are optional and may be absent when focus has not yet narrowed.

#### ext:views-l2 — Distribution

**35.** Every `DocumentSection.renderViewId` in any `DocumentView` within `Package.documentViews[]` must reference a `View.id` that appears in `Package.views[]` or `Package.dependencyRefs`. If `mode === "bundled"`, that `View` must be present in `Package.views[]`.

#### ext:blueprint — Distribution

**36.** Every `TypeRef.typeId` referenced in any `Blueprint.rootTypes[]`, `Blueprint.requiredTypes[]`, or in any `RelationSpec.sourceType` or `RelationSpec.targetType` within `Blueprint.structure[]`, for each Blueprint in `Package.blueprints[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. If `mode === "bundled"`, each such Type must be present in `Package.types[]`.

#### ext:protocol — Distribution

**37.** Every `TypeRef.typeId` referenced in `Protocol.targetType` or in any `ProtocolStage.outputType`, for each Protocol in `Package.protocols[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. Every `FieldRef.fieldId` in any `ProtocolStage.contributesTo[]` must appear in `Package.dependencyRefs` with `definitionType: "field"`. If `mode === "bundled"`, those Types must be in `Package.types[]` and those Fields in `Package.fields[]`.

#### core — Field.contentFormat

**38.** `Field.contentFormat`, when present, is only meaningful when `valueType` is `"string"` or `"text"`. Implementations must ignore `contentFormat` on fields with any other `valueType`.

#### ext:type-inheritance

**39.** `Type.extendsTypeId`, when present, must reference a valid `Type.id`. Inheritance chains must be acyclic; a Type may not directly or transitively extend itself.

**40.** A specializing Type must not declare a `fieldId` in its own `fields[]` that duplicates any `fieldId` inherited from its base Type or any ancestor Type.

**41.** When `Type.fieldOrder` is present, it must contain exactly the set of field UUIDs in the Type's effective field list. No UUID may appear more than once, and no UUID from the effective field list may be absent.

**42.** Every `fieldId` in `Type.fieldAssignmentOverrides[]` must reference a field inherited from the base Type or an ancestor Type. Overrides must not reference fields declared in the specializing Type's own `fields[]`, must not alter Field semantics, and must not relax an inherited required field from `true` to `false`.

**43.** When `ext:type-inheritance` is declared, `Package.dependencyRefs` must include a `Reference` for every Type in the transitive closure of base Types for any Type in `Package.types[]`. If `mode === "bundled"`, all such base Types must be present in `types[]`.

#### ext:views-l2 — Navigation

**44.** Every `NavigationLink.fromSectionId` and `NavigationLink.toSectionId` must reference a `sectionId` declared in the enclosing `DocumentView.sections[]`.

#### ext:repository

**45.** A conforming repository must have a `.srs` marker file and a `manifest.json` at its root. A directory without both is not a conforming repository.

**46.** Every `instanceId` in `RepositoryManifest.instanceIndex` must resolve to a file at the declared `path`, and that file must contain an instance whose `instanceId` matches the index entry. An index entry whose `path` does not resolve, or whose file contains a different `instanceId`, is invalid.

**47.** `RepositoryManifest.container` is the canonical `Container` for the repository. It must satisfy all core Container invariants (Invariants 20–21). If a separate `container.json` is present in the repository root, it must be consistent with the manifest's embedded Container; the manifest takes precedence on conflict.

**48.** A `SourceReference` with `sourceType: "repository-document"` must have a `sourceId` matching a `SourceDocument.documentId` whose sidecar is present in `sourceDocumentsPath`. A reference whose `documentId` cannot be resolved within the repository is invalid.

**49.** An archive must include all instance files listed in `RepositoryManifest.instanceIndex`. An archive missing any indexed instance file is malformed; a conforming consumer must reject it or surface the missing instances explicitly before processing.

**50.** When `PackageRef.mode === "local"`, the package at the declared path must be `mode: "bundled"` and must include all Fields and Types referenced by any Tier 2 `Record` in the repository's instance index. This is the repository analogue of Package Invariants 7–8.

**51.** An archive that includes a `Relation` containing a `SourceReference` with `sourceType: "repository-document"` must include that document's sidecar and content file, just as if the reference appeared within an instance. A conforming archiver must scan Relations for `repository-document` references and collect the corresponding source material. An archive missing such material is malformed.

**52.** Every `SourceDocument` sidecar present under `sourceDocumentsPath` must have a `contentPath` that resolves to an existing content file in the same directory. A sidecar whose `contentPath` does not resolve is invalid. A conforming producer must not emit such a sidecar; a conforming consumer must surface the resolution failure before processing any `SourceReference` pointing at that `documentId`.

**53.** A conforming importer must use `repositoryId` as the key to determine whether an incoming repository already exists locally. An importer that unconditionally creates a new local repository for every archive it receives, without consulting `repositoryId`, is not conformant.

**54.** When an importer encounters an incoming object whose identity key matches an existing local object but whose content or checksum differs, it must surface the conflict explicitly. An importer that silently overwrites or silently discards in this case is not conformant.

**55.** A checksum value in `InstanceIndexEntry.checksum`, `SourceDocumentIndexEntry.sidecarChecksum`, `SourceDocumentIndexEntry.contentChecksum`, or `RelationsChecksumEntry.checksum` must use the format `<algorithm>:<hex-encoded-digest>`. A value that does not include the `<algorithm>:` prefix is invalid.

#### ext:federation

**56.** `Relation.sourceRepositoryId`, when present, must not equal the enclosing repository's own `repositoryId`. The absent-means-local convention handles intra-repository source references; using `sourceRepositoryId` to refer to the current repository is not conformant.

**57.** `Relation.targetRepositoryId`, when present, must not equal the enclosing repository's own `repositoryId`. The absent-means-local convention handles intra-repository target references.

**58.** A `Relation` with `sourceRepositoryId` present must also have a valid `sourceInstanceId`. A `Relation` with `targetRepositoryId` present must also have a valid `targetInstanceId`. The repository qualifier qualifies an instance ID; it does not replace it.

**59.** A `FederationEvent` with `event === "merge"` or `event === "import"` must declare `sourceRepositoryId`. A `FederationEvent` with `event === "split"` must declare `targetRepositoryId`. `affectedInstanceIds` must be non-empty for all event types.

**60.** A `FederationEventsFile.repositoryId` must match the `repositoryId` declared in the enclosing repository's manifest. A federation events file whose `repositoryId` does not match is invalid for that repository.

**61.** `RepositoryRegistry.entries` must not contain two entries with the same `repositoryId`. A registry file with duplicate `repositoryId` values in `entries[]` is malformed.

**62.** An implementation following `RepositoryRegistry.childRegistries` links must detect and halt on cycles. If resolving a child registry yields a `registryId` already encountered in the current resolution chain, the implementation must surface the cycle and stop rather than loop.

#### Container (core)

**I-64.** When a Container has one or more rootInstanceIds and also carries containerType, implementations SHOULD emit a diagnostic if containerType does not equal the resolved root Type name field (the local name within its namespace, not namespace/name). The root Record Type is authoritative; a mismatch does NOT make the Container invalid. Containers with no rootInstanceIds may carry any containerType value without triggering this rule.

**I-65.** When a Vocabulary in the repository package declares Term entries for a given tag key, Container tags bearing that key MUST resolve against those Terms per RFC-006 vocabulary resolution rules. Free-string tags are valid when no Vocabulary entry governs the key.

**I-66.** All conforming SRS implementations MUST implement the containers_for_instance operation. Given an instanceId, it returns every Container whose rootInstanceIds, memberInstanceIds, or transitive contains-Relation traversal from rootInstanceIds includes the instance. The result set MUST be consistent with the current state of those fields and relations.

#### ext:blueprint (Blueprint)

**I-78.** Each entry in Blueprint.rootTypes MUST be an ExactTypeRef: both typeId (UUID) and typeVersion (integer >= 1) MUST be present. Implementations MUST resolve each entry against the Package (the union of all packages in scope per packageRef/packageRefs) at Blueprint load time; an entry that does not resolve MUST produce a diagnostic. An empty rootTypes array is valid and produces no diagnostics.

#### ext:repository (RepositoryManifest)

**I-79.** Every SRS repository manifest MUST embed exactly one root Container in manifest.container. The root Container MUST satisfy the core Container invariants unchanged: Invariant 20 (its containerId is not an instance ID and never appears in rootInstanceIds, memberInstanceIds, Relation.sourceInstanceId, or Relation.targetInstanceId) and Invariant 21 (every id in rootInstanceIds/memberInstanceIds references a valid SRS instance id).

#### ext:repository (RepositoryManifest, Container)

**I-80.** Every id in the root container's rootInstanceIds and memberInstanceIds MUST resolve to a member of the repository's authoritative instance set. The manifest instanceIndex is the cache of that set (RFC-012 R6), not an independent authority. This is the root-container specialization of core Invariant 21, stated separately so the required-root-container guarantee is self-contained.

#### ext:repository (Container.identityInstanceId)

**I-81.** When present on a Container, identityInstanceId MUST equal an id contained in that Container's rootInstanceIds or memberInstanceIds. On the root container it names the repository's identity record. If it resolves to no such member, the repository is invalid. Reassigning identityInstanceId to a different member MUST NOT change the repositoryId, the container's containerId, or any instance id; the new target must already be a member before the pointer moves to it, so the repository is never transiently invalid.

#### ext:repository (Container, containerIndex)

**I-82.** When containerIndex is non-empty, each non-identity section root of the root container (its navigation sections) SHOULD be the root of some Container listed in containerIndex. An absent or empty containerIndex suppresses this diagnostic. A section root with no corresponding section container is a diagnostic, not an error, and a consumer MUST still render it as a navigation leaf rather than dropping it.

#### ext:import-tracking

**I-83.** A tool MUST resolve every `typeId` and `fieldId` referenced by any Tier 2 Record against the union of all installed package version directories. This extends Invariant 50 to the multi-version case: a reference is resolved if it can be found in any installed version directory. A reference that cannot be found in any installed version directory MUST be reported as a validation error. A tool MUST NOT remove any prior-version package directory if doing so would leave any such reference unresolvable.

**I-84.** When `manifest.upstreamPackage` is set, there MUST exist at least one entry in `manifest.packageRefs` (or `manifest.packageRef`) whose `packageId` matches `manifest.upstreamPackage.packageId`. A manifest where no `PackageRef` entry's `packageId` matches `upstreamPackage.packageId` MUST be reported as a validation error. Manifest-only validators MAY skip this check when no `PackageRef` entry carries `packageId` (i.e., all local-mode entries predate RFC-014 and omit the field), and SHOULD report the repository state as indeterminate rather than emitting a validation error in that case.

#### com.semanticops.core namespace

**I-85.** A conforming SRS implementation MUST make all `com.semanticops.core/*` types and fields resolvable in every repository without any `packageRef` or `packageRefs` declaration in the manifest. The core base package's definitions are treated as logically present in the RFC-014 R6 package union for all repositories. An implementation that fails to resolve `com.semanticops.core/*` types and fields in a structurally valid repository is non-conformant with RFC-018.

**I-86.** A repository MUST NOT declare any Type or Field under the `com.semanticops.core` namespace in a local or external package. An implementation MUST reject the repository load with a conflict error if any such declaration is encountered during package loading. This reservation covers only the `com.semanticops.core` namespace; other `com.semanticops.*` sub-namespaces are governed by their own RFC or by general package conflict rules and are not affected by this invariant.

#### manifest.container.identityInstanceId

**I-87.** `manifest.container.identityInstanceId`, when present, MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. This invariant layers on RFC-013 I-81 (membership requirement retained; I-81 is not superseded); RFC-018 adds the type constraint on top. During the RFC-018 migration grace period (R7), an implementation MUST emit a migration warning rather than a validation error for existing repositories whose `identityInstanceId` resolves to a record that is not a Tier-2 `com.semanticops.core/purpose` Record (including Tier-0 notes and Tier-1 TypedRecords of any type). All newly-created repositories (post-RFC-018) must satisfy this invariant immediately.

---

#### ext:protocol × ext:addressability

**Content**: **Trigger**: an implementation declares both `ext:protocol` and `ext:addressability`.

**Required behaviour**: Protocol stage advancement updates `AttentionState`. When a Protocol run advances from one stage to another, the active `AttentionState` must reflect the new stage before any conversation material is tagged.

Specifically:

- `AttentionState.protocolRunId` references the active Protocol run
- `AttentionState.stageId` reflects the current stage
- `AttentionState.fieldId`, when a specific field is the current focus within a stage, is set accordingly

Conversation chunks produced while `AttentionState.stageId` is set are associated with that stage. This makes stage-level Context Queries (`{runId}/{stageId}`) return the correct material.

---

#### ext:lifecycle × ext:addressability

**Content**: **Trigger**: an implementation declares both `ext:lifecycle` and `ext:addressability`.

**Required behaviour**: A lifecycle state transition on a Record MUST produce a `Revision` snapshot for each current field value at the moment of transition. The snapshot `Revision` MUST carry:

- `provenance.lifecycleTransition` set to the name of the target lifecycle state
- `provenance.transitionedAt` set to the transition timestamp

This makes the record's field values at the moment of each lifecycle transition addressable — a consumer can reconstruct what the record looked like when it entered `active`, `archived`, or any other state, without timestamp correlation.

**Invariant [LC-AX1]**: When a repository declares both `ext:lifecycle` and `ext:addressability`, every lifecycle state transition on a Record MUST be recorded as a `Revision` per field value with `provenance.lifecycleTransition` set. An implementation that performs a lifecycle transition without creating these snapshots is non-conformant.

**Invariant [LC-AX2]**: The `Revision` snapshot created for a lifecycle transition MUST be created atomically with the transition — both the new `lifecycleState` value on the Record and the snapshot `Revision` records MUST be committed together. A record in state `active` with no corresponding `Revision` snapshot bearing `provenance.lifecycleTransition: "active"` is a conformance violation.

---


### Conformance

**Content**: An implementation declares conformance using the following form:

```
SRS <version> Core [+ ext:<name> ...]
```

Example:
```
SRS 2.0 Core + ext:lifecycle + ext:protocol + ext:views-l1 + ext:addressability + ext:recommended-relations
```
#### Core conformance requirements

**Content**: A core-conformant implementation must:
- Accept and validate `Field`, `Type`, `Record` (Tier 2), `Relation`, and `Container` inputs against this specification
- Enforce Invariants 1–3, 7–9, 16–21, 28, 38
- Support the Foundation and Distribution groups in full
- Implement the namespace format and reference format correctly
- Not accept `relationType` strings that include `/` except in `namespace/name` format
- **Closed-vocabulary resolution (V1):** Resolve every value participating in a closed vocabulary to exactly one installed entry in the effective entry set before accepting a write. Non-resolving values are validation errors. This rule applies to:
  - `Relation.relationType` — resolved against the repo-global `RelationTypeDefinition` set (RFC-005 E1 is a named instance of V1)
  - `select`/`multiselect` field values — resolved against the Field's effective closed `Vocabulary`
  - `Record.lifecycleState` — resolved against the Type's effective lifecycle state set
- Enforce the effective entry set construction (V5): retire entries excluded before uniqueness; `extends*Version` mismatches are hard errors.
- Enforce inline and referenced lifecycle integrity (V9).
- Enforce `select`/`multiselect` field binding exclusivity and closedness (V3).

Support for `Note` (Tier 0) and `Typed Record` (Tier 1) is optional at core conformance level.

#### Extension conformance requirements

**Content**: An implementation declaring a given extension must:
- Accept and validate all types defined by that extension
- Enforce all invariants assigned to that extension
- Respect the declared dependency chain (e.g., `ext:views-l2` requires `ext:views-l1` to also be declared)

`ext:recommended-relations` is retired as of RFC-005. It no longer owns any normative semantics. Implementations must not treat it as a capability gate — the canonical relation vocabulary is now mandatory core behaviour provided by the `com.semanticops.srs` package.

#### ext:federation conformance requirements

**Content**: An implementation declaring `ext:federation` must:
- Accept and preserve cross-repository qualifiers (`sourceRepositoryId`, `targetRepositoryId`) on `Relation` records without stripping them
- Treat a `Relation` with an unresolvable `sourceRepositoryId` or `targetRepositoryId` as a valid citation with an unresolved location — not as an error
- Produce and consume `RepositoryRegistry` and `FederationEventsFile` according to the structures defined in this section
- Detect and surface cycles when following `childRegistries` chains; halt rather than loop
- Enforce Invariants 56–62

#### ext:repository conformance requirements

**Content**: An implementation declaring `ext:repository` must:
- Produce repositories with a `.srs` marker and `manifest.json` at root, with content in the prescribed folder layout
- Maintain a complete and accurate `instanceIndex` in the manifest; the index must reflect the actual files present
- Produce archives that satisfy all self-containment requirements (Invariants 49 and 51)
- Consume archives by parsing the manifest first and resolving all instances via the index before processing content
- Resolve `SourceReference` entries with `sourceType: "repository-document"` via the sidecar in `sourceDocumentsPath`
- Enforce Invariants 45–55
- Require no TSS, Protocol, Addressability infrastructure, or external registry when `PackageRef.mode === "local"`. The repository is fully operable with only its own files.

An implementation that can produce archives but not consume them (or vice versa) must declare this limitation explicitly. Partial repository support is not conformant.

#### ext:repository (self-contained) profile

**Content**: A named stricter profile for standalone, offline-operable repositories:

```
SRS 2.0 Core + ext:repository (self-contained)
```

An implementation declaring this profile must satisfy all `ext:repository` conformance requirements and additionally:

- `packageRef` must be present with `mode: "local"`. Absent or external package references are not permitted.
- The local package must be `mode: "bundled"` (Invariant 50 is always in effect).
- No external registry, TSS, Protocol stack, Addressability infrastructure, AttentionState, or live conversation store is required or assumed. The repository directory (or archive) is the complete and sufficient deployment unit.
- An archive produced under this profile must be openable and fully processable by a consumer with no prior installation, no network access, and no running services.

This profile is appropriate for: standalone tools, file-based backups, air-gapped or offline deployments, inter-organisational exchange, and any context where zero-dependency portability is required.

#### Interoperability note

**Content**: Two implementations at the same conformance level will produce compatible definitions for exchange. An implementation receiving a Package that includes types or fields from an extension it does not support should surface the unknown content, preserve it where possible, and pass it through rather than silently discard it.

Two implementations both declaring `ext:repository` must be able to exchange archives without data loss. An archive produced by one conforming implementation must be consumable by any other conforming implementation at the same SRS version.


## Design Rationale

### Protocol chaining and provenance traces

**Content**: 
Loose Protocols produce open material. Tight Protocols converge on a specific Record. The output of one Protocol is the input context for the next.

Example chain for a governance decision:
```
Brain Dump Protocol → unstructured Notes
Decomposition Protocol → component Notes (derived-from Brain Dump Notes)
Options Analysis Protocol → Options Analysis Record (derived-from Decomposition Notes)
Decision Protocol → Decision Record (derived-from Options Analysis Record)
```

When a Decision Record is challenged, you can traverse back through the full chain: Decision ← Options Analysis ← Decomposition ← Brain Dump ← transcript chunks. The quality of the final Record is auditable because every stage of the process left addressable artefacts.

With `ext:addressability`, each stage's conversation chunks carry the `AttentionState` at the time they were produced. "What was being discussed when the options were evaluated?" is a queryable question.

### Addressability as a prerequisite for live facilitation

**Content**: 
`ext:addressability` is not just about naming things. It is the mechanism that makes the conversation layer useful. Without `AttentionState`, transcript chunks have no address-time connection to the Records they inform. Without `Revision`, the history of a field's value is an implementation detail not visible at the interoperability layer.

Any implementation that facilitates live sessions — where conversation material is produced while people are working on specific Records and Fields — should implement `ext:addressability`. Without it, context assembly is purely retrospective, and the quality of AI assistance degrades accordingly.

**Diff rendering:** implementations rendering Revision history for governance review should support a diff view that shows field-level removals alongside additions, not only the current value. The Revision chain already provides the data needed for three useful modes: final (current value only), all markup (current value plus prior content shown as removed and new content as added), and original (the value at a specified Revision). This is a rendering pattern, not a separate data shape.

### Revision history exchange format

**Content**: 
A standard format for exchanging full Revision history between implementations, for cases where the history itself is a first-class interoperability concern. Natural extension of `ext:addressability`. Deferred pending stabilisation of the Container and Relation layers.

### Session

**Content**: 
A live collaborative process model with real-time facilitation, AI assistance, and collaborative editing. A Session produces or enriches Records but does not own them. Session-level Protocol management (tracking active stage, managing participant attention) is a natural successor to `ext:protocol` and `ext:addressability`. Deferred pending implementation experience.

### AI guidance composition order

**Content**: 
When assembling an AI prompt from multiple `aiGuidance` blocks:

1. **Type framing** — establishes what semantic object type is being worked on
2. **View framing** (if using `ext:views-l1`) — workflow-specific context for this View
3. **Field extraction guidance** — specific instruction for populating each Field
4. **Negative guidance** — constraints applied after the extraction instruction
5. **Examples** — few-shot demonstrations last, as final grounding

This ordering ensures broad context (what kind of object this is) precedes narrow directives (how to populate this specific Field). Template framing narrows the Type context — it does not replace it.

This is a recommended default. Implementations that compose differently will produce different AI behaviour from the same definitions.

### Relation taxonomy usage

**Content**: 
Use the canonical relation type strings from `ext:recommended-relations` for common relationships. Reserve custom `namespace/name` format for domain-specific relations.

**Composition example** (project planning):
```
Stage A  --contains-->  Task B
Task B   --contains-->  Subtask C
```

**Derivation example** (Protocol output):
```
Decision Record  --derived-from-->  Options Analysis Note
Options Analysis --derived-from-->  Brain Dump Note
```

**Governance example**:
```
Policy v2  --supersedes-->  Policy v1
Amendment  --amends-->      Policy v2
```

**Evidence example**:
```
Workshop photo  --evidences-->  Stage 1 completion claim
Transcript seg  --evidences-->  Decision rationale
```

Non-governance projects use the same Relation layer. `supersedes`, `delegates`, and `ratifies` apply when the semantic object type calls for them — they are one profile of the layer, not its primary purpose.

### Graduation mapping record

**Content**: 
A structured artefact recording how a Note or Typed Record was mapped to its Record successors — which section or field names were matched, merged, split, or interpreted. Useful for AI-assisted graduation review and audit. Deferred pending implementation experience.

### How to decide which extensions to implement

**Content**: 

### `semanticObjectType` as a federation risk

**Content**: 
`semanticObjectType` on `Type` and in `SectionSource.type-query` is a free-form string. The spec recommends `namespace/name` format for portable Document Views (Invariant 32) and treats bare strings as a single-system convention. This is the minimum rule needed to ship v2.

The risk: two systems can use the same bare string (`"decision"`, `"task"`) and mean different semantic Types. When graph traversal or document assembly crosses system boundaries, type-query portability becomes undefined wherever bare strings appear. This is where federation bugs will appear first.

The current design is deliberately light. Possible futures in order of increasing strictness:
- **Informative only** — `semanticObjectType` becomes advisory metadata with no query semantics; implementations must use explicit TypeRefs for cross-system queries
- **Typed vocabulary** — `semanticObjectType` becomes a typed reference to a Type definition (a `TypeRef` rather than a bare string), giving it the same identity guarantees as a Field or Type reference

The second option would require changing the type from `string` to `TypeRef | string` and a version bump. For now: prefer `namespace/name` format in any Type or SectionSource that will cross system boundaries, and treat bare strings as a scope boundary. Implementations should document which `semanticObjectType` values they recognise and what Types they map to.

### Why Type inheritance is conservative

**Content**: 
`ext:type-inheritance` adds one formal mechanism: a Type may specialize one base Type and still be processable as that base Type. This solves the common case where a domain-specific Type needs to add fields to a shared Type without duplicating the whole definition.

The extension is intentionally narrow. It supports inherited fields, added fields, explicit ordering, and presentation/workflow overrides for inherited fields. It does not let a specializing Type change Field semantics or relax base requirements. That keeps the central promise intact: a system that understands the base Type can still process the base portion of a specialized Record.

`Type.fieldOrder` and `ExportConfig.fieldOrder` share a name but operate at different layers. `Type.fieldOrder` is a Type-level ordering declaration over the full effective field list, including inherited fields. `ExportConfig.fieldOrder` is a View export setting that controls rendered output order for a particular presentation. Validators should apply the `fieldAssignmentOverrides` inherited-field restriction only to `fieldAssignmentOverrides`, not to `Type.fieldOrder`.

---

### Conditional processing

**Content**: 
Audience, platform, and output filtering may eventually allow one source Container to produce different projections for different readers. This is deferred because SectionSource queries already cover common projection differences, while a general condition evaluation model would add substantial complexity.

### Blueprint vs View — the extraction gap

**Content**: 
A View answers: given a Record that already exists, how do I render it for a specific audience?

A Blueprint answers: given source material, what Records should I extract, and how do they relate?

These are complementary but distinct. A Document View cannot serve as an extraction blueprint because it assumes Records already exist. A Blueprint cannot serve as a Document View because it does not specify how to render field values for an audience.

An extraction pipeline uses Blueprint + Field `aiGuidance` + Protocol to produce Records. A rendering pipeline uses View + Document View to project those Records into readable form.

### Why Field and Type are separate

**Content**: 
A form system where each template defines its own fields produces semantic silos: the "decision statement" in the Technology template and the "decision statement" in the Budget template are unrelated strings. They cannot be searched together, compared, or composed.

In SCDS, a Field is defined once. Any number of Types may include it. When two Types share a Field, any AI extraction logic, validation rules, or downstream analysis written for that Field applies consistently across both. The Field's identity is stable across all the contexts it appears in.

This is a stronger constraint than it appears. It means a Type cannot secretly redefine what a Field means for its own purposes — it can only configure presentation. If a Type genuinely needs different semantics, it must use a different Field.

### Why Revision is addressable

**Content**: 
In v1, field revision was an implementation concern. The spec described when to edit in-place versus create a new Record, but individual revisions were not addressable — you could not ask "what did this field say before the last Protocol run?" at the interoperability layer.

This matters for:
- **Governance challenge**: if a Record is challenged, you need to trace which conversation produced each field value and which version was in place when a downstream decision was made.
- **Context assembly**: when generating the next draft, knowing what changed between revision 2 and revision 3 — and what conversation produced that change — is more useful than knowing only the current value.
- **Audit**: a complete audit trail requires addressable history, not just current state.

`Revision` is the addressable audit trail. It does not replace the edit-in-place vs. new-Record judgment for minor corrections. That remains an implementation concern. Revision is the interoperability layer for cases where history itself is a first-class concern.

### Why Protocol replaces TemplateFacilitationStep

**Content**: 
`TemplateFacilitationStep` in v1 was field-ordering with AI guidance attached. It could specify which fields to present in which order, with optional framing. This was sufficient for a linear form-filling workflow.

But the process of building a quality Record through group deliberation is not a form-filling workflow. It is an epistemically ordered process: you cannot meaningfully evaluate options before you have articulated criteria; you cannot propose a course of action before you have characterised the problem.

Protocol stages have:
- `dependsOn` — explicit epistemic dependencies, not just ordering. A stage may not proceed until its dependencies are sufficient.
- `completionCriteria` — how to know a stage is adequate to proceed.
- `outputType` — a stage may produce its own intermediate Record, not just fill fields in the final one.
- `question` — the core epistemic question this stage answers.

The distinction is between a View (which fields to show, in what order, for presentation purposes) and a Protocol (how to build understanding epistemically, stage by stage). These are separate concerns. Collapsing them into one construct produced a type that was adequate for neither.

A Record is the *compressed output* of a Protocol run. The Protocol is the process that produced the understanding; the Record is what that understanding looks like expressed in the standard vocabulary.

### Future Extensions

**Content**: 
The following capabilities are planned but out of scope for this version.

### Why Blueprint is a new concept

**Content**: 
In v1, there was no way to specify what a document type *is* — what needs to be extracted from source material in order to build it. `DocumentTemplate` (now Document View) handled *assembly* of existing Records into readable output. But nothing owned the prior question: "Given a transcript of a governance meeting, what Types should I extract, how should they relate to each other, and what does 'complete' mean?"

Blueprint fills that gap. A Blueprint is the artefact you hand to an extraction pipeline. It specifies root Types, expected Relations between extracted Records, and completeness criteria. The Extraction pipeline consults the Blueprint to know what to look for; the Document View consults existing Records to know what to render.

The two are complementary: Blueprint → Records → Document View.

### When to edit in-place vs create a new Record

**Content**: 

### Full projection surface

**Content**: 
Document-level projection is addressed by `ext:views-l2`. The broader projection surface — dashboards, timelines, AI context packages, real-time views, and composite renderings that are not document-shaped — remains a future concern. Projections are read-only views; they do not modify Record state.

### Instance graph exchange format

**Content**: 
A standard envelope for exchanging a Container together with its full Record set, Relations, and source references. Natural successor to `Package` at the instance layer. Likely shape: `{ container, instances[], relations[], sourceRefs[] }`. Deferred pending stabilisation of `ext:views-l2` and implementation experience.

### Why the directionality invariant matters

**Content**: 
`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. "D-004 supersedes D-001" must always be represented as `source: D-004, target: D-001`.

Without this invariant, graph traversal breaks across system boundaries. If System A stores `supersedes` with the newer Record as source and System B stores it with the older Record as source, a federated query for "all Records that supersede D-001" returns different results from each system. The invariant is the minimum agreement required for semantic interoperability on Relation graphs.

The invariant does not assign agency or authority to the `source` slot — those are properties of the `relationType`. A `contains` Relation makes the source the container and the target the contained item. An `evidences` Relation makes the source the evidence and the target the claim it supports. Directionality is a slot convention; semantics come from the type.

### Protocol loose-to-tight spectrum

**Content**: 
The spectrum from loose to tight is not a quality ranking — it is a fitness question. A Brain Dump Protocol is the right tool when the problem space is not yet understood. A Decision Protocol is the right tool when the group is ready to converge. Starting with a tight Protocol before the problem is decomposed produces poor output because the epistemic prerequisites are not met.

The `dependsOn` field on `ProtocolStage` makes this explicit. A stage that depends on decomposition results cannot run before those results exist. This is not just sequencing — it is a statement about what understanding is required before the next stage is meaningful.

### Core Thesis

**Content**: 
Traditional document systems treat documents as primarily text.

This specification treats documents as **socially negotiated semantic state**. Text is one projection of that state.

Six principles follow from this:

**1. Semantic state is primary; documents are projections.**
The same semantic state may be rendered as a board paper, a governance record, a dashboard, or an AI context package. None of these projections is the source of truth.

**2. Fields are reusable semantic atoms.**
A Field defines a reusable slot of meaning with stable identity. It is not a form field. It is not tied to any specific Type or View. Its AI guidance, validation rules, and value type belong to the Field, not to the Type that uses it.

**3. Types are compositions, not owners of Field semantics.**
A Type selects and orders Fields for a specific semantic object type. It may provide session-level AI framing. It must not override or redefine the meaning of any Field it includes.

**4. Lineage and provenance are first-class.**
Definitions evolve. Forks happen. Upstream changes must be traceable. A definition without lineage is a definition that cannot be trusted to evolve cleanly.

**5. Records represent negotiated semantic state, not objective truth claims.**
A Record captures what a group understood, agreed, or committed to at a point in time. That understanding may be partial, contested, or later revised. The system preserves revision history and provenance precisely because the original state is worth keeping alongside its successors. Human prose and ambiguity are preserved, not collapsed.

**6. Understanding is mutable; historical semantic state has permanent value.**
SCDS assumes that understanding evolves. Records, Relations, and lifecycle states may be revised, superseded, refined, or contradicted without invalidating prior semantic state. A rough plan is a valid semantic object. A superseded decision is a valid semantic object. An abandoned hypothesis is a valid semantic object. Historical semantic state is not noise to be discarded — it is provenance, institutional memory, and the record of how understanding arrived at its current form.

---

### Field transclusion in Document Views

**Content**: 
Pulling a specific Field value inline into a Document View is useful, but a syntax such as `{{field:{recordId}/{fieldId}}}` makes a reusable Document View depend on concrete instance IDs. That weakens portability and should wait for an addressing model that can express reusable selection rules rather than binding a definition to one Record.

### Why "Type" not "Module"

**Content**: 
"Module" in v1 was accurate but implied a software analogy that didn't communicate the concept well to non-technical practitioners. "Module" suggests a composable software unit. "Type" says what it actually is: a type definition for a semantic object. A Decision is a Type. A Task is a Type. A Risk is a Type.

The rename also makes the Record/Type relationship legible by analogy: a Record is an instance of a Type, just as a value is an instance of a type in any typed system.

### μDemocracy Mapping

**Content**: 

### Why `valueType` and `editorHint` are separate

**Content**: 
A Field with `valueType: "text"` might be edited via textarea in a web form, captured via voice in a mobile app, or extracted directly from a transcript with no editing UI. The semantic type is stable; the editing surface is a rendering decision.

AI extraction logic, validation rules, and export formatting depend only on `valueType`. `editorHint` is a default that implementations and Views may override. Conflating the two would mean that changing the preferred editor for a field could inadvertently break AI extraction rules.

### Why Address and AttentionState are needed

**Content**: 
v1 noted "focus links" as a session-layer concern without defining a mechanism. The mechanism was absent.

Without co-addressability, the transcript/SCDS separation is clean in principle but broken in practice. There is no way to say "this conversation happened while we were focused on this Field." Retrospective `SourceReference` links help, but they require someone to explicitly annotate which conversation produced which value. For real-time facilitation, that annotation needs to happen live.

`AttentionState` is the live cursor. Every transcript chunk produced while a Protocol stage is active carries the current `AttentionState` as a tag. Context assembly later queries by address: "all chunks where attention was on Field X in Record Y." The annotation is free because it was captured at production time.

`Address` is the addressing scheme that makes co-addressability possible. A transcript chunk and a Field Revision are in the same address space — they can reference each other because both have resolvable addresses.

**Multi-Container addressing**: A Record may belong to more than one Container simultaneously (a task may exist in both a project Container and a sprint Container). That Record therefore has multiple valid document-space Addresses — one per Container context. This is intentional: `containerId` in a document-space `Address` is not a uniqueness constraint, it is a *context specifier*. `AttentionState.containerId` records which Container was active during a live session, making the contextual anchor explicit. When a session-tagged transcript chunk is later queried, the Container in the `AttentionState` tells you not just *what Record* was being discussed but *in which context* it was being discussed.

### Usage Guidance

**Content**: 

### Why `displayLabel` must not affect extraction

**Content**: 
`displayLabel` lets a View relabel a Field for a specific audience without altering the Field's meaning. "Strategic question" might be displayed as "The decision we're making" in a facilitated view aimed at non-specialist participants.

If `displayLabel` could affect extraction, two Views of the same Record could produce different extracted values for the same Field — because the AI was given different labels. Field semantics must be stable across views. The label controls what the human sees; the Field's `aiGuidance` controls what the AI does.

### View inheritance and composition

**Content**: 
As View libraries mature, inheritance will become necessary. A lightweight ADR View and a governance ADR View share base configuration — field selection, ordering, `editorHint` overrides — while diverging on workflow framing and export layout.

A future version may define:
- `extendsViewId?: UUID` — single inheritance; child View inherits all `fieldViews` from parent and overrides selectively
- `composesViews?: UUID[]` — mixin composition; multiple Views contribute non-overlapping configuration

Current design: `View` is a leaf type. Use Lineage tracking to record inheritance relationships.

### Sub-field addressing

**Content**: 
Web UI comments and annotations attached to specific text within a Field value require addressing below the Field level. `ext:addressability` currently addresses at Field granularity. Sub-field text selection addressing is architecturally possible (the Address space accommodates it) but is deferred as a separate extension.

---

### Why the conversation layer is a permanent boundary

**Content**: 
SCDS captures negotiated semantic state. Transcripts capture raw material — speech, threads, annotations — from which semantic state is extracted or constructed. These are different things, and conflating them would harm both.

If SCDS tried to be a transcript standard, it would need to model speaker identity, timing, overlapping speech, and audio quality — none of which are semantic concerns. If the transcript standard tried to be a semantic state standard, it would need to version field definitions, track lineage, and manage inter-Record Relations — none of which are evidence concerns.

The boundary makes both layers better at what they do. The connection between them — `SourceReference` and `AttentionState` — is the bidirectional bridge. Each layer references the other; neither absorbs the other.

---

### Design Decisions

**Content**: 

### Why Containers and Relations are complementary

**Content**: 
A Relation graph answers "what is semantically connected to what?" but not "what should be exported or queried together?" These are different questions. A project may contain hundreds of Records connected by many Relations. The question "which Records are in scope for this export?" is a scoping question, not a semantic one.

Container provides the boundary. "These Records collectively form a unit for boundary purposes" is a scope claim. "Stage A contains Task B" is a semantic claim. A Container can hold Records that have no `contains` Relation between them — they are grouped for operational reasons, not because one is semantically inside the other.

Relationship-first implementations derive Container membership by traversing `contains` Relations from root instances. Container-first implementations use explicit `memberInstanceIds`. Both strategies are valid; neither replaces the other.

### Field domains

**Content**: 
Named sets of Fields that travel together may become useful as Type libraries grow. For v2, ordinary shared base Types plus `ext:type-inheritance` cover the immediate reuse need with less machinery. Field domains are deferred until there is stronger evidence that reusable field sets need their own identity, versioning, and package dependency rules independent of Types.

### Why Record tiers exist (Note → Typed Record → Record)

**Content**: 
Not all content arrives with full semantic formalisation. A meeting note, a brainstorm document, a rough plan — these are valid starting points that should be preserved and referenceable, even before anyone has decided what Types to extract from them.

The three tiers let a system capture content at whatever maturity level it has, and formalise later without losing provenance. The graduation path is one-way: Note → Typed Record → Record. It mirrors how understanding actually develops — rough first, then structured, then formally defined.

The tier model also makes SCDS progressively adoptable. A team can start at Tier 0 and arrive at Tier 2 as their understanding of the semantic structure matures, without ever having to restart from scratch.

### Graceful degradation

**Content**: 
In a federated ecosystem, implementations will often receive SCDS content that uses extensions they do not support. The useful default is: understand what you can, preserve what you cannot.

A conforming implementation should validate the core and extension content it recognises, surface unknown extension content clearly to users or downstream systems, and pass that unknown content through rather than silently discarding it. This is especially important for Records instantiated against a specializing Type: a system that knows only the base Type should still be able to read the inherited base fields correctly while preserving the specialization-specific fields.

---

### Extension Design Notes

**Content**: 

### Choosing between repeatable fields, field groups, and separate Records

**Content**: 

### Graduation: when and how

**Content**: 

### Why tags exist: from clustering to definitions

**Content**: Tags emerged from a concrete problem in note-taking: when building up a body of notes, there was no lightweight way to say "these notes are related" or "this note belongs to this topic cluster" without creating a formal Relation or binding to a Type.

Raw string tags on Notes filled that gap. A tag is not a claim about structure — it is a claim about topic membership. Notes about the same problem domain, design thread, or concern can share a tag, and that shared tag is enough to surface them together.

### Evolution to definitions

As tag vocabularies grew, the tags themselves needed properties. Two problems appeared:

1. **Disambiguation**: the same string could mean different things in different contexts. A label is not enough — description and aliases matter.
2. **Roles**: some tags were structural signals rather than topic labels. The `foundation` tag marks notes that should always be included in an AI context handoff. That is a semantic role, not just a category.

This led to `TagDefinition` — an addressable Tier 3 record that gives a tag a stable identity, description, roles, and aliases. A tag does not *require* a definition to be used; definitions are additive enrichment. But when a tag carries structural meaning (like `foundation`), its definition is what makes that meaning machine-readable.

### Design principle

Tags are a peer to Field and Type in the SRS data model — not an extension, not an afterthought. They are defined natively in the core implementation with dedicated service functions, not modelled as user-defined package types. This is because the operations that depend on tags (especially foundation note selection for AI context) are universal across all SRS repositories, not specific to any one repo's package.

### ext:federation × ext:lifecycle interaction

**Content**: Three design decisions govern how `ext:lifecycle` and `ext:federation` interact.

**1. Lifecycle state preservation on import**

Records imported via federation preserve their `lifecycleState`. An implementation MUST NOT reset a federated record's lifecycle state to `initialState` on import. Lifecycle state is part of the record's identity and governance history — it is not a local annotation that the receiving repository owns.

**2. Cross-repository relations and lifecycle state**

Relations targeting records in any lifecycle state — including `draft` and states where `isFinal: true` — are valid. Lifecycle is a governance concern, not an identity or structural concern. An implementation MAY surface a diagnostic warning when a relation targets a remote record whose lifecycle state is unresolvable (e.g. the remote repository is unavailable), but MUST NOT reject the relation on that basis alone.

**3. Final-state records as federation targets**

Records in states where `isFinal: true` remain valid relation targets after federation operations. `isFinal` signals that the record's lifecycle has settled — it does not signal deletion or invalidity. A federated record in a final state retains its identity and may be referenced, linked, and included in containers.

