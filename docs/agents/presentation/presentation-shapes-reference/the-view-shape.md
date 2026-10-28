# The `View` shape

> The The `View` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`View`, in pseudo-IDL:

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1

  description: string    // when to use this View; what workflow or audience it serves

  aiGuidance?: AiGuidance
  // purpose: the workflow context this View serves
  // extraction: session-level framing injected before field extraction

  fieldViews: (FieldView | RecordPropertyView)[]

  compatibleTypes?: string[]
  // Optional Type-key (namespace/name) hints this View was designed for.
  // Informative only. Compatibility is determined by field presence.

  exportConfig?: ExportConfig

  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```
