# Compact pseudo-IDL

> The Compact pseudo-IDL: field-view section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
field-view {
  fieldId: ref → `field` (id) // References a Field by its stable id (reference mode closes the metacircular loop).
  order: integer // The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).
  required?: boolean // Whether this field must be populated before a Record can be logged.
  visible?: boolean // Default: true. Whether a FieldView/RecordPropertyView row is shown.
  labelMode?: string // RFC-037 Revision 5. FieldView.labelMode, presentation only (Invariant 13). 'inline' (the default) carries the row's resolved label; 'none' emits the value alone, with no label and no separating colon.
  displayLabel?: string // Context-specific label override for this field within this Type.
  displayHint?: string // Rendering-only hint text override for a single inherited FieldAssignment (presentation; stays per 6523cf5e).
  editorHintOverride?: string // Presentation only (RFC-036 [CR-036-20]/[CR-036-21]). Supersedes Field.editorHint for Records rendered/edited through this View.
  compositeRenderer?: ref → `composite-renderer-binding` (inline) // RFC-036 — render a FieldView's composite-range value through a named composite renderer.
}
```


## Generated reference: `RecordPropertyView`

**Referenced Type Id**: 4c00003b-0000-4000-a000-00000000003b

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `record-property-view` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `property` | string | yes | enum: "lifecycleState" \| "tags" \| "createdAt" \| "updatedAt" | core | Record-level property presented by a RecordPropertyView row. |
| `order` | integer | yes | minimum: 0 | core | The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015). |
| `displayLabel` | string | no | — | core | Context-specific label override for this field within this Type. |
| `visible` | boolean | no | — | core | Default: true. Whether a FieldView/RecordPropertyView row is shown. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json#/$defs/RecordPropertyView>
