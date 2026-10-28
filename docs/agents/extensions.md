# Extensions

> How a repository declares which independently adoptable capability modules it implements, and the behavioural requirements that activate only when two declared extensions are present together.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Presentation](/agents/presentation.md).

Pages under this one:

- [Import Tracking](/agents/extensions/import-tracking.md): Cost of Non-Adoption: Without it, a consumer that imports packages from an upstream publisher keeps no record of what it imported or from where, and cannot detect when local content has diverged from…
- [Cross-Field Validation](/agents/extensions/cross-field-validation.md): Cost of Non-Adoption: Without it, a Type can constrain each Field individually via ValidationRule but cannot express or enforce a constraint that depends on more than one Field's value together.
- [Views L1](/agents/extensions/views-l1.md): Cost of Non-Adoption: Without it, a Record's Fields can be read directly but there is no named, versioned presentation layer governing which rows a rendering or export workflow shows, in what order, …
- [Views L2](/agents/extensions/views-l2.md): Ordering support is DocumentSection.ordering.source (arranged or rule), and ordering.memberOrder is retired ([R8]): an arranged section renders the container's own entry order and depth ([R9]).
- [Themes L1](/agents/extensions/themes-l1.md): Cost of Non-Adoption: Without it, Composition.themeRef and Composition.themeVariants must be ignored rather than applied — an implementation renders a document's semantic structure with no brand iden…
- [Recommended Relations (compatibility label only)](/agents/extensions/recommended-relations-compatibility-label-only.md): Cost of Non-Adoption: None.
- [Lifecycle](/agents/extensions/lifecycle.md): Cost of Non-Adoption: Without it, a record has no defined-state progression to govern: no installable Lifecycle container, no LifecycleState/LifecycleTransition vocabulary, and no state machine for g…
- [Discovery](/agents/extensions/discovery.md): Defines the Discovery Contract: a portable, implementation-agnostic specification of how SRS repositories are queried.
- [The `DiscoveryQuery` shape](/agents/extensions/the-discoveryquery-shape.md): The The `DiscoveryQuery` shape section of the specification.
- [The `TextSegment` shape](/agents/extensions/the-textsegment-shape.md): Sentinels: "note-title", "note-section", "tag", "label".
- [The discovery conformance fixture layout](/agents/extensions/the-discovery-conformance-fixture-layout.md): The The discovery conformance fixture layout section of the specification.
- [Changelog](/agents/extensions/changelog.md): Removed surface (historical, introduced by RFC-018, srs#141): the ChangelogCollection/ChangelogEntry schema (changelog.json); the srs changelog list CLI command.
- [Slices](/agents/extensions/slices.md): Cost of Non-Adoption: Without it, an implementation cannot produce a standalone, independently openable subset of a repository scoped to a container; a consumer who needs only part of a repository mu…
- [Generated reference: `SourceDocumentMeta`](/agents/extensions/generated-reference-sourcedocumentmeta.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/source-document-meta.json>
- [Compact pseudo-IDL: source-document-meta](/agents/extensions/compact-pseudo-idl-source-document-meta.md): The Compact pseudo-IDL: source-document-meta section of the specification.
- [Compact pseudo-IDL: manifest](/agents/extensions/compact-pseudo-idl-manifest.md): The Compact pseudo-IDL: manifest section of the specification.
- [Compact pseudo-IDL: view](/agents/extensions/compact-pseudo-idl-view.md): The Compact pseudo-IDL: view section of the specification.
- [Compact pseudo-IDL: field-view](/agents/extensions/compact-pseudo-idl-field-view.md): The Compact pseudo-IDL: field-view section of the specification.
- [Compact pseudo-IDL: record-property-view](/agents/extensions/compact-pseudo-idl-record-property-view.md): The Compact pseudo-IDL: record-property-view section of the specification.
- [Compact pseudo-IDL: export-config](/agents/extensions/compact-pseudo-idl-export-config.md): The Compact pseudo-IDL: export-config section of the specification.
- [Compact pseudo-IDL: composition](/agents/extensions/compact-pseudo-idl-composition.md): The Compact pseudo-IDL: composition section of the specification.
- [Compact pseudo-IDL: discovery-query](/agents/extensions/compact-pseudo-idl-discovery-query.md): The Compact pseudo-IDL: discovery-query section of the specification.
- [Compact pseudo-IDL: text-segment](/agents/extensions/compact-pseudo-idl-text-segment.md): The Compact pseudo-IDL: text-segment section of the specification.
- [Compact pseudo-IDL: expected-segments](/agents/extensions/compact-pseudo-idl-expected-segments.md): The Compact pseudo-IDL: expected-segments section of the specification.
- [Compact pseudo-IDL: conformance-scenario](/agents/extensions/compact-pseudo-idl-conformance-scenario.md): The Compact pseudo-IDL: conformance-scenario section of the specification.
- [Compact pseudo-IDL: theme](/agents/extensions/compact-pseudo-idl-theme.md): The Compact pseudo-IDL: theme section of the specification.
- [Compact pseudo-IDL: srsj-envelope](/agents/extensions/compact-pseudo-idl-srsj-envelope.md): The Compact pseudo-IDL: srsj-envelope section of the specification.
- [Compact pseudo-IDL: field-ref](/agents/extensions/compact-pseudo-idl-field-ref.md): The Compact pseudo-IDL: field-ref section of the specification.
- [Compact pseudo-IDL: protocol-stage](/agents/extensions/compact-pseudo-idl-protocol-stage.md): The Compact pseudo-IDL: protocol-stage section of the specification.
- [Compact pseudo-IDL: protocol](/agents/extensions/compact-pseudo-idl-protocol.md): The Compact pseudo-IDL: protocol section of the specification.
- [Compact pseudo-IDL: relation-spec](/agents/extensions/compact-pseudo-idl-relation-spec.md): The Compact pseudo-IDL: relation-spec section of the specification.
- [Compact pseudo-IDL: blueprint](/agents/extensions/compact-pseudo-idl-blueprint.md): The Compact pseudo-IDL: blueprint section of the specification.
- [Extension Interactions](/agents/extensions/extension-interactions.md): Declaring two named extensions together activates behavioural requirements that apply only when both are present in the same implementation.
- [Addressability](/agents/extensions/addressability.md): A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — and so that a transcript fragment and a field on a…
- [Discovery](/agents/extensions/discovery-2.md): A portable contract for asking a repository what it holds, split deliberately into two halves that behave differently.
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
