# The `TypographyHints` shape

> The `TypographyHints` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`TypographyHints`, in pseudo-IDL:

```typescript
{
  baseFont?: string
  headingFont?: string
  monoFont?: string
  baseFontSize?: string  // e.g. "16px", "1rem", "11pt"
  lineHeight?: string    // e.g. "1.5", "24px"
}
```
