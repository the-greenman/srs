# Compact pseudo-IDL

> The Compact pseudo-IDL: lifecycle section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
lifecycle {
  id: string // Globally unique, stable UUID identity of this entity.
  version: integer // Positive integer version within the UUID lineage.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  states: ref → `lifecycle-state` (inline)[] // The lifecycle's states; at least one, exactly one marked isInitial (Invariant 4).
  transitions: ref → `lifecycle-transition` (inline)[] // The lifecycle's named state-to-state edges.
  initialState: string // Must reference a state key with isInitial: true (Invariant 4).
  extendsLifecycleId?: string // When this installable Lifecycle extends an upstream Lifecycle.
  extendsLifecycleVersion?: integer // Must match the upstream Lifecycle's version exactly.
  description?: string // Human-readable description of this entity.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```


## Generated reference: `RelationTypeDefinition`

**Referenced Type Id**: 4c000023-0000-4000-a000-000000000023

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `relation-type-definition` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `key` | string | yes | — | core | Machine-readable state key. Unified substrate field (was name pre-RFC-006). |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `label` | string | yes | — | core | Human-readable display label for this lifecycle state. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `category` | string | yes | enum: "composition" \| "refinement" \| "dependency" \| "sequence" \| "derivation" \| "evidence" \| "governance" \| "association" \| "lifecycle" \| "provenance" \| "other" | core | Structural category of a relation type. |
| `canonicalDirection` | string | no | — | core | Human-readable description of which end is source and which is target, or what members represent. |
| `inverseType` | string | no | — | core | Key of the derived inverse (e.g. supersedes -> superseded-by); need not resolve — display-only (Invariant 16). |
| `irreflexive` | boolean | no | — | core | When true, a relation from an instance to itself is invalid. |
| `requireSameType` | boolean | no | — | core | When true, source and target must resolve to the same bound Type (srs-rust#910, re-keyed onto the Type system). |
| `status` | string | no | enum: "active" \| "deprecated" \| "tombstone" \| "retired" | core | The VocabularyEntry status of this lifecycle state itself (distinct from the record-level status a Type's Records carry). |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |
| `meta` | map<string, open> | no | — | core | Open extension bag for state- or transition-specific metadata not otherwise modelled (rfc-decision-6fc7e142: the one escape-bag name, was `properties`). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/relation-type.json>
