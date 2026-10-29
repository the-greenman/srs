# Generated reference: `Relation`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/relation.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000018-0000-4000-a000-000000000018

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `relation` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `relationId` | string | yes | format: uuid | core | Stable UUID for this standalone Relation (RFC-038). |
| `relationType` | string | yes | — | core | The Relation type name: a canonical vocabulary entry (contains, depends-on, supersedes, refines, derived-from, evidences, precedes) or a custom namespace/name form. Shared by Relation.relationType and RelationSpec.relationType (srs#526: same meaning, different Types — reuse over duplication). |
| `sourceInstanceId` | string | yes | format: uuid | core | The asserting instance. Reads: source [relationType] target. |
| `targetInstanceId` | string | yes | format: uuid | core | The related instance. |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `notes` | string | no | — | core | Free-form annotation on a Relation. |
| `sourceRefs` | ref → `source-reference` (inline)[] | no | — | core | References to source material this instance was derived from or attaches to (RFC-017/RFC-023). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/relation.json>

**Compact pseudo-IDL**

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
