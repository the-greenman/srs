# Compact pseudo-IDL

> The Compact pseudo-IDL: relation section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
relation {
  relationId: string // Stable UUID for this standalone Relation (RFC-038).
  relationType: string // The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication).
  sourceInstanceId: string // The asserting instance. Reads: source [relationType] target.
  targetInstanceId: string // The related instance.
  createdAt?: date-time // ISO-8601 creation timestamp.
  notes?: string // Free-form annotation on a Relation.
  sourceRefs?: ref → `source-reference` (inline)[] // References to source material this instance was derived from or attaches to (RFC-017/RFC-023).
}
```


## Generated reference: `Container`

**Referenced Type Id**: 4c000019-0000-4000-a000-000000000019

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `container` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `containerId` | string | yes | format: uuid | core | Stable UUID for this Container. Must not appear in Relation.sourceInstanceId or targetInstanceId. |
| `title` | string | yes | — | core | Human-readable title. |
| `namespace` | string | no | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | no | — | core | Machine-readable name within the namespace; snake_case. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `memberInstanceIds` | ref → `container-entry` (inline)[] | no | — | core | RFC-043 [R1]: the ordered outline of entries. Entry ids are direct(C), list order is the sequence, depth is nesting. |
| `identityInstanceId` | string | no | format: uuid | core | RFC-013/RFC-029 — the instance id of this Container's identity/purpose record. |
| `anchorInstanceId` | string | no | format: uuid | core | RFC-009 (amended srs#446) — the instance id whose Type is this Container's typing anchor. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/container.json>
