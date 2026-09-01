# RFC-041: RecordPropertyView — a row kind for record-level properties in views

**Status**: Accepted (Revision 4)
**Affects**: `ext:views-l1` (`view.json` — the `FieldView` row model), `ext:views-l2` (`document-view-output.json` — the JSON projection now carries property rows, Revision 4)
**Builds on**: RFC-015 (view-owned presentation), RFC-027 (`relationsPresentation` — sibling per-class precedent), RFC-037 (field-row rendering baseline, reused for value rendering), `rfc-decision-2a1e1590` (state carve-out), `rfc-decision-c8704763` (reference-taxonomy enum-derivation precedent)
**Author**: design dialogue draft (from srs-rust#889)
**Date**: 2026-08-29

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-08-29 | Initial draft |
| 2 | 2026-08-30 | Accepted. The design previously approved in PR #514 is enacted without design changes: the schema widening and deterministic record-property enum derivation land as specified. |
| 3 | 2026-08-31 | [R7] unique row order added; `ExportConfig.fieldOrder` retired — `View.fieldViews[].order` is the sole presentation/export ordering. |
| 4 | 2026-09-01 | Door 3 revision (srs#365, srs#272, srs#512). [R8] added: RecordPropertyView rows MUST appear in the `document-view-output.json` JSON projection, carrying their resolved label and value, on the same terms as they render in markup. Closes the gap srs#365's review found — the exclusion had stood only as an inline `srs-rust` code comment, an implementation deciding spec law. Owner ruling (2026-09-01, verbatim): "Projections should ideally contain a full machine readable form so that they can enable transformations." |

---

## Charter alignment

**Cell(s):** cell:description, cell:reference
**Decision mode:** complicated

**Governing cell preference:** Description — "one name over many": this RFC is the one mechanism for any record-level property row, not a per-property special case; aligned. Reference — "declared strength over convenient reach" (`rfc-decision-c8704763`): the `property` value domain is a declared, generated reference into the record metamodel, never a hand-maintained convenience list; aligned.
**Axis preference:** 3–9 Description↔Governance — default pole, Shared Coherence over Local Autonomy. 1–7 Versioning↔Reference — default pole, Semantic Integrity over Practical Expression. No non-default pole taken; no boundary clause invoked.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-c8704763, rfc-decision-2a1e1590, rfc-decision-7caca3a1.
**Contradictions found:** None. Checked specifically against rfc-decision-2a1e1590 (this RFC renders the existing mutable lifecycleState value; it does not make state a Field or touch the Lifecycle machinery) and against RFC-015 (this RFC is presentation-only, view-owned, same layer as FieldView and RFC-027's relationsPresentation).

**One-way-per-goal:** No existing mechanism addresses a record-level property (lifecycleState, tags, createdAt, updatedAt) from a view row. `FieldView` addresses only `fieldId` (a value inside `fieldValues`); RFC-027's `relationsPresentation` addresses only Relations. The FieldView-widening alternative (`fieldId | property` on `FieldView` itself) is named and rejected here: it would blur Field semantics exactly where rfc-decision-2a1e1590 drew the line (lifecycleState is deliberately not a Field). This RFC fills the gap with a sibling row kind living in the SAME row list as FieldView — not a second, independently-ordered array — so the fix does not itself introduce a second ordering mechanism for one presentation sequence.

**Layer test:**
- Which layer owns this? EXPRESSION plane, presentation layer (`ext:views-l1`) — the same stack position as `FieldView`, RFC-036's `compositeRenderer`, and RFC-027's `relationsPresentation`.
- Consume or clone downward? Consume — reads record.json's already-declared top-level properties through a stated derivation rule; does not redefine their semantics or touch `ext:lifecycle`'s state machine.
- Does the layer below stand alone without this? Yes — record.json, ext:lifecycle, and Record.tags/createdAt/updatedAt are fully meaningful with no View ever declaring a RecordPropertyView row.

---

## Abstract

Adds `RecordPropertyView` as a second row kind in `ext:views-l1`'s row list (`View.fieldViews[]`), sibling to `FieldView` and shaped identically except that it carries `property` in place of `fieldId`. This closes srs-rust#889: since `rfc_status` retired to the `spec-rfc-process` Lifecycle (srs#447/PR #507), `lifecycleState` — a top-level sibling of `fieldValues` in every Record, never a Field — has had no addressing mechanism anywhere in the view model, so the rendered `rfc-catalog`/`decision-log`'s Status lines silently disappeared for all 70 migrated records. `RecordPropertyView.property`'s value domain is a closed, generated enum derived from record.json's own declared top-level properties — never hand-listed — mirroring the derivation already ruled for `definitionType` (rfc-decision-c8704763 item 4, RFC-040 Change H.4), so the resultant view.json schema is always closed and internally consistent.

---

## Motivation

### Problem 1 — FieldView cannot address a record-level property

`view.json`'s `FieldView` requires `fieldId` (`format: uuid`), described as "Must reference a valid Field.id in the effective package set." `record.json` declares `lifecycleState` as a top-level property of the Record envelope, a sibling of `fieldValues`, not a key inside it:

```json
"lifecycleState": {
  "type": "string",
  "description": "ext:lifecycle — current lifecycle state of this Record."
}
```

`lifecycleState` therefore has no `fieldId` and cannot be named by `FieldView`. The next-closest existing hook, `DocumentSection.titleFieldId` (`ext:views-l2`), is Field-shaped too — a `fieldId` UUID, eligibility-gated by Rule [N+1] — and cannot reach `lifecycleState` for the same reason. The `{{status}}` template variable already present in `ExportConfig.preamble` is not a spec mechanism either: it is an implementation convention (`srs-rust`'s `render_service.rs`) that looks up a Field literally *named* `status`, predates `ext:lifecycle`, and would not help the `rfc`/`rfc-decision` types regardless — their retired Field was `rfc_status`, now deleted.

Consequence: since PR #507 landed, `docs/spec/rfcs/rfc-catalog.md` and `rfc-decision-log.md` render with no Status/Decision Status line for any of the 70 migrated records, and the spec has no sanctioned way to restore one. RFC-027 already established the pattern for this class of gap — Relations are not Fields either, and `relationsPresentation` gave them a dedicated declarative construct rather than stretching `FieldView` to cover them — but nothing analogous exists yet for record-level scalar/array properties.

### Problem 2 — the gap is general, not lifecycle-specific

`tags`, `createdAt`, and `updatedAt` sit in exactly the same position as `lifecycleState`: top-level Record properties outside `fieldValues`, addressable by nothing. A fix scoped to `lifecycleState` alone (a `DocumentSection.showLifecycleState: boolean`, the originally-filed ask) would resolve today's symptom and reproduce the identical wall the moment a view needs to show `tags` or `createdAt` in a field-row — a second boolean, then a third, one per property, each a parallel mechanism doing what a single general row kind already would. The fix must name the general class ("a record-level property, addressed by name") once.

---

## Proposed Changes

### Change A — `RecordPropertyView`, a sibling row kind in the same row list as `FieldView`

`View.fieldViews[]` (`ext:views-l1`) is retyped from `FieldView[]` to an array whose items are `FieldView` **or** `RecordPropertyView`, discriminated the same way any two shapes in one JSON array are: by which of two mutually exclusive required keys the item carries — `fieldId` for a `FieldView`, `property` for a `RecordPropertyView`. The property name `fieldViews` does not change; renaming it would break every existing View record for no behavioral gain, and the array's label is legacy naming, not a semantic claim about its contents.

**`RecordPropertyView`** (new `$defs` entry, `view.json`):

| Property | Type | Required | Meaning |
|---|---|---|---|
| `property` | enum (closed, see Change B) | yes | Which record-level property this row presents. |
| `order` | integer, `minimum: 0` | yes | Display order — the same axis `FieldView.order` uses, in the same array. |
| `displayLabel` | string | no | Overrides the per-property default label (Change C). |
| `visible` | boolean | no | Default `true`, same semantics as `FieldView.visible`. |

Deliberately absent: `required` (workflow-required-ness — a record-level property is never a Field a Type can require), `editorHintOverride` and `compositeRenderer` (Field-editing/composite-dispatch concerns with nothing corresponding for a property with no Field behind it). Consequence: a `RecordPropertyView` row can never be marked workflow-required and never dispatches to a composite renderer; extending either is a new RFC's job, not a silent widening of this one.

**Consequence of the single-list design.** Because both row kinds share one `order` axis, a view author can interleave them freely — e.g. Title (FieldView, order 0), Status (RecordPropertyView, order 1), Description (FieldView, order 2) — in one coherent presentation sequence. A second, separately-ordered array (the shape srs-rust#889's own Option A sketch used, `recordPropertyViews[]`) cannot express that interleaving without inventing a cross-array precedence rule; folding the row into the same list avoids inventing that second rule. Every existing View record parses identically before and after this change (100% of the corpus uses only `fieldId` rows today).

### Change B — the property vocabulary is a closed, DERIVED enum — never hand-listed

`RecordPropertyView.property`'s legal values are exactly record.json's own top-level properties, minus:

- `$schema`, `instanceId`, `typeId`, `typeVersion`, `typeNamespace`, `typeName` — identity/type-binding, PINNED references (rfc-decision-c8704763's taxonomy), not "properties" of the record's content.
- `fieldValues`, `fieldMeta` — carriers, not properties themselves.
- `meta` — an open, implementation-local escape bag with no fixed shape; excluded on the same one-way-per-goal grounds that keep it out of the Field/Type layer.

What remains today, and what this RFC's v1 closed enum contains: **`lifecycleState`, `tags`, `createdAt`, `updatedAt`**. (`sourceRefs` is also a top-level Record property outside `fieldValues`, but it is an array of composite `SourceReference` objects with no field-row form defined anywhere in the spec — RFC-037 defines scalar and multi-entry-of-scalars forms only. It is deliberately excluded from the v1 enum; see Open Questions.)

**Derivation rule (normative).** The enum above is not authored freehand: it is the output of applying the exclusion rule stated in this Change to record.json's declared top-level properties, and it MUST be regenerated whenever that property set changes — never hand-edited independently. This is the same discipline already ruled for `package-bundle.json`'s `definitionType` enum (rfc-decision-c8704763 item 4 / RFC-040 Change H.4, implemented as `scripts/gen-package-bundle-definition-type.mjs --check`): one generator is the single source of truth, so the two lists (record.json's declared properties, and view.json's enum) cannot independently diverge. Honest gap, stated explicitly: `view.json` remains today's hand-authored, frozen schema (generating it from the self-hosted metamodel is `#272`'s scope, not this RFC's) — so this RFC's schema edit at acceptance hand-writes the current, correct derivation output as the literal enum, and separately lands the generator plus its `--check` guard in `validate-all.mjs`, so from that point on the two lists cannot re-diverge even though the schema itself is not yet generated. `#272`, when it lands, subsumes this generator the same way it will subsume `field.json`/`type.json`'s hand-authored form.

**Closed from day one.** The enum is closed (`enum: [...]`, not an open string), so an unrecognized `property` value is a schema validation error immediately — the honest gap above concerns how the enum is *kept in sync*, not whether it is closed.

### Change C — Rendering semantics

For each `RecordPropertyView` row, interleaved with `FieldView` rows strictly by `order`:

- **Row label.** `displayLabel` if set; else a per-property default: `lifecycleState` → "Status", `tags` → "Tags", `createdAt` → "Created", `updatedAt` → "Updated". This is a fixed default-label table inside one general mechanism (comparable to RFC-027's per-relation-type default labels drawn from `RelationTypeDefinition.label`) — not per-instance special-casing: the *mechanism* (resolve label, resolve value, emit the RFC-037 field-row form) is identical for every property; only the default-label *table entry* varies per property, exactly as RFC-027's labels vary per relation type without being a second mechanism.
- **Value — `lifecycleState`.** If the Record's Type carries a `lifecycleRef`, resolve the raw state key against that Lifecycle's `LifecycleState.label` for the matching key (first match); if no match or no `lifecycleRef`, render the raw state key verbatim. No further humanization. If the property is absent (no `lifecycleRef` bound, or value unset), the row is omitted.
- **Value — `tags`.** Render `Record.tags[]` using RFC-037 Change B's existing multi-entry field-row form — already normative, no new rule needed. Empty or absent `tags` omits the row.
- **Value — `createdAt` / `updatedAt`.** Render the raw ISO-8601 string via RFC-037 Change A's scalar field-row form, verbatim — no date formatting or localization, consistent with the baseline's existing "no markup/format conversion" restraint for field values.
- **Omission, not failure.** A `RecordPropertyView` row for an absent or empty property value is silently omitted from render output — never a validation failure of the Record or the View, matching `titleFieldId`'s [N+1] and RFC-027's rule-6 "omit, not fail" precedent.

### Change D — *(Revision 4)* Property rows are part of the JSON projection, not just rendered markup

**Projection-completeness principle.** Owner ruling (2026-09-01, verbatim): "Projections should ideally contain a full machine readable form so that they can enable transformations." A `RecordPropertyView` row is real record content, selected and ordered by a View exactly like a `FieldView` row (Change A); a reader of `document-view-output.json` — the machine-readable surface a report generator, chart tool, or static-site generator consumes — has no way to recover a Status/Tags/Created/Updated value that only ever reaches rendered markup. srs#365's review found this gap was papered over by an inline `srs-rust` code comment asserting "RecordPropertyView rows have no JSON-projection field form... and are excluded here" — an implementation deciding spec law that this Revision settles instead as a normative rule.

`ProjectedRecord` (the per-record shape in `document-view-output.json`, `ext:views-l2`) gains an optional `properties[]` array, sibling to its existing `relations[]` (RFC-027) and `fields`/`orderedFieldKeys` (FieldView rows). Each entry is a `ProjectedPropertyRow`:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `property` | enum (Change B's closed vocabulary) | yes | Which record-level property this row presents — the same value `RecordPropertyView.property` names. |
| `label` | string | yes | The row's *resolved* display label per Change C (`displayLabel` override, else the per-property default). |
| `value` | string, or array of strings for `tags` | yes | The row's *resolved* value per Change C — `lifecycleState` resolved through the bound Lifecycle's label when [R6] applies, otherwise the raw values Change C already defines. |

`properties[]` is present on a `ProjectedRecord` only when the rendering section's View declares at least one `RecordPropertyView` row and the record has at least one surviving (non-omitted, [R4]) row; entries appear in ascending `order` ([R7]), the same single axis `FieldView` and `RecordPropertyView` rows already share — no second ordering is introduced. A property omitted per [R4] is simply absent from `properties[]`, the JSON-side mirror of its omission from rendered markup.

---

## Conformance Rules

> **[R1]** A View's row list (`fieldViews[]`) admits two mutually exclusive row kinds discriminated by the presence of `fieldId` (`FieldView`) XOR `property` (`RecordPropertyView`); a row item carrying neither key, or both, MUST be rejected as invalid.
>
> **[R2]** `RecordPropertyView.property` MUST be a value in the closed, generated enum (Change B). An implementation encountering an unrecognized value MUST reject it as a validation diagnostic; it MUST NOT silently accept or ignore it.
>
> **[R3]** Implementations rendering `RecordPropertyView` rows MUST NOT special-case any property name outside the mechanism defined in Change C. The per-property default-label table and value-resolution rule in Change C are the full extent of per-property variation; no boolean flag and no property-specific schema property may be added to `DocumentSection`, `FieldView`, or `View` for any record-level property.
>
> **[R4]** A `RecordPropertyView` row whose named property is absent or empty on the Record being rendered MUST be omitted from render output; this MUST NOT be treated as a validation failure of either the Record or the View.
>
> **[R5]** The `RecordPropertyView.property` enum in `view.json` MUST be regenerated — never hand-edited — whenever record.json's set of top-level properties (excluding the identity/type-binding and carrier properties named in Change B) changes. From the point this RFC's Change B lands, `validate-all.mjs` MUST run the derivation's `--check` guard.
>
> **[R6]** `lifecycleState` row-value resolution MUST use the bound Lifecycle's `LifecycleState.label` when the Record's Type carries a `lifecycleRef` and the state key resolves against it; otherwise the raw state key renders verbatim. No other humanization applies.
>
> **[R7]** Every `order` value in a View's mixed `fieldViews[]` row list MUST be unique. A duplicate is a validation error. Implementations MUST render rows in ascending `order`, yielding one deterministic total presentation sequence across FieldView and RecordPropertyView rows.
>
> **[R8]** *(Revision 4.)* A `RecordPropertyView` row that is not omitted per [R4] MUST appear in the JSON projection (`document-view-output.json`) of any DocumentView that renders it, as a `ProjectedPropertyRow` (`{ property, label, value }`, Change D) on the record's `properties[]` array, in ascending `order`. `label` and `value` MUST be the *resolved* label and value — the same ones Change C renders into markup, not the raw `property` name alone. An implementation that renders a `RecordPropertyView` row in markup output MUST NOT omit its `ProjectedPropertyRow` from the JSON projection of the same render.

**Revision 4.** [R8] closes the gap srs#365's review found: the JSON projection excluded property rows on the authority of an inline `srs-rust` implementation comment, not a spec rule — Door 3 folds the missing rule into this RFC's own surface rather than leaving an implementation detail stand in for one. This follows directly from the projection-completeness principle stated in Change D: a projection that is missing content the rendered form carries cannot support the transformations the owner ruling names as the reason projections exist.

**Revision 3.** [R7] retires `ExportConfig.fieldOrder`: with a single mixed row list already carrying one shared, unique `order` axis (Change A, [R1]), a second export-only ordering field on `ExportConfig` was a parallel mechanism for the same goal — one-way-per-goal requires collapsing it. `View.fieldViews[].order` is now the sole presentation and export ordering; `ExportConfig` retains `format`, `preamble`, and `omitEmptyFields` only. Zero corpus usage of `fieldOrder` at retirement.

---

## Schema changes

| Schema file | Change |
|---|---|
| `view.json` | `View.fieldViews[]` items become `oneOf: [FieldView, RecordPropertyView]`; add new `$defs.RecordPropertyView` (`property` enum, `order`, `displayLabel?`, `visible?`) per Change A/B. |
| `view.json` | *(Revision 3)* `ExportConfig.fieldOrder` (`UUID[]`, explicit export field ordering) removed. `View.fieldViews[].order` is the sole presentation/export ordering ([R7]); `ExportConfig` retains `format`, `preamble`, `omitEmptyFields`. `[R1]`'s uniqueness-by-property constraint ([R7]) cannot be expressed in JSON Schema (`uniqueItems` compares whole objects) and is enforced by `scripts/validate-package.mjs` at package-validation time. |
| `document-view-output.json` | *(Revision 4)* `ProjectedRecord` gains an optional `properties` array of a new `$defs.ProjectedPropertyRow` (`property` enum, `label`, `value`) per Change D/[R8]. `additionalProperties: false` stays intact — `properties` is declared, not merely tolerated. |

`document-view.json` needs no edit — `DocumentSection.renderViewId` already dispatches to a View's `fieldViews[]`, so the new row kind flows through the existing consumption path unchanged. `record.json` needs no edit — its properties are read by the derivation rule, never altered.

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via the release artifact + `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (same release pipeline)

---

## Rationale

The gap srs-rust#889 diagnosed is structural, not cosmetic: `FieldView` only ever addressed `fieldId`, and `lifecycleState` was deliberately made not-a-Field by `rfc-decision-2a1e1590` (state is mutable; Fields are versioned semantic content). Those two facts together mean no existing mechanism could ever have reached `lifecycleState` without either re-Fielding it (reversing a settled ruling) or inventing a per-property special case (reproducing the drift one-way-per-goal exists to prevent). A sibling row kind — the same shape RFC-027 already used for Relations, the third class of record content after Fields and Relations — fills the gap once, generally, for every present and future record-level property, and folds into the *same* ordering list FieldView already uses rather than opening a second one. The property vocabulary's derivation rule is not new invention either: it is the identical discipline `rfc-decision-c8704763` already ruled for `definitionType`, applied to a second enum with the identical shape of problem (a hand-listed vocabulary that must track a single upstream source of truth).

**Revision 4.** Whether a `RecordPropertyView` row belongs in the JSON projection is a normative question about what the projection is *for* — precisely the class of question a spec rule answers and a code comment cannot, however reasonable the comment's author was in the moment. Once Change A already committed to one row list, one ordering axis, and one rendering mechanism for FieldView and RecordPropertyView rows alike, excluding RecordPropertyView rows from the JSON projection while including FieldView rows and RFC-027's relations would have been the exact per-kind special-casing [R3] already forbids for markup rendering — just relocated to the projection surface instead of settled there too.

---

## Alternatives Considered

### Alt A — a separate `recordPropertyViews[]` top-level array (srs-rust#889's own Option A sketch)

Rejected: this introduces a second ordering axis for one presentation sequence — the very shape one-way-per-goal warns against. The two arrays' relative interleaving would be undefined; expressing "Status right after Title" would require an additional cross-array precedence rule this RFC would then also have to invent. Folding the row into the existing `fieldViews[]` list avoids the problem instead of solving it.

### Alt B — `DocumentSection.showLifecycleState: boolean` (srs-rust#889's originally-filed ask, its Option B)

Rejected per the owner's constraint 3: this special-cases exactly one property by name. The moment a view needs the same treatment for `tags` or `createdAt`, it needs its own boolean — the parallel-mechanism drift the Charter Check's one-way-per-goal question exists to catch before it starts.

### Alt C — widen `FieldView` to accept `fieldId | property`

Rejected per the owner's constraint 4 and `rfc-decision-2a1e1590`. `lifecycleState` is deliberately not a Field — it is mutable state on a defined machine, not versioned semantic content. A `FieldView` that accepts either `fieldId` or `property` blurs that distinction at the exact seam the spec worked to keep sharp, and every `FieldView` consumer would have to branch on which key is present anyway — no simpler than a sibling row kind, while corrupting what "Field" means.

---

## Open Questions

1. `sourceRefs` is also a top-level Record property outside `fieldValues`, but it is an array of composite `SourceReference` objects, not scalars — no field-row form for a composite-object array exists anywhere in the spec today (RFC-037 covers scalar and multi-entry-of-scalars only). This RFC deliberately excludes `sourceRefs` from its v1 closed enum rather than inventing an ad hoc row form for it. Whether and how to address it is left to a future RFC once composite-array field-row rendering has an answer (plausibly riding on RFC-036's composite-renderer dispatch). Not resolved here, and does not block accepting this RFC as scoped.
