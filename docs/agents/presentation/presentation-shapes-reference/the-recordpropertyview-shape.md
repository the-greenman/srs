# The `RecordPropertyView` shape

> The The `RecordPropertyView` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`RecordPropertyView`, in pseudo-IDL:

```typescript
{
  property: "lifecycleState" | "tags" | "createdAt" | "updatedAt"
  order: integer      // min: 0; shared display-order axis with FieldView
  displayLabel?: string
  visible?: boolean   // default: true
}
```
