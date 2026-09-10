> **GitHub issue**: [the-greenman/srs#144](https://github.com/the-greenman/srs/issues/144)

# RFC-020: Type-Level Identity Field (`identityFieldId`)

**Status**: Accepted (Revision 7)
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
| 5 | 2026-07-09 | Accepted; spec records authored in `srs/srs/` — `ext:type-inheritance` extension prose (`records/extensions/ext-type-inheritance.json` and its duplicate source `records/subsections/07-5-ext-type-inheritance.json`) documents `identityFieldId` and Rules [N+32]–[N+36]; `ext:views-l2` subsection (`records/subsections/07-7-ext-views-l2.json`) documents the `titleFieldId` fallback and Rule [N+37]. `srs repo validate` unchanged at 2 pre-existing errors (manifest `container`/`createdAt`/`sourceDocumentIndex` migration debt, unrelated to this RFC — tracked separately, not introduced here). `docs/spec/srs-spec.md` re-rendered and confirmed deterministic across repeated local renders; `docs/spec/srs-unified.md`, `docs/spec/srs-rationale.md`, and `docs/spec/rfcs/rfc-catalog.md` were found to reorder across some repeated local renders with no source changes in between (filed as the-greenman/srs#147) and were initially left uncommitted pending investigation. |
| 6 | 2026-07-09 | CI's `Release Drift` check failed on Rev 5's push because the three reverted views (`srs-unified.md`, `srs-rationale.md`, `rfc-catalog.md`) also project the `ext:type-inheritance`/`ext:views-l2` content this RFC changed, so leaving them at their pre-RFC-020 snapshot made them stale relative to a fresh render — reverting them was the wrong fix. Re-rendered all three fresh, verified `check-release-drift.mjs` passes locally against that exact snapshot, and committed immediately without further re-renders in between (to avoid re-triggering the ordering instability from #147). CI's `Release Drift` check passed cleanly on this snapshot, run on a fully independent process (GitHub Actions), which weighs against the ordering instability being pure per-process randomness — #147 remains filed for further investigation of the mechanism. |
| 7 | 2026-09-10 | **Amendment (srs#728, Door 3 — this RFC's own surface).** Widened Rule [N+37]'s fallback trigger from "the section does not declare `titleFieldId`" to "the record's Type's effective field set does not contain the section's `titleFieldId`". Motivation: srs-rust is conformant with Rev 6's narrower rule today, yet a heterogeneous `contains` tree cannot be served by one section-wide `titleFieldId` — muDemocracy's problem-document corpus renders 130 records heading-less (srs-rust#1011) purely because their Type happens to lack the one field a sibling Type's section declared. No new mechanism: the amendment routes this case onto the identity fallback ([N+34]'s `effective_identity_field_id`, already implemented and tested at `srs-repository::package.rs:377-387`) that [N+37] already used for the titleFieldId-absent case — it now also covers titleFieldId-present-but-not-in-this-record's-effective-field-set. **Explicitly out of scope, unchanged:** srs PR #341's ruling — an authored `titleFieldId` that resolves to a field present in the effective field set but fails the eligibility test (cardinality/datatype/domain/format, [N+1]) still omits the heading with **no** identity fallback. This amendment widens only the *absent-from-the-effective-field-set* case; the *present-but-ineligible* case is untouched, and srs-rust's `n1_ineligible_title_field_id_omits_heading_without_identity_fallback` test remains valid. Schema change: `docs/schema/2.0/composition.json`'s `titleFieldId` description amended (the actual behavioral blocker). Investigated, not fixed: this RFC's own Rev-1 schema-changes table promised `identityFieldId` a `description` on `type.json` documenting [N+33]/[N+34]; it is still absent (only `title` is present). Adding it directly would silently diverge `type.json` from a full regenerate under RFC-040 Unit 3's byte-closure gate (srs#479) — the generator already carries this exact text for `identity_field_id`, deliberately unwritten pending srs-rust#868 (populating any `FieldAssignment.description` trips `additionalProperties:false` in the pinned binary's embedded schema). Left as tracked debt rather than hand-edited around the gate — see the Schema changes table below. Canonical records: `srs/records/tier-2/mechanism-6e22219b.json` (identityFieldId prose) and `srs/records/tier-2/mechanism-fe5a4dbf.json` (Heading Hierarchy / Rule [N+37] prose) updated; `docs/spec/**` re-rendered. Blast radius: zero change to spec projections — every `srs` Type declaring `identityFieldId` also carries its sections' `titleFieldId`, so the fallback is never reached in this repository's own corpus. |

---

## Charter alignment (Revision 7 amendment, srs#728)

**Stage 1.5 Charter Check, run before drafting this amendment** — per `.claude/commands/rfc.md`, verbatim below.

**Cell(s):** cell:identity

**Decision mode:** complicated

**Governing cell preference:** Identity — "identifier over label" (`rfc-decision-cce3c00e`, `rfc-decision-53635966`). This amendment aligns with it: it widens the condition under which a Type's declared *identifier* (`identityFieldId`) supplies a record's heading, in preference to relying solely on a section-authored, potentially non-matching field label (`titleFieldId`) that a heterogeneous `contains` tree cannot uniformly satisfy.

**Axis preference:** Axis 2–8 Identity↔Assertion — default pole Evolution over Continuity (phase-bound: precommitted to flip to Continuity only at the first full public release, `rfc-decision-2a1e1590`, `rfc-decision-53635966`). This amendment takes the default pole: it evolves an existing, already-Accepted rule's own surface (Door 3) rather than treating it as a frozen contract, which is legitimate pre-flip. No boundary-clause justification is needed since the default pole is what's being exercised.

**Decisions consulted:** `rfc-decision-cce3c00e` (Pattern Grid, cell/axis definitions), `rfc-decision-9ee14517` (layer rules, consume-don't-clone), `rfc-decision-0118e938` (one layer per construct / crossings), `rfc-decision-2a1e1590` (Evolution-over-Continuity ruling), `rfc-decision-53635966` (Tier-1 removal, same axis). Searched `docs/spec/rfcs/rfc-decision-log.md` and `records/tier-2/rfc-decision-*.json` for prior `titleFieldId`/`identityFieldId` rulings — none exist; this territory has no other decision record to conflict with.

**Contradictions found:** None. srs PR #341's ruling (ineligible authored `titleFieldId` omits with no fallback) is adjacent territory, not contradicted — this amendment explicitly carves it out (see Revision history row 7 and the new "Explicitly out of scope" note below); the two cases (field absent from the effective set vs. field present but ineligible) are disjoint by construction.

**One-way-per-goal:** No new mechanism. `Package::effective_identity_field_id` / `effective_fields` (`srs-repository/src/package.rs:377-387`, RFC-020 [N+34], five passing tests) already serve the goal of "resolve this record's display identity from its Type." [N+37] already consumed this primitive for the titleFieldId-absent case; this amendment widens [N+37]'s trigger condition to also consume it for the titleFieldId-present-but-not-in-this-record's-effective-field-set case. No parallel mechanism is introduced.

**Layer test:**
- Which layer owns this? The construct being amended (per-record heading emission, [N+37]) is EXPRESSION plane, presentation layer (Composition → Presentation → Projection, `rfc-decision-92d2da05`). It consumes `Type.identityFieldId`, a MEANING-plane (definitions layer) construct.
- Consume or clone downward? Consume — unchanged from Rev 6. The amendment only widens *when* the presentation layer reaches for the existing MEANING-plane primitive; it adds no new field, no new relation, and no re-implementation of `effective_identity_field_id`'s inheritance logic in the presentation layer.
- Does the layer below stand alone without this? Yes. `Type.identityFieldId` and its cascading-inheritance semantics ([N+32]–[N+35]) are fully specified and valid with zero presentation-layer consumers; this amendment changes only how the presentation layer's heading rule ([N+37]) makes use of what already exists below it.

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

**Revision 7 amendment (srs#728).** Rev 6's fallback trigger — "the section does not declare `titleFieldId`" — is narrower than the problem it was meant to solve. A `DocumentSection` renders a `contains`-tree that can be heterogeneous: sibling records under one section legitimately bind to different Types. A section author who declares `titleFieldId` for the Type most records under that section carry gets no fallback at all for a sibling record whose Type doesn't carry that field — the *section* declared a `titleFieldId`, so Rev 6's condition ("does not declare") is false, and the heading is omitted per the existing eligibility-omission path, even though the record's own Type has a perfectly good `identityFieldId`. Rule [N+37] is widened accordingly: the fallback triggers whenever the record's Type's *effective field set* does not contain the section's `titleFieldId` — whether because the section declares none at all (Rev 6's case, preserved) or because it declares one that this particular record's Type doesn't carry (the new case). `titleFieldId` still wins whenever it *does* resolve within the record's effective field set — this amendment does not touch that precedence.

**Explicitly out of scope (unchanged, srs PR #341).** A `titleFieldId` that *does* resolve to a field in the record's Type's effective field set, but that field fails the eligibility test ([N+1]: cardinality, datatype, value-domain, format), is a different case entirely — an authored declaration that turns out to be ineligible, not an absent one. PR #341 ruled that case omits the heading with no identity fallback, and this amendment leaves that ruling untouched: it widens only the *absent-from-the-effective-field-set* trigger, never the *present-but-ineligible* one. srs-rust's `n1_ineligible_title_field_id_omits_heading_without_identity_fallback` test continues to pin exactly that boundary.

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
> **[N+37]** For any `DocumentSection`/record pairing where the section's `titleFieldId` is absent, or is declared but does not resolve within the record's Type's effective field set (own `fields[]` plus, under `ext:type-inheritance`, inherited fields) — whether that section's field content renders via the Default Rendering Baseline (`renderViewId` absent) or a dispatched L1 View (`renderViewId` set) — implementations SHOULD render the per-record heading (Heading Hierarchy, level `3 + depthOffset`) using the value of the field named by the record's Type's effective `identityFieldId`, if present, in place of omitting the heading. When `DocumentSection.titleFieldId` resolves within the record's Type's effective field set, it MUST continue to take precedence over `identityFieldId` for that section's per-record heading. **(Amended Revision 7, srs#728 — widened from "the section does not declare `titleFieldId`" to the effective-field-set test above. Unchanged: a `titleFieldId` that resolves to a field present in the effective field set but fails the eligibility test in [N+1] MUST still omit the heading with no identity fallback — srs PR #341.)**

---

## Schema changes

| Schema file | Change |
|---|---|
| `type.json` | Add optional top-level `identityFieldId` property (`format: uuid`) to the `Type` definition. **Revision 7 (srs#728) — investigated, not fixed here.** This table promised a `description` on that property from Revision 1 onward; it was never added, and `identityFieldId` still carries only a `title`. The gap is real, but closing it here would mean hand-writing prose onto `type.json` that RFC-040 Unit 3's byte-closure gate (`scripts/check-schema-regenerate-drift.mjs`, srs#479) requires to also come out of a full regenerate from the `com.semanticops.srs/metamodel` package — and the generator (`scripts/gen-metamodel-package.mjs`) already carries this exact, byte-matched description text for `identity_field_id`, deliberately **not yet written** into the metamodel records or the seed, because doing so trips `additionalProperties:false` in the pinned `srs-rust` binary's embedded `FieldAssignment` schema (the parked gap `docs/schema/2.0/projection-rules.md`'s divergence register already documents for every other FieldAssignment, tracked at the srs-rust#868 follow-up). Forcing this one property through ahead of that follow-up would be exactly the kind of hand-edit-around-a-tool-gap the mimicry rule forbids. Left as tracked, pre-existing debt — un-parking is srs-rust#868's job, not this amendment's. |
| `composition.json` | **Revision 7 (srs#728).** `DocumentSection.titleFieldId`'s description amended: the sentence "When a record's type does not carry the designated field, implementations MUST omit the per-record heading for that record" is replaced with the widened [N+37] fallback (identity fallback when the field is absent from the effective field set; unchanged omit-with-no-fallback when the field is present but ineligible, per PR #341). This is the actual behavioral change srs#728 exists to make — Rule [N+37] below and this schema description must agree. |

Rule [N+37] (per-record heading fallback) is a change to normative *prose* in the spec-as-SRS-repo (`srs/srs/records/`, rendered to `docs/spec/srs-spec.md` — see "Default Rendering Baseline" / "Heading Hierarchy"), authored as spec records (Stage 6 of the RFC pipeline), not as a schema diff — except where the schema's own descriptive prose (`composition.json`, above) states the rule in scalar form and must be kept consistent with it.

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
