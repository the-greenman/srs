# Import / re-import semantics

> Import operations are identity-based, not path- or filename-based.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

Import operations are **identity-based**, not path- or filename-based. A consumer receiving an archive or syncing a live repository must never create a duplicate object solely because the archive path, filename, or repository directory name differs from what already exists locally.

**Repository identity**

`repositoryId` is the sync key for a repository. If an incoming repository has a `repositoryId` that already exists in the consumer's local store, the operation is a sync/update of that repository — not a new repository alongside it.

**Object-level identity rules**

Each object type has a stable identity key:

| Object | Identity key |
|--------|-------------|
| Note, Record | `instanceId` |
| Relation | `relationId` |
| Source document | `documentId` |
| Field definition | `id` + `version` |
| Type definition | `id` + `version` |
| Package | `packageId` + `packageVersion` |

Resolution rules for each incoming object:

- **Same key, same content** (or matching checksum): **no-op**. Do not write, overwrite, or create a duplicate.
- **Same key, different content** (or mismatched checksum): **conflict**. Surface the conflict explicitly. Silent overwrite is not conformant; silent discard is not conformant.
- **New key**: insert.

**Checksum-assisted comparison**

`InstanceIndexEntry.checksum`, `SourceDocumentIndexEntry.sidecarChecksum`, `SourceDocumentIndexEntry.contentChecksum`, and `relationsChecksums[*].checksum` allow fast no-op detection without reading file content. If an incoming checksum matches the locally stored checksum for the same identity key, the object is unchanged and the import step may skip it without further comparison.

Checksum format: `<algorithm>:<hex-encoded-digest>`. SHA-256 is strongly recommended: `sha256:<64-char-hex>`. The algorithm prefix makes the format self-identifying; other algorithms are permitted when both producer and consumer agree.

When checksums are absent, a conforming importer must compare content directly, or treat every write as idempotent if the implementation does not track prior state.

**Copy semantics**

To create an independent copy of a repository — not a sync — the importer must mint a **new `repositoryId`**. For inner objects, two strategies are valid:

1. **Preserve inner IDs**: the copy carries the same `instanceId`, `relationId`, and `documentId` values as the source. Appropriate for read-only snapshots and archive mirrors.
2. **Mint new inner IDs with lineage**: the copy mints fresh UUIDs and adds `derived-from` Relations from each new instance to the source `instanceId`. Appropriate when the copy will evolve independently.

An importer must not mix strategies within a single copy operation.
