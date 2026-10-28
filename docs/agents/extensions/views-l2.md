# Views L2

> Ordering support is DocumentSection.ordering.source (arranged or rule), and ordering.memberOrder is retired ([R8]): an arranged section renders the container's own entry order and depth ([R9]).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:views-l2

**Status**: live

**Adds**: Document-level projection: assembling multiple Records into a rendered document via a `Composition`, dispatching each section's field content to an L1 `View`, with its own `ExportConfig` attachment point for document-level rendering (distinct from the one on `View` itself) and ordering support through `DocumentSection.ordering.source`. Requires `ext:views-l1`, whose per-record field rendering it composes over.

Ordering support is `DocumentSection.ordering.source` (`arranged` or `rule`), and `ordering.memberOrder` is retired ([R8]): an arranged section renders the container's own entry order and depth ([R9]).

**Cost of Non-Adoption**: Without it, an implementation can render a single Record through an L1 `View` but cannot assemble multiple Records into a composed, multi-section document — there is no `Composition` to dispatch sections to Views, order members, or attach document-level `ExportConfig`.
