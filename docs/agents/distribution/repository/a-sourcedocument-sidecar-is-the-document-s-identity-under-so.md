# A SourceDocument sidecar is the document's identity under sourceDocumentsPath; absent content is a valid tombstone

> A SourceDocument sidecar present under sourceDocumentsPath is the document's identity (RFC-038 [R15]).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 52

A `SourceDocument` sidecar present under `sourceDocumentsPath` is the document's identity (RFC-038 [R15]). Its `contentPath` MUST resolve relative to `sourceDocumentsPath` (I-109) and MUST NOT traverse upward out of the sidecar's directory (I-110). A sidecar whose content file is absent is a valid tombstone, not an error: an implementation MUST NOT reject, refuse to load, or refuse to export a repository solely because of it, and MAY surface an informational, non-blocking diagnostic that the content is unavailable (I-112).
