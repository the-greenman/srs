# Heterogeneous Section Rendering

> A container-subset section can mix Record Types: it draws all Container members, ordered by the container's arrangement (an arranged section) or by the precedes chain (Rule [N+12], a rule section).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A `container-subset` section can mix Record Types: it draws all Container members, ordered by the container's arrangement (an arranged section) or by the `precedes` chain (Rule [N+12], a rule section). Two optional fields make such sections precise:

- **`typeFilter`** (on the `container-subset` source) restricts the section to a subset of member Types by `namespace/name`, preserving the container-wide `precedes` order projected onto the survivors — filter-then-project (Rule [N+21]).
- **`typeDispatch`** (on `DocumentSection`) selects a different L1 View per Record Type within the one section, so interleaved Types each render with their own View (Rules [N+14]–[N+18]).

A record's **resolved type** for both fields is the canonical `namespace/name` of the Type its `typeId` resolves to — not the denormalized `typeNamespace`/`typeName` hints — compared version-independently (Rule [N+13]). These compose with the per-record heading behaviour of `titleFieldId` (Rule [N+1]) for heterogeneous sections, and leave intra-record group rendering inside a dispatched L1 View unaffected.

**Amended by RFC-042 Rev 5 (2026-09-19, srs#796).** A `container-subset` section renders the container's direct members (the ids of the `memberInstanceIds` entries, RFC-034's `direct(C)`) in one order: the container's own entry order where `ordering.source` is `arranged`, otherwise `ordering.fieldId` with its `direction`, otherwise the Rule [N+12] order.

The section MAY declare `containerScope`. `explicit` is the default and renders those direct members alone. `subtree` additionally renders each container named in `childContainerIds` as a nested section, one heading level deeper, titled by that child container's title, holding its own direct members under the same order rule (RFC-043 [R9]), recursively. `repository` is invalid on this source.

A nested section's position comes from the parent's order, never from `childContainerIds` order (RFC-034 [R3]). A child container anchored on a direct member renders at that member's position, and the anchor record renders once, as the nested section's lead content. A child with no anchor renders after the positioned members, ordered by title with `containerId` as the tiebreak.

A record that is a direct member of several containers rendered by one Composition renders at each place, once per place. A renderer MUST NOT de-duplicate it, and the repetition states nothing about the record: its `contains` parent and its `precedes` edges are unchanged.

A section declares `ordering.source`, `arranged` or `rule` (default `rule`); `memberOrder` is removed ([R8]). A rule section orders by `ordering.fieldId` or Rule [N+12]. An arranged section renders the container's entries in their own order and depth ([R9] to [R11]), and may omit `containerId` ([R10]).
