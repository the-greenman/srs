# The `Composition` shape

> The `Composition` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`Composition`, in pseudo-IDL.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string    // what kind of document this produces; intended audience

  containerType?: string  // when set, intended for Containers of this type

  sections: DocumentSection[]

  navigationLinks?: NavigationLink[]

  exportConfig?: ExportConfig   // ext:views-l1 -- the shape View.exportConfig also uses
  // format?: string
  //   Portable values: "markdown", "adoc", "html", "text", "json". Implementations MAY
  //   support additional values; non-portable values MUST NOT cause a validation error.
  //   When absent, output format is implementation-defined. Governs this Composition's own
  //   document-level rendering (all section rendering, the document title). A dispatched L1
  //   View's own exportConfig.format has no effect here -- a different render context, not
  //   an override (srs#525: one shape, two attachment points, no precedence between them).
  //   When format is "json", implementations MUST produce a structured JSON projection
  //   conforming to the document-view-output.json schema instead of rendered markup. In
  //   json mode: theme application, heading injection, and depthOffset do not apply;
  //   {{heading-N}} variables in preamble templates MUST be substituted as empty strings;
  //   containerId is resolved from the first container-subset SectionSource, or null when
  //   none is present.
  // preamble?: string
  //   Template string rendered before all sections. Standard variables: {{container-title}},
  //   {{date}}, {{container-id}}, {{heading-1}}, {{heading-2}}. When absent and format is
  //   "markdown", "html", or "adoc", implementations MUST render a document title heading at
  //   level 1 + depthOffset containing container-title.
  // omitEmptyFields?: boolean
  //   Available on this shape for consistency with View.exportConfig; no normative rule at
  //   Composition level currently reads it (empty-section display is DocumentSection.
  //   emptyBehavior; empty-field display in the Default Rendering Baseline follows the
  //   Normative Field-Row Form rules below).

  depthOffset?: integer   // min: 0; default: 0
  // Shifts all auto-rendered heading levels by this amount.
  // At depthOffset 0: document title H1, sections H2, records H3.
  // At depthOffset 1: H2, H3, H4 respectively.
  // Implementations SHOULD emit a warning diagnostic when depthOffset > 4.

  themeRef?: ThemeReference
  // Default Theme (ext:themes-l1). Applied when no variant is selected at render time.
  // When ext:themes-l1 is not declared, implementations MUST ignore this field
  // and MUST NOT error on its presence.

  themeVariants?: ThemeVariant[]
  // Named alternative themes selectable at render invocation.
  // When ext:themes-l1 is not declared, implementations MUST ignore this field.

  compositeRenderers?: CompositeRendererDirective[]   // RFC-036
  // Document-wide default composite renderer dispatch, applied to any section that
  // declares no matching DocumentSection.compositeRenderers entry. Lowest-precedence
  // declaration site ([CR-036-6]); a section or FieldView cancels it with renderer: "baseline".

  aiGuidance?: AiGuidance
  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```
