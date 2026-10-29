# Generated reference: `NoteSection`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/note.json#/$defs/NoteSection>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000015-0000-4000-a000-000000000015

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `note-section` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `label` | string | no | — | core | Human-readable display label for this lifecycle state. |
| `content` | string | yes | — | core | Free text content. |
| `contentHint` | string | no | enum: "text" \| "markdown" \| "plain" | core | Rendering hint for a Note section's content. Default: text. |
| `tags` | string[] | no | — | core | Free-form classification tags. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/note.json#/$defs/NoteSection>

**Compact pseudo-IDL**

```typescript
note-section {
  name: string // Machine-readable name within the namespace; snake_case.
  label?: string // Human-readable display label for this lifecycle state.
  content: string // Free text content.
  contentHint?: string // Rendering hint for a Note section's content. Default: text.
  tags?: string[] // Free-form classification tags.
}
```
