# Slices

> Exporting a subset of a repository, scoped to a container's membership, as a standalone, independently openable .srs archive (a slice).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:slices

**Status**: live

**Adds**: Exporting a subset of a repository, scoped to a container's membership, as a standalone, independently openable `.srs` archive (a *slice*). A slice carries the records reachable from the container, the packages those records use (each whole and unchanged, with its own identity), intra-slice Relations, and referenced source documents — a valid RFC-017 `.srs` archive that any SRS tool can open, validate, and render on its own.

**Cost of Non-Adoption**: Without it, an implementation cannot produce a standalone, independently openable subset of a repository scoped to a container; a consumer who needs only part of a repository must be given the whole repository, or a bespoke, non-conformant export.
