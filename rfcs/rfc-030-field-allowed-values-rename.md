> **GitHub issue**: [the-greenman/srs#240](https://github.com/the-greenman/srs/issues/240)

# RFC-030: Rename Field's normative `selectOptions` property to `allowedValues`

**Status**: Accepted (Revision 3)
**Affects**: `com.semanticops.srs/field` (Field definition), version-semantics table, vocabulary/Term substrate (V3 invariant, four-vocabularies table), `docs/schema/2.0/package-bundle.json` (embedded Field shape); builds on RFC-006 (vocabulary/Term substrate, Accepted), which authored the `vocabularyRef`/`selectOptions` exclusivity text and invariant V3 this RFC renames
**Author**: the-greenman (from issue the-greenman/srs#232)
**Date**: 2026-07-27

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-27 | Initial draft |
| 2 | 2026-07-27 | Review round 1: added Change D (`package-bundle.json` embedded Field shape also says `selectOptions` — spec integrity review found a second schema file, not zero schema impact as originally claimed); narrowed the "no other record mentions" claim and added a non-normative note on one stale instance description; added explicit re-render step; demoted R2/R3 from Conformance Rules to Scope notes (not independently testable spec rules); cited RFC-006 as the RFC whose text this renames; removed a misleading V3 cross-reference in Change A; noted RFC-004 (Draft, unaffected) carries the same stale name for its own future review. |
| 3 | 2026-07-27 | Accepted — zero blocking findings after Revision 2 review. Implementation started on branch `rfc/030-field-allowed-values-rename`. |

---

## Abstract

The normative specification names a Field property `selectOptions`, but the JSON Schema (`docs/schema/2.0/field.json`), the reference Rust engine (`srs-core::Field::allowed_values`), and every Field instance in every published package use `allowedValues`. This RFC corrects the spec prose to match the de-facto, already-shipped name: `allowedValues`. `docs/schema/2.0/field.json` needs no change (already correct); `docs/schema/2.0/package-bundle.json` embeds a second, non-authoritative copy of the Field shape that also says `selectOptions` and is corrected alongside the spec text (Change D) — this is additive (`additionalProperties: true`) and not a breaking change.

---

## Motivation

### Problem — normative spec disagrees with schema, engine, and every instance

`docs/spec/srs-spec.md` (rendered from `srs/records/type-definitions/field.json` and `srs/records/subsections/04-2-4-2-field.json`, `03-1-version-semantics.json`, `04-7-vocabulary-term-substrate.json`) declares the Field property that backs `select`/`multiselect` inline options as `selectOptions`. Every other surface in the ecosystem disagrees:

| Surface | Property name |
|---|---|
| `docs/schema/2.0/field.json` | `allowedValues` |
| `docs/schema/2.0/package-bundle.json` (embedded Field shape) | `selectOptions` — a second schema drift, corrected by Change D below |
| `srs-rust/crates/srs-core/src/types/field.rs` (`Field::allowed_values`) | `allowed_values` |
| `srs-rust` V3 validation implementation | `allowed_values` |
| `srs-web` (`Select.svelte`, `srs-client.ts`) | `allowedValues` |
| Every select/multiselect Field instance across `srs/package/`, `packages/` | `allowedValues` |
| **Normative spec** (`field.json` type-def, `04-2-4-2-field.json`, `03-1-version-semantics.json`, `04-7-vocabulary-term-substrate.json`) | `selectOptions` |

An independent implementer reading only the specification would build `selectOptions` support and interoperate with nothing — not the reference engine, not any published package, not the spec repo's own instance data. This also makes invariant **V3** ("A `select`/`multiselect` Field must declare exactly one of `selectOptions` or `vocabularyRef`") unimplementable as written: no engine or schema recognizes a property by that name.

Among the four normative spec records, `selectOptions` is not otherwise in use as a Field-definition (Tier 2) property. It correctly remains the name for the unrelated `TypedField.selectOptions` property (Tier 1 — `srs/records/subsections/04-4-4-4-record-tiers.json`, `srs/records/type-definitions/record-typed.json`, and `docs/schema/2.0/typed-record.json`), which is untouched by this RFC — TypedField's schema and spec text already agree with each other and are out of scope.

This RFC also amends text that RFC-006 (vocabulary/Term substrate, Accepted) originally authored: the `vocabularyRef`/`selectOptions` mutual-exclusivity mechanism and invariant V3 itself were introduced by RFC-006 into these same four target records. This RFC is a pure rename of the property name within that mechanism — it does not change RFC-006's exclusivity or resolution semantics.

**Scope note — one non-normative instance description, and a second Draft RFC, also carry the stale name; both are explicitly out of scope.** `srs/package/fields/vocabulary-ref.json` (a shipped Field instance, version 1) has a `description` mentioning "inline selectOptions". This RFC does not edit it: `description` is versioned content (the version-semantics table recommends a minor bump on reword), and bumping a widely-referenced Field's version is a separate, independently-reviewable change outside a spec-text correction. Filed as a follow-up. Separately, `rfcs/rfc-004/proposed-schemas/field.json` belongs to RFC-004, which is still Draft (unaccepted) and out of scope here; that RFC's own review should catch its stale `selectOptions` when it advances.

### Why the correction runs spec → matches-implementation, not the reverse

`allowedValues` is already the shipped, version-1 contract for `docs/schema/2.0/field.json`, is exercised by every conformance fixture and package in the ecosystem, and is the name `srs-core`'s public struct field, its serde wire format, and `srs-web`'s UI all use. Renaming the schema/engine/data side instead would be a breaking change to every existing repository and package with select/multiselect fields, for zero semantic gain — the spec text is simply wrong about the wire format of the model's most-used constrained-value mechanism. Correcting the spec's prose is a documentation fix, not a breaking change to any conformant implementation or repository.

---

## Proposed Changes

### Change A — Field definition normative text

In `com.semanticops.spec/type-definition` record `206b93e5-c3a4-516c-9e50-9c1be3a7f25c` (`srs/records/type-definitions/field.json`) and `com.semanticops.spec/subsection` record `656e5bbb-c29a-5020-9984-121191a4cf68` (`srs/records/subsections/04-2-4-2-field.json`):

- The Field TypeScript shape block: `selectOptions?: string[]` → `allowedValues?: string[]`.
- The `valueType` semantics table rows for `"select"`/`"multiselect"`: `One value from \`selectOptions\`` / `One or more values from \`selectOptions\`` → `allowedValues`.
- The `vocabularyRef` binding subsection (04-2-4-2 only): the `selectOptions?: string[]` sugar declaration and its accompanying prose ("`selectOptions` is formally sugar for an anonymous inline closed vocabulary...") → `allowedValues`. (Invariant V3's own prose lives in the `04-7-vocabulary-term-substrate.json` record, covered separately by Change C — 04-2-4-2's only V3 mention is a bare `(V3)` citation marker with no property name attached.)

### Change B — Version-semantics trigger table

In `com.semanticops.spec/subsection` record `8e3fb02c-3863-55a9-8bcd-0580e0c7b3a9` (`srs/records/subsections/03-1-version-semantics.json`): the table row `` `valueType`, `selectOptions`, or `validationRules` changed `` → `` `valueType`, `allowedValues`, or `validationRules` changed ``.

### Change C — Vocabulary/Term substrate: V3 invariant and four-vocabularies table

In `com.semanticops.spec/subsection` record `45cebefe-39ce-47d9-8753-b2b03ac25a18` (`srs/records/subsections/04-7-vocabulary-term-substrate.json`): the four-vocabularies table's "Field values" row (`` `Vocabulary` via `vocabularyRef` or inline `selectOptions` ``) and invariant **V3**'s prose (`A \`select\`/\`multiselect\` Field must declare exactly one of \`selectOptions\` or \`vocabularyRef\`.`) → `allowedValues`.

No other normative spec record mentions Field's `selectOptions` — confirmed by repository-wide grep before drafting this RFC (see Scope note above for the two non-normative exceptions, both explicitly out of scope).

### Change D — `package-bundle.json` embedded Field shape

`docs/schema/2.0/package-bundle.json`'s `$defs.Field` (used to validate inline Field definitions carried in a distributable package bundle) is a second, informal copy of the Field shape that independently declares `selectOptions` (not `allowedValues`), missed by the issue's original schema survey (which checked only `field.json`). Rename `$defs.Field.properties.selectOptions` → `allowedValues` there too. This def has `additionalProperties: true`, so the rename is additive and non-breaking: any bundle already validating under the old property name continues to validate (the property was never required), and no consumer reads `$defs.Field.selectOptions` by that name (`srs-core` deserializes into the real `Field` struct, whose field is already `allowed_values`).

### Change E — Re-render the published spec

`docs/spec/srs-spec.md` and `docs/spec/srs-unified.md` are generated from the records touched by Changes A–C (`scripts/publish-spec.mjs`, per `CLAUDE.md`: "Re-render if the rendered spec is also being committed"). Run the publish pipeline and commit the regenerated output together with the record changes in the same commit — otherwise the human-facing rendered spec keeps showing `selectOptions` after this RFC merges, defeating its purpose.

---

## Conformance Rules

> **[R1]** The normative name of the Field property described by invariant V3 and the `valueType` semantics table (§04-2-4-2) MUST be `allowedValues`. `selectOptions` MUST NOT appear as a Field-definition (Tier 2) property name anywhere in the normative spec or in `docs/schema/2.0/package-bundle.json`'s embedded Field shape.

**Scope (non-normative, describes this RFC's diff rather than a checkable spec-state invariant):** this RFC does not alter any text describing `TypedField.selectOptions` (Tier 1, §04-4-4-4) — that property is unrelated and its name is unchanged. No engine struct or existing instance data changes as a result of this RFC (`srs-core::Field::allowed_values` and all published Field instances already say `allowedValues`) — it is a spec/schema-text-only correction bringing the prose into agreement with the already-shipped contract.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/field.json` | None — already declares `allowedValues` (v2.0, `additionalProperties: false`). |
| `docs/schema/2.0/package-bundle.json` | Rename `$defs.Field.properties.selectOptions` → `allowedValues` (Change D). Additive, non-breaking (`additionalProperties: true`). |

`srs-rust` and `srs-vscode` schema mirrors sync from `docs/schema/2.0/` via their own `sync-schemas-from-spec.sh` pipelines after this PR merges (per `srs-rust/CLAUDE.md` Schema Sync); this RFC does not touch those repos directly.

---

## Rationale

The alternative — renaming the schema, the Rust engine's public field, and every published package's field instances to `selectOptions` — would be a breaking wire-format change across the entire ecosystem to make reality match a spec typo. Correcting the four spec records is the only change with zero blast radius on conformant implementations and existing data, and it is the change the issue's own investigation concluded was correct ("the spec should almost certainly be corrected to match rather than the reverse").

---

## Alternatives Considered

### Alt A — Rename schema/engine/data to `selectOptions` instead

Rejected: breaking change to `docs/schema/2.0/field.json` (major version bump), every Field instance with inline options across `srs/package/` and `packages/`, `srs-core::Field::allowed_values`, and `srs-web`'s UI layer, for no semantic benefit — the two names are synonyms, and `allowedValues` is already universally deployed.

### Alt B — Support both names as aliases

Rejected: SRS Fields have exactly one normative shape per version; a dual-name alias adds permanent ambiguity (which name does a new implementer use? which does validation prefer?) to fix a spec-only defect that has a clean, unambiguous single-name resolution.

---

## Open Questions

None.
