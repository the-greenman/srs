> **GitHub issue**: [the-greenman/srs#144](https://github.com/the-greenman/srs/issues/144)

# RFC-020: Type-Level Identity Field (`identityFieldId`)

**Status**: In Progress (Revision 4)
**Affects**: `type.json` (`Type.identityFieldId`), `ext:type-inheritance` (new Rules [N+32]–[N+36]), Default Rendering Baseline / Heading Hierarchy spec prose (new Rule [N+37])
**Builds on**: `ext:type-inheritance` (baseline spec — `extendsTypeId`, `fieldOrder`, `fieldAssignmentOverrides`, Invariants 39–42)
**Author**: the-greenman (design decisions recorded via comments on the-greenman/srs#144)
**Date**: 2026-07-09

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-09 | Initial draft, incorporating owner decisions resolving all open questions raised in the original problem-statement comment on #144 |
| 2 | 2026-07-09 | Review round 1 (Spec Integrity + RFC Completeness). Corrected Change B/Rationale: `fieldOrder` does **not** actually inherit across the ancestor chain (Inv 41 / `package.rs::effective_fields` only check the resolving Type's own `field_order`) — removed the false precedent claim; `identityFieldId`'s cascading inheritance is specified as new, self-contained behavior in [N+34], not a reuse of existing `fieldOrder` semantics. Removed the dangling "(Rule governing fieldOrder inheritance)" citation. Added Rule [N+37] and Change D addressing the previously-unaddressed interaction with the existing `titleFieldId`-driven Default Rendering Baseline / Heading Hierarchy. Added "Builds on" header line. |
| 3 | 2026-07-09 | Review round 2 (Spec Integrity re-review — round-1 blocking finding confirmed resolved). New should-fix found: Change D's prose claimed coverage of `DocumentView` sections rendered via a dispatched L1 View, but [N+37] as drafted only covered the Default Rendering Baseline (`renderViewId` absent) path. Broadened Change D and Rule [N+37] to explicitly cover per-record heading emission regardless of which rendering path (baseline or dispatched L1 View) governs the section's field content, consistent with the existing note that heading behavior "leave[s] intra-record group rendering inside a dispatched L1 View unaffected" (i.e. heading is a section-level concept independent of the field-rendering mechanism). |
| 4 | 2026-07-09 | Implementation started; RFC file committed to branch `rfc/020-type-level-identity-field`; `identityFieldId` added to `docs/schema/2.0/type.json`. |

---

## Abstract

The SRS `Type` schema has no concept of which field holds a record's identity/title text. Every label-producing client in the reference implementation (srs-rust's `record_label.rs`) falls back to a hardcoded English name ladder (`title` > `name` > `label`), then to the type name, which produces meaningless labels (e.g. `section.list` instead of "Process") for any repository whose primary field is named something else. This RFC adds an optional, inheritable, overridable `identityFieldId` property to `Type`, naming one field from the Type's effective field set as the record's identity field, giving conformant implementations a schema-driven way to resolve a correct display label without guessing at field names.

---

## Motivation

### Problem 1 — Display labels are guessed from English field names, not declared by schema

`FieldAssignment` (the shape of `Type.fields[]`) carries `fieldId`, `order`, `required`, and `displayLabel` (a rendering-only string override) — nothing names which field *is* the record's identity. Concrete repro: muDemocracy.org's `muSrs.srsj` guide section types (`section.list`, `section.table`, `section.commentary`) hold their heading text in a field named `heading`. No spec-declared mechanism lets a Type author say "this field is the one to show as the title," so every consuming client (list views, tree/navigation, discovery, container views, search-text projection) either reimplements its own name-guessing heuristic or falls back to showing the type name — wrong in both cases.

### Problem 2 — The nearest existing concept doesn't generalize

`DocumentSection.titleFieldId` (`document-view.json`) already lets a `DocumentView` declare which field supplies a per-record heading, but it is scoped to a specific View's rendering context. Most label-producing contexts (list views, tree navigation, discovery results, generic container listings) have no `DocumentView` in scope at all — there is no view to carry a `titleFieldId`. The identity concept needs to live on the `Type` itself, not on a View, to be usable everywhere a Record appears.

---

## Proposed Changes

### Change A — `Type.identityFieldId`

Add an optional top-level property to `Type`:

| Property | Type | Description |
|---|---|---|
| `identityFieldId` | `UUID` (optional) | Names a `fieldId` from the Type's effective field set (own `fields[]` plus, under `ext:type-inheritance`, inherited fields) as the record's identity/display field. |

### Change B — `identityFieldId` cascades through the inheritance chain (new behavior)

`ext:type-inheritance` has one existing per-field override mechanism — `fieldAssignmentOverrides`, an array of per-field patches (`FieldAssignmentOverride`, keyed by `fieldId`) that adjust presentation/requiredness attributes of a *specific inherited field*. `identityFieldId` is a whole-Type-level pointer (which *one* field is identity for this Type), not a per-field attribute patch, so a per-field override entry cannot express it (see Alternatives Considered, Alt B).

`fieldOrder` looks structurally similar (also a top-level property on the derived Type) but its existing behavior does **not** provide a usable precedent: per Invariant 41 and the reference implementation (`srs-repository::Package::effective_fields`), `fieldOrder` is read only from the Type instance being resolved — if a derived Type declares no `fieldOrder`, the merge falls back to natural order (inherited fields, then own fields); it does **not** search up the ancestor chain for an ancestor's `fieldOrder`. Reusing that behavior for `identityFieldId` would mean every derived Type in a chain would need to redeclare `identityFieldId` itself to keep it — which defeats the requirement that identity be genuinely inherited (see the design decision on #144: "identity should be both inherited and overrideable").

`identityFieldId` therefore introduces its own, new, fully-specified inheritance rule (Rule [N+34]): the *effective* `identityFieldId` of a Type is its own `identityFieldId` if declared, otherwise the effective `identityFieldId` of its base Type, resolved transitively up the ancestor chain. A Type overrides by declaring its own `identityFieldId`, which may point at either an inherited field or a field the Type itself adds.

### Change C — Explicit scope: Tier 2 only

`identityFieldId` has meaning only for Tier 2 Records (bound to a Type via `typeId`/`typeVersion`). Tier 0 (Note) and Tier 1 (TypedRecord) instances have no Type binding and are out of scope for this RFC — see Alternatives Considered for why a Tier 1 fallback was rejected.

### Change D — Interaction with `DocumentSection.titleFieldId` and per-record headings

The per-record heading (`docs/spec/srs-spec.md` § "Heading Hierarchy", level `3 + depthOffset`) is emitted "when `titleFieldId` is set on the section" (Rule [N+1]), with no fallback when it is absent. This heading is a `DocumentSection`-level concept that composes with, but is independent of, which mechanism renders the record's field content — it applies whether that section renders via the Default Rendering Baseline (`renderViewId` absent) or a dispatched L1 View (`renderViewId`/`typeDispatch` set; per the existing note that heading behavior "compose[s] with... heterogeneous sections... and leave[s] intra-record group rendering inside a dispatched L1 View unaffected"). Today, a section with no `titleFieldId` emits no heading in either rendering path — exactly the gap Problem 1 describes.

This RFC adds a fallback: for any `DocumentSection` that does not declare `titleFieldId`, per-record heading emission SHOULD use the record's Type's effective `identityFieldId` (Rule [N+37]), regardless of which rendering path governs that section's field content. `titleFieldId`, when present, continues to take precedence — it is a more specific, View-authored declaration for that section, whereas `identityFieldId` is the Type-wide default.

---

## Conformance Rules

> **[N+32]** A `Type` MAY declare an optional `identityFieldId` (UUID) naming one field, from the Type's effective field set (own `fields[]` plus, under `ext:type-inheritance`, the merged inherited field set), as the record's identity/display field.
>
> **[N+33]** If `identityFieldId` is present on a Type's effective definition, it MUST reference a `fieldId` present in that Type's effective field set. A Type whose `identityFieldId` does not resolve to a member of its effective field set is invalid.
>
> **[N+34]** Under `ext:type-inheritance`, the *effective* `identityFieldId` of a Type is: its own `identityFieldId`, if declared; otherwise, the effective `identityFieldId` of its base Type (`extendsTypeId`/`extendsTypeVersion`), resolved transitively up the ancestor chain; otherwise absent. A Type overrides an inherited effective `identityFieldId` by declaring its own `identityFieldId`, which need not match the base Type's and MAY point at a field the Type itself adds. This inheritance rule is specific to `identityFieldId` — it is not a reuse of `fieldOrder`'s inheritance behavior, which does not cascade across the ancestor chain (see Rationale).
>
> **[N+35]** `identityFieldId` scopes to Tier 2 Records only. It has no defined meaning for Tier 0 (Note) or Tier 1 (TypedRecord) instances, which carry no Type binding.
>
> **[N+36]** A conformant implementation SHOULD resolve a Record's display label by preferring the value of the field named by its Type's effective `identityFieldId`, when present, before falling back to any implementation-specific heuristic (e.g. name-based field-name heuristics or a type-name fallback).
>
> **[N+37]** For any `DocumentSection` that does not declare `titleFieldId` — whether that section's field content renders via the Default Rendering Baseline (`renderViewId` absent) or a dispatched L1 View (`renderViewId` set) — implementations SHOULD render the per-record heading (Heading Hierarchy, level `3 + depthOffset`) using the value of the field named by the record's Type's effective `identityFieldId`, if present, in place of omitting the heading. When `DocumentSection.titleFieldId` is declared, it MUST continue to take precedence over `identityFieldId` for that section's per-record heading.

---

## Schema changes

| Schema file | Change |
|---|---|
| `type.json` | Add optional top-level `identityFieldId` property (`format: uuid`) to the `Type` definition, with description documenting the effective-field-set validation ([N+33]) and the cascading-inheritance semantics unique to this property ([N+34]). |

No other file under `srs/docs/schema/2.0/` changes shape. Rule [N+37] (per-record heading fallback) is a change to normative *prose* in the spec-as-SRS-repo (`srs/srs/records/`, rendered to `docs/spec/srs-spec.md` — see "Default Rendering Baseline" / "Heading Hierarchy"), not a JSON Schema file; it is authored as spec records in Stage 6 of the RFC pipeline, not as a schema diff here.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

---

## Rationale

**Why a top-level `Type` property, not a `fieldAssignmentOverrides` entry.** `fieldAssignmentOverrides` patches attributes of one *already-inherited field's assignment* (its label, hint, or requiredness) — it cannot express "this field is the Type's identity" as a Type-wide fact without requiring every derived Type to redeclare the same override just to keep pointing at the inherited identity field (see Alt B). A top-level `Type` property is the right shape for a whole-Type fact.

**Why `identityFieldId`'s inheritance is new behavior, not a reuse of `fieldOrder`.** `fieldOrder` is structurally similar (also a top-level, optional property on the derived Type) but its *actual* behavior, per Invariant 41 and `srs-repository::Package::effective_fields`, is single-level: it is read only from the Type being resolved, never looked up on an ancestor when absent. Reusing that behavior verbatim for `identityFieldId` would silently break the owner's explicit requirement that identity be genuinely inherited across a chain (every derived Type would need to redeclare it, or lose it). This RFC therefore specifies `identityFieldId`'s own cascading-inheritance rule ([N+34]) rather than claiming an existing precedent that doesn't hold.

**Why not reuse `titleFieldId`.** `DocumentSection.titleFieldId` is scoped to a specific `DocumentView`'s rendering context and is not visible to list/tree/discovery/container-listing code paths that never construct a View. Naming a distinct, Type-scoped property (`identityFieldId`) also avoids conflating two genuinely different concepts: a document's title (a View-level rendering concern, potentially different per View) and a record's field-level identity value (a Type-level semantic fact, stable across every View). A record's identity field and a document's declared title field may legitimately differ.

**Why Tier 1 is out of scope.** TypedRecord (`typed-record.json`) fields are described only as an "Ordered list of named, typed fields" — no explicit `order` integer property exists (unlike Tier 2's `FieldAssignment.order`), no Rust struct enforces field order at the boundary (reference implementation treats Tier 1 instances as raw JSON), and the only normative use of TypedRecord array order in the spec is for text-indexing segment emission, not identity. Treating "first field" as an identity fallback would rest on an ordering guarantee the spec does not make, so this RFC leaves Tier 1 label resolution to the existing implementation-heuristic fallback ([N+36] already covers this as the final fallback tier).

**Why [N+36] is SHOULD, not MUST.** The rule governs *label resolution behavior*, which is a client/implementation concern, not a data-shape conformance concern; [N+32]–[N+35] (the actual schema and validation rules) are the MUST-level normative core of this RFC. [N+36] gives implementers a normative anchor to build against without dictating internal representation (e.g. it does not name `ColumnSpec`, `record_label.rs`, or any other srs-rust-internal construct — those are implementation, not spec).

---

## Alternatives Considered

### Alt A — Reuse `DocumentSection.titleFieldId` directly for record labels

Rejected: scoped to a `DocumentView`, not visible at most label-producing call sites, and conflates document-title with field-identity (see Rationale).

### Alt B — Add `isIdentityField` to `FieldAssignmentOverride`

Express the identity pointer as a per-field override patch (`fieldAssignmentOverrides: [{ fieldId, isIdentityField: true }]`) rather than a top-level `Type` property. Rejected: identity is a single Type-wide fact ("which one field"), not a patch to one field's own attributes; expressing it as a per-field override would require every derived Type wanting to keep the inherited identity field to either omit an override entirely (ambiguous — does absence mean "no identity" or "inherit"?) or redeclare the override on every derived Type, defeating the inheritance requirement in [N+34].

### Alt C — First-field-as-identity fallback for Tier 1 TypedRecords

Rejected: TypedRecord field order is not declared semantically stable in the spec (see Rationale). Using it as an identity signal would be fragile and could silently produce wrong labels whenever a producer reorders fields for unrelated reasons.

---

## Open Questions

None — all questions raised in the original RFC comment thread (naming, inheritance mechanism, Tier 1 fallback, validation strictness, relationship to primary-column selection) were resolved by owner decision; see Rationale and Conformance Rules above for the resolutions.
