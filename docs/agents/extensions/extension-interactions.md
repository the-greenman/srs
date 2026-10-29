# Extension Interactions

> Declaring two named extensions together activates behavioural requirements that apply only when both are present in the same implementation.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

Declaring two named extensions together activates behavioural requirements that apply only when both are present in the same implementation.

**Notes**: These interactions are compositional constraints, not new extensions or new types: `ext:protocol` × `ext:addressability` and `ext:lifecycle` × `ext:addressability` (below) are the two currently defined. A pair may be formally independent yet functionally co-dependent for a given use; the requirement applies only where both are declared.

## ext:protocol × ext:addressability

Protocol stage advancement updates `AttentionState`. This governs an implementation declaring both `ext:protocol` and `ext:addressability`: when a Protocol run advances from one stage to another, the active `AttentionState` MUST reflect the new stage before any conversation material is tagged.

Specifically:

- `AttentionState.protocolRunId` references the active Protocol run
- `AttentionState.stageId` reflects the current stage
- `AttentionState.fieldId`, when a specific field is the current focus within a stage, is set accordingly

Conversation chunks produced while `AttentionState.stageId` is set are associated with that stage. This makes stage-level Context Queries (`{runId}/{stageId}`) return the correct material.


## ext:lifecycle × ext:addressability

**Status: Dormant** (removed under `rfc-decision-2a1e1590`, 2026-08-21). This coupling governs an implementation declaring both `ext:lifecycle` and `ext:addressability`: its required behaviour, and both of its invariants (formerly `[LC-AX1]` and `[LC-AX2]`), required a lifecycle state transition to produce a `Revision` snapshot per field value, tagged with `provenance.lifecycleTransition`. Every clause of this coupling was revision-dependent; with the per-field `Revision` mechanism removed (zero corpus use, incompletely specified: see `rfc-decision-2a1e1590`, also removed under the same ruling), no requirement survives the cut. `ext:lifecycle` and `ext:addressability` impose no cross-cutting obligation on each other while this stays dormant; each extension's own invariants are unaffected.

**Return trigger**: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface. When a real consumer's requirements are known, the coupling is redesigned against them, not reinstated as specified here.
