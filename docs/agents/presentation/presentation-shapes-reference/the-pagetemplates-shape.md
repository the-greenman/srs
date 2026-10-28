# The `PageTemplates` shape

> The The `PageTemplates` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`PageTemplates`, in pseudo-IDL:

```typescript
{
  coverPage?: string
  // Available variables: all Composition preamble variables + {{asset:*}}
  // {{heading-1}} is available here only (resolves via Composition.depthOffset).

  pageHeader?: string
  // Available: {{page-number}}, {{asset:*}}

  pageFooter?: string
  // Available: {{page-number}}, {{asset:*}}
}
```
