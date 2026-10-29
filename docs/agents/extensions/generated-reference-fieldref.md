# Generated reference: `FieldRef`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/FieldRef>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c00003d-0000-4000-a000-00000000003d

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `field-ref` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | ref → `field` (id) | yes | — | core | References a Field by its stable id (reference mode closes the metacircular loop). |
| `typeId` | string | no | format: uuid | core | Stable UUID of the referenced Type. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/FieldRef>

**Compact pseudo-IDL**

```typescript
field-ref {
  fieldId: ref → `field` (id) // References a Field by its stable id (reference mode closes the metacircular loop).
  typeId?: string // Stable UUID of the referenced Type.
}
```
