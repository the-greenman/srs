# Generated reference: `RelationSpec`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json#/$defs/RelationSpec>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

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

**Compact pseudo-IDL**

```typescript
relation-spec {
  relationType: string // The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication).
  sourceType: ref → `exact-type-ref` (inline) // ext:blueprint — the Record Type on the source end of a RelationSpec.
  targetType: ref → `exact-type-ref` (inline) // ext:blueprint — the Record Type on the target end of a RelationSpec.
  cardinality?: string // ext:blueprint — expected multiplicity constraint for a RelationSpec.
  required?: boolean // Whether this field must be populated before a Record can be logged.
}
```
