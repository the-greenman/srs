# The `FieldView` shape

> The `FieldView` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`FieldView`, in pseudo-IDL:

```typescript
{
  fieldId: UUID       // must reference a valid Field.id in the effective package set
  order: integer      // min: 0; display order within this View
  required?: boolean  // View-level workflow constraint; does not alter Field contract
  visible?: boolean   // default: true
  labelMode?: "inline" | "none"  // default: "inline"; "none" emits the value with no label (RFC-037 Rev 5)

  // Presentation overrides — View scope only
  displayLabel?: string
  displayHint?: string
  editorHintOverride?: string
}
```
