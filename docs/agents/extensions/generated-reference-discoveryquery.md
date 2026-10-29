# Generated reference: `DiscoveryQuery`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/DiscoveryQuery>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000024-0000-4000-a000-000000000024

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `discovery-query` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `typeId` | string | no | format: uuid | core | Stable UUID of the referenced Type. |
| `typeNamespace` | string | no | — | core | Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `typeName` | string | no | — | core | Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `containerId` | string | no | format: uuid | core | ext:discovery DiscoveryQuery.containerId — instance is in this container's effective membership, the closure over declared roots, members and childContainerIds; a contains Relation never contributes (RFC-034 [R8], I-118). |
| `tag` | string[] | no | — | core | AND-conjunction: the instance's tags array must contain ALL of the specified values (ext:discovery DiscoveryQuery.tag). |
| `tier` | integer | no | enum: "0" \| "2" | core | ext:discovery DiscoveryQuery.tier — instance tier filter. 0 = Note, 2 = Record. Tier 1 (TypedRecord) was removed (rfc-decision-53635966); the gap in numbering is retained deliberately for reference stability. |
| `lifecycleState` | string | no | — | core | ext:lifecycle — current lifecycle state of this Record. |
| `lifecycleStates` | string[] | no | — | core | ext:discovery DiscoveryQuery.lifecycleStates — inclusive multi-value lifecycle filter, OR semantics (RFC-012 Rev 11, srs#525). |
| `excludeLifecycleStates` | string[] | no | — | core | ext:discovery DiscoveryQuery.excludeLifecycleStates — exclusion filter, applied after lifecycleState/lifecycleStates. |
| `contentMatch` | string | no | — | core | ext:discovery DiscoveryQuery.contentMatch — free-text recall-floor predicate over the Text Projection. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/DiscoveryQuery>

**Compact pseudo-IDL**

```typescript
discovery-query {
  typeId?: string // Stable UUID of the referenced Type.
  typeNamespace?: string // Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins.
  typeName?: string // Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins.
  containerId?: string // ext:discovery DiscoveryQuery.containerId — instance is in this container's effective membership, the closure over declared roots, members and childContainerIds; a contains Relation never contributes (RFC-034 [R8], I-118).
  tag?: string[] // AND-conjunction: the instance's tags array must contain ALL of the specified values (ext:discovery DiscoveryQuery.tag).
  tier?: integer // ext:discovery DiscoveryQuery.tier — instance tier filter. 0 = Note, 2 = Record. Tier 1 (TypedRecord) was removed (rfc-decision-53635966); the gap in numbering is retained deliberately for reference stability.
  lifecycleState?: string // ext:lifecycle — current lifecycle state of this Record.
  lifecycleStates?: string[] // ext:discovery DiscoveryQuery.lifecycleStates — inclusive multi-value lifecycle filter, OR semantics (RFC-012 Rev 11, srs#525).
  excludeLifecycleStates?: string[] // ext:discovery DiscoveryQuery.excludeLifecycleStates — exclusion filter, applied after lifecycleState/lifecycleStates.
  contentMatch?: string // ext:discovery DiscoveryQuery.contentMatch — free-text recall-floor predicate over the Text Projection.
}
```
