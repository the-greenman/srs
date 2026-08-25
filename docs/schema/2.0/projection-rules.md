# JSON Schema Projection Rules (normative)

**Status**: Normative (RFC-035 [R8]). Relocated and re-anchored from RFC-004's
`rfcs/rfc-004/proposed-package/spec-authoring-json-schema/projection-rules.md` (RFC-004 is Superseded; RFC-033
Change E / RFC-035 Change G).

This document defines how the **self-hosted SRS Field/Type meta-model** projects to JSON Schema 2020-12. The
source of a schema is now **`Field`/`Type` records** (RFC-032 `fieldType` model), not RFC-004's retired
`schema-definition`/`schema-member` (`ext:schema-notation`) vocabulary. The reference emitter is
`scripts/lib/schema-emitter.mjs`; the per-node projection is RFC-032 `projectField`
(`scripts/lib/rfc-032-fieldtype.mjs`), reused unchanged. A conforming emitter — including the `srs-projection`
Rust twin (`srs-projection/json_schema.rs` + `rfc_035_parity.rs`) — MUST produce byte-identical output to this
contract.

**Current parity status (RFC-040 Unit 3, srs#479):** the Rust twin **has shipped** for RFC-035's original scope
(the stale "deferred to #260" note this superseded referred only to the #260 **authorship flip** — whether the
seed or the emitter owns the committed bytes — never to whether a Rust emitter exists at all). It does **not
yet** implement this unit's three additions — effective-Type resolution (Change A), the facing distinction
(Change G), or conditional projection (Change F) — verified directly against `crates/srs-projection/src/json_schema.rs`
in `srs-rust`, which has no reference to `extends_type_id`, `field_order`, `field_assignment_overrides`, or
`validationRules`/`allOf` conditional projection. This gap is named precisely, with its own scope, in the
srs-rust follow-up filed at this unit's landing (a comment on srs-rust#868, which separately also covers the
`FieldAssignment.description` schema-mirror gap and the `$defs` key rename — three distinct items, not one).
Parity remains the eventual closure criterion; it is not yet held for Change A/F/G specifically.

## Identity (`$id`)

Three cases (RFC-035 Change C):

- **Frozen meta-model entities** `field`, `type` keep the reserved data-model-line id
  `https://srs.semanticops.com/schema/2.0/<entity>.json`.
- **Meta-model value objects** (`field-type`, `exact-type-ref`, `field-type-constraints`, `ai-guidance`,
  `ai-guidance-example`, `lineage`, `provenance`, `field-assignment`) have **no standalone `$id`** — they are
  emitted only as `$defs` of their owning entity file.
- **Domain (non-meta-model) Types** use `https://srs.semanticops.com/schema/domain/<namespace>/<schemaName>/<version>.json`,
  where `<version>` is the Type's integer `version`.

## Member Mapping

- A `Type` renders as a JSON Schema object with `type: "object"`, `properties`, and (when non-empty) `required`,
  plus `$schema`/`$id`/`title`/`description` on a top-level entity schema. `additionalProperties` follows the
  **facing** (below): always `false`, but an instance-facing schema additionally declares an open `meta`
  property, so `additionalProperties: false` still closes everything else.
- The emitter always resolves the Type's **effective** field set first (ancestor chain, I-39..43 — see
  "Effective-Type resolution" below), never a Type's own bare `fields[]`.
- Each effective `FieldAssignment` renders as one property under `properties`, in composition order
  (`FieldAssignment.order`, or the Type's own `fieldOrder` when declared — I-41).
- `FieldAssignment.required == true` adds the property key to the parent `required[]` (post any
  tighten-only `fieldAssignmentOverrides` — I-42).
- `FieldAssignment.displayLabel` renders as `title` (presentation annotation).
- `FieldAssignment.description` (RFC-040 Change C) renders as the property's own `description` —
  documentation-only, annotation position only, never a constraint keyword.
- A Type's own `validationRules` (RFC-040 Change F) render as `allOf` guards on that same Type's schema — see
  "Conditional projection" below.

## Effective-Type resolution (RFC-040 Change A; I-39..43 + I-97)

The emitter never projects a Type's own bare `fields[]` — it always resolves the **effective** Type first
(`scripts/lib/schema-emitter.mjs` `resolveEffectiveType` / `withEffectiveType`), in one of two directions:

- **Child-perspective (the general case, `resolveEffectiveType`):** a Type declaring its own `extendsTypeId`
  merges its ancestor's effective fields with its own (recursive, acyclic — I-39), applies its own
  `fieldAssignmentOverrides` (I-42: only to inherited fields, `required` tighten-only, `displayLabel` override),
  and its own `fieldOrder` (I-41: an exact permutation of the effective fieldId set) if declared. `I-97`:
  `validationRules` is never inherited by value — a Type's own array is its complete, exclusive set.
- **Base-perspective sibling-merge (`withEffectiveType`, bootstrap-specific):** used only for the frozen `field`
  and `type` entities themselves, whose extension-owned facets (`ext:lifecycle`, `ext:type-inheritance`,
  `ext:cross-field-validation`) are modelled as **separate sibling Types independently extending core `type`**
  (Change A), not a single ancestor chain. This direction unions ALL of a base's extenders at once to
  reconstitute the seed's one flat object — a query only the metamodel's own bootstrap needs.

Both directions propagate any declared `fieldOrder` onto the returned Type so `emitBody`'s single ordering step
(default `.order` sort, then the `fieldOrder` override) runs exactly once regardless of direction.

## The facing distinction (RFC-040 Change G; rfc-decision-2e0cd70a)

`emitEntity(ctx, typeName, { facing })` — `"definition"` (default) or `"instance"`:

- **Definition-facing** (the frozen `field`/`type` entities, and any Type/value-object definition schema):
  fully closed, `additionalProperties: false`, no escape.
- **Instance-facing** (a domain Type's projected schema, used to validate a Record's `fieldValues` interior):
  **closed except `meta`** — the emitted schema declares a synthetic `meta: { type: "object" }` property
  (whether or not the Type itself has a Field named `meta`) so the sanctioned extension carrier validates,
  while every other undeclared key is still rejected — the validation complaint on those IS the graded,
  louder diagnostic `2e0cd70a` calls for. Definitions remain reject-unknown always (`2e0cd70a`: "the
  definition layer is unchanged by this decision").
- `$schema`/`title` are emitted uniformly on both facings; annotations (`description`, `displayLabel` → `title`)
  project on both facings identically — facing changes only the closed-vs-closed-except-`meta` posture.

**Boundary with #272:** this train lands the facing mechanism and contract — proven on definition entities and
domain-Type golden fixtures (`tests/rfc-040-unit3/`) — not the production instance-layer schema set (the
24-schema ledger), which remains #272's to generate.

## Conditional projection (RFC-040 Change F)

Two mechanisms, both machine-checked by the byte-closure and Unit-3 golden tests:

- **The `FieldType` entity-level co-occurrence envelope** (R2/R3/R9/R10 in `rfc-032-fieldtype.mjs`
  `validateFieldType`) — a fixed, hand-mirrored `allOf` (`FIELD_TYPE_ENVELOPE` in `schema-emitter.mjs`),
  entity-specific rather than data-driven (these are structural rules over `FieldType`'s own properties, not a
  generic `CrossFieldRule` projection). Authoritative, not approximated, in the JSON Schema column.
- **A Type's own `validationRules`** (`CrossFieldRule[]`, `projectValidationRules`) project to `allOf` guards on
  that Type's own schema: `conditional-required`/`conditional-forbidden` as `if`/`then` (and `if`/`then`/`not`)
  guards keyed on the predicate field's projected JSON key; `mutual-exclusion` as pairwise `not: {required:
  [a, b]}` guards over every pair in `fieldIds` (correct and simple for any N, without a combinatorial
  `oneOf`). `field-ordering` has no JSON Schema construct (document order is not schema-checkable) and is
  intentionally left unprojected — still **approximated**, per the fidelity dashboard; a rule of that kind is
  silently skipped in the `allOf`, never dropped without record (the dashboard states the gap).

## `fieldType` → JSON Schema node mapping

Rendered by `projectField` (RFC-032 Change G), reused unchanged:

- `datatype` scalar (`string`/`number`/`integer`/`boolean`/`date`/`date-time`) → JSON `type` (+ `format` for
  date/date-time), per the portable scalar table.
- `format` (`plain`/`markdown`/`uri`/`uuid`/`email`) → `format` / `contentMediaType` (markdown).
- `valueDomain: "closed"` with inline `allowedValues` → `{ type: "string", enum: [...] }`. A `vocabularyRef`
  (configurable range) → `enum` of the vocabulary's effective Term keys **at generation time** (approximated;
  resolution is the #260 core service's job — the v1 reference emitter handles inline `allowedValues` only).
- `cardinality: "list"` → `{ type: "array", items: <node> }` (+ `minItems`/`maxItems`).
- `constraints` (`minLength`/`maxLength`/`pattern`/`minimum`/`maximum`) → the same JSON Schema keywords.
- `datatype: "ref"`, `mode: "inline"` → `{ $ref: "#/$defs/<defKey>" }` (authoritative).
- `datatype: "ref"`, `mode: "reference"` → `{ type: "string", format: "uuid", "x-srs-range-type": "<ns>/<name>@<v>" }`
  and **contributes no `$def`** (approximated; the referent's Type is not enforced by the string+uuid shape).
- `datatype: "map"` → `{ type: "object", additionalProperties: <scalar-node|true> }`.
- `datatype: "dependent"` → `{}` (deliberately lossy; conformance is a validation obligation).

## Portable Scalar Mapping

| Scalar | JSON Schema |
|---|---|
| `string` | `{ "type": "string" }` |
| `number` | `{ "type": "number" }` |
| `integer` | `{ "type": "integer" }` |
| `boolean` | `{ "type": "boolean" }` |
| `date` | `{ "type": "string", "format": "date" }` |
| `date-time` | `{ "type": "string", "format": "date-time" }` |
| (`format`) `uuid` | `{ "type": "string", "format": "uuid" }` |
| (`format`) `uri` | `{ "type": "string", "format": "uri" }` |
| (`format`) `email` | `{ "type": "string", "format": "email" }` |
| (`format`) `markdown` | `{ "type": "string", "contentMediaType": "text/markdown" }` |

## The `$defs` key (emitter-owned)

An inline `ref` range's `$defs` key is **emitter-owned** (RFC-032 Change G / RFC-035 Change D): an **injective
function of the range's `(namespace, name, version)`**, spelled `<namespace>__<name>__v<version>` (e.g.
`com.semanticops.srs__field-type__v1`). The record supplies the range as an `ExactTypeRef {typeId, typeVersion}`;
the emitter resolves `typeId` → `(namespace, name)` against the package to spell the key.

**RFC-040 Unit 3 (srs#479):** the frozen seed's `$defs` keys — previously an ad hoc PascalCase spelling
(`FieldType`, `AiGuidance`, ...) predating this emitter — were renamed to this same emitter-owned spelling as
part of ending `$ref`-resolution in the Tier-2 closure comparison: the committed `$defs` layout now equals the
emitter's, not a hand-picked name. `scripts/check-idl-schema-conformance.mjs`'s `Type.FieldAssignment` pointer
was updated to match (`#/$defs/com.semanticops.srs__field-assignment__v1`).

## Name projection (snake_case → lowerCamelCase) and the override table

**Scope (RFC-039 [R2a], erratum to RFC-035 [R4]):** the name projection below and its override
table bind schema emission for the **in-scope meta-model Types only** — the frozen-seed entities
whose emitted keys must match the hand-authored `field.json`/`type.json` spellings. A **domain
Type** projects each property key as its `Field.name` **verbatim** — no case or separator
transformation — so instance keys ([R2b], canonical I-130) and projected schema keys are
identical by construction. **Enforced (RFC-040 Unit 3, srs#479):** `schema-emitter.mjs`'s `wireKey`
scopes the transform to the metamodel package only (`ctx.pkg.namespace === "com.semanticops.srs"`);
previously `jsonKey`/`NAME_OVERRIDES` applied unconditionally to every package, which would silently
rewrite a domain Field literally named `kind` to `type` — caught by the `tests/rfc-040-unit3/`
golden fixture (a domain Type using that exact Field name) and fixed as part of this unit.

A metamodel `Field.name` (snake_case) projects to a lowerCamelCase JSON property key (`min_items` → `minItems`). The
transform is deterministic and injective over the in-scope metamodel field names. The **override table** — the
committed `{ metamodelFieldName → jsonKey }` map, keyed by the `Field.name` (unique within the
metamodel package; global uniqueness is not assumed), applied during
**emission** (it sets the emitted wire key) — supplies the mapping where the mechanical projection differs from
the intended key:

| Metamodel `Field.name` | JSON key | Reason |
|---|---|---|
| `kind` | `type` | `CrossFieldRule.type` (RFC-040 Change B) — the seed spells the kind discriminator `type`; the metamodel Field is named `kind` to avoid overloading `type`'s generic sense in this vocabulary |
| `transition_name` | `name` | `LifecycleTransition.name` (RFC-040 Change B) — `name` is reserved on the shared identity Field (namespace-scoped, snake_case); a transition's name is neither |

## Ordering (normative — for cross-implementation byte-parity)

- **Top-level key order:** `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`,
  `properties`, `$defs` (omit any absent key).
- **`$defs` bag order:** pre-order depth-first by **first reference** — walk `properties` in order; on the first
  encounter of an inline range, reserve its `$def` slot, then recurse into *its* inline ranges before
  continuing (parent `$def` before nested `$def`s).
- **Per-node (intra-fragment) key order:** each projection row emits keys in a fixed order — a scalar fragment
  emits `type`, then `format`/`contentMediaType`, then the constraint keys (`minLength`, `maxLength`, `pattern`,
  `minimum`, `maximum`), then `enum` (for a closed domain); a list wraps as `{ type: "array", items, minItems?,
  maxItems? }`; a `ref-id` fragment emits `type`, `format`, `x-srs-range-type`. A property's `title` (from
  `displayLabel`) is appended last.

## Generated-schema bundle envelope

The emitter's schema **bundle** (RFC-035 Change H) is a distinct artifact from RFC-033's `package-bundle.json`
(the `.srsj` record bundle). Its shape, fixed for byte-parity: `{ "dataModelRevision": <int>, "schemas": {
"<entity>": <schema>, ... } }` — `dataModelRevision` first (the source manifest's value; absent ⇒ 0), then the
entity schemas in the order requested. The emitter writes the stamp; srs-rust reads it for the load-time compat
diagnostic (#260).

## Documented-divergence register (closure)

Places where the emitter output and the frozen seed *intentionally* differ in covered authoritative shape are
recorded here (RFC-035 Change F) — asserted-and-documented by `scripts/rfc-035-closure-test.mjs`, never silently
passed:

| Entity.property | Divergence | Disposition |
|---|---|---|
| `type.aiGuidance` | Metamodel unifies type-level guidance on the full `AiGuidance` value-object (adds `examples` + required `purpose`); the frozen seed carries a narrowed inline `{purpose, extraction, negativeGuidance}`. | Intentional upgrade by the self-hosted model; #260 regularizes the seed at the authorship flip (RFC-035 OQ4). |

**Parked, not a divergence (RFC-040 Unit 3, srs#479):** `FieldAssignment.description` values are authored in
`gen-metamodel-package.mjs`'s `TYPE_SPECS` (byte-matched against the frozen seed's per-property annotation
text) but deliberately **not yet written** to the generated `srs/package/metamodel/**` records — every metamodel
Type's `fields[]` validates against `type.json#/$defs/FieldAssignment` under the **pinned srs-rust binary's own
embedded schema copy** (`v0.1.0-build.284`, and no later release through `v0.1.0-build.294` either), which
predates Change C and is `additionalProperties:false` there; populating `description` on any FieldAssignment
entry makes `srs repo validate --repo srs` fail to load the catalog entirely (16+ fatal diagnostics, not a
soft warning) — the same class of gap srs-rust#868 already parked a schema-touching srs-side change for
(`packageDependencies`). The emitter mechanism, the schema capability (`type.json#/$defs/FieldAssignment.description`,
landed in Unit 1), and the byte-matched text are all in place; only the corpus population is deferred, tracked
by the srs-rust follow-up filed at this unit's landing (extends #868). `docs/schema/2.0/field.json`/`type.json`
therefore do not yet carry per-property `description` annotations — this is the current, honest state of the
committed seed and the regenerate-and-diff gate's baseline, not a gap the gate is failing to catch.

## Constraints

Portable constraints render to their closest JSON Schema equivalents: numeric bounds (`minimum`/`maximum`),
string length (`minLength`/`maxLength`), `pattern`, and array `minItems`/`maxItems`.

## Amendment note — RFC-033 [R4](b), superseded by RFC-040's byte-closure contract

RFC-035 had refined RFC-033 [R4](b) to say literal byte-equality against the seed was unachievable (emitter-owned
`$defs` keys and the seed's inline-vs-`$ref` structure would always differ). **RFC-040 Unit 3 (srs#479)
supersedes that refinement**: `docs/schema/2.0/field.json`/`type.json` now **regenerate byte-for-byte** from
the metamodel package (`scripts/check-schema-regenerate-drift.mjs`, wired into `validate-all.mjs`) — annotations
and `$defs` layout included — modulo exactly two named, asserted-and-documented exceptions: the
`type.aiGuidance` divergence-register entry above, and the parked `FieldAssignment.description` corpus
population (also above). Both are exclusions by name, not a wildcard tolerance; a future regression anywhere
else is caught by the regenerate-and-diff gate. Byte-for-byte against the emitter's own committed goldens
(`tests/rfc-035/`, Tier 1) and the structural `emitter ⊆ seed` closure (`scripts/rfc-035-closure-test.mjs`,
Tier 2) both continue to hold as before, now joined by this literal, whole-file Tier-3 check.
