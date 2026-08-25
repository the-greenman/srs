# Semantic Record System Specification

## Specification

### Purpose and Scope

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


#### Foundational values and development phase

**Content**: SRS exists to preserve **semantic sovereignty through portable data**. Meaning must remain under its owners' control and able to move between tools, implementations, representations, repositories, and time without captivity or silent semantic loss. Portability without identity, relations, provenance, and interpretable semantics is not sovereignty. A design that improves convenience while making semantic data captive violates the purpose of SRS.

Three foundational tensions govern decisions in the SRS standard layer. Their poles are complementary necessities, not good and bad alternatives.

#### Semantic Integrity and Practical Expression

The standard defaults to **Semantic Integrity**: preserve exact meaning, identity, authority, relations, and provenance. It moves toward Practical Expression when established meaning remains recoverable and a bounded presentation, authoring, diagnostic, or review need would otherwise make correct information unusable. A projection must retain a clear line to canonical meaning and must never silently become a substitute semantic source.

#### Continuity and Evolution

The temporal preference is explicitly phase-bound. **Before the first full public release**, the standard is in formation and defaults to **evidence-led Evolution**. The project must make the changes needed to correct contradictions, close semantic gaps, and establish a coherent foundation before users depend on it. Those changes must be grounded in practical implementation, corpus, migration, authoring, or user experience; speculative elegance alone is insufficient. Stable identity, deterministic migration, parity evidence, diagnostics, atomic cutover, and recovery remain required safeguards.

**At the first full public release, the temporal default reverses to Continuity.** This transition is precommitted. From that point, the standard protects compatibility, identity, and established expectations by default. A breaking change requires an explicit version boundary, migration and compatibility analysis, recovery evidence, and ratification. Continuity must not preserve a demonstrated semantic contradiction indefinitely, but the burden of proof moves to the proposed change.

#### Shared Coherence and Local Autonomy

The standard defaults to **Shared Coherence** for interchange, semantic interpretation, identity, validation, authority, and conformance. It moves toward Local Autonomy when a concern is genuinely presentation-owned, extension-owned, repository-local, or implementation-private. Local variation must remain behind an explicit boundary and must not produce incompatible interpretations of shared data.

These values govern the SRS standard layer. Rust, web, and other implementation layers may adopt different preference profiles for their own concerns, but those profiles cannot weaken the standard's semantic integrity, portability, or shared conformance boundaries.


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
| Cross-Field Validation | `ext:cross-field-validation` | — | |
| Recommended Relations | `ext:recommended-relations` | — | |
| Import Tracking | `ext:import-tracking` | — | |
| Registry | `ext:registry` | — | |
| Repository | `ext:repository` | — | File-based live repository and archive (export/import) format |

`ext:protocol` and `ext:addressability` are formally independent but are a functional co-dependency for live facilitation: a Protocol without `AttentionState` produces no live conversation tagging; `AttentionState` without Protocol stages has no stage context to capture. Implementations supporting live facilitation should declare both.

**Blueprint is a core package definition**, not a declarable extension. `Blueprint` is included in `Package.blueprints[]` when needed; no `ext:blueprint` declaration is required or defined.

Example declaration: `SRS Core + ext:lifecycle + ext:protocol + ext:views-l1 + ext:addressability`

---

**Intro**: Start with the question: what does your implementation need to do?

| Need | Extensions |
| --- | --- |
| Define and exchange Field and Type definitions | Core only |
| Track definition origin and imports | `ext:import-tracking` |
| Publish a definition catalog | `ext:registry` |
| Governance with lifecycle states | `ext:lifecycle` |
| Present and export Records | `ext:views-l1` |
| Assemble multi-Record documents | `ext:views-l2` |
| Facilitate structured deliberation | `ext:protocol` |
| Live facilitation with context assembly | `ext:addressability` |
| Extraction from source material | Blueprint (`Package.blueprints[]`) |
| Specialise Types while preserving base processability | `ext:type-inheritance` |
| Lists of values within a Record | Core only — `fieldType` `cardinality: "list"` (RFC-039; `ext:repeatable-fields` retired) |
| Structured repeatable context in a Record | Core only — composite-range Field (`datatype: "ref"`, `mode: "inline"`; RFC-039; `ext:field-groups` retired) |
| Complex conditional validation | `ext:cross-field-validation` |
| Cross-system Relation interoperability | `ext:recommended-relations` |




### Namespace Format

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
| `fieldType` changed — datatype, cardinality, value domain, format, or constraints | Version bump required |
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

**Content**: The atomic reusable semantic unit. Fields are defined once and composed into Types. A Field's `aiGuidance` and `fieldType` — including every constraint the latter carries — belong to the Field, not to any Type that includes it.

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
  fieldType: FieldType

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

#### `FieldType` — the value semantics

`fieldType` carries everything about what a Field's value *is*. It decomposes value semantics into orthogonal facets — **datatype × cardinality × value-domain × format × constraints** — so each axis varies independently, and adds three composite datatypes (`ref`, `dependent`, `map`) that let a Field's range be another Type.

```typescript
FieldType {
  datatype: "string" | "number" | "integer" | "boolean" | "date" | "date-time" | "ref" | "dependent" | "map"

  // Cardinality — the sole cardinality mechanism
  cardinality?: "single" | "list"   // default: "single"
  minItems?: integer                // cardinality "list" only; 0 ≤ minItems ≤ maxItems
  maxItems?: integer                // cardinality "list" only

  // Value domain — datatype "string" only
  valueDomain?: "open" | "closed"   // default: "open"
  allowedValues?: string[]          // valueDomain "closed"; mutually exclusive with vocabularyRef
  vocabularyRef?: UUID               // valueDomain "closed"; LINEAGE (rfc-decision-c8704763) — bare
                                     // UUID of an installed Vocabulary, migrated from the former
                                     // namespace/name@version pattern string

  // Semantic string format — datatype "string" only
  format?: "plain" | "markdown" | "uri" | "uuid" | "email"

  // Value constraints — minLength/maxLength/pattern (string); minimum/maximum (number/integer)
  constraints?: object

  // Composite range — datatype "ref" only
  rangeType?: ExactTypeRef          // REQUIRED when datatype is "ref"; the Type this field's range is
  mode?: "inline" | "reference"     // default: "inline"; fixed per Field

  // Dependent typing — datatype "dependent" only
  dependsOn?: string                // REQUIRED; "self", or a sibling field name whose type the value conforms to

  // Open string-keyed collection — datatype "map" only
  valueRange?: "string" | "number" | "integer" | "boolean" | "date" | "date-time" | "open"  // REQUIRED
}
```

**`datatype` semantics:**

| Value | Meaning |
|---|---|
| `"string"` | Text of any length. Length, pattern, format, and value domain are separate facets, not distinct datatypes |
| `"number"` | Numeric value, fractional permitted |
| `"integer"` | Whole number |
| `"boolean"` | True/false |
| `"date"` | ISO 8601 calendar date |
| `"date-time"` | ISO 8601 date + time |
| `"ref"` | The range is another Type — nested object(s) when `mode` is `"inline"`, target instance id(s) when `"reference"` |
| `"dependent"` | The value conforms to the type descriptor named by `dependsOn` |
| `"map"` | Open string-keyed collection whose values conform to `valueRange` |

Cardinality is declared **only** here. A Field holding many values is `cardinality: "list"`; a Type that includes it must not restate or override that — Field semantics belong to the Field (Invariant 2).

A `reference`-mode value is a target instance id, and MUST NOT be interpreted as or require a `Relation`. Use `reference` for definitional composition, where the target's identity is part of the definition; model an assertion *between* instances — one needing provenance, lifecycle, or confidence — as a `Relation` instead.

#### `vocabularyRef` — binding closed string fields to shared vocabularies

When `fieldType.valueDomain` is `"closed"`, a Field declares exactly one value source:

```typescript
allowedValues?: string[]   // inline anonymous closed vocabulary (sugar; retained for simple cases)
vocabularyRef?: UUID       // LINEAGE (rfc-decision-c8704763) — bind to a named, installed
                           // Vocabulary by bare UUID; the effective package set resolves it
```

`allowedValues` is formally sugar for an anonymous inline closed vocabulary: the value set is fixed by the Field definition, so changing it means a new Field version. `vocabularyRef` is a **configurable** data range — the value set is managed as package configuration and evolves without reversioning the Field — and is used when the set is shared, extensible, or needs Term identity. A `vocabularyRef` MUST resolve to a `Vocabulary` with `mode: closed`. Declaring both, or neither when `valueDomain` is `"closed"`, is a validation error.

#### Historical: the pre-RFC-032 `valueType` model

Before RFC-032, value semantics were a single closed enum, `valueType`, with the satellite properties `allowedValues`, `contentFormat`, `validationRules`, and a standalone `repeatable` cardinality. That enum conflated four axes at once, which is why every axis needing independent expression had to be bolted on separately. It is **removed**, not deprecated — a Field definition carrying `valueType` does not conform to this specification. Packages authored against the old model map across as:

| Legacy `valueType` | Equivalent `fieldType` |
|---|---|
| `"string"` | `{ datatype: "string" }` (plus `format: "markdown"` if `contentFormat` was `"markdown"`) |
| `"text"` | `{ datatype: "string", format: "plain" \| "markdown" }` |
| `"number"` | `{ datatype: "number" }` |
| `"boolean"` | `{ datatype: "boolean" }` |
| `"date"` | `{ datatype: "date" }` |
| `"url"` | `{ datatype: "string", format: "uri" }` |
| `"select"` | `{ datatype: "string", valueDomain: "closed" }` + `allowedValues` or `vocabularyRef` |
| `"multiselect"` | `{ datatype: "string", cardinality: "list", valueDomain: "closed" }` + `allowedValues` or `vocabularyRef` |

`validationRules` entries become `fieldType.constraints` facets; an `enum` rule becomes `valueDomain: "closed"` with `allowedValues`. A `required` rule was never a Field-level concern and moves to the `FieldAssignment` that includes the Field.

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
  // ext:type-inheritance and ext:cross-field-validation

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

A Field reference within a Type. Declares this field's composition order and requiredness within the Type, without redefining field semantics.

```typescript
{
  fieldId: UUID     // references Field.id
  order: integer    // min: 0; declared composition order within the Type — structure, not presentation; feeds canonical serialisation and provides the render default (a View may override for display; see RFC-015)
  required: boolean

  // Documentation-only — on conflict the Field's own semantics and aiGuidance win; a contextual
  // description that contradicts them is a data error, not an override (RFC-040 Change C)
  description?: string

  // Presentation-only — must NOT affect AI guidance, extraction, fieldType, or validation
  displayLabel?: string
}
```

`displayLabel` is strictly for rendering. If a materially different label or meaning is needed, a distinct Field with its own lineage is required.

Cardinality is a property of the referenced Field (`fieldType.cardinality`, RFC-032 [R4]); the former assignment-level `repeatable`/`minItems`/`maxItems` trio is removed (RFC-039 [R7], I-134).

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
lifecycleRef?: UUID        // LINEAGE reference (rfc-decision-c8704763) — resolves to an
                            // installed Lifecycle in the effective package set (V8)
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
  // RFC-039 [R8]: inline RFC-032 fieldType facets, self-contained (no Type
  // binding to resolve against). datatype MUST NOT be "ref" or "dependent".
  fieldType: { datatype: "string" | "number" | "integer" | "boolean" | "date" | "date-time" | "map", cardinality?: "single" | "list", valueDomain?: "open" | "closed", allowedValues?: string[], format?: "plain" | "markdown" | "uri" | "uuid" | "email", constraints?: object }
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
  sourceType: "transcript-chunk" | "transcript-segment" | "external-document" | "repository-document"
  sourceId: string
  sourceStandard?: string   // versioned standard the source conforms to
  streamId?: UUID           // for transcript sources: originating stream

  sourceRole?: "evidence" | "extracted-from" | "quoted-from" | "inspired-by"
  // relationType is the DEPRECATED legacy alias of sourceRole (RFC-023):
  // accepted on read during the migration window, mapped per RFC-023
  // Change B, never written

  confidence?: number       // 0.0–1.0
  note?: string
}
```

`"transcript-chunk"` and `"transcript-segment"` are intended for implementations that have a stable conversation or time-stream layer with durable chunk or segment identifiers. A standalone repository that stores transcript exports, chat dumps, email threads, or similar source material directly under `source-documents/` should generally cite those files using `sourceType: "repository-document"` (see `ext:repository`) rather than inventing pseudo-chunk IDs.

#### Field values (RFC-039)

`FieldValue` — the value stored at one `fieldValues` key — is the recursive union:

```typescript
type FieldValue = string | number | boolean
                | FieldValue[]                       // cardinality: list
                | { [key: string]: string | unknown } // datatype: map
                | { [fieldName: string]: FieldValue } // inline composite: a fieldValues object for the rangeType
```

There is no wrapper construct: the pre-RFC-039 `FieldValue`/`FieldValueEntry` pair
objects, `groupValues`, and `FieldGroup` carriers are removed (I-134).


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

  // RFC-039: the name-keyed recursive value carrier. Keys are Field.name
  // verbatim (I-130); each value follows the recursive Change-B rule for the
  // Field's fieldType — an inline-composite value is itself a fieldValues
  // object (or an array of them for a list). null is not a value (I-132).
  fieldValues: { [fieldName: string]: FieldValue }

  // RFC-039: per-field provenance keyed identically to fieldValues (I-133).
  fieldMeta?: { [fieldName: string]: { source?: "human" | "ai" | "imported" | "derived", editedAt?: ISO8601, sourceRefs?: SourceReference[] } }

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

**Intro**: Graduation is the act of replacing a lower-tier instance with a higher-tier equivalent as its structure stabilises.

**Identity continuity:**

**Outro**: **Graduation is not always one-to-one.** A single meeting Note may graduate into one Decision Record, three Task Records, and two Risk Records. Each resulting Record receives its own `instanceId` and links to the original via `derived-from`. The original Note is preserved as the semantic root of the derived graph.

Implementations may automate graduation suggestions by matching section or field names against `Field.name` values in available Type definitions.

| Scenario | `instanceId` | Relation |
| --- | --- | --- |
| Pure formalisation (section names map directly to field names, content unchanged) | Keep | None required |
| Content interpreted or restructured during formalisation | New | `refines` from new to old |
| One Note splits into multiple Records | New IDs for all | `derived-from` from each new Record to the original |


**Intro**: **SourceReference → Relation graduation mapping (RFC-023):** when source material referenced by a `sourceRole` provenance pointer is promoted to an instance, the pointer converts to the listed Relation edge. The *referencing instance* carried the sourceRef; the *promoted instance* is created from the source material.

**Outro**: Conversion semantics (RFC-023 R6): the originating role is recorded in `meta["com.semanticops.srs/sourceRole"]` (required for `quoted-from` — it is the only carrier of the quotation distinction); `confidence` carries over; `note` maps to Relation `notes`; the converted SourceReference is removed in the same operation. Relation-borne sourceRefs never convert (a Relation cannot be an edge endpoint) and are retained. `inspired-by` is retained, or a custom `namespace/name` relation type may be used — removal applies if an edge is created. See RFC-023.

| sourceRole | Relation edge | sourceInstanceId | targetInstanceId |
| --- | --- | --- | --- |
| `extracted-from` | `derived-from` | the referencing instance | the promoted instance |
| `evidence` | `evidences` | the promoted instance | the referencing instance (direction flips) |
| `quoted-from` | `derived-from` | the referencing instance | the promoted instance |
| `inspired-by` | *(no canonical edge)* | — | — |



**Intro**: The underlying question: *Would a reasonable reader, encountering this Record a year later, recognise it as the same understanding they would have read before the change?*

**Outro**: Cross-check: if a `supersedes` Relation would feel misleading — as if the group reversed itself when it only clarified — it is probably an edit. If a silent edit would feel misleading — as if the record was silently revised after the fact — it is probably a new Record.

| Scenario | Guidance |
| --- | --- |
| Correcting how something is expressed (typo, phrasing) | Edit in-place |
| Adding context that reinforces the existing understanding | Edit in-place |
| Clarifying a detail that was ambiguous but understanding is unchanged | Edit in-place |
| Adding information that changes what was actually committed to | New Record + `refines` or `supersedes` |
| Reversing or materially replacing a prior commitment | New Record + `supersedes` |
| Producing a more detailed version from a rough original | New Record + `refines` |


#### Relation

**Content**: A first-class typed link between instances. Relations allow implementations to construct semantic graphs for navigation, analysis, projection, and reasoning.

```typescript
{
  relationId: UUID

  relationType: string
  // Must resolve to an installed RelationTypeDefinition in the effective
  // package set (RFC-005; conformance V1). Canonical types ship in the core
  // package; custom types use namespace/name form and install their own definition.

  // source [relationType] target
  sourceInstanceId: UUID    // the asserting instance
  targetInstanceId: UUID    // the related instance

  createdAt?: ISO8601

  notes?: string
  sourceRefs?: SourceReference[]
  meta?: Record<string, unknown>
}
```

Relations span tiers. A Note may be the target of `derived-from` Relations from the Records it graduated into.

**Canonical relation types** (use these exact strings for cross-system interoperability):

`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`

Custom types not covered by these should use `namespace/name` format (e.g. `com.acme.hr/transferred-to`) to prevent collision. Extended relation type metadata is defined in `ext:recommended-relations`.

**Relations do not change lifecycle state.** A `supersedes` Relation does not mutate the prior Record's `lifecycleState`. Lifecycle state changes are explicit acts by an implementation's transition mechanism.

---

**Intro**: **Directionality convention:**
`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target."

**Outro**: This convention must be consistent across implementations. See Invariant 16.

| Relation | source | target |
| --- | --- | --- |
| `supersedes` | the newer Record | the older Record |
| `contains` | the stage | the task inside it |
| `depends-on` | the dependent task | the task it needs |
| `refines` | the detailed version | the rough version |
| `derived-from` | the successor | the source Note or Record |
| `evidences` | the source material | the claim it supports |
| `precedes` | the earlier item | the later item |


**Intro**: **Canonical relation types** (use exact strings):

**Outro**: Implementations must store only the canonical (forward) form and derive the inverse when needed.

| Canonical | Converse | Category |
| --- | --- | --- |
| `contains` | `part-of` | Composition |
| `depends-on` | `required-by` | Dependency |
| `supersedes` | `superseded-by` | Governance |
| `refines` | `refined-by` | Refinement |
| `derived-from` | `source-of` | Derivation |
| `evidences` | `evidenced-by` | Evidence |
| `precedes` | `follows` | Sequence |



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

`Container.containerId` is not an instance ID and must not appear in `Relation.sourceInstanceId` or `targetInstanceId`. See Invariant 20.

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
| Field values | field-bound | `Vocabulary` via `vocabularyRef` or inline `allowedValues` | `closed` (V3) |

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

**V3 — Field binding exclusivity and closedness.** A `select`/`multiselect` Field must declare exactly one of `allowedValues` or `vocabularyRef`. A `vocabularyRef` on a `select`/`multiselect` Field MUST resolve to a `Vocabulary` with `mode: closed`.

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

Every element that can be referred to has an Address. A transcript chunk and a document-space field are co-addressable because assertions about one referencing the other require both to be resolvable.

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

#### Context Query (behavioural requirement)

A conforming `ext:addressability` implementation must be able to assemble relevant material given an address and a purpose. This is a behavioural requirement, not a data shape.

**Required query patterns:**

| Pattern | Address | Returns |
|---|---|---|
| Field context | `{recordId}/{fieldId}` | Current value, chunks tagged to this Field, Field `aiGuidance` |
| Record context | `{recordId}` | All field values, chunks tagged to this Record, Relations, Protocol run history |
| Stage context | `{runId}/{stageId}` | All chunks produced during this stage, Fields active in this stage |

**Recommended assembly order for AI assistance:**

1. Type and Field `aiGuidance` — what this field captures, how to extract it
2. Current value — what has already been established
3. Chunks tagged to this Field via AttentionState — most focused context
4. Chunks tagged to the parent Record — broader session context
5. Related Records via Relations — structural context

---

**Note (2026-08-21, `rfc-decision-2a1e1590`)**: the per-field `Revision` snapshot mechanism (addressable field-value history, `revisionId`, revision chains, revision-trace queries) previously specified here is removed under the dormancy rule — zero corpus use, and it was incompletely specified (a PascalCase wire-format leak in its agent tag, and a coupling that named a pre-RFC-006 field). `Address`, `AttentionState`, and the Context Query requirement above are untouched by that removal. Return trigger: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface.


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
lifecycleRef?: UUID        // LINEAGE reference (rfc-decision-c8704763) — resolves to an
                            // installed Lifecycle in the effective package set (V8)
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
  order: integer        // min: 0; declared composition order of the stages — see note below
  purpose: string       // what understanding this stage builds
  question: string      // the core question this stage answers
  dependsOn: string[]   // stageId values; epistemic dependencies, not just ordering
  completionCriteria: string   // how to know this stage is sufficient to proceed
  contributesTo: FieldRef[]    // which Record Fields this stage feeds
  outputType?: UUID            // LINEAGE reference (rfc-decision-c8704763) to the Type this stage
                                // produces its own intermediate Record as; the effective
                                // package set resolves it. typeVersion is dropped — version-
                                // optional hybrids are forbidden.
  aiGuidance: AiGuidance
}
```

**`order` vs `dependsOn`:** `order` is the declared composition order of the stages — structure, not presentation (RFC-015's layering table now states this explicitly as its own row: composition order is structure; display order is presentation; sequence is assertion). It provides the render default for how stages are shown in a UI or facilitation guide; a View may override for display. Execution sequence is determined by `dependsOn` resolution: a stage runs when all its declared dependencies are satisfied, regardless of its `order` value. Authors must ensure `order` is consistent with the partial order implied by `dependsOn` (i.e. a stage's `order` value should be greater than the `order` of any stage it depends on). See Invariant 31.

#### `Protocol`

An epistemically ordered process for building quality Records through structured conversation or facilitation.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string

  protocolTargetType: UUID | ""
  // The Record type this Protocol produces — a LINEAGE reference (bare UUID;
  // rfc-decision-c8704763), never the canonical namespace/name@version form (that is
  // DISPLAY-only and is never stored). Empty string for loose / exploratory Protocols
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

A Field hidden with `visible: false` remains in the Record and may appear in other Views. `visible` controls rendered text output only. A field with `visible: false` must still be included in any structured projection or export of this view. To exclude a field from both rendered output and structured projections, omit it from `fieldViews[]` entirely.

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

  exportConfig?: ExportConfig

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

**Note (2026-08-22, `rfc-decision-4f1e12e5` entry 5)**: the View-root `protection` enum (`none`/`read-only`/`fill-in`) previously specified here is removed under the dormancy rule (`rfc-decision-cce3c00e`) — zero use, and it was a hint without a contract: no enforcement semantics were defined anywhere. `FieldView.required` below is untouched — it is attested in production use and is a distinct form-vs-validity mechanism. Return trigger: a real authoring surface needing edit protection, which must design the missing enforcement half.

Compatibility is field-centric:
- A Record is renderable through a View when it contains all `FieldView` entries with `required: true`.
- Fields with `visible: true` but not required are rendered when present and omitted when absent.
- Omitted Fields in `fieldViews[]` are treated as `visible: false`.

A View may not reference unknown Fields: every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set.

`View.protection` applies only to interactions through that View. A Record may be editable through one View and read-only through another. For record-level settlement, use `ext:lifecycle` states such as `isFinal`.

Facilitation steps have been removed from View. Use `ext:protocol` Protocol stages instead.

---

#### Composite rendering — renderer dispatch (RFC-036)

`FieldView` gains an optional `compositeRenderer`, a `CompositeRendererBinding` that dispatches a
composite-range Field (`fieldType.datatype: "ref"`, `mode: "inline"`) to a named composite renderer.
Presentation lives in the View, not in the Type: RFC-032 evicted `compositeRenderer` from the type model,
and RFC-015 established that an arrangement over records with many legitimate concurrent forms is
view-owned.

```typescript
CompositeRendererBinding {
  renderer: string
  // Bare lower-kebab identifiers are SRS-reserved and introduced only by a ratified RFC:
  //   "table"     — the SRS-defined composite renderer
  //   "baseline"  — sentinel meaning explicitly no renderer; cancels a broader declaration site
  // Vendor identifiers use "{reverse-domain}/{name}" with at least two reverse-domain labels.
  // Grammar: ^([a-z][a-z0-9-]*|[a-z0-9-]+(\.[a-z0-9-]+)+/[^/]+)$ — enforced at render and
  // validation time, not by JSON Schema, so a malformed value degrades per [CR-036-7].

  roles?: { [roleName: string]: UUID }
  // Explicit, UUID-anchored role -> Field.id binding, overriding the by-name defaults.
}
```

### Composite baseline rendering

A composite-range Field that resolves to no renderer — unbound per [CR-036-6], or fallen back per
[CR-036-7] or [CR-036-9] — is rendered by the **composite baseline**: a heading when a label resolves
(`FieldAssignment.displayLabel`, overridable by `FieldView.displayLabel`) at level `4 + d` shifted by
`DocumentView.depthOffset`, where `d` is nesting depth; then one block per value in value order; within
each block one field row per assignment on the composite's `rangeType`, ascending by
`FieldAssignment.order` with `fieldId` code-point order as tie-break. A field with no value, or whose
value renders to nothing, is omitted unconditionally. An assignment that is itself `ref`/`inline` expands
into a nested baseline block at depth `d + 1` rather than a field row. Field-row labels resolve by
`FieldAssignment.displayLabel` -> `Field.name` -> `fieldId`; templates resolve by
`ElementTemplates.compositeFieldRowTemplates[Field.name]` -> `ElementTemplates.fieldRow` -> the
implementation's existing top-level field-row form.

### The `table` renderer

Roles, with their owning Type and required `fieldType`:

| Role | Owner | Required | `fieldType` |
|---|---|---|---|
| `rows` | table Type | yes | `{ datatype: "ref", mode: "inline", cardinality: "list", rangeType: <row Type> }` |
| `cells` | row Type | yes | `{ datatype: "string", cardinality: "list" }` |
| `columns` | table Type | no | `{ datatype: "string", cardinality: "list" }` |
| `widths` | table Type | no | `{ datatype: "number", cardinality: "list", constraints: { minimum: 0, maximum: 1 } }` |
| `subheading` | table Type | no | `{ datatype: "string", cardinality: "single" }` |
| `label` | table Type | no | `{ datatype: "string", cardinality: "single" }` |

The composite field's own `cardinality` governs how many tables it carries: `single` is one, `list` is a
sequence. This replaces the `FieldGroup` + `compositeRenderer` mechanism of RFC-007, which is retired with
`FieldGroup` at the #242 cutover.

#### Conformance Rules (RFC-036)

**[CR-036-1]** A `renderer` identifier MUST match `^([a-z][a-z0-9-]*|[a-z0-9-]+(\.[a-z0-9-]+)+/[^/]+)$`. An identifier that does not match MUST be treated as unrecognised, and [CR-036-7] applies. Enforced at render and validation time, not by JSON Schema, so a malformed identifier degrades gracefully rather than failing the load of an entire View or Theme.

**[CR-036-2]** *(Governance.)* Bare `renderer` identifiers are reserved for SRS-defined renderers and MUST only be introduced by a ratified RFC. Those defined to date are `table` and the sentinel `baseline`. Vendor renderers MUST use the `{reverse-domain}/{name}` form.

**[CR-036-3]** A binding or directive MUST reference a Field whose `fieldType.datatype` is `"ref"` and whose `fieldType.mode` is `"inline"`. Otherwise, or when the `fieldId` does not resolve in the effective package set, implementations MUST ignore the binding, MUST render the field by whatever rendering its `fieldType` normally receives, and MUST emit a diagnostic.

**[CR-036-4]** Composite rendering applies to Tier 2 Records only. A binding whose `fieldId` does not appear on the rendered instance's resolved Type MUST be ignored without a diagnostic — the normal case for a heterogeneous section.

**[CR-036-5]** A binding MUST target a composite field assigned directly to the rendered Record's Type. Binding a composite nested inside another composite's `rangeType` is out of scope; a nested composite is rendered by the composite baseline. Implementations MUST NOT infer a binding for a nested composite from a binding on its parent.

**[CR-036-6]** For a given rendered Record and composite-range field, implementations MUST resolve at most one binding, taking the first that applies: (1) `FieldView.compositeRenderer` on the `FieldView` for that field in the `ext:views-l1` View selected to render the Record — chosen by `DocumentSection.typeDispatch`, else `DocumentSection.renderViewId`; (2) the matching `DocumentSection.compositeRenderers` entry; (3) the matching `DocumentView.compositeRenderers` entry. When none applies the field is unbound. A resolved `renderer` of `"baseline"` means unbound and MUST NOT fall through to a broader site. A `FieldView` that exists but carries no `compositeRenderer` is not an override and MUST fall through. A field not visible in the selected View is not rendered and no binding applies. When an L1 View is rendered outside any DocumentView, only site (1) exists. Duplicate `fieldId` entries within one array are a validation diagnostic; the first in array order wins.

**[CR-036-7]** When a resolved `renderer` is not recognised, the implementation MUST fall back to the composite baseline and MUST emit a diagnostic identifying the unrecognised value and the field. The fallback MUST NOT suppress the field's content.

**[CR-036-8]** Role resolution proceeds per role: when `roles` declares that role, its value is the bound Field and MUST resolve to an assignment on the owning Type; otherwise the role binds to the assigned Field whose `Field.name` equals the role name, compared exactly and independently of namespace. Assignments inherited via `ext:type-inheritance` are in scope. On ambiguity, implementations MUST bind the lowest `FieldAssignment.order`, with `fieldId` code-point order as tie-break, and MUST emit a diagnostic. A `roles` entry naming an undefined role MUST be silently ignored.

**[CR-036-9]** A role Field satisfies the renderer's contract when its `fieldType` declares every key the contract specifies, matching the specified value where the contract gives a literal one. `rangeType` is presence-matched — it MUST be present and MUST resolve, and its resolved Type is what dependent roles are looked up on. A `constraints` key required by a contract is advisory and its absence MUST NOT fail the contract test. Additional `fieldType` keys, and assigned Fields filling no role, MUST be ignored. When a required role does not resolve or does not satisfy the contract, implementations MUST fall back to the composite baseline with a diagnostic; when an optional role does not satisfy it, implementations MUST drop that role only, with a diagnostic.

**[CR-036-21]** `FieldView.editorHintOverride`, when present, MUST take a value from the same set as `Field.editorHint` (`singleline`, `textarea`, `rich-text`, `date-picker`, `dropdown`, `multi-select`, `voice`) and supersedes it for Records rendered or edited through that View. A value outside that set MUST be ignored with a diagnostic and `Field.editorHint` MUST apply. Enforced at validation and render time rather than by JSON Schema.

**[CR-036-22]** Every diagnostic required or recommended by a `[CR-036-n]` rule MUST carry that rule's identifier and MUST identify the instance, field, and where applicable the value or row index. [CR-036-13]'s constraint bound raises validation-pass diagnostics of severity `error`; every other `[CR-036-n]` diagnostic is a render-pass `warning`, except [CR-036-6]'s duplicate-`fieldId` case, which is additionally reported at validation time. No `[CR-036-n]` diagnostic of either pass causes a non-zero exit code.



#### ext:views-l2

**Content**: **Depends on**: `ext:views-l1`

**Required for**: document projection — assembling multiple Records into a coherent document.

#### `SectionSource`

Defines how a section's instances are selected from a Container.

```typescript
type SectionSource =
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

**Note (2026-08-22, `rfc-decision-4f1e12e5` entry 4)**: the `fixed-instances` and `relation-query` `SectionSource` variants previously specified here are removed under the dormancy rule (`rfc-decision-cce3c00e`) — zero corpus use across the 13 real sections in the attested corpus (2026-08-21 usage attestation). `type-query` and `container-subset` remain the two live ways to source a section. Return trigger: a composition need neither live variant expresses.

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
  // Constraints (RFC-032 Rev-7 [N+1]):
  //   - The referenced field must be effective-single.
  //   - datatype string; valueDomain absent/open; format absent/plain/markdown.
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
    memberOrder?: UUID[]
    // RFC-015 Change B. View-owned explicit presentation sequence, container-subset
    // sections only. Lists member instanceIds in presentation order; members not
    // listed are appended in [N+12] order (precedes topological sort, createdAt
    // tiebreak). MUST NOT be combined with fieldId — a section carrying both is
    // invalid (Rule [N+29]).
  }

  required?: boolean
  emptyBehavior?: "hide" | "show-placeholder"

  relationsPresentation?: RelationsPresentation   // RFC-027
  // When present, render a deterministic per-member links block (the member's
  // Relations of the declared types) after each member this section renders — all
  // SectionSource variants, all member tiers. Independent of emptyBehavior.
  // See RelationsPresentation below. Rules [I-027-1]-[I-027-8] (RFC-027).

  compositeRenderers?: CompositeRendererDirective[]   // RFC-036
  // Composite renderer dispatch for records rendered by this section. The primary
  // ext:views-l2 declaration site, following RFC-027's placement of relationsPresentation.
  // Resolved after FieldView.compositeRenderer and before DocumentView.compositeRenderers
  // ([CR-036-6]). More than one entry for the same fieldId is a validation diagnostic; the
  // first in array order wins.
}
```

#### `CompositeRendererDirective` (RFC-036)

A `CompositeRendererBinding` (`ext:views-l1`) plus the composite-range Field it binds. Presentation only ([CR-036-20]).

```typescript
{
  fieldId: UUID
  // The composite-range Field this directive binds. MUST resolve to a Field whose
  // fieldType.datatype is "ref" and mode is "inline" ([CR-036-3]); a fieldId absent from
  // a rendered instance's Type is ignored without a diagnostic ([CR-036-4]).

  renderer: string
  // Composite renderer identifier, as `CompositeRendererBinding.renderer` (`ext:views-l1`).
  // "baseline" is the reserved sentinel meaning explicitly no renderer, used to cancel a
  // broader declaration site. Grammar enforced at render and validation time ([CR-036-1]).

  roles?: { [roleName: string]: UUID }
  // Explicit, UUID-anchored role -> Field.id binding, overriding the by-name defaults of
  // [CR-036-8].
}
```

#### `RelationsPresentation` (RFC-027)

Opt-in per-section display of each rendered member's Relations as a links block.

```typescript
{
  include: RelationPresentationEntry[]
  // min 1; display order. Duplicate relationType entries are a repository-validation
  // diagnostic; a renderer encountering them renders each independently.
  label?: string
  // Reserved for a future grouped/headed presentation. No rendering behaviour is
  // defined; implementations MUST ignore it when rendering.
}

// RelationPresentationEntry
{
  relationType: string
  // Bare canonical key (e.g. "supersedes") or namespace/name for custom types.
  // Expected to resolve to an installed RelationTypeDefinition (RFC-005); checked at
  // repository validation time. At render time a non-resolving, retired-only, or
  // conflict-ambiguous entry is skipped with a diagnostic; entries resolving to
  // active/deprecated/tombstone definitions display (rendering is a historical read).
  // None of these conditions may abort the render.
  directions?: "forward" | "inverse" | "both"   // default: "forward"
  // Display-only: inverse Relations are never stored or synthesised (Invariant 16).
  forwardLabel?: string
  // Override for edges where the member is the source. Default ladder: installed
  // definition label, then humanized relation type key.
  inverseLabel?: string
  // Override for edges where the member is the target. Default ladder: humanized
  // declared inverseType query label (RFC-005), then forward label + " (incoming)".
}
```

Rendering rules (normative statements [I-027-1]-[I-027-8] in RFC-027):

- **Edge selection.** Edges display only when their own `status` is absent or `"active"` — the filter never reads the related record's `lifecycleState`. A lifecycle-superseded record's active edges display normally.
- **Placement.** The block renders after the member's rendered content (fields and field groups for Tier 2; fields for Tier 1; body content for Tier 0) and before nested subsection members. When no edge survives selection, the block is omitted entirely for that member, regardless of `emptyBehavior`.
- **Rows.** One row per (entry, direction) with at least one edge: the resolved label followed by the related instances' display labels, comma-joined. Markdown normative form: `**<label>**: <display label>, <display label>`. In `html`, `adoc` and `text` the row uses the same label/value markup the implementation emits for a field row in that format — defined by *Normative Field-Row Form* below (RFC-037 [FR-037-15]), which supplies the referent this rule has always pointed at. A relation row omits `srs-fieldname-*` and carries `srs-relationtype-{relationTypeKey}` in its place [FR-037-12]. For any other format the relation row form remains implementation-defined. Related-instance display labels resolve by: the value of the instance's effective `identityFieldId` (RFC-020, declared or inherited per [N+34]) when it resolves to a non-empty string → the instance's value for the section's `titleFieldId` when a non-empty string → the `instanceId`. Tier 0/1 related instances always fall through to `instanceId`.
- **Determinism.** Rows follow `include[]` order, forward before inverse per entry; within a row, instances order by display label then `instanceId`, both in Unicode code point order; a related instance repeated within one (entry, direction) renders once.
- **JSON projection.** Members that project as `ProjectedRecord` carry `relations: ProjectedRelationRow[]` (`document-view-output.json`) preserving row order; members with no surviving edges omit the property. Tier 0/1 members are outside the JSON projection's `relations` property; their rendered-format blocks are unaffected.
- **Sliced repositories.** Cross-boundary Relations moved to `slice.externalRelationRefs[]` (RFC-026 R6) do not render.
- **Humanization** (for default labels): take the key's name segment (after the last `/` for namespaced keys), replace every `-` and `_` with a single space, uppercase the first character using Unicode default (locale-independent) case conversion. `superseded-by` → `Superseded by`.

Link labels prefer the identity field over the section's `titleFieldId` — the reverse of the [N+37] heading precedence — because a related instance need not be a member of the rendering section. Rows emit plain display labels, not hyperlinks; anchor emission awaits a spec-level record-anchor convention.

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

  compositeRenderers?: CompositeRendererDirective[]   // RFC-036
  // Document-wide default composite renderer dispatch, applied to any section that
  // declares no matching DocumentSection.compositeRenderers entry. Lowest-precedence
  // declaration site ([CR-036-6]); a section or FieldView cancels it with renderer: "baseline".

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

**Step 2 — Resolve values.** A field is present if its `Field.name` key is present in `fieldValues` with a value that is not the empty string; a `cardinality: list` value is present when at least one entry survives Step 2 (RFC-039 [R5]/[R5a], canonical I-132 — structural presence and rendering presence remain distinct).

**Step 3 — Labels.** Use `FieldAssignment.displayLabel`; fall back to `Field.name`.

**Step 4 — Render.** Render only present fields. A field that Step 2 resolves as absent — including one whose `FieldValue.value` is an empty string — MUST NOT emit a row, and neither MUST a field whose value sequence has no surviving entries. Implementations MUST NOT emit a label with an empty value. The sole exception is `DocumentSection.emptyBehavior` `"show-placeholder"` with the field `required: true`, which MUST emit a row whose value position carries the literal placeholder `(empty)`. Multi-entry values render as a block list, never comma-joined. The emitted form of a field row, and the separation between consecutive rows, is normative per output format — see *Normative Field-Row Form* below (RFC-037).

The baseline is a floor, not a ceiling. An L1 View via `renderViewId` always takes precedence.

`emptyBehavior` in the L1 View path: when `renderViewId` is set, empty field handling is governed by `ExportConfig.omitEmptyFields` on the referenced L1 View. `DocumentSection.emptyBehavior` does not apply in the L1 View rendering path.

---

#### Normative Field-Row Form (RFC-037)

The emitted form of a field row on the Default Rendering Baseline, and on RFC-036 Change C's
composite baseline where that baseline emits an individual field row. These forms are the content
`ElementTemplates.fieldRow` receives as `{{content}}`; a Theme may wrap the row and MUST NOT replace
it ([T-3]), and when no `fieldRow` template resolves the forms below are emitted unwrapped. They are
the terminal rung of RFC-036's row-template ladder (`compositeFieldRowTemplates` -> `fieldRow` ->
baseline field-row form), closing RFC-036 Open Question 2.

A composite is a Field whose `fieldType.datatype` is `"ref"` **and** whose `fieldType.mode` is
`"inline"` — the pair [CR-036-3] requires; `inline` is a `mode` value, not a datatype. A composite is
rendered by RFC-036 Change C, not by these rules; these rules govern the field rows *within* each
composite block. A `ref` Field whose `mode` is `"reference"` is **not** a composite and renders as an
ordinary field row under these rules, as [CR-036-3] directs for any Field that is not a `ref`+`inline`
composite.

**Value sequence.** A field renders as multi-entry when Step 2 finds it present through an ordered
sequence. Both mechanisms are covered without preference: `fieldType.cardinality: "list"` (RFC-032
[R4], values carried as a JSON array at the field's key) — the legacy `ext:repeatable-fields` path is removed (RFC-039 [R7]).
(`FieldValue.entries`). *Sequence order* means array index order on the former, `entries` order on
the latter. Cardinality — not element count — selects the form: a one-element sequence renders in
block form, so a Type's rendered shape does not vary with instance data.

**Scalar rows.** For a present single-valued field, exactly one row, beginning on its own line:

| Format | Normative row form |
|---|---|
| `markdown` | `**<label>**: <value>` |
| `adoc` | `*<label>*: <value>` |
| `text` | `<label>: <value>` |
| `html` | `<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>: <span class="srs-field-value field-value">{value}</span></div>` |

In the three text formats the separator is a literal colon and single space (U+003A U+0020). In
`html`, the element names, nesting, order, literal colon and `srs-`-prefixed class names are
normative; inter-element whitespace is not, following the precedent [CR-036-15] sets for pinned HTML
output. Implementations SHOULD emit the single-line form so conformance fixtures have a canonical
serialisation. **These classes belong to the baseline's output specification, not to
`ext:themes-l1`:** implementations MUST emit them whether or not that extension is declared and
whether or not a Theme resolves.

**Multi-entry rows.** A multi-entry value MUST render as a block list and MUST NOT be comma-joined.
The label occupies its own line (in `html`, its own element) and retains its trailing colon:

| Format | Label line | Entry marker |
|---|---|---|
| `markdown` | `**<label>**:` | `- ` |
| `adoc` | `*<label>*:` | `* ` |
| `text` | `<label>:` | `- ` |
| `html` | the `strong` element, inside the same `div` the scalar row uses | one `<li class="srs-field-value field-value">` per entry inside an unclassed `<ul>` |

The full `html` multi-entry row is:

```html
<div class="srs-field srs-fieldname-{name}"><strong class="srs-field-label field-label">{label}</strong>:<ul><li class="srs-field-value field-value">{entry}</li></ul></div>
```

The enclosing `div` is the same one the scalar row uses: a multi-entry row is still a field row and
must carry what [T-8] requires of one.

In the text formats the list begins on the line immediately after the label line with no blank line
between. An entry whose rendered value is empty is omitted from the list; a sequence with no
surviving entries is absent and emits no row.

**Row separation.** In `markdown`, `adoc` and `text`, implementations MUST emit a blank line between
consecutive field rows, and MUST emit a blank line after a block list's final entry before any
following row, heading or relations block. In `html` implementations MUST NOT insert a separator
element between rows. The same separation applies between consecutive relation rows in a links block.
This is structural, not cosmetic: without the blank line a following row is a CommonMark lazy
continuation of the list's last item and is swallowed into it.

**Continuation.** When a surviving entry's value spans several lines, every line after the first is
indented two spaces in `markdown` and `text` — the width of the `- ` marker, and never more, since four
spaces would make the continuation an indented code block. An entry whose value contains a blank line
remains a single list item, its subsequent blocks attached at that same content column; no blank line
terminates the item. In `adoc`, indentation does not attach a block to a list item: implementations
MUST emit a `+` continuation line before each subsequent block, and indentation is not normative there. Continuation applies to entries only — a single-valued field's
value is emitted verbatim, and any further lines sit at column zero, unindented and unaltered.

**Empty and placeholder.** A field Step 2 resolves as absent emits no row. When
`DocumentSection.emptyBehavior` is `"show-placeholder"` and the field is `required: true`,
implementations MUST emit a row carrying the literal `(empty)` — this supersedes Step 4's former
MAY. The placeholder row takes scalar form regardless of cardinality. In `html` the value element
additionally carries `srs-empty-value`. The rule does not reach the L1 View path, where
`ExportConfig.omitEmptyFields` governs.

**Class identity.** `{name}` in `srs-fieldname-{name}` is `Field.name` normalised by the five-step
rule ([T-8]), never `FieldAssignment.displayLabel` — a rendering-only label must not move a stylesheet
hook. The class vocabulary and the five-step rule are normative for baseline output independently of
whether `ext:themes-l1` is declared, so a non-declaring implementation is not required to read that
extension in order to comply. A relation row has no `Field.name`: it omits `srs-fieldname-*` and
carries `srs-relationtype-{relationTypeKey}` instead. The five-step rule has no replacement for `/`, so
step 3 deletes it and `core/depends-on` normalises to `coredepends-on` — deterministic, and noted so no
implementer treats it as a bug to fix unilaterally.

**Content.** In `markdown`, `adoc` and `text` the rendered label and value are emitted verbatim and
MUST NOT be escaped or altered, except for the continuation above — field values in this model
routinely are markup. In `html`, label and value content MUST be escaped (`&`, `<`, `>`, `"`, `'`).
The baseline performs no markup conversion, so a markdown-bearing value appears in `html` as literal
source; converted output is a Theme or L1 View concern.

**Labels.** Resolution stays exactly Step 3: `FieldAssignment.displayLabel`, falling back to raw
`Field.name`, with no humanisation or case conversion. For a Tier 1 `TypedRecord` the row label is
`TypedField.label` falling back to `TypedField.name`, while the identity class always derives from
`TypedField.name` — the same label/identity split that applies at Tier 2. A `TypedField` whose `value`
is an array is multi-entry and renders in block form in array index order; any other value is
single-valued. The placeholder rule does not apply at Tier 1 (there is no `required: true` to consult).
Tier 0 Notes emit no field rows.

**Conformance boundary.** These forms bind any implementation emitting a `DocumentView` in
`markdown`, `adoc`, `text` or `html` through this baseline. They do not bind native application UI
that is not emitting a `DocumentView`; a client-side `DocumentView` renderer in a covered format is
not exempt.

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
| Field label | Bold/formatted text — not a heading; exact per-format form per *Normative Field-Row Form* (RFC-037) | Always |

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


#### ext:cross-field-validation

**Content**: > **Formalised by**: RFC-019 (srs#139). The `CrossFieldRule` shape and `validationRules` property are formally specified by RFC-019; refer to it for normative conformance rules (R0–R11).

**Required for**: Types with constraints that span multiple Fields.

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
  // Applies only to fields with datatype "date", "date-time", "number", or "integer".
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
  definitionType: "field" | "type" | "view" | "blueprint" | "protocol" | "relation-type"
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
  relationTypes: ImportRecord[]
}
```

---

#### Repository-Level Provenance (RFC-014)

When a repository is initialised from a published SRS Package, it records provenance in `manifest.json` at `manifest.upstreamPackage`. This is a normative top-level field — the machine-readable anchor for divergence detection and non-destructive package upgrades.

#### `UpstreamPackage`

Shape recorded at install time and updated on upgrade:

```typescript
{
  packageId:   UUID      // Stable UUID of the upstream Package. Never changes across upgrades.
  namespace:   string    // Reverse-DNS namespace, e.g. "com.mudemocracy.governance"
  name:        string    // Package name, e.g. "governance"
  version:     string    // Semver of the upstream version at last install/upgrade
  installedAt: ISO8601   // Timestamp of the last install or upgrade event
}
```

#### Repository-Level Divergence Detection

When `upstreamPackage` is set, a conforming `ext:import-tracking` implementation MAY detect whether the locally installed definitions differ from the canonical content of the upstream package at that same version (RFC-014 Change E, R8). The comparison is performed against a reference copy (either a byte-for-byte snapshot stored at install time, or re-fetched from the published source if network access is available). A tool without a reference copy simply skips the check.

Divergence is surfaced using the same `conflictState` vocabulary already defined for `ImportRecord`:

| State | Description |
|---|---|
| `"clean"` | Local package content matches the reference copy at install time. No drift. |
| `"local-ahead"` | Local package has definitions not present in the upstream at install time; all differing ids are locally-added. |
| `"diverged"` | One or more local definition files differ from what the upstream declared under the same `id`+`version` key. |

When both `local-ahead` and `diverged` conditions hold simultaneously, implementations MUST report `diverged` as the primary status and include locally-added definitions as a supplementary list.

The `"upstream-ahead"` state (a newer version exists upstream) requires `ext:registry` and is out of scope for local divergence detection.


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

**Content**: **Status: Dormant** (removed under `rfc-decision-4f1e12e5`, 2026-08-22). The 2026-08-21 usage attestation found zero registries, zero events, and zero cross-repository relations anywhere in the corpus — the mechanism was speculative, never exercised in production. It is removed under the dormancy rule (`rfc-decision-cce3c00e`).

**Removed surface** (historical): `RepositoryRegistry`/`RepositoryRegistryEntry` and `FederationEvent`/`FederationEventsFile` (the `federation-registry.json`/`federation-events.json` schemas); the `sourceRepositoryId`/`targetRepositoryId` qualifier fields on `Relation`; `manifest.federationPath`/`federationEventsPath`.

**Return trigger** (verbatim from `rfc-decision-4f1e12e5`): COMMITTED, not evidence-gated - federation is core to SRS (owner, 2026-08-22); this removal is a deliberate reset of a design that predates real practice, not a judgment on the capability. The redesign returns as a planned roadmap phase, grounded in the sharing forms that actually emerged (bundles, slices, git-hosted repositories) and the axis 4-10 verification path; the owner schedules it. The travel mandate covers artifact-form portability meanwhile.

Cell: ♓ Portability.


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
  .srs/                          ← required marker directory
  manifest.json                  ← required: root manifest and instance index
  source-documents/              ← raw source material with sidecar metadata
  notes/                         ← Tier 0 Note instances
  typed-records/                 ← Tier 1 TypedRecord instances
  records/                       ← Tier 2 Record instances
  relations/                     ← Relation records
  package/                       ← local Package, field, type, and view definitions
```

The `.srs` marker is a directory that identifies the repository root. It `SHOULD` contain at least one regular file — by convention `.srs/README.md`, an *About SRS* orientation document — so it survives storage and archive round-trips that do not preserve empty directories; its contents are implementation-private and carry no normative weight. A reader must locate the marker before treating a directory as a repository.

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
  mode: "local" | "remote"  // renamed from "external" (rfc-decision-c8704763)

  // local: definitions live in the repository under package/
  path?: string           // relative path to package.json; default: "package/package.json"

  // remote: definitions are expected pre-installed in the consumer's registry
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

Remote package dependencies (`mode: "remote"`) are declared in `packageRef` and expected pre-installed at the consumer. They are not bundled in the archive.

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
| `manifest` | object | The `RepositoryManifest` object as defined by `ext:repository`. There is no `manifest.instanceIndex`; it is retired (RFC-038 [R2]). The `data` object's own contents are the authoritative instance set (RFC-038 [R1]), except the root container, which the manifest carries inline at `manifest.container`. |
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

There is no `instanceIndex` in `manifest`; it is retired (RFC-038 [R2]). The authoritative list of members is the `data` object's own contents — the tree-authoritative store, enumerated the same way as a filesystem repository (RFC-038 [R1]).

#### Conformance requirements

1. A conforming producer must write every instance in the repository's authoritative instance set (RFC-038 [R1]) as an entry in `data` under its path.
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


#### ext:themes-l1

**Content**: Visual presentation layer for `DocumentView`. Attaches brand identity, typography, stylesheets, cover pages, and element wrapping to a rendered document without altering its semantic structure. Depends on `ext:views-l2`. Implementations that do not declare this extension MUST ignore `DocumentView.themeRef` and `DocumentView.themeVariants` and MUST NOT error on their presence.

#### `AssetDeclaration`

A named asset (image, font, stylesheet, or data file) referenced in templates via `{{asset:name}}`.

```typescript
{
  type: "image" | "font" | "stylesheet" | "data"
  mode: "local" | "remote" | "inline"

  path?: string      // required when mode === "local"
  url?: string       // required when mode === "remote"
  data?: string      // base64 for binary; raw text for stylesheet/data; required when mode === "inline"
  mimeType?: string  // e.g. "image/png", "font/woff2", "text/css"
}
```

Assets are declared in `Theme.assets` as a named dictionary. Asset names MUST be unique within the Theme.

#### `PageTemplates`

Page-level chrome for paginated output formats (`"pdf"`, `"docx"`). Ignored for non-paginated formats.

```typescript
{
  coverPage?: string
  // Available variables: all DocumentView preamble variables + {{asset:*}}
  // {{heading-1}} is available here only (resolves via DocumentView.depthOffset).

  pageHeader?: string
  // Available: {{page-number}}, {{asset:*}}

  pageFooter?: string
  // Available: {{page-number}}, {{asset:*}}
}
```

#### `ElementTemplates`

Templates that wrap auto-rendered content at each structural level. Each template receives finished content as `{{content}}` and wraps it — it does not re-render or reorder content.

```typescript
{
  documentWrapper?: string
  // Wraps the entire rendered document body.
  // Available: {{content}}, {{container-title}}, {{date}}, {{asset:*}}

  sectionWrapper?: string
  // Wraps each section (heading + records).
  // Available: {{content}}, {{section-title}}, {{section-id}}, {{asset:*}}

  sectionWrapperOverrides?: Array<{
    sectionId: string   // matches DocumentSection.sectionId; case-sensitive
    template: string    // same variables as sectionWrapper
  }>
  // Per-section override. Takes precedence over sectionWrapper when sectionId matches.
  // sectionId values MUST be unique within the array (enforced at package validation time).

  recordWrapper?: string
  // Wraps each record (heading + field rows).
  // Available: {{content}}, {{record-heading}}, {{type-namespace}}, {{type-name}}, {{asset:*}}
  // {{record-heading}} is the titleFieldId value for this record, or empty string.

  recordWrapperOverrides?: Array<{
    typeId: UUID      // matches Record.typeId
    template: string  // same variables as recordWrapper
  }>
  // Per-type override. Takes precedence over recordWrapper when typeId matches.
  // typeId values MUST be unique within the array (enforced at package validation time).

  fieldRow?: string
  // Wraps each field label + value pair.
  // Available: {{field-label}}, {{field-value}}, {{field-name}}, {{content}}
  // When renderViewId is set, applies after ExportConfig.omitEmptyFields filtering
  // and ExportConfig.fieldOrder ordering. Does NOT wrap ExportConfig.preamble content.

  groupFieldRowTemplates?: { [fieldName: string]: string }
  // RFC-007 [T-Gx1]–[T-Gx3]: per-field-name templates for individual field rows in group entries.
  // Key: Field.name (e.g. "item-term"). Value: template supporting {{field-value}}, {{field-label}}.
  // When a key matches, that template MUST be used instead of fieldRow for that field row [T-Gx3].
  // Applied only when compositeRenderer is absent or unrecognised (per-field baseline) [T-Gx1].
  // Unknown field names in this map MUST be silently ignored [T-Gx2].

  compositeRendererConfig?: { [rendererName: string]: object }
  // RFC-007 [T-Cx1]–[T-Cx5]: per-renderer config, keyed by the same identifier space as
  // FieldGroup.compositeRenderer. Unknown properties in a known renderer sub-object MUST be
  // silently ignored [T-Cx5].
  //
  // The "table" renderer reads compositeRendererConfig["table"]:
  //   {
  //     tableClass?: string
  //     // CSS class on <table> (HTML only). Default: "srs-data-table" [T-Cx1].
  //     // Set to "" to suppress the class attribute [T-Cx2].
  //
  //     wrapperTemplate?: string
  //     // Wraps the full rendered entry. Tokens: {{subheading}}, {{label}}, {{table}}.
  //     // Absent optional field tokens ({{subheading}}, {{label}}) MUST resolve to "".
  //     // Default (HTML): <figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>
  //     // Default (other formats): no wrapper applied.
  //     // When explicitly set, applies regardless of output format [T-Cx4].
  //
  //     captionTemplate?: string
  //     // Template for the label field. Token: {{field-value}}.
  //     // Default (HTML): <figcaption>{{field-value}}</figcaption>
  //     // Default (markdown): *{{field-value}}*
  //     // Default (other formats): {{field-value}} with no decoration.
  //   }
  // Scoped to the Theme instance; applies to all composite renderer groups in the pass
  // that resolves this Theme. [T-Cx3] — applies ONLY to compositeRenderer: "table" groups.
}
```

Override precedence: a specific override always takes precedence over the corresponding universal template. When neither is set, the element is rendered without wrapping.

#### `StylesheetDeclaration`

```typescript
{
  mode: "inline" | "local" | "remote"
  content?: string   // inline CSS; required when mode === "inline"
  path?: string      // required when mode === "local"
  url?: string       // required when mode === "remote"
}
```

#### `TypographyHints`

Informative declarations. No normative rendering behaviour is derived from these values.

```typescript
{
  baseFont?: string
  headingFont?: string
  monoFont?: string
  baseFontSize?: string  // e.g. "16px", "1rem", "11pt"
  lineHeight?: string    // e.g. "1.5", "24px"
}
```

#### `Theme`

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string
  // What this theme is for; intended output format and audience.

  targets: string[]   // required; min 1 entry
  // Output formats this theme is designed for (e.g. "html", "markdown", "adoc").
  // Implementations apply this theme only when DocumentView.format appears in this list.
  // An empty targets array is a validation error (Rule [T-1b]).

  assets?: { [assetName: string]: AssetDeclaration }
  // Named asset declarations. Names MUST be unique within the Theme.

  cssClassFields?: UUID[]
  // fieldIds whose values are injected as CSS classes on record wrapper elements.
  // For each listed fieldId, if the record has an effective-single Field eligible
  // under [T-9], the class srs-field-{fieldName}-{normalisedValue} is added.
  // Only applies to "html" and "pdf" output. Other Fields are silently skipped.

  pageTemplates?: PageTemplates
  elementTemplates?: ElementTemplates
  stylesheet?: StylesheetDeclaration
  typography?: TypographyHints

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

`Package` gains `themes?: Theme[]` when `ext:themes-l1` is declared. When `ThemeReference.mode === "bundled"`, the referenced `themeId` MUST appear in `Package.themes[]` (Rule [T-5]). `Reference.definitionType` and `ImportRecord.definitionType` gain `"theme"` as a portable value.

---

#### CSS Class Injection

For `"html"` and `"pdf"` output, implementations MUST add semantic CSS classes to the rendered elements named in the table below. RFC-037 adds the field-row label and value elements, which are not wrappers.

**Class name normalisation** (5-step rule applied to all identifier components):
1. Convert to lowercase
2. Replace underscores, spaces, and dots with hyphens
3. Remove characters that are not alphanumeric or hyphens
4. Collapse consecutive hyphens to a single hyphen
5. Trim leading and trailing hyphens

| Element | Classes always applied | Classes conditionally applied |
|---|---|---|
| Document wrapper | `srs-document` | — |
| Section wrapper | `srs-section`, `srs-section-{sectionId}` | — |
| Record wrapper | `srs-record`, `srs-type-{typeNamespace}-{typeName}` | `srs-field-{fieldName}-{normalisedValue}` for each `cssClassFields` entry with a matching non-empty Field eligible under [T-9] |
| Field row | `srs-field`, `srs-fieldname-{fieldName}` where `{fieldName}` is `Field.name` | `srs-relationtype-{relationTypeKey}` in place of `srs-fieldname-*` on a relation row |
| Field row label | `srs-field-label` (+ compatibility alias `field-label`) | — |
| Field row value | `srs-field-value` (+ compatibility alias `field-value`) | `srs-empty-value` when the value is the `(empty)` placeholder |

---

#### Template Variable Reference

Variables not applicable to a given template context MUST resolve to an empty string.

| Variable | Available in | Resolves to |
|---|---|---|
| `{{container-title}}` | All | Container title from manifest |
| `{{container-id}}` | All | Container UUID |
| `{{date}}` | All | Render date (ISO 8601 date) |
| `{{heading-1}}` | `coverPage` only | Heading prefix at level `1 + depthOffset`. MUST resolve to empty string in all element wrapper templates. |
| `{{asset:name}}` | All | Resolved asset reference (URL, data URI, or path) |
| `{{section-title}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.title` |
| `{{section-id}}` | `sectionWrapper`, `sectionWrapperOverrides` | Value of `DocumentSection.sectionId` |
| `{{record-heading}}` | `recordWrapper`, `recordWrapperOverrides` | `titleFieldId` field value, or empty string |
| `{{type-namespace}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeNamespace` |
| `{{type-name}}` | `recordWrapper`, `recordWrapperOverrides` | `Record.typeName` |
| `{{field-label}}` | `fieldRow` | Display label for the field |
| `{{field-value}}` | `fieldRow` | Rendered value of the field |
| `{{field-name}}` | `fieldRow` | `Field.name` |
| `{{content}}` | All element templates | Auto-rendered content this template wraps |
| `{{page-number}}` | `pageHeader`, `pageFooter` | Current page number (paginated formats only) |

---

#### Conformance Rules

**[T-1]** Implementations that do not declare `ext:themes-l1` MUST ignore `DocumentView.themeRef` and MUST NOT error on its presence.

**[T-1b]** `Theme.targets` MUST contain at least one entry. An absent or empty `targets` array is a validation error. Enforced at package validation time.

**[T-2]** Implementations MUST apply a Theme only when `DocumentView.format` appears in `Theme.targets`. When the format does not match, the Theme MUST be ignored and structural output produced without it.

**[T-3]** Element templates receive auto-rendered content via `{{content}}`. Implementations MUST render structural content first and pass it to the template; they MUST NOT suppress or reorder content through template evaluation.

**[T-4]** Asset names within a single `Theme.assets` dictionary MUST be unique (case-sensitive).

**[T-5]** When `ThemeReference.mode === "bundled"`, the referenced `themeId` MUST appear in `Package.themes[]`. A missing theme in a bundled package is a validation error.

**[T-6]** Template variables not recognised by the implementation MUST be passed through as literal text. They MUST NOT cause a rendering error.

**[T-6b]** `{{heading-1}}`, `{{heading-2}}`, and `{{heading-3}}` MUST resolve to the empty string in all element wrapper templates (`documentWrapper`, `sectionWrapper`, `sectionWrapperOverrides`, `recordWrapper`, `recordWrapperOverrides`, `fieldRow`, `pageHeader`, `pageFooter`). Structural headings are delivered inside `{{content}}` and MUST NOT be re-emitted. `{{heading-1}}` is available only in `PageTemplates.coverPage`.

**[T-7]** When `recordWrapperOverrides` contains an entry whose `typeId` matches the current record's `typeId`, that template MUST be used instead of `recordWrapper`. When `sectionWrapperOverrides` contains an entry whose `sectionId` matches the current section's `sectionId`, that template MUST be used instead of `sectionWrapper`. Override arrays MUST NOT contain duplicate `typeId` or `sectionId` values. Enforced at package validation time.

**[T-8]** For `"html"` and `"pdf"` output, implementations MUST apply the CSS classes in the injection table to each rendered element named in that table. Class name components MUST be normalised using the five-step rule. The `{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from `FieldAssignment.displayLabel` (RFC-037 [FR-037-12]) — `{{field-name}}` in the template variable table already carries that meaning. The rule text now names elements rather than wrapper elements because the label and value rows added by RFC-037 are not wrappers.

**[T-9]** A Field listed in `Theme.cssClassFields` generates a CSS class only when it is effective-single (`fieldType.cardinality` absent/`"single"` and, until #242 Phase B, effective `FieldAssignment.repeatable !== true`), `fieldType.datatype == "string"`, and `fieldType.format` is absent or one of `"plain"` or `"markdown"`. `valueDomain` may be open or closed. URI-, UUID-, and email-formatted strings, list/repeatable Fields, and every non-string or composite datatype are silently skipped. Absent or empty fields generate no class. This preserves scalar legacy `string`, `text`, and `select`; the scalar requirement intentionally closes the previously undefined array-to-one-CSS-class case. (RFC-032 Rev-7 erratum.)

**[T-10]** When `DocumentSection.renderViewId` is set, `fieldRow` MUST be applied to each field row that survives `ExportConfig.omitEmptyFields` filtering and is ordered by `ExportConfig.fieldOrder`. `fieldRow` MUST NOT wrap `ExportConfig.preamble` content.

**[T-11]** Implementations that support `ext:themes-l1` MUST accept `"theme"` as a valid value for `Reference.definitionType` and (when `ext:import-tracking` is also declared) for `ImportRecord.definitionType`. A `definitionType: "theme"` value MUST NOT cause a validation error.

**[T-Gx1]** When `FieldGroup.compositeRenderer` is set to a known value, implementations MUST NOT apply `groupFieldRowTemplates` to that group's entries. `groupFieldRowTemplates` MUST only be applied when the group is rendered by the per-field baseline (i.e. `compositeRenderer` is absent or falls back via `[FG-Cx1]`).

**[T-Gx2]** Field names in `groupFieldRowTemplates` that do not appear in the rendered group MUST be silently ignored and MUST NOT cause an error.

**[T-Gx3]** When a field row in a group entry is covered by a matching key in `groupFieldRowTemplates`, implementations MUST use that template instead of `fieldRow`. The `fieldRow` template MUST NOT be applied to field rows rendered via `groupFieldRowTemplates`.

**[T-Cx1]** When `compositeRendererConfig["table"]` is absent or its `tableClass` property is absent, implementations MUST use `"srs-data-table"` as the default CSS class on the `<table>` element for HTML output.

**[T-Cx2]** When `tableClass` in `compositeRendererConfig["table"]` is explicitly set to an empty string `""`, implementations MUST emit the `<table>` element with no `class` attribute.

**[T-Cx3]** `wrapperTemplate` and `captionTemplate` in `compositeRendererConfig["table"]` apply to each entry rendered by `compositeRenderer: "table"`. They MUST NOT affect groups with other `compositeRenderer` values or groups without a `compositeRenderer`.

**[T-Cx4]** When evaluating format-conditional defaults for `wrapperTemplate` and `captionTemplate`, implementations MUST use `DocumentView.format` as the authoritative active format signal. When `wrapperTemplate` is explicitly set in `compositeRendererConfig["table"]`, implementations MUST apply it regardless of output format.

**[T-Cx5]** Unknown properties in a `compositeRendererConfig` sub-object for a known renderer name MUST be silently ignored and MUST NOT cause a rendering error.

## Composite rendering reconciliation (RFC-036)

`ElementTemplates` gains `compositeFieldRowTemplates?: { [fieldName: string]: string }` — the successor to
`groupFieldRowTemplates`, re-scoped from `FieldGroup` entries to composite-range values rendered by the
composite baseline. `groupFieldRowTemplates` is deprecated and retires with `FieldGroup` at the #242
cutover.

`compositeRendererConfig` is unchanged in shape and keying, and gains a schema for its `table` sub-object
(`tableClass`, `wrapperTemplate`, `captionTemplate`), with `additionalProperties: true` retained at both
levels so vendor renderer keys and unknown sub-properties stay valid.

**[CR-036-16]** `compositeRendererConfig` is keyed by the same identifier space as a composite renderer identifier [CR-036-1]. Unknown properties within a known renderer's sub-object, and keys naming renderers the implementation does not know, MUST be silently ignored and MUST NOT cause a rendering or loading error. Config applies only to fields resolved to the corresponding renderer. `DocumentView.format` is the authoritative format signal for format-conditional defaults, and an explicitly set template applies regardless of output format. `{{subheading}}` resolves to the rendered subheading and `{{label}}` to the output of `captionTemplate`, both computed before wrapper substitution. `"baseline"` is a dispatch sentinel, not a renderer; a `compositeRendererConfig` key of `"baseline"` MUST be ignored. The `table` renderer reads:

| Property | Effect | Default |
|---|---|---|
| `tableClass` | CSS class on `<table>` (HTML only) | `"srs-data-table"`; an explicit `""` suppresses the attribute |
| `wrapperTemplate` | Wraps one rendered table value; tokens `{{subheading}}`, `{{label}}`, `{{table}}`, absent optional values resolving to `""` | HTML: `<figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>`. Other formats: no wrapper |
| `captionTemplate` | Renders the `label` role; token `{{field-value}}` | HTML: `<figcaption>{{field-value}}</figcaption>`. Markdown: `*{{field-value}}*`. Other formats: undecorated |

The `subheading` role renders as a heading at the same level as the composite's own heading. **These
defaults are the renderer's output specification, not configuration defaults: implementations MUST apply
them whether or not `ext:themes-l1` is declared and whether or not a Theme resolves.** This matters
because [CR-036-19] retires the `[T-Cx*]` rules that currently house half of them, and because RFC-002
`[T-2]` requires structural output when a Theme is ignored on format mismatch.

**[CR-036-17]** `compositeFieldRowTemplates` is keyed by `Field.name` and supplies the template for an individual field row within a composite rendered by the baseline, in place of `fieldRow`. Keys matching no rendered field MUST be silently ignored. Implementations MUST NOT apply it to a composite that resolved to a renderer under [CR-036-6]; a composite that falls back to the baseline under [CR-036-7] or [CR-036-9] is baseline-rendered and MUST have it applied.

**[CR-036-18]** `groupFieldRowTemplates` is deprecated by `compositeFieldRowTemplates` and retires with `FieldGroup` at the #242 cutover. While both exist, implementations MUST apply `groupFieldRowTemplates` to `FieldGroup` entries and `compositeFieldRowTemplates` to composite entries. Migrating a `FieldGroup` to a composite therefore silently disables any `groupFieldRowTemplates` key naming one of its fields: a migration that converts a group MUST carry every such key over to `compositeFieldRowTemplates`, and implementations SHOULD emit a diagnostic when a `groupFieldRowTemplates` key matches no `FieldGroup` field in the effective package set.

**[CR-036-19]** RFC-007's `[FG-Cx0]`–`[FG-Cx4]`, `[T-Gx1]`–`[T-Gx3]` and `[T-Cx1]`–`[T-Cx5]` remain in force for `FieldGroup` until `FieldGroup` is removed at the #242 cutover, at which point they are retired. A `FieldGroup` MUST NOT be the target of a composite renderer binding, and a composite-range field MUST NOT be dispatched by `FieldGroup.compositeRenderer`; the two mechanisms MUST NOT interact.

## Normative field-row rendering (RFC-037)

`ElementTemplates.fieldRow` is a wrapper: it receives finished content as `{{content}}` and does not
re-render it ([T-3]). RFC-037 defines what that finished content is, so theme-less output — "the
element is rendered without wrapping" — is defined rather than implementation-chosen. The per-format
forms are normative in `ext:views-l2`, *Normative Field-Row Form*.

The class injection table above gains the label and value elements. Both carry an `srs-`-prefixed
name and an unprefixed compatibility alias; only the prefixed names form the forward contract.

Two naming notes. The aliases `field-label` / `field-value` are spelled identically to the
`{{field-label}}` / `{{field-value}}` template variables above; they are CSS class names, not
template tokens, and the namespaces do not interact. And `srs-field-label` sits alongside the
pre-existing generated family `srs-field-{fieldName}-{normalisedValue}` applied to record wrappers
for `cssClassFields` entries — a Field named `label` with value `active` yields
`srs-field-label-active`. The two families are distinguished by exact match, never by prefix.

**[FR-037-12]** On a field row the identity class is `srs-fieldname-{fieldName}`, whose
`{fieldName}` component MUST be derived from `Field.name` and MUST NOT be derived from
`FieldAssignment.displayLabel`. On a relation row implementations MUST omit `srs-fieldname-*` and
MUST emit `srs-relationtype-{relationTypeKey}` instead. Both are normalised by the five-step rule.

**[FR-037-13]** Implementations MUST emit the field-row class vocabulary in baseline `html` output
whether or not `ext:themes-l1` is declared and whether or not a Theme resolves. This broadens
[T-8]'s scope, which is otherwise conditional on the extension, and matches the precedent
[CR-036-16] sets for renderer output defaults.

**[FR-037-14]** For `"html"` and `"pdf"` output, implementations MUST emit both the `srs-`-prefixed
class names and their unprefixed aliases (`field-label`, `field-value`) until the #242 cutover, and
MUST emit only the prefixed names thereafter. The aliases are deprecated on acceptance of RFC-037
and retire at the same cutover that [CR-036-19] retires `FieldGroup` and the `[T-Gx*]`/`[T-Cx*]`
rules, so the deprecation ends on a clock the project already keeps. A stylesheet claiming
conformance MUST NOT depend on the unprefixed aliases. No `pdf` row form is yet defined, so for
`pdf` this rule names the classes without naming the elements that carry them (RFC-037 Open
Question 3).

**[FR-037-19]** The row forms defined in `ext:views-l2` are the content `fieldRow` receives as
`{{content}}`. A Theme MAY wrap the row and MUST NOT replace it, per [T-3]. When no `fieldRow`
template resolves, implementations MUST emit those forms unwrapped. This is the terminal rung of the
RFC-036 row-template ladder.



#### ext:changelog

**Content**: **Status: Dormant** (removed under `rfc-decision-2a1e1590`, 2026-08-21). The 2026-08-21 usage attestation found zero `changelog/changelog.json` files anywhere in the corpus — the mechanism was speculative, never exercised in production. It is removed under the dormancy rule (`rfc-decision-cce3c00e`) alongside the per-field Revision sidecar mechanism it paired with, removed by the same ruling.

**Removed surface** (historical — introduced by RFC-018, srs#141): the `ChangelogCollection`/`ChangelogEntry` schema (`changelog.json`); the `srs changelog list` CLI command. `manifest.changelogPath` is deprecated, not deleted, so existing declarations remain readable.

**Return trigger**: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface. When a real consumer's requirements are known, the mechanism is redesigned against them rather than reinstated as specified here.


#### ext:slices

**Content**: **Required for**: implementations that export a subset of a repository as a standalone, independently openable `.srs` archive (a *slice*).

A container slice carries the records reachable from a container's membership, their type and field definitions, intra-slice relations, and referenced source documents. It is a valid `.srs` archive in the RFC-017 format — any SRS tool can open, validate, and render it.

#### Scope

`ext:slices` defines **container-membership closure only**. A *package export* — distributing a package's Type/Field definitions as a `package-bundle.json` — is a different artifact class (RFC-003) and is not a slice. Record-level closure (an arbitrary set of records) is deferred to a future RFC.

#### Manifest extensions (`ext:slices`)

When `ext:slices` is declared in a slice archive's `manifest.declaredExtensions`, `RepositoryManifest` gains one optional property:

```json
"slice": {
  "origin": { "repositoryId": "<source-uuid>" },
  "spec": { "type": "container", "id": "<containerId-uuid>" },
  "exportedAt": "<ISO-8601>",
  "externalRelationRefs": [
    {
      "relationId": "<uuid>",
      "sourceInstanceId": "<uuid>",
      "targetInstanceId": "<uuid>",
      "relationType": "depends-on"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `origin.repositoryId` | `string (uuid)` | yes | `repositoryId` of the source repository this slice was exported from. |
| `spec.type` | `string` | yes | Closure rule. Currently only `"container"` is defined. |
| `spec.id` | `string (uuid)` | yes | The `containerId` that scoped the slice — present in the source `containerIndex`. |
| `exportedAt` | `string (date-time)` | yes | ISO-8601 timestamp of when the slice was produced. |
| `externalRelationRefs` | `array` | no | Relations cut at export because exactly one endpoint fell outside the closure. Provenance only — not a validation error. |

The slice archive's `manifest.repositoryId` MUST be a **new UUID** distinct from `slice.origin.repositoryId`; the archive is a standalone artifact.

#### Container-membership closure

The closure root is the container identified by `spec.id`. The slice MUST include: (1) `manifest.container` set to the closure-root container; (2) all instances in the root container's `memberInstanceIds`/`rootInstanceIds`, recursively through sub-containers; (3) all type and field definitions referenced by included instances (directly or via Type FieldAssignments), copied into the slice's `package/` directory; (4) all relations with both endpoints inside the included set; (5) all `sourceDocumentIndex` entries and content files referenced by included instances; (6) any sub-container whose `memberInstanceIds` and `rootInstanceIds` are all within the included set.

#### Dangling-edge policy

Cross-boundary relations MUST NOT appear in the slice's relations collection. They MUST be recorded in `slice.externalRelationRefs[]` with `relationId`, `sourceInstanceId`, `targetInstanceId`, and `relationType`. A non-empty list is provenance data, not a validation error. The `relationType` value in `externalRelationRefs` entries is NOT subject to RFC-005 definition-lookup in the slice archive.

#### Validation relaxations

An RFC-026-aware validator MUST NOT treat the following as errors when a `slice` block is present: `externalRelationRefs` UUIDs absent from `instanceIndex`; absence of unreferenced type/field definitions; an incomplete `containerIndex`; tombstoned source document entries with absent content files. Dangling edges in the relations collection, unresolvable `typeId`/`fieldId` references, and instance schema validation errors remain errors regardless of slice status.

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

#### Searchable Field classification (RFC-032 Rev 7)

For Tier 2, a Field is searchable only when `fieldType.datatype == "string"` and `fieldType.format` is absent or one of `"plain"`, `"markdown"`, or `"uri"`. `valueDomain` and cardinality do not restrict searchability. `format: "uuid"`, `format: "email"`, and datatypes `number`, `integer`, `boolean`, `date`, `date-time`, `ref`, `dependent`, and `map` are non-searchable. Inline-composite recursion is not defined.

Tier-1 `TypedField.valueType` continues to use the legacy searchable set `{string, text, url, select, multiselect}` until the #242 Phase-B carrier cutover.

#### Text Projection algorithm

**Tier 2 (Record):** for each `fieldValue` in `fieldValues` array order — resolve the Field and apply the RFC-032 Rev-7 searchability predicate. If eligible and non-empty, emit one `TextSegment` for a single-cardinality value or one per array element for list cardinality, in order. After all field values, emit one segment per tag. Optionally emit `displayLabel` segments after tags.

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

**1.** `FieldAssignment.displayLabel` and `FieldAssignment.displayHint` are for rendering only. They must not affect AI guidance, extraction logic, `fieldType` interpretation, or validation. Extended by RFC-036 [CR-036-20]: they must also not affect a Record's Relations or its Discovery Text Projection (`ext:discovery`). Two repositories differing only in these values must produce identical validation results and identical Discovery output.

**2.** A `Type` must not redefine, override, or duplicate the semantic content of any `Field` it includes. If different semantics are needed for a Field in a specific Type context, a distinct `Field` with its own identity and lineage must be created.

**3.** A `Field`'s `aiGuidance` belongs to the Field. Type-level `aiGuidance` provides session framing only.

#### ext:lifecycle

**4.** `Type.lifecycle.initialState` must reference a `key` that appears in `lifecycle.states[]` and where `isInitial === true`.

**5.** Every `from` and `to` value in `lifecycle.transitions[]` must reference a `key` that appears in `lifecycle.states[]`.

**6.** `Record.lifecycleState`, when present, must reference a `key` in the associated `Type.lifecycle.states[]`.

**I-98.** A Record MUST NOT rest in a lifecycle state that declares `requiresRelation` unless at least one Relation satisfies the obligation: its type equals one of the declared `relationType`(s) and the Record is the relation's target when `direction` is `incoming` (or omitted) or its source when `direction` is `outgoing`. When the state declares `enforcement: "hard"` (the default), an implementation MUST reject a lifecycle transition into it unless the operation, on completion, satisfies this occupancy requirement — either because a satisfying Relation already exists, or because the operation's fulfillment establishes one. The rejection MUST be machine-readable, identifying the target state key, the required relation type(s), and the direction. When the state declares `enforcement: "advisory"`, the transition MUST be permitted regardless of the obligation and the unsatisfied state surfaced only as an at-rest warning, never a rejection. (RFC-022 R1–R3, R2a.)

**I-99.** A fulfillment supplied with a lifecycle transition MUST be applied as one all-or-nothing operation: `newRecord` creates a successor of the Record's Type in the effective lifecycle's initial state, asserts one Relation of the selected type oriented per `direction`, and transitions the Record; `existingInstanceId` asserts the Relation to the referenced instance (which MUST exist and MUST NOT be the Record itself) and transitions. If any step fails, no step's effect may remain observable. A file-backed implementation MAY realize this by write ordering in which the state change is committed last, provided every committed prefix is a valid repository under I-98. When the state declares an any-of `relationType` array, `fulfillment.relationType` MUST be one of the declared types, defaulting to the first; a `fulfillment` supplied for a target state that declares no `requiresRelation` MUST be rejected. (RFC-022 R4–R8.)

**I-100.** Allowed-transitions projections MUST include the target state's `requiresRelation` declaration on each transition option whose target state declares one, so clients route successor-flow presentation from structure rather than state-name matching. Repository validation MUST emit a warning-severity diagnostic for every Record at rest that violates I-98, and MUST NOT treat such a violation as a hard validation error. Transitions whose target state declares no `requiresRelation` MUST behave exactly as before RFC-022. (RFC-022 R8–R10.)

#### core — Package

**7.** Every `fieldId` referenced in any `FieldAssignment` within a `Package.types[]` must appear as the `id` of an entry in `Package.dependencyRefs`.

**8.** If `Package.mode === "bundled"`: every `Reference` in `dependencyRefs` must have a matching `Field` in `fields[]` (matched on `id` and `version`).

**9.** `Field.id` is stable across versions. A new `id` means a new definition, not a new version of an existing one.

#### ext:cross-field-validation

**10.** All `fieldId` values in any `CrossFieldRule` within `Type.validationRules[]` must appear in the Type's effective field list. Cross-field rules cannot reference Fields outside the Type.

**11.** A `conditional-required` rule must supply `predicateFieldId`, `predicateValue`, and `targetFieldId`. A `field-ordering` rule must supply `predicateFieldId`, `targetFieldId`, and `effect`. A `mutual-exclusion` rule must supply `fieldIds` with at least two entries.

**I-89.** An SRS implementation that does not declare support for `ext:cross-field-validation` MUST treat `validationRules` as an unrecognized property and MUST ignore it. Conformance rules R1–R11 bind only implementations that declare support for `ext:cross-field-validation`. (RFC-019 R0.)

**I-90.** A conforming implementation that declares support for `ext:cross-field-validation` MUST evaluate each `CrossFieldRule` in `validationRules` against every Record of the Type at record-write time (create and update). Evaluation order within the array is implementation-defined; all rules MUST be evaluated regardless of earlier failures (fail-all, not fail-first). (RFC-019 R2.)

**I-91.** A `CrossFieldRule` with `type: "conditional-required"` fires when the field identified by `predicateFieldId` is non-empty and its stored value is equal to `predicateValue` (case-sensitive string equality). When the rule fires, the field identified by `targetFieldId` MUST be non-empty in the Record. A violation MUST be reported as a validation error. (RFC-019 R3.)

**I-92.** A `CrossFieldRule` with `type: "field-ordering"` fires when both `predicateFieldId` and `targetFieldId` are non-empty. It applies only to fields whose `fieldType.datatype` is `"date"`, `"date-time"`, `"number"`, or `"integer"`. When `effect` is `"must-precede"`, the predicate field value MUST be strictly less than the target field value (ISO 8601 lexicographic order for dates; numeric order for numbers). When `effect` is `"must-follow"`, the predicate field value MUST be strictly greater than the target field value. A violation MUST be reported as a validation error. If either field is non-empty but the other is absent or empty, the rule MUST NOT fire. A `field-ordering` rule whose `predicateFieldId` or `targetFieldId` resolves to a field with any other `fieldType.datatype` MUST be reported as a Type-level validation error. (RFC-019 R4.)

**I-93.** A `CrossFieldRule` with `type: "mutual-exclusion"` MUST report a validation error if more than one field in `fieldIds` is non-empty in the Record. If zero or one field is non-empty, the rule passes. (RFC-019 R5.)

**I-94.** A `CrossFieldRule` with `type: "conditional-required"` MUST supply `predicateFieldId`, `predicateValue`, and `targetFieldId`. The field identified by `predicateFieldId` MUST be effective-single (`fieldType.cardinality` absent/`"single"` and, until #242 Phase B, effective `FieldAssignment.repeatable !== true`) and its `fieldType.datatype` MUST be one of `{"string", "date", "date-time"}`. String `format` and `valueDomain` do not restrict eligibility. A rule that omits a required property, selects a list/repeatable field, or resolves to any other datatype MUST be reported as a Type-level validation error. Admission of `date-time` is intentional; the scalar requirement intentionally closes the legacy repeatable-date equality hole. (RFC-019 R6; RFC-032 Rev-7 erratum; normative extension of I-11.)

**I-95.** A `CrossFieldRule` with a `type` value not in `["conditional-required", "field-ordering", "mutual-exclusion"]` MUST be reported as a Type-level validation error. Implementations MUST NOT silently ignore unknown rule types. (RFC-019 R9.)

**I-96.** A `CrossFieldRule` that contains a property belonging to a different rule type MUST be reported as a Type-level validation error. Specifically: a `conditional-required` or `field-ordering` rule MUST NOT supply `fieldIds`; a `mutual-exclusion` rule MUST NOT supply `predicateFieldId`, `predicateValue`, `targetFieldId`, or `effect`. (RFC-019 R10.)

**I-97.** `validationRules` are not inherited. A Type's `validationRules` array is the complete and exclusive set of cross-field rules evaluated for Records of that Type. When `ext:type-inheritance` is in use and Type B extends Type A, Type A's `validationRules` MUST NOT be evaluated for Records of Type B unless Type B's own `validationRules` explicitly restates them. (RFC-019 R11.)

#### ext:views-l1

**12.** Every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set. View compatibility is field-centric (based on required field presence), not Type-bound.

**13.** `FieldView.displayLabel`, `FieldView.displayHint`, and `FieldView.editorHintOverride` are for rendering only. They must not affect AI guidance, extraction logic, `fieldType` interpretation, or validation. Extended by RFC-036 [CR-036-20] to cover `FieldView.compositeRenderer` and the `DocumentSection`/`DocumentView` composite renderer directives, and to add Relations and Discovery Text Projection (`ext:discovery`) to the list of things they must not affect. [CR-036-21] additionally constrains `editorHintOverride` to the value set of `Field.editorHint`.

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

#### core — Record

**28.** `Record.typeId` and `Record.typeVersion` are the authoritative Type binding. `typeNamespace` and `typeName` are denormalised convenience fields. If they conflict with the resolved `Type`, the `typeId`/`typeVersion` identity takes precedence and the Record is considered invalid until corrected.

#### ext:protocol

**29.** Every `stageId` in `ProtocolStage.dependsOn[]` must reference a `stageId` declared in the enclosing `Protocol.stages[]`. A stage may not declare a dependency on itself.

**30.** Every `fieldId` in `ProtocolStage.contributesTo[]` must reference a `fieldId` that appears in the stage's own `outputType`'s effective field list (when `outputType` is declared), or in `Protocol.targetType`'s effective field list (when `outputType` is absent). A single stage must not contribute to both its own `outputType` and the enclosing `Protocol.targetType`. When neither `outputType` nor `Protocol.targetType` is declared, `contributesTo` must be empty.

**31.** For every pair of stages A and B within a `Protocol` where B.dependsOn includes A.stageId, B.order must be greater than A.order. `order` is the declared composition order of the stages — structure, not presentation; it provides the render default. Execution sequence is determined by `dependsOn` resolution. The two must not contradict each other.

#### ext:views-l2

**32.** Any `DocumentView` in `Package.documentViews[]` that contains a `SectionSource` with `type === "type-query"` must use `namespace/name` format for `semanticObjectType` (e.g. `"core/decision"`, not `"decision"`). Bare strings are acceptable only in single-system `DocumentView` records not included in a Package. Implementations receiving a `DocumentView` from a Package with a bare `semanticObjectType` in a `type-query` section should treat the portability of that section as undefined.

**I-63.** When DocumentView.rootTypeRefs is present and non-empty, each ExactTypeRef entry MUST resolve to a Type that exists in the Package (the union of all packages in scope per packageRef/packageRefs; matched by both typeId and typeVersion). An entry that does not resolve MUST produce a diagnostic and MUST NOT be used for Container matching.

**I-125.** `precedes` relations MUST be used only to express sequences where a different order would be semantically wrong (e.g. spec sections in document order, protocol stages in execution sequence). Implementations MUST NOT create `precedes` relations between instances whose ordering is presentational (layout, curation, display preference). A `precedes` relation between two container members MUST be interpreted as a semantic claim about their sequence, not as a rendering hint. (RFC-015 Change A.)

**I-126.** When `DocumentSection.ordering.memberOrder` is present and the section's `source.type` is `container-subset`, implementations MUST apply it as the presentation sequence: (1) emit listed `instanceId`s that are current container members in the declared order; (2) skip listed `instanceId`s that are no longer container members — implementations MUST emit a diagnostic; this MUST NOT be treated as a validation failure; (3) append surviving container members not in `memberOrder`, ordered by topological sort over `precedes` edges with a `createdAt`-ascending tiebreak (the default container-subset ordering `ext:views-l2` already specifies); (4) when `ordering.direction` is `"desc"`, the entire output sequence produced by steps (1)–(3) MUST be reversed before emission. `memberOrder` MUST NOT be combined with `ordering.fieldId` on the same section — a section carrying both is invalid; implementations MUST report a validation error. `memberOrder` on a non-`container-subset` section MUST be ignored with a diagnostic and SHOULD be rejected at package-validation time. (RFC-015 Change B.)

**I-127.** When both `typeFilter` and `memberOrder` are present on a `container-subset` section, `typeFilter` is applied first to obtain the filtered member set; `memberOrder` is then applied over that filtered set. `memberOrder` entries naming members excluded by `typeFilter` are silently skipped (no diagnostic). Unlisted filtered survivors are appended in the same topological-sort-by-`precedes` order used in Invariant I-126 step (3). The `direction` reversal of Invariant I-126 step (4) applies to the combined result after `typeFilter` and `memberOrder` are both applied. (RFC-015 Change B.)

**I-144.** When SectionSource.type-query carries containerScope, implementations MUST apply the following scoping rules: (a) When containerScope is absent or "explicit", the query is scoped to the containers listed in containerIds[] — existing behaviour. An absent containerIds[] with explicit scope produces an empty result. (b) When containerScope is "repository", the query spans all containers in the repository; containerIds[] MUST be ignored. (c) When containerScope is "subtree", the query spans the context container and all containers reachable by contains relations from each container in containerIds[]; when containerIds[] is absent or empty, the context container is used as the subtree root. An implementation that cannot determine the context container for a subtree query MUST treat it as "explicit" with an empty containerIds[] and SHOULD emit a diagnostic. Implementations MUST NOT produce a validation error when containerScope is absent; absent is equivalent to "explicit".

#### ext:addressability

**34.** `AttentionState.containerId` must reference a valid `Container.containerId`. Other Address components (`recordId`, `fieldId`, `protocolRunId`, `stageId`) are optional and may be absent when focus has not yet narrowed.

#### ext:views-l2 — Distribution

**35.** Every `DocumentSection.renderViewId` in any `DocumentView` within `Package.documentViews[]` must reference a `View.id` that appears in `Package.views[]` or `Package.dependencyRefs`. If `mode === "bundled"`, that `View` must be present in `Package.views[]`.

#### ext:blueprint — Distribution

**36.** Every `TypeRef.typeId` referenced in any `Blueprint.rootTypes[]`, `Blueprint.requiredTypes[]`, or in any `RelationSpec.sourceType` or `RelationSpec.targetType` within `Blueprint.structure[]`, for each Blueprint in `Package.blueprints[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. If `mode === "bundled"`, each such Type must be present in `Package.types[]`.

#### ext:protocol — Distribution

**37.** Every `Protocol.protocolTargetType` (when a non-empty UUID) and every `ProtocolStage.outputType`, for each Protocol in `Package.protocols[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. Every `FieldRef.fieldId` in any `ProtocolStage.contributesTo[]` must appear in `Package.dependencyRefs` with `definitionType: "field"`. If `mode === "bundled"`, those Types must be in `Package.types[]` and those Fields in `Package.fields[]`.

#### core — Field.contentFormat

**38.** `Field.fieldType.format`, when present, is only meaningful when `fieldType.datatype` is `"string"`. Implementations must ignore `format` on fields with any other `datatype`.

#### ext:type-inheritance

**39.** `Type.extendsTypeId`, when present, must reference a valid `Type.id`. Inheritance chains must be acyclic; a Type may not directly or transitively extend itself.

**40.** A specializing Type must not declare a `fieldId` in its own `fields[]` that duplicates any `fieldId` inherited from its base Type or any ancestor Type.

**41.** When `Type.fieldOrder` is present, it must contain exactly the set of field UUIDs in the Type's effective field list. No UUID may appear more than once, and no UUID from the effective field list may be absent.

**42.** Every `fieldId` in `Type.fieldAssignmentOverrides[]` must reference a field inherited from the base Type or an ancestor Type. Overrides must not reference fields declared in the specializing Type's own `fields[]`, must not alter Field semantics, and must not relax an inherited required field from `true` to `false`.

**43.** When `ext:type-inheritance` is declared, `Package.dependencyRefs` must include a `Reference` for every Type in the transitive closure of base Types for any Type in `Package.types[]`. If `mode === "bundled"`, all such base Types must be present in `types[]`.

#### ext:views-l2 — Navigation

**44.** Every `NavigationLink.fromSectionId` and `NavigationLink.toSectionId` must reference a `sectionId` declared in the enclosing `DocumentView.sections[]`.

#### ext:repository

**45.** A conforming repository must have a `.srs` marker directory and a `manifest.json` at its root. A directory without both is not a conforming repository.

**46.** Every instance file discovered under a reserved instance root MUST declare an `instanceId`, and that self-declared value is the instance's identity. There is no manifest index entry to cross-check it against — `RepositoryManifest.instanceIndex` is retired (RFC-038 [R2]) and the repository's authoritative store, enumerated from the tree, is the instance set (RFC-038 [R1]).

**47.** `RepositoryManifest.container` is the canonical `Container` for the repository. It must satisfy all core Container invariants (Invariants 20–21). If a separate `container.json` is present in the repository root, it must be consistent with the manifest's embedded Container; the manifest takes precedence on conflict.

**48.** A `SourceReference` with `sourceType: "repository-document"` must have a `sourceId` matching a `SourceDocument.documentId` whose sidecar is present in `sourceDocumentsPath`. A reference whose `documentId` cannot be resolved within the repository is invalid.

**49.** An archive must include every instance discovered by enumerating the repository's authoritative store — the instance set (RFC-038 [R1], [R17]) — not a manifest `instanceIndex`, which is retired (RFC-038 [R2]). An archive missing any enumerated instance file is malformed; a conforming consumer must reject it or surface the missing instances explicitly before processing.

**50.** When `PackageRef.mode === "local"`, the package at the declared path must be `mode: "bundled"` and must include all Fields and Types referenced by any Tier 2 `Record` in the repository's instance set (RFC-038 [R1]; enumerated from the tree, not a manifest `instanceIndex`, which is retired per [R2]). This is the repository analogue of Package Invariants 7–8.

**51.** An archive that includes a `Relation` containing a `SourceReference` with `sourceType: "repository-document"` must include that document's sidecar and content file, just as if the reference appeared within an instance. A conforming archiver must scan Relations for `repository-document` references and collect the corresponding source material. An archive missing such material is malformed.

**52.** Every `SourceDocument` sidecar present under `sourceDocumentsPath` must have a `contentPath` that resolves to an existing content file in the same directory. A sidecar whose `contentPath` does not resolve is invalid. A conforming producer must not emit such a sidecar; a conforming consumer must surface the resolution failure before processing any `SourceReference` pointing at that `documentId`.

**53.** A conforming importer must use `repositoryId` as the key to determine whether an incoming repository already exists locally. An importer that unconditionally creates a new local repository for every archive it receives, without consulting `repositoryId`, is not conformant.

**54.** When an importer encounters an incoming object whose identity key matches an existing local object but whose content or checksum differs, it must surface the conflict explicitly. An importer that silently overwrites or silently discards in this case is not conformant.

**55.** A checksum value in `InstanceIndexEntry.checksum`, `SourceDocumentIndexEntry.sidecarChecksum`, `SourceDocumentIndexEntry.contentChecksum`, or `RelationsChecksumEntry.checksum` must use the format `<algorithm>:<hex-encoded-digest>`. A value that does not include the `<algorithm>:` prefix is invalid.

**I-128.** When `manifest.renderedPresentations` is present and non-empty, a conformant viewer MUST select as the default presentation the first entry whose `isDefault` is `true`. When no entry carries `isDefault: true`, the first entry in the array is the default. The selected DocumentView governs the repository's presentation. When a `renderedPresentations` entry's `viewId` does not resolve to a DocumentView in the active packages, implementations MUST skip that entry and MUST emit a diagnostic; if all entries fail to resolve, behaviour falls back to implementation-defined selection as if `renderedPresentations` were absent. When `viewId` resolves to DocumentViews in more than one active package, implementations MUST report a validation error (ambiguous view reference). When `renderedPresentations` is absent or empty, viewer behaviour falls back to implementation-defined selection (existing behaviour unchanged; no conformance obligation is added for the absent case). (RFC-015 Change C.)

#### Container (core)

**I-64.** When a Container has one or more rootInstanceIds and also carries containerType, implementations SHOULD emit a diagnostic if containerType does not equal the resolved root Type name field (the local name within its namespace, not namespace/name). The root Record Type is authoritative; a mismatch does NOT make the Container invalid. Containers with no rootInstanceIds may carry any containerType value without triggering this rule.

**I-65.** When a Vocabulary in the repository package declares Term entries for a given tag key, Container tags bearing that key MUST resolve against those Terms per RFC-006 vocabulary resolution rules. Free-string tags are valid when no Vocabulary entry governs the key.

**I-66.** All conforming SRS implementations MUST implement the containers_for_instance operation. Given an instanceId, it returns every Container whose rootInstanceIds, memberInstanceIds, or transitive contains-Relation traversal from rootInstanceIds includes the instance. The result set MUST be consistent with the current state of those fields and relations.

#### ext:blueprint (Blueprint)

**I-78.** Each entry in Blueprint.rootTypes MUST be an ExactTypeRef: both typeId (UUID) and typeVersion (integer >= 1) MUST be present. Implementations MUST resolve each entry against the Package (the union of all packages in scope per packageRef/packageRefs) at Blueprint load time; an entry that does not resolve MUST produce a diagnostic. An empty rootTypes array is valid and produces no diagnostics.

#### ext:repository (RepositoryManifest)

**I-79.** Every SRS repository manifest MUST embed exactly one root Container in manifest.container. The root Container MUST satisfy the core Container invariants unchanged: Invariant 20 (its containerId is not an instance ID and never appears in rootInstanceIds, memberInstanceIds, Relation.sourceInstanceId, or Relation.targetInstanceId) and Invariant 21 (every id in rootInstanceIds/memberInstanceIds references a valid SRS instance id).

#### ext:repository (RepositoryManifest, Container)

**I-80.** Every id in the root container's rootInstanceIds and memberInstanceIds MUST resolve to a member of the repository's authoritative instance set. There is no manifest `instanceIndex` to consult — it is retired (RFC-038 [R2]); the repository's authoritative store, enumerated from the tree, is that set (RFC-038 [R1]). This is the root-container specialization of core Invariant 21, stated separately so the required-root-container guarantee is self-contained.

#### ext:repository (Container.identityInstanceId)

**I-81.** When present on a Container, identityInstanceId MUST equal an id contained in that Container's rootInstanceIds or memberInstanceIds. On the root container it names the repository's identity record. If it resolves to no such member, the repository is invalid. Reassigning identityInstanceId to a different member MUST NOT change the repositoryId, the container's containerId, or any instance id; the new target must already be a member before the pointer moves to it, so the repository is never transiently invalid.

#### ext:repository (Container, container set)

**I-82.** When the repository's container set (RFC-038 [R1]) is non-empty, each non-identity section root of the root container (its navigation sections) SHOULD be the root of some Container in that set. An empty container set suppresses this diagnostic. A section root with no corresponding section container is a diagnostic, not an error, and a consumer MUST still render it as a navigation leaf rather than dropping it. `containerIndex` is retired (RFC-038 [R2]) and is no longer the membership authority for this check.

#### ext:import-tracking

**I-83.** A tool MUST resolve every `typeId` and `fieldId` referenced by any Tier 2 Record against the union of all installed package version directories. This extends Invariant 50 to the multi-version case: a reference is resolved if it can be found in any installed version directory. A reference that cannot be found in any installed version directory MUST be reported as a validation error. A tool MUST NOT remove any prior-version package directory if doing so would leave any such reference unresolvable.

**I-84.** When `manifest.upstreamPackage` is set, there MUST exist at least one entry in `manifest.packageRefs` (or `manifest.packageRef`) whose `packageId` matches `manifest.upstreamPackage.packageId`. A manifest where no `PackageRef` entry's `packageId` matches `upstreamPackage.packageId` MUST be reported as a validation error. Manifest-only validators MAY skip this check when no `PackageRef` entry carries `packageId` (i.e., all local-mode entries predate RFC-014 and omit the field), and SHOULD report the repository state as indeterminate rather than emitting a validation error in that case.

#### com.semanticops.core namespace

**I-85.** A conforming SRS implementation MUST make all `com.semanticops.core/*` types and fields resolvable in every repository without any `packageRef` or `packageRefs` declaration in the manifest. The core base package's definitions are treated as logically present in the RFC-014 R6 package union for all repositories. An implementation that fails to resolve `com.semanticops.core/*` types and fields in a structurally valid repository is non-conformant with RFC-029.

**I-86.** A repository MUST NOT declare any Type or Field under the `com.semanticops.core` namespace in a local or external package. An implementation MUST reject the repository load with a conflict error if any such declaration is encountered during package loading. This reservation covers only the `com.semanticops.core` namespace; other `com.semanticops.*` sub-namespaces are governed by their own RFC or by general package conflict rules and are not affected by this invariant.

#### manifest.container.identityInstanceId

**I-87.** `manifest.container.identityInstanceId`, when present, MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. This invariant layers on RFC-013 I-81 (membership requirement retained; I-81 is not superseded); RFC-029 adds the type constraint on top. During the RFC-029 migration grace period (R7), an implementation MUST emit a migration warning rather than a validation error for existing repositories whose `identityInstanceId` resolves to a record that is not a Tier-2 `com.semanticops.core/purpose` Record (including Tier-0 notes and Tier-1 TypedRecords of any type). All newly-created repositories (post-RFC-029) must satisfy this invariant immediately.

#### SourceReference.sourceRole

**I-88.** The `sourceRole` value set — the closed enum of the implemented schema revision, including values added by later accepted RFCs — MUST be disjoint under literal whole-key equality from the set of installed `RelationTypeDefinition` keys in the repository's effective package set. Relation-type creation MUST reject a definition whose key equals a `sourceRole` value; `repo validate` MUST report a pre-existing collision as `SOURCEROLE_RELATIONTYPE_COLLISION` (warning at rest). The legacy `relationType` enum on SourceReference is exempt. A namespaced key (e.g. `com.acme/evidence`) does not collide with a bare `sourceRole` value.

#### Validators, importers

**I-101.** A conformant implementation MUST accept `"attaches"` as a value of `SourceReference.sourceRole`. An attachment is a `SourceReference` with `sourceType: "repository-document"`, `sourceRole: "attaches"`, and `sourceId` equal to a source document's `documentId`. Attachment MUST NOT be modelled as a `Relation` edge; there is no `attaches` canonical `Relation` type.

#### Validators

**I-102.** The `sourceId` of an `attaches` `SourceReference` MUST resolve to a `documentId` in the repository's source-document set, discovered via a `.meta.json` sidecar scan of `sourceDocumentsPath` in the same repository (RFC-038 [R25], amending RFC-017 [R2]/[R12]; `sourceDocumentIndex` is retired per RFC-038 [R2]). Resolution is against the sidecar entry, not the content file. A `sourceId` that resolves to no such entry is non-conformant and MUST be reported with a diagnostic at validation time.

**I-111.** At most one `attachment_policy` record of the `com.semanticops.base/repo_settings` type MAY exist per repository. A conformant implementation encountering two or more MUST surface a diagnostic and treat the policy as absent (applying the no-policy defaults: all MIME types accepted, no size limits enforced, no size-or-MIME-type-policy diagnostics emitted).

#### All implementations

**I-103.** A conformant implementation MUST NOT refuse to load, validate, or export a repository solely because the `com.semanticops.base` package is absent or because no `attachment_policy` record is present.

**I-104.** When no `attachment_policy` record exists, a conformant implementation MUST apply the no-policy defaults: all MIME types accepted, no size limits enforced, no size-or-MIME-type-policy diagnostics emitted.

#### ext:repository archive producers

**I-105.** A conformant archive producer MUST produce deterministic ZIP archives: entries sorted byte-lexicographically by forward-slash-normalised path, `last mod` timestamps zeroed (`0x0000`), compression method Deflate (8) or Store (0) only with consistent per-file choice across invocations, `extra` fields empty, Language encoding flag (bit 11) set to 1.

**I-106.** Given identical repository content, a conformant archive producer MUST produce a byte-for-byte identical `.srs` file across invocations of the same implementation. Cross-implementation byte identity is not guaranteed (I-105 allows implementation-defined Store/Deflate choice). Identical content means identical archive entry paths (forward-slash-normalised) and byte contents; filesystem timestamps, permissions, and host metadata are excluded and MUST NOT influence archive output.

#### `srs repo validate`

**I-107.** A conformant implementation MAY enforce `attachment_policy` limits as hard rejections. If it does not, it MUST emit non-blocking warning diagnostics at `srs repo validate` time when: a source document content file exceeds `max_per_file_bytes` or `max_doc_bytes`; aggregate source-document bytes exceed `max_total_bytes`; an attached file's MIME type is not listed in `allowed_mime_types`. Non-blocking diagnostics MUST NOT prevent record storage or repository export.

#### ext:json-store importers and validators

**I-108.** A conformant implementation MUST reject a gzip-compressed file presented as a `.srsj` JSON Store. Detection is by content inspection: a file whose first two bytes are `0x1f 0x8b` MUST be treated as gzip-compressed regardless of its filename or MIME type.

#### ext:repository source-document resolution

**I-109.** `contentPath` in a source-document sidecar MAY contain forward-slash-separated sub-path segments. A conformant implementation MUST resolve `contentPath` relative to `sourceDocumentsPath`.

#### ext:repository source-document sidecars

**I-110.** A sidecar MUST reside in the same directory as the content file it describes. A `contentPath` that traverses upward (e.g., `../other/file.pdf`) is non-conformant.

#### ext:repository validators, exporters

**I-112.** A source-document sidecar entry (RFC-038 [R25], amending RFC-017 [R12]; the entry no longer lives in a manifest `sourceDocumentIndex`, which is retired per RFC-038 [R2]) whose content file (at `contentPath`) is absent is a valid tombstone (reference-only) state. A conformant implementation MUST NOT reject, refuse to load, or refuse to export a repository solely because a discovered source document's content is missing. An `attaches` `SourceReference` targeting a tombstoned `documentId` remains conformant (I-102). An implementation MAY surface an informational non-blocking diagnostic that the content is unavailable.

#### ext:discovery

**I-113.** An implementation that declares `ext:discovery` MUST include in its DiscoveryQuery result set every instance that satisfies all specified structured filter predicates (`typeId`, `typeNamespace`, `typeName`, `containerId`, `tag`, `lifecycleState`, `excludeLifecycleStates`, `tier`), and MUST NOT include any instance that fails any specified structured filter predicate. (RFC-012 R1.)

**I-114.** For a `contentMatch` predicate with normalized query string `q`, an implementation that declares `ext:discovery` MUST include every instance whose Text Projection contains at least one `TextSegment` whose normalized `text` contains `q` as a substring (case-folded NFC substring match). (RFC-012 R2.)

**I-115.** An implementation MAY include instances beyond the recall-floor set defined by I-114 (e.g. via stemming, phonetic matching, or semantic similarity). Returning extra results does not violate `ext:discovery` conformance. (RFC-012 R3.)

**I-116.** An implementation MAY rank DiscoveryQuery results in any order. The recall-floor guarantee of I-114 applies to inclusion in the result set only, not to rank position. (RFC-012 R4.)

**I-117.** When both structured filters and `contentMatch` are specified on a DiscoveryQuery, an instance MUST satisfy all structured filter predicates (exact-match, I-113) AND the content-match recall-floor predicate (I-114). The structured-filter constraints cannot be overridden or widened by content-match extra recall. (RFC-012 R5.)

**I-118.** A `containerId` filter predicate MUST use the three-condition membership definition of RFC-009 I-66: (1) `instanceId` in `Container.rootInstanceIds[]`, OR (2) `instanceId` in `Container.memberInstanceIds[]`, OR (3) reachable via transitive `contains` Relation traversal from any `rootInstanceIds[]` entry. The authoritative source for membership is the instance file and the relations file — the repository's authoritative store (RFC-038 [R1]). An implementation MAY maintain a derived catalog for performance but MUST treat the store as authoritative when they differ; there is no manifest `instanceIndex` to use as a cache, as it is retired (RFC-038 [R2]). (RFC-012 R6.)

**I-119.** A `tag` predicate with multiple values MUST use AND semantics — all specified tags must be present on the instance. Both query tags and stored instance tags are canonicalized via RFC-006 key-or-alias resolution when a Vocabulary is declared for the tag key; when no Vocabulary is declared, raw string comparison applies (case-sensitive). (RFC-012 R7.)

**I-120.** For Tier 2, the Text Projection MUST include a Field only when `fieldType.datatype == "string"` and `fieldType.format` is absent or one of `"plain"`, `"markdown"`, or `"uri"`. `valueDomain` does not affect searchability. A single-cardinality Field emits one segment; a list-cardinality Field emits one segment per array element in order. Fields with `format: "uuid"` or `format: "email"`, or datatype `number`, `integer`, `boolean`, `date`, `date-time`, `ref`, `dependent`, or `map`, MUST NOT contribute `TextSegment`s. Tier-1 `TypedField.valueType` continues to use the legacy classification until the #242 Phase-B carrier cutover. (RFC-012 R8; RFC-032 Rev-7 erratum.)

**I-121.** The Text Projection MUST include `tags` array entries as `TextSegment`s after field segments. An implementation MAY additionally include `FieldAssignment.displayLabel` values as segments after tags — this is not required, and two conforming implementations may differ on whether display-label segments are included. (RFC-012 R9.)

**I-122.** Normalization of `TextSegment.text` MUST apply Unicode Normalization Form C (NFC) followed by Unicode simple case folding (locale-independent). Implementations MUST NOT strip punctuation, diacritics, or whitespace during this normalization step; additional stemming or tokenization is permitted for ranking purposes only, not as a substitute for the normalized canonical search string. (RFC-012 R10.)

**I-123.** An implementation that declares `ext:discovery` MUST pass all structured-filter conformance scenarios (`exactMatch: true`) from the fixture at `srs/conformance/discovery/scenarios.json`, returning exactly the `expectedInstanceIds` set for each such scenario. (RFC-012 R11.)

**I-124.** An implementation that declares `ext:discovery` MUST pass all content-match conformance scenarios (`exactMatch: false`) from the fixture at `srs/conformance/discovery/scenarios.json` — its result set for each such scenario MUST be a superset of the scenario's `expectedInstanceIds`. (RFC-012 R12.)

#### ext:views-l2 + ext:lifecycle

**I-142.** When SectionSource.type-query carries a non-empty lifecycleStates array, implementations MUST restrict the query result to Records whose lifecycleState matches any value in the array (OR semantics). A Record with no lifecycleState MUST be excluded when lifecycleStates is present and non-empty. When lifecycleStates is absent or empty, no filtering by this field is applied and all lifecycle states (including absent) are included. Implementations that do not declare ext:lifecycle MUST ignore lifecycleStates and MUST NOT produce a validation error on its presence.

**I-143.** When SectionSource.type-query carries a non-empty excludeLifecycleStates array, implementations MUST exclude from the query result any Record whose lifecycleState matches any value in the array. When lifecycleStates and excludeLifecycleStates are both present and non-empty, inclusion filtering (I-142) MUST be applied first; exclusion filtering is then applied to the survivors. A Record with no lifecycleState is not excluded by excludeLifecycleStates (only Records with a matching non-null lifecycleState are excluded). When excludeLifecycleStates is absent or empty, no exclusion is applied. Implementations that do not declare ext:lifecycle MUST ignore excludeLifecycleStates and MUST NOT produce a validation error on its presence.

#### Other

**I-129.** A Tier-2 `Record`'s `fieldValues` MUST be a JSON object. Each key MUST equal the `Field.name` of a Field in the effective field set of the Record's `typeId`@`typeVersion`. Unknown keys MUST be rejected; the projected schema asserts `additionalProperties: false`. (RFC-039 [R1])

**I-130.** A `fieldValues` key MUST be `Field.name` verbatim, with no case or separator transformation, at every nesting depth. The name projection MUST NOT be applied to instance keys under any circumstances, including for meta-model entities stored as Records. (RFC-039 [R2b])

**I-131.** Within a Type's effective field set — its own `fields`, plus fields contributed through `extendsTypeId` — every referenced `Field.name` MUST be distinct. An implementation MUST reject a Type that violates this at definition time, not at instance time. (RFC-039 [R4])

**I-132.** A `FieldAssignment` with `required: true` means its key MUST be present in `fieldValues`. Key absence is the sole representation of an unset field: a value of `null` MUST be rejected — writers MUST omit the key instead. Structural presence and rendering presence (RFC-001 Step 2, where an empty string resolves as absent) remain distinct and MUST NOT be conflated. (RFC-039 [R5]/[R5a])

**I-133.** `fieldMeta`, when present, MUST be an object whose keys are a subset of the sibling `fieldValues` keys, and whose values are objects of `{source?, editedAt?, sourceRefs?}`. A `fieldMeta` key with no corresponding `fieldValues` key MUST be rejected. `fieldMeta` MUST NOT appear inside an inline-composite value. (RFC-039 [R6])

**I-134.** `FieldValue`, `FieldValueEntry`, `FieldGroupValue`, `FieldGroupEntry`, `Type.fieldGroups`, and `FieldAssignment.{repeatable, minItems, maxItems}` are removed. An implementation MUST reject a document containing any of them at `dataModelRevision >= 2`. Definition files carry no document-local revision discriminator, so revision MUST be resolved from the enclosing repository or package manifest before this rule is applied to a definition. A manifest at `dataModelRevision >= 2` MUST NOT declare `ext:field-groups` or `ext:repeatable-fields`; a reader encountering such a declaration MUST report an error. (RFC-039 [R7]/[R15])

**I-135.** A reader MUST determine instance generation structurally. For a Tier-2 `Record`: an array `fieldValues` is revision <= 1, an object `fieldValues` is revision >= 2. For a Tier-1 `TypedRecord`: a `TypedField` carrying `fieldType` is revision >= 2, one without it is revision <= 1. On encountering a generation it does not support, a reader MUST emit a diagnostic naming the file and the expected `dataModelRevision` and MUST NOT coerce, partially read, or silently skip the document. (RFC-039 [R9])

**I-136.** A `mode: "reference"` value MUST resolve to an instance present in the repository's authoritative instance set, and that instance MUST be of the Field's declared `rangeType` at the declared `typeVersion`. A dangling or type-mismatched target MUST be reported as an error naming the referring record, the key, and the target id. (RFC-039 [R14], amended by RFC-038 [R25] — the reference target is the tree-enumerated instance set, not a manifest `instanceIndex`, which is retired per RFC-038 [R2]; discharges RFC-032 OQ4, RFC-033:302, RFC-035:592)

**I-137.** A Type version referenced by any instance in the repository MUST NOT be deleted. Name-keying makes the Record-to-Field edge Type-mediated: `fieldId` is recovered from `typeId` + `typeVersion` + key, so deleting the pinned Type version renders every instance of it unreadable. This rule governs versions with live referents only. (RFC-039 [R19])

**I-138.** A DocumentView projection MUST key `ProjectedRecord.fields` and `orderedFieldKeys` by `Field.name`, and MUST carry a composite value recursively under its own key. `ProjectedFieldGroup` and `ProjectedGroupEntry` are removed and have no successor construct. (RFC-039 [R11])

**I-139.** `cardinality: "list"` array-wraps uniformly, for every `datatype` including `map` and `dependent`, matching `projectField`'s unconditional wrap. The single-value rule states the `single` case; the wrap composes on top of it. (RFC-039 [R16])

**I-140.** A Type's projected JSON Schema describes the `fieldValues` object, not the whole Record document. `instanceId`, `typeId`, `tags`, `meta`, `sourceRefs`, and `fieldMeta` are envelope members governed by `record.json`, and are outside the projected schema's `additionalProperties: false`. (RFC-039 [R17])

**I-141.** Instance `fieldValues` keys MUST be serialised in `FieldAssignment.order`, and nested composite objects likewise, so that a re-run of a transform is byte-idempotent and diffs are stable. This is the instance-side counterpart of the schema-key ordering in `projection-rules.md`; it supersedes the write-order signal of rfc-012:139. (RFC-039 [R18])

### Extension Interactions

**Content**: Cross-extension interactions are behavioural requirements that apply only when an implementation declares both named extensions.

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

**Status: Dormant** (removed under `rfc-decision-2a1e1590`, 2026-08-21). This coupling's required behaviour, and both of its invariants (formerly `[LC-AX1]` and `[LC-AX2]`), required a lifecycle state transition to produce a `Revision` snapshot per field value, tagged with `provenance.lifecycleTransition`. Every clause of this coupling was revision-dependent; with the per-field `Revision` mechanism removed (zero corpus use, incompletely specified — see `rfc-decision-2a1e1590`, also removed under the same ruling), no requirement survives the cut. `ext:lifecycle` and `ext:addressability` impose no cross-cutting obligation on each other while this stays dormant; each extension's own invariants are unaffected.

**Return trigger**: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface. When a real consumer's requirements are known, the coupling is redesigned against them rather than reinstated as specified here.

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


#### ext:repository conformance requirements

**Content**: An implementation declaring `ext:repository` must:
- Produce repositories with a `.srs` marker and `manifest.json` at root, with content in the prescribed folder layout
- Maintain no `instanceIndex` in the manifest — it is retired (RFC-038 [R2]); membership is the instance set enumerated from the tree (RFC-038 [R1])
- Produce archives that satisfy all self-containment requirements (Invariants 49 and 51)
- Consume archives by parsing the manifest first and resolving all instances via the repository's authoritative instance set, enumerated from the tree (RFC-038 [R1]), before processing content
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



