# Generated reference: `Blueprint`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c00001b-0000-4000-a000-00000000001b

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `blueprint` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `rootTypes` | ref → `exact-type-ref` (inline)[] | yes | — | core | ext:blueprint — the Record Type(s) this Blueprint produces as root Records. |
| `structure` | ref → `relation-spec` (inline)[] | no | — | core | ext:blueprint — expected Relation structure between extracted Records. |
| `requiredTypes` | ref → `exact-type-ref` (inline)[] | no | — | core | ext:blueprint — TypeIds that must be present for this Blueprint to be considered complete. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json>

**Compact pseudo-IDL**

```typescript
blueprint {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  rootTypes: ref → `exact-type-ref` (inline)[] // ext:blueprint — the Record Type(s) this Blueprint produces as root Records.
  structure?: ref → `relation-spec` (inline)[] // ext:blueprint — expected Relation structure between extracted Records.
  requiredTypes?: ref → `exact-type-ref` (inline)[] // ext:blueprint — TypeIds that must be present for this Blueprint to be considered complete.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```
