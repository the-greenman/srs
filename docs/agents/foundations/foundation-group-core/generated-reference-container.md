# Generated reference: `Container`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/container.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

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

**Compact pseudo-IDL**

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
