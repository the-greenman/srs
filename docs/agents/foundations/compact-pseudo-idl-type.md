# Compact pseudo-IDL

> The Compact pseudo-IDL: type section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
type {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  aiGuidance?: ref → `ai-guidance` (inline) // Inline LLM guidance for extracting/populating this field or type.
  fields: ref → `field-assignment` (inline)[] // Ordered list of FieldAssignments that make up this Type.
  lifecycle?: ref → `type-lifecycle` (inline) // ext:lifecycle — inline state machine declaration. Mutually exclusive with lifecycleRef.
  lifecycleRef?: string // ext:lifecycle — a LINEAGE reference (bare UUID; rfc-decision-c8704763) to an installed Lifecycle. Mutually exclusive with lifecycle.
  tags?: string[] // Free-form classification tags.
  extendsTypeId?: ref → `type` (id) // ext:type-inheritance — the UUID of the base Type this Type specializes.
  extendsTypeVersion?: integer // ext:type-inheritance — the version of the base Type being extended.
  fieldOrder?: ref → `field` (id)[] // ext:type-inheritance — explicit declared composition order for the merged (base + own) effective field list, overriding per-field FieldAssignment.order at the Type level.
  fieldAssignmentOverrides?: ref → `field-assignment-override` (inline)[] // ext:type-inheritance — per-field overrides applied to inherited FieldAssignments.
  identityFieldId?: ref → `field` (id) // Names one fieldId from this Type's effective field set (own fields plus, under ext:type-inheritance, inherited fields) as the record's identity/display field; MUST reference a fieldId present in that set (Rule [N+33]), and cascades to subtypes that declare no identityFieldId of their own, resolved transitively up the ancestor chain (Rule [N+34]). Renderers use it as the record's per-record heading whenever the DocumentSection names no titleFieldId, or names one absent from this record's Type's effective field set (Rule [N+37]).
  validationRules?: ref → `cross-field-rule` (inline)[] // ext:cross-field-validation — cross-field validation rules applied to Records of this Type. Per I-97, this array is each Type's own complete and exclusive set; it is not inherited by value.
  lineage?: ref → `lineage` (inline) // Fork/copy history of this definition.
  provenance?: ref → `provenance` (inline) // Import provenance of this definition.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```

```typescript
field-assignment {
  fieldId: ref → `field` (id) // References a Field by its stable id (reference mode closes the metacircular loop).
  order: integer // The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).
  required: boolean // Whether this field must be populated before a Record can be logged.
  displayLabel?: string // Context-specific label override for this field within this Type.
  description?: string // Human-readable description of this entity.
}
```


## Generated reference: `NoteSection`

**Referenced Type Id**: 4c000015-0000-4000-a000-000000000015

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `note-section` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `label` | string | no | — | core | Human-readable display label for this lifecycle state. |
| `content` | string | yes | — | core | Free text content. |
| `contentHint` | string | no | enum: "text" \| "markdown" \| "plain" | core | Rendering hint for a Note section's content. Default: text. |
| `tags` | string[] | no | — | core | Free-form classification tags. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/note.json#/$defs/NoteSection>
