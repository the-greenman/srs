# Type specialisation

> Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own. The governing constraint is substitutability — a system that knows the base Type but not the specialisation must still be able to read the inherited fields and should preserve the unknown ones instead of discarding them. A specialisation may therefore tighten an inherited optional field to required, but never relax a required one, and may never alter Field semantics.

**Notes**: Inheritance chains must be acyclic (Invariant 39). Only some properties cascade up the ancestor chain — the effective identity field does; the explicit field order does not.

## Type.extendsTypeId, when present, must reference a valid Type.id.

**Number**: 39

`Type.extendsTypeId`, when present, must reference a valid `Type.id`. Inheritance chains must be acyclic; a Type may not directly or transitively extend itself.


## specializing Type must not declare a fieldId in its own fields[] that…

**Number**: 40

A specializing Type must not declare a `fieldId` in its own `fields[]` that duplicates any `fieldId` inherited from its base Type or any ancestor Type.


## When Type.fieldOrder is present, it must contain exactly the set of…

**Number**: 41

When `Type.fieldOrder` is present, it must contain exactly the set of field UUIDs in the Type's effective field list. No UUID may appear more than once, and no UUID from the effective field list may be absent.


## Every fieldId in Type.fieldAssignmentOverrides[] must reference a…

**Number**: 42

Every `fieldId` in `Type.fieldAssignmentOverrides[]` must reference a field inherited from the base Type or an ancestor Type. Overrides must not reference fields declared in the specializing Type's own `fields[]`, must not alter Field semantics, and must not relax an inherited required field from `true` to `false`.


## When ext:type-inheritance is declared, Package.dependencyRefs must…

**Number**: 43

When `ext:type-inheritance` is declared, `Package.dependencyRefs` must include a `Reference` for every Type in the transitive closure of base Types for any Type in `Package.types[]`. If `mode === "bundled"`, all such base Types must be present in `types[]`, each unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## validationRules are not inherited; a derived Type's own validationRules are the complete set

**Number**: I-97

`validationRules` are not inherited. A Type's `validationRules` array is the complete and exclusive set of cross-field rules evaluated for Records of that Type. When `ext:type-inheritance` is in use and Type B extends Type A, Type A's `validationRules` MUST NOT be evaluated for Records of Type B unless Type B's own `validationRules` explicitly restates them. (RFC-019 R11.)


## The properties `ext:type-inheritance` adds to a Type

The properties this extension adds to `Type`, in pseudo-IDL:

```typescript
{
  extendsTypeId?: UUID
  // UUID of the base Type this Type specializes.
  // When present, the effective field list consists of inherited fields
  // followed by this Type's own fields[], unless fieldOrder is present.

  extendsTypeVersion?: integer
  // Version of the base Type targeted by this specialization.

  fieldOrder?: UUID[]
  // Optional explicit ordering of all fields in the effective field list:
  // inherited fields plus this Type's own fields[].
  // This is an ordering declaration only; it does not re-declare field
  // assignments or change Field semantics.

  fieldAssignmentOverrides?: FieldAssignmentOverride[]
  // Presentation and workflow overrides for inherited fields only.

  identityFieldId?: UUID
  // RFC-020 — names one fieldId from this Type's effective field set
  // (own fields plus inherited fields) as the record's identity/display
  // field. Cascades across the ancestor chain independently of
  // fieldOrder (see `identityFieldId` below).
}
```


## The `FieldAssignmentOverride` shape

`FieldAssignmentOverride`, in pseudo-IDL:

```typescript
{
  fieldId: UUID
  displayLabel?: string
  displayHint?: string
  required?: boolean
}
```


## A governance decision Type specialising a core decision Type

A specialising Type and the fields it adds to its base.

```text
Type: core/decision
  fields: decision_statement, context, rationale, options_considered

Type: org.example/governance_decision
  extendsTypeId: core/decision
  adds: ratification_method, quorum_threshold, voting_record
```


## `identityFieldId`

**Required for**: Type libraries that need formal specialization while preserving base-Type processability.

Defines single inheritance for Types. A specializing Type inherits the fields and semantics of a base Type, may add fields, and remains processable as the base Type by systems that know the base Type but not the specialization.

When `ext:type-inheritance` is in use, `Type` gains:

Example: the properties `ext:type-inheritance` adds to a Type.


## identityFieldId

Names one field, from the Type's effective field set, as the record's identity/display field: the field a conformant implementation SHOULD use to resolve a Record's display label (e.g. in list, tree, discovery, and container views), in preference to any implementation-specific heuristic (Rule [N+36]).

`identityFieldId` MUST reference a `fieldId` present in the Type's effective field set (Rule [N+33]).

**Inheritance is cascading, unlike `fieldOrder`.** The *effective* `identityFieldId` of a Type is its own `identityFieldId`, if declared; otherwise, the effective `identityFieldId` of its base Type, resolved transitively up the ancestor chain; otherwise absent (Rule [N+32], [N+34]). A Type overrides an inherited effective `identityFieldId` by declaring its own, which need not match the base Type's and MAY point at a field the Type itself adds. This differs from `fieldOrder`, which is read only from the Type being resolved and does not search the ancestor chain when absent: `identityFieldId`'s inheritance rule is specific to this property, not a reuse of `fieldOrder`'s behavior.

`identityFieldId` scopes to Tier 2 Records only; it has no defined meaning for Tier 0 (Note) instances, which carry no Type binding (Rule [N+35]).

**Interaction with `DocumentSection.titleFieldId` (`ext:views-l2`).** For any `DocumentSection`/record pairing where the section's `titleFieldId` is absent, or is declared but does not resolve within the record's Type's effective field set, whether that section's field content renders via the Default Rendering Baseline or a dispatched L1 View, implementations SHOULD render the per-record heading using the value of the field named by the record's Type's effective `identityFieldId`, if present, in place of omitting the heading. `titleFieldId`, when it resolves within the record's Type's effective field set, MUST continue to take precedence for that section's per-record heading (Rule [N+37], amended RFC-020 Rev 7, srs#728; see `ext:views-l2` § Heading Hierarchy). This is distinct from a `titleFieldId` that resolves to a field present in the effective field set but fails the eligibility test: that case still omits the heading with no identity fallback (unchanged, srs-rust PR #341).


## `FieldAssignmentOverride`

Overrides presentation or workflow constraints for an inherited Field in a specializing Type. It does not change the Field's semantics.

Example: the `FieldAssignmentOverride` shape.

`displayLabel` and `displayHint` are presentation-only. `required` may tighten an inherited optional field (`false` to `true`) for the specializing Type. It must not relax an inherited required field (`true` to `false`), because a Record instantiated against the specializing Type must remain valid when processed as the base Type.

The effective field list for a specializing Type is the inherited effective field list of its base Type plus the specializing Type's own `fields[]`. A specializing Type must not duplicate an inherited `fieldId` in its own `fields[]`.

Example:

Example: a governance decision Type specialising a core decision Type.

A system that knows `core/decision` but not `org.example/governance_decision` can still read the inherited decision fields. The specializing fields are unknown extension content to that system and should be preserved rather than discarded.
