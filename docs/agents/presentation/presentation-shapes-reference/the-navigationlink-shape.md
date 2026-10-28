# The `NavigationLink` shape

> The `NavigationLink` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`NavigationLink`, in pseudo-IDL:

```typescript
{
  fromSectionId: string
  toSectionId: string
  label?: string
  bidirectional?: boolean  // default: false
}
```
