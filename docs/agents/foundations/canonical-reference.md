# Canonical reference

> How one definition points at another.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

How one definition points at another. The human-facing canonical string form is `namespace/name@version`, with `/` and `@` reserved as separators that may not appear inside a component or a name. The stored machine form is UUID-anchored: a bare UUID for a lineage reference, or an ExactTypeRef pairing `typeId` with an explicit `typeVersion` where the pointer must be version-exact. The string form is for display and is never what gets stored, so a rename never breaks a stored pointer.

**Examples**: `core/decision_statement@2`; `{ typeId: <uuid>, typeVersion: 3 }`

## A LINEAGE reference resolves to the highest installed version

**Number**: I-155

When the effective package set (the RFC-014 union of installed package versions, with the RFC-029 core package) holds more than one version of the definition named by a LINEAGE reference, an implementation MUST resolve the reference to the version with the highest `version`. This applies at every LINEAGE site of the Package export reference sites table, for every use of the reference (validation, rendering, type dispatch, discovery and Protocol execution), and for LINEAGE references made by every installed definition, including one reached only through a PINNED reference. An implementation MUST NOT let any of these change which version is selected: the order in which packages, package versions or definition files are listed or loaded; the package the referring definition belongs to; a package's SemVer version or pre-release status; import provenance; file timestamps; or any lifecycle state a definition record carries. The rule does not change whether a LINEAGE reference resolves: it resolves when any installed version holds its `id`. One definition carried by several packages whose files parse to equal JSON values is one definition; two definitions with the same `id` and `version` whose JSON values differ are an identity conflict, which an implementation MUST report as an error and MUST NOT settle by version or by any order. PINNED, KEYED and LOCATOR references are unaffected. (RFC-055 [R1]–[R3].)
