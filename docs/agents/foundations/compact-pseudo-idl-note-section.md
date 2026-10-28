# Compact pseudo-IDL

> The Compact pseudo-IDL: note-section section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
note-section {
  name: string // Machine-readable name within the namespace; snake_case.
  label?: string // Human-readable display label for this lifecycle state.
  content: string // Free text content.
  contentHint?: string // Rendering hint for a Note section's content. Default: text.
  tags?: string[] // Free-form classification tags.
}
```


## Generated reference: `Note`

**Referenced Type Id**: 4c000016-0000-4000-a000-000000000016

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `note` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `instanceId` | string | yes | format: uuid | core | Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage. |
| `title` | string | no | — | core | Human-readable title. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `sections` | ref → `note-section` (inline)[] | yes | — | core | Ordered list of named text sections (Tier 0 Note). |
| `sourceRefs` | ref → `source-reference` (inline)[] | no | — | core | References to source material this instance was derived from or attaches to (RFC-017/RFC-023). |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/note.json>
