# attachment_policy limit diagnostics at validate time

> A conformant implementation MAY enforce attachment_policy limits as hard rejections.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: I-107

A conformant implementation MAY enforce `attachment_policy` limits as hard rejections. If it does not, it MUST emit non-blocking warning diagnostics at `srs repo validate` time when: a source document content file exceeds `max_per_file_bytes` or `max_doc_bytes`; aggregate source-document bytes exceed `max_total_bytes`; an attached file's MIME type is not listed in `allowed_mime_types`. Non-blocking diagnostics MUST NOT prevent record storage or repository export.
