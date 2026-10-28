# Slice relation-endpoint tests resolve against the instance set

> A conformant slice producer MUST NOT place a relation in the archive's relations collection when its sourceInstanceId or targetInstanceId is absent from the repository's tree-authoritative instance e…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-153

A conformant slice producer MUST NOT place a relation in the archive's relations collection when its `sourceInstanceId` or `targetInstanceId` is absent from the repository's tree-authoritative instance enumeration (RFC-038 [R1]), not a manifest `instanceIndex`, which is retired (RFC-038 [R2]); such relations belong in `slice.externalRelationRefs[]` instead. A validator applying the RFC-026 Change E relaxations MUST NOT treat an `externalRelationRefs` UUID absent from that enumeration as an error. (RFC-026 [R6], Change E item 1, amended by RFC-038 [R25].)
