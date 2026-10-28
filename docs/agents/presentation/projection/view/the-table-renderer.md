# The `table` renderer

> Roles, with their owning Type and required fieldType:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

Roles, with their owning Type and required `fieldType`:

| Role | Owner | Required | `fieldType` |
|---|---|---|---|
| `rows` | table Type | yes | `{ datatype: "ref", mode: "inline", cardinality: "list", rangeType: <row Type> }` |
| `cells` | row Type | yes | `{ datatype: "string", cardinality: "list" }` |
| `columns` | table Type | no | `{ datatype: "string", cardinality: "list" }` |
| `widths` | table Type | no | `{ datatype: "number", cardinality: "list", constraints: { minimum: 0, maximum: 1 } }` |
| `subheading` | table Type | no | `{ datatype: "string", cardinality: "single" }` |
| `label` | table Type | no | `{ datatype: "string", cardinality: "single" }` |

The composite field's own `cardinality` governs how many tables it carries: `single` is one, `list` is a
sequence. This replaces the `FieldGroup` + `compositeRenderer` mechanism of RFC-007, which is retired with
`FieldGroup` at the #242 cutover.
