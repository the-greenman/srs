# Extensions

> How a repository declares which independently adoptable capability modules it implements, and the behavioural requirements that activate only when two declared extensions are present together.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Presentation](/agents/presentation.md).

Pages under this one:

- [Import Tracking](/agents/extensions/import-tracking.md): Recording, for a consumer that receives packages from an upstream publisher, what was imported, whether local content has diverged from the upstream source, and whether the upstream has moved ahead s…
- [Cross-Field Validation](/agents/extensions/cross-field-validation.md): Cross-Field Validation: a section of the specification.
- [Views L1](/agents/extensions/views-l1.md): Views: named, versioned presentations over a Field set — which field rows appear, in what order, under what labels, with what editor hints, and whether each is visible — required for rendering and ex…
- [Views L2](/agents/extensions/views-l2.md): Document-level projection: assembling multiple Records into a rendered document via a Composition, dispatching each section's field content to an L1 View, with its own ExportConfig attachment point f…
- [Themes L1](/agents/extensions/themes-l1.md): A visual presentation layer for Composition: brand identity, typography, stylesheets, cover pages, and element wrapping attached to a rendered document without altering its semantic structure.
- [Recommended Relations (compatibility label only)](/agents/extensions/recommended-relations-compatibility-label-only.md): Historically, a recommended (not required) set of seven canonical relation types for a repository to declare.
- [Lifecycle](/agents/extensions/lifecycle.md): Lifecycle: a section of the specification.
- [Discovery (ext:discovery)](/agents/extensions/discovery-ext-discovery.md): Discovery (ext:discovery): a section of the specification.
- [The `DiscoveryQuery` shape](/agents/extensions/the-discoveryquery-shape.md): The `DiscoveryQuery` shape: a section of the specification.
- [The `TextSegment` shape](/agents/extensions/the-textsegment-shape.md): Sentinels: "note-title", "note-section", "tag", "label".
- [The discovery conformance fixture layout](/agents/extensions/the-discovery-conformance-fixture-layout.md): The discovery conformance fixture layout: a section of the specification.
- [Changelog](/agents/extensions/changelog.md): Removed surface (historical, introduced by RFC-018, srs#141): the ChangelogCollection/ChangelogEntry schema (changelog.json); the srs changelog list CLI command.
- [Slices](/agents/extensions/slices.md): Exporting a subset of a repository, scoped to a container's membership, as a standalone, independently openable .srs archive (a slice).
- [Generated reference: `SourceDocumentMeta`](/agents/extensions/generated-reference-sourcedocumentmeta.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/source-document-meta.json>
- [Generated reference: `Manifest`](/agents/extensions/generated-reference-manifest.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/manifest.json>
- [Generated reference: `View`](/agents/extensions/generated-reference-view.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json>
- [Generated reference: `FieldView`](/agents/extensions/generated-reference-fieldview.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json#/$defs/FieldView>
- [Generated reference: `RecordPropertyView`](/agents/extensions/generated-reference-recordpropertyview.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json#/$defs/RecordPropertyView>
- [Generated reference: `ExportConfig`](/agents/extensions/generated-reference-exportconfig.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/composition.json#/$defs/ExportConfig>
- [Generated reference: `Composition`](/agents/extensions/generated-reference-composition.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/composition.json>
- [Generated reference: `DiscoveryQuery`](/agents/extensions/generated-reference-discoveryquery.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/DiscoveryQuery>
- [Generated reference: `TextSegment`](/agents/extensions/generated-reference-textsegment.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/TextSegment>
- [Generated reference: `ExpectedSegments`](/agents/extensions/generated-reference-expectedsegments.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ExpectedSegments>
- [Generated reference: `ConformanceScenario`](/agents/extensions/generated-reference-conformancescenario.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ConformanceScenario>
- [Generated reference: `Theme`](/agents/extensions/generated-reference-theme.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/theme.json>
- [Generated reference: `SrsjEnvelope`](/agents/extensions/generated-reference-srsjenvelope.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/srsj-envelope.json>
- [Generated reference: `FieldRef`](/agents/extensions/generated-reference-fieldref.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/FieldRef>
- [Generated reference: `ProtocolStage`](/agents/extensions/generated-reference-protocolstage.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/ProtocolStage>
- [Generated reference: `Protocol`](/agents/extensions/generated-reference-protocol.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json>
- [Generated reference: `RelationSpec`](/agents/extensions/generated-reference-relationspec.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json#/$defs/RelationSpec>
- [Generated reference: `Blueprint`](/agents/extensions/generated-reference-blueprint.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/blueprint.json>
- [Type Inheritance](/agents/extensions/type-inheritance.md): Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own, under a substitutability constraint — a system that knows the base Type bu…
- [ext:changelog](/agents/extensions/ext-changelog.md): Status: Dormant (removed under rfc-decision-2a1e1590, 2026-08-21): the 2026-08-21 usage attestation found zero changelog/changelog.json files in the corpus; the mechanism was speculative and never ex…
- [ext:federation](/agents/extensions/ext-federation.md): Status: Dormant (removed under rfc-decision-4f1e12e5, 2026-08-22): the 2026-08-21 usage attestation found zero registries, events, or cross-repository relations in the corpus; the mechanism was specu…
- [Addressability (ext:addressability)](/agents/extensions/addressability-ext-addressability.md): A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — including a transcript fragment and a field on a r…
- [Protocol](/agents/extensions/protocol.md): An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient…
- [Registry](/agents/extensions/registry.md): A published, discoverable catalog of Field, Type and other definitions that a multi-publisher ecosystem can index.
- [Repository](/agents/extensions/repository.md): The file-based repository format: a marker directory identifying the root, a manifest declaring the repository's stable id, its packages, its required root container and its declared extensions, and …
- [Extension Interactions](/agents/extensions/extension-interactions.md): Declaring two named extensions together activates behavioural requirements that apply only when both are present in the same implementation.
- [Addressability](/agents/extensions/addressability.md): A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — and so that a transcript fragment and a field on a…
- [Discovery](/agents/extensions/discovery.md): A portable contract for asking a repository what it holds, split deliberately into two halves that behave differently.
- [Conversation boundary](/agents/extensions/conversation-boundary.md): The permanent architectural line between raw multimodal source material (speech, threads, annotations) and the negotiated semantic state SRS captures.
- [Conversation Layer](/agents/extensions/conversation-layer.md): This is the Conversation boundary concept's own line seen from the integration side: how the conversation layer, protocol layer, SRS layer and presentation layer connect via SourceReference and Atten…

How a repository declares which independently adoptable capability modules it implements, and the behavioural requirements that activate only when two declared extensions are present together. Most extensions have a natural home and their capability is documented there, beside the concept they extend — ext:lifecycle beside Lifecycle, ext:views-l1 beside View, and so on. Addressability and Discovery are documented here in full because each is itself a whole capability with no single host concept elsewhere. This Part also documents the conversation/SRS boundary that several of these extensions build on.

Extensions are optional, independently adoptable capability modules. Each declares its identifier, dependencies, and the types it defines.

<!-- srs-generated:extension-index:start -->
| Extension | Identifier | Depends on |
|---|---|---|
| Addressability | `ext:addressability` | — |
| Cross-Field Validation | `ext:cross-field-validation` | — |
| Discovery | `ext:discovery` | `ext:lifecycle` |
| Import Tracking | `ext:import-tracking` | — |
| Lifecycle | `ext:lifecycle` | — |
| Protocol | `ext:protocol` | — |
| Recommended Relations (compatibility label only) | `ext:recommended-relations` | — |
| Registry | `ext:registry` | — |
| Repository | `ext:repository` | — |
| Slices | `ext:slices` | — |
| Themes L1 | `ext:themes-l1` | `ext:views-l2` |
| Type Inheritance | `ext:type-inheritance` | — |
| Views L1 | `ext:views-l1` | — |
| Views L2 | `ext:views-l2` | `ext:views-l1` |
<!-- srs-generated:extension-index:end -->

**Notes**: No extension is required for core conformance, and an implementation adopts only what it needs. The table below is the full list of live extensions and their dependencies; each extension's own capability is documented beside the concept it extends instead of here, unless it has no single host concept — Addressability and Discovery are the two exceptions, documented in full elsewhere in this Part.
