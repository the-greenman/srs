# Generated reference: `View`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c00003c-0000-4000-a000-00000000003c

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `view` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `compatibleTypes` | string[] | no | — | core | Optional Type-key hints (namespace/name) a View was designed for. Informational only. |
| `exportConfig` | ref → `export-config` (inline) | no | — | core | The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points). |
| `aiGuidance` | ref → `view-ai-guidance` (inline) | no | — | core | Guidance for AI agents using a View (View.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object: purpose + extraction only). |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json>

**Compact pseudo-IDL**

```typescript
view {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  compatibleTypes?: string[] // Optional Type-key hints (namespace/name) a View was designed for. Informational only.
  exportConfig?: ref → `export-config` (inline) // The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points).
  aiGuidance?: ref → `view-ai-guidance` (inline) // Guidance for AI agents using a View (View.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object: purpose + extraction only).
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```
