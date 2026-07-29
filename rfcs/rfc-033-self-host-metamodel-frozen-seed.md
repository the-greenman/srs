> **GitHub issue**: [the-greenman/srs#266](https://github.com/the-greenman/srs/issues/266) · delivers Task **#258** (RFC B) under epic **#256**; builds on RFC-032 (#257) and RFC-029; folds in **#265**

# RFC-033: Self-hosting the meta-model — the frozen-seed bootstrap package

**Status**: In Progress (Revision 3)
**Affects**: `Field`, `Type`, `FieldAssignment`, `FieldType`, `FieldTypeConstraints`, `ExactTypeRef`, `AiGuidance`, `AiGuidanceExample`, `Lineage`, `Provenance`; new frozen foundational package `com.semanticops.srs/metamodel`; `docs/schema/2.0/{field,type,manifest,package-manifest,package-bundle}.json`; supersedes RFC-004's `schema-definition`/`schema-member` vocabulary (reuses its `projection-rules.md`); `docs/research/alignment-opportunities.md` (LinkML). Builds on **RFC-032 (Accepted)** and **RFC-029 (Accepted)**. Folds in **#265** (`dataModelRevision`). **Non-breaking** (additive: a new package + optional manifest fields + a doc-only annotation on the frozen entity schemas; no id-level namespace reservation — see Change A).
**Author**: Claude Code (agent), on behalf of the repository owner
**Date**: 2026-07-29

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-29 | Initial draft. Self-host the meta-model as SRS Field/Type records in `com.semanticops.srs/metamodel`; frozen-seed bootstrap (fixed point, embedded bundle, never re-derived); `dataModelRevision` versioning (folds #265); authoritative-vs-lossy fidelity dashboard; supersede RFC-004 vocabulary (reuse projection-rules); add LinkML to the alignment register. |
| 3 | 2026-07-29 | Owner design-checkpoint confirmed: namespace `com.semanticops.srs/metamodel`, v1.0.0 = core definition layer. Re-review converged to **zero blocking** (both reviewers); applied residual cosmetic nits (Abstract lists all ten entities; Change D coverage-vs-fidelity clause; Field-sharing derivation clause). Implementation started; RFC + schema committed to branch `rfc/033-self-host-metamodel`. |
| 2 | 2026-07-29 | Two-reviewer round (Spec Integrity: 0 blocking; Completeness: 2 blocking), all findings applied. **Added a `## Testability` section** stating the binary-cannot-validate trap and mapping #258's three criteria to Node-pipeline checks + the `projectField` closure stand-in. **Reframed the metamodel package from "always-available/implicit-merge" to a normal `packageRef`-resolved foundational package** (resolves the RFC-029 Alt E contradiction; the loader needs the JSON-Schema seed, not the package; removes the latent namespace-reservation breaking change). **Added a normative derivation rule** (property→Field, `$def`→Type, `required[]`→`FieldAssignment.required`, declaration-order→`order`) + the snake_case↔camelCase name-projection rule; **pinned the UUID assignment**. **Added a coverage-scope statement** (v1.0.0 = core definition layer; extension-contributed Type facets deferred) distinct from emitter fidelity. **Fixed the [R6] "absent⇒0 vs fieldType⇒rev1" contradiction** (migration #1 stamps + re-stamps already-migrated repos). **Added `package-bundle.json` as the stamp target.** Made [R4] a forward obligation on #259 with the in-scope stand-in; made [R7] normative. Closed OQ3; count fixed to ten; RFC-004 disposition + integration items noted. |

---

## Abstract

Epic #256 dissolves the meta-model's drift problem structurally: the SRS meta-model (`Field`, `Type`, and
their value-objects) is maintained today in ~4 hand-edited, silently-diverging copies — two pseudo-IDL prose
renderings, the `docs/schema/2.0/*.json` JSON Schemas, and the Rust structs. RFC-032 gave `Field` the
expressiveness (composite `ref` range, `dependent`, `map`, `constraints`) needed to describe those nested,
recursive, typed shapes **in SRS's own type system**. This RFC does the self-hosting: it expresses `Field`,
`Type`, `FieldAssignment`, `FieldType`, `FieldTypeConstraints`, `ExactTypeRef`, `AiGuidance`,
`AiGuidanceExample`, `Lineage`, and `Provenance` (ten entities — see Change A) as **SRS `Type` records** in a new
**frozen foundational package** `com.semanticops.srs/metamodel`,
authored and shipped by the RFC-029 mechanism (deterministic `.srsj` bundle, embedded, `--check`-verified). The
metacircular loop `Field → FieldType → ExactTypeRef → Type → FieldAssignment → Field` closes on itself.

To keep bootstrapping well-founded (a schema that describes itself cannot be re-derived from itself at
runtime), the hand-authored `docs/schema/2.0/{field,type}.json` remain the **frozen seed** — the fixed point,
loaded as committed, never re-derived. The relationship between the seed and the self-hosted records is a
**build-time consistency obligation** (demonstrated now via the RFC-032 `projectField` stand-in; discharged in
full by the #259 emitter), not a runtime derivation. Because a JSON Schema (or protobuf, or Rust) emitter
cannot faithfully express every meta-model feature, this RFC introduces a per-emitter **fidelity dashboard**
(LinkML discipline): every feature is declared *authoritative* (round-trips faithfully) or *approximated* (the
frozen seed carries the authoritative form). It folds in **#265** — a monotonic-integer `dataModelRevision`
stamp so a repository, its bundle, and the migration registry all reference one generation number. It
**formally supersedes RFC-004's** separate `schema-definition`/`schema-member` schema-notation vocabulary — one
substrate (self-hosted Field/Type) replaces two — while **reusing RFC-004's `projection-rules.md`** as the
emitter contract. The emitter itself (#259), the `fieldValues` instance representation (#242), and rendering
(#262) remain separate, sequenced tasks; v1.0.0 self-hosts the **core definition layer**, deferring
extension-contributed Type facets (lifecycle, inheritance, cross-field validation, field-groups) as later
metamodel-package versions.

---

## Motivation

### Problem 1 — the meta-model lives in ~4 hand-maintained, drifting copies

`Field` and `Type` are the two most load-bearing shapes in SRS, and their definitions are duplicated across:
the `docs/schema/2.0/field.json` / `type.json` JSON Schemas; the pseudo-IDL prose in the spec records
(`com.semanticops.spec/type-definition`, `field-definition`, and the `com.semanticops.srs/meta.*` wrappers);
and the Rust structs in `srs-core`. Each copy is edited by hand; nothing keeps them in step. RFC-031 added a
transitional drift check, but policing drift is not the same as removing its cause. The cause is **more than
one source of truth**.

### Problem 2 — the meta-model is not yet described in its own type system

SRS is a system for defining Types and validating Records against them. Its own most important Types —
`Field` and `Type` — are the one thing it does *not* define as SRS Types. Until it does, SRS cannot
dogfood its own expressiveness at the meta level, cannot generate the schemas from a single source
(#259), and cannot present or query the meta-model with the same tools it offers every other domain.
RFC-032 removed the expressiveness blocker (`valueType` → `fieldType`; composite range; constraints). The
remaining blocker is that no one has written the meta-model *down* as records.

### Problem 3 — no versioned identity for an operational data-model change

RFC-032 (#257) is the first **breaking, migration-bearing** schema change inside the `2.0` line, and there is
nowhere to record that a repository moved from the `valueType` model to the `fieldType` model. The only
version surface is `manifest.srsVersion: "2.0-draft"` — coarse and frozen. Without a generation stamp, a
binary embedding the pre-RFC-032 schema fails to load a migrated package with a cryptic *"failed to load
package"* instead of an actionable *"repo is data-model rev 1, this binary supports rev 0."* (#265.)

### Problem 4 — two competing schema-source vocabularies

RFC-004 (Draft, never accepted) proposed a *separate* schema-notation vocabulary
(`ext:schema-notation`; `schema-definition`, `schema-member`, `typeExpression`) to describe schemas as spec
content, plus `projection-rules.md` to render that vocabulary to JSON Schema. Self-hosting makes the
**Field/Type meta-model** the schema-source vocabulary. Keeping RFC-004's parallel vocabulary alive would
reintroduce exactly the multiple-sources-of-truth problem this epic exists to remove — while its
*projection rules* (source → JSON Schema) are genuinely reusable and worth keeping.

---

## Proposed Changes

### Change A — the self-hosted meta-model package `com.semanticops.srs/metamodel`

Introduce a new package that expresses the meta-model as first-class SRS `Field` and `Type` definitions,
using the RFC-032 `fieldType` model. RFC-029 reserved `com.semanticops.core` and **explicitly left
`com.semanticops.srs` ("core model types") to a future RFC** (RFC-029 line 70) — this is that RFC.

| Attribute | Value |
|---|---|
| Namespace | `com.semanticops.srs` |
| Package name | `metamodel` |
| Version | `1.0.0` |
| UUID scheme | patterned, human-legible (mirrors RFC-029 core): `4a……` = package, `4b……` = fields, `4c……` = types. **Assignment is pinned by declaration order:** package `4a000001-0000-4000-a000-000000000001`; Types numbered `4c0000NN` in the "Self-hosted Types" table order below (`field` = `4c000001`, `type` = `4c000002`, …, `provenance` = `4c00000a`); Fields numbered `4b0000NN` in the order they first appear in the derivation (Change A, "Derivation rule"). Deterministic, not random v4. |
| Resolution | a **normal `packageRef`** in the spec repo's `manifest.json` (`{ mode: local, path: "package/metamodel" }`), resolved by the ordinary RFC-014 R6 package mechanism — exactly like `package/base`, `package/spec-authoring-core`, etc. **This RFC does NOT make `com.semanticops.srs` an always-implicit namespace** (see Rationale — the loader needs the frozen JSON-Schema seed, not this package). |
| Foundational status | "foundational" here means *canonical + frozen + shipped-with-the-implementation*: the package is exported to a deterministic `.srsj` bundle (valid against `docs/schema/2.0/package-bundle.json`, `mode: bundled`), embedded via `include_str!`, and verified by a `--check` rebuild test — the RFC-029 mechanism. It is **not** the RFC-029 *implicit-merge-into-every-repo* guarantee, which stays scoped to `com.semanticops.core`. |

**Self-hosted Types** — the **ten** meta-model entities (nine `$def`/top-level-backed Types plus the inline
`FieldTypeConstraints` bag), sourced directly from `docs/schema/2.0/field.json` and `type.json`:

| # | Type (`com.semanticops.srs/…`) | UUID | Source shape | Role in the loop |
|---|---|---|---|---|
| 1 | `field` | `4c000001` | `field.json` top-level | the atomic semantic unit |
| 2 | `type` | `4c000002` | `type.json` top-level (core facets — see coverage scope) | a named composition of fields |
| 3 | `field-assignment` | `4c000003` | `type.json#/$defs/FieldAssignment` | a Field's use inside a Type |
| 4 | **`field-type`** | `4c000004` | `field.json#/$defs/FieldType` | **the recursive heart** (datatype × cardinality × value-domain × format × constraints) |
| 5 | `exact-type-ref` | `4c000005` | `field.json#/$defs/ExactTypeRef` | version-exact pointer to a Type |
| 6 | `field-type-constraints` | `4c000006` | `field.json#/$defs/FieldType.constraints` (inline subschema) | the fixed-shape `{minLength,maxLength,pattern,minimum,maximum}` bag |
| 7 | `ai-guidance` | `4c000007` | `field.json#/$defs/AiGuidance` | LLM guidance value-object |
| 8 | `ai-guidance-example` | `4c000008` | `field.json#/$defs/AiGuidanceExample` | one guidance example |
| 9 | `lineage` | `4c000009` | `field.json#/$defs/Lineage` | fork/copy history of a definition |
| 10 | `provenance` | `4c00000a` | `field.json#/$defs/Provenance` | import provenance |

**Coverage scope (v1.0.0 — the core definition layer).** The self-hosted `field` and `type` cover the **core,
always-present** facets of the frozen seed. The following are **explicitly deferred** to later metamodel-package
versions, mirroring how they layer onto the seed as *extension*-contributed shapes — so metamodel coverage
grows the same way SRS itself does:

| Deferred (not in v1.0.0) | Frozen-seed shapes | Owning extension |
|---|---|---|
| `type.lifecycle` / `lifecycleRef` | `TypeLifecycle`, `LifecycleState`, `RequiresRelation`, `LifecycleTransition` | `ext:lifecycle` (RFC-022) |
| `type` inheritance | `extendsTypeId`, `extendsTypeVersion`, `fieldOrder`, `FieldAssignmentOverride` | `ext:type-inheritance` |
| `type.validationRules` | `CrossFieldRule` | `ext:cross-field-validation` (RFC-019) |
| `type.fieldGroups` | `FieldGroup` (deprecated) | `ext:field-groups` (#242-gated removal) |
| `type.identityFieldId` | (scalar) | RFC-020 |
| `field.editorHint` | (presentation, not the type model) | rendering follow-up (#262) |

This *coverage* incompleteness (the metamodel does not yet **describe** feature X) is a distinct obligation from
Change D's *emitter-fidelity* incompleteness (an emitter cannot **express** feature X). [R1] guarantees the
in-scope definitions validate; this table states, normatively, what "in-scope" is.

**Derivation rule (makes the seed deterministic).** Each in-scope entity is derived from the frozen seed by a
fixed, mechanical mapping — this is what makes the metamodel package reproducible and what the #259 emitter
inverts:

- Each **top-level property** of `field.json` / `type.json`, and each **property of an in-scope `$def`**, maps
  to exactly **one `Field`** in the metamodel package. The Field's `fieldType` is the RFC-032 encoding of that
  property's JSON-Schema shape (scalar/enum/`$ref`/array/`additionalProperties`/constraints).
- Each **top-level entity and in-scope `$def`** maps to exactly **one `Type`** whose `fields[]` are
  `FieldAssignment`s over those Fields.
- **`required[]` → `FieldAssignment.required`** (a property listed in the seed's `required` array is a required
  assignment); a property absent from `required` is `required: false`.
- **Property declaration order → `FieldAssignment.order`** (0-based, in the order properties appear in the seed).
- **Name projection: snake_case ↔ camelCase.** SRS `Field.name` MUST be snake_case; the frozen seed's JSON
  property keys are camelCase. The metamodel Field for seed property `minItems` is named `min_items`; the
  emitter (#259), applying `projection-rules.md`, maps the snake_case Field `name` back to the camelCase JSON
  property key on projection. This transform (snake_case Field name → lowerCamelCase JSON key) is part of the
  reused projection contract (Change E) and is load-bearing for [R4].
- **Field sharing (define-once, reference-many).** A property name that recurs across `$defs`/entities with the
  **same semantics and `fieldType`** (e.g. `id`, `namespace`, `name`, `version`, `description`, `created_at`,
  which appear on both `field.json` and `type.json` top-level) maps to **one shared metamodel `Field`**,
  referenced by every Type that uses it via a `FieldAssignment` — this is the ordinary SRS shared-vocabulary
  model, and it is what "in the order they first appear" pins for the `4b0000NN` numbering (dedup by first
  appearance). Same-named properties whose semantics or `fieldType` genuinely differ get distinct Fields. Where
  the range differs by entity (e.g. `field-assignment.default_value` is `dependent`), that is a distinct Field.

**The recursive spine** — the metacircular loop the frozen seed must close, expressed entirely in the
RFC-032 `fieldType` model:

```
field.fieldType          = { datatype:ref, mode:inline,    cardinality:single, rangeType: field-type@1 }
field-type.rangeType     = { datatype:ref, mode:inline,    cardinality:single, rangeType: exact-type-ref@1 }
exact-type-ref.typeId    = { datatype:string, format:uuid }
exact-type-ref.typeVersion = { datatype:integer, constraints:{ minimum:1 } }
type.fields              = { datatype:ref, mode:inline,    cardinality:list,   rangeType: field-assignment@1 }
field-assignment.fieldId = { datatype:ref, mode:reference, cardinality:single, rangeType: field@1 }        ← closes the loop
```

`field → field-type → exact-type-ref → type → field-assignment → field`. Every edge is a `datatype:ref`
Field; the loop is broken (well-founded per RFC-032 [R7]) at `field-assignment.fieldId`, whose
`mode:reference` edge is a UUID value, not an inline expansion.

Representative field type expressions (the full inventory follows mechanically from the derivation rule):

| Field | `fieldType` |
|---|---|
| `field.version` | `{ datatype:integer, constraints:{ minimum:1 } }` |
| `field.aiGuidance` | `{ datatype:ref, mode:inline, single, rangeType: ai-guidance@1 }` |
| `field-type.datatype` | `{ datatype:string, valueDomain:closed, allowedValues:[string,number,integer,boolean,date,date-time,ref,dependent,map] }` |
| `field-type.cardinality` | `{ datatype:string, valueDomain:closed, allowedValues:[single,list] }` |
| `field-type.allowedValues` | `{ datatype:string, cardinality:list }` |
| `field-type.constraints` | `{ datatype:ref, mode:inline, single, rangeType: field-type-constraints@1 }` |
| `field-assignment.order` | `{ datatype:integer, constraints:{ minimum:0 } }` |
| `field-assignment.required` | `{ datatype:boolean }` |
| `ai-guidance.examples` | `{ datatype:ref, mode:inline, list, rangeType: ai-guidance-example@1 }` |
| `provenance.importedAt` | `{ datatype:date-time }` |

### Change B — frozen-seed bootstrap (fixed point; never re-derived at runtime)

Self-description is only well-founded if the base case is not itself derived from the thing being defined.
So the hand-authored **`docs/schema/2.0/field.json` and `type.json` remain the frozen seed** — the bootstrap
fixed point:

- **Loaded as committed.** A conforming implementation validates every Field/Type definition (including the
  metamodel package's own definition files) against the committed `field.json`/`type.json`. It **MUST NOT**
  re-derive those two entity schemas from the metamodel records at runtime — that would be circular (you
  cannot parse the records that define `Field` without already having the `Field` schema).
- **Embedded, deterministic, `--check`-verified.** The metamodel package ships the same way as RFC-029's
  `com.semanticops.core`: authored as package definitions in the spec repo, exported to a deterministic `.srsj`
  bundle (valid against `docs/schema/2.0/package-bundle.json`, `mode: bundled`), embedded in each
  implementation (`include_str!`), rebuilt whenever the records change and verified by a `--check` rebuild
  test. (This RFC authors the records + asserts the bundle validates; the embedded-bundle wiring in `srs-rust`
  is the #259/#260 consumer step.)
- **The seed ↔ records relationship is a build-time consistency obligation, not a runtime derivation.** The
  #259 emitter projects the metamodel records to JSON Schema; that projection is compared to the frozen seed
  for every feature declared *authoritative* in the fidelity dashboard (Change D). **At RFC-033 acceptance,
  closure is demonstrated now** by running the RFC-032 `projectField` stand-in
  (`scripts/lib/rfc-032-fieldtype.mjs`) over the metamodel field shapes and diffing the *authoritative*
  fragments against the frozen seed (see Testability); the full byte-for-byte emitter equality is #259's
  acceptance. Where the emitter cannot reach (Change D's *approximated* features), the frozen seed carries the
  authoritative form. This is the fixed-point discipline the whole epic rests on: **the seed is what ships; the
  records are what it must stay consistent with.**

At cutover (#260), the direction of authorship flips — the records become the primary source and the emitter
regenerates the seed — but the *runtime* rule is invariant: the committed seed is loaded, never re-derived
in-process. (There is no contradiction between "never re-derive at runtime" and #260's "authorship flips":
one is an in-process rule, the other a build-time regeneration step.)

### Change C — metamodel versioning, `$id` scheme, and `dataModelRevision` (folds #265)

Three coordinated version surfaces, none of which is dotted semver at this stage:

1. **Entity-schema `$id` (self-versioning, unchanged).** The frozen entity schemas keep their existing
   self-declared `$id`, e.g. `https://srs.semanticops.com/schema/2.0/field.json`. The `2.0` segment is the
   **data-model line**. This is the Frictionless `$schema` self-versioning discipline already noted in the
   alignment register (COMPONENT #18).

2. **Generated domain-schema `$id` (RFC-004 projection-rules, reused).** Schemas the emitter (#259) generates
   *from* the metamodel/domain Type records use RFC-004's identity template:
   `https://srs.semanticops.com/schema/domain/<namespace>/<schemaName>/<version>.json` — where `<version>` is
   the Type's integer `version`. (Reused verbatim from `projection-rules.md`; see Change E.)

3. **`dataModelRevision` — a monotonic integer generation stamp (folds #265).**
   - A **monotonic non-negative integer**, **not** dotted `2.0.x`. `2.0.x` reads as a semver *patch* and falsely
     implies backward-compatibility; an operational data-model delta (RFC-032) is breaking. `dataModelRevision: N`
     says only "migration generation N" — exactly what coarse O(1) gating needs, with no false compat promise.
     Real semver is reserved for public GA.
   - Added to `manifest.json`, the package manifest (`package-manifest.json`), **and the bundle
     (`package-bundle.json`)** as an **optional** field. **Absent ⇒ "unstamped," which a consumer treats as
     revision 0 for gating.** Additive; purely a schema default — it is *not* itself a claim about which model
     the data satisfies (that is detected by shape, per #265 / the already-shipped srs-rust#464 registry).
   - **RFC-032's transform is registered as migration #1**, `{ fromRevision: 0, toRevision: 1 }`, and **stamps
     `dataModelRevision: 1` on apply.** Because RFC-032 migrated the spec repo (`srs/srs`) and the governance
     seed **before** the stamp existed, those already-migrated repos carry no stamp; folding #265 in therefore
     includes a **one-time re-stamp** of `srs/srs` and the `srs-gov` seed to `dataModelRevision: 1` (named
     explicitly, as RFC-029 named its `migrate-identity` targets). After this, "unstamped" unambiguously means
     "pre-migration-#1 (rev 0)," removing the "absent vs fieldType-model" ambiguity.
   - The generated schema **bundle carries the `dataModelRevision` it was generated for**, so *repo stamp ↔
     bundle version ↔ migration-registry generation* all reference one number. This RFC makes the schema/manifest
     decision (the three schema fields + migration #1 registration + the re-stamp); the **emitter (#259) stamps
     the generated bundle** (added there as an acceptance criterion) and **srs-rust** reads the stamp for the
     load-time compat diagnostic (#265 item 5). This RFC does not itself implement the stamping/reading code.
   - **#265 disposition:** its schema/manifest decision is delivered here; #265 closes on this RFC's merge, with
     the srs-rust read/write + emitter-stamping items tracked as follow-ups on #259 and srs-rust.

### Change D — authoritative-vs-lossy fidelity dashboard (per emitter)

No single target language faithfully expresses every meta-model feature (LinkML's core insight: each of its
generators covers a *subset*). So this RFC introduces a committed **fidelity dashboard**,
`docs/schema/2.0/metamodel-fidelity.md`, that enumerates **every meta-model feature × every emitter** as one
of:

- **authoritative** — the emitter expresses the feature faithfully; the projection round-trips and is
  byte-comparable to the frozen seed for that feature.
- **approximated** — the emitter cannot fully express the feature; it emits the closest permissible shape and
  the **authoritative form lives in the frozen seed plus the semantic validator** (`validateFieldType`, R1–R11,
  and cross-field validation). An emitter **MUST NOT silently drop** an approximated feature; it MUST emit the
  documented lossy shape (so the artifact is still usable) and the dashboard records the loss.

This dashboard governs *emitter expressiveness* only — it is orthogonal to Change A's *coverage scope* (what the
metamodel describes at all). It classifies features of the **whole frozen seed**, including some Change A defers
from v1.0.0 coverage (e.g. `CrossFieldRule` appears here as *approximated* even though `type.validationRules`
is a deferred facet): the dashboard says "if/when a `CrossFieldRule` is present, this is how faithfully the
JSON-Schema emitter renders it," independent of whether the metamodel self-hosts it yet. The two axes never
conflict — one is *can the emitter express it*, the other is *does the metamodel describe it*. The initial dashboard covers the **JSON Schema 2020-12** emitter (the only NOW
emitter); columns for **protobuf**, **TypeScript**, and **Rust** are seeded as *future* so the discipline is in
place before those emitters (#259 designs the IR for exactly this extensibility). Initial JSON-Schema
classification (derived from `projectField` in `scripts/lib/rfc-032-fieldtype.mjs`):

| Meta-model feature | JSON Schema (2020-12) | Authoritative source when approximated |
|---|---|---|
| scalar datatypes (string/number/integer/boolean/date/date-time) | authoritative | — |
| `format` (uri/uuid/email/markdown) | authoritative | — |
| `cardinality:list` + `minItems`/`maxItems` | authoritative | — |
| `valueDomain:closed` → `enum` (inline `allowedValues`) | authoritative | — |
| `vocabularyRef` (configurable range) → `enum` | **approximated** — the emitted `enum` is a *snapshot* of the vocabulary's effective Term keys at generation time; the *configurable* nature (config-time mutability) is not in the artifact | the package `Vocabulary` (RFC-006) + regenerate discipline |
| `constraints` (minLength/maxLength/pattern/minimum/maximum) | authoritative | — |
| `datatype:ref`, `mode:inline` → `$ref` | authoritative | — |
| `datatype:ref`, `mode:reference` → `{string, format:uuid, x-srs-range-type}` | **approximated** — the referent's *Type* constraint is not enforced by the string+uuid shape | R5 + reference-integrity validation (#242) |
| `datatype:dependent` | **approximated** — deliberately lossy (broad permissible schema) per RFC-032 Change G | R6 validation obligation |
| `datatype:map` → `{object, additionalProperties}` | authoritative | — |
| entity-level conditional co-occurrence (`allOf`/`if`/`then` for R2/R3/R9/R10) | **approximated** — `projectField` emits per-field fragments, not the entity-level conditional envelope; the frozen seed hand-authors the `allOf` branches | frozen seed `allOf` + `validateFieldType` R1–R11 |
| cross-field validation (`CrossFieldRule`, RFC-019) | **approximated** — no JSON Schema construct | RFC-019 cross-field validation |
| Type-graph cycle rejection (RFC-032 [R7]) | **approximated** — no JSON Schema construct | [R7] load-time analysis |
| `additionalProperties:false`, `required[]` | authoritative | — |

### Change E — supersede RFC-004's schema-notation vocabulary; reuse its projection-rules

- **Superseded:** RFC-004's separate schema-source vocabulary — `ext:schema-notation`, the
  `com.semanticops.spec/schema-definition` and `schema-member` Types, and the structured `typeExpression`
  kinds — is **formally superseded** by the self-hosted `com.semanticops.srs` Field/Type meta-model. There is
  now **one** vocabulary for describing schemas: the Field/Type meta-model itself. RFC-004's status moves
  `Draft → Superseded (by RFC-033)` (it was never accepted; "Superseded" is used because RFC-033 takes over its
  role and reuses its projection-rules — both `**Status**` lines in `rfcs/rfc-004.md` and the RFC-004 stub
  record's `rfc-status` are updated on acceptance). Its never-loaded proposed artifacts under
  `rfcs/rfc-004/proposed-package/` stay as historical design material.
- **Reused:** RFC-004's `projection-rules.md` (source → JSON Schema mapping: member mapping, type-expression
  mapping, the portable scalar table, the constraint mapping, and the `$id` template) is **retained as the
  normative projection contract** for the #259 emitter — already cited by RFC-032 Change G. **Normative home:**
  its content is normative from acceptance; because it currently lives inside the frozen historical tree
  (`rfcs/rfc-004/proposed-package/spec-authoring-json-schema/projection-rules.md`), the #259 emitter task
  relocates/extracts it to a live normative docs location (e.g. `docs/schema/2.0/projection-rules.md`). Until
  then this RFC cites the rfc-004 path as the contract text. The emitter reads self-hosted Field/Type records
  and applies these rules.
- The prose documentation wrappers (`com.semanticops.spec/type-definition`, `field-definition`, and the
  `com.semanticops.srs/meta.*` types) remain available for **narrative** spec authoring; they are no longer
  positioned as a *structured schema source*. No records are deleted by this RFC.

### Change F — add LinkML to the alignment register

Add **LinkML** to `docs/research/alignment-opportunities.md` as prior art (it is currently absent). LinkML is
the closest existing system to what this epic builds: a single modeling language that describes a data model —
**including itself** (LinkML's own metamodel is expressed in LinkML), the exact self-hosting move here. Its
directly-relevant constructs: `slot.range = class` (= RFC-032 `datatype:ref`), `inlined` / `inlined_as_list`
(= `mode:inline` single/list), slot facets/constraints (= `fieldType.constraints`), inlined-as-dict
(= `datatype:map`), and — most importantly — a **per-generator fidelity discipline**: LinkML's `gen-json-schema`,
`gen-protobuf`, `gen-pydantic`, etc. each faithfully express a documented *subset*, which is precisely the
discipline Change D's fidelity dashboard adopts. Classify as a **COMPONENT** source (borrow the discipline and
the self-describing-metamodel pattern; do not adopt LinkML the toolchain).

---

## Conformance Rules

> **[R1]** The SRS meta-model MUST be expressed as SRS `Field` and `Type` definitions in the frozen foundational
> package `com.semanticops.srs/metamodel`, covering at least the ten Types in Change A's table (`field`, `type`,
> `field-assignment`, `field-type`, `exact-type-ref`, `field-type-constraints`, `ai-guidance`,
> `ai-guidance-example`, `lineage`, `provenance`). Every one of those definitions MUST itself validate against
> the frozen `docs/schema/2.0/{field,type}.json`.
>
> **[R2]** The `com.semanticops.srs/metamodel` package MUST be a canonical, frozen, foundational package: it is
> resolved by the ordinary RFC-014 R6 package mechanism via a `packageRef` (it does **not** extend RFC-029's
> always-implicit-merge guarantee, which stays scoped to `com.semanticops.core`), and it MUST be exportable to a
> deterministic `.srsj` bundle valid against `docs/schema/2.0/package-bundle.json` (`mode: bundled`) and verified
> by a `--check` rebuild test. This RFC reserves **the specific `com.semanticops.srs/metamodel` Field and Type
> ids/names**, not the whole `com.semanticops.srs` namespace (RFC-029 left the namespace to per-package rules);
> a package MUST NOT redefine one of those ids.
>
> **[R3]** `docs/schema/2.0/field.json` and `type.json` are the bootstrap **fixed point**. A conforming
> implementation MUST load them as committed and MUST NOT re-derive them from the metamodel records at
> runtime.
>
> **[R4]** For every feature declared *authoritative* in the fidelity dashboard, the metamodel records MUST be
> **projection-consistent** with the frozen seed. This obligation is discharged in two stages: **(a)** at
> RFC-033 acceptance, the RFC-032 `projectField` stand-in projected over the in-scope metamodel field shapes
> MUST match the frozen seed's corresponding authoritative fragments (checkable now — see Testability);
> **(b)** the #259 emitter, when delivered, MUST reproduce the frozen seed byte-for-byte for all authoritative
> features (a #259 acceptance criterion). Features declared *approximated* are exempt from this equality and
> carry their authoritative form in the frozen seed plus the semantic validator.
>
> **[R5]** Every meta-model feature MUST be classified *authoritative* or *approximated* for each supported
> emitter in the committed fidelity dashboard (`docs/schema/2.0/metamodel-fidelity.md`). An emitter MUST NOT
> silently drop an *authoritative* feature; for an *approximated* feature it MUST emit the documented lossy
> shape (never omit the member).
>
> **[R6]** `dataModelRevision` is a monotonic non-negative integer. Its absence from a manifest, package
> manifest, or bundle MUST be treated as revision `0` for gating. The RFC-032 `valueType → fieldType` transform
> is migration #1 (`fromRevision: 0`, `toRevision: 1`) and MUST stamp `dataModelRevision: 1` on apply;
> repositories migrated by RFC-032 before the stamp existed (`srs/srs`, the `srs-gov` seed) MUST be re-stamped to
> `1` once (folded in with this RFC). A generated schema bundle MUST carry the `dataModelRevision` it was
> generated for.
>
> **[R7]** An implementation MUST NOT load RFC-004's `schema-definition`/`schema-member` schema-notation
> artifacts into an active package; the normative schema-source vocabulary MUST be the self-hosted
> `com.semanticops.srs` Field/Type meta-model; and the #259 emitter MUST apply RFC-004's `projection-rules.md`
> as its source → JSON Schema projection contract.

---

## Testability

**The CRITICAL TRAP (ADR-004).** The installed `srs` binary embeds the **pre-RFC-032** entity schema and
**cannot load the migrated package** — `srs repo validate` / `render` fail against a `fieldType`-model
repository. Therefore #258's testability is verified through the **Node runtime-schema pipeline**
(`scripts/validate-all.mjs`, `scripts/validate-package.mjs`), which validates against the committed
`docs/schema/2.0` schemas — **not** through the binary — exactly as the RFC-032 work did. The binary path
unblocks only when `srs-core` adopts `fieldType` (srs-rust#767–770), which is the #260 cutover, not this RFC.

Mapping #258's three criteria to concrete, in-scope checks:

| #258 criterion | Verification at RFC-033 acceptance |
|---|---|
| **(a)** Seed `Field`/`Type`/`FieldAssignment` records pass `srs repo validate` | The ten metamodel Type definitions and all their Field definitions validate against `docs/schema/2.0/{field,type}.json` via `node scripts/validate-package.mjs package/metamodel`, and `package/metamodel` is added to `scripts/validate-all.mjs` so the full suite exercises it. (Substitutes for the binary per the trap above.) |
| **(b)** Round-trip: each nested value-object expressed as a Type with **a valid example instance** | The value-objects ARE expressed as Types (the ten definitions). **Example-instance validation is deferred to #242:** an instance of e.g. `field-type` is a Tier-2 Record whose `fieldValues` carry *inline-composite* values, and inline-composite `fieldValues` have no conforming carrier until #242 (OQ2). What is verifiable now: the Type definitions validate (a), and the `reference`-mode edges (e.g. `field-assignment.fieldId`) round-trip as UUID strings, which *are* storable today. The full inline-composite example-instance round-trip is #242's acceptance, not #258's — stated explicitly so an implementer is not blocked chasing an impossible check. |
| **(c)** Fidelity dashboard enumerates all meta-model features as faithful/approximated per emitter | The committed `docs/schema/2.0/metamodel-fidelity.md` (Change D) enumerates every feature for the JSON-Schema emitter; [R5] makes the classification normative. |

**Bootstrap-closure demonstration (in-scope now).** A harness (modeled on `tests/rfc-032/run.mjs`) projects
each in-scope metamodel field's `fieldType` through `projectField` (`scripts/lib/rfc-032-fieldtype.mjs`) and
diffs the result against the corresponding *authoritative* fragment of the frozen `field.json`/`type.json`.
Authoritative fragments MUST match; approximated fragments (Change D) are asserted to differ in exactly the
documented way. This demonstrates [R4](a) at acceptance; [R4](b) (full byte-equality via the real emitter) is
#259.

**Bundle determinism.** The metamodel `.srsj` export MUST validate against `package-bundle.json` and rebuild
identically under a `--check` run (RFC-029 parity).

---

## Rationale

**Why `com.semanticops.srs`, not a new `com.semanticops.metamodel`.** RFC-029 reserved `com.semanticops.core`
for repository-identity primitives and *explicitly deferred* `com.semanticops.srs` ("core model types") to a
future RFC. `Field` and `Type` *are* the core model types. Putting them in `com.semanticops.srs` follows the
existing namespace plan; the existing `com.semanticops.srs/meta.*` prose wrappers already live there. A
dedicated package name (`metamodel`) inside that namespace keeps the frozen seed cleanly separable.

**Why NOT always-implicit (reconciling RFC-029 Alt E).** RFC-029 Alt E *rejected* placing always-implicit types
under `com.semanticops.srs`, on the ground that its types are "installed via explicit `packageRefs`, not
implicitly available," and that making them implicit would be "a breaking change to the `packageRefs` resolution
model." Rev 1 of this RFC wrongly proposed an always-implicit `com.semanticops.srs` package, contradicting that.
Rev 2 corrects it: **the metamodel package does not need to be implicit, because the loader never consumes it.**
What the loader needs *before* it can parse any record is the **frozen JSON-Schema seed** (`field.json` /
`type.json`) — not the metamodel *package* (which is Field/Type *definitions* describing those entities). The
package is consumed by the toolchain (the #259 emitter, validators, spec-repo dogfooding), so it is resolved by
the ordinary `packageRef` mechanism, exactly as RFC-029 Alt E prescribes for `com.semanticops.srs`. This also
means no namespace-wide reservation and hence no latent breaking change: [R2] reserves only the specific
`metamodel` ids.

**Why the frozen seed stays hand-authored (the fixed-point argument).** A metacircular definition needs a base
case that does not depend on itself. You cannot parse the records that *define* `Field` without already
possessing the `Field` schema. So the two entity schemas the loader needs *before* it can read any record must
be present independently — committed, loaded as-is. This is not a limitation to be removed later; it is the
well-foundedness condition of self-description. What #260 changes is authorship direction (records become
primary, emitter regenerates the seed), not the runtime rule.

**Why a fidelity dashboard instead of pretending the projection is lossless.** RFC-032 already conceded two
deliberately-lossy projections (`dependent`, `reference`-mode). Self-hosting surfaces more: entity-level
conditional envelopes, cross-field rules, cycle rejection — none are JSON Schema constructs. The honest,
LinkML-proven move is to *declare* the loss per emitter rather than hide it, and to keep it distinct from
*coverage* scope (what the metamodel describes at all). The dashboard makes "authoritative vs approximated" a
first-class, testable contract and prevents an emitter from silently dropping semantics — the exact failure the
epic exists to prevent, one layer up.

**Why `dataModelRevision` is an integer, not `2.0.x`.** Dotted `2.0.x` implies a semver patch and backward
compatibility; RFC-032 is breaking. A monotonic integer promises nothing but "generation N," which is all
coarse gating and the load-time compat diagnostic need. The stamp is a *coarse gate*, not the model detector
(shape-based detection already ships, srs-rust#464); registering RFC-032 as migration #1 and re-stamping the
already-migrated repos keeps the stamp and the shape in agreement. Reserve real semver for GA. (Owner-framed in
#265.)

**Why reuse RFC-004's projection-rules but supersede its vocabulary.** RFC-004 conflated two things: a
schema-*source* vocabulary (which self-hosting replaces — one source of truth) and a source → JSON Schema
*projection* (which is orthogonal to where the source comes from and is directly reusable). Keeping the
projection while dropping the parallel vocabulary is the consolidation the epic wants.

---

## Alternatives Considered

### Alt A — a new dedicated namespace `com.semanticops.metamodel`

A fourth namespace purely for the self-hosted model. Rejected: RFC-029 already earmarked `com.semanticops.srs`
for exactly these types, and a fourth namespace fragments the model. A dedicated namespace *would* have
permitted a clean namespace-wide reservation like `com.semanticops.core`'s I-86 — but Rev 2's `packageRef`
resolution (not implicit-merge) makes a namespace-wide reservation unnecessary: id-level reservation ([R2]) is
sufficient for a conventionally-resolved package. The package *name* (`metamodel`) inside `com.semanticops.srs`
gives the needed separability without a new namespace.

### Alt B — re-derive `field.json`/`type.json` from the records at runtime (no frozen seed)

"Pure" self-hosting with no hand-authored seed. Rejected as ill-founded: the loader needs the `Field`/`Type`
schema to parse the records that define `Field`/`Type`; re-deriving them in-process is circular. Every
self-describing system (LinkML included) keeps a committed metamodel artifact as the base case.

### Alt C — reuse RFC-004's `schema-definition`/`schema-member` as the schema source

Author the meta-model in RFC-004's schema-notation vocabulary instead of self-hosting in Field/Type. Rejected:
it keeps a *second* schema vocabulary alive alongside Field/Type — the multiple-sources-of-truth problem this
epic removes — and it cannot dogfood SRS's own type system. RFC-032's expressiveness exists precisely so
Field/Type can be the single substrate.

### Alt D — fold the emitter (#259) into this RFC

Ship the records and the byte-for-byte JSON Schema generator together. Rejected: the epic deliberately
sequences expressiveness (RFC-032) → self-host + bootstrap (this RFC) → emitter (#259) → cutover (#260), each
with clear, independent testability. The emitter's golden-file byte-equality is #259's acceptance; this RFC's
acceptance is the seed validating, the `projectField`-stand-in closure demonstration, and the fidelity contract
being declared.

### Alt E — self-host `Record`/`Relation`/`Container` in the same package now

Extend v1.0.0 to the instance-layer entities. Rejected for this RFC: they depend on the `fieldValues`
representation (#242) and on instance-carrier decisions not yet made; the definition layer is the coherent,
independently-testable unit. Revisit after #242 (OQ2).

---

## Open Questions

1. **`vocabularyRef` id-anchoring (deferred here from RFC-032 OQ3).** RFC-032 reuses RFC-006's string
   `Reference` (`namespace/name@version`) for `vocabularyRef`. Self-hosting could tighten it to a UUID+version
   ref (RFC-009 `ExactTypeRef` style) for full id-anchoring. *Leaning:* keep the RFC-006 string `Reference` for
   this RFC (minimal divergence; the metamodel uses no `vocabularyRef` internally — its closed domains are all
   inline `allowedValues`), and revisit id-anchoring only if a concrete need appears. Recorded, not resolved.

2. **Whether to self-host `Record`/`Relation`/`Container` in the same package now.** Out of scope for RFC-033
   (Alt E); the instance-layer entities depend on #242. *Leaning:* revisit after #242. Recorded, not resolved.

*(Rev-1 OQ3, on the fidelity-dashboard location, is now resolved: the dashboard is normative and lives at
`docs/schema/2.0/metamodel-fidelity.md` beside the schemas — see Change D, [R5], and Schema changes.)*

---

## Schema changes

| Schema file | Change |
|---|---|
| `manifest.json` | **add** optional `dataModelRevision` (`{ type: integer, minimum: 0 }`); absent ⇒ 0. Additive, non-breaking. |
| `package-manifest.json` | **add** optional `dataModelRevision` (same shape) so a package index can carry its generation stamp. Additive. |
| `package-bundle.json` | **add** optional `dataModelRevision` (same shape) — the embedded/distributed `.srsj` bundle is the artifact [R6] requires to carry the stamp. Additive. |
| `field.json` | **no structural change** (it is the frozen seed and MUST stay byte-stable). Add a doc-only `$comment` noting it is the RFC-033 frozen-seed fixed point whose record-level source is `com.semanticops.srs/metamodel`. |
| `type.json` | **no structural change** (frozen seed). Same doc-only `$comment`. |

New committed artifacts (records/docs, not `docs/schema/2.0/` entity schemas):

- `srs/package/metamodel/` — the frozen-seed package: `package.json` index + `fields/*.json` + `types/*.json`
  for the ten in-scope entities (Change A), added to the spec repo `manifest.json` `packageRefs` and to
  `scripts/validate-all.mjs`; validated via the Node runtime-schema pipeline.
- `docs/schema/2.0/metamodel-fidelity.md` — the fidelity dashboard (Change D).
- `docs/research/alignment-opportunities.md` — LinkML entry (Change F).
- `rfcs/rfc-004.md` — both `**Status**` lines → `Superseded (by RFC-033)`; and the RFC-004 stub record's
  `rfc-status` updated (Change E).
- RFC-033's own `srs-integration:v1` manifest (on acceptance) declaring: `schema:manifest.json`,
  `schema:package-manifest.json`, `schema:package-bundle.json`, the metamodel package Types, and the RFC-004
  supersession — so the RFC integration drift gate (`check-rfc-integration.mjs`, #204) passes.

**Sync note.** Only `manifest.json`, `package-manifest.json`, and `package-bundle.json` change structurally, and
only additively. Mirror sync to `srs-rust`/`srs-vscode` happens via the release artifact after merge (not this
session), per the standing mirror-refresh pipeline.
