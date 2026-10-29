# Generated reference: `Record`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/record.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000017-0000-4000-a000-000000000017

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `record` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `instanceId` | string | yes | format: uuid | core | Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage. |
| `typeId` | string | yes | format: uuid | core | Stable UUID of the referenced Type. |
| `typeVersion` | integer | yes | minimum: 1 | core | Version of the Type this ref targets (version-exact anchor). |
| `typeNamespace` | string | yes | — | core | Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `typeName` | string | yes | — | core | Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `lifecycleState` | string | no | — | core | ext:lifecycle — current lifecycle state of this Record. |
| `fieldValues` | dependent → type_id | yes | — | core | RFC-039: the name-keyed recursive value carrier, shaped by the Record's bound Type (resolved via typeId). Deliberately lossy at this envelope layer (approximated, per metamodel-fidelity.md); the Type's own projected schema validates the interior. |
| `sourceRefs` | ref → `source-reference` (inline)[] | no | — | core | References to source material this instance was derived from or attaches to (RFC-017/RFC-023). |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/record.json>

**Compact pseudo-IDL**

```typescript
record {
  instanceId: string // Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage.
  typeId: string // Stable UUID of the referenced Type.
  typeVersion: integer // Version of the Type this ref targets (version-exact anchor).
  typeNamespace: string // Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins.
  typeName: string // Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins.
  lifecycleState?: string // ext:lifecycle — current lifecycle state of this Record.
  fieldValues: dependent → type_id // RFC-039: the name-keyed recursive value carrier, shaped by the Record's bound Type (resolved via typeId). Deliberately lossy at this envelope layer (approximated, per metamodel-fidelity.md); the Type's own projected schema validates the interior.
  sourceRefs?: ref → `source-reference` (inline)[] // References to source material this instance was derived from or attaches to (RFC-017/RFC-023).
  tags?: string[] // Free-form classification tags.
  createdAt?: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```
