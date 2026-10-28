# Compact pseudo-IDL

> The Compact pseudo-IDL: view section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
view {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  compatibleTypes?: string[] // Optional Type-key hints (namespace/name) a View was designed for. Informational only.
  exportConfig?: ref → `export-config` (inline) // The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points).
  aiGuidance?: ref → `view-ai-guidance` (inline) // Guidance for AI agents using a View (View.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object: purpose + extraction only).
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `FieldView`

**Referenced Type Id**: 4c00003a-0000-4000-a000-00000000003a

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `field-view` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | ref → `field` (id) | yes | — | core | References a Field by its stable id (reference mode closes the metacircular loop). |
| `order` | integer | yes | minimum: 0 | core | The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015). |
| `required` | boolean | no | — | core | Whether this field must be populated before a Record can be logged. |
| `visible` | boolean | no | — | core | Default: true. Whether a FieldView/RecordPropertyView row is shown. |
| `labelMode` | string | no | enum: "inline" \| "none" | core | RFC-037 Revision 5. FieldView.labelMode, presentation only (Invariant 13). 'inline' (the default) carries the row's resolved label; 'none' emits the value alone, with no label and no separating colon. |
| `displayLabel` | string | no | — | core | Context-specific label override for this field within this Type. |
| `displayHint` | string | no | — | core | Rendering-only hint text override for a single inherited FieldAssignment (presentation; stays per 6523cf5e). |
| `editorHintOverride` | string | no | — | core | Presentation only (RFC-036 [CR-036-20]/[CR-036-21]). Supersedes Field.editorHint for Records rendered/edited through this View. |
| `compositeRenderer` | ref → `composite-renderer-binding` (inline) | no | — | core | RFC-036 — render a FieldView's composite-range value through a named composite renderer. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json#/$defs/FieldView>
