# FieldView.displayLabel, FieldView.displayHint, and…

> FieldView.displayLabel, FieldView.displayHint, and…: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

**Number**: 13

`FieldView.displayLabel`, `FieldView.displayHint`, and `FieldView.editorHintOverride` are for rendering only. They must not affect AI guidance, extraction logic, `fieldType` interpretation, or validation. Extended by RFC-036 [CR-036-20] to cover `FieldView.compositeRenderer` and the `DocumentSection`/`Composition` composite renderer directives, and to add Relations and Discovery Text Projection (`ext:discovery`) to the list of things they must not affect. [CR-036-21] additionally constrains `editorHintOverride` to the value set of `Field.editorHint`. Amended by RFC-037 Rev 5 to cover `FieldView.labelMode`, which selects whether a field row carries its label and must not affect anything in this list.
