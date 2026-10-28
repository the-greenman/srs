# Default Rendering Baseline

> When DocumentSection.renderViewId is absent, implementations MUST render each instance using the following baseline.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

When `DocumentSection.renderViewId` is absent, implementations MUST render each instance using the following baseline. No L1 View influences this path.

**Step 1 — Field ordering.** Order fields ascending by `FieldAssignment.order`. With `ext:type-inheritance`, use `fieldOrder` from the Type if declared; otherwise use `FieldAssignment.order`.

**Step 2 — Resolve values.** A field is present if its `Field.name` key is present in `fieldValues` with a value that is not the empty string; a `cardinality: list` value is present when at least one entry survives Step 2 (RFC-039 [R5]/[R5a], canonical I-132 — structural presence and rendering presence remain distinct).

**Step 3 — Labels.** Use `FieldAssignment.displayLabel`; fall back to `Field.name`.

**Step 4 — Render.** Render only present fields. A field that Step 2 resolves as absent — including one whose `FieldValue.value` is an empty string — MUST NOT emit a row, and neither MUST a field whose value sequence has no surviving entries. Implementations MUST NOT emit a label with an empty value. The sole exception is `DocumentSection.emptyBehavior` `"show-placeholder"` with the field `required: true`, which MUST emit a row whose value position carries the literal placeholder `(empty)`. Multi-entry values render as a block list, never comma-joined. The emitted form of a field row, and the separation between consecutive rows, is normative per output format — see *Normative Field-Row Form* below (RFC-037).

The baseline is a floor, not a ceiling. An L1 View via `renderViewId` always takes precedence.

`emptyBehavior` in the L1 View path: when `renderViewId` is set, empty field handling is governed by `ExportConfig.omitEmptyFields` on the referenced L1 View. `DocumentSection.emptyBehavior` does not apply in the L1 View rendering path.
