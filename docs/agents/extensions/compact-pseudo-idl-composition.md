# Compact pseudo-IDL

> The Compact pseudo-IDL: composition section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
composition {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  rootTypeRefs?: ref → `exact-type-ref` (inline)[] // RFC-009 — when set, a Composition applies to Containers whose root Record's resolved Type matches one of these refs.
  sections: ref → `document-section` (inline)[] // Ordered list of sections that make up a Composition.
  compositeRenderers?: ref → `composite-renderer-directive` (inline)[] // RFC-036 — composite renderer dispatch declared at a Composition or a DocumentSection.
  navigationLinks?: ref → `navigation-link` (inline)[] // Assembly-time cross-section reading aids. Do not appear in the Relation graph.
  exportConfig?: ref → `export-config` (inline) // The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points).
  depthOffset?: integer // Shifts all auto-rendered heading levels by this amount. Default: 0.
  themeRef?: ref → `theme-reference` (inline) // A pointer to a Theme (ext:themes-l1): Composition.themeRef, or a ThemeVariant's own themeRef.
  themeVariants?: ref → `theme-variant` (inline)[] // Named alternative themes selectable at render invocation.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `DiscoveryQuery`

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
