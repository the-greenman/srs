# Compact pseudo-IDL

> The Compact pseudo-IDL: term section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
term {
  id: string // Globally unique, stable UUID identity of this entity.
  version: integer // Positive integer version within the UUID lineage.
  namespace: string // Reverse-DNS logical grouping.
  key: string // Machine-readable state key. Unified substrate field (was name pre-RFC-006).
  label?: string // Human-readable display label for this lifecycle state.
  description?: string // Human-readable description of this entity.
  aliases?: string[] // Alternate keys this lifecycle state is also known by.
  roles?: string[] // Semantic roles of a Term. Well-known values: foundation, navigation.
  status?: string // The VocabularyEntry status of this lifecycle state itself (distinct from the record-level status a Type's Records carry).
  meta?: map<string, open> // Open extension bag for state- or transition-specific metadata not otherwise modelled (rfc-decision-6fc7e142: the one escape-bag name, was `properties`).
  createdAt?: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `Lifecycle`

**Referenced Type Id**: 4c00001f-0000-4000-a000-00000000001f

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `lifecycle` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `states` | ref → `lifecycle-state` (inline)[] | yes | minItems: 1 | core | The lifecycle's states; at least one, exactly one marked isInitial (Invariant 4). |
| `transitions` | ref → `lifecycle-transition` (inline)[] | yes | — | core | The lifecycle's named state-to-state edges. |
| `initialState` | string | yes | — | core | Must reference a state key with isInitial: true (Invariant 4). |
| `extendsLifecycleId` | string | no | format: uuid | core | When this installable Lifecycle extends an upstream Lifecycle. |
| `extendsLifecycleVersion` | integer | no | minimum: 1 | core | Must match the upstream Lifecycle's version exactly. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/lifecycle.json>
