# JSON projection (RFC-041 Revision 4)

> The JSON projection (RFC-041 Revision 4) section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

`document-view-output.json`'s `ProjectedRecord` carries an optional `properties[]` array, sibling to its existing `relations[]` (RFC-027) and `fields`/`orderedFieldKeys` (FieldView rows). Each entry is a `ProjectedPropertyRow { property, label, value }`: `property` is the same closed enum value `RecordPropertyView.property` names; `label` and `value` are the *resolved* label and value per Change C — never the raw property name alone. `properties[]` is present only when the rendering section's View declares at least one `RecordPropertyView` row and the record has at least one surviving row, in ascending `order`, the same single axis FieldView and RecordPropertyView rows already share. Owner ruling (2026-09-01, verbatim): "Projections should ideally contain a full machine readable form so that they can enable transformations." — a projection missing content the rendered form carries cannot support the transformations that principle names as the reason projections exist.
