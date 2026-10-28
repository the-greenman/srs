# Projection

> The principle that rendered output is derived from records and never the source of truth for them.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation](/agents/presentation.md).

Pages under this one:

- [renderedPresentations default selection and compositionId resolution](/agents/presentation/projection/renderedpresentations-default-selection-and-compositionid-re.md): When manifest.renderedPresentations is present and non-empty, a conformant viewer MUST select as the default presentation the first entry whose isDefault is true.
- [Projection](/agents/presentation/projection/projection.md): Rendered output is derived from records and is never itself a source of truth for them.
- [View](/agents/presentation/projection/view.md): A named, versioned presentation over a set of Fields: which field rows appear, in what display order, under what labels, with what editor hints, and whether each is visible.
- [Composition](/agents/presentation/projection/composition.md): A container-level projection that assembles many instances into one readable document: an ordered set of sections, each selecting its members by a structured query or by container membership, each re…
- [Theme](/agents/presentation/projection/theme.md): A visual presentation layer attached to a rendered document (stylesheets, typography, assets, cover pages and templates that wrap each structural level of output), declared for named output formats a…

The principle that rendered output is derived from records and never the source of truth for them. Records hold the meaning; a document, a table, an export, a JSON serialisation are all views onto that meaning, produced on demand and discardable. A projection must keep a clear line back to canonical meaning and must never quietly become a second semantic source, which is what happens when someone edits the rendered artifact instead of the records.

**Notes**: Its practical consequence throughout the specification: presentation concerns live in the view layer, never on the Type. A rendering label, a display order or a renderer choice may never affect validation, extraction, Relations or discovery output.
