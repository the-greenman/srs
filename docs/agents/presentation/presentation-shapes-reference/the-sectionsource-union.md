# The `SectionSource` union

> The The `SectionSource` union section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`SectionSource`, in pseudo-IDL:

```typescript
type SectionSource =
  | {
      type: "discovery-query"
      query: DiscoveryQuery   // ext:discovery (RFC-012)
      // The selection predicate. typeNamespace + typeName together replace the retired
      // typeKey (namespace/name) axis; lifecycleState/lifecycleStates/excludeLifecycleStates
      // replace the SectionSource-local copies of the same axes (formerly RFC-011 Changes
      // A/B, now governed by RFC-012 Rev 12: I-142/I-143). See the ext:discovery extension's
      // `DiscoveryQuery` shape for the full predicate set.
      containerIds?: UUID[]
      containerScope?: "explicit" | "repository" | "subtree"
      // RFC-011 [N+27] / I-144, arrangement, not selection: which containers bound the
      // candidate set, layered on top of query rather than folded into it (DiscoveryQuery's
      // own containerId predicate is single-valued and takes one container's effective
      // membership; it cannot express this). One scoping vocabulary (RFC-034 [R8]).
      // Default: "explicit" (direct(C) of each listed container: its own members, no
      // nested subtree). "repository": all containers; containerIds[] ignored. "subtree":
      // effective(C) — the closure over declared childContainerIds; follows child edges
      // only, never contains Relations. Absent is equivalent to "explicit".
    }
  | {
      type: "container-subset"
      containerId: UUID
      containerType?: string
      typeFilter?: string[]   // RFC-008. namespace/name keys, version-independent.
      // When present and non-empty, restricts members to the listed Types. Ordering is
      // the container-wide precedes order (below) projected onto the survivors. Absent or
      // empty = all members. Exclusive to container-subset.
      // Default ordering: when DocumentSection.ordering is absent, members are ordered
      // by the precedes relation chain among them; createdAt ascending is the tiebreak
      // for members not connected by any precedes relation.
    }
```
