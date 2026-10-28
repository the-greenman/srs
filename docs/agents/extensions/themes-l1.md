# Themes L1

> Cost of Non-Adoption: Without it, Composition.themeRef and Composition.themeVariants must be ignored rather than applied — an implementation renders a document's semantic structure with no brand iden…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:themes-l1

**Status**: live

**Adds**: A visual presentation layer for `Composition`: brand identity, typography, stylesheets, cover pages, and element wrapping attached to a rendered document without altering its semantic structure. Requires `ext:views-l2`, whose document-level assembly it visually layers atop.

**Cost of Non-Adoption**: Without it, `Composition.themeRef` and `Composition.themeVariants` must be ignored rather than applied — an implementation renders a document's semantic structure with no brand identity, typography, stylesheet, cover page, or element-wrapping layer on top of it.
