> **GitHub issue**: [the-greenman/srs#139](https://github.com/the-greenman/srs/issues/139)

# RFC-019: Cross-Field Validation Rules — `validationRules` on `Type` and `CrossFieldRule` Schema

**Status**: Draft (Revision 1)
**Affects**: `docs/schema/2.0/type.json`; `ext:cross-field-validation` (extension record `c16793d7-005a-58d2-88d0-9e7d9b4967b1`)
**Author**: the-greenman (from issue the-greenman/srs#139)
**Date**: 2026-07-09
**Builds on**: none

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-09 | Initial draft — formalises the `validationRules` property and `CrossFieldRule` shape already present in `ext:cross-field-validation` extension record and now reflected in `type.json` (schema change landed in master commit ef4313b, deferred from srs-rust#242) |

---

## Abstract

The `ext:cross-field-validation` extension was added to the SRS spec (extension record
`c16793d7-005a-58d2-88d0-9e7d9b4967b1`) to handle constraints that span more than one Field in a
Record. The extension describes a `CrossFieldRule` shape and a `validationRules` property on Type,
but no formal JSON Schema $def existed for those shapes in `docs/schema/2.0/type.json`. This RFC
formalises the schema, provides normative conformance rules for implementations, and adds spec
invariants that pin the three rule types, their required fields, and evaluation semantics.

---

## Motivation

### Problem 1 — `ext:cross-field-validation` had no schema definition

`ValidationRule` (single-field validation) had a $def in `type.json`. `CrossFieldRule` (multi-field
validation) existed only as informal TypeScript-style prose in the extension record body. An
implementation had no machine-readable contract to validate a Type file's `validationRules` array
against, and no guarantee that implementations would agree on the field names, allowed `type`
values, or which fields are required for each rule variant.

### Problem 2 — Deferred from srs-rust#242

srs-rust#242 implemented `CrossFieldRule` evaluation in the Rust engine. At the time, the Rust
implementation did not validate individual type definition files via JSON Schema during
`repo validate` (the schema check was effectively a no-op for type files). The schema formalization
was deferred, creating a window where schema and implementation could diverge. This RFC closes
that window.

### Problem 3 — `additionalProperties: false` ambiguity

Without a $def, it was unclear whether unknown keys on a `CrossFieldRule` object should be rejected
or silently ignored. Different implementations could diverge. This RFC settles the question: the
$def carries `additionalProperties: false`.

---

## Proposed Changes

### Change A — Add `validationRules` property to `type.json`

Add an optional `validationRules` property to the top-level `type.json` object (alongside existing
optional extension properties such as `fieldGroups`, `lifecycle`, `extendsTypeId`):

```json
"validationRules": {
  "type": "array",
  "items": { "$ref": "#/$defs/CrossFieldRule" },
  "description": "ext:cross-field-validation — cross-field validation rules applied to Records of this Type."
}
```

### Change B — Define `CrossFieldRule` $def in `type.json`

Add the following $def to `type.json`:

```json
"CrossFieldRule": {
  "type": "object",
  "required": ["type"],
  "additionalProperties": false,
  "description": "ext:cross-field-validation — a constraint that validates a relationship between fields in a Record.",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["conditional-required", "field-ordering", "mutual-exclusion"],
      "description": "The kind of cross-field constraint."
    },
    "message": {
      "type": "string",
      "description": "Optional human-readable description of the rule."
    },
    "predicateFieldId": {
      "type": "string",
      "format": "uuid",
      "description": "Field whose value is tested (conditional-required, field-ordering)."
    },
    "predicateValue": {
      "type": "string",
      "description": "Value the predicate field must equal to activate the rule (conditional-required)."
    },
    "targetFieldId": {
      "type": "string",
      "format": "uuid",
      "description": "Field that is constrained when the rule fires (conditional-required, field-ordering)."
    },
    "effect": {
      "$ref": "#/$defs/CrossFieldRuleEffect",
      "description": "Temporal direction for a field-ordering rule."
    },
    "fieldIds": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" },
      "minItems": 2,
      "description": "Fields of which at most one may be non-empty (mutual-exclusion)."
    }
  }
}
```

### Change C — Define `CrossFieldRuleEffect` $def in `type.json`

```json
"CrossFieldRuleEffect": {
  "type": "string",
  "enum": ["must-precede", "must-follow"],
  "description": "Temporal direction for a field-ordering rule: the predicate field must-precede or must-follow the target."
}
```

### Change D — Required field table (normative)

| Rule `type` | MUST supply | MUST NOT supply (forbidden / ignored) |
|---|---|---|
| `conditional-required` | `predicateFieldId`, `predicateValue`, `targetFieldId` | `effect`, `fieldIds` |
| `field-ordering` | `predicateFieldId`, `targetFieldId`, `effect` | `predicateValue`, `fieldIds` |
| `mutual-exclusion` | `fieldIds` (min 2 UUIDs) | `predicateFieldId`, `predicateValue`, `targetFieldId`, `effect` |

Fields not required for a given rule type MAY be absent; when present they MUST be ignored by the
evaluator (they are not rejected by schema because `additionalProperties: false` only covers
unknown *key names*, not *rule-type-conditional presence*).

---

## Conformance Rules

> **[R1]** A conforming SRS implementation MUST parse the `validationRules` array on a Type
> definition when it is present. An implementation MUST validate the array against the
> `CrossFieldRule` $def: any element that violates the schema (unknown property key, disallowed
> `type` value, non-UUID `fieldId`) is a Type-level validation error.

> **[R2]** A conforming implementation MUST evaluate each `CrossFieldRule` in `validationRules`
> against every Record of the Type at record-write time (create and update). Evaluation order
> within the array is implementation-defined; all rules MUST be evaluated regardless of earlier
> failures.

> **[R3]** A `CrossFieldRule` with `type: "conditional-required"` fires when the field identified
> by `predicateFieldId` has a stored value equal to `predicateValue` (string equality, not
> coerced). When the rule fires, the field identified by `targetFieldId` MUST be present and
> non-empty in the Record. A violation MUST be reported as a validation error.

> **[R4]** A `CrossFieldRule` with `type: "field-ordering"` fires when both `predicateFieldId`
> and `targetFieldId` are present and non-empty. It applies only to fields whose `valueType` is
> `"date"` or `"number"`. When `effect` is `"must-precede"`, the predicate field value MUST be
> strictly less than the target field value. When `effect` is `"must-follow"`, the predicate field
> value MUST be strictly greater than the target field value. A violation MUST be reported as a
> validation error. If either field is absent or empty, the rule MUST NOT fire (no error).

> **[R5]** A `CrossFieldRule` with `type: "mutual-exclusion"` MUST report a validation error
> if more than one field in `fieldIds` has a non-empty value in the Record. If zero or one field
> is non-empty, the rule passes without error.

> **[R6]** A `CrossFieldRule` with `type: "conditional-required"` MUST supply
> `predicateFieldId`, `predicateValue`, and `targetFieldId`. A rule that omits any of these three
> fields is malformed and MUST be reported as a Type-level validation error (not a record-level
> error).

> **[R7]** A `CrossFieldRule` with `type: "field-ordering"` MUST supply `predicateFieldId`,
> `targetFieldId`, and `effect`. A rule omitting any of these is malformed and MUST be reported
> as a Type-level validation error.

> **[R8]** A `CrossFieldRule` with `type: "mutual-exclusion"` MUST supply `fieldIds` with at
> least two UUID entries. A rule with fewer than two entries is malformed and MUST be reported as
> a Type-level validation error.

> **[R9]** An unknown value in the `type` enum (i.e. a value not in
> `["conditional-required", "field-ordering", "mutual-exclusion"]`) MUST be reported as a
> Type-level validation error. Implementations MUST NOT silently ignore unknown rule types.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/type.json` | Add `validationRules` optional property; add `CrossFieldRule` and `CrossFieldRuleEffect` $defs |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh` in srs-rust, after the `srs` release asset is published)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

**Note:** The schema change (Change A–C) is already present on `master` as of commit
`ef4313b` (`feat: add validationRules / CrossFieldRule schema for ext:cross-field-validation
(#242)`). This RFC provides the formal specification that gives it standing. The mirror sync to
srs-rust and srs-vscode is triggered by the release pipeline after this RFC PR merges.

---

## Rationale

**Why `additionalProperties: false` on `CrossFieldRule`.** Unknown keys in a rule object would
otherwise be silently swallowed, making schema evolution harder to reason about. Rejecting unknown
keys is consistent with how other $defs in `type.json` are defined (e.g. `FieldAssignment`,
`FieldAssignmentOverride`, `FieldGroup`) and gives authors immediate feedback on typos in rule
objects.

**Why a separate `CrossFieldRuleEffect` $def.** The enum `["must-precede", "must-follow"]` is
short but semantically distinct. A $def makes the string self-documenting and allows future rule
types to reuse it without copy-pasting the enum.

**Why only three rule types.** The three types (`conditional-required`, `field-ordering`,
`mutual-exclusion`) cover the concrete use cases surfaced during governance document authoring
(srs-rust#242). A fourth type can be added by a follow-up RFC if a concrete need arises. Keeping
the set small keeps evaluation logic tractable.

**Why field-ordering applies only to date/number fields.** String ordering is locale-dependent
and SRS fields do not carry a `valueType`-specific comparison semantics for strings. Restricting
to date/number where ordering is well-defined avoids ambiguous comparisons. A future RFC may
relax this if a concrete use case with a well-defined comparison semantics is presented.

---

## Alternatives Considered

### Alt A — Inline `CrossFieldRule` shape in the extension record body only

The current state before this RFC: the shape existed as prose TypeScript in the extension record.
Rejected: prose is not machine-validatable. Schema $defs are the authoritative contract.

### Alt B — Define `CrossFieldRule` in a separate schema file

A dedicated `cross-field-rule.json` file. Rejected: the rule is tightly coupled to `Type` (it
only appears in `Type.validationRules`). Embedding it as a `type.json` $def is consistent with how
other Type-specific shapes (e.g. `TypeLifecycle`, `FieldGroup`) are defined.

### Alt C — Allow unknown `type` values with a warning instead of an error

Would allow forward-compat where a newer client emits a rule type an older client can't evaluate.
Rejected: silent pass-through of unknown rules creates false safety — the author believes the rule
is enforced when it is not. R9 mandates a hard error; forward-compat must be handled via explicit
versioning.

---

## Open Questions

**None.** The shape is fully specified by the existing extension record and implementation
(srs-rust#242). All three rule types, their required fields, and evaluation semantics are
established.
