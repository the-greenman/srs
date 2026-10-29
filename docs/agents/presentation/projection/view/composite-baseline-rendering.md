# Composite baseline rendering

> A composite-range Field that resolves to no renderer — unbound per [CR-036-6], or fallen back per

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A composite-range Field that resolves to no renderer — unbound per [CR-036-6], or fallen back per
[CR-036-7] or [CR-036-9] — is rendered by the **composite baseline**: a heading when a label resolves
(`FieldAssignment.displayLabel`, overridable by `FieldView.displayLabel`) at level `4 + d` shifted by
`Composition.depthOffset`, where `d` is nesting depth; then one block per value in value order; within
each block one field row per assignment on the composite's `rangeType`, ascending by
`FieldAssignment.order` with `fieldId` code-point order as tie-break. A field with no value, or whose
value renders to nothing, is omitted unconditionally. An assignment that is itself `ref`/`inline` expands
into a nested baseline block at depth `d + 1` rather than a field row. Field-row labels resolve by
`FieldAssignment.displayLabel` -> `Field.name` -> `fieldId`; templates resolve by
`ElementTemplates.compositeFieldRowTemplates[Field.name]` -> `ElementTemplates.fieldRow` -> the
implementation's existing top-level field-row form.
