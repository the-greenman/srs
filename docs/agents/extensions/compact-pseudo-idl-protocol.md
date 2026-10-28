# Compact pseudo-IDL

> The Compact pseudo-IDL: protocol section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
protocol {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description?: string // Human-readable description of this entity.
  targetType: string // The Record type this Protocol converges on — a LINEAGE reference (bare UUID; rfc-decision-c8704763), never the canonical namespace/name@version form (DISPLAY-only, never stored). Empty string for loose, exploratory Protocols whose output is input context for a tighter Protocol.
  stages: ref → `protocol-stage` (inline)[] // The stages, in declaration order. Execution sequence is determined by dependsOn resolution, not array position; order is the declared composition order (Invariant 31).
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```


## Generated reference: `RelationSpec`

**Referenced Type Id**: 4c00001a-0000-4000-a000-00000000001a

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `relation-spec` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `relationType` | string | yes | — | core | The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication). |
| `sourceType` | ref → `exact-type-ref` (inline) | yes | — | core | ext:blueprint — the Record Type on the source end of a RelationSpec. |
| `targetType` | ref → `exact-type-ref` (inline) | yes | — | core | ext:blueprint — the Record Type on the target end of a RelationSpec. |
| `cardinality` | string | no | enum: "one-to-one" \| "one-to-many" \| "many-to-one" \| "many-to-many" | core | ext:blueprint — expected multiplicity constraint for a RelationSpec. |
| `required` | boolean | no | — | core | Whether this field must be populated before a Record can be logged. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json#/$defs/RelationSpec>
