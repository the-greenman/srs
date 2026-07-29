> **GitHub issue**: [the-greenman/srs#269](https://github.com/the-greenman/srs/issues/269) · delivers Task **#259** (RFC C) under epic **#256**; builds on RFC-032 (#257) and RFC-033 (#258/#266); reuses RFC-004's projection-rules; reconciles srs-rust#770; folds the emitter half of #265

# RFC-035: JSON Schema emitter — projecting the self-hosted meta-model (records → 2020-12)

**Status**: Draft (Revision 3)
**Affects**: the meta-model projection contract; `docs/schema/2.0/metamodel-fidelity.md` (verification note); a new normative `docs/schema/2.0/projection-rules.md` (relocated from RFC-004); the reference emitter + goldens under `scripts/lib/` and `tests/rfc-035/`; the `srs-projection` core service / `srs schema generate` CLI / WASM binding (**specified here, implemented at #260**); reconciles srs-rust#770. Builds on **RFC-032 (Accepted)** and **RFC-033 (Accepted)**. Reuses RFC-004's `projection-rules.md`. Folds in the emitter half of **#265** (`dataModelRevision` bundle stamping). **Refines the wording of RFC-033 [R4](b)** (see Change F). **Non-breaking** (additive: a reference emitter, a relocated normative doc, goldens, and a verification note; it does **not** modify `docs/schema/2.0/{field,type}.json`, records, or any wire shape).
**Author**: Claude Code (agent), on behalf of the repository owner
**Date**: 2026-07-29

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-29 | Initial draft. Task 3 (RFC C) of epic #256, delivering #259. Neutral IR, JSON-Schema-2020-12 emitter generalizing `projectField`, emitter-owned `$defs` key, snake_case→lowerCamelCase name projection, two-tier verification, `dataModelRevision` bundle stamping, `projection-rules.md` relocation, srs-rust#770 reconciliation. |
| 3 | 2026-07-29 | Second reviewer round — **zero blocking** (both reviewers verified all Rev-2 resolutions). Folded the residual should-fix + nits: **defined the generated-schema bundle envelope shape** and noted it is a distinct artifact from RFC-033's `package-bundle.json` (Change H); **pinned per-node (intra-fragment) key order** in `projection-rules.md` (Change G); gave the **documented-divergence register a named home** alongside the override table (Change F/E); and had the closure test **print the excluded seed-property list** so a future coverage regression cannot hide inside the subset exclusion (Change F, Testability). |
| 2 | 2026-07-29 | Two-reviewer round (Spec Integrity + Completeness), all blocking + should-fix applied. **Reworked closure (Change F) to be honest against the real seed:** it is an `emitter ⊆ seed` structural *authoritative-subset* closure with a **`$ref`-resolution (inline-expansion) normalization** (so the emitter's `$ref`+`$def` compares equal to a seed *inline* subschema — the `field-type.constraints` and value-object cases), an **explicit exclusion set** (the `$schema` envelope meta-property, `type.tags`, RFC-033 Change A deferred facets, and the seed's hand-authored *approximated* envelopes), `required[]` compared **set-subset**, and a **documented-divergence register** (the metamodel intentionally *upgrades* `type.aiGuidance` to the full `AiGuidance` value-object). **Stated that RFC-035 refines the wording of RFC-033 [R4](b)** (byte-for-byte now means against the emitter's own goldens; seed conformance is structural closure) and flagged [R4](b) for an amendment note. **Specified the IR↔`projectField` adapter** (`SchemaNode` retains the source `fieldType`; `kind` is a derived tag; `projectField` runs unchanged). **Pinned emission ordering** (`$defs` pre-order DFS, parent before nested; fixed top-level key order) for cross-implementation byte-parity at #260. **Added a Testability section, an emitter I/O contract, the name-override table's home/format, the #260 flip precondition (coverage parity), `vocabularyRef` v1 scoping, and Alt F.** Recast [R7] as a staged forward obligation. Made Change H verifiable now (the reference emitter emits a stamped bundle envelope). |

---

## Abstract

Epic #256 dissolves the meta-model drift problem by making the SRS `Field`/`Type` records the single
source of truth and *generating* the schemas from them. RFC-032 gave `Field` the expressiveness
(`fieldType`); RFC-033 self-hosted the meta-model as records in `com.semanticops.srs/metamodel` and
froze `docs/schema/2.0/{field,type}.json` as the bootstrap fixed point, discharging closure *now* with a
per-`fieldType` stand-in (`projectField`). This RFC defines the **emitter** that closes the loop for whole
entities: a **neutral intermediate representation** (IR) projected from meta-model `Type` records, and a
first **JSON Schema 2020-12** emitter over that IR. The emitter walks a `Type`'s `FieldAssignment`s,
projects each `Field`'s `fieldType`, and assembles a complete `{type: object, properties, required,
additionalProperties: false, $defs, $id}` schema. Its verification is two-tier: a **byte-for-byte
determinism golden** on the emitter's own committed output, and a **structural authoritative-subset
closure** against the frozen seed (which *refines* RFC-033 [R4](b)'s "byte-for-byte against the seed" into a
`$ref`-resolving `emitter ⊆ seed` comparison, because emitter-owned `$defs` keys and the seed's
hand-authored approximated envelopes make literal seed-byte-equality neither achievable nor desirable). The
IR is deliberately target-agnostic so protobuf, TypeScript, and Rust emitters slot in later — the `future`
columns of the fidelity dashboard — without touching the projection core. Owner-confirmed scope: this RFC
delivers the design plus a **Node reference emitter** verifiable through the Node pipeline today; the
`srs-projection` core service, the `srs schema generate` CLI, and the WASM binding are **specified here and
implemented at the #260 cutover**, because the installed binary embeds the pre-RFC-032 schema and cannot yet
load the `fieldType` package (ADR-004) — exactly as RFC-033 deferred its own embedded-bundle wiring.

---

## Motivation

### Problem 1 — closure is proven per-field, not per-entity

RFC-033 [R4](a) demonstrated bootstrap closure with `projectField` over individual `fieldType` shapes
(`scripts/rfc-033-closure-test.mjs`: 50 authoritative matches + 12 documented-approximated). That proves
each *field* projects correctly, but not that a whole *entity* schema — `field.json`, `type.json`, with its
`$defs`, `required[]`, property ordering, `$id`, and `additionalProperties: false` envelope — is
reproducible from the records. Worse, the per-field test is blind to the *entity-level* divergences that
only surface when you assemble the whole file: the seed **inlines** `constraints` where the metamodel models
it as an inline-ref Type; the seed carries a **narrowed** `type.aiGuidance` where the metamodel unifies on
the full `AiGuidance`; the seed has non-`Field` envelope properties (`$schema`) and a coverage-gap property
(`type.tags`) the metamodel does not model. RFC-033 [R4](b) assigns the whole-entity closure to #259; doing
it honestly means confronting exactly those divergences (Change F), not asserting a byte-for-byte identity
that cannot hold.

### Problem 2 — there is no emitter, and no neutral seam for future targets

The only projection code is `projectField` (a per-`fieldType` fragment) and the pre-RFC-032 mapping table
sketched in srs-rust#770. Neither is an entity-level emitter, and neither defines a **target-neutral seam**.
Epic #256's architecture is explicit: author once → compile to a neutral IR → run N independent emitters
(JSON Schema first; protobuf/TS/Rust later, *added without touching core*). The fidelity dashboard already
reserves `future` columns for exactly those targets. That seam has to exist before the second emitter, or
the second emitter reshapes the first — the drift this epic exists to remove, one layer up.

### Problem 3 — the projection contract lives in a frozen historical tree

The normative source→JSON-Schema mapping (`projection-rules.md`) currently lives under
`rfcs/rfc-004/proposed-package/spec-authoring-json-schema/`, inside RFC-004's never-loaded proposed package.
RFC-033 Change E kept it as the normative contract but flagged that #259 must relocate it to a live
normative home and re-anchor it from RFC-004's superseded `schema-definition`/`schema-member` vocabulary to
the self-hosted `Field`/`Type` meta-model.

### Problem 4 — srs-rust#770 describes the wrong artifact

srs-rust#770 (`type_to_json_schema()`) predates RFC-032. Its "direct mappings" table keys off the retired
`valueType`/`allowedValues`/`validationRules` model, not `fieldType`. Left as written it would implement a
*second*, pre-RFC-032 projection in Rust — reintroducing the multiple-sources-of-truth problem. It must be
reframed as the srs-rust *binding of this RFC's emitter*, not an independent projector.

---

## Proposed Changes

### Change A — the neutral IR (`fieldType` records → IR → target)

The emitter is a **two-stage pipeline** with a target-neutral IR in the middle:

```
meta-model Type record ──(front half: package-resolving)──▶ SchemaModel (neutral IR) ──(emitter)──▶ target artifact
```

The **front half** is target-agnostic and owns every *semantic* decision (what a field means); an
**emitter** owns only *target-syntax* decisions (how a target spells it). This is the seam that lets
protobuf/TS/Rust emitters slot in without touching the front half (Problem 2, [R7]).

**IR shape** (illustrative; the normative field list is fixed in `projection-rules.md`):

```
SchemaModel   = { objects: SchemaObject[] }
SchemaObject  = {
  key:         { namespace, name, version },   // the entity identity (from the Type record)
  id:          string,                          // the target-independent schema identity URL ($id policy, Change C)
  title?:      string,
  description?: string,
  properties:  Property[],                      // in FieldAssignment.order
  required:    string[],                        // jsonKeys whose FieldAssignment.required == true
  defs:        Map<defKey, SchemaObject>,       // inline-ref ranges, transitively (Change B)
}
Property      = { jsonKey, node: SchemaNode, required, title? }   // title from FieldAssignment.displayLabel
SchemaNode    = { kind, fieldType, range? }
  // kind ∈ { scalar, enum, ref-inline, ref-id, map, dependent, list } is a DERIVED classification tag;
  // fieldType is the ORIGINAL RFC-032 fieldType payload from the Field record, retained verbatim;
  // range (present only for ref-* kinds) is the resolved { namespace, name, version } (Change D).
```

**The `kind` tag is derived, not authored.** It is computed from the `fieldType` (`datatype`/`mode`/
`cardinality`/`valueDomain`) so that a target emitter can dispatch on a small, target-neutral vocabulary
without re-reading JSON-Schema keywords. The node **retains the source `fieldType` verbatim** so the JSON
emitter's node renderer is exactly RFC-032's `projectField`, run **unchanged** (Change B) — this is how "reuse,
don't reinvent per-field projection" and "target-neutral IR" are reconciled at the seam: `kind` is what a
*non-JSON* target reads; `fieldType` is what the *JSON* target's `projectField` reads. `list` wraps an inner
node (its `fieldType.cardinality == "list"`); the inner semantic kind is still recoverable from the payload.

### Change B — the JSON Schema 2020-12 emitter (generalizing `projectField`)

The first (and only NOW) emitter renders a `SchemaObject` to a JSON Schema 2020-12 definition-file schema
with a **fixed top-level key order** (required for cross-implementation byte-parity, [R6]):

```
emitJsonSchema(obj) = {                                 // keys emitted in THIS order:
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     obj.id,                                    // Change C
  "title":   obj.title,                                 // omit if absent
  "description": obj.description,                       // omit if absent
  "type":    "object",
  "required": obj.required,                             // omit if empty
  "additionalProperties": false,
  "properties": { for each Property p (in order): p.jsonKey → renderNode(p.node) (+ "title" from p.title) },
  "$defs":   { for each (defKey → o) (in $defs order below): defKey → emitDefBody(o) }   // omit if empty
}
```

- **`renderNode(node)` = `projectField(node.fieldType, …)`** (RFC-032, unchanged) for every kind — scalar,
  enum, list, map, dependent, and both `ref` modes. `ref-inline` → `{ $ref: "#/$defs/<defKey>" }`; `ref-id`
  → `{ type: string, format: uuid, "x-srs-range-type": "<ns>/<name>@<version>" }`. **The emitter does not
  reinvent per-field projection** (RFC-033 / #259 instruction); the IR adds only entity-level assembly and
  package resolution around it.
- **`$defs` construction.** Every `ref-inline` range contributes one `$def` keyed by its emitter-owned
  `defKey` (Change D), whose body is the range Type's own emitted object schema *inlined* (its own
  `properties`/`required`/`additionalProperties`), transitively pulling nested inline ranges into the same
  `$defs` bag. `ref-id` ranges contribute **no** `$def`.
- **`$defs` order is pre-order depth-first by first reference:** walk `properties` in order; on the first
  encounter of an inline range, recurse into *its* inline ranges before continuing (parent `$def` key is
  reserved at first encounter; bodies are emitted in first-encounter order). This makes the `$defs` bag order
  deterministic and reproducible by a second implementation.
- **Property key** is the lowerCamelCase projection of `Field.name` (Change E). **`required[]`** is the set
  of required `jsonKey`s, emitted in property order.

**Emitter I/O contract.**
- **Inputs:** `srs/package/metamodel/{package.json, fields/*.json, types/*.json}` (the source records) and,
  for the bundle stamp (Change H), the source `manifest.json` / `package-manifest.json`.
- **Outputs (this RFC):** the two entity definition files whose seed counterparts exist —
  `tests/rfc-035/goldens/field.json` and `tests/rfc-035/goldens/type.json` — plus one stamped bundle
  envelope (Change H). The other eight in-scope Types (`field-type`, `exact-type-ref`,
  `field-type-constraints`, `ai-guidance`, `ai-guidance-example`, `lineage`, `provenance`, `field-assignment`)
  are **not** standalone outputs; they appear only as `$defs` members of the two entity files (Change C), so
  they are never emitted as top-level goldens.
- The emitter **reads records; it does not write to `docs/schema/2.0/`** — the frozen seed is untouched ([R9]).

**Coverage & `vocabularyRef` scoping.** The emitter is not meta-model-specific — it emits any conforming
domain `Type` — but its golden/closure targets are the meta-model entities, which use only inline
`allowedValues` closed domains (RFC-033 OQ1: the metamodel uses no `vocabularyRef`). Resolving a
`vocabularyRef` to its effective Term keys (RFC-006 Vocabulary + package config) is therefore **out of scope
for the v1 reference emitter**; the front half accepts pre-resolved keys (as `projectField` already does via
`_resolvedVocabKeys`) and the resolution step is deferred to the #260 core service, which has the package
config in hand. Deferred Type facets (lifecycle, inheritance, cross-field validation, field-groups,
`identityFieldId`, `editorHint`) are not in the metamodel v1.0.0 records, so the emitter does not reproduce
those parts of the seed; closure is asserted only over the covered subset (Change F).

### Change C — `$id` policy

The emitter assigns `$id` by a fixed rule with three cases:

- **The frozen meta-model entities** (`field`, `type`) carry the reserved **data-model-line** identity they
  already have: `https://srs.semanticops.com/schema/2.0/<entity>.json` (RFC-033 Change C item 1).
- **Meta-model value objects** (`field-type`, `exact-type-ref`, `field-type-constraints`, `ai-guidance`,
  `ai-guidance-example`, `lineage`, `provenance`, `field-assignment`) get **no standalone `$id`**: they are
  emitted only as `$defs` members of their owning entity file, as in the seed. They are not independently
  emittable.
- **Every other (domain) Type** uses RFC-004's generated-schema template
  `https://srs.semanticops.com/schema/domain/<namespace>/<schemaName>/<version>.json` (RFC-033 Change C item
  2), `<version>` = the Type's integer `version`.

The mapping from a meta-model entity to its reserved `2.0/` id (and which value objects are `$defs` of which
file) is a small fixed table committed with the emitter; it is the inverse of RFC-033's derivation rule.

### Change D — the emitter-owned `$defs` key

A `ref-inline` range's `$defs` key is **emitter-owned** (RFC-032 Change G): it is not read from the records
and is not part of the semantic model. The key MUST be an **injective function of the range's
`(namespace, name, version)`**. The reference emitter freezes the spelling as
`<namespace>__<name>__v<version>` (RFC-032's `rangeDefKey`), e.g.
`com.semanticops.srs__field-type__v1`. The metamodel record supplies the range as an
`ExactTypeRef {typeId, typeVersion}`; the emitter **resolves `typeId` → `(namespace, name)` against the
resolved package** to spell the key (and the `x-srs-range-type` annotation) — a first-class emitter
responsibility, not a record lookup the caller performs.

Because the key is emitter-owned, it legitimately differs from the frozen seed's hand-chosen PascalCase
keys (`FieldType`, `ExactTypeRef`). Closure ([R5], Change F) resolves `$ref`s away entirely before
comparing, so key spelling never participates.

### Change E — name projection (snake_case ↔ lowerCamelCase) and the override table

An SRS `Field.name` is snake_case; a JSON property key is lowerCamelCase. The emitter projects
`Field.name` → JSON key by lowerCamelCasing (`min_items` → `minItems`, `ai_guidance` → `aiGuidance`). The
transform MUST be deterministic and injective over the meta-model field names (verified: no two in-scope
field names collide under it). **This projection is load-bearing for emission, not just for closure
comparison** — the emitted property key is what a #260 consumer reads as the wire property name.

Where the mechanical projection does not equal the seed's property name, an **explicit override table**
supplies the mapping. The one documented case is `field-assignment.assignment_default_value` →
`defaultValue` (`lowerCamelCase` would give `assignmentDefaultValue`). The override table:
- lives in **`docs/schema/2.0/projection-rules.md`** (Change G) as a normative `{ metamodelFieldName →
  jsonKey }` map, keyed by the globally-unique metamodel `Field.name`;
- is applied during **emission** (it sets the emitted property key), and therefore also governs closure.

### Change F — two-tier verification (determinism golden + structural authoritative-subset closure)

The emitter's correctness is checked by two distinct, independently-meaningful gates. Separating them is what
makes "byte-for-byte" honest: the frozen seed's emitter-owned key spellings and hand-authored approximated
envelopes are, by RFC-033's own fidelity dashboard, *not* reproducible from per-field projection, so a naïve
byte-for-byte diff against the seed would fail for reasons that are correct by design.

**Tier 1 — determinism golden (byte-for-byte, on the emitter's own output).** The emitter's output for the
two entity files is committed under `tests/rfc-035/goldens/`. A regenerate-and-diff check asserts the
emitter reproduces those goldens **byte-for-byte** (`--update` regenerates them). This proves the emitter is
deterministic and freezes the emitter-owned spellings ($defs keys, ordering) — the property the #260
regenerate-and-diff CI cutover depends on. It is byte-for-byte because it compares the emitter to *itself*.

**Tier 2 — structural authoritative-subset closure (against the frozen seed).** A closure check — the
whole-entity generalization of `scripts/rfc-033-closure-test.mjs` — asserts the emitter output is
**projection-consistent with the frozen `docs/schema/2.0/{field,type}.json`** for the covered authoritative
features. It is an **`emitter ⊆ seed`** relation (every property the emitter emits, for a covered
authoritative feature, must match the seed after normalization; the seed may carry more), computed under a
precisely-defined normalization applied to **both** sides:

- **(a) `$ref` resolution (inline expansion).** Every `$ref` is resolved to its `$def` body and inlined,
  recursively, on both the emitter output and the seed, **before** structural comparison. This is what makes
  the emitter's `{ $ref: "#/$defs/com.semanticops.srs__field-type-constraints__v1" }` compare equal to the
  seed's *inline* `constraints` object — the single most important normalization, and the one Rev 1 missed.
  It subsumes emitter-owned key spelling (the key is gone after resolution).
- **(b) exclusion set.** These seed elements are excluded from the `⊆` obligation because they are not
  produced by (and are not the responsibility of) per-`fieldType` projection:
  - the **`$schema` envelope meta-property** (in `type.json`'s `required` and both entities' `properties`) —
    it is not a `Field`; distinct from the schema-*dialect* `$schema` keyword the emitter injects at the top
    level;
  - **`type.tags`** — present in the seed's `type.json` but *not* modeled by the metamodel `type` Type (a
    RFC-033 Change A coverage gap; surfaced by this closure);
  - the RFC-033 **Change A deferred facets** (lifecycle, inheritance, cross-field validation, field-groups,
    `identityFieldId`, `editorHint`, and any other seed property with no in-scope metamodel Field);
  - the seed's hand-authored **approximated envelopes** — the entity-level conditional `allOf`/`if`/`then`
    (FieldType R2/R3/R9/R10 co-occurrence), `CrossFieldRule`, and cycle rejection — which remain
    authoritative in the seed + the semantic validator (RFC-033 Change D). For the *approximated* per-field
    shapes (`ref-id`, `dependent`) the emitter MUST still emit the documented lossy shape and MUST NOT drop
    the member.
- **(c) annotation stripping.** `description`, `$comment`, `deprecated` are stripped on both sides (as in the
  RFC-033 closure test).
- **(d) `required[]` as a set-subset.** `required` is compared as a set: every covered non-excluded jsonKey
  the emitter marks required MUST be required in the seed. Array order is not compared (the seed's order is
  hand-authored).

The closure test (`scripts/rfc-035-closure-test.mjs`) MUST **print the excluded seed-property list** it
subtracted (per (b)) on each run. Because an unmodeled seed property is silently removed from the `⊆`
obligation, a metamodel `Field` accidentally dropped in a future edit would move its property into the
excluded set and let the closure still pass; surfacing the list on every run lets review notice the exclusion
set growing unexpectedly (a cheap coverage-regression guard, complementing [R9]).

**Documented-divergence register.** A small committed list (its named home is
`docs/schema/2.0/projection-rules.md`, alongside the name-override table — Change E/G) records places where
the emitter output and the seed *intentionally* differ in covered authoritative shape —
asserted-and-documented rather than required-equal, so the divergence is visible and reviewed, never silently
passed:

- **`type.aiGuidance`.** The metamodel unifies type-level guidance on the full `AiGuidance` value-object
  (`purpose/extraction/negativeGuidance/examples`), so the emitter emits `type.aiGuidance` as the full
  `AiGuidance` (with `examples`); the frozen seed carries a narrowed inline `{purpose, extraction,
  negativeGuidance}`. This is an intentional **upgrade** by the self-hosted model. Consequence:
  regenerating `type.json` at #260 is a documented minor **shape change** (it adds `examples` to
  `type.aiGuidance`), not a byte-preserving flip — recorded here so #260 plans for it ([R9] flip precondition).

**Relationship to RFC-033 [R4](b) (wording refinement).** RFC-033 [R4](b) reads "the #259 emitter … MUST
reproduce the frozen seed **byte-for-byte** for all authoritative features." Taken literally that is
unachievable *even for authoritative features* (emitter-owned `$defs` keys and the inline-vs-`$ref`
structure differ), and Alt B explains why. RFC-035 therefore **refines the wording** of [R4](b): "byte-for-byte"
is delivered by Tier 1 (against the emitter's own goldens), and seed conformance is Tier 2 (structural
authoritative-subset closure). This RFC *discharges the intent* of [R4](b) — the records provably regenerate
the seed's authoritative content — while correcting its unachievable literal phrasing. RFC-033 [R4](b) is
flagged for an amendment note referencing this Change (Change G / the integration pass).

**Classification note (inline-ref is authoritative here).** `metamodel-fidelity.md` classifies
`datatype:ref, mode:inline` as *authoritative*. The per-field `rfc-033-closure-test.mjs` treats all `ref` as
*approximated* only because, at per-field scope, it cannot resolve the emitter-owned `$def` key to compare
structurally. The whole-entity closure **can** — it resolves refs (normalization (a)) — so inline-ref is
compared structurally as authoritative. The generalized closure test aligns to the dashboard; this is where
the `type.aiGuidance` and `constraints` cases are caught and dispositioned (register / normalization).

**The frozen seed is not replaced by this RFC.** `docs/schema/2.0/{field,type}.json` remain the hand-authored
runtime fixed point (RFC-033 [R3]); the emitter proves it *could* be regenerated, but the authorship flip is
the #260 cutover, gated as in [R9].

### Change G — relocate `projection-rules.md` to a live normative home

Move the projection contract from `rfcs/rfc-004/proposed-package/spec-authoring-json-schema/projection-rules.md`
to **`docs/schema/2.0/projection-rules.md`** and re-anchor it from RFC-004's superseded
`schema-definition`/`schema-member` vocabulary to the self-hosted `Field`/`Type` meta-model. It remains the
**normative** source→JSON-Schema contract ([R8]) and gains the details a second implementation needs for
byte-parity:

- **Source is Field/Type records**, not `ext:schema-notation`.
- **Member mapping** — a `Type` renders as an object schema; a `FieldAssignment` renders as one property;
  `required` from `FieldAssignment.required`; `displayLabel` → `title`.
- **`fieldType` → node mapping** — the scalar table (retained verbatim), plus the RFC-032 `ref`
  (inline→`$ref` / reference→id), `map`, `dependent`, `cardinality:list`, `valueDomain:closed`→`enum`, and
  `constraints` rows.
- **Identity & keys** — the `$id` template (Change C), the emitter-owned `$defs` key (Change D).
- **Ordering (normative)** — the fixed top-level key order, the `$defs` pre-order-DFS-by-first-reference
  order (Change B), **and the per-node (intra-fragment) key order** for each projection row (e.g. a scalar
  fragment emits `type` before `format` before the `constraints` keys; a `ref-id` fragment emits `type`,
  `format`, `x-srs-range-type`), so any conforming emitter (including the #260 Rust binding) produces
  byte-identical output rather than inheriting the reference implementation's insertion order implicitly.
- **Generated-schema bundle envelope** — the shape of the emitted schema bundle (Change H): its key set
  (`dataModelRevision` + the entity schemas it carries) and key order, pinned so the #260 binding byte-matches.
- **Documented-divergence register & name-override table** — both committed here as normative data (Change E/F).
- **Name projection & override table** — snake_case → lowerCamelCase (Change E) and the
  `{ metamodelFieldName → jsonKey }` override map.
- **Amendment note** — records that RFC-035 refines RFC-033 [R4](b)'s "byte-for-byte" wording (Change F).

The old path is left as a stub pointer (historical). The reused scalar table and `$id` template are carried
over unchanged.

### Change H — `dataModelRevision` bundle stamping (verified now)

When the emitter emits a **bundle** of generated schemas (as opposed to a single definition file), it MUST
stamp the bundle envelope with the `dataModelRevision` of its source (read from the source `manifest.json` /
`package-manifest.json`; absent ⇒ 0). This emitted **generated-schema bundle is a distinct artifact from
RFC-033's `package-bundle.json`** (the `.srsj` *record* bundle where the `dataModelRevision` field was
originally added, cited here only as the field's prior home): the emitter does **not** validate its output
against `package-bundle.json`; it produces a new bundle *of generated JSON schemas*. That envelope's shape is
pinned in `projection-rules.md` (Change G) — its keys are `dataModelRevision` plus the entity schemas it
carries, in fixed order — so the #260 Rust binding byte-matches. To make this **verifiable in this RFC's Node
deliverable** (not just specified), the reference emitter emits that bundle envelope over the two entity
schemas carrying the stamp, and the Tier-1 determinism golden covers it. This is the emitter half of RFC-033 [R6] / #265: the schema field
already exists additively on `manifest.json`, `package-manifest.json`, and `package-bundle.json`, and the
spec repo is stamped `dataModelRevision: 1`. The emitter *writes* the stamp; **srs-rust reads** it for the
load-time compat diagnostic (a #260 / srs-rust follow-up). Individual generated definition files carry `$id`
(their self-versioned identity), not the revision; the revision travels on the bundle envelope.

### Change I — reconcile srs-rust#770 as the srs-rust binding of this emitter

srs-rust#770's `type_to_json_schema()` is reframed: the **sanctioned projection is this RFC's IR + JSON
emitter**, and the `srs-projection` core service is the **Rust implementation of that emitter**, consuming
`projection-rules.md` as its contract and producing output that matches the reference emitter's goldens
byte-for-byte (CLI + WASM parity, per capability layering — the pinned ordering in Change G/B is what makes
byte-parity attainable). #770's stale pre-RFC-032 mapping table is superseded by the `fieldType` model. Its
still-valid ideas are preserved as **future emitter concerns**, not independent logic: `aiGuidance` emitted
as an *annotation alongside* the validation schema, and `editorHint`/`order` as a *separate UI schema* — both
are additional emitters over the same IR (candidate `future` columns), out of scope for v1 but enabled by the
neutral seam. This work lands with #260 (when `srs-core` adopts `fieldType` and the binary can load the
package); #770 is retargeted accordingly, not closed as duplicate.

---

## Conformance Rules

> **[R1]** An emitter MUST project an in-scope meta-model `Type` record to a target artifact through the
> neutral IR (Change A): resolve the `Type`'s `FieldAssignment`s in `order`, project each `Field`'s
> `fieldType` to a `SchemaNode`, and assemble a `SchemaObject` with `properties` (keyed by the projected JSON
> key), `required` (from `FieldAssignment.required`), and the entity's inline-range `$defs` transitively. The
> IR node's `kind` MUST be derived from the `fieldType` and MUST carry no target-specific keyword; the node
> MUST retain the source `fieldType` verbatim so a JSON emitter reuses RFC-032 `projectField` unchanged.
>
> **[R2]** The JSON Schema 2020-12 emitter MUST render a `SchemaObject` to a `{$schema, $id, title,
> description?, type: object, required?, additionalProperties: false, properties, $defs?}` schema in that fixed
> top-level key order, reusing RFC-032's `projectField` as the per-node renderer (it MUST NOT re-derive
> per-field projection). A `ref-inline` node MUST render as a `$ref` into `$defs`; a `ref-id` node MUST render
> as `{type: string, format: uuid, x-srs-range-type}` and MUST NOT create a `$def`. `$defs` bodies MUST be
> emitted in pre-order depth-first first-reference order.
>
> **[R3]** The `$defs` key for an inline range MUST be an injective function of the range's
> `(namespace, name, version)` and MUST be emitter-owned (derived by resolving the record's
> `ExactTypeRef.typeId` against the resolved package, not read from the record).
>
> **[R4]** The emitter MUST project an SRS `Field.name` (snake_case) to its JSON property key (lowerCamelCase)
> by a deterministic, injective transform, except for the explicitly committed name overrides in
> `projection-rules.md`. The projected key is the emitted wire property name.
>
> **[R5]** For the covered authoritative features (those classified *authoritative* in
> `docs/schema/2.0/metamodel-fidelity.md` and not deferred by RFC-033 Change A), the emitter output for the
> in-scope meta-model Types MUST be **projection-consistent with the frozen `docs/schema/2.0/{field,type}.json`
> as an `emitter ⊆ seed` relation**, computed after the Change F normalization: (a) full `$ref` resolution
> (inline expansion) on both sides; (b) exclusion of the `$schema` envelope meta-property, `type.tags`,
> RFC-033 Change A deferred facets, and the seed's hand-authored approximated envelopes; (c) annotation
> stripping; (d) `required[]` compared as a set-subset. Intentional divergences MUST be enumerated in a
> committed divergence register (Change F), asserted-and-documented rather than silently passed. For every
> *approximated* feature the emitter MUST emit the documented lossy shape and MUST NOT drop the member. This
> discharges the intent of RFC-033 [R4](b) while refining its "byte-for-byte against the seed" wording (Change
> F).
>
> **[R6]** The emitter MUST be deterministic: the same input records MUST produce byte-identical output,
> including a fixed top-level key order and the pre-order-DFS `$defs` order ([R2]). This is enforced by a
> regenerate-and-diff gate against the emitter's own committed goldens (`tests/rfc-035/goldens/`).
>
> **[R7]** The neutral IR and the record→IR front half MUST be target-agnostic: the IR MUST NOT carry a
> target-specific keyword (checkable now via [R1]). As a **staged forward obligation** (discharged when the
> first non-JSON emitter lands, mirroring RFC-033 [R4]'s (a)/(b) staging), adding a protobuf, TypeScript, or
> Rust emitter MUST require only a new IR→target back half with no change to the IR or the front half, and each
> supported emitter MUST have a column in `metamodel-fidelity.md` classifying every feature *authoritative* or
> *approximated*.
>
> **[R8]** `docs/schema/2.0/projection-rules.md` is the normative source→JSON-Schema projection contract,
> including the ordering and name-override rules needed for cross-implementation byte-parity; a conforming JSON
> Schema emitter MUST conform to it.
>
> **[R9]** A generated schema **bundle** MUST carry the `dataModelRevision` of its source (absent ⇒ 0). This
> RFC does not flip authorship: `docs/schema/2.0/{field,type}.json` remain the runtime fixed point (RFC-033
> [R3]); the emitter MUST NOT overwrite them. The #260 authorship flip (records become primary; the emitter
> regenerates the seed; closure becomes a seed-equality gate) MUST be gated on metamodel coverage reaching seed
> parity, or on a documented merge with a hand-maintained remainder for still-deferred facets, so regeneration
> cannot silently narrow the seed (drop `$schema`, `type.tags`, or deferred facets).

---

## Testability

**The ADR-004 trap.** The installed `srs` binary embeds the pre-RFC-032 entity schema and **cannot load the
`fieldType` metamodel package** — `srs repo validate` / a binary-hosted `srs schema generate` fail against it.
So this RFC's deliverable is verified through the **Node runtime pipeline** (`scripts/validate-all.mjs`),
never the binary — exactly as RFC-032/RFC-033 did. The binary path unblocks only when `srs-core` adopts
`fieldType` (srs-rust#767–770), which is the #260 cutover, not this RFC.

Mapping #259's acceptance criteria to concrete Node-pipeline checks:

| #259 criterion | Verification (Node pipeline, wired into `scripts/validate-all.mjs`) |
|---|---|
| Unit tests per projection rule (scalar/format/ref/array/enum/const/constraints) | The RFC-032 `projectField` unit coverage (`tests/rfc-032/run.mjs`, `rfc-032-paper-proof.mjs`) already exercises every per-node rule; the reference emitter reuses `projectField`, so rule coverage is inherited and the emitter adds entity-assembly cases. |
| Golden-file test: emitter output for the seed Types matches committed goldens byte-for-byte | **Tier 1** determinism golden — `tests/rfc-035/run.mjs` regenerates `tests/rfc-035/goldens/{field.json,type.json}` (+ the stamped bundle envelope, Change H) and asserts byte-for-byte equality; `--update` rewrites them. |
| Closure: emitter reproduces the frozen seed's authoritative content | **Tier 2** structural authoritative-subset closure — `scripts/rfc-035-closure-test.mjs` (whole-entity generalization of `rfc-033-closure-test.mjs`) asserts `emitter ⊆ seed` under the Change F normalization, with the exclusion set and divergence register explicit. |
| CLI + WASM parity | **Deferred to #260** (ADR-004): the `srs-projection` core service + `srs schema generate` CLI + WASM binding implement to the pinned `projection-rules.md` contract and MUST match the reference goldens byte-for-byte. Specified here, not built here. |

All checks run under `node scripts/validate-all.mjs`; none requires the binary.

---

## Schema changes

**None** to the entity schemas. This RFC adds a reference emitter, goldens, and a relocated normative doc; it
does **not** modify `docs/schema/2.0/field.json`, `type.json`, or any other entity shape, record, or wire
format. The generated artifacts are ordinary JSON Schema files whose *shape* is already the committed seed.

Non-schema artifacts added/relocated (not entity-schema changes, so no mirror sync of `field.json`/`type.json`
is triggered):

| Artifact | Change |
|---|---|
| `docs/schema/2.0/projection-rules.md` | **new** normative doc (relocated + re-anchored from `rfcs/rfc-004/proposed-package/spec-authoring-json-schema/projection-rules.md`; adds ordering + name-override + amendment note) |
| `docs/schema/2.0/metamodel-fidelity.md` | verification note updated: the JSON-Schema column is machine-checked by the whole-entity emitter closure (RFC-035), superseding the per-field `projectField` stand-in reference |
| `scripts/lib/schema-emitter.mjs` | **new** reference emitter (front half + JSON emitter), reusing `scripts/lib/rfc-032-fieldtype.mjs` (version-neutral library name; see OQ1) |
| `tests/rfc-035/goldens/{field.json,type.json}` + bundle, `tests/rfc-035/run.mjs` | **new** Tier-1 determinism goldens + runner |
| `scripts/rfc-035-closure-test.mjs` | **new** Tier-2 whole-entity semantic closure vs the frozen seed (with exclusion set + divergence register) |
| `scripts/validate-all.mjs` | wires the new determinism + closure checks into the Node pipeline |

Because no entity schema shape changes, `scripts/check-schema-sync.sh` and the `srs-rust`/`srs-vscode`
mirrors are unaffected by this RFC.

**Integration manifest (issue #204).** On acceptance this RFC folds in **tooling + docs only** (a relocated
normative `projection-rules.md`, a fidelity-note update, the emitter/goldens/closure scripts) — no
entity-schema, record, or Type artifact. Its `srs-integration:v1` manifest is therefore **`tooling-only`**
(the RFC-035 stub record carries it), which the integration gate accepts.

---

## Rationale

**Why a neutral IR rather than emitting JSON directly from `projectField`.** `projectField` already emits
JSON-Schema fragments, so the shortest path is "walk the Type, call `projectField`, assemble." But that
hard-wires JSON-Schema keyword choices into the one place every future target must also read. Epic #256's
whole architecture is "one source → one IR → N emitters"; the IR is the contract that lets the protobuf/TS/Rust
emitters (already reserved as `future` fidelity columns) reuse the semantic front half. The IR keeps the cost
low by **retaining the source `fieldType`** on each node (so the JSON emitter's `projectField` runs unchanged)
while adding a derived `kind` tag a non-JSON target dispatches on — reuse and target-neutrality reconciled at
the same seam.

**Why two verification tiers, and why the closure is `emitter ⊆ seed`.** The seed is hand-authored: it uses
PascalCase `$defs` keys, *inlines* some value-objects the metamodel models as inline-ref Types, carries
`allOf`/`if`/`then` envelopes and cross-field rules no per-field projection produces, and includes envelope
meta-properties (`$schema`) and a coverage-gap property (`type.tags`) the metamodel does not model. A single
byte-for-byte diff against it is therefore *wrong*. Tier 1 (byte-for-byte against the emitter's own output)
gives the strict reproducibility the CI cutover needs; Tier 2 (structural `emitter ⊆ seed` closure, after
resolving `$ref`s and excluding the seed-only/approximated elements) gives the honest "the records reproduce
the seed's authoritative content" claim. The `$ref`-resolution step is the crux — without it the emitter's
`$ref`+`$def` can never match the seed's inline `constraints`, and the gate would fail on a difference that is
correct.

**Why the seed is not replaced now, and why the flip has a precondition.** Regenerating and overwriting
`field.json`/`type.json` is the metacircular authorship flip — well-founded only once the closure gate is
trusted and the binary can load the `fieldType` package. RFC-033 [R3] keeps the seed the loaded fixed point;
#260 owns the flip. And because the emitter emits `additionalProperties:false` over only the covered subset,
an *ungated* flip would silently narrow the seed (drop `$schema`, `type.tags`, `editorHint`, lifecycle,
inheritance, …). [R9] therefore gates the flip on coverage parity or a documented merge — the load-bearing
boundary between "specify enough for #260" and "hand #260 a safe cutover."

**Why the srs-rust binding waits for #260.** ADR-004: the installed `srs` binary embeds the pre-RFC-032
schema and cannot load `com.semanticops.srs/metamodel`, so a binary-hosted `srs schema generate` cannot be
validated until `srs-core` adopts `fieldType` (srs-rust#767–770). The reference emitter is fully verifiable
through the Node pipeline today; specifying the core-service/CLI/WASM surface now (so #260 implements to a
fixed, byte-parity-pinned contract) without building it mirrors exactly how RFC-033 specified but deferred its
embedded-bundle wiring.

---

## Alternatives Considered

### Alt A — emit JSON directly from `projectField`, no neutral IR

Skip the IR; the emitter is "walk the Type, call `projectField`, assemble the envelope." Rejected: it
hard-wires JSON-Schema keyword choices into the shared projection path, so the second emitter (protobuf/TS/Rust
— already reserved in the fidelity dashboard) would have to duplicate the front half or refactor the first
emitter. The IR is the seam epic #256's architecture requires; adding it now is cheap.

### Alt B — a single byte-for-byte golden against the frozen seed

Make the one test "emitter output == `field.json`/`type.json`, byte for byte." Rejected: the seed's
emitter-owned `$defs` key spellings, its inline value-objects, and its hand-authored approximated envelopes are
— by RFC-033's own fidelity dashboard — *not* reproducible from per-field projection. Such a test could only
pass by weakening the emitter or doctoring the seed. The two-tier split keeps both gates strict; this is why
RFC-035 refines [R4](b)'s wording (Change F).

### Alt C — fold the srs-rust core service / CLI / WASM into this RFC

Build `srs-projection` + `srs schema generate` + the WASM binding now. Rejected (owner-confirmed): the binary
cannot load the `fieldType` package until `srs-core` adopts it (ADR-004, srs-rust#767–770), which is the #260
cutover; there is no way to validate a binary-hosted generator in this pass.

### Alt D — regenerate and replace the frozen seed in this RFC

Have the emitter overwrite `field.json`/`type.json` and make the test a seed-equality gate. Rejected: that is
the #260 authorship flip, well-founded only once the closure gate is trusted and the binary can load the
package; RFC-033 [R3] keeps the seed the loaded fixed point, and [R9] shows the flip needs a coverage-parity
precondition first.

### Alt E — keep `projection-rules.md` in the RFC-004 tree and cite it

Leave the contract where it is and reference the historical path. Rejected: RFC-033 Change E explicitly made
its relocation #259's job, and a normative contract must not live inside a superseded RFC's never-loaded
proposed package.

### Alt F — harmonize the seed to match the emitter (make `constraints`/`type.aiGuidance` a `$ref`)

Resolve the inline-vs-`$ref` and `type.aiGuidance` divergences by *editing the frozen seed* now so the emitter
matches it structurally without a `$ref`-resolution step. Rejected for this RFC: RFC-033 [R3] freezes the seed
as the runtime fixed point, and reshaping it is the #260 cutover's job (where authorship flips and the seed is
regenerated from records anyway). Editing the seed here would be a schema change (breaking the "Schema changes:
None" property and touching the mirrors) to serve a test. The `$ref`-resolution normalization (Change F(a))
achieves the same comparison without touching the seed; the divergence register makes the `type.aiGuidance`
upgrade explicit for #260 to regularize.

---

## Open Questions

1. **Emitter file naming / home for the Node reference.** `scripts/lib/schema-emitter.mjs` (version-neutral,
   since the emitter outlives this RFC number) + `tests/rfc-035/` (RFC-numbered fixtures) is the chosen
   layout, mirroring the RFC-032 convention while not pinning durable code to an RFC number. *Leaning:* as
   stated. Recorded, not resolved.

2. **Whether the whole-entity closure supersedes or extends `rfc-033-closure-test.mjs`.** The per-field
   closure (RFC-033 [R4](a)) and the whole-entity closure (this RFC, [R5]) overlap but fail for different
   reasons and localize differently. *Leaning:* keep both — the per-field test as the `fieldType`-unit check,
   the whole-entity closure as the entity-assembly check. Recorded, not resolved.

3. **`x-srs-range-type` annotation as authoritative vs advisory.** The `ref-id` shape carries
   `x-srs-range-type` so a consumer can recover the referent Type; the fidelity dashboard classifies
   reference-mode as *approximated*. Whether a future emitter should promote this to a stricter construct is
   deferred to reference-integrity validation (#242). Recorded, not resolved.

4. **Whether #260 regularizes the seed's inline shapes to match the emitter.** At the authorship flip the seed
   is regenerated from records, which would turn the seed's inline `constraints` into a `$ref` and upgrade
   `type.aiGuidance` to full `AiGuidance` (the divergence register). *Leaning:* yes — #260 accepts these as the
   regenerated shape (documented, reviewed), which also lets the closure become a straight seed-equality gate.
   Gated by [R9]'s coverage-parity precondition. Recorded, not resolved.
