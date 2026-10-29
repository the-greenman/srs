# `Composition`

> A versioned, Container-level projection.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

A versioned, Container-level projection. Defines how a Container's Records are assembled into a readable document.

Example: the `Composition` shape.

A `Composition` may reference one or more `View` records (via `DocumentSection.renderViewId`). A single field-centric View may render mixed Record Types when the Records contain the required fields. The Composition orchestrates; it does not replace L1 Views.

`DocumentSection.renderViewId` references a `View.id` (from `ext:views-l1`). A `Composition.id` is not a valid value for `renderViewId` — Compositions are not nestable.

Use `navigationLinks` when a rendered document should include "see also" or related-section links. Use `Relation` only when the relationship is a semantic assertion about Records.

**Amended by RFC-042 Rev 5 (2026-09-19, srs#796).** Compositions remain non-nestable and the `sections` array stays flat. A nested section (RFC-042 [R21]) is neither a nested `DocumentSection` nor a nested Composition: it is a declared child container, rendered one heading level deeper by a `container-subset` section whose `containerScope` is `subtree`. The hierarchy is read from `childContainerIds`, never authored a second time in the Composition.
