# Projection

> Rendered output is derived from records and is never itself a source of truth for them.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Projection](/agents/presentation/projection.md).

Rendered output is derived from records and is never itself a source of truth for them. A document, a table, an export, or a serialised copy is a view produced from the records on demand: rendering it again produces the same result, because nothing in it originates the meaning it shows.

A projection keeps a traceable line back to the records it renders. Editing the rendered artifact directly, instead of the records, creates a second copy of the meaning that the records no longer agree with, and the disagreement has no mechanical way to resolve.

View, Composition, and Theme are the constructs a projection is built from: View selects the presentation, Composition assembles what gets rendered, and Theme supplies the templates the rendering fills in. Each rests on the same rule: render the output, never author it directly.
