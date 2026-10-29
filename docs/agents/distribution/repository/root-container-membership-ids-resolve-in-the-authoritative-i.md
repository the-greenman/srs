# Root container membership ids resolve in the authoritative instance set

> Every entry instanceId in the root container's memberInstanceIds MUST resolve to a member of the repository's authoritative instance set ([R2]); rootInstanceIds is removed ([R4]).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: I-80

Every entry `instanceId` in the root container's `memberInstanceIds` MUST resolve to a member of the repository's authoritative instance set ([R2]); `rootInstanceIds` is removed ([R4]). The same resolution rule now applies to every container (Invariant 21 as amended), and a violation is repaired by the repair operation ([R20]).
