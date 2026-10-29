# The `ThemeReference` shape

> The `ThemeReference` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`ThemeReference`, in pseudo-IDL:

```typescript
{
  mode: "local" | "remote" | "bundled"
  path?: string     // required when mode === "local"
  url?: string      // required when mode === "remote"
  themeId?: UUID    // references Theme.id in Package.themes[]; required when mode === "bundled"
}
```
