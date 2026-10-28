# Compact pseudo-IDL

> The Compact pseudo-IDL: container section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
container {
  containerId: string // Stable UUID for this Container. Must not appear in Relation.sourceInstanceId or targetInstanceId.
  title: string // Human-readable title.
  namespace?: string // Reverse-DNS logical grouping.
  name?: string // Machine-readable name within the namespace; snake_case.
  description?: string // Human-readable description of this entity.
  memberInstanceIds?: ref → `container-entry` (inline)[] // RFC-043 [R1]: the ordered outline of entries. Entry ids are direct(C), list order is the sequence, depth is nesting.
  identityInstanceId?: string // RFC-013/RFC-029 — the instance id of this Container's identity/purpose record.
  anchorInstanceId?: string // RFC-009 (amended srs#446) — the instance id whose Type is this Container's typing anchor.
  tags?: string[] // Free-form classification tags.
  createdAt?: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `Vocabulary`

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
