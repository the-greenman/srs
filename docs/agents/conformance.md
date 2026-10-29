# Conformance

> What an implementation must satisfy to claim SRS conformance, core and per-extension, and how that claim is declared and checked.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Extensions](/agents/extensions.md).

What an implementation must satisfy to claim SRS conformance, core and per-extension, and how that claim is declared and checked.

What an implementation claims and what that claim obliges it to do, declared as the core plus the extensions it supports. Core conformance requires the Foundation and Distribution groups in full and enforcement of the core invariants; declaring an extension obliges accepting and validating its types, enforcing its invariants, and honouring its declared dependencies. The claim is what makes exchange predictable: two implementations at the same level produce definitions the other can consume.

**Notes**: Partial support is not conformance — an implementation that can produce archives but not consume them must say so explicitly. Receiving content from an unsupported extension calls for surfacing and preserving it, never silently discarding it.

#### ext:discovery conformance requires passing structured-filter fixture scenarios

**Number**: I-123

An implementation that declares `ext:discovery` MUST pass all structured-filter conformance scenarios (`exactMatch: true`) from the fixture at `srs/conformance/discovery/scenarios.json`, returning exactly the `expectedInstanceIds` set for each such scenario. When a scenario also carries an `expectedSegments` expectation, the implementation's Text Projection for the named field of the named instance MUST additionally match the expected segment sequence exactly in count and order — testing I-120's list-cardinality rule ("one segment per array element in order") that `expectedInstanceIds` alone cannot express. (RFC-012 R11; srs#483.)


#### ext:discovery conformance requires passing content-match fixture scenarios

**Number**: I-124

An implementation that declares `ext:discovery` MUST pass all content-match conformance scenarios (`exactMatch: false`) from the fixture at `srs/conformance/discovery/scenarios.json` — its result set for each such scenario MUST be a superset of the scenario's `expectedInstanceIds`. (RFC-012 R12.)



An implementation declares conformance using the following form:

Example: the conformance declaration form.

#### The conformance declaration form

The declaration form, then a filled declaration:

```
SRS <version> Core [+ ext:<name> ...]
```

Example:
```
SRS 2.0 Core + ext:lifecycle + ext:protocol + ext:views-l1 + ext:addressability + ext:recommended-relations
```


#### The self-contained profile declaration

The conformance string a self-contained repository declares:

```
SRS 2.0 Core + ext:repository (self-contained)
```


#### Core conformance requirements

A core-conformant implementation MUST:
- Accept and validate `Field`, `Type`, `Record` (Tier 2), `Relation`, and `Container` inputs against this specification
- Enforce Invariants 1–3, 7–9, 16–18, 20–21, 28, 38
- Support the Foundation and Distribution groups in full
- Implement the namespace format and reference format correctly
- Not accept `relationType` strings that include `/` except in `namespace/name` format
- **Closed-vocabulary resolution (V1):** Resolve every value participating in a closed vocabulary to exactly one installed entry in the effective entry set before accepting a write. Non-resolving values are validation errors. This rule applies to:
  - `Relation.relationType`: resolved against the repo-global `RelationTypeDefinition` set (RFC-005 E1 is a named instance of V1)
  - `select`/`multiselect` field values: resolved against the Field's effective closed `Vocabulary`
  - `Record.lifecycleState`: resolved against the Type's effective lifecycle state set
- Enforce the effective entry set construction (V5): retire entries excluded before uniqueness; `extends*Version` mismatches are hard errors.
- Enforce inline and referenced lifecycle integrity (V9).
- Enforce `select`/`multiselect` field binding exclusivity and closedness (V3).

Support for `Note` (Tier 0) is optional at core conformance level.


#### Extension conformance requirements

An implementation declaring a given extension MUST:
- Accept and validate all types defined by that extension
- Enforce all invariants assigned to that extension
- Respect the declared dependency chain (e.g., `ext:views-l2` requires `ext:views-l1` to also be declared)

`ext:recommended-relations` is retired as of RFC-005. It no longer owns any normative semantics. Implementations MUST NOT treat it as a capability gate: the canonical relation vocabulary is now mandatory core behaviour provided by the `com.semanticops.srs` package.


#### ext:repository conformance requirements

An implementation declaring `ext:repository` MUST:
- Produce repositories with a `.srs` marker and `manifest.json` at root, with content in the prescribed folder layout
- Maintain no `instanceIndex` in the manifest: it is retired (RFC-038 [R2]); membership is the instance set enumerated from the tree (RFC-038 [R1])
- Produce archives that satisfy all self-containment requirements (Invariants 49 and 51)
- Consume archives by parsing the manifest first and resolving all instances via the repository's authoritative instance set, enumerated from the tree (RFC-038 [R1]), before processing content
- Resolve `SourceReference` entries with `sourceType: "repository-document"` via the sidecar in `sourceDocumentsPath`
- Enforce Invariants 45–55
- Require no TSS, Protocol, Addressability infrastructure, or external registry when `PackageRef.mode === "local"`. The repository is fully operable with only its own files.

An implementation that can produce archives but not consume them (or vice versa) MUST declare this limitation explicitly. Partial repository support is not conformant.


#### ext:repository (self-contained) profile

A named stricter profile for standalone, offline-operable repositories:

Example: the self-contained profile declaration.

An implementation declaring this profile MUST satisfy all `ext:repository` conformance requirements and additionally:

- `packageRef` MUST be present with `mode: "local"`. Absent or external package references are not permitted.
- The local package MUST be `mode: "bundled"` (Invariant 50 is always in effect).
- No external registry, TSS, Protocol stack, Addressability infrastructure, AttentionState, or live conversation store is required or assumed. The repository directory (or archive) is the complete and sufficient deployment unit.
- An archive produced under this profile MUST be openable and fully processable by a consumer with no prior installation, no network access, and no running services.

This profile is appropriate for: standalone tools, file-based backups, air-gapped or offline deployments, inter-organisational exchange, and any context where zero-dependency portability is required.


#### Interoperability note

Two implementations at the same conformance level produce compatible definitions for exchange. An implementation receiving a Package that includes types or fields from an extension it does not support should surface the unknown content, preserve it where possible, and pass it through instead of silently discarding it.

Two implementations both declaring `ext:repository` MUST be able to exchange archives without data loss. An archive produced by one conforming implementation MUST be consumable by any other conforming implementation at the same SRS version.



### Validation

Checking data against the contracts its own definitions declare, and reporting what fails as severity-tagged diagnostics, never as a crash. Contracts come from several places: a Field's own value constraints, cross-field rules that only make sense over two or more Fields together, vocabulary resolution, reference resolution, and the specification's invariants. Diagnostics are reported, not thrown — a command that ran successfully and a repository that is valid are two different questions, and conflating them hides the second.

**Notes**: An invariant states the rule; validation is the act of checking it, so an invariant that is never checked and a validation pass that consults no invariant are both incomplete on their own. Cross-field rules are the Type's own complete and exclusive set: they are never inherited by value from a base Type (Invariant I-97).

#### All fieldId values in any CrossFieldRule within…

**Number**: 10

All `fieldId` values in any `CrossFieldRule` within `Type.validationRules[]` must appear in the Type's effective field list. Cross-field rules cannot reference Fields outside the Type.


#### conditional-required rule must supply predicateFieldId,…

**Number**: 11

A `conditional-required` rule must supply `predicateFieldId`, `predicateValue`, and `targetFieldId`. A `field-ordering` rule must supply `predicateFieldId`, `targetFieldId`, and `effect`. A `mutual-exclusion` rule must supply `fieldIds` with at least two entries.


#### ext:cross-field-validation is opt-in; implementations not declaring it MUST ignore validationRules

**Number**: I-89

An SRS implementation that does not declare support for `ext:cross-field-validation` MUST treat `validationRules` as an unrecognized property and MUST ignore it. Conformance rules R1–R11 bind only implementations that declare support for `ext:cross-field-validation`. (RFC-019 R0.)


#### All CrossFieldRules in validationRules MUST be evaluated regardless of earlier failures (fail-all)

**Number**: I-90

A conforming implementation that declares support for `ext:cross-field-validation` MUST evaluate each `CrossFieldRule` in `validationRules` against every Record of the Type at record-write time (create and update). Evaluation order within the array is implementation-defined; all rules MUST be evaluated regardless of earlier failures (fail-all, not fail-first). (RFC-019 R2.)


#### conditional-required rule fires on string equality; target field MUST be non-empty when rule fires

**Number**: I-91

A `CrossFieldRule` with `type: "conditional-required"` fires when the field identified by `predicateFieldId` is non-empty and its stored value is equal to `predicateValue` (case-sensitive string equality). When the rule fires, the field identified by `targetFieldId` MUST be non-empty in the Record. A violation MUST be reported as a validation error. (RFC-019 R3.)


#### field-ordering rule applies only to date/number fields; non-date/non-number reference is a Type-level error

**Number**: I-92

A `CrossFieldRule` with `type: "field-ordering"` fires when both `predicateFieldId` and `targetFieldId` are non-empty. It applies only to fields whose `fieldType.datatype` is `"date"`, `"date-time"`, `"number"`, or `"integer"`. When `effect` is `"must-precede"`, the predicate field value MUST be strictly less than the target field value (ISO 8601 lexicographic order for dates; numeric order for numbers). When `effect` is `"must-follow"`, the predicate field value MUST be strictly greater than the target field value. A violation MUST be reported as a validation error. If either field is non-empty but the other is absent or empty, the rule MUST NOT fire. A `field-ordering` rule whose `predicateFieldId` or `targetFieldId` resolves to a field with any other `fieldType.datatype` MUST be reported as a Type-level validation error. (RFC-019 R4.)


#### mutual-exclusion rule MUST report error if more than one listed field is non-empty

**Number**: I-93

A `CrossFieldRule` with `type: "mutual-exclusion"` MUST report a validation error if more than one field in `fieldIds` is non-empty in the Record. If zero or one field is non-empty, the rule passes. (RFC-019 R5.)


#### conditional-required predicateFieldId MUST resolve to an effective-single string/date/date-time Field

**Number**: I-94

A `CrossFieldRule` with `type: "conditional-required"` MUST supply `predicateFieldId`, `predicateValue`, and `targetFieldId`. The field identified by `predicateFieldId` MUST be effective-single (`fieldType.cardinality` absent/`"single"` and, until #242 Phase B, effective `FieldAssignment.repeatable !== true`) and its `fieldType.datatype` MUST be one of `{"string", "date", "date-time"}`. String `format` and `valueDomain` do not restrict eligibility. A rule that omits a required property, selects a list/repeatable field, or resolves to any other datatype MUST be reported as a Type-level validation error. Admission of `date-time` is intentional; the scalar requirement intentionally closes the legacy repeatable-date equality hole. (RFC-019 R6; RFC-032 Rev-7 erratum; normative extension of I-11.)


#### CrossFieldRule with unrecognized type value MUST be reported as a Type-level error; unknown types MUST NOT be silently ignored

**Number**: I-95

A `CrossFieldRule` with a `type` value not in `["conditional-required", "field-ordering", "mutual-exclusion"]` MUST be reported as a Type-level validation error. Implementations MUST NOT silently ignore unknown rule types. (RFC-019 R9.)


#### CrossFieldRule property present for wrong rule type MUST be reported as a Type-level error

**Number**: I-96

A `CrossFieldRule` that contains a property belonging to a different rule type MUST be reported as a Type-level validation error. Specifically: a `conditional-required` or `field-ordering` rule MUST NOT supply `fieldIds`; a `mutual-exclusion` rule MUST NOT supply `predicateFieldId`, `predicateValue`, `targetFieldId`, or `effect`. (RFC-019 R10.)


#### The `ValidationRule` shape

`ValidationRule`, in pseudo-IDL:

```typescript
{
  type: "required" | "minLength" | "maxLength" | "pattern" | "enum"
  value?: string | number | string[]  // required for minLength, maxLength, pattern, enum
  message?: string
}
```


#### The `CrossFieldRule` shape

`CrossFieldRule`, in pseudo-IDL:

```typescript
{
  type: "conditional-required" | "field-ordering" | "mutual-exclusion"
  message?: string

  // conditional-required: targetFieldId becomes required when predicateFieldId equals predicateValue
  predicateFieldId?: UUID
  predicateValue?: string
  targetFieldId?: UUID

  // field-ordering: targetFieldId must precede or follow predicateFieldId
  // Applies only to fields with datatype "date", "date-time", "number", or "integer".
  effect?: "must-precede" | "must-follow"

  // mutual-exclusion: at most one of the listed fields may have a non-empty value
  fieldIds?: UUID[]   // min: 2
}
```


#### ext:cross-field-validation

> **Formalised by**: RFC-019 (srs#139). The `CrossFieldRule` shape and `validationRules` property are formally specified by RFC-019; refer to it for normative conformance rules (R0–R11).

**Required for**: Types with constraints that span multiple Fields.

`ValidationRule` handles single-field constraints. `CrossFieldRule` handles constraints that require evaluating more than one Field together.


#### `CrossFieldRule`

Example: the `CrossFieldRule` shape.

| Rule type | Required fields |
|---|---|
| `conditional-required` | `predicateFieldId`, `predicateValue`, `targetFieldId` |
| `field-ordering` | `predicateFieldId`, `targetFieldId`, `effect` |
| `mutual-exclusion` | `fieldIds` (min 2) |

When `ext:cross-field-validation` is in use, `Type` gains `validationRules?: CrossFieldRule[]`.


#### `ValidationRule`

A constraint applied to a field value.

Example: the `ValidationRule` shape.



### Extension

An independently adoptable capability module, identified by an `ext:` name, declaring what it adds, what it depends on, and which invariants it owns. Extensions are how the specification grows without forcing every implementation to grow with it: no extension is required for core conformance, and an implementation adopts only what it needs. An implementation that does not declare one must ignore its properties instead of erroring on them, so data using an extension still loads where the extension is unknown.

**Notes**: Some extensions declare hard dependencies on others. A pair may also be formally independent yet functionally co-dependent for a given use, and cross-extension behavioural requirements apply only where both are declared.


### Invariant

A numbered normative statement that must hold of conforming data and conforming implementations, assigned to core or to the extension that owns it. Invariants are where the specification's obligations are stated once and cited from everywhere else, so a rule has one home instead of several drifting restatements. An invariant is the statement; checking it is validation, and the two are deliberately distinct.

**Notes**: See Validation for how a conforming implementation checks an invariant and reports the result as a diagnostic.

**Examples**: Invariant 16 fixes relation direction; Invariant 20 keeps container ids out of the instance id space; Invariant 2 forbids a Type restating a Field's semantics.
