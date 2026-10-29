# `FieldView`

> A field reference within a View.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A field reference within a View. Controls presentation for this View without altering field semantics.

Example: the `FieldView` shape.

A Field hidden with `visible: false` remains in the Record and may appear in other Views. `visible` controls rendered text output only. A field with `visible: false` must still be included in any structured projection or export of this view. To exclude a field from both rendered output and structured projections, omit it from `fieldViews[]` entirely.

`labelMode` (amended by RFC-037 Rev 5) decides whether the field's row carries its label. `inline`, the default, is the labelled row the Default Rendering Baseline emits today. `none` emits the value alone, with no label and no separating colon. The two properties answer different questions and neither substitutes for the other: `visible: false` removes the field's value from rendered output, `labelMode: "none"` keeps the value and drops only its label. Both are rendering-only, under Invariant 13.
