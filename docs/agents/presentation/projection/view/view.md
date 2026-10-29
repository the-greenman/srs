# `View`

> A versioned presentation and export configuration over a field set.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A versioned presentation and export configuration over a field set. A View is compatible with any Record containing its required fields.

Example: the `View` shape.

**Note (2026-08-22, `rfc-decision-4f1e12e5` entry 5)**: the View-root `protection` enum (`none`/`read-only`/`fill-in`) previously specified here is removed under the dormancy rule (`rfc-decision-cce3c00e`) — zero use, and it was a hint without a contract: no enforcement semantics were defined anywhere. `FieldView.required` below is untouched — it is attested in production use and is a distinct form-vs-validity mechanism. Return trigger: a real authoring surface needing edit protection, which must design the missing enforcement half.

Compatibility is field-centric:
- A Record is renderable through a View when it contains all `FieldView` entries with `required: true`.
- Fields with `visible: true` but not required are rendered when present and omitted when absent.
- Omitted Fields in `fieldViews[]` are treated as `visible: false`.

A View may not reference unknown Fields: every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set.

`View.protection` applies only to interactions through that View. A Record may be editable through one View and read-only through another. For record-level settlement, use `ext:lifecycle` states such as `isFinal`.

Facilitation steps have been removed from View. Use `ext:protocol` Protocol stages instead.
