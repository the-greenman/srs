# Compact pseudo-IDL

> The Compact pseudo-IDL: vocabulary section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

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


## Generated reference: `Term`

**Referenced Type Id**: 4c00001c-0000-4000-a000-00000000001c

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `term` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `key` | string | yes | — | core | Machine-readable state key. Unified substrate field (was name pre-RFC-006). |
| `label` | string | no | — | core | Human-readable display label for this lifecycle state. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `aliases` | string[] | no | — | core | Alternate keys this lifecycle state is also known by. |
| `roles` | string[] | no | — | core | Semantic roles of a Term. Well-known values: foundation, navigation. |
| `status` | string | no | enum: "active" \| "deprecated" \| "tombstone" \| "retired" | core | The VocabularyEntry status of this lifecycle state itself (distinct from the record-level status a Type's Records carry). |
| `meta` | map<string, open> | no | — | core | Open extension bag for state- or transition-specific metadata not otherwise modelled (rfc-decision-6fc7e142: the one escape-bag name, was `properties`). |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/term.json>
