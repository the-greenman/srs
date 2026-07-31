# RFC-039: Name-keyed `fieldValues` — the recursive Record value carrier

> **GitHub issue**: [the-greenman/srs#242](https://github.com/the-greenman/srs/issues/242)

**Status**: Draft (Revision 1)
**Affects**: `Record` (Tier 2), `TypedRecord` (Tier 1), `FieldValue`, `FieldValueEntry`, `FieldGroupValue`/`FieldGroupEntry` (`ext:field-groups`), `ext:repeatable-fields`, `FieldAssignment.{repeatable,minItems,maxItems}`, `Type.fieldGroups`, `dataModelRevision`; `docs/schema/2.0/{record,typed-record,type}.json` and `docs/schema/2.0/projection-rules.md`. Builds on RFC-032 (Accepted — composite field range), RFC-035 (Accepted — schema emitter / projection rules; **this RFC narrows its [R4]** to the frozen-seed metamodel), RFC-036 (Accepted — composite rendering), RFC-037 (Accepted Rev 3 — field-row baseline). Composed with RFC-038 (#296, Draft) in one first-party cutover. **Breaking (instance layer).**
**Author**: the-greenman (epic-256 worker)
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft. Phase A of #242: design and migration plan only, no implementation. |

---

## Abstract

A Tier-2 `Record` stores its field values as an **array of `{fieldId, value}` pairs**. JSON Schema
validates object properties **by name**, so a Type cannot project into a standard JSON Schema that
validates its own Records — the encoding needed is a `contains` clause plus an `if`/`then` branch per
field, and field-id uniqueness is not expressible at all. This RFC replaces `fieldValues` with an
**object keyed by `Field.name`**, whose value space is defined by a single recursive rule that is
exactly RFC-032 `projectField`'s instance space. Scalars, lists, inline composites, and
**lists of inline composites** all become expressible, which retires `FieldGroup`, `groupValues`, and
`ext:repeatable-fields` `entries` together. Per-value provenance moves to a parallel `fieldMeta`
sibling rather than being deleted or wrapped. This is Phase A — the design and the migration plan;
the cutover is Phase B and lands atomically with RFC-038.

---

## Motivation

### Problem 1 — the array shape defeats standard JSON Schema projection

`docs/schema/2.0/record.json` stores values as `fieldValues: FieldValue[]`, where
`FieldValue = {fieldId: uuid, value?, entries?, source?, editedAt?, sourceRefs?}`. To say
"field X is required, a string, `minLength` 5" over that array a schema must, **per field**, carry a
`contains` clause asserting presence and an `if`/`then` over every item to type that field's `value`.
Field-id uniqueness is not expressible: `uniqueItems` compares whole items, not one key. A ten-field
Type yields ten `contains` clauses and ten `if`/`then` branches, and no off-the-shelf consumer — form
generator, code generator, standard validator — does anything useful with the result.

This is not a hypothetical. Epic #256's design requirement is that a Type project into a standard
JSON Schema **by direct implementation**, with anything that is not a direct JSON Schema construct
having to earn its place. The array shape is the single structural obstacle to that requirement.

### Problem 2 — the projection already assumes name-keying, and the instance does not

The normative projection contract is `docs/schema/2.0/projection-rules.md` (RFC-035 [R8]):

> A `Type` renders as a JSON Schema object with `type: "object"`, `additionalProperties: false`,
> `properties`, and (when non-empty) `required` […] Each `FieldAssignment` renders as one property
> under `properties`, in `FieldAssignment.order`. `FieldAssignment.required == true` adds the property
> key to the parent `required[]`.

The **schema** side is therefore already name-keyed and already object-shaped. Only the **instance**
side is a UUID-keyed array. The two halves of the model disagree about what a Record *is*, and the
disagreement is bridged today by a custom keyword: the editor-facing projection emits
`x-srs-field-id` on every property so a consumer can map the name-keyed schema back onto the
UUID-keyed instance. That keyword exists solely to paper over this mismatch.

Tier 1 makes the inconsistency plainer still. `docs/schema/2.0/typed-record.json` `$defs.TypedField`
keys values by **name**, and already states the uniqueness rule this RFC needs:

> `"name"`: `"Field key; snake_case recommended; unique within the TypedRecord."`

So SRS already name-keys field values — at Tier 1. **Tier 2 is the anomaly**, not the proposal.

### Problem 3 — the projection is silently lossy for the construct tables depend on

Projecting `com.semanticops.spec/table@2` through the canonical RFC-035 emitter
(`srs type json-schema`, binary `9c3273c`, run against this repository) yields:

```jsonc
{ "$id": "https://srs.semanticops.com/schema/domain/com.semanticops.spec/table/2.json",
  "type": "object", "additionalProperties": false,
  "properties": { "intro": {…}, "outro": {…}, "columns": {…} } }
```

`rows` — the FieldGroup carrying every actual table row — **is absent**. `fieldGroups` is in the
emitter's documented seed-only exclusion set, so a table's entire substance is invisible to its own
canonical projection, and the schema asserts `additionalProperties: false` over what remains. Nine
spec records and 65 rows are affected here; the muSrs corpus has ~29 carriers and ~175 rows, over a
five-field group.

The owner has recorded that *"tables are a pretty vital element in practice"* and that
*"structured values should win over any JSON-in-text implementation"* (2026-07-31). Today the
sanctioned mechanism for a table — composite range, RFC-032 — has **no instance carrier**, while the
mechanism that works, `FieldGroup`, is deprecated. Production content is being authored into a
deprecated construct with no migration target. This RFC is that target.

### Problem 4 — cardinality has two instance mechanisms and neither is the declared one

RFC-032 [R4] made `fieldType.cardinality` *"the sole cardinality mechanism"*. The instance layer did
not follow: `FieldValue.entries` (`ext:repeatable-fields`) is a second one, and `FieldAssignment`
retains a deprecated `repeatable`/`minItems`/`maxItems` trio, held alive only because `FieldGroup.fields`
reuse `FieldAssignment`. RFC-032 Change E explicitly gates their removal on this issue.

---

## Proposed Changes

### Change A — `fieldValues` becomes an object keyed by `Field.name`

`Record.fieldValues` changes from `FieldValue[]` to a JSON object whose **keys are `Field.name`
verbatim** and whose values are given by the recursive rule in Change B.

```jsonc
// before (revision ≤ 1)
"fieldValues": [
  { "fieldId": "1a000025-…", "value": "**Directionality convention:** …" },
  { "fieldId": "1a000032-…", "value": ["Relation", "source", "target"] }
]

// after (revision 2)
"fieldValues": {
  "intro":   "**Directionality convention:** …",
  "columns": ["Relation", "source", "target"]
}
```

The key is `Field.name` **verbatim, as authored**, with no case or separator transformation.

This requires narrowing an Accepted rule, and the RFC does so explicitly rather than by
implication. RFC-035 **[R4]** is phrased without qualification — *"The emitter MUST project an SRS
`Field.name` (snake_case) to its JSON property key (lowerCamelCase) by a deterministic, injective
transform"* — which read literally would give domain Types camelCase keys. Three findings say it is
metamodel-scoped in fact:

- `projection-rules.md:78` scopes the guarantee to *"the in-scope **metamodel** field names"*, and
  RFC-035 `[R1]`/`[R5]` scope their obligations to *"in-scope meta-model Types"*. No sentence states
  that the transform binds domain Types.
- **The reference emitter already emits domain names verbatim.** Projecting
  `com.semanticops.spec/rfc@1` yields the property `proposal-artifact-path` — not
  `proposalArtifactPath`.
- **The transform is undefined over the corpus.** [R4] specifies `snake_case → lowerCamelCase`, but
  of 150 Field definitions, 59 are snake_case, 58 single-word, and **33 are kebab-case** — for which
  a snake_case-input transform has no defined behaviour.

**Change A therefore narrows RFC-035 [R4] to the frozen-seed metamodel entities**, whose emitted
keys must match hand-authored JSON Schema spellings (`min_items` → `minItems`), and fixes verbatim
keys everywhere else. This is an erratum-style clarification to an Accepted RFC, in the manner of
RFC-032 Rev 6; without it, [R4] and this RFC would contradict each other, and the reference emitter
would be non-conformant against [R4] today. See [R2], Alt D, and Open Question 1.

The payoff is the property the whole RFC turns on: instance keys and projected schema keys are
identical **by construction**, with no transform to keep in step and no bridge keyword.

`fieldId` is not stored in the instance. It is recoverable at any time from `typeId` + `typeVersion`
+ the key, which is the same resolution the reader already performs to find the Field's `fieldType`.

### Change B — one recursive value rule, identical to `projectField`'s instance space

For a Field `F` assigned at key `k`, the value at `k` is determined **solely** by `F.fieldType`:

| `fieldType` | Value shape |
|---|---|
| scalar `datatype`, `cardinality: single` | the JSON scalar for that datatype (per the portable scalar table), or `null` |
| scalar `datatype`, `cardinality: list` | array of those |
| `datatype: ref`, `mode: inline`, `single` | **an object that is itself a `fieldValues` map for `rangeType`** |
| `datatype: ref`, `mode: inline`, `list` | **array of such objects** |
| `datatype: ref`, `mode: reference`, `single` | instance-id string (uuid) |
| `datatype: ref`, `mode: reference`, `list` | array of instance-id strings |
| `datatype: map` | object, string keys → `valueRange` scalar (or unconstrained when `valueRange: "open"`) |
| `datatype: dependent` | a value conforming to the descriptor named by `dependsOn` ([R6] validation obligation) |

The third and fourth rows are the load-bearing ones and the reason this is stated recursively: an
inline composite value **is** a `fieldValues` map, so the carrier nests to arbitrary depth with no
new construct. RFC-032 has no list-of-list, so nested tabular data goes through an inline `ref`, and
that case is now expressible.

The table above is not a second specification. It is the instance space of RFC-032 Change G's
`projectField`, restated from the value side. The design property this RFC is buying is that
**instance shape and projected schema are the same rule read in two directions** — a Record is valid
against its Type's projected JSON Schema by construction, not by a separate conformance argument.

Worked example — `com.semanticops.spec/table@2` after Change E retires its FieldGroup:

```jsonc
"fieldValues": {
  "intro":   "**Directionality convention:** …",
  "columns": ["Relation", "source", "target"],
  "rows": [
    { "cells": ["`supersedes`",  "the newer Record",     "the older Record"] },
    { "cells": ["`contains`",    "the stage",            "the task inside it"] },
    { "cells": ["`depends-on`",  "the dependent task",   "the task it needs"] }
  ]
}
```

which validates against exactly the shape the editor-facing projection already emits for `rows`:
`{type: array, items: {type: object, properties: {cells: {type: array, items: {type: string}}},
required: ["cells"], additionalProperties: false}}`.

### Change C — per-value provenance moves to a parallel `fieldMeta` sibling

`FieldValue` carries `source`, `editedAt`, and `sourceRefs`. A bare `name: value` map has nowhere to
put them. The issue records this as *"the strongest argument against the change"*, to be answered on
design merit rather than waved through. It is answered by separating **the asserted value** from
**metadata about the assertion**:

```jsonc
"fieldValues": { "proposal_artifact_path": "rfcs/rfc-004.md" },
"fieldMeta":   { "proposal_artifact_path": { "source": "human" } }
```

`fieldMeta` is an optional sibling object, keyed **identically** to `fieldValues`, whose values are
`{source?, editedAt?, sourceRefs?}` — the same three facets, unchanged in meaning.

Why this rather than the alternatives:

- **A wrapper object per value** (`{value: …, source: …}`) is rejected outright. It reintroduces the
  exact indirection this RFC removes: the projected schema would describe the wrapper, not the
  domain value, and `additionalProperties: false` over a wrapper says nothing about the data. It
  would defeat the RFC's purpose to preserve a facet used once.
- **Deleting per-value provenance** and keeping only record-level `sourceRefs` is cheap but wrong on
  merit. RFC-017 designed `sourceRefs` as forward capability; low exercise is not low value, and an
  AI-assisted authoring system has a real, ongoing interest in "which field did the model write".
  Relocating a capability losslessly is strictly better than deleting it.

The corpus supports the shape rather than dictating it. Measured over this repository at
`origin/master` `c9797f0`: **record-level `sourceRefs` is used 231 times**; **per-value `source` once**
(RFC-004's `proposal_artifact_path`, value `"human"`); per-value `editedAt` and `sourceRefs`
**never**. Provenance is already, overwhelmingly, a record-level idiom here — so `fieldMeta` codifies
what practice already does while keeping the per-field granularity available for the case that
motivated it. The migration is one value.

**Granularity rule.** `fieldMeta` mirrors the keys of the **owning** `fieldValues` map only; it does
not descend into inline-composite interiors. A nested composite's values inherit the provenance of
the carrier field. This bounds the recursion and matches the corpus (zero per-value metadata inside
`groupValues` today). A future recursive extension remains available additively under a reserved
sub-key without a breaking change.

### Change D — `ext:repeatable-fields` `entries` is removed; cardinality carries it

`FieldValue.entries` and `$defs.FieldValueEntry` are deleted. A repeatable field is
`fieldType.cardinality: "list"` and its value is a JSON array — Change B row 2.

This is safe to state unconditionally because it is measured: of the **61** `FieldValue.entries` uses
in this repository (138 entry items), **61 are on Fields already declaring `cardinality: "list"`** and
**0 are not**; entry objects carry **no** keys other than `value` (0 `source`, 0 `editedAt`). The
transform `entries: [{value: v₁}, …, {value: vₙ}] → [v₁, …, vₙ]` is total, deterministic, and strands
nothing. #276 is the reason the count is 61/0 rather than 61/2: it restored `cardinality: "list"` to
`com.semanticops.spec/{columns,cells}`, and `scripts/check-cardinality-coherence.mjs` is the standing
guard.

### Change E — `FieldGroup` and `groupValues` are removed

`Type.fieldGroups`, `record.json` `$defs.FieldGroupValue` and `$defs.FieldGroupEntry`, and the
deprecated `FieldAssignment.{repeatable, minItems, maxItems}` trio are deleted. A group becomes a
Field whose `fieldType` is `{datatype: "ref", mode: "inline", cardinality: "list", rangeType: <group Type>}`,
and its instance values become Change B row 4.

This completes RFC-032 Change E, which subsumed `FieldGroup` in the definition layer and deferred
removal to this issue precisely because *"an inline composite value has no conforming carrier until
#242 provides the `fieldValues` representation"*.

Three facts make the removal clean, all verified in this repository:

- The `rows` group's `minItems: 1` on `table@2` is the **only** `minItems`/`maxItems` anywhere in the
  corpus, and it counts row occurrences — so it transfers to the new Field's `fieldType.minItems`
  rather than being stranded. No `FieldAssignment` carries either property.
- **No per-assignment cardinality override is owed.** RFC-032 [R8] Rev 6 errata and Invariant 2 settle
  that cardinality is Field-level by construction; `required` remains overridable, cardinality never was.
- **0 Types use `extendsTypeId`** today, so no inherited group complicates the transform — though [R4]
  is still written to cover inheritance.

### Change F — `Field.name` uniqueness within a Type's effective field set

Name-keying requires that a Type's fields have distinct names. **No such rule exists today** at any
scope — not in `field.json` (which constrains spelling only: *"Machine-readable name within the
namespace; snake_case"*), not in any invariant, not in `ext:type-inheritance`. The near-misses are
keyed on something else: **I-40** and `ext:type-inheritance` forbid duplicating an inherited
**`fieldId`**, which two *distinct* Fields sharing a `name` do not violate. This RFC therefore
**establishes** the rule, at the weakest sufficient scope:

> Within a Type's **effective field set** — its own `fields`, plus fields contributed through
> `extendsTypeId` inheritance — every referenced `Field.name` MUST be distinct.

**Global** `Field.name` uniqueness is deliberately *not* required, and is not available to be
assumed: the corpus contains **6 duplicate `(namespace, name)` Field pairs**, all inside
`com.semanticops.srs` (`description`, `order`, `name`, `namespace`, `examples`, `vocabulary_ref`),
each a metamodel/non-metamodel pair. Requiring global uniqueness would invalidate the metamodel.
Requiring per-Type uniqueness costs nothing: **0 of 45 Types** currently have an intra-Type name
collision (150 Fields, `fieldGroups` included).

This is the item-4 objection narrowed to what actually bites. Two Fields from different namespaces
sharing a `name` is fine and stays fine; only their co-assignment to one Type is not.

The rule has a direct precedent one tier down: **I-19** — *"`TypedField.name` values must be unique
within a Typed Record"* — is the Tier-1 analogue of exactly this constraint. [R4] gives Tier 2 the
rule Tier 1 has had all along.

Note also that `projection-rules.md:80` describes the override table as *"keyed by the globally-unique
`Field.name`"*. That is a factual claim about the metamodel package, not a rule, and it is false
globally — the 6 duplicate pairs above are the counterexample. [CR-036-17] (theme templates keyed by
`Field.name`) and [FR-037-12] (`srs-fieldname-*` derived from `Field.name`) likewise *presuppose*
that a name picks out one field in scope without requiring it. [R4] is what makes those three
assumptions sound.

### Change G — Tier 1 (`typed-record.json`) reconciliation

RFC-032 left Tier 1 explicitly to this issue: *"`typed-record.json` `TypedField.valueType`/
`selectOptions` and `record.json` `FieldValue.entries` remain as legacy instance carriers, reconciled
with #242."*

`TypedField` is already name-keyed, so Change A does not disturb it. What this RFC reconciles is the
**value vocabulary**: `TypedField.valueType` still carries the pre-RFC-032 closed scalar enum
(`string|text|number|boolean|date|url|select|multiselect`) that RFC-032 abolished, with `selectOptions`
as its companion. Tier 1 has no Type binding, so it cannot resolve a `fieldType` from a Field —
its type annotation is self-contained by design.

`TypedField.valueType`/`selectOptions` are therefore replaced by an **inline `fieldType`** carrying the
same RFC-032 facets available without a Type binding: `datatype`, `cardinality`, `valueDomain`,
`allowedValues`, `format`, `constraints`. `datatype: ref` is **not** permitted at Tier 1 (there is no
`rangeType` to resolve against), and `dependent` is not permitted (no sibling field set to depend on).
This removes the last live pre-RFC-032 vocabulary from the schema surface.

**The spec repository has 0 Tier-1 TypedRecords** (348 Tier-2 Records, 19 Tier-0 Notes), so this is a
schema-only change here. Tier-0 `Note` is untouched — it has no field values.

### Change H — version discrimination, and what is deliberately *not* provided

**Discrimination is structural and free.** `fieldValues` is an **array** at `dataModelRevision ≤ 1`
and an **object** at revision 2. A reader distinguishes them with one type test, per file, with no
ambiguity and no added marker. Repository- and package-level intent is stamped with
`dataModelRevision: 2` (RFC-033 / #265; monotonic integer, absent ⇒ 0), which is migration #2 after
RFC-032's #1. `$schema` is unchanged: these remain 2.0 entities.

**A stamping gap must close in the same landing.** `srs/manifest.json` is `dataModelRevision: 1`, but
of the five local packages only `metamodel` carries the stamp; `base`, `core`, `spec-authoring-core`,
and `spec-rfc-process` are absent ⇒ 0 despite being fully RFC-032-migrated (150 `fieldType`
definitions, 0 `valueType`). Phase B stamps every first-party manifest it migrates.

**No compatibility window is provided, deliberately.** The issue's process gate asks for "a
read-compatibility window"; the owner decision recorded on #256 removes the need for one — there are
no external consumers, so there is no public upgrade path, no long-lived old-format runtime reader,
and no intermediate supported repository format. The window is therefore **zero-length by decision,
not by omission**, and this sentence is the record the gate asks for. Readers encountering an array
`fieldValues` at revision 2 MUST reject it with a diagnostic naming the file and the expected
revision — not silently coerce it ([R9]).

**Rollback is `git revert` of the cutover train.** Data and code move together in one release train,
first-party only; git history is the recovery mechanism per the same owner decision. There is no
downgrade converter, and none is owed.

**Archives and bundles migrate in place.** The `.srsj` bundle envelope carries `dataModelRevision`
already. In this repository the affected artifacts are: `docs/spec/examples/gallery.srsj` (22
`fieldValues` — needs the instance transform), `packages/com.semanticops.core/1.0.0/core-bundle.srsj`
and both `com.mudemocracy.governance` seed bundles (0 `fieldValues` — envelope stamp only). The
`srs/.srs` repository marker is unaffected. Published package **trees** under `packages/` are still
pre-RFC-032 (`valueType`, revision 0) and are **#286's** disposal scope, not this RFC's — recorded here
so the boundary is explicit rather than assumed.

### Change I — the projection output and theme keys follow the carrier

Four Accepted RFCs deferred obligations **to this issue by name**. They are discharged here rather
than left to be rediscovered during Phase B.

**`document-view-output.json`.** RFC-036's schema table records: *"`ProjectedRecord.fieldGroups` /
`$defs.ProjectedFieldGroup` are keyed to `FieldGroup` and are removed with it at the #242 cutover,
which owns the composite projection shape because it owns the value carrier the projection would
serialise."* The replacement shape is **no new construct at all**:

- `ProjectedRecord.fields` is *already* an object (today *"keyed by fieldId"*). It becomes keyed by
  `Field.name`, matching [R1].
- `orderedFieldKeys` carries `Field.name` values instead of field ids.
- `fieldGroups`, `$defs.ProjectedFieldGroup`, and `$defs.ProjectedGroupEntry` are **removed with no
  successor**: a composite value is carried recursively by `fields` under its own key, exactly as in
  the instance. The projection inherits Change B's recursion instead of restating it.

This is the same consolidation the carrier makes at the instance layer — one recursive shape rather
than a parallel group construct — and it is why the obligation could not be discharged before the
carrier existed.

**`theme.json` — [CR-036-18].** `ElementTemplates.groupFieldRowTemplates` is retired with
`FieldGroup`. [CR-036-18] imposes a migration obligation this RFC must carry: *"a migration that
converts a group MUST carry every such key over to `compositeFieldRowTemplates`"*. Both maps are
keyed by `Field.name`, so under Change A the carry-over is a key-for-key copy with no renaming. The
Phase-B transform performs it, and MUST fail rather than drop a `groupFieldRowTemplates` key that
matches no migrated field.

**RFC-007 rule retirement — [CR-036-19].** `[FG-Cx0]`–`[FG-Cx4]`, `[T-Gx1]`–`[T-Gx3]` and
`[T-Cx1]`–`[T-Cx5]` remain in force for `FieldGroup` *"until `FieldGroup` is removed at the #242
cutover, at which point they are retired."* Change E removes `FieldGroup`, so Phase B retires them.

**RFC-037 class aliases — [FR-037-14].** The unprefixed `field-label` / `field-value` CSS aliases are
emitted alongside the `srs-`-prefixed names *"until the #242 cutover, and MUST emit only the prefixed
names thereafter."* Phase B stops emitting them. This is a rendering-output change with no schema or
instance component, listed so the cutover checklist is complete.

**Not discharged here, and deliberately so.** RFC-036 also assigns #242 the muSrs
`ext:themes-l1` manifest under-declaration and the `render_service.rs` `coerce_to_array` string-branch
deletion. Both are Phase-B implementation tasks in the migration plan below, not design questions, and
neither has a Phase-A artifact.

---

## Conformance Rules

> **[R1]** A Tier-2 `Record`'s `fieldValues` MUST be a JSON object. Each key MUST equal the `Field.name`
> of a Field in the effective field set of the Record's `typeId`@`typeVersion`. Unknown keys MUST be
> rejected; the projected schema asserts `additionalProperties: false`.
>
> **[R2]** The key MUST be `Field.name` **verbatim**, with no case or separator transformation. The
> `snake_case → lowerCamelCase` name projection and its override table
> (`projection-rules.md`) apply to the frozen-seed metamodel entities only and MUST NOT be applied to
> instance keys.
>
> **[R3]** The value at each key MUST conform to the Change B rule for that Field's `fieldType`. An
> `inline` `ref` value MUST itself be a `fieldValues` object for `rangeType`, recursively, and MUST be
> validated by the same rule at every depth.
>
> **[R4]** Within a Type's effective field set — own `fields` plus any contributed through
> `extendsTypeId` — every referenced `Field.name` MUST be distinct. An implementation MUST reject a
> Type that violates this at definition time, not at instance time.
>
> **[R5]** A `FieldAssignment` with `required: true` means its key MUST be present in `fieldValues`.
> Absence of a key means the field is unset; a `null` value means explicitly-empty. Implementations
> MUST NOT treat the two as interchangeable.
>
> **[R6]** `fieldMeta`, when present, MUST be an object whose keys are a **subset** of the sibling
> `fieldValues` keys, and whose values are objects of `{source?, editedAt?, sourceRefs?}`. A
> `fieldMeta` key with no corresponding `fieldValues` key MUST be rejected. `fieldMeta` MUST NOT
> appear inside an inline-composite value.
>
> **[R7]** `FieldValue`, `FieldValueEntry`, `FieldGroupValue`, `FieldGroupEntry`, `Type.fieldGroups`,
> and `FieldAssignment.{repeatable, minItems, maxItems}` are REMOVED. An implementation MUST reject a
> document containing any of them at `dataModelRevision ≥ 2`.
>
> **[R8]** A Tier-1 `TypedField` MUST carry an inline `fieldType` in place of `valueType`/`selectOptions`.
> Its `datatype` MUST NOT be `ref` or `dependent`.
>
> **[R9]** A reader MUST determine instance generation structurally: an array `fieldValues` is
> revision ≤ 1, an object `fieldValues` is revision ≥ 2. On encountering a generation it does not
> support, it MUST emit a diagnostic naming the file and the expected `dataModelRevision` and MUST NOT
> coerce, partially read, or silently skip the document.
>
> **[R10]** The migration transform MUST resolve every `fieldId` to a `Field.name`. An unresolvable
> `fieldId` MUST abort the migration of that repository with a diagnostic naming the record, the
> `fieldId`, and the Type — it MUST NOT be skipped, dropped, or key-substituted with the raw UUID.
>
> **[R11]** A DocumentView projection MUST key `ProjectedRecord.fields` and `orderedFieldKeys` by
> `Field.name`, and MUST carry a composite value recursively under its own key. `ProjectedFieldGroup`
> and `ProjectedGroupEntry` are REMOVED and have no successor construct.
>
> **[R12]** The migration MUST copy every `ElementTemplates.groupFieldRowTemplates` key to
> `compositeFieldRowTemplates` ([CR-036-18]). A key matching no migrated field MUST abort the
> migration with a diagnostic — it MUST NOT be silently dropped, because a dropped key is an
> invisible rendering regression.

---

## Schema changes

| Schema file | Change |
|---|---|
| `record.json` | `fieldValues` array → object (Change A/B); add `fieldMeta` (Change C); remove `$defs.FieldValue`, `$defs.FieldValueEntry`, `$defs.FieldGroupValue`, `$defs.FieldGroupEntry`, and the `groupValues` property (Changes D/E); `$defs.SourceReference` retained, now referenced from `fieldMeta` and record-level `sourceRefs` |
| `type.json` | remove `$defs.FieldGroup` and `Type.fieldGroups`; remove `FieldAssignment.{repeatable, minItems, maxItems}` (Change E) |
| `typed-record.json` | replace `TypedField.valueType`/`selectOptions` with an inline `fieldType` restricted per [R8] (Change G) |
| `manifest.json` | **none** — `dataModelRevision` is already an optional monotonic integer (RFC-033 / #265); Phase B stamps values, not shapes |
| `package-bundle.json` | **none to the shape** — `dataModelRevision` already present; the embedded `Field`/`Type`/`FieldAssignment` `$defs` must track `type.json`'s removals, verified by the existing sync check |
| `field.json` | **none** — `fieldType` is unchanged by this RFC |
| `projection-rules.md` | **normative text change** — scope the `snake_case → lowerCamelCase` name projection and its override table to the frozen-seed metamodel entities, and state verbatim `Field.name` keys for domain Types (Change A / [R2]); this is the erratum to RFC-035 [R4] |
| `document-view-output.json` | re-key `ProjectedRecord.fields` and `orderedFieldKeys` from fieldId to `Field.name`; remove `ProjectedRecord.fieldGroups`, `$defs.ProjectedFieldGroup`, `$defs.ProjectedGroupEntry` with no successor construct (Change I; discharges RFC-036's deferral) |
| `theme.json` | remove `ElementTemplates.groupFieldRowTemplates`, retired with `FieldGroup`; keys carry over to `compositeFieldRowTemplates` (Change I / [CR-036-18]) |

Schema changes sync to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`
through the `schemas-2.0.tar.gz` release artifact and each mirror's own pipeline — **not** by editing
sibling trees from this repository.

**No schema file is edited in Phase A.** Editing `record.json` now would invalidate all 348 Tier-2
Records on the same commit; the table above is the Phase-B contract, reviewed here before any code.

---

## Migration plan

### Ordering

Phase A (this RFC, Accepted) unlocks **#284** only. Before Phase B may begin, the interstitial
prerequisites recorded on #242 must land: **#284** (re-express the four legacy `valueType` subset
rules), **#286** (repair the migration transform; dispose the remaining pre-RFC-032 package trees),
**#294/RFC-037 + srs-rust#782** (field-row path — Accepted Rev 3, implemented), **#295** (package-ID
collision), and the muSrs revision-0 / `ext:themes-l1` / released-package-freeze decisions.

### The transform

Deterministic, single-pass, per instance file:

1. Resolve `typeId`@`typeVersion` → effective field set. **Abort on any unresolvable `fieldId`** ([R10]).
2. `fieldValues[]` → object: for each pair, key = `Field.name`, value per Change B.
3. `entries: [{value: v₁}…] → [v₁…]` (Change D).
4. `groupValues[{groupId, entries[{fieldValues[]}]}]` → the group's new Field key → array of
   recursively-transformed `fieldValues` objects (Change E).
5. Per-value `source`/`editedAt`/`sourceRefs` → `fieldMeta[key]` (Change C).
6. Copy every `groupFieldRowTemplates` key to `compositeFieldRowTemplates`; abort on an unmatched key ([R12]).
7. Add the `ext:themes-l1` declaration missing from `muSrs/manifest.json` (RFC-036's deferral).
8. Stamp `dataModelRevision: 2` on the repository manifest and every first-party package manifest.

Steps 2–5 are byte-deterministic given a fixed key order; the emitter's ordering discipline
(`projection-rules.md` "Ordering") is reused so re-running the transform is idempotent.

Alongside them, Phase B retires what the carrier's removal releases: RFC-007's `[FG-Cx*]`,
`[T-Gx*]` and `[T-Cx*]` rules ([CR-036-19]), RFC-037's unprefixed CSS aliases ([FR-037-14]), and
`render_service.rs`'s `coerce_to_array` string branch — deleted rather than ported, since no field
value is a JSON-bearing string once structure is expressible.

### Known blocker to fix before the transform runs

Field `f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5c` is referenced by four Types —
`com.semanticops.srs/meta.{spec-part, concept, specification, requirement}@1` — and is **defined
nowhere** in this repository. `srs repo validate` reports **0 errors** over it. Today it is inert,
because instances carry the UUID and nothing must resolve it; under name-keying the transform *must*
resolve `fieldId → name`, so it becomes a hard stop by [R10]. This is the same failure shape #276
caught — invalid data that `repo validate` passes silently. It must be resolved (define the Field, or
remove the four assignments) before Phase B. Filed as a Phase-B prerequisite, not fixed here.

### Conformance evidence required at cutover

- Old → new → **round-trip equivalence** over every first-party value. Baseline for this repository:
  **1284** `fieldValues` (recursive, including inside `groupValues`), **61** `entries` (138 items),
  **9** `groupValues` carriers / **65** entries, **1** per-value `source`. muSrs adds ~235 values,
  14 carriers, 30 entries, 102 rows, **0** ragged, **0** `widths`.
- `srs repo validate` 0 errors, `validate-all.mjs` green, `check-release-drift` green after re-render.
- `check-cardinality-coherence.mjs` — passes vacuously once the trio is gone; kept as the partial-deletion guard.
- The 12 composite/table tests in `crates/srs-repository/src/render_service.rs` re-based onto structured input;
  `composite_table_no_raw_json_in_output` becomes trivially true.
- A spec-side DocumentView fixture exercising the RFC-037 row baseline over a composite (inline, list) field.

### Blast-radius matrix

| Surface | Definition change | Instance change | Owner |
|---|---|---|---|
| `srs` spec repo (`srs/records/`) | Type `table@2` group → composite Field | **348 Records, 1284 values, 9 group carriers** | Phase B |
| `srs` local packages (5) | `fieldGroups` removal; stamp revision 2 | none (definitions only) | Phase B |
| `srs` schemas (`docs/schema/2.0/`) | `record`, `type`, `typed-record` | — | Phase B |
| `srs` rendered exports (`docs/spec/`) | — | re-render; `check-release-drift` | Phase B |
| `srs` `.srsj` artifacts | envelope stamp | `gallery.srsj` (22 values) | Phase B |
| `packages/` published trees | pre-RFC-032, revision 0 | — | **#286**, not this RFC |
| muSrs | `section.table` / `section.commentary` groups → composites | **~235 values, 14 carriers, 102 rows** | Phase B |
| `srs-rust` | core types, services, validation, render, projection, payload contract | fixtures | Phase B, same train |
| `srs-web` | consumes catalog/render services | — | Phase B, same train |
| `srs-vscode` | schema mirror | — | mirror pipeline |

### Relationship to RFC-038 (#296)

RFC-038 changes **where instances live** (tree-authoritative membership, standalone relation files);
this RFC changes **what an instance's values look like**. The designs are independently reviewable and
have no shared normative surface. But first-party data must move **once**, not twice: the spec repo,
muSrs, packages, and maintained fixtures go directly to the final combined contract in the composed
**#242 / #297 release train**, at a single `dataModelRevision: 2`. Neither RFC's cutover ships alone.
Where they touch — `manifest.json`'s stamped revision and `.srsj` enumeration — RFC-038's decisions
govern placement and this RFC's govern value shape.

---

## Rationale

**Why name-keying rather than `fieldId`-keying.** UUID-keying would fix uniqueness and ordering but
produce schemas whose properties are UUIDs — barely more useful to an external consumer than today,
and failing epic #256's requirement that the projection be *directly* consumable. It would also leave
Tier 1 (name-keyed) and Tier 2 (UUID-keyed) permanently inconsistent, in an epic whose stated purpose
is consistency. Name-keying additionally makes the instance human-readable and diff-legible, which
matters in a Git-stored, agent-authored corpus.

**The mutable-attribute objection does not survive contact with the spec.** The standing argument
against name-keying is that `Field.name` is "mutable-ish". It is not mutable at all. Two canonical
records settle it:

> "Field and Type names are programmatic keys in `snake_case`. Names are stable within a namespace
> and version lineage. **A new name means a new definition.**"
> — `srs/records/subsections/02-4-name-convention.json:11` (record `7d22d50f-2dc2-51cb-ac43-dd1b0903d869`)

> "| `name` changed | **New definition required (new UUID)** |"
> — `srs/records/subsections/03-1-version-semantics.json:11` (record `8e3fb02c-3863-55a9-8bcd-0580e0c7b3a9`)

restated for agents at `srs-usage.md:1804`. The change→action table routes `fieldType` and
`aiGuidance` changes to *"version bump required"* and `name`/`namespace` changes to *"new UUID"* — so
no rule permits a rename even **across** a version bump. A `Field.name` is fixed for the entire
lifetime of its UUID.

This is stronger than the objection assumes, and stronger than immutability-at-`id@version` would
be. `Field.name` is not merely stable enough to key an instance that pins a `typeVersion`; it is as
stable as the `fieldId` it replaces, because changing it *is* changing the `fieldId`. Name-keying
puts nothing mutable into the instance.

**Why the third option was not taken.** "Name-keyed instances plus a fieldId map in the Type" adds a
lookup table to carry information the Type's `fields[]` already carries. `fieldId` is recoverable
from `typeId` + `typeVersion` + key without it.

**Why the recursion is stated once.** Defining the value space as `projectField`'s instance space —
rather than as an independent instance grammar — means there is exactly one place where "what values
are legal" is decided. A second grammar would be a second source of truth, and drift between them
would be undetectable by construction.

**Why removal, not deprecation, for `entries` and `groupValues`.** The epic's own finding is that a
half-implemented instance-format change is strictly worse than not starting: two valid Record shapes
in the wild is the failure this epic exists to eliminate. With no external consumers, the cost of a
clean break is bounded and measured; the cost of a dual-shape window is permanent ambiguity.

---

## Alternatives Considered

### Alt A — do nothing: keep the array shape

The process gate requires this be evaluated explicitly and recorded either way, and it is a
legitimate outcome if items 1–6 cannot be resolved cleanly. **Evaluated and rejected**, for reasons
that are now measured rather than argued:

- Epic #256's stated design requirement — a Type projects to a standard JSON Schema by direct
  implementation — would be **unmet permanently**, and the epic would have to be amended to say so.
- Composite range (RFC-032's sanctioned mechanism) would stay **permanently uncarried**, so
  `FieldGroup` could not be deprecated in practice despite being deprecated on paper, and tables —
  *"a pretty vital element in practice"* — would keep depending on a retired construct. The
  ~29 carriers and ~175 rows across the two repositories grow with every new table.
- The `x-srs-field-id` bridge keyword and the two-grammar split between Tier 1 and Tier 2 become
  permanent fixtures.
- The break is **cheapest now**: nothing is in the wild. Deferring past this epic means eventually
  running a breaking instance migration over communities' own data.

The items that made "do nothing" attractive have since been answered with corpus measurement rather
than argument — item 2 is a one-value migration, item 3 is 61/61 deterministic, item 4 is 0/45
collisions. What remained was design work, and this RFC is it.

### Alt B — wrapper object per value (`{value, source, editedAt}`)

Preserves per-value metadata with no new sibling, and is the obvious shape. Rejected in Change C: it
reintroduces the indirection the RFC exists to remove, and the projected schema would describe the
wrapper rather than the domain value — the requirement fails in a new way rather than being met.

### Alt C — keep `groupValues` alongside the new carrier

Would let the cutover skip the 9 + 14 group carriers. Rejected: it is exactly the dual-shape state
the process gate forbids, and it would keep `FieldGroup` alive indefinitely, defeating RFC-032
Change E.

### Alt D — lowerCamelCase instance keys (the literal reading of RFC-035 [R4])

Would unify instance keys with the metamodel's emitted JSON Schema keys and avoid narrowing an
Accepted rule. Rejected on three grounds, in increasing order of severity:

- It makes instance keys differ from the authored `Field.name`, so the round trip needs a transform
  to be kept in step — reintroducing in a new place the coupling this RFC removes.
- The override table would have to become extensible per domain package, a new configuration surface
  with no consumer.
- **It is not implementable over the corpus.** The transform is specified `snake_case →
  lowerCamelCase`; 33 Field names are kebab-case, for which it has no defined behaviour. Adopting Alt
  D would require first resolving Open Question 2 by renaming 33 Fields — 33 new UUIDs — making a
  key-spelling choice into the largest migration in the epic.

The reference emitter already behaves as Change A specifies (`proposal-artifact-path`, verbatim), so
narrowing [R4] documents what is true rather than changing behaviour.

---

## Open Questions

1. **Metamodel self-application.** The metamodel entities (`Field`, `Type`, …) are projected with the
   `snake_case → lowerCamelCase` transform so their emitted schemas match the hand-authored frozen
   seed. If the metamodel's own records are ever stored as Tier-2 Records under this carrier, [R2]
   (verbatim keys) and the seed's camelCase keys disagree, and the override table would have to apply
   to instances too. This does not arise at Phase B — the metamodel package is definitions, not
   Records — but #260's authorship flip should settle it before it can.

2. **The 33 kebab-case `Field.name`s — an owner decision Phase B depends on.** Name-keying promotes
   `Field.name` from an internal label to a **wire key** in every instance file and every projected
   schema. Of 150 Field definitions, 59 are snake_case, 58 single-word, and **33 are kebab-case**
   (`proposal-artifact-path`, `rfc-status`, `tag-key`, …) — while `field.json` and record
   `7d22d50f-2dc2-51cb-ac43-dd1b0903d869` both require **snake_case**. `srs repo validate` reports 0
   errors over all 33. Two dispositions, and the choice is not this RFC's:

   - **Accept kebab keys** and relax the convention text to match a decade of practice; or
   - **Rename the 33 Fields to snake_case** — which by the rule cited in the Rationale means **33 new
     UUIDs and 33 new Field definitions**, plus reassignment in every referencing Type. That is
     substantially larger than the carrier migration itself.

   Phase A does not depend on the answer — [R2] says *verbatim `Field.name`*, whichever spelling
   wins. **Phase B does**, because the key strings differ. Must be settled before the transform runs.

3. **Where the four `meta.*` Types' missing Field is resolved.** Defining it versus removing the four
   assignments is a spec-content decision, not a carrier decision. It must be settled before the
   Phase-B transform runs ([R10]), but it is not this RFC's to take.

4. **No rule freezes an already-published `id@version`.** Searching for one turned up only the
   converse — I-9: *"`Field.id` is stable across versions. A new `id` means a new definition"* — and
   the version-semantics table, which says when a bump is *required* without forbidding in-place
   edits to a published version. This does not affect the carrier (a `Field.name` cannot change at
   all, per the Rationale), but it is a real gap in the version-lineage rules and is recorded here
   rather than left unnoticed.
