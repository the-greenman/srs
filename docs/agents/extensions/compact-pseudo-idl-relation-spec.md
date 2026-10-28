# Compact pseudo-IDL

> The Compact pseudo-IDL: relation-spec section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
relation-spec {
  relationType: string // The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication).
  sourceType: ref → `exact-type-ref` (inline) // ext:blueprint — the Record Type on the source end of a RelationSpec.
  targetType: ref → `exact-type-ref` (inline) // ext:blueprint — the Record Type on the target end of a RelationSpec.
  cardinality?: string // ext:blueprint — expected multiplicity constraint for a RelationSpec.
  required?: boolean // Whether this field must be populated before a Record can be logged.
}
```


## Generated reference: `Blueprint`

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
