# Generated reference: `ExpectedSegments`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ExpectedSegments>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000041-0000-4000-a000-000000000041

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `expected-segments` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `instanceId` | string | yes | format: uuid | core | Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage. |
| `fieldName` | string | yes | — | core | Field name (snake_case) for package-resolved fields; sentinel string for special segments matching fieldId sentinels; or NoteSection.name for named special segments. |
| `segments` | string[] | yes | — | core | The exact ordered list of TextSegment.text values expected for one field of one instance (ExpectedSegments). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ExpectedSegments>

**Compact pseudo-IDL**

```typescript
expected-segments {
  instanceId: string // Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage.
  fieldName: string // Field name (snake_case) for package-resolved fields; sentinel string for special segments matching fieldId sentinels; or NoteSection.name for named special segments.
  segments: string[] // The exact ordered list of TextSegment.text values expected for one field of one instance (ExpectedSegments).
}
```
