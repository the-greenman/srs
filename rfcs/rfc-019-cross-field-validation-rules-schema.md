> **GitHub issue**: [the-greenman/srs#139](https://github.com/the-greenman/srs/issues/139)

# RFC-019: Cross-Field Validation Rules — `validationRules` on `Type` and `CrossFieldRule` Schema

**Status**: Accepted (Revision 3)
**Affects**: `docs/schema/2.0/type.json`; `ext:cross-field-validation` (extension record `c16793d7-005a-58d2-88d0-9e7d9b4967b1`); spec invariants I-10 (`e1000010`) and I-11 (`e1000011`)
**Author**: the-greenman (from issue the-greenman/srs#139)
**Date**: 2026-07-09
**Builds on**: none

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-09 | Initial draft — formalises the `validationRules` property and `CrossFieldRule` shape. |
| 2 | 2026-07-09 | Address review findings. **Blocking:** (a) add R0 extension declaration gate; qualify R1–R10 to implementations declaring `ext:cross-field-validation`; (b) add Spec Record Changes section enumerating new invariant records; (c) add explicit non-date/non-number → error clause to R4. **Should-fix:** add "non-empty" definition; add R10 for wrong-context field presence → error; add predicateFieldId valueType restriction to R6; add ext:type-inheritance non-inheritance clause as R11; cross-reference I-10 and I-11. **Nits:** fix "Temporal direction" → "Ordering direction"; add rationale for fail-all evaluation; add rationale for no JSON Schema if-then-else. |
| 3 | 2026-07-09 | Implementation started; RFC file committed to branch `rfc/019-cross-field-validation-rules-schema`; schema fix applied ("Temporal direction" → "Ordering direction" in `CrossFieldRuleEffect`). |
| 4 | 2026-07-09 | Accepted; spec records authored (I-85–I-93) in `srs/srs/records/tier-2/`; extension record `c16793d7` updated to reference RFC-019; spec rendered and release-drift check passed. |

---

## Abstract

The `ext:cross-field-validation` extension was added to the SRS spec (extension record
`c16793d7-005a-58d2-88d0-9e7d9b4967b1`) to handle constraints that span more than one Field in a
Record. The extension describes a `CrossFieldRule` shape and a `validationRules` property on Type,
but no formal JSON Schema $def existed for those shapes in `docs/schema/2.0/type.json`. This RFC
formalises the schema, provides normative conformance rules for implementations, and adds spec
invariant records that pin the three rule types, their required fields, and evaluation semantics.

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
      "description": "Ordering direction for a field-ordering rule."
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
  "description": "Ordering direction for a field-ordering rule: the predicate field value must be less than (must-precede) or greater than (must-follow) the target field value."
}
```

### Change D — Required field table (normative)

| Rule `type` | MUST supply | MUST NOT supply |
|---|---|---|
| `conditional-required` | `predicateFieldId`, `predicateValue`, `targetFieldId` | `effect`, `fieldIds` |
| `field-ordering` | `predicateFieldId`, `targetFieldId`, `effect` | `predicateValue`, `fieldIds` |
| `mutual-exclusion` | `fieldIds` (min 2 UUIDs) | `predicateFieldId`, `predicateValue`, `targetFieldId`, `effect` |

Presence of a "MUST NOT supply" property on a rule that does not use it MUST be reported as a
Type-level validation error (see R10).

---

## Definitions

**Non-empty.** For purposes of R3, R4, and R5: a field is *non-empty* if its `FieldValue` entry
is present in the Record's `fieldValues` array AND its `value` is neither `null` nor an empty
string (`""`). When `ext:repeatable-fields` is declared and `FieldAssignment.repeatable` is `true`
for a field, that field is non-empty if its `entries` array is present and contains at least one
entry.

---

## Conformance Rules

R0–R11 apply only to conforming implementations that declare support for `ext:cross-field-validation`.

> **[R0]** `ext:cross-field-validation` is an opt-in extension. An SRS implementation that does
> not declare support for this extension MUST treat `validationRules` as an unrecognized property
> and MUST ignore it. R1–R11 bind only implementations that declare support for
> `ext:cross-field-validation`.

> **[R1]** A conforming implementation that declares support for `ext:cross-field-validation` MUST
> parse the `validationRules` array on a Type definition when it is present, and MUST validate
> each element against the `CrossFieldRule` $def. Any element that violates the schema (unknown
> property key, disallowed `type` value, non-UUID `fieldId`) MUST be reported as a Type-level
> validation error.

> **[R2]** A conforming implementation MUST evaluate each `CrossFieldRule` in `validationRules`
> against every Record of the Type at record-write time (create and update). Evaluation order
> within the array is implementation-defined; all rules MUST be evaluated regardless of earlier
> failures (fail-all, not fail-first).

> **[R3]** A `CrossFieldRule` with `type: "conditional-required"` fires when the field identified
> by `predicateFieldId` is non-empty (see Definitions) and its stored value is equal to
> `predicateValue` (case-sensitive string equality). When the rule fires, the field identified by
> `targetFieldId` MUST be non-empty in the Record. A violation MUST be reported as a validation
> error.

> **[R4]** A `CrossFieldRule` with `type: "field-ordering"` fires when both `predicateFieldId`
> and `targetFieldId` are non-empty. It applies only to fields whose `valueType` is `"date"` or
> `"number"`. When `effect` is `"must-precede"`, the predicate field value MUST be strictly less
> than the target field value (ISO 8601 lexicographic order for dates; numeric order for numbers).
> When `effect` is `"must-follow"`, the predicate field value MUST be strictly greater than the
> target field value. A violation MUST be reported as a validation error. If either field is
> non-empty but the other is absent or empty, the rule MUST NOT fire. A `field-ordering` rule
> whose `predicateFieldId` or `targetFieldId` resolves to a field with `valueType` other than
> `"date"` or `"number"` MUST be reported as a Type-level validation error.

> **[R5]** A `CrossFieldRule` with `type: "mutual-exclusion"` MUST report a validation error
> if more than one field in `fieldIds` is non-empty in the Record. If zero or one field is
> non-empty, the rule passes.

> **[R6]** A `CrossFieldRule` with `type: "conditional-required"` MUST supply `predicateFieldId`,
> `predicateValue`, and `targetFieldId`. Additionally, the field identified by `predicateFieldId`
> MUST have a `valueType` in `{"string", "text", "select", "date", "url"}` (types whose stored
> `value` is always a string, enabling meaningful string equality comparison). A rule that omits
> any of the three required fields, or whose `predicateFieldId` resolves to a field with any other
> `valueType`, MUST be reported as a Type-level validation error. (Normative restatement of I-11
> `e1000011`, extending it with the `valueType` constraint.)

> **[R7]** A `CrossFieldRule` with `type: "field-ordering"` MUST supply `predicateFieldId`,
> `targetFieldId`, and `effect`. A rule omitting any of these MUST be reported as a Type-level
> validation error. (Normative restatement of I-11 `e1000011`.)

> **[R8]** A `CrossFieldRule` with `type: "mutual-exclusion"` MUST supply `fieldIds` with at
> least two UUID entries. A rule with fewer than two entries MUST be reported as a Type-level
> validation error. (Normative restatement of I-11 `e1000011`.)

> **[R9]** A `CrossFieldRule` with a `type` value not in
> `["conditional-required", "field-ordering", "mutual-exclusion"]` MUST be reported as a
> Type-level validation error. Implementations MUST NOT silently ignore unknown rule types.

> **[R10]** A `CrossFieldRule` that contains a property in the "MUST NOT supply" column for its
> `type` (see Change D) MUST be reported as a Type-level validation error.

> **[R11]** `validationRules` are not inherited. A Type's `validationRules` array is the complete
> and exclusive set of cross-field rules evaluated for Records of that Type. When `ext:type-inheritance`
> is in use and Type B extends Type A, Type A's `validationRules` MUST NOT be evaluated for
> Records of Type B unless Type B's own `validationRules` explicitly restates them.

**Relationship to existing invariants.** I-10 (`e1000010`) requires all `fieldId` values in any
`CrossFieldRule` to appear in the Type's effective field list. I-11 (`e1000011`) requires the
per-rule required fields (aligned with R6–R8 above). R6–R8 are normative restatements of I-11
that add explicit error-reporting requirements; neither supersedes the existing invariant records.
This RFC supplements I-10 and I-11 with additional conformance rules (R0–R9, R10–R11) covering
evaluation semantics, unknown-type errors, wrong-context fields, and the inheritance boundary.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/type.json` | Add `validationRules` optional property; add `CrossFieldRule` and `CrossFieldRuleEffect` $defs; update `effect` property and `CrossFieldRuleEffect` description from "Temporal" to "Ordering" direction |

**Note:** Changes A–C are already present on `master` as of commit `ef4313b`. The description
fix (Change C, "Temporal" → "Ordering") will be applied on the RFC branch. Mirror sync to
`srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` is triggered by the
release pipeline after this RFC PR merges.

---

## Spec Record Changes

The following spec records in `srs/srs/` are created or updated by Stage 6 of this RFC:

| Action | Type | Summary |
|---|---|---|
| Update | `com.semanticops.spec/extension` record `c16793d7` | Add note referencing RFC-019 as the formal specification of the shape described in the body; no body text change required. |
| Create | `com.semanticops.spec/invariant` | R0 — extension gate: implementations not declaring `ext:cross-field-validation` MUST ignore `validationRules`. |
| Create | `com.semanticops.spec/invariant` | R2 — fail-all evaluation: all rules in `validationRules` MUST be evaluated regardless of earlier failures. |
| Create | `com.semanticops.spec/invariant` | R3 — `conditional-required` evaluation: fires on string equality match of predicate field value against `predicateValue`; target MUST be non-empty. |
| Create | `com.semanticops.spec/invariant` | R4 — `field-ordering` evaluation: predicate value must be </>target value; only date/number fields; non-date/non-number reference → Type-level error. |
| Create | `com.semanticops.spec/invariant` | R5 — `mutual-exclusion` evaluation: at most one `fieldId` field non-empty. |
| Create | `com.semanticops.spec/invariant` | R6 extension — `conditional-required` predicate field `valueType` restriction: MUST be in `{string, text, select, date, url}`. |
| Create | `com.semanticops.spec/invariant` | R9 — unknown `type` value → Type-level error. |
| Create | `com.semanticops.spec/invariant` | R10 — wrong-context field presence → Type-level error. |
| Create | `com.semanticops.spec/invariant` | R11 — `validationRules` not inherited under `ext:type-inheritance`. |

All new invariant records are placed in `srs/srs/records/invariants/` with `precedes` relations
establishing their order relative to I-10 (`e1000010`) and I-11 (`e1000011`). `instanceId` values
are minted at record-creation time (Stage 6).

---

## Rationale

**Why `additionalProperties: false` on `CrossFieldRule`.** Unknown keys in a rule object would
otherwise be silently swallowed, making schema evolution harder to reason about. Rejecting unknown
keys is consistent with how other $defs in `type.json` are defined (e.g., `FieldAssignment`,
`FieldAssignmentOverride`, `FieldGroup`) and gives authors immediate feedback on typos.

**Why a separate `CrossFieldRuleEffect` $def.** The enum `["must-precede", "must-follow"]` is
short but semantically distinct from an inline string. A $def makes the purpose self-documenting
and allows future rule types to reuse it without copy-pasting the enum.

**Why only three rule types.** The three types cover the concrete use cases surfaced during
governance document authoring (srs-rust#242). A fourth type can be added by a follow-up RFC.

**Why field-ordering applies only to date/number fields.** String ordering is locale-dependent and
`valueType: "string"/"text"` fields have no defined collation in SRS. Restricting to date (ISO
8601 lexicographic) and number (numeric) where ordering is unambiguous avoids divergent
implementations.

**Why fail-all evaluation (R2).** Fail-all ensures authors see all constraint violations in a
single pass rather than fixing issues one at a time. An implementation that halts on the first
failure would mask subsequent violations, requiring repeated iterations to surface the complete
error set.

**Why per-rule required fields are not enforced in JSON Schema.** JSON Schema `if-then-else` or
`oneOf` could enforce per-rule required fields at schema-validation time, but would require three
mutually exclusive schema branches, one per rule type. This adds $def complexity without meaningful
gain — R6–R8 already require conforming implementations to report missing required fields as
Type-level errors, which is a stronger and more informative check than a schema-validation-only
failure.

**Why restrict `conditional-required` predicate fields to string-comparable valueTypes (R6).**
`predicateValue` is always a `string` in the schema. SRS stores `number` values as JSON numbers and
`boolean` values as JSON booleans; string equality of `"42"` against `42` or `"true"` against
`true` always yields false. Authoring a `conditional-required` rule with a number or boolean
predicate field would produce a schema-valid rule that silently never fires. Restricting to
`{string, text, select, date, url}` — types whose stored `value` is always a JSON string — ensures
the comparison is always meaningful.

**Why `validationRules` are not inherited (R11).** Type inheritance via `ext:type-inheritance`
merges the field list; it does not imply rule inheritance. Inheriting rules silently from base
Types would make a derived Type's validation semantics depend on reading the full inheritance chain,
which is non-local and error-prone. If rule reuse is needed, the author must declare the rules
explicitly on the derived Type.

---

## Alternatives Considered

### Alt A — Inline `CrossFieldRule` shape in the extension record body only

The state before this RFC: the shape existed as prose TypeScript in the extension record.
Rejected: prose is not machine-validatable. Schema $defs are the authoritative contract.

### Alt B — Define `CrossFieldRule` in a separate schema file

A dedicated `cross-field-rule.json` file. Rejected: the rule is tightly coupled to `Type` (it
only appears in `Type.validationRules`). Embedding as a `type.json` $def is consistent with how
other Type-specific shapes (e.g., `TypeLifecycle`, `FieldGroup`) are defined.

### Alt C — Allow unknown `type` values with a warning instead of an error

Would allow forward-compat where a newer client emits a rule type an older client cannot evaluate.
Rejected: silent pass-through of unknown rules creates false safety — the author believes the rule
is enforced when it is not. R9 mandates a hard error; forward-compat must be handled via explicit
versioning.

### Alt D — Coerce stored non-string values to string for `conditional-required` comparison

Would allow number and boolean predicate fields by stringifying their stored value before comparing
to `predicateValue`. Rejected: coercion rules are locale-dependent and non-obvious; different
implementations may disagree on how to stringify numbers (decimal precision, locale). Restricting
to string-valued fields (R6) is unambiguous.

---

## Open Questions

**None.** The ext:type-inheritance interaction was flagged in review and is resolved by R11
(no inheritance). All other shape, evaluation, and error-reporting questions are settled.
