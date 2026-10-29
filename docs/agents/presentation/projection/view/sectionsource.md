# `SectionSource`

> Defines how a section's instances are selected from a Container.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

Defines how a section's instances are selected from a Container.

Example: the `SectionSource` union.

**Note (2026-08-22, `rfc-decision-4f1e12e5` entry 4)**: the `fixed-instances` and `relation-query` `SectionSource` variants previously specified here were removed under the dormancy rule (`rfc-decision-cce3c00e`) — zero corpus use across the 13 real sections in the attested corpus (2026-08-21 usage attestation).

**Note (2026-09-03, srs#525, `rfc-decision-cce3c00e` + `rfc-decision-9ee14517`)**: `type-query` is retired and replaced by `discovery-query`, which consumes the one structured query mechanism (`DiscoveryQuery`, `ext:discovery`) instead of re-implementing its own divergent copy of the same filter axes. `discovery-query` and `container-subset` are the two live ways to source a section. Return trigger: a composition need neither live variant expresses.

**Note (2026-09-19, RFC-042 Rev 5, srs#796)**: `containerScope` is carried on both live variants. On `container-subset` it takes `explicit`, the default, which renders `direct(C)` alone, or `subtree`, which descends into `childContainerIds` and renders each declared child container as a nested section. `repository` is invalid on `container-subset`, whose source already names one container.
