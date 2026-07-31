> **GitHub issue**: [the-greenman/srs#242](https://github.com/the-greenman/srs/issues/242)

# RFC-039: Name-keyed `fieldValues` — the recursive Record value carrier

**Status**: Draft (Revision 3)
**Affects**: `Record` (Tier 2), `TypedRecord` (Tier 1), `FieldValue`, `FieldValueEntry`, `FieldGroupValue`/`FieldGroupEntry` (`ext:field-groups`), `ext:repeatable-fields`, `FieldAssignment.{repeatable,minItems,maxItems}`, `Type.fieldGroups`, `dataModelRevision`; `docs/schema/2.0/{record,typed-record,type}.json` and `docs/schema/2.0/projection-rules.md`. Builds on RFC-032 (Accepted — composite field range), RFC-035 (Accepted — schema emitter / projection rules; **this RFC narrows its [R4]** ([R2a]) to the in-scope meta-model Types), RFC-036 (Accepted — composite rendering), RFC-037 (Accepted Rev 3 — field-row baseline). Composed with RFC-038 (#296, Draft) in one first-party cutover. **Breaking (instance layer).**
**Author**: the-greenman (epic-256 worker)
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft. Phase A of #242: design and migration plan only, no implementation. |
| 2 | 2026-07-31 | Review round 1. **Blocking fixes:** added **Change E.2** (the definition-layer `FieldGroup` → composite transform, with naming/UUID/version-bump rules — previously the instance transform referenced a Field key nothing produced); **removed `null`** from the value space ([R5]) because it falsified the by-construction claim against RFC-032 Change G's null-free projection (0/1318 in corpus); added **Change I** discharging RFC-036's `document-view-output.json` / `theme.json` / [CR-036-19] deferrals and RFC-037 [FR-037-14]'s alias sunset; added **Change J** + [R14] discharging the reference-integrity deferral three Accepted RFCs left to #242; added the **Fold-in targets** section (I-22–I-27 retired; new invariants owed; anticipated integration manifest); made the transform **total** over eight schema-legal branches; added the **muSrs corpus audit** prerequisite. **Corrected baseline** to **1318** values / **355** Tier-2 Records after finding a second record root (`package/records/`, 7 instances, no `$schema`) — [R13] now forbids glob enumeration. **Should-fixes:** [R16]–[R18] (uniform list-wrapping, what the projected schema describes, instance key order); blast radius evidenced for `srs-rust` (39 files / 6 crates, incl. `srs-gov`) and `srs-web` flagged unevidenced; `x-srs-field-id` retirement stated; RFC-019 conflict named; Change C rebuts the issue's actual third option; added **Cross-references**; OQ2 given a landing place; OQ1 declines RFC-033:407 explicitly rather than silently. |
| 3 | 2026-07-31 | Spec-integrity review round 1 (4 blocking, all corpus-scope or transform-correctness). **The first-party corpus is four repositories, not one:** added `conformance/discovery/fixture-repo/` (8 T2 + **2 T1**, 54 values, 15 `valueType` Fields) and `docs/spec/examples/gallery-project-v2/` (22 T2, 100 values, 20 `valueType` Fields) — both **pre-RFC-032**, so the carrier transform cannot run on them until they are migrated (OQ7). This falsified the "0 Tier-1 TypedRecords" claim, which was `srs/srs`-scoped and read as global: **Change G is a live data migration, not schema-only**. Corrected `gallery.srsj` from "22 values" to **22 records / 100 values**, and withdrew the false claim that `.srsj` envelopes carry `dataModelRevision` — **none of the four does**, and no schema exists for the archive envelope at all. **Change E.2 was carrying a removed property into the Type it mints** (`G.fields[]` "unchanged" would copy `repeatable: true`), and no step stripped the **8 live `repeatable` occurrences across 3 Types** — two of which have no FieldGroup and would never have been visited; the transform is now split into an explicit **Phase 0 (definitions) → Phase 1 (instances) → Phase 2 (repository)**, resolving the circularity where step 1 resolved against the pre-bump Type version. **Should-fixes:** Tier 1 is name-*labelled*, not name-*keyed* (`fields` is an array) — Problem 2, Change G and the Rationale corrected, and OQ6 records that the tiers end up structurally more divergent; added **[R19]** (a referenced Type version MUST NOT be deleted) since the Record→Field edge is now Type-mediated; added the **valueless-`FieldValue`** row — the only non-zero case, 2 occurrences — and stated the one-way round-trip loss it causes; split **[R2] → [R2a]/[R2b]** (emitter-scope erratum vs instance rule) using `projection-rules.md`'s own defined term; stated the `mode`/`cardinality` facet defaults so Change B is total; corrected the `dependent` row's citation ([R6] → [R3]); rewrote the `package-bundle.json` row (nothing to remove — the real gap is `$defs.Type` being `additionalProperties: true`, so [R7] is unenforceable in bundles); [R7] now says revision is resolved from the enclosing manifest, since definition files carry no local discriminator. **Nits:** reconciled the carrier/row arithmetic to **23 carriers / 167 rows**; the sixth package manifest (`srs/package/package.json`); `projection-rules.md:80`; release-train numbering. |

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

Tier 1 shows the same split from the other side. `docs/schema/2.0/typed-record.json` `$defs.TypedField`
**identifies** each value by name, and already states the uniqueness rule this RFC needs at Tier 2:

> `"name"`: `"Field key; snake_case recommended; unique within the TypedRecord."`

Tier 1 is precisely **name-labelled**, not name-keyed: `TypedRecord.fields` is *"an ordered list of
named, typed fields"* — an array, like Tier 2's. The claim here is therefore the narrower and true
one: **Tier 1 identifies a value by its name; Tier 2 identifies it by a UUID.** Neither is an object
map today. Name-keying Tier 2 aligns the two on *identification*, which is what makes the projection
work; it does not by itself align them structurally (see Change G and Open Question 6).

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
spec records and 65 rows are affected here (measured); the muSrs corpus has ~29 carriers and ~175
rows over a **five-field** group (figures recorded on #242, not re-measured here — muSrs is outside
this repository; its carrier/row figures reconcile to 14 carriers / 102 rows, giving 23 / 167 across
both repositories). Any carrier design must be sized against muSrs's five-field `section.table`, not
the spec's simpler list-of-strings shape.

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

- `projection-rules.md:80` scopes the guarantee to *"the in-scope **metamodel** field names"*, and
  RFC-035 `[R1]`/`[R5]` scope their obligations to *"in-scope meta-model Types"*. No sentence states
  that the transform binds domain Types.
- **The reference emitter already emits domain names verbatim.** Projecting
  `com.semanticops.spec/rfc@1` yields the property `proposal-artifact-path` — not
  `proposalArtifactPath`.
- **The transform is undefined over the corpus.** RFC-035 [R4] specifies `snake_case → lowerCamelCase`, but
  of 150 Field definitions, 59 are snake_case, 58 single-word, and **33 are kebab-case** — for which
  a snake_case-input transform has no defined behaviour.

**Change A therefore narrows RFC-035 [R4] to the frozen-seed metamodel entities**, whose emitted
keys must match hand-authored JSON Schema spellings (`min_items` → `minItems`), and fixes verbatim
keys everywhere else. This is an erratum-style clarification to an Accepted RFC, in the manner of
RFC-032 Rev 6; without it, RFC-035 [R4] and this RFC would contradict each other, and the reference emitter
would be non-conformant against RFC-035 [R4] today. See [R2a]/[R2b], Alt D, and Open Question 1.

The payoff is the property the whole RFC turns on: instance keys and projected schema keys are
identical **by construction**, with no transform to keep in step and no bridge keyword.

`fieldId` is not stored in the instance. It is recoverable at any time from `typeId` + `typeVersion`
+ the key, which is the same resolution the reader already performs to find the Field's `fieldType`.

### Change B — one recursive value rule, identical to `projectField`'s instance space

For a Field `F` assigned at key `k`, the value at `k` is determined **solely** by `F.fieldType`.
Facet defaults apply before the table is read: an absent `cardinality` means `single`, and an absent
`mode` on a `ref` means `inline` (both per `field.json`), so every Field matches exactly one row.

| `fieldType` | Value shape |
|---|---|
| scalar `datatype`, `cardinality: single` | the JSON scalar for that datatype (per the portable scalar table) |
| scalar `datatype`, `cardinality: list` | array of those |
| `datatype: ref`, `mode: inline`, `single` | **an object that is itself a `fieldValues` map for `rangeType`** |
| `datatype: ref`, `mode: inline`, `list` | **array of such objects** |
| `datatype: ref`, `mode: reference`, `single` | instance-id string (uuid) |
| `datatype: ref`, `mode: reference`, `list` | array of instance-id strings |
| `datatype: map` | object, string keys → `valueRange` scalar (or unconstrained when `valueRange: "open"`) |
| `datatype: dependent` | a value conforming to the descriptor named by `dependsOn` ([R3] validation obligation) |

**`null` is not a value.** `record.json` currently permits `null` in `FieldValue.value`'s `oneOf`.
This RFC removes it: **absence of the key is the sole representation of "unset"** ([R5]). The reason
is that `null` would falsify the property the whole RFC is bought for. RFC-032 Change G and
`projection-rules.md` project a scalar to `{type: "string"}` — with **no null branch** — so a Record
carrying an explicit `null` would *not* validate against its Type's projected schema, and
"valid by construction" would be false. The alternative repair — an erratum making every optional
field project `type: [X, "null"]` — buys nothing and makes every generated schema uglier.

This costs nothing: **0 of 1318 values in this repository are `null`**. See [R5], and Open Question 5
for the muSrs check.

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
  "outro":   "This convention must be consistent across implementations. See Invariant 16.",
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
"fieldValues": { "proposal-artifact-path": "rfcs/rfc-004.md" },
"fieldMeta":   { "proposal-artifact-path": { "source": "human" } }
```

`fieldMeta` is an optional sibling object, keyed **identically** to `fieldValues`, whose values are
`{source?, editedAt?, sourceRefs?}` — the same three facets, unchanged in meaning.

Why this rather than the alternatives:

- **A wrapper object per value** (`{value: …, source: …}`) is rejected outright. It reintroduces the
  exact indirection this RFC removes: the projected schema would describe the wrapper, not the
  domain value, and `additionalProperties: false` over a wrapper says nothing about the data. It
  would defeat the RFC's purpose to preserve a facet used once.
- **Moving provenance to the instance level** — the issue's own third option — is rejected because it
  is lossy in a way the other two are not. Record-level `sourceRefs` already exists and is heavily
  used (231 of 355 Records); it answers *"where did this record come from"*. It cannot answer
  *"which field did the model write"*, because it has no field to attach to. Folding per-value
  provenance into it would silently reinterpret a field-scoped claim as a record-scoped one. That is
  a semantic loss, not a relocation, and this is a semantic record system.
- **Deleting per-value provenance** outright is cheap but wrong on merit. RFC-017 designed
  `sourceRefs` as forward capability; low exercise is not low value, and an AI-assisted authoring
  system has a real, ongoing interest in field-level attribution. Relocating a capability losslessly
  is strictly better than deleting it.

The corpus supports the shape rather than dictating it. Measured over this repository at
`origin/master` `c9797f0`, enumerating from `manifest.json`'s `instanceIndex` (the authoritative
member list): **231 of 355 Tier-2 Records carry record-level `sourceRefs`**; **per-value `source` is
used once** (RFC-004's `proposal-artifact-path`, value `"human"`); per-value `editedAt` and
`sourceRefs` **never**. Provenance is already, overwhelmingly, a record-level idiom here — so
`fieldMeta` codifies what practice already does while keeping the per-field granularity available for
the case that motivated it. The migration is one value.

**Granularity rule.** `fieldMeta` mirrors the keys of the **owning** `fieldValues` map only. It does
**not** descend into inline-composite interiors, and it does **not** address individual items of a
`cardinality: list` value — provenance attaches to the field, not to element *n*. A nested
composite's values, and a list's items, inherit the provenance of their carrying field. Concretely,
for a composite-**list** field `rows`, `fieldMeta.rows` is **one object covering the whole field** —
never an array parallel to the values, and never a nested map into row interiors. This bounds
the recursion to one level per Record and matches the corpus exactly: zero per-value metadata inside
`groupValues`, and zero `source`/`editedAt` on any of the 138 `entries` items (which is what today's
`FieldValueEntry.{source, editedAt}` would have carried). Nothing is stranded by dropping per-item
granularity because nothing uses it. A recursive or per-item extension remains available additively
under a reserved sub-key without a breaking change.

The example above is also the entire migration: RFC-004's record is the single per-value `source` in
the corpus. Note its key is `proposal-artifact-path` — kebab-case, as authored. Under [R2b] the key is
verbatim, which is why Open Question 2's spelling decision changes these strings and must be settled
before Phase B runs.

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
  rather than being stranded. No `FieldAssignment` carries either of those two properties.
- **`repeatable`, however, is live in 8 places**, and the definition transform must strip every one:
  `com.semanticops.spec/table@2` (`columns` `true`, group `rows`'s `cells` `true`),
  `com.semanticops.base/repo_settings@1` (×4 `false`), `com.semanticops.core/purpose@1` (×2 `false`).
  Leaving any of them makes its Type schema-invalid the moment [R7] lands — including the two Types
  that have no FieldGroup at all and would otherwise never be touched by the migration.
- **No per-assignment cardinality override is owed.** RFC-032 [R8] Rev 6 errata and Invariant 2 settle
  that cardinality is Field-level by construction; `required` remains overridable, cardinality never was.
- **0 Types use `extendsTypeId`** today, so no inherited group complicates the transform — though RFC-039 [R4]
  is still written to cover inheritance.

### Change E.2 — the definition transform that produces the composite

Change E states the target shape; this states how a `FieldGroup` becomes it, because the instance
transform cannot run until the new Field and its range Type exist. The rules are deterministic so the
migration is reproducible.

For a `FieldGroup` `G` on Type `T`:

| Source | Destination |
|---|---|
| `G.groupId` | the new Field's `name`, **verbatim** ([R2b]) |
| `T.namespace` | the new Field's `namespace` |
| `G.fields[]` | the `FieldAssignment[]` of a **new range Type** `R`, carried over **with `repeatable`/`minItems`/`maxItems` stripped** — copying them unchanged would put properties [R7] removes into a freshly-minted Type, which `type.json`'s `additionalProperties: false` then rejects |
| — | `R.name` = `<T.name>-<G.groupId>`; `R.namespace` = `T.namespace`; `R.version` = 1 |
| `G.repeatable: true` | new Field `fieldType.cardinality: "list"` (`false`/absent → `"single"`) |
| `G.minItems` / `G.maxItems` | new Field `fieldType.minItems` / `maxItems` |
| — | new Field `fieldType`: `{datatype: "ref", mode: "inline", rangeType: {typeId: R.id, typeVersion: 1}}` |
| `G.label` | the new `FieldAssignment.displayLabel` on `T` (presentation, per RFC-015) |
| `G.order` | the new `FieldAssignment.order` on `T` |
| `G.compositeRenderer` | an RFC-036 `FieldView.compositeRenderer` binding — **not** a Type property, per RFC-036 and this repository's presentation rule |

New `Field.id` and `Type.id` are freshly minted UUIDv4s recorded in the migration log, so the
transform is auditable and re-runnable against its own record rather than by regeneration.

**`T` gets a version bump, and instances are rewritten to it.** The canonical version-semantics table
(record `8e3fb02c-3863-55a9-8bcd-0580e0c7b3a9`) does not enumerate a Type `fields[]` change, but its
catch-all governs: *"if a downstream consumer's AI extraction, validation, or governance logic would
behave differently, a version bump is required."* Replacing a group with a composite Field changes
validation, so it does. Concretely `com.semanticops.spec/table@2 → @3`, and the **9** table records
have their `typeVersion` rewritten from 2 to 3 in the same transform step. `table@2` is retained, not
deleted — it is the version the pre-cutover history validates against.

Worked for `table@2`: `G = rows` (repeatable, `minItems: 1`, one field `cells`) becomes Field
`com.semanticops.spec/rows` with `fieldType {datatype: ref, mode: inline, cardinality: list,
minItems: 1, rangeType: table-row@1}`, over a new Type `com.semanticops.spec/table-row@1` whose sole
assignment is `cells` (required, order 0). `displayLabel: "Rows"`, `order: 3`.

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
within a Typed Record"* — is the Tier-1 analogue of exactly this constraint. RFC-039 [R4] gives Tier 2 the
rule Tier 1 has had all along.

Note also that `projection-rules.md:80` describes the override table as *"keyed by the globally-unique
`Field.name`"*. That is a factual claim about the metamodel package, not a rule, and it is false
globally — the 6 duplicate pairs above are the counterexample. [CR-036-17] (theme templates keyed by
`Field.name`) and [FR-037-12] (`srs-fieldname-*` derived from `Field.name`) likewise *presuppose*
that a name picks out one field in scope without requiring it. RFC-039 [R4] is what makes those three
assumptions sound.

### Change G — Tier 1 (`typed-record.json`) reconciliation

RFC-032 left Tier 1 explicitly to this issue: *"`typed-record.json` `TypedField.valueType`/
`selectOptions` and `record.json` `FieldValue.entries` remain as legacy instance carriers, reconciled
with #242."*

`TypedRecord.fields` stays an **ordered array**, not an object map. Change A's key-vs-UUID problem
does not exist at Tier 1 — `TypedField` already carries its own `name` — so re-shaping it would be
churn for its own sake, and the array preserves the authored order that a Tier-0/Tier-1 free-form
record depends on (there is no `FieldAssignment.order` to recover it from). The consequence is
recorded honestly: after this RFC the two tiers *identify* values the same way and *structure* them
differently. See Open Question 6.

What this RFC reconciles is the
**value vocabulary**: `TypedField.valueType` still carries the pre-RFC-032 closed scalar enum
(`string|text|number|boolean|date|url|select|multiselect`) that RFC-032 abolished, with `selectOptions`
as its companion. Tier 1 has no Type binding, so it cannot resolve a `fieldType` from a Field —
its type annotation is self-contained by design.

`TypedField.valueType`/`selectOptions` are therefore replaced by an **inline `fieldType`** carrying the
same RFC-032 facets available without a Type binding: `datatype`, `cardinality`, `valueDomain`,
`allowedValues`, `format`, `constraints`. `datatype: ref` is **not** permitted at Tier 1 (there is no
`rangeType` to resolve against), and `dependent` is not permitted (no sibling field set to depend on).
This removes the last live pre-RFC-032 vocabulary from the schema surface.

**Tier 1 is not unused, and this is not a schema-only change.** `srs/srs` itself has 0 TypedRecords
(355 Tier-2, 19 Tier-0), but **`conformance/discovery/fixture-repo/` has 2 TypedRecords carrying 4
`TypedField`s with `valueType`** — live instances that [R8] invalidates. They migrate at Phase B; see
"The first-party corpus is four repositories, not one". Tier-0 `Note` is untouched — it has no field
values.

### Change H — version discrimination, and what is deliberately *not* provided

**Discrimination is structural and free.** `fieldValues` is an **array** at `dataModelRevision ≤ 1`
and an **object** at revision 2. A reader distinguishes them with one type test, per file, with no
ambiguity and no added marker. Repository- and package-level intent is stamped with
`dataModelRevision: 2` (RFC-033 / #265; monotonic integer, absent ⇒ 0), which is migration #2 after
RFC-032's #1. `$schema` is unchanged: these remain 2.0 entities.

**A stamping gap must close in the same landing.** `srs/manifest.json` is `dataModelRevision: 1`, but
of the **six** package manifests under `srs/package/` only `metamodel` carries the stamp. `base`,
`core`, `spec-authoring-core`, `spec-rfc-process`, and the root `srs/package/package.json`
(`srs-specification-package`, 13 types / 43 fields — easy to miss, since it sits beside the package
directories rather than inside one) are all absent ⇒ 0, despite `srs/package/**` carrying **0**
`valueType` definitions and being fully RFC-032-migrated. Phase B stamps every first-party manifest
it migrates.

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

**Archives and bundles migrate in place, and none of them is stamped today.** `manifest.json`
*permits* `dataModelRevision`, but **none of the four `.srsj` artifacts carries it** — not at the top
level and not in the inner `manifest`. Phase B adds it. The affected artifacts are:

| Artifact | Instance content |
|---|---|
| `docs/spec/examples/gallery.srsj` | **22 records / 100 field values** — needs the full transform, and RFC-032 migration first |
| `packages/com.semanticops.core/1.0.0/core-bundle.srsj` | 0 field values — envelope stamp only |
| `packages/com.mudemocracy.governance/{1.0.0,1.1.0}/seed/empty-governance-document.srsj` | 0 field values — envelope stamp only |

There is also **no schema in `docs/schema/2.0/` for the `{srsj, manifest, data}` archive envelope**
(`package-bundle.json` is a different artifact with no `records`/`instances` property), so
"archives migrate in place" currently has no schema anchor. Phase B must decide whether the envelope
needs one; this RFC records the gap rather than inventing the schema.

The `srs/.srs` repository marker is unaffected. Published package **trees** under `packages/` are
still pre-RFC-032 (`valueType`, revision 0) and are **#286's** disposal scope, not this RFC's —
recorded so the boundary is explicit rather than assumed.

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

### Change J — reference integrity for `mode: "reference"` values

Three Accepted RFCs defer this to #242 by name: RFC-032 OQ4 (*"Reference dangling targets.
Enforcement for a `reference` value at an absent/type-mismatched instance — deferred to #242"*),
RFC-033:302, and RFC-035:592 (*"deferred to reference-integrity validation (#242). Recorded, not
resolved."*). Change B rows 5–6 give the wire shape; without a rule the three deferrals stay open
while appearing closed.

A `reference`-mode value is an instance id. RFC-032 [R5] already fixes that it is *"a value, not a
`Relation`"*, so no relation machinery applies. This RFC adds the integrity obligation as [R14]:
the target MUST exist in the repository's `instanceIndex` and MUST be an instance of the Field's
declared `rangeType` at the declared `typeVersion`. A dangling target is an **error**; a
type-mismatched target is an **error**. Both name the referring record, the key, and the target id.

This is deliberately the *minimum* that discharges the three deferrals. Cross-repository and
federated references are out of scope and remain with RFC-038 (#296), whose discovery-root decisions
determine what "exists in the repository" means.

---

## Fold-in targets (canonical spec, issue #204)

The `rfcs/*.md` file is proposal and design history; the canonical spec is `srs/records/` +
`docs/schema/2.0/`. **No record is folded in Phase A** — the schema and record changes below are the
Phase-B contract, reviewed here before any code, because folding them now would invalidate all 355
Tier-2 Records on the same commit.

**Records this RFC retires.** Changes D and E falsify six invariants outright:

| Record | Why it goes |
|---|---|
| **I-22** | *"If `FieldAssignment.repeatable` is false or absent, its corresponding `FieldValue` …"* — the trio is removed |
| **I-23** | same, `repeatable: true` branch, and `FieldValue.entries` |
| **I-24** | *"`FieldAssignment.minItems` and `maxItems` are valid only when `repeatable === true`"* |
| **I-25** | *"Every `groupId` in `Record.groupValues[]` …"* — `groupValues` is removed |
| **I-26** | *"Within a `FieldGroupEntry.fieldValues[]`, every `fieldId` …"* |
| **I-27** | *"A `FieldGroupValue.entries` list must satisfy `FieldGroup.minItems` and `maxItems`"* |

Also retired or rewritten: the extension records `ext:field-groups` and `ext:repeatable-fields`
(see [R15]), their subsections, the comparison table
`t002-repeatable-vs-field-groups-vs-records`, and the `fieldValues[]` prose in the record-tiers
subsection and the `record` type-definition record.

**Invariants this RFC adds.** [R1]–[R19] are proposed normative rules with no carrier records yet.
Phase B authors one invariant record per rule that is a repository-checkable property — at minimum
[R1] (object-keyed, keys resolve), [R2b] (verbatim instance keys), [R4] (effective-set name
uniqueness), [R5] (`null` rejected), [R6] (`fieldMeta` key subset), [R7] (removed constructs
rejected), [R9] (structural generation discrimination), [R14] (reference integrity), and [R19] (a
referenced Type version is not deleted) — numbered from the current high water mark. [R2a] amends
`projection-rules.md` rather than producing an invariant, and [R10]–[R13] govern the one-off
migration rather than the steady state, so neither group needs a carrier record.

**Anticipated `srs-integration:v1` manifest at Phase B** (not declared now, because none of it
resolves yet):

```
schema:record.json
schema:type.json
schema:typed-record.json
schema:document-view-output.json
schema:theme.json
type:com.semanticops.spec/table
<the I-<n> tokens for the invariants authored above>
```

Phase A therefore lands **grandfathered** in `rfcs/integration-allowlist.json` against this issue,
which is the mechanism the RFC process defines for a genuinely-accepted RFC whose fold is not yet
possible. #242 stays open through Phase B and is the follow-up the allowlist entry cites.

---

## Conformance Rules

> **[R1]** A Tier-2 `Record`'s `fieldValues` MUST be a JSON object. Each key MUST equal the `Field.name`
> of a Field in the effective field set of the Record's `typeId`@`typeVersion`. Unknown keys MUST be
> rejected; the projected schema asserts `additionalProperties: false`.
>
> **[R2a]** *(Erratum to RFC-035 [R4] — emitter scope.)* The `snake_case → lowerCamelCase` name
> projection and its override table (`projection-rules.md`) bind schema emission for the **in-scope
> meta-model Types** only. A **domain Type** MUST project each property key as its `Field.name`
> verbatim. This narrows RFC-035 [R4], whose unqualified phrasing the reference emitter already
> contradicts for domain Types.
>
> **[R2b]** *(Instance keys.)* A `fieldValues` key MUST be `Field.name` **verbatim**, with no case or
> separator transformation, at every nesting depth. The name projection MUST NOT be applied to
> instance keys under any circumstances, including for meta-model entities stored as Records.
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
> **Key absence is the sole representation of an unset field.** A value of `null` MUST be rejected —
> writers MUST omit the key instead. (Rationale: a `null` does not validate against the Type's
> projected schema, which has no null branch; permitting it would falsify [R3]'s by-construction
> guarantee.)
>
> **[R5a]** **Structural presence ([R5]) and rendering presence (RFC-001 Step 2) are distinct and MUST
> NOT be conflated.** [R5] governs validity: a key is present or it is not. RFC-001 Step 2 governs
> rendering: a value of `""`, or a sequence with no surviving entries, resolves as *absent* and emits
> no row ([FR-037-9]). A `required` field whose value is `""` therefore **satisfies [R5] and is still
> absent for rendering** — it validates, and it emits no row unless
> `DocumentSection.emptyBehavior: "show-placeholder"` applies. Neither notion is changed by this RFC;
> [R5a] exists because the carrier's key-presence model makes the two easy to confuse, and conflating
> them would silently change either validation or rendering.
>
> **[R6]** `fieldMeta`, when present, MUST be an object whose keys are a **subset** of the sibling
> `fieldValues` keys, and whose values are objects of `{source?, editedAt?, sourceRefs?}`. A
> `fieldMeta` key with no corresponding `fieldValues` key MUST be rejected. `fieldMeta` MUST NOT
> appear inside an inline-composite value.
>
> **[R7]** `FieldValue`, `FieldValueEntry`, `FieldGroupValue`, `FieldGroupEntry`, `Type.fieldGroups`,
> and `FieldAssignment.{repeatable, minItems, maxItems}` are REMOVED. An implementation MUST reject a
> document containing any of them at `dataModelRevision ≥ 2`. **Definition files carry no
> document-local revision discriminator** — [R9]'s structural test covers `fieldValues` only, and a
> `type.json` file has no `dataModelRevision` — so revision MUST be resolved from the enclosing
> repository or package manifest before [R7] is applied to a definition.
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
>
> **[R13]** The migration MUST enumerate instances from `manifest.json`'s `instanceIndex` and MUST
> NOT enumerate by directory glob or by `$schema` value. On completion it MUST assert that the count
> of migrated instances equals the `instanceIndex` count, and MUST fail otherwise. A partially
> migrated repository is the dual-shape state this RFC exists to prevent.
>
> **[R14]** A `mode: "reference"` value MUST resolve to an instance present in the repository's
> `instanceIndex`, and that instance MUST be of the Field's declared `rangeType` at the declared
> `typeVersion`. A dangling or type-mismatched target MUST be reported as an error naming the
> referring record, the key, and the target id. (Discharges RFC-032 OQ4, RFC-033:302, RFC-035:592.)
>
> **[R15]** `ext:field-groups` and `ext:repeatable-fields` are **retired**. A manifest at
> `dataModelRevision ≥ 2` MUST NOT declare either; a reader encountering one MUST report an error
> rather than ignore it, because a declaration implies constructs [R7] rejects.
>
> **[R16]** `cardinality: "list"` array-wraps **uniformly**, for every `datatype` including `map` and
> `dependent`. `fieldMeta` is **not** part of a Type's projected JSON Schema and MUST NOT be emitted
> into it; it is Record-envelope metadata, like `tags` and `meta`.
>
> **[R17]** A Type's projected JSON Schema describes the **`fieldValues` object**, not the whole
> Record document. `instanceId`, `typeId`, `tags`, `meta`, `sourceRefs`, and `fieldMeta` are envelope
> members governed by `record.json`, and are outside the projected schema's
> `additionalProperties: false`.
>
> **[R18]** Instance `fieldValues` keys MUST be serialised in `FieldAssignment.order`, and nested
> composite objects likewise, so that a re-run of the transform is byte-idempotent and diffs are
> stable. (`projection-rules.md`'s "Ordering" section governs *schema* key order and does not reach
> instances; this is the instance-side counterpart.)
>
> **[R19]** A Type version referenced by any instance in the repository MUST NOT be deleted.
> Name-keying makes the Record→Field edge **Type-mediated**: `fieldId` is recovered from
> `typeId` + `typeVersion` + key, so deleting the pinned Type version renders every instance of it
> unreadable, where today each instance still carries exact `fieldId`s. [R1] and [R10] depend on this.
> (Change E.2's "`table@2` is retained, not deleted" is an instance of this rule, not a courtesy.)

---

## Schema changes

| Schema file | Change |
|---|---|
| `record.json` | `fieldValues` array → object (Change A/B); add `fieldMeta` (Change C); remove `$defs.FieldValue`, `$defs.FieldValueEntry`, `$defs.FieldGroupValue`, `$defs.FieldGroupEntry`, and the `groupValues` property (Changes D/E); `$defs.SourceReference` retained, now referenced from `fieldMeta` and record-level `sourceRefs` |
| `type.json` | remove `$defs.FieldGroup` and `Type.fieldGroups`; remove `FieldAssignment.{repeatable, minItems, maxItems}` (Change E) |
| `typed-record.json` | replace `TypedField.valueType`/`selectOptions` with an inline `fieldType` restricted per [R8] (Change G) |
| `manifest.json` | **none** — `dataModelRevision` is already an optional monotonic integer (RFC-033 / #265); Phase B stamps values, not shapes |
| `package-bundle.json` | **tighten** `$defs.Type`, which is `additionalProperties: true` — a bundle carrying `fieldGroups` would still validate after [R7], so the removal is unenforceable in bundles until this is closed. Its embedded `FieldAssignment` def already lacks the trio and its `Type` def already lacks `fieldGroups`, so nothing is *removed* here |
| `field.json` | **none to the shape** — `fieldType` is unchanged; the `name` description carries Open Question 2's convention outcome (Change A) |
| `projection-rules.md` | **normative text change** — scope the `snake_case → lowerCamelCase` name projection and its override table to the frozen-seed metamodel entities, and state verbatim `Field.name` keys for domain Types (Change A / [R2a]); this is the erratum to RFC-035 [R4] |
| `document-view-output.json` | re-key `ProjectedRecord.fields` and `orderedFieldKeys` from fieldId to `Field.name`; remove `ProjectedRecord.fieldGroups`, `$defs.ProjectedFieldGroup`, `$defs.ProjectedGroupEntry` with no successor construct (Change I; discharges RFC-036's deferral) |
| `theme.json` | remove `ElementTemplates.groupFieldRowTemplates`, retired with `FieldGroup`; keys carry over to `compositeFieldRowTemplates` (Change I / [CR-036-18]) |

Schema changes sync to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`
through the `schemas-2.0.tar.gz` release artifact and each mirror's own pipeline — **not** by editing
sibling trees from this repository.

**No schema file is edited in Phase A.** Editing `record.json` now would invalidate all 355 Tier-2
Records on the same commit; the table above is the Phase-B contract, reviewed here before any code.

---

## Migration plan

### Ordering

Phase A (this RFC, Accepted) unlocks **#284** only. Before Phase B may begin, the interstitial
prerequisites recorded on #242 must land: **#284** (re-express the four legacy `valueType` subset
rules), **#286** (repair the migration transform; dispose the remaining pre-RFC-032 package trees),
**#294/RFC-037 + srs-rust#782** (field-row path — Accepted Rev 3, implemented), **#295** (package-ID
collision), and the muSrs revision-0 / `ext:themes-l1` / released-package-freeze decisions.

### The first-party corpus is four repositories, not one

`srs/srs` is not the only SRS repository in this tree. Three others carry live instances, and two of
them are **still pre-RFC-032** — which means the carrier transform, whose every step is keyed on
`Field.fieldType`, **cannot run on them at all** until they are RFC-032-migrated first.

| Repository | Instances | Values | Package Fields | Revision |
|---|---|---|---|---|
| `srs/` (the spec) | 355 T2, 19 T0, **0 T1** | **1318** | 150, all `fieldType` | 1 |
| `conformance/discovery/fixture-repo/` | 8 T2, **2 T1**, 1 T0 | **54** | 15, **all `valueType`** | **absent ⇒ 0** |
| `docs/spec/examples/gallery-project-v2/` | 22 T2, 2 T0 | **100** | 20, **all `valueType`** | **absent ⇒ 0** |
| `docs/spec/examples/gallery.srsj` | 22 records (bundle of the above) | **100** | — | **absent ⇒ 0** |

Two consequences the earlier revisions of this RFC got wrong:

- **The RFC's "0 Tier-1 TypedRecords" claim was scoped to `srs/srs` and read as global.** The
  conformance fixture has 2, with 4 `valueType`-bearing `TypedField`s. Change G is a live data
  migration, not a schema-only change.
- **Pre-RFC-032 disposal was scoped to `packages/**` (#286).** That boundary excludes both of these
  paths, which are *source data*, not published packages and not render output. `gallery-project-v2`
  is hand-authored (no generator in `scripts/`), and `check-cardinality-coherence.mjs` already reports
  it as having *"not adopted RFC-032 at all"*.

**Phase B must therefore RFC-032-migrate both repositories before the carrier transform touches
them**, or #286's scope must be widened to cover `conformance/**` and `docs/spec/examples/**`. That
is a sequencing decision recorded here, not taken here — it belongs to #286.

### Prerequisite — the muSrs corpus audit

**Every totality claim in this RFC is measured over `srs` only.** The landing is all-or-nothing over
`srs` *and* muSrs, so the deterministic-transform argument currently covers half the corpus it must
convert. muSrs lives in `the-greenman/muDemocracy.org`, outside this session's repository scope.

Phase B MUST re-run these six measurements over muSrs and record them **before** the transform is
written, because each one is a place where "0 occurrences here" is doing load-bearing work:

1. `entries` on a Field whose `cardinality` is not `list` (Change D claims 61/61 here);
2. per-value `source`/`editedAt`/`sourceRefs`, including inside `groupValues` (Change C claims 1/0/0);
3. entry-level `source`/`editedAt` on `entries` items (Change C claims 0 of 138);
4. intra-Type `Field.name` collisions — [R4]'s feasibility (Change F claims 0 of 45 Types);
5. `Field.name` spellings — Open Question 2's kebab-case count (33 here);
6. unresolvable `fieldId`s and explicit `null`s ([R10], [R5] — one and zero here respectively).

A non-zero result on any of them is a design input, not a migration detail: (1) and (6) would make
the transform non-total as written, (4) would make [R4] unsatisfiable without renaming, and (2)/(3)
would reopen Change C's granularity rule.

### The transform

Deterministic. **The definition layer runs first and in full**, because the instance steps resolve
against the *post*-transform Types — a Record still pinned to `table@2` has no `rows` Field to key.

**Phase 0 — definitions (whole repository, before any instance is touched):**

0a. Run Change E.2 for every `FieldGroup`: mint the range Type `R`, mint the new Field, add its
    `FieldAssignment` to `T`, and **bump `T`'s version** (`table@2 → @3`), retaining the old version.
0b. **Strip `repeatable`/`minItems`/`maxItems` from every `FieldAssignment` in every first-party
    Type** — 8 occurrences across 3 Types here, two of which have no FieldGroup and are otherwise
    untouched. Missing one leaves that Type schema-invalid under [R7].
0c. Replace `TypedField.valueType`/`selectOptions` with an inline `fieldType` (Change G).

**Phase 1 — instances (per file, enumerated from `instanceIndex` per [R13]):**

1. Rewrite `typeVersion` to the post-0a version where 0a bumped it, then resolve
   `typeId`@`typeVersion` → effective field set. **Abort on any unresolvable `fieldId`** ([R10]).
2. `fieldValues[]` → object: for each pair, key = `Field.name`, value per Change B.
3. `entries: [{value: v₁}…] → [v₁…]` — **only where the Field is `cardinality: list`**; abort otherwise (Change D).
4. `groupValues[{groupId, entries[{fieldValues[]}]}]` → the group's new Field key → array of
   recursively-transformed `fieldValues` objects (Change E).
5. Per-value `source`/`editedAt`/`sourceRefs` → `fieldMeta[key]` (Change C).

**Phase 2 — repository-level:**

6. Copy every `groupFieldRowTemplates` key to `compositeFieldRowTemplates`; abort on an unmatched key ([R12]).
7. Add the `ext:themes-l1` declaration missing from `muSrs/manifest.json` (RFC-036's deferral).
8. Stamp `dataModelRevision: 2` on the repository manifest, every first-party package manifest, and
   every `.srsj` envelope (none of which is stamped today).
9. Assert migrated-instance count == `instanceIndex` count ([R13]).

Steps 2–5 are byte-deterministic given a fixed key order; the emitter's ordering discipline
(`projection-rules.md` "Ordering") is reused so re-running the transform is idempotent.

### The transform must be total — every schema-legal branch has a rule

The old shape permits states the new one cannot express. Each is **0-occurrence in this repository**
but schema-legal, so each gets an explicit disposition rather than falling through. A transform that
silently drops any of them produces a lossy migration that the round-trip check would not catch,
because the dropped data is absent from both sides.

| Legal-but-awkward input | Disposition |
|---|---|
| Duplicate `fieldId` within one `fieldValues[]` (today expressible — `uniqueItems` cannot forbid it) | **Abort.** Two pairs collapse to one key; picking a winner would silently discard data. |
| `fieldId` resolving to a Field **not** in the Type's effective set | **Abort.** It would produce a key [R1] rejects. |
| `entries[i].source` / `entries[i].editedAt` | **Abort.** `fieldMeta` has no per-item level by design (Change C); aborting surfaces the conflict rather than dropping provenance. |
| Per-value `source`/`editedAt`/`sourceRefs` on a `FieldValue` **inside** a `FieldGroupEntry` | **Abort.** [R6] forbids `fieldMeta` inside a composite, so there is no destination. |
| `FieldGroupEntry.entryId` | **Dropped, with a logged notice.** It identifies a row within a group; the composite list's index carries position, and no `entryId` is referenced anywhere in the corpus. |
| Unresolvable `typeId@typeVersion` at step 1 | **Abort**, naming the record and the reference. |
| `entries` on a Field whose `cardinality` is **not** `list` | **Abort.** 61/61 are `list` here; muSrs is unaudited (Open Question 5), so step 3 is conditional, never unconditional. |
| Explicit `null` value | **Abort.** [R5] removes `null`; 0 occurrences here, muSrs unaudited. |
| **`FieldValue` with neither `value` nor `entries`** — schema-legal, since `FieldValue` requires only `fieldId` | **Key omitted, with a logged notice.** This is the one row that is **not** 0-occurrence: `rfc-003-distribution-and-slices.json` and `rfc-004-language-neutral-schema-notation.json` each carry a bare `{"fieldId": "5a000009…"}` for the optional `affected-components`. Under [R5] the alternatives are omit-the-key or emit `null`, and `null` is rejected — so omission is the only available reading. |

**One case is deliberately not round-trippable.** A valueless pair maps to an omitted key, and
old → new → old cannot reconstruct it: an absent key is indistinguishable from a pair that never
existed. This is a **one-way loss of two no-op records**, accepted because the alternative is
retaining `null` and thereby breaking [R3]'s by-construction guarantee for the entire corpus. The
round-trip criterion below is therefore stated as *equivalence modulo valueless pairs*, and the
transform MUST log each one it drops so the count is auditable rather than silent.

"Abort" means: fail the whole repository's migration with a diagnostic naming the record, the key,
and the reason. **Never skip, never coerce, never partially migrate** — a partial migration is the
dual-shape state the process gate forbids ([R13]).

Alongside them, Phase B retires what the carrier's removal releases: RFC-007's `[FG-Cx*]`,
`[T-Gx*]` and `[T-Cx*]` rules ([CR-036-19]), RFC-037's unprefixed CSS aliases ([FR-037-14]), and
`render_service.rs`'s `coerce_to_array` string branch — deleted rather than ported, since no field
value is a JSON-bearing string once structure is expressible.

### Enumerate from `instanceIndex`, never from a path glob

The transform MUST enumerate instances from `manifest.json`'s `instanceIndex`, which is the
authoritative member list, and MUST NOT glob a records directory. This repository is already a
counterexample to the obvious approach: of its **374** indexed instances, **367** live under
`records/` and **7 live under `package/records/`** — a second, easily-missed record root
(`rfc-ffe44c91`, three `invariant-*`, three `rfc-change-*`). Those 7 additionally carry **no
`$schema`** property, so they are invisible both to a path glob over `records/**` and to a filter on
`$schema == record.json`.

A transform written either way would silently skip 7 Records and **34** field values, leaving a
partially-migrated repository that `srs repo validate` would very likely pass — precisely the
dual-shape state the process gate forbids. Stated as [R13].

This also bears on RFC-038 (#296), whose required decisions include *"canonical discovery roots and
how local package record roots participate"* and *"classification of Note, TypedRecord, and Record
files when `$schema` is present or absent"*. These 7 files are a concrete instance of both questions;
recorded here as evidence for that RFC rather than resolved by this one.

### Known blocker to fix before the transform runs

Field `f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5c` is referenced by four Types —
`com.semanticops.srs/meta.{spec-part, concept, specification, requirement}@1` — and is **defined
nowhere** in this repository. `srs repo validate` reports **0 errors** over it. Today it is inert,
because instances carry the UUID and nothing must resolve it; under name-keying the transform *must*
resolve `fieldId → name`, so it becomes a hard stop by [R10]. This is the same failure shape #276
caught — invalid data that `repo validate` passes silently. It must be resolved (define the Field, or
remove the four assignments) before Phase B. Filed as a Phase-B prerequisite, not fixed here.

### Conformance evidence required at cutover

- Old → new → **round-trip equivalence** over every first-party value. Baseline measured for **this
  repository** at `origin/master` `c9797f0`, enumerated from `manifest.json`'s `instanceIndex` (374
  entries): **1318** `fieldValues` (recursive, including inside `groupValues`), **61** `entries` (138
  items), **9** `groupValues` carriers / **65** entries, **1** per-value `source`, **231** Tier-2
  record-level `sourceRefs`, **355** Tier-2 Records / **19** Tier-0 Notes / **0** Tier-1
  TypedRecords. The muSrs side — ~235 values, 14 carriers, 30 entries, 102 rows, **0**
  ragged, **0** uses of `widths` — is **quoted from the measurements recorded on #242 (2026-07-31)**,
  not re-measured here: muSrs lives in `the-greenman/muDemocracy.org`, outside this session's
  repository scope. Phase B MUST re-measure it against the tree it actually migrates, since the
  round-trip proof is only as good as its baseline.
- `srs repo validate` 0 errors, `validate-all.mjs` green, `check-release-drift` green after re-render.
- `check-cardinality-coherence.mjs` — passes vacuously once the trio is gone; kept as the partial-deletion guard.
- The 12 composite/table tests in `crates/srs-repository/src/render_service.rs` re-based onto structured input;
  `composite_table_no_raw_json_in_output` becomes trivially true.
- A spec-side DocumentView fixture exercising the RFC-037 row baseline over a composite (inline, list) field.

### Blast-radius matrix

| Surface | Definition change | Instance change | Owner |
|---|---|---|---|
| `srs` spec repo (both record roots) | `table@2` group → composite Field; `table@2 → @3` (Change E.2) | **355 Records, 1318 values, 9 group carriers** — incl. **7** in `package/records/` | Phase B |
| `srs` local packages (**6** manifests) | `fieldGroups` removal; strip the `repeatable` trio (8 sites / 3 Types); stamp revision 2 | **7 Records / 34 values** in `package/records/` (see [R13]) | Phase B |
| `srs` schemas (`docs/schema/2.0/`) | `record`, `type`, `typed-record` | — | Phase B |
| `srs` rendered exports (`docs/spec/`) | — | re-render; `check-release-drift` | Phase B |
| `srs` `.srsj` artifacts (4) | envelope stamp — **none carries `dataModelRevision` today**; no schema exists for the envelope | `gallery.srsj`: **22 records / 100 values**; other 3: none | Phase B |
| `conformance/discovery/fixture-repo/` | **pre-RFC-032** — 15 `valueType` Fields | **8 T2 + 2 T1**, 54 values | Phase B, **after** RFC-032 migration |
| `docs/spec/examples/gallery-project-v2/` | **pre-RFC-032** — 20 `valueType` Fields | **22 T2**, 100 values | Phase B, **after** RFC-032 migration |
| `packages/` published trees | pre-RFC-032, revision 0 | — | **#286**, not this RFC |
| muSrs | `section.table` / `section.commentary` groups → composites | **~235 values, 14 carriers, 102 rows** (per #242; re-measure at Phase B) | Phase B |
| `srs-rust` | **39 files across 6 crates** touch `field_values` (`srs-repository` 23, `srs-bindings` 5, `srs-cli` 3, `srs-core` 3, **`srs-gov` 3**, `srs-mcp` 2); **25** touch `group_values`; payload contract + golden schemas regenerate | fixtures; the 12 `render_service.rs` composite/table tests re-based | Phase B, same train |
| `srs-rust` agent/tooling contract | `type_schema_service.rs` (`x-srs-field-id`), `CreateRecordInput` (`fieldValues`, `groupValues`), MCP `record_create` / `record_update` / `note_graduate` tool schemas | — | Phase B, same train |
| `srs` agent docs | `srs-usage.md` — ~10 passages instructing `fieldValues` keyed by fieldId and `groupValues` in `CreateRecordInput` | — | Phase B, same train |
| `srs-web` | consumes catalog/render services — **not yet enumerated** | — | Phase B; enumerate before cutover |
| `srs-vscode` | schema mirror | — | mirror pipeline |

The `srs-rust` counts are file-level matches, sufficient to size the work and to show that `srs-gov`
— a crate named in neither this issue nor srs-rust's own crate-authority table — is in scope because
it consumes `x-srs-field-id`. **`srs-web` carries no evidence at all**; it must be enumerated to the
same standard before the cutover, since item 6 of this issue requires the blast radius resolved, and
an asserted row is not a resolved one.

**`x-srs-field-id` is retired.** Motivation calls it the bridge keyword that exists only to paper
over the name-keyed-schema / UUID-keyed-instance mismatch. Once instances are name-keyed there is
nothing to bridge, so Phase B removes it from the editor-facing projection. It lives in
`type_schema_service.rs`, not in a schema file, so it appears in the matrix above rather than in the
Schema changes table.

### Relationship to RFC-038 (#296)

RFC-038 changes **where instances live** (tree-authoritative membership, standalone relation files);
this RFC changes **what an instance's values look like**. The designs are independently reviewable and
have no shared normative surface. But first-party data must move **once**, not twice: the spec repo,
muSrs, packages, and maintained fixtures go directly to the final combined contract in the composed
**#242 / #296 release train** (tracked on #297), at a single `dataModelRevision: 2`. Neither RFC's cutover ships alone.
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
  **23** FieldGroup carriers and **167** rows across the two repositories (9/65 here, 14/102 in muSrs) grow with every new table.
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

## Cross-references

| RFC | Status | Interaction |
|---|---|---|
| **RFC-032** | Accepted | Change E deferred `FieldGroup` removal + the inline-composite instance carrier to this issue; Change B here **is** that carrier. RFC-032 [R4] (sole cardinality mechanism) is finally true at the instance layer. RFC-032 **OQ4** (reference dangling targets) is discharged by Change J / [R14]. |
| **RFC-033** | Accepted | `type.fieldGroups` listed as `#242`-gated removal. RFC-033:407's metamodel example-instance round-trip is **not** accepted into Phase A — see Open Question 1. |
| **RFC-035** | Accepted | **[R2a] narrows its [R4]** (name projection) to the frozen-seed metamodel — declared as an erratum, not implied. RFC-035:592's reference-integrity deferral is discharged by [R14]. |
| **RFC-036** | Accepted | Change I discharges its `document-view-output.json`, `theme.json` [CR-036-18], and [CR-036-19] deferrals. Its `compositeRenderer` binding is where `FieldGroup.compositeRenderer` lands (Change E.2). |
| **RFC-037** | Accepted (Rev 3) | [FR-037-14]'s unprefixed CSS alias sunset fires at this cutover (Change I). Its field-row form is what the Phase-B parity fixture exercises; not reopened. |
| **RFC-019** | Accepted | **Conflict — Phase B must amend it.** Its Definitions block defines non-empty as *"its `FieldValue` entry is present in the Record's `fieldValues` **array** … when `ext:repeatable-fields` is declared and `FieldAssignment.repeatable` is `true` … its `entries` array is present"* — three constructs [R7] removes. `CrossFieldRule` addressing fields by `fieldId` is **unaffected** (it is a Type-level declaration, not an instance key). Only the non-empty definition needs rewriting, onto key presence + [R5]. |
| **RFC-022** | Accepted | `RequiresRelation` is Type-level and untouched. |
| **RFC-023** | Accepted | `SourceReference` shape unchanged; it is now reached via `fieldMeta` as well as record-level `sourceRefs`. |
| **RFC-017** | Accepted | `sourceRefs` as forward capability is the reason Change C relocates rather than deletes per-value provenance. |
| **RFC-015** | Accepted | `FieldGroup.label`/`order` land on `FieldAssignment` (presentation), and `compositeRenderer` on a `FieldView` — presentation stays view-owned. |
| **RFC-038** (#296) | Draft | Independently reviewable; composed into one first-party cutover. The 7 schema-less `package/records/` instances are evidence for its discovery-root and `$schema`-classification questions. |

---

## Open Questions

1. **Metamodel self-application — and an obligation this RFC does not accept.** The metamodel
   entities (`Field`, `Type`, …) are projected with the `snake_case → lowerCamelCase` transform so
   their emitted schemas match the hand-authored frozen seed. If a metamodel entity is ever stored as
   a Tier-2 Record under this carrier, [R2b] (verbatim keys) and the seed's camelCase keys disagree,
   and the override table would have to apply to instances too.

   RFC-033:407 assigns this issue a related obligation: *"an instance of e.g. `field-type` is a
   Tier-2 Record whose `fieldValues` carry inline-composite values … The full inline-composite
   example-instance round-trip is #242's acceptance, not #258's."* **This RFC does not accept that
   into Phase A**, and says so rather than leaving RFC-033's open question falsely closed. The
   metamodel is the deepest inline-composite nest available and would be the strongest available test
   of Change B's recursion — which is an argument for adding it to Phase B's conformance evidence,
   not for treating it as already discharged. Phase B should either take it on or amend RFC-033 OQ2
   explicitly. Settling it interacts with #260's authorship flip.

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

   Phase A does not depend on the answer — [R2b] says *verbatim `Field.name`*, whichever spelling
   wins. **Phase B does**, because the key strings differ. Must be settled before the transform runs.

   Note the consequence either way: at `dataModelRevision: 2` the corpus's own **wire keys** would
   violate a standing canonical rule under disposition 1 until the convention text is changed. So
   Phase B carries a spec-text change to `field.json` and record
   `7d22d50f-2dc2-51cb-ac43-dd1b0903d869` in *either* branch — relaxing the convention, or recording
   the renames. This question has a landing place in the fold-in targets; it is not merely advisory.

3. **Where the four `meta.*` Types' missing Field is resolved.** Defining it versus removing the four
   assignments is a spec-content decision, not a carrier decision. It must be settled before the
   Phase-B transform runs ([R10]), but it is not this RFC's to take.

4. **No rule freezes an already-published `id@version`.** Searching for one turned up only the
   converse — I-9: *"`Field.id` is stable across versions. A new `id` means a new definition"* — and
   the version-semantics table, which says when a bump is *required* without forbidding in-place
   edits to a published version. This does not affect the *key* (a `Field.name` cannot change at all,
   per the Rationale), but the carrier now **depends on the adjacent guarantee** that a referenced
   version is not *deleted* — which is why [R19] states it rather than leaving it informal. It also
   bears on Change E.2: the decision to bump `table@2 → @3` rather
   than edit `@2` in place rests on the table's catch-all rather than an explicit freeze rule. If the
   intended rule is that a published version is immutable, writing it down as an invariant would make
   Change E.2's bump a consequence rather than a judgement call.

5. **muSrs is unaudited against six totality claims.** See "Prerequisite — the muSrs corpus audit".
   Listed as an open question because a non-zero result on items 1, 4 or 6 there is a **design**
   input that would reopen Change D, RFC-039 [R4] or [R5] — not merely a migration detail.

6. **Should Tier 1 become an object map too?** After this RFC, Tier 2 identifies values by name *and*
   keys by name; Tier 1 identifies by name but stays an ordered array (Change G). The tiers therefore
   end up structurally more divergent than they began, which is an odd result for an epic whose
   stated purpose is consistency. The argument for leaving it is real — Tier 1 has no
   `FieldAssignment.order` to recover authored order from, so the array *carries* information an
   object map would lose. The argument against is that two shapes for "a record's field values" is
   the kind of split this epic exists to remove. Not settled here because it is not needed for the
   carrier, and because converting Tier 1 would touch the 2 live TypedRecords for no functional gain.

7. **Does #286's scope extend to `conformance/**` and `docs/spec/examples/**`?** Both hold live
   pre-RFC-032 repositories the carrier transform cannot run on. Widening #286 or adding a Phase-B
   RFC-032 pass are equivalent in work and different in ownership. It is #286's call, not this RFC's.
