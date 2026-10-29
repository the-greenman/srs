# Dangling-edge policy

> Cross-boundary relations MUST NOT appear in the slice's relations collection.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

Cross-boundary relations MUST NOT appear in the slice's relations collection. They MUST be recorded in `slice.externalRelationRefs[]` with `relationId`, `sourceInstanceId`, `targetInstanceId`, and `relationType`. A non-empty list is provenance data, not a validation error. The `relationType` value in `externalRelationRefs` entries is NOT subject to RFC-005 definition-lookup in the slice archive.
