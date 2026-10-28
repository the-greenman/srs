# checksum value in InstanceIndexEntry.checksum,…

> A checksum value in InstanceIndexEntry.checksum, SourceDocumentIndexEntry.sidecarChecksum, SourceDocumentIndexEntry.contentChecksum, or RelationsChecksumEntry.checksum must use the format <algorithm>…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 55

A checksum value in `InstanceIndexEntry.checksum`, `SourceDocumentIndexEntry.sidecarChecksum`, `SourceDocumentIndexEntry.contentChecksum`, or `RelationsChecksumEntry.checksum` must use the format `<algorithm>:<hex-encoded-digest>`. A value that does not include the `<algorithm>:` prefix is invalid.
