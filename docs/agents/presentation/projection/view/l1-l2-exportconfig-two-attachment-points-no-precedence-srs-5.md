# L1/L2 ExportConfig — two attachment points, no precedence (srs#525)

> There is no property either attachment "wins": Composition.exportConfig.format is the only format that applies in section rendering because it is the only one describing that concern; a dispatched Vi…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

`ExportConfig` (ext:views-l1) is one shared shape attached at two points: `View.exportConfig` and `Composition.exportConfig`. Each attachment governs its own render context; neither overrides the other, because they never describe the same concern:

- **`Composition.exportConfig`** governs this Composition's document-level rendering: `format` (all section rendering, superseding nothing because a dispatched View's own `format` simply has no effect here), and the document `preamble` (rendered once, before all sections).
- **A dispatched L1 View's `exportConfig`** (`DocumentSection.renderViewId`/`typeDispatch`), when set, continues to govern *that View's own render context* — rendering one record through it — independently of the Composition it's dispatched within: its `preamble` renders before that record's field values (not the document preamble), and its `omitEmptyFields` controls that record's absent-field rendering.

There is no property either attachment "wins": `Composition.exportConfig.format` is the only format that applies in section rendering because it is the only one describing that concern; a dispatched View's `exportConfig.format` describes a different concern (that View's own standalone-rendering format, when it is rendered outside any Composition) that section rendering never consults.

When a dispatched View's `exportConfig.preamble` renders inside a section, the variable `{{heading-3}}` is available, resolving to heading prefix at level `3 + depthOffset`. In standalone export context (that View rendered outside any Composition), `{{heading-3}}` MUST resolve to the empty string — implementations MUST NOT emit the literal token.
