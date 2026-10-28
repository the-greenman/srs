# View

> A named, versioned presentation over a set of Fields: which field rows appear, in what display order, under what labels, with what editor hints, and whether each is visible.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Projection](/agents/presentation/projection.md).

Pages under this one:

- [Every fieldId in View.fieldViews[] must reference a valid Field.id](/agents/presentation/projection/view/every-fieldid-in-view-fieldviews-must-reference-a-valid-fiel.md): Every fieldId in View.fieldViews[] must reference a valid Field.id in the effective package set.
- [FieldView.displayLabel, FieldView.displayHint, and…](/agents/presentation/projection/view/fieldview-displaylabel-fieldview-displayhint-and.md): The FieldView.displayLabel, FieldView.displayHint, and… section of the specification.
- [View must not override, redefine, or duplicate the semantic content…](/agents/presentation/projection/view/view-must-not-override-redefine-or-duplicate-the-semantic-co.md): A View must not override, redefine, or duplicate the semantic content of any Field or Type it references.
- [The html multi-entry field row](/agents/presentation/projection/view/the-html-multi-entry-field-row.md): One div, one label, and one list item per entry:
- [ext:views-l1](/agents/presentation/projection/view/ext-views-l1.md): Defines Views — versioned presentations over a field set.
- [`FieldView`](/agents/presentation/projection/view/fieldview.md): A field reference within a View.
- [`RecordPropertyView` (RFC-041)](/agents/presentation/projection/view/recordpropertyview-rfc-041.md): A sibling row kind to FieldView in the same View.fieldViews[] list.
- [Conformance Rules (RFC-041)](/agents/presentation/projection/view/conformance-rules-rfc-041.md): [R1] A View's row list (fieldViews[]) admits two mutually exclusive row kinds discriminated by the presence of fieldId (FieldView) XOR property (RecordPropertyView); a row item carrying neither key, …
- [JSON projection (RFC-041 Revision 4)](/agents/presentation/projection/view/json-projection-rfc-041-revision-4.md): The JSON projection (RFC-041 Revision 4) section of the specification.
- [`ExportConfig`](/agents/presentation/projection/view/exportconfig.md): Configuration for rendering a Record through this View as an exportable document.
- [`View`](/agents/presentation/projection/view/view.md): A versioned presentation and export configuration over a field set.
- [Composite rendering — renderer dispatch (RFC-036)](/agents/presentation/projection/view/composite-rendering-renderer-dispatch-rfc-036.md): composite-range Field (fieldType.datatype: "ref", mode: "inline") to a named composite renderer.
- [Composite baseline rendering](/agents/presentation/projection/view/composite-baseline-rendering.md): A composite-range Field that resolves to no renderer — unbound per [CR-036-6], or fallen back per
- [The `table` renderer](/agents/presentation/projection/view/the-table-renderer.md): Roles, with their owning Type and required fieldType:
- [Conformance Rules (RFC-036)](/agents/presentation/projection/view/conformance-rules-rfc-036.md): [CR-036-1] A renderer identifier MUST match ^([a-z][a-z0-9-]*|[a-z0-9-]+(\.[a-z0-9-]+)+/[^/]+)$.
- [`SectionSource`](/agents/presentation/projection/view/sectionsource.md): Defines how a section's instances are selected from a Container.
- [`DocumentSection`](/agents/presentation/projection/view/documentsection.md): One section in a Composition.
- [`CompositeRendererDirective` (RFC-036)](/agents/presentation/projection/view/compositerendererdirective-rfc-036.md): A CompositeRendererBinding (ext:views-l1) plus the composite-range Field it binds.
- [`RelationsPresentation` (RFC-027)](/agents/presentation/projection/view/relationspresentation-rfc-027.md): Opt-in per-section display of each rendered member's Relations as a links block.
- [`NavigationLink`](/agents/presentation/projection/view/navigationlink.md): An assembly-time cross-section link in a Composition.
- [`ThemeReference`](/agents/presentation/projection/view/themereference.md): A pointer to a Theme (ext:themes-l1).
- [`ThemeVariant`](/agents/presentation/projection/view/themevariant.md): A named alternative theme selectable at render time instead of Composition.themeRef.
- [`Composition`](/agents/presentation/projection/view/composition.md): A versioned, Container-level projection.
- [Heterogeneous Section Rendering](/agents/presentation/projection/view/heterogeneous-section-rendering.md): A container-subset section can mix Record Types: it draws all Container members, ordered by the container's arrangement (an arranged section) or by the precedes chain (Rule [N+12], a rule section).
- [Default Rendering Baseline](/agents/presentation/projection/view/default-rendering-baseline.md): When DocumentSection.renderViewId is absent, implementations MUST render each instance using the following baseline.
- [L1/L2 ExportConfig — two attachment points, no precedence (srs#525)](/agents/presentation/projection/view/l1-l2-exportconfig-two-attachment-points-no-precedence-srs-5.md): There is no property either attachment "wins": Composition.exportConfig.format is the only format that applies in section rendering because it is the only one describing that concern; a dispatched Vi…
- [Heading Hierarchy](/agents/presentation/projection/view/heading-hierarchy.md): For format: "markdown", "html", or "adoc":
- [Preamble Template Variables](/agents/presentation/projection/view/preamble-template-variables.md): Standard variables in Composition.exportConfig.preamble:
- [Theme Variant Selection (ext:themes-l1)](/agents/presentation/projection/view/theme-variant-selection-ext-themes-l1.md): When ext:themes-l1 is declared and a variant name is supplied at render invocation:

A named, versioned presentation over a set of Fields: which field rows appear, in what display order, under what labels, with what editor hints, and whether each is visible. It is field-centric, not Type-bound: any Record carrying the fields a View requires can be rendered through it — and it constrains presentation only. A View may not override, redefine or duplicate the semantics of any Field or Type it references.

**Notes**: A row may also present a Record-level property such as lifecycle state or tags without pretending that property is a Field. Hiding a row affects rendered text only; the value stays in the Record and in any structured projection.
