> **GitHub issue**: [the-greenman/srs#931](https://github.com/the-greenman/srs/issues/931). This is the RFC request; the RFC is drafted on it rather than on a second issue.

# RFC-053: A Field's id travels beside its name in machine-facing outputs

**Status**: Draft (Revision 3)
**Affects**:
- **RFC-039 (Accepted, Revision 6):** reverses, for the authoring projection, the statement "`x-srs-field-id` is retired" in RFC-039's *Blast radius* section. RFC-039's conformance rules do not change: `fieldValues` stays keyed by `Field.name` ([R1], [R2b]).
- **RFC-012 / `ext:discovery` (Accepted, Revision 13):** gains one conditional mechanism, *Field facets*, for implementations that report field facets. RFC-012's rules [R1]–[R12] do not change.
- **RFC-035 / `docs/schema/2.0/projection-rules.md` (RFC-035 Accepted, Revision 7; RFC-040 Implemented, Revision 4):** gains one section, *The authoring projection: Field identity*, which registers the annotation keyword `x-srs-field-id`. The validation projection's existing sections do not change.
- **Applies** `rfc-decision-b2ff7c91` (identifier over label governs machine-facing outputs) to two outputs that do not follow it today.
- **Adjacent, not decided here:** the-greenman/srs#366 (the `x-srs-*` keyword registry and emitter profiles, parked).

Answers SP-05. Requested by the-greenman/srs#931 and found by the-greenman/srs-web#547. Owner ruling, D6 follow-up on srs-web#547, 2026-10-09: "Ask the engine for field ids." Authorised by programme decision 6b5e2810 (owner session, 2026-10-27): "Authorise an RFC for srs#931 weighing A and B, drafted through the rfc workflow; the builder takes no implementation until it is accepted."
**Author**: agent:rfc-drafter (a scheduled draft for the owner's acceptance)
**Date**: 2026-11-04

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-11-04 | Initial draft. |
| 2 | 2026-11-04 | Agent review round 1 (two reviewers, comments on srs#931). **Blocking, fixed:** (1) References to a missing *Decisions you need to make* section now point to the numbered Open Questions, and every option is listed there. (2) [R3] now says which facet keys are normative (`fieldId`, `field`) and which choices stay with the implementation (eligibility, caps, value ordering), and it adds a deterministic tie-break. The effects on eligibility and truncation are stated. (3) Doors are named per fold target: this RFC is Door 2, and its fold carries Door 3 revision rows on RFC-012, RFC-035 and RFC-039 in one PR (Change D). **Should-fix, fixed:** [R2] now covers the unexpanded fallback and list cardinality. [R6] now omits the property at every depth and names no codes. [R5] becomes a testable cross-adapter rule. The id is stated to be version-free, and a facet is stated to span Types. The precedent is relabelled as implementation practice, beside the normative `FieldView.fieldId`. The integration manifest tokens are named. Fixtures are named. OQ3 and OQ4 become decided-unless-objected. Five absence tests are counted, not three. The srs-mcp README line is listed for rewrite. Client breakage is counted. Alt B's real advantage is stated. Payload goldens are noted as an implementation consequence. |
| 3 | 2026-11-04 | Agent review round 2 (both reviewers: zero blocking). **Should-fix, fixed:** [R3] now resolves assignments in the effective field set and breaks ties in ascending `fieldId` order. [R6] reports through the implementation's diagnostic channel. [R5] is now a completeness obligation on the output. Change D: the RFC-039 row is a non-normative revision row, not Door 3, and the fold PR's merge consequence is stated. Change A states what the registration forecloses for srs#366. Facet eligibility of nested and list values is named implementation-defined. The size cost is a lower bound. The RFC-035 Rev 6 precedent is described accurately. |

---

## Charter alignment

**Cell(s):** cell:identity, cell:conformance
**Decision mode:** complicated

**Governing cell preference:**
- *Identity: identifier over label (outputs too)* (`rfc-decision-cce3c00e`, `rfc-decision-b2ff7c91`). The proposal follows it. Two machine-facing outputs name a Field only by its label, `Field.name`: the authoring Type schema and the `find` field facets. Clients act on both outputs, grouping by them and putting them in durable addresses. `rfc-decision-b2ff7c91` names exactly this as a violation in the emitting layer: "Any fact a consumer acts on in a machine-facing output — to group, filter, suppress, branch, or link to documentation — is carried as a typed field with a stable identifier."
- *Conformance: one way over many* (`rfc-decision-cce3c00e`). The proposal follows it, and this preference is what chooses between the options. The specification already names a Field by id beside its presentation wherever a view refers to one: `FieldView.fieldId` and `ColumnSpec.fieldId` in `view.json`. The two outputs at issue also already carry an id beside a label elsewhere: `facets.byType` entries carry `typeId`, and `ref` properties carry `x-srs-range-type-id`. Those two are implementation practice, not specification. Option A follows the same pattern. Option B would add a second way to reach the same goal (see *One-way-per-goal*).

**Axis preference:**
- Identity sits on axis 2–8 (Identity↔Assertion). The default pole is Evolution over Continuity, phase-bound until the first full public release. This proposal takes the default pole: it revises a position RFC-039 took three months ago, on evidence gathered since (srs-web#547). The Continuity flip has not happened.
- Conformance sits on axis 5–11 (Succession↔Conformance). The default pole is Reliability over Renewal, with the boundary clause "standing contracts hold; renewal only as explicit supersession at a declared boundary". This proposal takes the default pole. It reverses one standing statement, RFC-039's "`x-srs-field-id` is retired", and it does so by name (Change D), not silently. Nothing that a stored repository or an existing client relies on is removed: every change adds information. The facet split (Change B) is the one behavioural change, stated with its count.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-b2ff7c91, rfc-decision-7d3dda60, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-7caca3a1, rfc-decision-e99a9437, rfc-decision-c20fcff8, rfc-decision-628cf6c4, rfc-decision-5f8204bc, rfc-decision-6523cf5e, rfc-decision-2e0cd70a, rfc-decision-4f1e12e5, rfc-decision-53635966.

**Contradictions found:** None.
- `rfc-decision-7d3dda60` is RFC-039's ruling: `fieldValues` is keyed by `Field.name`, "with field identity recovered through the Record's version-pinned Type rather than repeated as a fieldId in each value". This RFC keeps that ruling whole. Nothing is added to stored values, and the recovery the ruling names is exactly what this RFC asks the implementation to perform and report. The ruling also rejected "a separate fieldId map to each Type", and this RFC adds nothing to a Type.
- RFC-039's retirement of `x-srs-field-id` is prose, not one of its conformance rules and not a decision record. Its reason was "once instances are name-keyed there is nothing to bridge". This RFC accepts that reason and does not bring the keyword back as a bridge ([R4]). It brings back the identity the keyword carried, because `rfc-decision-b2ff7c91` (2026-10-08, after RFC-039) requires that identity in outputs.
- `rfc-decision-6523cf5e` keeps presentation hints out of the semantic type model. A Field's id is not a presentation hint, and nothing is added to `fieldType`.
- RFC-039's recorded conflict with RFC-012 (RFC-039 *Cross-references*: the text projection's iteration order) is about Text Projection order. This RFC touches neither the Text Projection nor its order.

**One-way-per-goal:** The goal is this: a client holding a name-keyed slot learns which Field the slot is. Three existing mechanisms touch it.
1. **Reading the definitions.** A client can read the Type and its Fields and match names itself. But a Type's slots are its *effective* field set: its own `fields`, plus inherited fields, `fieldOrder` and `fieldAssignmentOverrides` (RFC-040 Change A, I-39..43). A client that matches names itself re-implements effective-Type resolution. Layer rule 2 forbids that, `rfc-decision-b2ff7c91` names a client that matches on a label as a violation, and the owner's D6 ruling refuses it: "Ask the engine for field ids."
2. **`FieldView.fieldId` / `ColumnSpec.fieldId`** in a view. These are normative, but they serve only records that a view is declared over.
3. **An id beside a label, in the same output.** This is implementation practice today (`facets.byType[].typeId`, `x-srs-range-type-id`). It is the pattern of mechanism 2, applied to an output.

Option A extends mechanism 3, and makes it normative for Field identity. Option B, a separate `(typeId, typeVersion, name) → fieldId` read, would be a new and second mechanism for the same goal. That is the main reason this RFC recommends A. B is weighed in full under *Alternatives Considered*, as the owner's authorisation asks.

**Layer test:**
- **Which layer owns this?** Resolving a name to a Field id is a core service concern on the OPERATION plane. It is the resolution the reader already performs to find a Field's `fieldType` (RFC-039 Change A). The adapters (CLI, WASM, MCP) carry the result unchanged. The Type schema annotation sits on the EXPRESSION plane, at the projection layer: a projection carrying an identifier that the definition layer already holds. That is a reference down (rule 2), not a crossing (rule 4). It carries no meaning of its own and changes no validity ([R4], rule 3).
- **Consume or clone downward?** Consume. The implementation reads the version-pinned Type's effective field set, which already exists. Nothing re-implements it, and the change removes the pressure on clients to re-implement it ([R5]).
- **Does the layer below stand alone without this?** Yes. Stored Records, Types and Fields do not change. No `dataModelRevision` bump is needed. A repository is exactly as valid with this RFC absent as with it present.

**Level test** (`rfc-decision-c20fcff8`): every rule below is checked by running an implementation against a fixture (*Fold-in targets*). The checks are: the annotation is present, it names the right Field, the facets are per Field, and every adapter agrees. No rule asks a repository author to do anything.

---

## Abstract

RFC-039 made a Record's values keyed by `Field.name`. Because that left nothing to bridge, RFC-039 also removed the Field id from the Type schema that clients author against. But a field name is not an identity. Two Types can give the same name to different Fields, and `find` merges such Fields into one facet. A client that needs a stable reference to a field (an address in a URL, a board column, a grouping) now has no way to get one from the engine.

This RFC requires the engine to report a Field's id beside its name in the two outputs where clients meet field names:
- in the authoring Type schema, each property carries `x-srs-field-id`;
- in the `find` field facets, there is one facet per Field, carrying `fieldId` beside the name.

Stored data does not change. The RFC weighs this against a separate name-to-id lookup and recommends the in-place form.

---

## Motivation

### Problem 1: a field name is a label, and clients have no identity to use instead

A Field has a stable UUID `id` and a `name`. Under RFC-039 the name is the key a Record stores the value under. It is unique *within one Type's effective field set* (RFC-039 [R4]), but not across Types. Two Types may each have a Field named `kind`, and those may be different Fields with different allowed values.

The table below was measured on 2026-11-04 by scanning the Field definitions in four first-party corpora:

| Corpus | Field names | Fields | Names shared by two or more Fields | Closed string names shared |
|---|---|---|---|---|
| srs-programme | 196 | 216 | 16 | 1 (`kind`, two Fields) |
| srs spec (`srs/`) | 344 | 380 | 26 | 0 |
| srs-context | 30 | 30 | 0 | 0 |
| clerk handbook | 43 | 43 | 0 | 0 |

So a name works as a *label* inside one Type, but it is not an *identity* anywhere a client looks across Types. srs-web needs an identity in three places:
- **Durable addresses.** The Lenses view puts its "Tell apart by" choice in the URL as `by=field:<fieldId>` (srs-web#547, ADR-025). A URL that named a field by its name would silently point at a different field once another Type with the same name entered the set.
- **Board columns.** srs-web ADR-010 forbids choosing columns by name. A view's `ColumnSpec` carries `fieldId`, but a bare Type schema carries nothing.
- **Grouping.** Grouping by a field means grouping by a fact the client acts on. `rfc-decision-b2ff7c91` requires such a fact to be "carried as a typed field with a stable identifier".

Because no output carries the id, srs-web ships today with no field option at all under "Tell apart by". Boards outside a container view are limited to label, type and state columns (srs-web#547, ADR-025 gap 6).

### Problem 2: the id is recoverable in principle, but nothing recovers it for a client

RFC-039 Change A says: "`fieldId` is not stored in the instance. It is recoverable at any time from `typeId` + `typeVersion` + the key, which is the same resolution the reader already performs to find the Field's `fieldType`."

That is true inside the engine, but no binding offers this resolution to a client. The only route left is for the client to read the Type and its Fields and work out the effective field set itself: inheritance, `fieldOrder` and overrides. That is core semantics re-implemented in a leaf client, which layer rule 2 and the capability-layering rule both forbid.

### Problem 3: the two outputs as they stand

The two outputs, as found in the reference implementation (srs-rust, `origin/master` 7b12788, 2026-11-04):

- **The authoring Type schema** (`srs type schema`, MCP `type_schema`, WASM `type_schema`).
  - Each property is keyed by `Field.name`. It carries `title`, `description`, `x-srs-order`, `x-srs-description` and `x-srs-instructions`, plus `x-srs-ai-guidance` for structured guidance. A `ref` property also carries `x-srs-range-type-id` and `x-srs-range-type-version`.
  - No property carries its Field's id. The source says: "RFC-039: `x-srs-field-id` is retired — instance keys and schema keys are both `Field.name`, so there is no id-keyed instance left to bridge to."
- **The field facets** (`find` with facets on, every adapter).
  - `facets.fields` is a list of `{ field: <Field.name>, values, other }`. It is built by counting `(Field.name, value)` pairs over the match set, for names that are closed strings in every Field carrying them.
  - It holds at most 25 entries, ranked by total count. Each entry holds at most 20 values, and the rest are summed into `other`.
  - The source says: "keyed by `Field.name`: the key records store values under (RFC-039), so two fields sharing a name share a facet." Beside it, `facets.byType` entries already carry `typeId` next to their `namespace/name` value.

The specification defines neither output today:
- `projection-rules.md` defines the *validation* projection (RFC-035, RFC-040). The authoring projection, with its editor and guidance annotations, is implementation-defined; srs#366 records that gap for all its `x-srs-*` keywords.
- RFC-012 (`ext:discovery`) defines query semantics and result sets, but not facets.

So this RFC also has to say where its rules live (Change C) and which doors its fold passes through (Change D).

---

## Proposed Changes

### Change A: every authoring Type schema property carries its Field's id

An **authoring projection** is a JSON Schema projection of a domain Type that an implementation returns to a client so that the client can author a Record's `fieldValues`. In the reference implementation it is `type_schema` on every adapter. The validation projection defined by the existing sections of `projection-rules.md` is not an authoring projection.

In an authoring projection, each property carries the annotation keyword `x-srs-field-id`. Its value is the `id` of the Field assigned at that key in the effective field set of the projected `typeId@typeVersion`. The value is version-free: a Field's `id` names the Field across its versions, and a `FieldAssignment` references a Field by `fieldId` alone.

- **List cardinality.** For a list-cardinality Field, the keyword sits on the property itself (the array), never on `items`. The id names the slot, not each element.
- **Nested properties.** When an inline-composite `ref` is expanded in place, each nested property carries the id of the Field assigned at that key in the effective field set of the range Type (`rangeType.typeId@rangeType.typeVersion`), not of the outer Type.
- **Unexpanded composites.** When an inline composite is left unexpanded because its range does not resolve or would recurse, the outer property still carries its own id, because the outer Field resolves. It has no nested properties to annotate.

What this makes possible: a client holding a schema property can name the Field in a URL, a column choice or a stored preference. That name stays stable when other Types with the same field name enter the picture. It also restores a key that srs-web already reads: `blueprint-fields.ts` and two type declarations, three sites in all.

What it does not do: the keyword is an annotation. Records are still authored by `Field.name`. A client that ignores the keyword loses nothing it has today, and a validator ignores it too. It does not let a client write values keyed by id ([R4]).

What it costs:
- **Size.** One keyword per property, 58 bytes with its UUID. On the largest Type in the measured corpora (`com.semanticops.srs/manifest`, 17 own fields) that is at least 1 KB per projection; inherited and nested properties add to it.
- **Strict consumers.** No first-party client validates the authoring schema against a closed meta-schema. srs-web has 0 such sites and srs-vscode has 0, so an added keyword breaks no client.
- **Tests.** In the reference implementation, five tests that assert the keyword is absent must be inverted when this is implemented: three in srs-mcp (`tests/e2e.rs`, `tests/resources.rs`, `tests/tools.rs`) and two in `srs-repository/src/type_schema_service.rs`.

What it forecloses: `x-srs-field-id` becomes the first `x-srs-*` keyword registered outside the validation projection. srs#366's later keyword registry and emitter profiles inherit its name and its placement (on every property), and removing it later would need a supersession. srs#366 keeps the decision on every other keyword.

Scope: the *validation* projection does not change. That covers the existing sections of `projection-rules.md`, the RFC-035 emitter and the frozen seed. An annotation adds nothing to validation, and leaving the validation projection alone keeps the emitter's byte closure (`emitter ⊆ frozen seed`) untouched.

### Change B: each field facet is one Field, named by id with its name beside it

This change applies to an implementation that reports per-field facets over a match set, as the reference implementation's `find` does. For such an implementation, **each facet is one Field, not one field name**.

- **What a facet carries.** Each facet carries `fieldId` (the Field's `id`) and `field` (the Field's `name`, as a label), together with its value counts.
- **Where a value is counted.** A record's value is counted in the facet of the Field that the record's version-pinned Type assigns, in its effective field set (RFC-040 Change A, so inherited fields included), at the key the value is stored under, and in no other facet.
- **Unresolvable values.** If the record's Type does not resolve, or the key matches no assignment, the value is counted in no per-Field facet. The implementation never guesses the Field from the name.

Which Fields are eligible for a facet (including whether nested composite Fields or per-element values of list Fields count), how many facets and values are reported, and how values are ordered and truncated all stay implementation-defined, as they are today. But each of those choices is now made per Field, not per name. Only two key names are made normative: `fieldId` and `field`. Where the list sits in a result, and the names of its value-count keys, stay implementation-defined. In the reference implementation they are `facets.fields`, `values` and `other`.

A facet keyed by Field id spans every Type and every Type version that assigns that Field. A shared Field (one id assigned by several Types) gives one facet. Two different Fields that share a name give two facets with the same `field` label. When two facets tie in an implementation's ordering, the tie is broken by ascending lexicographic order of the `fieldId` string, so the output is deterministic.

What this makes possible: a client can group a set by a field, choose it by id and address it in a URL, and the counts it shows belong to that Field. This is the "Tell apart by" field option that srs-web#547 is waiting for.

What it changes for existing consumers:
- **Shared closed names split.** Where two Fields share a closed-string name in the match set, today's single merged facet becomes two facets. In the first-party corpora this happens for one name (`kind`, in srs-programme) and nowhere else.
- **Mixed shared names gain a facet.** Where a name is closed in one Field and open in another, the closed Field now gets a facet, which by-name eligibility denies it today.
- **Truncation.** Splitting adds entries, so under an implementation's facet cap one more facet may be truncated out.
- **Who is affected.** This is a change in meaning for any wire consumer of `facets.fields`. The change to its shape is additive. No first-party client reads `facets.fields` today: srs-web#547 deliberately does not use it until this lands. So no deprecation window is needed.
- **Merging is still possible.** A client that wants the merged view can sum the facets that share a `field` label.

What it forecloses: an implementation may no longer present a merged, name-keyed facet as the field facet. The issue's original proposal was to keep the merged facet and add a list of ids. That proposal is weighed as Alt B2, and choosing between them is Open Question 2.

### Change C: where the rules live

- **Change A's rules** ([R1], [R2], [R4], [R6]) go into `docs/schema/2.0/projection-rules.md` as a new section, *The authoring projection: Field identity*. The section defines the authoring projection and registers `x-srs-field-id` as a normative annotation keyword. A mechanism record of the same name carries the same rules in the spec repository. No other `x-srs-*` keyword is registered. Whether `x-srs-order`, `x-srs-widget`, `x-srs-description`, `x-srs-instructions` and `x-srs-ai-guidance` become normative stays with srs#366.
- **Change B's rule** ([R3]) goes into `ext:discovery` as a new mechanism, *Field facets*, under RFC-012's extension record. It is conditional: an implementation that reports no field facets is unaffected, and facets do not become required. RFC-012's query and result-set rules do not change.
- **[R5]** (every adapter agrees, and no client is asked to resolve) is stated once and applies to both changes.

Decided unless the owner objects (Open Question 3): no `FieldFacet` shape is added to `discovery.json`. No facet or result shape is schema-defined today, and adding one would make facets a schema-level contract for the first time, which is wider than this request.

### Change D: the doors, per fold target

This RFC is **Door 2**: it adds new normative meaning, so the owner accepts it. Its fold changes three accepted RFCs' surfaces. Where the change touches a conformance rule's surface or a normative document, the revision row is **Door 3**. Each revision row lands in the same PR as the records and the `projection-rules.md` section. Door 2 and Door 3 both mean the owner merges that fold PR; no agent auto-merges it. Precedents: RFC-012 Revision 13 (a Door 3 amendment executing RFC-043), and RFC-035 Revision 6 (an amendment for RFC-040 Unit 3).

| Accepted RFC | What changes on its surface | Revision row on fold |
|---|---|---|
| RFC-039 | The *Blast radius* statement "**`x-srs-field-id` is retired.** … Once instances are name-keyed there is nothing to bridge, so Phase B removes it from the editor-facing projection." is reversed for the authoring projection: the keyword returns under RFC-053 as an identity annotation, not as a bridge. | Yes, as a non-normative revision row recording the reversal: the statement is prose, not a conformance rule, so no Door 3 is needed. Conformance rules, `rfc-decision-7d3dda60` and the migration are untouched. |
| RFC-012 (`ext:discovery`) | A new conditional mechanism, *Field facets* ([R3], [R5]). | Yes, Door 3 (a new mechanism under its banner). [R1]–[R12] are untouched. |
| RFC-035 (`projection-rules.md`) | A new section on the authoring projection. The validation projection is untouched. | Yes, Door 3 (a new section in its normative document), naming RFC-040's sections as unchanged. |

---

## Conformance Rules

> **[R1]** *(The authoring projection carries identity.)* Every property of an authoring projection of a Type MUST carry the keyword `x-srs-field-id`. Its value MUST be the `id` (a UUID string) of the Field assigned at that property's key in the effective field set (RFC-040 Change A, I-39..43) of the projected `typeId@typeVersion`. For a list-cardinality Field the keyword MUST sit on the property, not on its `items`.
>
> **[R2]** *(At every depth.)* Where an authoring projection expands an inline-composite `ref` in place, every nested property MUST carry `x-srs-field-id` as [R1] requires, resolved against the effective field set of the range Type `rangeType.typeId@rangeType.typeVersion`. Where the composite is left unexpanded, the outer property MUST still carry its own `x-srs-field-id`.
>
> **[R3]** *(Facets are per Field.)* An implementation that reports per-field facets over a match set MUST make each reported facet correspond to exactly one Field `id`. No two facets in one result MAY carry the same `fieldId`. Each facet MUST carry `fieldId` (the Field's `id`) and `field` (the Field's `name`). A value MUST be counted only in the facet of the Field that the record's version-pinned Type assigns, in its effective field set (RFC-040 Change A), at the key the value is stored under. A value whose Type does not resolve, or whose key matches no assignment, MUST NOT be counted in any per-Field facet. Where an implementation orders facets and two facets tie, it MUST break the tie by ascending lexicographic order of the `fieldId` string. Which Fields are eligible, the caps and the value ordering are implementation-defined, and MUST be decided per Field.
>
> **[R4]** *(An annotation, never a key.)* `x-srs-field-id` and a facet's `fieldId` are annotations. They MUST NOT change the validity of any value. An implementation MUST NOT accept `fieldValues` keyed by Field id because of them. `fieldValues` keys remain `Field.name` (RFC-039 [R1], [R2b]).
>
> **[R5]** *(Every adapter agrees, and no client resolves.)* Over the same repository state, every adapter of one implementation (command line, embedded binding, MCP) MUST report the same Field id for the same authoring-projection property and the same facet. The ids that [R1]–[R3] require MUST be present in the output itself, so that no client needs to read Type or Field definitions to learn them.
>
> **[R6]** *(Unresolvable assignment.)* Where a Type's field assignment, at any depth, names a Field id that the repository does not hold, the authoring projection MUST omit that property and MUST report, through the implementation's diagnostic channel for that projection, a warning naming the unresolved id.

---

## Schema changes

| Schema file | Change |
|---|---|
| `projection-rules.md` | New section *The authoring projection: Field identity*. It defines the authoring projection, registers `x-srs-field-id`, and states [R1], [R2], [R4], [R5] and [R6]. The validation projection's existing sections are unchanged. |
| `discovery.json` | **None.** RFC-012 defines no result or facet shape in this file, and this RFC adds none: [R3] is an `ext:discovery` mechanism rule (Change C, Open Question 3). |
| `field.json`, `type.json`, `record.json` and every other JSON schema | **None.** Stored shapes do not change. |

No JSON schema file changes, so the mirrors (`srs-rust/crates/srs-schema/schemas/2.0/`, `srs-vscode/schemas/2.0/`) need no sync. `projection-rules.md` is not mirrored. No `dataModelRevision` bump is needed and no migration exists: no stored shape changes.

Outside spec scope, and listed only so that it is not a surprise: the reference implementation's payload schema golden files (srs-rust `crates/srs-cli/schemas/payload/`, `find`) gain `fieldId` on the field facet when this is implemented.

---

## Rationale

**Why the id goes beside the name, rather than the name alone.** A name is a label, unique only within one Type. Every place a client stores a field choice (a URL, a column set, a preference) outlives the set it was chosen from. `rfc-decision-b2ff7c91` already rules that such facts travel as stable identifiers. This RFC applies that ruling to two outputs written before it.

**Why in the outputs (A), rather than a separate lookup (B).** Four reasons, in order of weight:
1. *One way over many.* The specification names a Field by id beside its presentation wherever a view refers to one (`FieldView.fieldId`). The same outputs already put an id beside a label in practice. A lookup operation would be a second way to the same goal.
2. *A lookup cannot fix the facet.* A merged facet does not say which Types contributed to it, so a client holding only the facet has no `typeId@typeVersion` to pass to a lookup. Under B the facet would have to carry its contributing Types anyway: the facet output changes *and* a lookup is added.
3. *Cost to the client.* The client already has the schema or the facet in hand. A lookup adds one call per Type per view, plus a cache to keep in step with the repository.
4. *Owner intent.* "Ask the engine for field ids" (srs-web#547, D6 follow-up). Both options ask the engine, but A answers in the reply the client already receives.

**Why the name `x-srs-field-id`.** It is the name the keyword had (Description: one name over many; `rfc-decision-628cf6c4` treats a name as a contract), and it holds the same value it held. srs-web still reads it at three sites. A new name would leave those readers broken and add a second spelling for one identifier.

**Why one facet per Field.** Grouping is one of the acts `rfc-decision-b2ff7c91` names. A facet that groups by a label and lists ids beside it still groups by the label: the counts belong to the name, and a client that picks one of the ids has no counts for it. One facet per Field groups by the identifier and keeps the label for display. Merging stays possible in the client, because merging by a label is presentation.

**Why the validation projection is left alone.** An annotation cannot change validation. Adding it there would change committed emitter output and the frozen-seed closure, for no gain in validation.

---

## Alternatives Considered

### Alt B: a separate resolution read, `(typeId, typeVersion, name) → fieldId`

A new core operation, exposed on every adapter, that resolves a name in a Type's effective field set to the Field's id. The projection and the facets stay as they are.

- *For:*
  - The authoring projection stays free of any id keyword, which is closest to RFC-039's stated wish.
  - Clients that never need ids pay nothing.
  - A client holding only a Record (for example an MCP agent that has read one record) can learn a field's id from the Record's own `typeId@typeVersion` and key, without fetching a whole schema or running a `find`.
- *Against:*
  - It is a second mechanism for a goal the id-beside-label pattern already serves.
  - It does not fix the facets. A merged facet carries no `typeId@typeVersion` to resolve against, so the facet output must change anyway, and the client must then call once per Type and combine the results. That is grouping logic in the client.
  - It costs a round trip per Type per view. Under MCP, every agent that wants an id spends an extra tool call.
- *Not chosen*, but specified well enough to accept instead. Accepting B would replace Changes A and B with two things. First, one new core read, exposed on CLI, WASM and MCP: input `typeId`, optional `typeVersion` (latest when absent) and `name`; output the Field `id`, or a not-found error. Second, a facet rule: each name-keyed facet lists the `typeId@typeVersion` pairs that contributed to it. [R4]–[R6] would stand as written. B and A are not exclusive. The Record-only advantage could be added later as a convenience, without a second identity mechanism, if A is accepted first.

### Alt B2: keep the merged facet and add a list of ids (the issue's proposal)

`facets.fields[]` stays one entry per name. Each entry gains `fieldIds`: the sorted list of Field ids that store values under that name in the match set.

- *For:*
  - Facets are counted exactly as today, so a facet list has the same number of entries.
- *Against:*
  - It groups by the label and only annotates the identity. When the list holds two ids, the client cannot tell which values belong to which Field, so it cannot offer a per-Field choice with honest counts.
  - It invites clients to read `fieldIds[0]`, which is a guess.
- *Not chosen*, for the reason in *Rationale*. Offered to the owner as Open Question 2, option (b).

### Alt C: leave the outputs alone and let clients resolve from the definitions

- *Not chosen.* It re-implements effective-Type resolution in every client (layer rule 2). `rfc-decision-b2ff7c91` names label matching in a client as a violation, and the owner's D6 ruling refuses it.

### Alt D: key the authoring projection by Field id

- *Not chosen.* It reopens RFC-039's central property, that instance keys and schema keys are identical by construction (`rfc-decision-7d3dda60`). The authoring schema would then describe a shape no Record has.

---

## Open Questions

1. **A or B?** *Owner decision.*
   - (a) **A**, Changes A and B as written. The id travels in the outputs clients already receive. *Recommended.*
   - (b) **B**, the separate read and the contributing-Types facet rule (Alt B). The projection stays free of id keywords, at the cost of a second mechanism and one call per Type.
   - (c) **A now, with B's Record-only lookup later** as a convenience, if an agent use case appears.
2. **Facet shape under A.** *Owner decision.*
   - (a) **One facet per Field** (Change B): it groups by identity, honest counts per id, a shared closed name splits (one name today), and the merge happens in the client. *Recommended.*
   - (b) **One facet per name with `fieldIds`** (Alt B2): counting does not change, but per-id counts are unavailable whenever a name is shared.
3. **A schema shape for field facets?** *Decided unless the owner objects:* none. [R3] is a mechanism rule, and `discovery.json` does not change (Change C). If the owner wants a shape, it fits better with srs#366's emitter-profile work.
4. **Placement of [R3].** *Decided unless the owner objects:* under `ext:discovery`, as a conditional mechanism. The alternative was a rule in `projection-rules.md`, which would put a discovery output under projection rules.

---

## Fold-in targets (on acceptance; not done in this Draft)

- **`docs/schema/2.0/projection-rules.md`:** the new section (Change C).
- **Mechanism records:**
  - *Authoring projection: Field identity*, carrying [R1], [R2], [R4], [R5] and [R6];
  - *Field facets*, under `ext:discovery`, carrying [R3] and [R5].
- **Integration manifest:** `ext:discovery`, `mechanism:field-facets`, `mechanism:authoring-projection-field-identity`.
- **Revision rows:** Door 3 on RFC-012 and RFC-035, and a non-normative row on RFC-039 (Change D).
- **Conformance fixtures:**
  - *Facets:* two Types, each assigning a different closed-string Field named `kind`, plus a third Type sharing one of those Fields. Expected: two facets, one of which spans two Types.
  - *Authoring projection:* a Type that inherits a field and expands an inline composite. Expected: every property, nested ones included, carries the right id.
- **`srs-usage.md`:** rewrite the `type_schema` line ("the `x-srs-field-id` bridge is retired") to say that each property carries `x-srs-field-id` as the Field's identity, and that records are still authored by name.
- **Implementation (srs-rust, filed only after acceptance):**
  - `type_schema_service.rs` emits the keyword at every depth;
  - `discovery_service.rs` counts facets per Field id, with eligibility per Field;
  - the five absence tests are inverted;
  - the payload goldens regenerate;
  - the srs-mcp README line, which says the UUID is what `record_create` needs, is rewritten, because records are authored by name; `docs/adr/037-mcp-adapter-surface.md` and `docs/dogfooding.md` are re-checked.
- **srs-web, afterwards:** restores the "Tell apart by" field option and the schema-order board columns (ADR-025 gap 6).
