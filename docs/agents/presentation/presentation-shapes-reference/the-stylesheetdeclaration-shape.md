# The `StylesheetDeclaration` shape

> The `StylesheetDeclaration` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`StylesheetDeclaration`, in pseudo-IDL:

```typescript
{
  mode: "inline" | "local" | "remote"
  content?: string   // inline CSS; required when mode === "inline"
  path?: string      // required when mode === "local"
  url?: string       // required when mode === "remote"
}
```
