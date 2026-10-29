# sidecar must reside in same directory as its content file

> A sidecar MUST reside in the same directory as the content file it describes.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: I-110

A sidecar MUST reside in the same directory as the content file it describes. A `contentPath` that traverses upward (e.g., `../other/file.pdf`) is non-conformant.
