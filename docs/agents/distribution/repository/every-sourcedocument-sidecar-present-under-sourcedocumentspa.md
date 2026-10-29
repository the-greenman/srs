# Every SourceDocument sidecar present under sourceDocumentsPath must…

> Every SourceDocument sidecar present under sourceDocumentsPath must have a contentPath that resolves to an existing content file in the same directory.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 52

Every `SourceDocument` sidecar present under `sourceDocumentsPath` must have a `contentPath` that resolves to an existing content file in the same directory. A sidecar whose `contentPath` does not resolve is invalid. A conforming producer must not emit such a sidecar; a conforming consumer must surface the resolution failure before processing any `SourceReference` pointing at that `documentId`.
