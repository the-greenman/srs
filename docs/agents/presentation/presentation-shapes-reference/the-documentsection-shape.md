# The `DocumentSection` shape

> The `DocumentSection` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`DocumentSection`, in pseudo-IDL:

```typescript
{
  sectionId: string
  title?: string
  description?: string
  order: integer   // min: 0

  source: SectionSource

  renderViewId?: UUID    // View (ext:views-l1) used to render each instance in this section
  // When absent, implementations MUST use the default rendering baseline (see below).
  // When typeDispatch matches the record's resolved type, it takes precedence over renderViewId.

  typeDispatch?: { [typeKey: string]: UUID }   // RFC-008
  // Maps a record's resolved type (namespace/name, version-independent) to the
  // ext:views-l1 View used to render records of that Type within this section. Consulted
  // before renderViewId; unmatched Types fall back to renderViewId then the default
  // baseline. Lets one heterogeneous section render each Type with its own L1 View.
  // typeDispatch never changes member order (order follows the source).

  titleFieldId?: UUID
  // The fieldId whose value provides the per-record heading within this section.
  // Constraints (RFC-032 Rev-7 [N+1]):
  //   - The referenced field must be effective-single.
  //   - datatype string; valueDomain absent/open; format absent/plain/markdown.
  //   - When a record's type does not carry this field, the per-record heading is
  //     omitted silently — this is not a render failure. This enables heterogeneous
  //     sections (e.g. container-subset) where some record types carry the heading
  //     field and others do not.
  // When absent, no per-record heading is emitted.
  // Enforced at render time; implementations SHOULD also enforce at package validation time
  // when the section source is statically determinable.

  ordering?: {
    fieldId?: UUID
    direction?: "asc" | "desc"  // default: "asc"
    source?: "arranged" | "rule"   // RFC-043 [R8]; absent means "rule"
    // "arranged": render the container's own entries in their order and depth;
    // container-subset sections only; not combinable with fieldId or
    // containerScope "subtree" ([R10]).
  }

  required?: boolean
  emptyBehavior?: "hide" | "show-placeholder"

  relationsPresentation?: RelationsPresentation   // RFC-027
  // When present, render a deterministic per-member links block (the member's
  // Relations of the declared types) after each member this section renders — all
  // SectionSource variants, all member tiers. Independent of emptyBehavior.
  // See RelationsPresentation below. Rules [I-027-1]-[I-027-8] (RFC-027).

  compositeRenderers?: CompositeRendererDirective[]   // RFC-036
  // Composite renderer dispatch for records rendered by this section. The primary
  // ext:views-l2 declaration site, following RFC-027's placement of relationsPresentation.
  // Resolved after FieldView.compositeRenderer and before Composition.compositeRenderers
  // ([CR-036-6]). More than one entry for the same fieldId is a validation diagnostic; the
  // first in array order wins.
}
```

`ordering.memberOrder` is removed from the `ordering` object above ([R8]) and the object gains `source?: "arranged" | "rule"` (absent means "rule"). An arranged section renders the entries of its container in their own order and depth, cannot be combined with `fieldId` or `containerScope: "subtree"`, and is valid only on a `container-subset` source ([R9], [R10]); on that source `containerId` may be omitted only when the section is arranged.
