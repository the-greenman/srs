# Conformance Rules (RFC-041)

> [R1] A View's row list (fieldViews[]) admits two mutually exclusive row kinds discriminated by the presence of fieldId (FieldView) XOR property (RecordPropertyView); a row item carrying neither key, …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

**[R1]** A View's row list (`fieldViews[]`) admits two mutually exclusive row kinds discriminated by the presence of `fieldId` (`FieldView`) XOR `property` (`RecordPropertyView`); a row item carrying neither key, or both, MUST be rejected as invalid.

**[R2]** `RecordPropertyView.property` MUST be a value in the closed, generated enum. An implementation encountering an unrecognized value MUST reject it as a validation diagnostic; it MUST NOT silently accept or ignore it.

**[R3]** Implementations rendering `RecordPropertyView` rows MUST NOT special-case any property name outside the mechanism defined above. The per-property default-label table and value-resolution rule above are the full extent of per-property variation; no boolean flag and no property-specific schema property may be added to `DocumentSection`, `FieldView`, or `View` for any record-level property.

**[R4]** A `RecordPropertyView` row whose named property is absent or empty on the Record being rendered MUST be omitted from render output; this MUST NOT be treated as a validation failure of either the Record or the View.

**[R5]** The `RecordPropertyView.property` enum in `view.json` MUST be regenerated — never hand-edited — whenever `record.json`'s set of top-level properties, with the exclusions above, changes. `validate-all.mjs` MUST run the derivation's `--check` guard.

**[R6]** `lifecycleState` row-value resolution MUST use the bound Lifecycle's `LifecycleState.label` when the Record's Type carries a `lifecycleRef` and the state key resolves against it; otherwise the raw state key renders verbatim. No other humanization applies.

**[R7]** Every `order` value in a View's mixed `fieldViews[]` row list MUST be unique. A duplicate is a validation error. Implementations MUST render rows in ascending `order`, yielding one deterministic total presentation sequence across FieldView and RecordPropertyView rows.

**[R8]** *(Revision 4.)* A `RecordPropertyView` row that is not omitted per [R4] MUST appear in the JSON projection (`document-view-output.json`) of any Composition that renders it, as a `ProjectedPropertyRow` (`{ property, label, value }`, Change D) on the record's `properties[]` array, in ascending `order`. `label` and `value` MUST be the *resolved* label and value — the same ones Change C renders into markup, not the raw `property` name alone. An implementation that renders a `RecordPropertyView` row in markup output MUST NOT omit its `ProjectedPropertyRow` from the JSON projection of the same render.
