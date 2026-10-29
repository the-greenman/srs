# Generated reference: `RecordPropertyView`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json#/$defs/RecordPropertyView>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

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

**Compact pseudo-IDL**

```typescript
record-property-view {
  property: string // Record-level property presented by a RecordPropertyView row.
  order: integer // The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).
  displayLabel?: string // Context-specific label override for this field within this Type.
  visible?: boolean // Default: true. Whether a FieldView/RecordPropertyView row is shown.
}
```
