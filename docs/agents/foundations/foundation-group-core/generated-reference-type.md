# Generated reference: `Type`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000002-0000-4000-a000-000000000002

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `type` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `aiGuidance` | ref → `ai-guidance` (inline) | no | — | core | Inline LLM guidance for extracting/populating this field or type. |
| `fields` | ref → `field-assignment` (inline)[] | yes | — | core | Ordered list of FieldAssignments that make up this Type. |
| `lifecycle` | ref → `type-lifecycle` (inline) | no | — | ext:lifecycle | ext:lifecycle — inline state machine declaration. Mutually exclusive with lifecycleRef. |
| `lifecycleRef` | string | no | format: uuid | ext:lifecycle | ext:lifecycle — a LINEAGE reference (bare UUID; rfc-decision-c8704763) to an installed Lifecycle. Mutually exclusive with lifecycle. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `extendsTypeId` | ref → `type` (id) | no | — | ext:type-inheritance | ext:type-inheritance — the UUID of the base Type this Type specializes. |
| `extendsTypeVersion` | integer | no | minimum: 1 | ext:type-inheritance | ext:type-inheritance — the version of the base Type being extended. |
| `fieldOrder` | ref → `field` (id)[] | no | — | ext:type-inheritance | ext:type-inheritance — explicit declared composition order for the merged (base + own) effective field list, overriding per-field FieldAssignment.order at the Type level. |
| `fieldAssignmentOverrides` | ref → `field-assignment-override` (inline)[] | no | — | ext:type-inheritance | ext:type-inheritance — per-field overrides applied to inherited FieldAssignments. |
| `identityFieldId` | ref → `field` (id) | no | — | core | Names one fieldId from this Type's effective field set (own fields plus, under ext:type-inheritance, inherited fields) as the record's identity/display field; MUST reference a fieldId present in that set (Rule [N+33]), and cascades to subtypes that declare no identityFieldId of their own, resolved transitively up the ancestor chain (Rule [N+34]). Renderers use it as the record's per-record heading whenever the DocumentSection names no titleFieldId, or names one absent from this record's Type's effective field set (Rule [N+37]). |
| `validationRules` | ref → `cross-field-rule` (inline)[] | no | — | ext:cross-field-validation | ext:cross-field-validation — cross-field validation rules applied to Records of this Type. Per I-97, this array is each Type's own complete and exclusive set; it is not inherited by value. |
| `lineage` | ref → `lineage` (inline) | no | — | core | Fork/copy history of this definition. |
| `provenance` | ref → `provenance` (inline) | no | — | core | Import provenance of this definition. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json>

**`FieldAssignment` (appendix)**

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | ref → `field` (id) | yes | — | core | References a Field by its stable id (reference mode closes the metacircular loop). |
| `order` | integer | yes | minimum: 0 | core | The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015). |
| `required` | boolean | yes | — | core | Whether this field must be populated before a Record can be logged. |
| `displayLabel` | string | no | — | core | Context-specific label override for this field within this Type. |
| `description` | string | no | — | core | Human-readable description of this entity. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json#/$defs/com.semanticops.srs__field-assignment__v1>

**Compact pseudo-IDL**

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
