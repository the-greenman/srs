# Type

> A named, versioned, UUID-identified composition of Fields describing one kind of semantic object.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A named, versioned, UUID-identified composition of Fields describing one kind of semantic object. A Type declares which Fields participate, in what order, and which are required — and nothing more about them, because Field semantics are the Field's. Its effective field list is its own declared assignments, plus inherited ones when it specialises another Type. A Type is a definition, not an instance: what conforms to it is a Record.

**Notes**: Extensions hang optional facets off the Type without changing that: a lifecycle declaration, cross-field rules, a base Type to specialise, an identity field.

## Field.name uniqueness within a Type's effective field set

**Number**: I-131

Within a Type's effective field set — its own `fields`, plus fields contributed through `extendsTypeId` — every referenced `Field.name` MUST be distinct. An implementation MUST reject a Type that violates this at definition time, not at instance time. (RFC-039 [R4])


## Field assignment

The entry by which a Type admits one Field: a reference to the Field by id, its declared composition order within the Type, whether it is required before a Record can be logged, and an optional display label. It is the exact boundary between what belongs to the Field and what belongs to the Type — the assignment may say where the Field sits and whether it must be filled, and may never say what it means. `displayLabel` is strictly rendering: needing a materially different label means needing a different Field.

**Notes**: `order` is structure, not presentation. It feeds canonical serialisation and supplies the render default; a View may override it for display.

### FieldAssignment.displayLabel and FieldAssignment.displayHint are for…

**Number**: 1

`FieldAssignment.displayLabel` and `FieldAssignment.displayHint` are for rendering only. They must not affect AI guidance, extraction logic, `fieldType` interpretation, or validation. Extended by RFC-036 [CR-036-20]: they must also not affect a Record's Relations or its Discovery Text Projection (`ext:discovery`). Two repositories differing only in these values must produce identical validation results and identical Discovery output.



## The two lifecycle declaration forms on a Type

The inline form and the referenced form:

```typescript
// Inline — simple cases; effective set is own states/transitions only:
lifecycle?: { states: LifecycleState[]; transitions: LifecycleTransition[]; initialState: string }

// Referenced — shared, installable Lifecycle:
lifecycleRef?: UUID        // LINEAGE reference (rfc-decision-c8704763) — resolves to an
                            // installed Lifecycle in the effective package set (V8)
```


## `FieldAssignment`

A named, versioned composition of Fields for a specific semantic object type.

See *Generated reference: `Type`* for `Type`'s current property table (including the extension-owner column, RFC-031 OQ1), optional pseudo-IDL, and a link to the raw JSON Schema (RFC-040 Change J / #274 ratified ledger). This prose no longer hand-duplicates the property list, including the extension-owned facets it could previously only gesture at as comments.


## FieldAssignment

A Field reference within a Type. Declares this field's composition order and requiredness within the Type, without redefining field semantics.

See the `FieldAssignment` appendix table in *Generated reference: `Type`* for the current property list.

`displayLabel` is strictly for rendering. If a materially different label or meaning is needed, a distinct Field with its own lineage is required.

Cardinality is a property of the referenced Field (`fieldType.cardinality`, RFC-032 [R4]); the former assignment-level `repeatable`/`minItems`/`maxItems` trio is removed (RFC-039 [R7], I-134).

The Type's effective field list is `fields[]` unless `ext:type-inheritance` is declared and the Type extends another Type. In that case, the effective field list also includes inherited fields as defined by `ext:type-inheritance`.

**AI guidance composition order** (recommended):

1. Type framing (`Type.aiGuidance.extraction`) — establishes the semantic object type
2. View framing (`View.aiGuidance.extraction`, if `ext:views-l1` is in use) — workflow-specific context
3. Field extraction guidance (`Field.aiGuidance.extraction`)
4. Negative guidance (`Field.aiGuidance.negativeGuidance`)
5. Examples (`Field.aiGuidance.examples`)

This is a recommended default, not a required invariant. Implementations that compose differently will produce different AI behaviour from the same definitions.

**On instance migration when a Type version changes:**
A Record binds to a specific `typeVersion` at creation time. Existing Records do not automatically migrate when a new Type version is published. Conformance is measured against the version the Record was instantiated under. When a Record is migrated and exchanged, it should carry the version it now conforms to, and the original Record should be preserved and linked via a `supersedes` Relation.


## `lifecycleRef` — referencing shared lifecycle definitions

When `ext:lifecycle` is in use, a Type declares a lifecycle in exactly one of two mutually exclusive forms (V7):

Example: the two lifecycle declaration forms on a Type.

Declaring both is a validation error. An inline lifecycle cannot extend; use `lifecycleRef` when the same state machine is needed across multiple Types.
