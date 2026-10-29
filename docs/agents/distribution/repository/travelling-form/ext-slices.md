# ext:slices

> A container slice carries the records reachable from a container's membership, their type and field definitions, intra-slice relations, and referenced source documents.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Required for**: implementations that export a subset of a repository as a standalone, independently openable `.srs` archive (a *slice*).

A container slice carries the records reachable from a container's membership, their type and field definitions, intra-slice relations, and referenced source documents. It is a valid `.srs` archive in the RFC-017 format — any SRS tool can open, validate, and render it.
