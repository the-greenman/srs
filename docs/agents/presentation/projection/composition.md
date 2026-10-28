# Composition

> A container-level projection that assembles many instances into one readable document: an ordered set of sections, each selecting its members by a structured query or by container membership, each re…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Projection](/agents/presentation/projection.md).

A container-level projection that assembles many instances into one readable document: an ordered set of sections, each selecting its members by a structured query or by container membership, each rendering them through a chosen presentation, with document-level export settings, heading depth, navigation links and an optional theme. It orchestrates; it does not replace the per-record presentation it dispatches to, and compositions do not nest inside one another.

**Notes**: When a section declares no view, a normative default rendering baseline applies, so theme-less and view-less output is specified, not implementation-chosen.

## Any SectionSource.discovery-query MUST express its type filter via query.typeNamespace/query.typeName, never a combined key string

**Number**: 32

Any `Composition` in `Package.compositions[]` that contains a `SectionSource` with `type === "discovery-query"` MUST express its type-selection through the embedded `DiscoveryQuery`'s independent `typeNamespace`/`typeName` string predicates, resolved against the effective package set. There is no combined `namespace/name` key field on `DiscoveryQuery` or `SectionSource` -- `typeKey` (the KEYED namespace/name string introduced by the semanticObjectType collapse, owner ruling on #383, srs#372/#481/#524, rfc-decision-c8704763) and `semanticObjectType` before it are both retired with no successor field; the srs#525 SectionSource -> DiscoveryQuery collapse (rfc-decision-cce3c00e, rfc-decision-9ee14517) replaced the single combined-key convention with DiscoveryQuery's two separate predicates, closing the door on reintroducing a combined-key form.


## Every NavigationLink.fromSectionId and NavigationLink.toSectionId…

**Number**: 44

Every `NavigationLink.fromSectionId` and `NavigationLink.toSectionId` must reference a `sectionId` declared in the enclosing `Composition.sections[]`.


## ExactTypeRef entries in Composition.rootTypeRefs must resolve in the Package

**Number**: I-63

When Composition.rootTypeRefs is present and non-empty, each ExactTypeRef entry MUST resolve to a Type that exists in the Package (the union of all packages in scope per packageRef/packageRefs; matched by both typeId and typeVersion). An entry that does not resolve MUST produce a diagnostic and MUST NOT be used for Container matching.


## containerScope in SectionSource.discovery-query controls query boundary

**Number**: I-144

When SectionSource.discovery-query carries containerScope, implementations MUST apply the following scoping rules: (a) When containerScope is absent or "explicit", the query is scoped to the containers listed in containerIds[] -- existing behaviour. An absent containerIds[] with explicit scope produces an empty result. (b) When containerScope is "repository", the query spans all containers in the repository; containerIds[] MUST be ignored. (c) When containerScope is "subtree", the query spans effective(C) for each container in containerIds[], the recursive closure over declared childContainerIds (RFC-034 [R8]; I-147); it follows declared child edges only and MUST NOT traverse contains Relations to discover child containers (amended by RFC-034, 2026-09-06: the former "reachable by contains relations" branch is superseded). "explicit" correspondingly evaluates direct(C), the container's own members without its nested subtree; when containerIds[] is absent or empty, the context container is used as the subtree root. An implementation that cannot determine the context container for a subtree query MUST treat it as "explicit" with an empty containerIds[] and SHOULD emit a diagnostic. Implementations MUST NOT produce a validation error when containerScope is absent; absent is equivalent to "explicit". containerScope is arrangement, not selection: it is layered on top of the section's DiscoveryQuery, not a DiscoveryQuery predicate itself (DiscoveryQuery.containerId is single-valued and takes one container's effective membership; containerScope's multi-container/subtree semantics have no DiscoveryQuery equivalent).


## ordering.memberOrder application algorithm

**Number**: I-126

**Retired by RFC-043 (dataModelRevision 8).** `ordering.memberOrder` is removed and this algorithm is replaced by RFC-043 [R8] to [R11]: a section declares `ordering.source` as `arranged` or `rule`, and an arranged section renders the container's own entries in their sequence and depth ([R9]). Step 2 (skipping a listed id that is no longer a member, with a diagnostic only) is reversed by RFC-043 Change G: an entry naming an unresolved instance is a validation error ([R2]) removed by the repair operation ([R20]). The mutual exclusion with `ordering.fieldId` and the restriction to `container-subset` sections are restated as errors for an arranged section ([R10]), and the `desc` reversal of step 4 is restated in [R9].


## memberOrder combined with typeFilter

**Number**: I-127

**Retired by RFC-043 (dataModelRevision 8).** `ordering.memberOrder` is removed, so there is no `memberOrder` to combine with `typeFilter`; this invariant is replaced by RFC-043 [R9]: an arranged section excludes entries by `typeFilter` using the promoting removal (the entries beneath an excluded entry are promoted one level, never hidden), then applies `direction`. The silent skip of excluded ids is replaced by that removal, and every entry not excluded renders ([R11]).


## Composition projections key fields by Field.name

**Number**: I-138

A Composition projection MUST key `ProjectedRecord.fields` and `orderedFieldKeys` by `Field.name`, and MUST carry a composite value recursively under its own key. `ProjectedFieldGroup` and `ProjectedGroupEntry` are removed and have no successor construct. (RFC-039 [R11])
