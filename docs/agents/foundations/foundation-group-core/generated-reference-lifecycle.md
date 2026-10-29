# Generated reference: `Lifecycle`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/lifecycle.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

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

**Compact pseudo-IDL**

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
