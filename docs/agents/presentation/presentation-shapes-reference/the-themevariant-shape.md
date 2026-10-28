# The `ThemeVariant` shape

> The The `ThemeVariant` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`ThemeVariant`, in pseudo-IDL:

```typescript
{
  name: string           // case-sensitive; MUST be unique within Composition.themeVariants
  description?: string
  themeRef: ThemeReference
}
```
