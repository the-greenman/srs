# `RecordPropertyView` (RFC-041)

> A sibling row kind to FieldView in the same View.fieldViews[] list.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A sibling row kind to `FieldView` in the same `View.fieldViews[]` list. It presents a top-level Record property without treating that property as a Field.

Example: the `RecordPropertyView` shape.

The `property` enum is closed and generated from `record.json`'s declared top-level properties after excluding identity/type-binding properties (`$schema`, `instanceId`, `typeId`, `typeVersion`, `typeNamespace`, `typeName`), carriers (`fieldValues`, `fieldMeta`), the open `meta` bag, and `sourceRefs` (deferred because no composite-object-array field-row form is defined). `required`, `editorHintOverride`, and `compositeRenderer` do not apply to this row kind.

Rows of both kinds are interleaved by their shared, unique `order`. `View.fieldViews[].order` is the sole presentation and export ordering mechanism: `ExportConfig` cannot reorder rows. Labels resolve from `displayLabel`, then default to `Status`, `Tags`, `Created`, or `Updated`. `lifecycleState` resolves through the bound Lifecycle state's label when possible and otherwise renders the raw key. Tags use the RFC-037 multi-entry form; timestamps render as raw ISO-8601 strings. An absent or empty value omits the row without invalidating the Record or View.
