# The `AssetDeclaration` shape

> The `AssetDeclaration` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`AssetDeclaration`, in pseudo-IDL:

```typescript
{
  type: "image" | "font" | "stylesheet" | "data"
  mode: "local" | "remote" | "inline"

  path?: string      // required when mode === "local"
  url?: string       // required when mode === "remote"
  data?: string      // base64 for binary; raw text for stylesheet/data; required when mode === "inline"
  mimeType?: string  // e.g. "image/png", "font/woff2", "text/css"
}
```
