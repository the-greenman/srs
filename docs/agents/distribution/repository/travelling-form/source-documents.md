# Source documents

> Binary source document content is not included in the JSON Store.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

Binary source document content is not included in the JSON Store. An implementation converting from a filesystem repository to `.srsj` must omit source document content files and should surface the omission to the user. Source document sidecars (`.meta.json`) may be included in `data` if they are pure JSON; their content files must not be.
