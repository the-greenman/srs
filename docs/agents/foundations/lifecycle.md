# Lifecycle

> A named state machine (a closed vocabulary of states plus the transitions between them and exactly one initial state) that a Type may declare inline or reference as an installed, shareable definition.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A named state machine (a closed vocabulary of states plus the transitions between them and exactly one initial state) that a Type may declare inline or reference as an installed, shareable definition. It governs where a Record stands in a process: draft, active, archived, or whatever the domain needs. Lifecycle state is changed only by an explicit transition act; asserting a Relation never moves it.

**Notes**: A state may declare that resting in it requires a satisfying Relation, enforced hard (the transition is rejected) or advisory (the transition proceeds and the unsatisfied state surfaces as an at-rest warning).

## Type.lifecycle.initialState must reference a key that appears in…

**Number**: 4

`Type.lifecycle.initialState` must reference a `key` that appears in `lifecycle.states[]` and where `isInitial === true`.


## Every from and to value in lifecycle.transitions[] must reference a…

**Number**: 5

Every `from` and `to` value in `lifecycle.transitions[]` must reference a `key` that appears in `lifecycle.states[]`.


## Record.lifecycleState, when present, must reference a key in the…

**Number**: 6

`Record.lifecycleState`, when present, must reference a `key` in the associated `Type.lifecycle.states[]`.


## A Record MUST NOT occupy a lifecycle state declaring requiresRelation without a satisfying Relation

**Number**: I-98

A Record MUST NOT rest in a lifecycle state that declares `requiresRelation` unless at least one Relation satisfies the obligation: its type equals one of the declared `relationType`(s) and the Record is the relation's target when `direction` is `incoming` (or omitted) or its source when `direction` is `outgoing`. When the state declares `enforcement: "hard"` (the default), an implementation MUST reject a lifecycle transition into it unless the operation, on completion, satisfies this occupancy requirement — either because a satisfying Relation already exists, or because the operation's fulfillment establishes one. The rejection MUST be machine-readable, identifying the target state key, the required relation type(s), and the direction. When the state declares `enforcement: "advisory"`, the transition MUST be permitted regardless of the obligation and the unsatisfied state surfaced only as an at-rest warning, never a rejection. (RFC-022 R1–R3, R2a.)


## Transition fulfillment is all-or-nothing

**Number**: I-99

A fulfillment supplied with a lifecycle transition MUST be applied as one all-or-nothing operation: `newRecord` creates a successor of the Record's Type in the effective lifecycle's initial state, asserts one Relation of the selected type oriented per `direction`, and transitions the Record; `existingInstanceId` asserts the Relation to the referenced instance (which MUST exist and MUST NOT be the Record itself) and transitions. If any step fails, no step's effect may remain observable. A file-backed implementation MAY realize this by write ordering in which the state change is committed last, provided every committed prefix is a valid repository under I-98. When the state declares an any-of `relationType` array, `fulfillment.relationType` MUST be one of the declared types, defaulting to the first; a `fulfillment` supplied for a target state that declares no `requiresRelation` MUST be rejected. (RFC-022 R4–R8.)


## requiresRelation is projected structurally and validated as a warning at rest

**Number**: I-100

Allowed-transitions projections MUST include the target state's `requiresRelation` declaration on each transition option whose target state declares one, so clients route successor-flow presentation from structure rather than state-name matching. Repository validation MUST emit a warning-severity diagnostic for every Record at rest that violates I-98, and MUST NOT treat such a violation as a hard validation error. Transitions whose target state declares no `requiresRelation` MUST behave exactly as before RFC-022. (RFC-022 R8–R10.)


## The `LifecycleState` shape

`LifecycleState`, in pseudo-IDL:

```typescript
{
  id: UUID                  // stable identity
  version: integer
  namespace: string
  key: string               // was name; the string stored in Record.lifecycleState
  label?: string
  description?: string
  aliases?: string[]
  isInitial?: boolean       // valid starting state for new Records
  isFinal?: boolean         // no outgoing transitions permitted (V9)
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active
  meta?: Record<string, unknown>
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```


## The `LifecycleTransition` shape

`LifecycleTransition`, in pseudo-IDL:

```typescript
{
  id: UUID                  // stable identity for lossless future migration
  name: string              // e.g. "promote", "approve", "supersede"
  from: string              // a LifecycleState.key in the effective state set
  to: string                // a LifecycleState.key in the effective state set
  description?: string
  meta?: Record<string, unknown>
}
```


## The `Lifecycle` container shape

`Lifecycle`, in pseudo-IDL:

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer          // min: 1

  states: LifecycleState[]
  transitions: LifecycleTransition[]
  initialState: string      // the key of the single isInitial state

  extendsLifecycleId?: UUID
  extendsLifecycleVersion?: integer   // required when extendsLifecycleId is present

  description?: string
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```


## The two lifecycle declaration forms a Type may carry

The inline form and the referenced form:

```typescript
// Inline (simple cases; cannot extend):
lifecycle?: {
  states: LifecycleState[]
  transitions: LifecycleTransition[]
  initialState: string
}

// Referenced (shared, installable):
lifecycleRef?: UUID        // LINEAGE reference (rfc-decision-c8704763) — resolves to an
                            // installed Lifecycle in the effective package set (V8)
```


## ext:lifecycle

**Required for**: governance tools, decision logs, any implementation where records progress through defined states.

`ext:lifecycle` is fully integrated with the vocabulary substrate (RFC-006). `Lifecycle` is an installable, referenceable container — a `VocabularyEntry` specialisation whose container holds states and transitions. `LifecycleState` satisfies the `VocabularyEntry` substrate contract with `key` (was `name`) as its key-role field.


## `LifecycleState` (VocabularyEntry specialisation)

Example: the `LifecycleState` shape.


## `LifecycleTransition` (edge between state keys)

Example: the `LifecycleTransition` shape.

`LifecycleTransition` is an edge, not a `VocabularyEntry` (no `key`), but carries `id` so it is addressable. It follows the same forward-compatibility policy as substrate entries: unknown top-level fields rejected; arbitrary metadata in `meta`.


## `Lifecycle` container

An installable, referenceable state machine — a closed vocabulary of states plus transitions.

Example: the `Lifecycle` container shape.

The distributable `Package` holds inline definitions: `lifecycles?: Lifecycle[]`. The repository `package/package.json` holds relative paths: `"lifecycles": ["lifecycles/foo.json", ...]`.


## Type lifecycle declaration (added by this extension)

`Type` gains a lifecycle, declared in exactly one of two mutually exclusive forms (V7):

Example: the two lifecycle declaration forms a Type may carry.

Declaring both is a validation error (V7). An inline lifecycle's effective state set is exactly its own `states`/`transitions`; V5 and V9 apply identically.


## Record lifecycle state

`Record.lifecycleState` must resolve to a state `key` in the Type's effective state set under V1.


## Validation invariants (V7–V9)

**V7 — Lifecycle exclusivity.** A Type declares exactly one of `lifecycle` or `lifecycleRef`.

**V8 — Lifecycle reference resolution.** A `lifecycleRef` must resolve to an installed `Lifecycle` in the effective package set.

**V9 — Lifecycle integrity.** Over the effective state set (V5):
- Exactly one state MUST have `isInitial: true`; `initialState` MUST reference that state's `key`.
- The initial state MUST have effective `status: active`. A lifecycle whose initial state is deprecated, tombstone, or retired is invalid.
- Every `transition.from`/`transition.to` must reference a state `key` in the effective state set.
- A state with `isFinal: true` MUST NOT appear as the `from` of any transition.
- Transition `id`s must be unique within the effective transition set.
- `Record.lifecycleState` resolves under V1.


## record successor derives an omitted relationType from the lifecycle, or rejects

**Number**: I-154

When `record successor` omits `relationType`, an implementation MUST derive it from the effective lifecycle of the predecessor's Type (at the successor's resolved type version): for every state whose `requiresRelation` has `enforcement` `hard` (the default) and `direction` `incoming` (the default), take the first declared `relationType` (the I-99 first-declared rule). If exactly one distinct type results it MUST be used; if none or several distinct types result, the operation MUST be rejected with a machine-readable error (naming the candidates when there are several) and neither the successor Record nor the Relation may be written. A supplied `relationType` MUST be used as given, and no relation type may come from any source other than a lifecycle declaration. (RFC-022 Revision 5, [R11]; amends Change B.)
