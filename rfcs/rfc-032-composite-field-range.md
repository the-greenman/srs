> **GitHub issue**: [the-greenman/srs#261](https://github.com/the-greenman/srs/issues/261) · delivers Task #257 (+ folds in #239) under epic #256

# RFC-032: The Field type model — decomposed value type, composite range, maps, and FieldGroup subsumption

**Status**: Accepted (Revision 6)
**Affects**: Field, Type, FieldAssignment, FieldGroup (`ext:field-groups`), ValidationRule, `ext:repeatable-fields`, `RequiresRelation` (RFC-022), `CrossFieldRule` (RFC-019); `docs/schema/2.0/{field,type}.json`. Enables epic #256; folds in #239. **Breaking (definition layer; instance cutover gated with #242).**
**Author**: Claude Code (agent), on behalf of the repository owner
**Date**: 2026-07-29

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-29 | Minimal composite range (a Field's range may be another Type). |
| 2 | 2026-07-29 | Owner decisions D1–D5: fold in #239 (decompose `valueType`); explicit inline/reference mode; subsume FieldGroup (breaking); fixed recursion rule; no sum/union construct. |
| 3 | 2026-07-29 | Re-review fixes + owner decision D6. **Added a `constraints` facet** (pattern/min/max length + numeric bounds — the axis Rev 2 dropped, and which the meta-model itself needs, e.g. `version ≥ 1`). **Added a bounded `map` datatype** (D6 — open key→value extension bags). `editorHint`/`compositeRenderer` explicitly declared **presentation, out of the type model**, consolidated by #262 (not "absorbed by the axes"). **FieldGroup subsumption defined here; actual removal + instance migration gated with #242** (the spec repo's own 14 field-group records have no carrier until then — the "no external consumers" claim was true, but the spec dogfoods FieldGroups). Added `dependent` to the datatype enum and split value-conformance from CrossFieldRule's conditional-requiredness. Defined the vocabulary ref via RFC-006's `Reference`; closed the `format` enum; trimmed Change G to the ref/dependent/map contract (cite RFC-004 for scalars); paper exercise now exercises CrossFieldRule, RequiresRelation, map, and a numeric-constraint case. |
| 4 | 2026-07-29 | Third review round: **both reviewers CLEAN of blocking findings — converged.** Applied their should-fixes: retyped `RequiresRelation.relationType` to the configurable closed-vocabulary pattern (was wrongly a UUID ref); confirmed against RFC-019 that `CrossFieldRule.predicateValue` is a plain `string` (string-equality) — not polymorphic, closing the last stress-test of the "no sum types" claim; scoped the conformance fixture so #257 acceptance stays independent of #242 (instance records are scalar + reference-mode only); restricted `map.valueRange` to scalar\|open; renamed `datetime`→`date-time` (RFC-004 alignment); enum projection cites RFC-006 effective (active) Term keys; added the `relationType`→list migration row. Owner clarification folded in: configurable data ranges (package-managed allowed values) project to a pure runtime `enum`. |
| 5 | 2026-07-29 | **Accepted + delivered** (Task #257). `docs/schema/2.0/{field,type}.json` edited to the `fieldType` model (Change A; `field.json` adds `$defs.FieldType` + `$defs.ExactTypeRef` byte-identical to `blueprint.json`; `type.json` normalizes `RequiresRelation.relationType` to a list and deprecates — does not remove — `FieldGroup`/`Type.fieldGroups`/`FieldAssignment.{repeatable,minItems,maxItems}`, the #242-gated cutover, since `FieldGroup.fields` reuse `FieldAssignment`). A deterministic, idempotent migration (`scripts/migrate-rfc-032-field-type.mjs` over the shared transform `scripts/lib/rfc-032-fieldtype.mjs`) rewrote all **95** legacy field definitions per Change H, each R1–R11-validated. Coverage: the paper proof (`scripts/rfc-032-paper-proof.mjs`, 11/11) and the migration + conformance harnesses (`scripts/rfc-032-migration-test.mjs`; `tests/rfc-032/run.mjs` — every mode, with committed Change-G projection goldens) all run under `scripts/validate-all.mjs`, which validates against the **runtime** schemas. Note (ADR-004): the embedded-schema `srs` binary cannot load the migrated package, so binary-backed render/validate/drift tooling and the rendered `docs/spec` outputs are intentionally stale until srs-rust adopts the new schema (release-artifact refresh). |
| 6 | 2026-07-31 | **Errata (post-acceptance), from #276.** Two RFC-032 fold-in defects. (a) **Data:** the Change-H migration derived `cardinality: "list"` only from legacy `valueType: "multiselect"`, reading Field definitions in isolation — so `com.semanticops.spec/{columns,cells}`, whose list-ness was expressed *only* by assignment-level `repeatable: true` on `com.semanticops.spec/table@2`, migrated to single-valued while their 9 records hold arrays. Both Fields now declare `cardinality: "list"`; `scripts/check-cardinality-coherence.mjs` (wired into `validate-all.mjs`) fails any assignment carrying the deprecated `repeatable`/`minItems`/`maxItems` trio whose `fieldType`-model Field is not `cardinality: "list"`. (b) **Normative:** [R8] claimed `cardinality` "MAY be overridden per assignment via `FieldAssignmentOverride`", contradicting [R4] and describing a facet that construct does not carry; corrected to Field-level-only under Invariant 2, with `required` remaining overridable. The same claim is removed from `FieldAssignment.repeatable`'s description in `docs/schema/2.0/type.json`. |

---

## Abstract

To self-host its meta-model (epic #256), SRS must describe `Field`/`Type` in its own type system —
but `Field.valueType` is a closed scalar enum that cannot express the meta-model's nested objects,
lists, typed references, constraints, or open extension bags, and it conflates four axes (#239),
forcing a sprawl of patch properties. This RFC replaces `valueType` with an orthogonal **`fieldType`**
model — **datatype × cardinality × value-domain × format × constraints** — where `datatype` may be a
**reference to another Type** (`ref`, inline or reference), a **value-of-a-sibling-type** (`dependent`),
or an **open string-keyed collection** (`map`). It **subsumes `FieldGroup`** into the `ref` mechanism
(the actual removal + instance migration is gated with #242, which provides the carrier). It resolves
every apparent union as dependent-typing, cardinality, a discriminated family, or a map — **no
sum-type construct is added**. Presentation hints (`editorHint`, `compositeRenderer`) are declared
orthogonal to the type model and consolidated by the rendering follow-up (#262). It fixes the JSON
Schema projection so the model generates deterministically (RFC C / #259). This is the gating
expressiveness foundation for self-hosting; meta-model authoring + bootstrap (#258), the emitter
(#259), the `fieldValues` representation (#242), and rendering (#262) are separate, sequenced tasks.

---

## Motivation

### Problem 1 — the type system cannot describe its own meta-model

`Field.valueType ∈ {string, text, number, boolean, date, url, select, multiselect}` — all scalar. The
meta-model needs nested objects (`Field.aiGuidance`), lists-of-objects (`Type.fields`,
`AiGuidance.examples`), typed references (`FieldAssignment.fieldId → Field`), numeric constraints
(`version ≥ 1`, `order ≥ 0`), and open extension maps (`meta`, `LifecycleTransition.properties`) — none
expressible today.

### Problem 2 — `valueType` conflates four+ axes (#239)

Its eight values encode datatype, format, cardinality, and value-domain at once, forcing every axis
that needed independent expression to be bolted on separately (`contentFormat`, `editorHint`,
`allowedValues`/`vocabularyRef`, a parallel `repeatable` cardinality, `validationRules` constraints).
This RFC resolves the conflation at the root (owner decision D1).

### Problem 3 — `FieldGroup` is a second, weaker nesting mechanism

`ext:field-groups` `FieldGroup` is an inline object-of-scalars that cannot nest and is not a Type, so
it cannot self-host. Composite range subsumes it (D3).

---

## Proposed Changes

### Change A — the `fieldType` model (replaces `valueType`)

A Field declares a `fieldType` with orthogonal facets. (Object-vs-flat and the `fieldType` key name are
Open Question 1.)

```
fieldType:
  datatype:    "string" | "number" | "integer" | "boolean" | "date" | "date-time"
             | "ref"        # range is another Type (Change B)
             | "dependent"  # value conforms to a sibling-declared type (Change C)
             | "map"        # open string-keyed collection (Change D)
  cardinality: "single" | "list"           # default "single"
  minItems?, maxItems?: integer             # when cardinality == "list"; 0 ≤ minItems ≤ maxItems

  # string only:
  valueDomain: "open" | "closed"            # default "open"
  allowedValues?: string[]                  # when closed: inline (field-fixed) set …
  vocabularyRef?: Reference                 # … XOR a mode:closed Vocabulary (RFC-006 `Reference` = namespace/name@version); exactly one
                                            # vocabularyRef = a CONFIGURABLE data range: the allowed set is managed in package
                                            # config (the Vocabulary's Terms), not fixed on the field. Projects to a pure enum (Change G).
  format?: "plain" | "markdown" | "uri" | "uuid" | "email"   # closed set; string only
  constraints?: { minLength?, maxLength?: integer≥0, pattern?: string }

  # number/integer only:
  constraints?: { minimum?, maximum?: number }   # (integer: integer bounds)

  # datatype == "ref":
  rangeType: ExactTypeRef                   # required; { typeId, typeVersion≥1 } (RFC-009)
  mode?: "inline" | "reference"             # default "inline"

  # datatype == "dependent":
  dependsOn: "self" | <sibling-field-name>  # names the descriptor the value's type conforms to (Change C)

  # datatype == "map":
  valueRange: <scalar-datatype> | "open"    # value type (scalar only), or "open" for a true extension bag (Change D).
                                            # Composite-valued maps (ref/map values) are out of scope — the meta-model's maps are all open.
```

Each old `valueType` value becomes a facet combination (Change H). `constraints` is the axis Rev 2
dropped; it carries the `minLength`/`maxLength`/`pattern`/numeric-bound constraints formerly in
`ValidationRule` (Change F), and lets the meta-model express its own `version: {integer, minimum:1}`.

**Presentation is out of scope.** `editorHint` (input modality) and `compositeRenderer` (composite
rendering) are **not** semantic type facets and are **not** absorbed by these axes. They are retained
unchanged by this RFC and consolidated into the rendering-capability follow-up (#262). This RFC does
not remove or relocate them.

### Change B — `datatype: "ref"` is the composite range

When `datatype == "ref"`, the range is the Type named by `rangeType` (`ExactTypeRef`, RFC-009 shape).
Combined with cardinality and `mode`:

- **inline, single** — nested object conforming to `rangeType` (`Field.aiGuidance`).
- **inline, list** — array of such objects (`AiGuidance.examples`, `Type.fields`).
- **reference, single/list** — target instance id(s) of separate `rangeType` record(s)
  (`FieldAssignment.fieldId → Field`).

`mode` is fixed per Field ([R8]). A `reference` value is a **value, not a `Relation`** ([R5]).

### Change C — `datatype: "dependent"` (value-of-a-sibling-type; no sum type)

A `dependent` field's value conforms to the type descriptor named by `dependsOn` — either `"self"`
(the field's own `fieldType`, for `Field.defaultValue`) or a sibling field name (e.g.
`FieldAssignment.defaultValue` → the referenced Field's type). Conformance is a **validation
obligation** ([R6]); the JSON Schema projection is the broad permissible-value shape with conformance
asserted imperatively (as today — an acknowledged, deliberate projection-lossiness for these members,
Change G). This is **not** a sum/union type: the intent review (D5) found zero irreducible sum types.
`dependsOn`'s referent is a sibling field **name** within the same entity (or `"self"`).

### Change D — `datatype: "map"` (open extension bags; D6)

A `map` field is a string-keyed collection. `valueRange` names the value datatype, or `"open"` for a
true extension bag (arbitrary namespaced key → arbitrary value). This types the meta-model's open bags
(`meta` on Record/Relation/Container; `LifecycleTransition.properties`; `Term.properties`) without a
free-JSON escape hatch (Alt B) — a `map` is string-keyed and its value type is declared or explicitly
open. Projection: `{type:object, additionalProperties: <valueRange schema | true>}`.

### Change E — `FieldGroup` subsumed by composite range (removal gated with #242)

`FieldGroup`'s role is subsumed by a `ref`/`inline` Field over the (now first-class) Type formed from
the group's members. **New authoring uses composite range; `FieldGroup` is deprecated.** Its **actual
removal** (`Type.fieldGroups`, the `groupValues` instance carrier, `record.json` `$defs`) is a
**cutover gated with #242** — an inline composite *value* has no conforming carrier until #242 provides
the `fieldValues` representation, and the spec repo's own field-group instances (`table.json` + 14
records with `groupValues`) must migrate then. This RFC defines the subsumption and the target; it does
not delete the FieldGroup schema or strand instance data. Rendering (`compositeRenderer`) is restored
on the new model by #262. FieldGroup can be fully removed only once **both** #242 (carrier) and #262
(rendering) land.

### Change F — refactors that dissolve apparent unions (D5)

- **`ValidationRule`** is **removed**; its rule-types map to the `fieldType` facets: `minLength`/
  `maxLength` → `constraints.minLength`/`maxLength`; `pattern` → `constraints.pattern`; `enum` →
  `valueDomain:closed` (`allowedValues`); `required` → `FieldAssignment.required`. The polymorphic
  `ValidationRule.value` thereby ceases to exist. (This resolves the Rev-2 contradiction: `validationRules`
  is removed, not retained.)
- **`RequiresRelation.relationType`** (RFC-022) — the **declaration** form `string | string[]` is
  normalized to `list` (length ≥ 1; any-of interpretation unchanged in RFC-022 validation). The
  distinct scalar `fulfillment.relationType` selector is untouched.
- **`CrossFieldRule`** (RFC-019) stays a single Type with a discriminator `type` enum + per-tag
  required fields, enforced by **cross-field validation** (RFC-019), **not** modeled as `dependent`
  and not split into N types (which would need a sum range). No untagged union.

### Change G — JSON Schema projection (target contract; emitter is RFC C / #259)

Normative here are only the rows this RFC introduces; **scalar/format/list rows follow RFC-004
`projection-rules.md`** (cited, not restated, to avoid a second source of truth):

| fieldType | JSON Schema target |
|---|---|
| scalar + format + valueDomain + constraints + cardinality | per RFC-004 `projection-rules.md` (`format`; `minLength`/`maxLength`/`pattern`/`minimum`/`maximum`; array-wrap for `list`). **`valueDomain:closed` projects to a pure `enum`**: `allowedValues` inline, or — for a `vocabularyRef` (a **configurable, package-config-managed** range) — the Vocabulary's **effective Term keys** (active entries per RFC-006; excluding retired/tombstone) **resolved at schema-generation time**. Config-time flexibility, schema-time fixity: changing the Vocabulary and regenerating updates the enum. |
| `ref`, inline, single/list | `{$ref:"#/$defs/<RangeDef>"}` (single) or `{type:array, items:{$ref:…}, minItems, maxItems}` (list) |
| `ref`, reference, single/list | `{type:string, format:uuid, x-srs-range-type:"<ns>/<name>@<v>"}` (or array thereof) |
| `map` | `{type:object, additionalProperties: <valueRange schema | true>}` |
| `dependent` | broad permissible-value schema; conformance asserted by validation (deliberately lossy) |

`<RangeDef>` is the emitter-owned `$defs` key; this RFC fixes only the **reference-target contract**
(the `$ref` resolves to the range Type's emitted schema). The key MUST be an injective function of
`(namespace, name, version)`; the exact spelling and any escaping are RFC C's (#259).

### Change H — migration (breaking; definition layer)

| Old `valueType` | New `fieldType` |
|---|---|
| `string` | `{datatype:string}` |
| `text` | `{datatype:string, format:markdown|plain}` (per `contentFormat`) |
| `number` / integral | `{datatype:number}` / `{datatype:integer}` |
| `boolean` | `{datatype:boolean}` |
| `date` | `{datatype:date}` |
| `url` | `{datatype:string, format:uri}` |
| `select` | `{datatype:string, cardinality:single, valueDomain:closed, allowedValues|vocabularyRef}` |
| `multiselect` | `{datatype:string, cardinality:list, valueDomain:closed, allowedValues|vocabularyRef}` |
| `validationRules[]` | → `constraints` / `valueDomain` / `FieldAssignment.required` (Change F) |
| `RequiresRelation.relationType` (`string\|string[]` declaration) | → `{datatype:string, valueDomain:closed, vocabularyRef, cardinality:list, minItems:1}` (Change F; downstream packages only — no live spec-repo instances) |
| (field-group) | `{datatype:ref, mode:inline, cardinality:single|list, rangeType:<group Type>}` — **instance cutover gated with #242** |

`contentFormat`/`allowedValues`/`vocabularyRef`/`repeatable`/`minItems`/`maxItems` are absorbed into the
facets. `editorHint` is retained (presentation; #262). A migration script rewrites Field/Type
**definitions**; **field-group instance values migrate under #242**. This is a breaking definition +
package change (owner: no external consumers; a stable public spec must not freeze a flawed model).
**Tier-1 scope note:** this RFC decomposes the **definition** layer. `typed-record.json` `TypedField.valueType`/
`selectOptions` and `record.json` `FieldValue.entries` remain as legacy instance carriers, reconciled
with #242.

---

## Conformance Rules

> **[R1]** A Field MUST declare a `fieldType` with a `datatype` ∈ the Change-A enum (`string`, `number`,
> `integer`, `boolean`, `date`, `date-time`, `ref`, `dependent`, `map`). `cardinality` defaults `single`.
> (`date-time` matches RFC-004's projection scalar name.)
>
> **[R2]** `datatype == "ref"` REQUIRES `rangeType` (valid `ExactTypeRef`, version-exact per RFC-009);
> `mode` defaults `inline`. `rangeType`/`mode` MUST be absent otherwise.
>
> **[R3]** `valueDomain` is meaningful only for `datatype == "string"`. When `closed`, exactly one of
> `allowedValues` or `vocabularyRef` MUST be present; a `vocabularyRef` MUST resolve to a `mode:closed`
> Vocabulary (RFC-006).
>
> **[R4]** `cardinality == "list"` MAY carry `minItems`/`maxItems` (`0 ≤ minItems ≤ maxItems`). This is
> the sole cardinality mechanism; former `multiselect` and standalone `repeatable` are removed.
>
> **[R5]** A `reference`-mode value is target instance id(s); it MUST NOT be interpreted as or require a
> `Relation`. **Authoring rule:** use `reference` for definitional/structural composition where the
> target identity is part of the definition; model assertions between instances (needing provenance/
> lifecycle/confidence) as a `Relation`.
>
> **[R6]** A `dependent` field's value MUST conform to the type descriptor named by `dependsOn`
> (`"self"` or a sibling field name); implementations MUST validate this. (Dependent conformance is a
> validation obligation, not a structural schema constraint — its projection is deliberately lossy.)
> `CrossFieldRule`'s conditional requiredness is enforced by cross-field validation (RFC-019), a
> separate mechanism from `dependent`.
>
> **[R7]** The Type-definition graph MAY contain cycles. An implementation MUST reject a cycle reachable
> through only `inline` `ref` edges of **effective** minimum occurrence ≥ 1 (post-`FieldAssignmentOverride`;
> `required` single, OR `required` list with `minItems ≥ 1`). A cycle is broken by any `reference`-mode
> edge, an `optional` field, or a list with `minItems` absent/0.
>
> **[R8]** `mode` and `cardinality` are fixed per Field and MUST NOT be overridden per assignment —
> both are semantic content of the Field, and Invariant 2 forbids a Type redefining or overriding the
> semantics of a Field it includes. `required` MAY be overridden per assignment via
> `FieldAssignmentOverride` (a Type-context workflow constraint, not Field semantics), and [R7]'s
> analysis uses the effective post-override values. *(Corrected in Rev 6: Rev 5 read "`cardinality`/
> `required` MAY be overridden", which contradicted [R4]'s "sole cardinality mechanism" and described
> a facet `FieldAssignmentOverride` has never carried — its members are `fieldId`, `displayLabel`,
> `displayHint`, `required`.)*
>
> **[R9]** A `map` field's keys are strings; its values conform to `valueRange` (a **scalar** datatype)
> or are unconstrained when `valueRange == "open"`. Composite (`ref`/`map`) value ranges are out of
> scope for this RFC.
>
> **[R10]** `constraints` are datatype-appropriate: `minLength`/`maxLength`/`pattern` for `string`;
> `minimum`/`maximum` for `number`/`integer`. A constraint on an inapplicable datatype is invalid.
>
> **[R11]** Every `fieldType` MUST project to standard JSON Schema per Change G. (Projection normative;
> emitter is RFC C / #259.)

---

## Schema changes

| Schema file | Change |
|---|---|
| `field.json` | replace `valueType`, `contentFormat`, `allowedValues`, `vocabularyRef`, `validationRules`, and the `defaultValue` shape with the `fieldType` object (Changes A–D, F); **retain `editorHint`** (presentation; #262); add `$defs.ExactTypeRef` **byte-identical to `blueprint.json`** (RFC-009; correct description; consistency-checked until #259 generates it); `vocabularyRef` uses RFC-006's `Reference` (namespace/name@version) — no new ref type invented |
| `type.json` | `FieldAssignment` keeps `order`/`required`; `repeatable`/`minItems`/`maxItems` move into `fieldType.cardinality`; `RequiresRelation.relationType` declaration → `list` (Change F); `CrossFieldRule` unchanged. **`$defs.FieldGroup` + `Type.fieldGroups` are marked deprecated (subsumed) but NOT removed here** — removal is the #242-gated cutover (Change E) |
| `record.json`, `typed-record.json` | **no change.** Inline composite values need the #242 `fieldValues` representation; reference-mode values are storable today as UUID strings. `groupValues`/`FieldGroupValue` stay until the #242 cutover migrates them. |

Hand-editing is transitional — RFC C / #259 generates these from records. Mirror sync via the release
artifact after merge (not this session).

---

## Rationale

**Why decompose (incl. a constraints facet) rather than add `composite` as a ninth `valueType`.** One
new value deepens the #239 conflation and needs companion carve-outs; orthogonal facets remove the
conflation at the root and give every patch property (`contentFormat`, `allowedValues`, the
`validationRules` constraints, cardinality) a principled home — including constraints the meta-model
needs on *itself* (`version ≥ 1`). Owner decision D1.

**Why no sum/union but yes a `map`.** The intent review (D5) found zero irreducible sum types — every
apparent union is dependent-typing, cardinality, or a discriminated family. But open key→value
**extension bags** are a real, recurring meta-model shape with no home in scalar/ref/dependent; a
**bounded `map`** (string keys, declared-or-open value range) types them without the free-JSON blob Alt
B rejects (owner decision D6). "As simple as possible, but not simpler": a `map`, not a `oneOf`.

**Why configurable data ranges are first-class (and project to enums).** A package must be able to
define a set of allowed values **managed in config** — not hardcoded on each field — so the vocabulary
can evolve without editing every field that uses it. That is a `valueDomain:closed` field bound to a
package `Vocabulary` via `vocabularyRef` (RFC-006). The two faces matter: at **definition/config time**
it is a package-managed set (conceptually a map of key → Term); at **schema-generation time** it
projects to a **pure JSON Schema `enum`** of the vocabulary's current keys (Change G), so a consumer
sees a plain enum and standard tooling works. When the config changes, regenerating the schema (RFC C /
#259) updates the enum — the same regenerate-from-source discipline the whole epic rests on. This is
the requirement that makes `valueDomain:closed` + `vocabularyRef` a load-bearing part of the model, not
sugar.

**Why presentation is out of the type model.** `editorHint`/`compositeRenderer` are input-modality and
rendering concerns (`voice`, `textarea`, `table`) that map to no semantic axis; forcing them in would
re-conflate presentation with type. They are consolidated by the rendering follow-up #262 — the same
treatment for the same reason.

**Why FieldGroup removal is gated with #242.** Removing FieldGroup strands its inline-object instance
values, which have no conforming carrier until #242 provides the `fieldValues` representation. The
model subsumes FieldGroup now; the data cutover happens when the carrier exists. (Owner: breaking is
fine, and a fix follows before other work — here, #242 + #262.)

**Why everything stays typed.** The owner chose the LinkML single-language path; `ref`/`map` keep every
level typed and recursively projectable (no `json` escape hatch).

---

## Alternatives Considered

- **Alt A — a sum/union (`oneOf`) range.** Rejected (D5): no meta-model field needs it.
- **Alt B — a free `json`/`object` valueType.** Rejected: un-typed/un-projectable. The bounded `map`
  (Change D) covers the genuine open-bag need without it.
- **Alt C — keep `valueType`, add `composite` as a ninth value (Rev 1).** Rejected for the full
  decomposition (D1).
- **Alt D — a separate schema-notation vocabulary (RFC-004).** Not the substrate (owner: self-host core
  Field/Type). RFC-004's projection-rules are reused (Change G); its vocabulary is superseded (#258).

---

## Testability

### Paper exercise — the hard meta-model shapes

- **2-level nesting:** `Field.aiGuidance` = `{datatype:ref, mode:inline, single, rangeType:AiGuidance@1}`;
  `AiGuidance.examples` = `{datatype:ref, mode:inline, list, rangeType:AiGuidanceExample@1}`. ✓
- **Composite list / typed reference:** `Type.fields` = `ref,inline,list → FieldAssignment@1`;
  `FieldAssignment.fieldId` = `ref,reference,single → Field@1`. ✓
- **Numeric constraint (self-hosting its own model):** `Field.version` = `{datatype:integer,
  constraints:{minimum:1}}`; `FieldAssignment.order` = `{datatype:integer, constraints:{minimum:0}}`. ✓
  (the case Rev 2 could not express).
- **Removed union → constraints:** a former `minLength` `ValidationRule` on a title Field becomes
  `{datatype:string, constraints:{minLength:1}}`; `ValidationRule.value` is gone. ✓
- **Dependent:** `Field.defaultValue` = `{datatype:dependent, dependsOn:"self"}`. ✓
- **Discriminated family (no sum):** `CrossFieldRule` = one Type with `type` (closed enum),
  `predicateFieldId`/`targetFieldId` (`ref,reference → Field`, optional), `effect` (closed enum),
  `fieldIds` (`ref,reference,list → Field`), and **`predicateValue` = `{datatype:string}`** — RFC-019
  fixes `predicateValue` as a string (string-equality comparison; predicate fields restricted to
  string-comparable types), so it is **not** polymorphic and needs no dependent/sum typing.
  Conditional requiredness is enforced by RFC-019 cross-field validation. ✓ (the case a reviewer
  feared would need a sum type — it doesn't).
- **Configurable closed range as a list:** `RequiresRelation.relationType` (declaration form) =
  `{datatype:string, valueDomain:closed, vocabularyRef:<relation-type vocabulary>, cardinality:list,
  minItems:1}` — relation-type **keys** (`"supersedes"`, …) are strings from a package-configurable
  closed set, projecting to a pure `enum` (the configurable-data-range pattern), **not** instance
  UUID references. ✓
- **Open map:** `Record.meta` = `{datatype:map, valueRange:open}`; `LifecycleTransition.properties` =
  `{datatype:map, valueRange:open}`. ✓

### Conformance fixture (acceptance for Task #257)

A package + Type exercising every mode — each scalar datatype, string `closed` (allowedValues &
vocabularyRef), `constraints` (string + numeric), `list` (min/max), `ref` inline/reference × single/
list, `dependent`, `map` (open) — plus AiGuidance/AiGuidanceExample and the CrossFieldRule /
RequiresRelation cases authored as records; each field's expected Change-G projection recorded as a
golden. Fixture `srs repo validate`s clean.

**Fixture scope (keeps #257 acceptance independent of #242):** the `ref` construct is fully validated
at the **definition + projection-golden** level now (a Type may declare inline/reference composite
fields, and its generated schema is checked). **Instance** records in the fixture use scalar and
**reference-mode** values only (storable today as UUID strings); **inline-composite instance** values
have no conforming carrier until #242, so their instance goldens are #242's acceptance, not #257's.
#257 does not depend on #242.

---

## Open Questions

1. **`fieldType` object vs flat keys / key name.** Grouped `fieldType` object (used here) vs flat Field
   properties; retain the `valueType` key repurposed vs `fieldType`. *Leaning:* grouped object.
2. **datatype-vs-format boundary.** `date`/`datetime` first-class datatypes while `uri`/`uuid`/`email`/
   `markdown` are string `format`s (JSON-Schema-aligned). Confirm; it fixes the field.json enum and
   #259's goldens.
3. **`vocabularyRef` id-anchoring.** This RFC reuses RFC-006's string `Reference` (`namespace/name@v`)
   for minimal divergence; #258's id-anchoring (RFC-009 style) may later tighten it to a UUID+version
   ref. Deferred to #258.
4. **Reference dangling targets.** Enforcement for a `reference` value at an absent/type-mismatched
   instance — deferred to #242.

---

## Cross-references

- Enables epic **#256**; delivers Task **#257**; folds in **#239**.
- **#262** — presentation/rendering (`editorHint`, `compositeRenderer`) consolidation; gated before
  other work.
- **#242** — `fieldValues` representation; gates the FieldGroup instance cutover + inline-composite
  storage.
- **RFC-006** (Vocabulary closed-mode + `Reference`), **RFC-009** (`ExactTypeRef`), **RFC-019**
  (`CrossFieldRule`), **RFC-022** (`RequiresRelation`), **RFC-004** (projection-rules reused; vocabulary
  superseded by #258).
- Prior art: **LinkML** — `slot.range = class`, `inlined`/`inlined_as_list`, slot facets/constraints,
  and inlined-as-dict maps (linkml.io). To be added to `docs/research/alignment-opportunities.md` in
  #258.
