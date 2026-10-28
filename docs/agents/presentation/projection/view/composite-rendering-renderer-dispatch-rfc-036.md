# Composite rendering — renderer dispatch (RFC-036)

> composite-range Field (fieldType.datatype: "ref", mode: "inline") to a named composite renderer.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

`FieldView` gains an optional `compositeRenderer`, a `CompositeRendererBinding` that dispatches a
composite-range Field (`fieldType.datatype: "ref"`, `mode: "inline"`) to a named composite renderer.
Presentation lives in the View, not in the Type: RFC-032 evicted `compositeRenderer` from the type model,
and RFC-015 established that an arrangement over records with many legitimate concurrent forms is
view-owned.

Example: the `CompositeRendererBinding` shape.
