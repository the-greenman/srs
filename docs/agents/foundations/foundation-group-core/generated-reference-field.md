# Generated reference: `Field`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/field.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000001-0000-4000-a000-000000000001

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `field` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `instructions` | string | no | — | core | Fuller guidance for a human completing this field. |
| `aiGuidance` | ref → `ai-guidance` (inline) | yes | — | core | Inline LLM guidance for extracting/populating this field or type. |
| `fieldType` | ref → `field-type` (inline) | yes | — | core | The decomposed value type (RFC-032): datatype x cardinality x value-domain x format x constraints. |
| `editorHint` | string | no | enum: "singleline" \| "textarea" \| "rich-text" \| "date-picker" \| "dropdown" \| "multi-select" \| "voice" | core | Presentation only (not part of the type model — RFC-032). Suggested UI control; implementations and Views may override. Consolidated by the rendering follow-up #262. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `lineage` | ref → `lineage` (inline) | no | — | core | Fork/copy history of this definition. |
| `provenance` | ref → `provenance` (inline) | no | — | core | Import provenance of this definition. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/field.json>

**Compact pseudo-IDL**

```typescript
field {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  instructions?: string // Fuller guidance for a human completing this field.
  aiGuidance: ref → `ai-guidance` (inline) // Inline LLM guidance for extracting/populating this field or type.
  fieldType: ref → `field-type` (inline) // The decomposed value type (RFC-032): datatype x cardinality x value-domain x format x constraints.
  editorHint?: string // Presentation only (not part of the type model — RFC-032). Suggested UI control; implementations and Views may override. Consolidated by the rendering follow-up #262.
  tags?: string[] // Free-form classification tags.
  lineage?: ref → `lineage` (inline) // Fork/copy history of this definition.
  provenance?: ref → `provenance` (inline) // Import provenance of this definition.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```
