# JSON Schema Projection Rules (normative)

**Status**: Normative (RFC-035 [R8]). Relocated and re-anchored from RFC-004's
`rfcs/rfc-004/proposed-package/spec-authoring-json-schema/projection-rules.md` (RFC-004 is Superseded; RFC-033
Change E / RFC-035 Change G).

This document defines how the **self-hosted SRS Field/Type meta-model** projects to JSON Schema 2020-12. The
source of a schema is now **`Field`/`Type` records** (RFC-032 `fieldType` model), not RFC-004's retired
`schema-definition`/`schema-member` (`ext:schema-notation`) vocabulary. The reference emitter is
`scripts/lib/schema-emitter.mjs`; the per-node projection is RFC-032 `projectField`
(`scripts/lib/rfc-032-fieldtype.mjs`), reused unchanged. A conforming emitter (including the #260
`srs-projection` Rust binding) MUST produce byte-identical output to this contract.

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

- A `Type` renders as a JSON Schema object with `type: "object"`, `additionalProperties: false`, `properties`,
  and (when non-empty) `required`, plus `$schema`/`$id`/`title`/`description` on a top-level entity schema.
- Each `FieldAssignment` renders as one property under `properties`, in `FieldAssignment.order`.
- `FieldAssignment.required == true` adds the property key to the parent `required[]`.
- `FieldAssignment.displayLabel` renders as `title` (presentation annotation).
- `Field.description` / a Type's `aiGuidance.purpose` may render to `description` / `$comment`.

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
the emitter resolves `typeId` → `(namespace, name)` against the package to spell the key. Because the key is
emitter-owned, closure comparisons resolve `$ref`s away before comparing (never compare key spelling).

## Name projection (snake_case → lowerCamelCase) and the override table

**Scope (RFC-039 [R2a], erratum to RFC-035 [R4]):** the name projection below and its override
table bind schema emission for the **in-scope meta-model Types only** — the frozen-seed entities
whose emitted keys must match the hand-authored `field.json`/`type.json` spellings. A **domain
Type** projects each property key as its `Field.name` **verbatim** — no case or separator
transformation — so instance keys ([R2b], canonical I-130) and projected schema keys are
identical by construction.

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

## Constraints

Portable constraints render to their closest JSON Schema equivalents: numeric bounds (`minimum`/`maximum`),
string length (`minLength`/`maxLength`), `pattern`, and array `minItems`/`maxItems`.

## Amendment note — RFC-033 [R4](b)

RFC-035 **refines the wording** of RFC-033 [R4](b): "the #259 emitter MUST reproduce the frozen seed
byte-for-byte for all authoritative features." Byte-for-byte is delivered against the **emitter's own committed
goldens** (`tests/rfc-035/`, Tier 1); conformance to the **seed** is the structural **`emitter ⊆ seed`**
closure over covered authoritative features (`scripts/rfc-035-closure-test.mjs`, Tier 2). Literal
byte-equality against the seed is unachievable even for authoritative features (emitter-owned `$defs` keys and
the seed's inline-vs-`$ref` structure), so this refinement discharges [R4](b)'s intent while correcting its
phrasing.
