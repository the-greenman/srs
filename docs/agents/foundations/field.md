# Field

> The atomic reusable semantic unit: one named, versioned, UUID-identified piece of meaning, defined once and composed into any number of Types.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

The atomic reusable semantic unit: one named, versioned, UUID-identified piece of meaning, defined once and composed into any number of Types. A Field owns its own semantics completely — its value contract and its AI guidance belong to the Field and may not be redefined, overridden or duplicated by a Type that includes it. If a context needs different meaning, that is a different Field with its own identity and lineage, not a local override.

**Notes**: Invariants 1-3 and 9 carry the Field's non-negotiables: rendering labels change nothing, Types may not restate Field semantics, and a new id means a new definition and not a new version.

## Type must not redefine, override, or duplicate the semantic content…

**Number**: 2

A `Type` must not redefine, override, or duplicate the semantic content of any `Field` it includes. If different semantics are needed for a Field in a specific Type context, a distinct `Field` with its own identity and lineage must be created.


## Field type

The complete statement of what a Field's value is, decomposed into orthogonal facets that vary independently: datatype, cardinality, value domain, string format, and value constraints. Because the facets are separate, a constraint on one never forces a choice on another — a closed list of markdown strings is expressible without inventing a datatype for it. Cardinality is declared here and nowhere else. Three composite datatypes let a value's range be another Type (`ref`), be governed by a sibling field (`dependent`), or be an open string-keyed collection (`map`).

**Notes**: It replaced the pre-RFC-032 `valueType` enum, which conflated four axes into one closed list and forced every independently-varying axis to be bolted on beside it. `valueType` is removed, not deprecated.

### Field.fieldType.format, when present, is only meaningful when datatype…

**Number**: 38

`Field.fieldType.format`, when present, is only meaningful when `fieldType.datatype` is `"string"`. Implementations must ignore `format` on fields with any other `datatype`.


### List cardinality array-wraps uniformly

**Number**: I-139

`cardinality: "list"` array-wraps uniformly, for every `datatype` including `map` and `dependent`, matching `projectField`'s unconditional wrap. The single-value rule states the `single` case; the wrap composes on top of it. (RFC-039 [R16])


### Composite value

A Field whose range is another Type, not a scalar, declared as `datatype: "ref"` with a `rangeType`. In `inline` mode the value is a nested object shaped by that Type — structure expressed through the type system instead of a serialised blob in a text field. In `reference` mode the value is the id of a target instance, and it is definitional composition, not an assertion: it must never be interpreted as, or required to be accompanied by, a Relation.

**Notes**: The test for which to use: model an assertion *between* instances (one needing provenance, lifecycle or confidence) as a Relation; use `reference` where the target's identity is part of the definition itself.

### Reference-mode values resolve in the instance set

**Number**: I-136

A `mode: "reference"` value MUST resolve to an instance present in the repository's authoritative instance set, and that instance MUST be of the Field's declared `rangeType` at the declared `typeVersion`. A dangling or type-mismatched target MUST be reported as an error naming the referring record, the key, and the target id. (RFC-039 [R14], amended by RFC-038 [R25] — the reference target is the tree-enumerated instance set, not a manifest `instanceIndex`, which is retired per RFC-038 [R2]; discharges RFC-032 OQ4, RFC-033:302, RFC-035:592)



### The `FieldType` shape

`FieldType`, in pseudo-IDL:

```typescript
FieldType {
  datatype: "string" | "number" | "integer" | "boolean" | "date" | "date-time" | "ref" | "dependent" | "map"

  // Cardinality — the sole cardinality mechanism
  cardinality?: "single" | "list"   // default: "single"
  minItems?: integer                // cardinality "list" only; 0 ≤ minItems ≤ maxItems
  maxItems?: integer                // cardinality "list" only

  // Value domain — datatype "string" only
  valueDomain?: "open" | "closed"   // default: "open"
  allowedValues?: string[]          // valueDomain "closed"; mutually exclusive with vocabularyRef
  vocabularyRef?: UUID               // valueDomain "closed"; LINEAGE (rfc-decision-c8704763) — bare
                                     // UUID of an installed Vocabulary, migrated from the former
                                     // namespace/name@version pattern string

  // Semantic string format — datatype "string" only
  format?: "plain" | "markdown" | "uri" | "uuid" | "email"

  // Value constraints — minLength/maxLength/pattern (string); minimum/maximum (number/integer)
  constraints?: object

  // Composite range — datatype "ref" only
  rangeType?: ExactTypeRef          // REQUIRED when datatype is "ref"; the Type this field's range is
  mode?: "inline" | "reference"     // default: "inline"; fixed per Field

  // Dependent typing — datatype "dependent" only
  dependsOn?: string                // REQUIRED; "self", or a sibling field name whose type the value conforms to

  // Open string-keyed collection — datatype "map" only
  valueRange?: "string" | "number" | "integer" | "boolean" | "date" | "date-time" | "open"  // REQUIRED
}
```


### `FieldType` — the value semantics

`fieldType` carries everything about what a Field's value *is*. It decomposes value semantics into orthogonal facets — **datatype × cardinality × value-domain × format × constraints** — so each axis varies independently, and adds three composite datatypes (`ref`, `dependent`, `map`) that let a Field's range be another Type.

Example: the `FieldType` shape.

**`datatype` semantics:**

| Value | Meaning |
|---|---|
| `"string"` | Text of any length. Length, pattern, format, and value domain are separate facets, not distinct datatypes |
| `"number"` | Numeric value, fractional permitted |
| `"integer"` | Whole number |
| `"boolean"` | True/false |
| `"date"` | ISO 8601 calendar date |
| `"date-time"` | ISO 8601 date + time |
| `"ref"` | The range is another Type — nested object(s) when `mode` is `"inline"`, target instance id(s) when `"reference"` |
| `"dependent"` | The value conforms to the type descriptor named by `dependsOn` |
| `"map"` | Open string-keyed collection whose values conform to `valueRange` |

Cardinality is declared **only** here. A Field holding many values is `cardinality: "list"`; a Type that includes it must not restate or override that — Field semantics belong to the Field (Invariant 2).

A `reference`-mode value is a target instance id, and MUST NOT be interpreted as or require a `Relation`. Use `reference` for definitional composition, where the target's identity is part of the definition; model an assertion *between* instances — one needing provenance, lifecycle, or confidence — as a `Relation` instead.



## Field

The atomic reusable semantic unit. Fields are defined once and composed into Types. A Field's `aiGuidance` and `fieldType` — including every constraint the latter carries — belong to the Field, not to any Type that includes it.

See *Generated reference: `Field`* for `Field`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (RFC-040 Change J / #274 ratified ledger). This prose no longer hand-duplicates the property list.
