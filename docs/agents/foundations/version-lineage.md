# Version lineage

> A positive integer scoped to one UUID's history, expressing how a definition has evolved while remaining the same definition.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A positive integer scoped to one UUID's history, expressing how a definition has evolved while remaining the same definition. Version increments within the lineage; changing the `namespace` or the `name` is not a version bump but a new definition with a new UUID. A bump is required whenever a downstream consumer's extraction, validation or governance behaviour would differ — notably any change to `fieldType` or to the meaning of `aiGuidance`. Reworded prose alone needs no bump.

**Notes**: Package versions are semver strings and are a different axis: a package at 1.3.0 may carry `decision_statement@3` and `context@2`.

## A referenced Type version is not deletable

**Number**: I-137

A Type version referenced by any instance in the repository MUST NOT be deleted. Name-keying makes the Record-to-Field edge Type-mediated: `fieldId` is recovered from `typeId` + `typeVersion` + key, so deleting the pinned Type version renders every instance of it unreadable. This rule governs versions with live referents only. (RFC-039 [R19])
