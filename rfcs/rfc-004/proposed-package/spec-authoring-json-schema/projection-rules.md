# JSON Schema Projection Rules

This package renders `ext:schema-notation` semantic schema definitions into JSON Schema. It does not define the source schema meaning; source meaning lives in `spec-authoring-core` `schema-definition` and `schema-member` records.

## Identity

The projected JSON Schema `$id` uses:

```text
https://srs.semanticops.com/schema/domain/<namespace>/<schemaName>/<version>.json
```

## Member Mapping

- A `schema-definition` renders as a JSON Schema object with `title`, `$id`, `type: "object"`, `properties`, and `required`.
- A `schema-member` renders as one property under `properties`.
- `required: true` adds the member name to the parent schema's `required` array.
- `nullable: true` adds `null` to the rendered value shape without making the property optional.
- `deprecated: true` renders as `deprecated: true`.
- `semantic-purpose`, `description`, and `notes` may render to `description` or `$comment`.

## Type Expression Mapping

- `scalar` maps to JSON Schema primitive type and optional `format`.
- `ref` maps to `$ref`.
- `array` maps to `type: "array"` with `items`.
- `map` maps to `type: "object"` with `additionalProperties`.
- `object` maps to an inline `type: "object"` schema for genuinely local anonymous shapes.
- `union` maps to `oneOf`.
- `literal` maps to `const`.
- `enum` maps to `enum`.
- `unknown` maps to an unconstrained schema object.

## Portable Scalar Mapping

| Scalar | JSON Schema |
|---|---|
| `string` | `{ "type": "string" }` |
| `text` | `{ "type": "string" }` |
| `integer` | `{ "type": "integer" }` |
| `number` | `{ "type": "number" }` |
| `boolean` | `{ "type": "boolean" }` |
| `date` | `{ "type": "string", "format": "date" }` |
| `date-time` | `{ "type": "string", "format": "date-time" }` |
| `uuid` | `{ "type": "string", "format": "uuid" }` |
| `uri` | `{ "type": "string", "format": "uri" }` |
| `duration-ms` | `{ "type": "integer", "minimum": 0 }` |
| `json` | unconstrained JSON value |

## Constraints

Portable constraints render to their closest JSON Schema equivalents: numeric bounds, string length, `pattern`, array `minItems` and `maxItems`, `uniqueItems`, and object/map key or value constraints.
