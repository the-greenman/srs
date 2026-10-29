# Generated reference: `Vocabulary`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/vocabulary.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c00001e-0000-4000-a000-00000000001e

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `vocabulary` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `mode` | string | yes | enum: "open" \| "closed" | core | open: values not in any Term are valid. closed: values MUST resolve to a Term. |
| `terms` | ref → `term` (inline)[] | yes | — | core | The Vocabulary's Term entries. |
| `extendsVocabularyId` | string | no | format: uuid | core | When this Vocabulary adds terms to an upstream Vocabulary. |
| `extendsVocabularyVersion` | integer | no | minimum: 1 | core | Must match the upstream Vocabulary's version exactly. |
| `promotionWindow` | ref → `promotion-window` (inline) | no | — | core | RFC-006 V10 — grace window for a Vocabulary's open-to-closed promotion. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/vocabulary.json>

**Compact pseudo-IDL**

```typescript
vocabulary {
  id: string // Globally unique, stable UUID identity of this entity.
  version: integer // Positive integer version within the UUID lineage.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  mode: string // open: values not in any Term are valid. closed: values MUST resolve to a Term.
  terms: ref → `term` (inline)[] // The Vocabulary's Term entries.
  extendsVocabularyId?: string // When this Vocabulary adds terms to an upstream Vocabulary.
  extendsVocabularyVersion?: integer // Must match the upstream Vocabulary's version exactly.
  promotionWindow?: ref → `promotion-window` (inline) // RFC-006 V10 — grace window for a Vocabulary's open-to-closed promotion.
  description?: string // Human-readable description of this entity.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```
