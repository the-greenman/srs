# The `CompositeRendererBinding` shape

> The The `CompositeRendererBinding` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`CompositeRendererBinding`, in pseudo-IDL:

```typescript
CompositeRendererBinding {
  renderer: string
  // Bare lower-kebab identifiers are SRS-reserved and introduced only by a ratified RFC:
  //   "table"     — the SRS-defined composite renderer
  //   "baseline"  — sentinel meaning explicitly no renderer; cancels a broader declaration site
  // Vendor identifiers use "{reverse-domain}/{name}" with at least two reverse-domain labels.
  // Grammar: ^([a-z][a-z0-9-]*|[a-z0-9-]+(\.[a-z0-9-]+)+/[^/]+)$ — enforced at render and
  // validation time, not by JSON Schema, so a malformed value degrades per [CR-036-7].

  roles?: { [roleName: string]: UUID }
  // Explicit, UUID-anchored role -> Field.id binding, overriding the by-name defaults.
}
```
