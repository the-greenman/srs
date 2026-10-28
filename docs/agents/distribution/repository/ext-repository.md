# ext:repository

> Defines the SRS Live Repository Format: a normative directory layout, manifest, and file conventions for SRS content stored on a filesystem.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Required for**: any implementation that stores SRS content as files, produces sharable SRS archives, or supports interoperable export and import.

Defines the **SRS Live Repository Format**: a normative directory layout, manifest, and file conventions for SRS content stored on a filesystem. The **SRS Archive** — the shareable export format — is a self-contained snapshot of a live repository packaged as a ZIP file. The live repository is the working format; the archive is the export. Both are defined here because an archive is structurally identical to a repository snapshot.

A conforming implementation must be able to round-trip between a live repository and an archive without data loss.
