# `ExportConfig`

> Configuration for rendering a Record through this View as an exportable document.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

Configuration for rendering a Record through this View as an exportable document. One shared shape, attached at two points (srs#525): here on `View`, and on `Composition` (`ext:views-l2`) for document-level rendering. Neither attachment overrides the other — each governs its own render context. See `ext:views-l2`'s *L1/L2 ExportConfig* note for how the two coexist when a Composition section dispatches to a View.

Example: the `ExportConfig` shape.
