# Canonical reference

> How one definition points at another.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

How one definition points at another. The human-facing canonical string form is `namespace/name@version`, with `/` and `@` reserved as separators that may not appear inside a component or a name. The stored machine form is UUID-anchored: a bare UUID for a lineage reference, or an ExactTypeRef pairing `typeId` with an explicit `typeVersion` where the pointer must be version-exact. The string form is for display and is never what gets stored, so a rename never breaks a stored pointer.

**Examples**: `core/decision_statement@2`; `{ typeId: <uuid>, typeVersion: 3 }`
