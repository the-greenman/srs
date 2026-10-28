# Compact pseudo-IDL

> The Compact pseudo-IDL: record-property-view section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
record-property-view {
  property: string // Record-level property presented by a RecordPropertyView row.
  order: integer // The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).
  displayLabel?: string // Context-specific label override for this field within this Type.
  visible?: boolean // Default: true. Whether a FieldView/RecordPropertyView row is shown.
}
```


## Generated reference: `ExportConfig`

**Referenced Type Id**: 4c000025-0000-4000-a000-000000000025

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `export-config` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `format` | string | no | — | core | Target output format. Portable values: markdown, adoc, html, text. |
| `preamble` | string | no | — | core | Template string rendered before field values. |
| `omitEmptyFields` | boolean | no | — | core | Default: false. When true, fields with no value are omitted from output. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/composition.json#/$defs/ExportConfig>
