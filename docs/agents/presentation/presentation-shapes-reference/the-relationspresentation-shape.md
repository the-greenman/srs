# The `RelationsPresentation` shape

> The The `RelationsPresentation` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`RelationsPresentation`, in pseudo-IDL:

```typescript
{
  include: RelationPresentationEntry[]
  // min 1; display order. Duplicate relationType entries are a repository-validation
  // diagnostic; a renderer encountering them renders each independently.
  label?: string
  // Reserved for a future grouped/headed presentation. No rendering behaviour is
  // defined; implementations MUST ignore it when rendering.
}

// RelationPresentationEntry
{
  relationType: string
  // Bare canonical key (e.g. "supersedes") or namespace/name for custom types.
  // Expected to resolve to an installed RelationTypeDefinition (RFC-005); checked at
  // repository validation time. At render time a non-resolving, retired-only, or
  // conflict-ambiguous entry is skipped with a diagnostic; entries resolving to
  // active/deprecated/tombstone definitions display (rendering is a historical read).
  // None of these conditions may abort the render.
  directions?: "forward" | "inverse" | "both"   // default: "forward"
  // Display-only: inverse Relations are never stored or synthesised (Invariant 16).
  forwardLabel?: string
  // Override for edges where the member is the source. Default ladder: installed
  // definition label, then humanized relation type key.
  inverseLabel?: string
  // Override for edges where the member is the target. Default ladder: humanized
  // declared inverseType query label (RFC-005), then forward label + " (incoming)".
}
```
