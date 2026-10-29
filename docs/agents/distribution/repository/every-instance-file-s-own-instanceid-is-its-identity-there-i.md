# Every instance file's own instanceId is its identity; there is no…

> Every instance file discovered under a reserved instance root MUST declare an instanceId, and that self-declared value is the instance's identity.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 46

Every instance file discovered under a reserved instance root MUST declare an `instanceId`, and that self-declared value is the instance's identity. There is no manifest index entry to cross-check it against — `RepositoryManifest.instanceIndex` is retired (RFC-038 [R2]) and the repository's authoritative store, enumerated from the tree, is the instance set (RFC-038 [R1]).
