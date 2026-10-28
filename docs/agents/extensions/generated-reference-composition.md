# Generated reference: `Composition`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/composition.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000037-0000-4000-a000-000000000037

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `composition` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `rootTypeRefs` | ref → `exact-type-ref` (inline)[] | no | — | core | RFC-009 — when set, a Composition applies to Containers whose root Record's resolved Type matches one of these refs. |
| `sections` | ref → `document-section` (inline)[] | yes | — | core | Ordered list of sections that make up a Composition. |
| `compositeRenderers` | ref → `composite-renderer-directive` (inline)[] | no | — | core | RFC-036 — composite renderer dispatch declared at a Composition or a DocumentSection. |
| `navigationLinks` | ref → `navigation-link` (inline)[] | no | — | core | Assembly-time cross-section reading aids. Do not appear in the Relation graph. |
| `exportConfig` | ref → `export-config` (inline) | no | — | core | The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points). |
| `depthOffset` | integer | no | minimum: 0 | core | Shifts all auto-rendered heading levels by this amount. Default: 0. |
| `themeRef` | ref → `theme-reference` (inline) | no | — | core | A pointer to a Theme (ext:themes-l1): Composition.themeRef, or a ThemeVariant's own themeRef. |
| `themeVariants` | ref → `theme-variant` (inline)[] | no | — | core | Named alternative themes selectable at render invocation. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/composition.json>

**Compact pseudo-IDL**

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
