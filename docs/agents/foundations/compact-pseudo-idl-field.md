# Compact pseudo-IDL

> The Compact pseudo-IDL: field section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
field {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  instructions?: string // Fuller guidance for a human completing this field.
  aiGuidance: ref → `ai-guidance` (inline) // Inline LLM guidance for extracting/populating this field or type.
  fieldType: ref → `field-type` (inline) // The decomposed value type (RFC-032): datatype x cardinality x value-domain x format x constraints.
  editorHint?: string // Presentation only (not part of the type model — RFC-032). Suggested UI control; implementations and Views may override. Consolidated by the rendering follow-up #262.
  tags?: string[] // Free-form classification tags.
  lineage?: ref → `lineage` (inline) // Fork/copy history of this definition.
  provenance?: ref → `provenance` (inline) // Import provenance of this definition.
  createdAt: date-time // ISO-8601 creation timestamp.
}
```


## Generated reference: `Type`

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
