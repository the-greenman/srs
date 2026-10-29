# deterministic-ZIP archive production

> A conformant archive producer MUST produce deterministic ZIP archives: entries sorted byte-lexicographically by forward-slash-normalised path, last mod timestamps zeroed (0x0000), compression method …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-105

A conformant archive producer MUST produce deterministic ZIP archives: entries sorted byte-lexicographically by forward-slash-normalised path, `last mod` timestamps zeroed (`0x0000`), compression method Deflate (8) or Store (0) only with consistent per-file choice across invocations, `extra` fields empty, Language encoding flag (bit 11) set to 1.
