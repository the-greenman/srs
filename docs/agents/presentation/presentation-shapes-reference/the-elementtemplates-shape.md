# The `ElementTemplates` shape

> The `ElementTemplates` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`ElementTemplates`, in pseudo-IDL:

```typescript
{
  documentWrapper?: string
  // Wraps the entire rendered document body.
  // Available: {{content}}, {{container-title}}, {{date}}, {{asset:*}}

  sectionWrapper?: string
  // Wraps each section (heading + records).
  // Available: {{content}}, {{section-title}}, {{section-id}}, {{asset:*}}

  sectionWrapperOverrides?: Array<{
    sectionId: string   // matches DocumentSection.sectionId; case-sensitive
    template: string    // same variables as sectionWrapper
  }>
  // Per-section override. Takes precedence over sectionWrapper when sectionId matches.
  // sectionId values MUST be unique within the array (enforced at package validation time).

  recordWrapper?: string
  // Wraps each record (heading + field rows).
  // Available: {{content}}, {{record-heading}}, {{type-namespace}}, {{type-name}}, {{asset:*}}
  // {{record-heading}} is the titleFieldId value for this record, or empty string.

  recordWrapperOverrides?: Array<{
    typeId: UUID      // matches Record.typeId
    template: string  // same variables as recordWrapper
  }>
  // Per-type override. Takes precedence over recordWrapper when typeId matches.
  // typeId values MUST be unique within the array (enforced at package validation time).

  fieldRow?: string
  // Wraps each field label + value pair.
  // Available: {{field-label}}, {{field-value}}, {{field-name}}, {{content}}
  // When renderViewId is set, applies after ExportConfig.omitEmptyFields filtering.
  // Field rows follow their position in View.fieldViews[].order. Does NOT wrap ExportConfig.preamble content.

  groupFieldRowTemplates?: { [fieldName: string]: string }
  // RFC-007 [T-Gx1]–[T-Gx3]: per-field-name templates for individual field rows in group entries.
  // Key: Field.name (e.g. "item-term"). Value: template supporting {{field-value}}, {{field-label}}.
  // When a key matches, that template MUST be used instead of fieldRow for that field row [T-Gx3].
  // Applied only when compositeRenderer is absent or unrecognised (per-field baseline) [T-Gx1].
  // Unknown field names in this map MUST be silently ignored [T-Gx2].

  compositeRendererConfig?: { [rendererName: string]: object }
  // RFC-007 [T-Cx1]–[T-Cx5]: per-renderer config, keyed by the same identifier space as
  // FieldGroup.compositeRenderer. Unknown properties in a known renderer sub-object MUST be
  // silently ignored [T-Cx5].
  //
  // The "table" renderer reads compositeRendererConfig["table"]:
  //   {
  //     tableClass?: string
  //     // CSS class on <table> (HTML only). Default: "srs-data-table" [T-Cx1].
  //     // Set to "" to suppress the class attribute [T-Cx2].
  //
  //     wrapperTemplate?: string
  //     // Wraps the full rendered entry. Tokens: {{subheading}}, {{label}}, {{table}}.
  //     // Absent optional field tokens ({{subheading}}, {{label}}) MUST resolve to "".
  //     // Default (HTML): <figure class="srs-table">{{subheading}}{{label}}{{table}}</figure>
  //     // Default (other formats): no wrapper applied.
  //     // When explicitly set, applies regardless of output format [T-Cx4].
  //
  //     captionTemplate?: string
  //     // Template for the label field. Token: {{field-value}}.
  //     // Default (HTML): <figcaption>{{field-value}}</figcaption>
  //     // Default (markdown): *{{field-value}}*
  //     // Default (other formats): {{field-value}} with no decoration.
  //   }
  // Scoped to the Theme instance; applies to all composite renderer groups in the pass
  // that resolves this Theme. [T-Cx3] — applies ONLY to compositeRenderer: "table" groups.
}
```
