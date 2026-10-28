# JSON Store

> A single-file, self-contained JSON serialization of a complete SRS repository (.srsj), carrying identical semantic content to the filesystem repository layout defined by ext:repository.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

A single-file, self-contained JSON serialization of a complete SRS repository (`.srsj`), carrying identical semantic content to the filesystem repository layout defined by `ext:repository`. A conforming implementation must be able to convert between the two losslessly.

**Notes**: Preferred over the filesystem layout when portability matters more than per-file inspection: emailing a repository, committing a snapshot as one artifact, or embedding a test fixture.
