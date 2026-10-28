# Generated reference: `TextSegment`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/TextSegment>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000040-0000-4000-a000-000000000040

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `text-segment` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | string | yes | — | core | UUID of the field definition for package-resolved fields; sentinel string for special segments: 'note-title', 'note-section', 'tag', 'label'. |
| `fieldName` | string | yes | — | core | Field name (snake_case) for package-resolved fields; sentinel string for special segments matching fieldId sentinels; or NoteSection.name for named special segments. |
| `text` | string | yes | — | core | The raw stored text value of a TextSegment. Normalization is applied at match time, not at segment construction time. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/TextSegment>

**Compact pseudo-IDL**

```typescript
text-segment {
  fieldId: string // UUID of the field definition for package-resolved fields; sentinel string for special segments: 'note-title', 'note-section', 'tag', 'label'.
  fieldName: string // Field name (snake_case) for package-resolved fields; sentinel string for special segments matching fieldId sentinels; or NoteSection.name for named special segments.
  text: string // The raw stored text value of a TextSegment. Normalization is applied at match time, not at segment construction time.
}
```
