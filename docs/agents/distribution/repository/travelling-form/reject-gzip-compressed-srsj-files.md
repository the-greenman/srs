# reject gzip-compressed .srsj files

> A conformant implementation MUST reject a gzip-compressed file presented as a .srsj JSON Store.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-108

A conformant implementation MUST reject a gzip-compressed file presented as a `.srsj` JSON Store. Detection is by content inspection: a file whose first two bytes are `0x1f 0x8b` MUST be treated as gzip-compressed regardless of its filename or MIME type.
