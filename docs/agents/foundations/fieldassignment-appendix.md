# `FieldAssignment` (appendix)

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json#/$defs/com.semanticops.srs__field-assignment__v1>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | ref → `field` (id) | yes | — | core | References a Field by its stable id (reference mode closes the metacircular loop). |
| `order` | integer | yes | minimum: 0 | core | The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015). |
| `required` | boolean | yes | — | core | Whether this field must be populated before a Record can be logged. |
| `displayLabel` | string | no | — | core | Context-specific label override for this field within this Type. |
| `description` | string | no | — | core | Human-readable description of this entity. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json#/$defs/com.semanticops.srs__field-assignment__v1>
