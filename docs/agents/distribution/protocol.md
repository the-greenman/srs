# Protocol

> An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient, and which Record fields it feeds. Stages declare epistemic dependencies on other stages, and not an ordering: a stage may run when what it needs is established, regardless of where it sits in the declared sequence. Protocols range from loose ones that produce open material to tight ones converging on a specific Record type, and the output of a loose one is the input context for a tighter one.

**Notes**: A Protocol is a package definition, not an instance. It is an epistemic concern, deliberately separated from presentation: the logic that guides a session was removed from views and lives here.

## Every stageId in ProtocolStage.dependsOn[] must reference a stageId…

**Number**: 29

Every `stageId` in `ProtocolStage.dependsOn[]` must reference a `stageId` declared in the enclosing `Protocol.stages[]`. A stage may not declare a dependency on itself.


## Every fieldId in ProtocolStage.contributesTo[] must reference a…

**Number**: 30

Every `fieldId` in `ProtocolStage.contributesTo[]` must reference a `fieldId` that appears in the stage's own `outputType`'s effective field list (when `outputType` is declared), or in `Protocol.targetType`'s effective field list (when `outputType` is absent). A single stage must not contribute to both its own `outputType` and the enclosing `Protocol.targetType`. When neither `outputType` nor `Protocol.targetType` is declared, `contributesTo` must be empty.


## For every pair of stages A and B within a Protocol where B.dependsOn…

**Number**: 31

For every pair of stages A and B within a `Protocol` where B.dependsOn includes A.stageId, B.order must be greater than A.order. `order` is the declared composition order of the stages — structure, not presentation; it provides the render default. Execution sequence is determined by `dependsOn` resolution. The two must not contradict each other.


## The `FieldRef` shape

`FieldRef`, in pseudo-IDL:

```typescript
{
  fieldId: UUID
  typeId?: UUID    // which Type this Field appears in
}
```


## The `ProtocolStage` shape

`ProtocolStage`, in pseudo-IDL:

```typescript
{
  stageId: string       // stable key within this Protocol
  name: string          // short, human-readable stage name (e.g. "Background", "Key requirements")
  order: integer        // min: 0; declared composition order of the stages — see note below
  purpose?: string      // what understanding this stage builds
  question?: string     // the core question this stage answers
  dependsOn: string[]   // stageId values; epistemic dependencies, not just ordering
  completionCriteria?: string  // how to know this stage is sufficient to proceed
  contributesTo?: FieldRef[]   // which Record Fields this stage feeds
  outputType?: UUID            // LINEAGE reference (rfc-decision-c8704763) to the Type this stage
                                // produces its own intermediate Record as; the effective
                                // package set resolves it. typeVersion is dropped — version-
                                // optional hybrids are forbidden.
  aiGuidance?: AiGuidance       // the closed, structured guidance object used everywhere else in
                                // the model (purpose/extraction/negativeGuidance/examples) — not a
                                // plain string (rfc-decision, srs#379: structured over serialised).
}
```


## The `Protocol` shape

`Protocol`, in pseudo-IDL:

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description?: string

  targetType: UUID | ""
  // The Record type this Protocol produces — a LINEAGE reference (bare UUID;
  // rfc-decision-c8704763), never the canonical namespace/name@version form (that is
  // DISPLAY-only and is never stored). Empty string for loose / exploratory Protocols
  // (Brain Dump, Decomposition) whose output is input context for a tighter Protocol.

  stages: ProtocolStage[]

  tags?: string[]
  createdAt: ISO8601
}
```


## A Protocol chain for a governance decision

Three Protocols in sequence, from brain dump to Decision Record. Non-normative:

```
Brain Dump Protocol (loose, no targetType)
  → AttentionState: { containerId: C1 }
  → Produces: Note N1 (unstructured brainstorm)

Decomposition Protocol (loose, targetType: Component)
  → AttentionState: { containerId: C1, recordId: N1 }
  → Produces: Notes N2, N3, N4  [derived-from N1]

Decision Protocol (tight, targetType: Decision)
  → AttentionState: { containerId: C1, protocolRunId: R1, stageId: "criteria" }
  → Stage "criteria" produces: Options Analysis Record R-OA  [derived-from N2, N3]
  → Stage "decision" produces: Decision Record R-D           [derived-from R-OA]

Conversation chunks produced during Decision stage:
  chunk-42: { AttentionState: { containerId: C1, recordId: R-OA, fieldId: F-criteria, ... } }
  chunk-43: { AttentionState: { containerId: C1, recordId: R-D, fieldId: F-outcome, ... } }

Context query for R-D / F-outcome:
  → Field aiGuidance from Decision Type + outcome Field
  → Current value for F-outcome
  → Chunks tagged with { recordId: R-D, fieldId: F-outcome } — chunk-43
  → Chunks tagged with { recordId: R-D } — broader session context
  → Related Records via Relations — R-OA via derived-from
```


## ext:protocol

**Required for**: facilitation tools, structured deliberation, any implementation that guides users through epistemic stages.

Replaces `TemplateFacilitationStep` from v1. Protocol is epistemically richer: stages have explicit dependencies, completion criteria, and may produce intermediate Records.


## `FieldRef`

A reference to a Field within a Type.

Example: the `FieldRef` shape.


## `ProtocolStage`

A named stage in a Protocol. Stages have epistemic dependencies (`dependsOn`) — not just ordering. A stage may only proceed when its dependencies are sufficient.

Example: the `ProtocolStage` shape.

**`order` vs `dependsOn`:** `order` is the declared composition order of the stages — structure, not presentation (RFC-015's layering table now states this explicitly as its own row: composition order is structure; display order is presentation; sequence is assertion). It provides the render default for how stages are shown in a UI or facilitation guide; a View may override for display. Execution sequence is determined by `dependsOn` resolution: a stage runs when all its declared dependencies are satisfied, regardless of its `order` value. Authors must ensure `order` is consistent with the partial order implied by `dependsOn` (i.e. a stage's `order` value should be greater than the `order` of any stage it depends on). See Invariant 31.


## `Protocol`

An epistemically ordered process for building quality Records through structured conversation or facilitation. A Protocol is a package definition (declared in `package.json`'s `protocols` array, stored under the package's `protocols/` subtree) — not an instance Record.

Example: the `Protocol` shape.

**Property names are unprefixed** (`id`, not `protocolId`; `stages`, not `protocolStages`; and so on) — the same convention every other package-declared definition entity uses (Type, Field, Vocabulary, Lifecycle, RelationTypeDefinition, Theme, Blueprint all reuse the shared `id`/`namespace`/`name`/`version`/`description`/`createdAt` fields unprefixed). An earlier owed-schema pass (`docs/schema/2.0/protocol.json`, #297/#378) had shipped a `protocol`-prefixed shape matching the implementation of the day; a decision record ruled the unprefixed shape canonical (srs#379) and the schema now matches this prose. The implementation-side rename (the Rust `Protocol`/`ProtocolStage` structs, the CLI, and one still-vendored example corpus) is a tracked follow-up, staged like any other rename (rfc-decision-628cf6c4) — this prose and the schema describe the ruled target shape, not necessarily every artifact's current byte-for-byte content.

**The Protocol spectrum:**

```
Loose                                                    Tight
─────────────────────────────────────────────────────────────
Brain Dump → Decomposition → Options Analysis → Decision
```

Loose Protocols produce open material. Tight Protocols converge on a specific Record type. The output of a loose Protocol is the input context for something tighter.

**Generic Protocols** (reusable across domains):
- Brain Dump — externalise all thinking without constraint
- Decomposition — identify major components from raw material
- Review — what is established, what is still open
- Prioritisation — which components to resolve first

**Domain-specific Protocols** (target a specific Record type):
- Decision — context → criteria → options → evaluation → decision
- Proposal — problem → solution shape → constraints → proposal

**Protocol chaining and provenance**: The output of one Protocol is the input context for the next. This derivation chain is traceable through `derived-from` Relations, making the quality and history of the final Record auditable.

**Non-normative example — Protocol chain for a governance decision:**

Example: a Protocol chain for a governance decision.

The final Decision Record is auditable because every Protocol stage left addressable artefacts. The quality of the outcome is traceable to the conversation that produced it.

Views (`ext:views-l1`) no longer contain facilitation logic. A View is a presentation concern; a Protocol is an epistemic one.
