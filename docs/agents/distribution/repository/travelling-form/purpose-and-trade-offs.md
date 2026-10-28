# Purpose and trade-offs

> The JSON Store is valuable when portability matters more than human readability of individual files: emailing a repository, committing a snapshot to version control as a single artifact, embedding a …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

The JSON Store is valuable when portability matters more than human readability of individual files: emailing a repository, committing a snapshot to version control as a single artifact, embedding a repository in a test fixture, or transferring between systems without ZIP tooling.

The filesystem layout (`ext:repository`) is preferred when independent inspection of individual records, partial checkout, or per-file storage history is valuable.
