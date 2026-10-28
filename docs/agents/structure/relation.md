# Relation

> A first-class, typed, independently identified assertion between two instances.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

A first-class, typed, independently identified assertion between two instances. It is always binary, a source and a target and never a set, and it always reads in one direction: source, relation type, target. Only the forward form is stored; the inverse is derived for display and never written. A Relation is a semantic claim carrying its own provenance, not a container, not ownership, and not a lifecycle act: asserting one never changes a state.

**Notes**: Relations are reserved for assertions with semantic consequence. A lightweight prose mention or citation must not be modelled as one (Invariant 17). Relations span tiers, so a Note may be the target of edges from the Records it became.

**Examples**: The canonical seven: `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`.

## In a Relation, sourceInstanceId is the asserting instance and…

**Number**: 16

In a `Relation`, `sourceInstanceId` is the asserting instance and `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target." This convention must not be reversed.


## Relation is reserved for assertions that carry semantic consequence…

**Number**: 17

`Relation` is reserved for assertions that carry semantic consequence beyond simple mention or citation. Lightweight prose references that do not assert structural, causal, or governance relationships must not be modelled as `Relation` records.


## How graduation is recorded

Graduation from a Note to a Record, or from one Record to a refined or split successor, is not itself a Relation type. It is recorded through the two Relation types the outcome calls for. Pure formalisation that keeps the same instance id needs no edge at all. Interpretation during formalisation that assigns a new instance id is recorded with `refines`, pointing back at what it formalises. A split into several Records, each with its own new instance id, is recorded with `derived-from` from each new Record back to the Note or Record it came from. Which edge applies follows what actually happened during formalisation, not a fixed rule attached to Graduation itself.
