# Slice closure boundary resolves against the container set

> Slice closure boundary resolves against the container set: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-152

`slice.spec.id` MUST identify a `containerId` present in the repository's tree-authoritative container enumeration (RFC-038 [R1]), not a manifest `containerIndex`, which is retired (RFC-038 [R2]). A validator applying the RFC-026 Change E relaxations MUST NOT require that enumeration to be complete for a partial slice's included sub-containers, and MUST NOT treat that incompleteness as an error. (RFC-026 [R5] (a), Change E item 3, amended by RFC-038 [R25].)
