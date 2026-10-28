# The `Theme` shape

> The `Theme` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`Theme`, in pseudo-IDL:

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string
  // What this theme is for; intended output format and audience.

  targets: string[]   // required; min 1 entry
  // Output formats this theme is designed for (e.g. "html", "markdown", "adoc").
  // Implementations apply this theme only when Composition.format appears in this list.
  // An empty targets array is a validation error (Rule [T-1b]).

  assets?: { [assetName: string]: AssetDeclaration }
  // Named asset declarations. Names MUST be unique within the Theme.

  cssClassFields?: UUID[]
  // fieldIds whose values are injected as CSS classes on record wrapper elements.
  // For each listed fieldId, if the record has an effective-single Field eligible
  // under [T-9], the class srs-field-{fieldName}-{normalisedValue} is added.
  // Only applies to "html" and "pdf" output. Other Fields are silently skipped.

  pageTemplates?: PageTemplates
  elementTemplates?: ElementTemplates
  stylesheet?: StylesheetDeclaration
  typography?: TypographyHints

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```
