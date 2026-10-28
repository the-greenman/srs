# Repository mutability and semantic evolution

> SRS repositories may evolve over time.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

SRS repositories may evolve over time. Mutation policy is tiered:

- Notes may be edited in place; `updatedAt` advances when the file's semantic content changes.
- Tier 2 Records may receive non-semantic corrections in place; `updatedAt` advances.
- Semantic changes to Tier 2 Records create a new Record linked to the prior Record by `refines` or `supersedes`.

Storage history does not replace semantic history. A filesystem backup, archive timestamp, or application log may prove that a JSON file changed, but SRS Relations express what the change means. A conforming repository implementation must not treat storage history as a substitute for `supersedes`, `refines`, `derived-from`, lifecycle state, or object timestamps.
