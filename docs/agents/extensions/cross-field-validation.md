# Cross-Field Validation

> Cross-Field Validation: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:cross-field-validation

**Status**: live

**Adds**: `CrossFieldRule` and the `validationRules` property, for Type constraints that span more than one Field — `ValidationRule` alone only handles single-field constraints. Formally specified by RFC-019 (srs#139), which states the normative conformance rules (R0–R11).

**Cost of Non-Adoption**: Without it, a Type can constrain each Field individually via `ValidationRule` but cannot express or enforce a constraint that depends on more than one Field's value together.
