# byte-identical archive per implementation across invocations

> Given identical repository content, a conformant archive producer MUST produce a byte-for-byte identical .srs file across invocations of the same implementation.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-106

Given identical repository content, a conformant archive producer MUST produce a byte-for-byte identical `.srs` file across invocations of the same implementation. Cross-implementation byte identity is not guaranteed (I-105 allows implementation-defined Store/Deflate choice). Identical content means identical archive entry paths (forward-slash-normalised) and byte contents; filesystem timestamps, permissions, and host metadata are excluded and MUST NOT influence archive output.
