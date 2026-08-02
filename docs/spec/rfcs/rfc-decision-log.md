# Semantic Record System Specification

## RFC decision log

**Title**: Adopt SRS foundational values and a phase-specific temporal stance

**Decision Status**: accepted

**Decision Date**: 2026-08-02

**Decision Rationale**: Epic 256's audited decision history shows strong preferences for Semantic Integrity and Shared Coherence. Its weaker Evolution tendency reflects the standard's formation phase. The owner ratified data sovereignty through portability as the governing core, accepted evidence-led Evolution for formation, and precommitted the public standard to reverse to Continuity at its first full public release.

**Decision**: The SRS standard adopts Semantic Integrity and Shared Coherence as defaults. During formation it adopts evidence-led Evolution so demonstrated structural defects can be corrected before users depend on them. At the first full public release, the temporal default reverses to Continuity. Rust, web, and other implementation layers may adopt their own profiles without weakening the standard's semantic or conformance boundaries.

**Scope**: SRS standard layer

**Governing Values**:
- data-sovereignty
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Continue making technical decisions without a constitutional frame.
- Preserve the current model immediately, including pre-release contradictions and gaps.
- Make Evolution the permanent default after public release.
- Apply one undifferentiated preference profile to the standard and every implementation layer.

**Accepted Costs**: Formation may require breaking migrations, concentrated change, and rejection of familiar structures. The project accepts those costs only where practical implementation, corpus, migration, authoring, or user evidence demonstrates that change is necessary for semantic integrity or shared coherence. The hard release transition deliberately forecloses continued pre-release freedom to break the public standard casually.

**Evidence**:
- https://github.com/the-greenman/srs/issues/256
- docs/research/epic-256-decision-map/decision-ledger.json
- docs/research/epic-256-decision-map/cube-analysis.md
- docs/research/epic-256-decision-map/values-statement.md
- https://github.com/the-greenman/muDemocracy.org/issues/136

**Review Trigger**: The first full public release triggers the precommitted temporal reversal: `public-standard` replaces `formation`, and Continuity becomes the default. After that trigger, a breaking standard change requires an explicit version boundary, migration and compatibility analysis, recovery evidence, and owner ratification.


**Title**: Define the SRS decision-log inclusion boundary

**Decision Status**: accepted

**Decision Date**: 2026-08-02

**Decision Rationale**: The decision log must preserve the reasoning that future contributors need without becoming an archaeological archive or a task list. The muDemocracy guide correctly tests durability, policy effect, trade-offs, and future review value, but its strategy/tactical/operational distinction is too coarse for technical governance. A tactical choice can be mechanically determined; an operational-looking choice can establish a reusable exception or conformance boundary.

**Decision**: Maintain the SRS RFC decision log as a curated record of active consequential judgment. Record a decision when legitimate alternatives remained and the choice establishes, changes, applies with discretion, excepts, or supersedes guidance that future work may need to understand. Do not record a mechanical derivation: when competent contributors accepting the same governing decisions and evidence have only one valid outcome, record the task, implementation consequence, test, or pull request instead.

**Scope**: SRS RFC decision log and consequential SRS technical decisions

**Governing Values**:
- semantic-integrity
- shared-coherence

**Alternatives Considered**: - Backfill every atomic research card, including mechanical derivations.
- Treat tactical or operational work as sufficient reason to record a decision.
- Record only RFC lifecycle outcomes, without reusable rationale or exceptions.
- Leave the decision-log boundary implicit.

**Accepted Costs**: The project accepts a small amount of classification and review work before recording a decision. The log will not be a complete chronology of tasks, PRs, or research cards; a contributor must follow evidence links when exhaustive history is needed.

**Evidence**:
- https://github.com/the-greenman/srs/issues/256
- https://github.com/the-greenman/srs/pull/341
- docs/research/epic-256-decision-map/methodology.md
- docs/research/epic-256-decision-map/values-statement.md
- https://github.com/the-greenman/muDemocracy.org/blob/master/muSrs/records/tier-2/section-table-a638cca2.json
- https://github.com/the-greenman/muDemocracy.org/blob/master/muSrs/records/tier-2/section-table-b5a4b93a.json

**Review Trigger**: Review this boundary when formal governance for SRS is adopted, or when the log shows either failure signal: it has become a task list, or recurring consequential choices lack a recorded rationale and cannot be classified consistently.


**Title**: Replace valueType with orthogonal fieldType facets

**Decision Status**: accepted

**Decision Date**: 2026-07-29

**Decision Rationale**: A Field needs independently composable semantic facets. Extending a single valueType enum while retaining parallel patch properties would leave datatype, cardinality, domain, format, and constraints ambiguous and unable to describe the metamodel coherently.

**Decision**: A Field expresses datatype, cardinality, value domain, format, and constraints as independent fieldType facets instead of extending the conflated valueType enum with more parallel patch properties.

**Scope**: Field semantic model

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Keep valueType and add composite as a ninth enum value.
- Keep separate contentFormat, allowed-values, validation-rule, and repeatable mechanisms.

**Accepted Costs**: All Field definitions required a breaking, scripted definition-layer migration and existing readers temporarily could not load them.

**Evidence**:
- https://github.com/the-greenman/srs/blob/de2310bc5d90ed47597c0a1a99beffa26ac396b1/rfcs/rfc-032-composite-field-range.md#change-a--the-fieldtype-model-replaces-valuetype
- https://github.com/the-greenman/srs/blob/ae52927de4e45490cb427fee2b332d5351f536cd/docs/schema/2.0/field.json

**Review Trigger**: Review before adding a fieldType facet or compatibility mechanism that re-couples independent semantic concerns.


**Title**: Keep presentation hints outside the semantic type model

**Decision Status**: accepted

**Decision Date**: 2026-07-29

**Decision Rationale**: Input and display choices describe how a consumer presents meaning, not what the Field means. Keeping them outside fieldType preserves concurrent legitimate views while requiring rendering to own its own portable contract.

**Decision**: Editor and composite-renderer hints remain presentation-layer concerns and are not encoded as fieldType facets.

**Scope**: Semantic model and rendering boundary

**Governing Values**:
- semantic-integrity
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: - Treat input widgets and composite renderers as semantic type facets.

**Accepted Costs**: Presentation behavior needs a separate view-layer contract and cannot be recovered from Field meaning alone.

**Evidence**:
- https://github.com/the-greenman/srs/blob/de2310bc5d90ed47597c0a1a99beffa26ac396b1/rfcs/rfc-032-composite-field-range.md#rationale
- https://github.com/the-greenman/srs/blob/ae52927de4e45490cb427fee2b332d5351f536cd/docs/schema/2.0/field.json

**Review Trigger**: Review when a proposed view capability appears to change interoperability or validation rather than presentation alone.


**Title**: Express the definition-layer metamodel in its own Field and Type language

**Decision Status**: accepted

**Decision Date**: 2026-07-29

**Decision Rationale**: A second schema-source vocabulary would create two authorities for the same definitions. The canonical definition layer must use the Field and Type language it defines, with generated schemas retained as runtime projections.

**Decision**: Field, Type, FieldAssignment, and the in-scope value objects are authored as SRS definitions in the canonical com.semanticops.srs/metamodel package, replacing RFC-004's parallel schema-source vocabulary.

**Scope**: Definition-layer metamodel

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Keep RFC-004 schema-definition/schema-member as a second source language.
- Define the metamodel only through hand-authored JSON Schema.

**Accepted Costs**: The system must bootstrap a language expressed in itself and maintain closure evidence for a recursive package.

**Evidence**:
- https://github.com/the-greenman/srs/blob/e6d94bba0a9d78d0e3be3a46d9b25a50f6b0d30f/rfcs/rfc-033-self-host-metamodel-frozen-seed.md#change-a--the-self-hosted-meta-model-package-comsemanticopssrsmetamodel
- https://github.com/the-greenman/srs/tree/ae52927de4e45490cb427fee2b332d5351f536cd/srs/package/metamodel

**Review Trigger**: Review when a new definition-layer concern appears to require a parallel source language rather than a sanctioned metamodel extension.


**Title**: Make projection loss explicit in a per-emitter fidelity contract

**Decision Status**: accepted

**Decision Date**: 2026-07-29

**Decision Rationale**: Target projections can be useful without being fully lossless, but no emitter may silently erase authoritative meaning. Per-emitter fidelity makes every approximation inspectable, testable, and comparable.

**Decision**: Every metamodel feature is classified as authoritative or approximated for each emitter; authoritative meaning cannot be silently dropped and approximated meaning must emit its documented lossy shape.

**Scope**: Metamodel projection and emitters

**Governing Values**:
- semantic-integrity
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Describe generation as lossless despite known semantic gaps.
- Silently omit constructs that a target cannot represent.

**Accepted Costs**: Each emitter maintains an explicit feature matrix, lossy-shape contract, and tests rather than claiming simple universal equivalence.

**Evidence**:
- https://github.com/the-greenman/srs/blob/e6d94bba0a9d78d0e3be3a46d9b25a50f6b0d30f/rfcs/rfc-033-self-host-metamodel-frozen-seed.md#change-d--authoritative-vs-lossy-fidelity-dashboard-per-emitter
- https://github.com/the-greenman/srs/blob/ae52927de4e45490cb427fee2b332d5351f536cd/docs/schema/2.0/metamodel-fidelity.md

**Review Trigger**: Review when an emitter adds a feature, changes an approximation, or cannot represent a newly authoritative metamodel construct.


**Title**: Put a deterministic target-neutral IR between records and emitters

**Decision Status**: accepted

**Decision Date**: 2026-07-29

**Decision Rationale**: Semantic interpretation must be shared before targets render it. A deterministic neutral intermediate representation prevents each backend from inventing incompatible meanings while preserving target-specific output mechanics.

**Decision**: Projection resolves semantic meaning into a target-neutral intermediate representation before any target back end renders it.

**Scope**: Schema projection architecture

**Governing Values**:
- semantic-integrity
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Let each target define an independent semantic interpretation.

**Accepted Costs**: All emitters depend on a shared interpretation layer whose changes affect every target.

**Evidence**:
- https://github.com/the-greenman/srs/blob/9d4f5e9063c3c09af960f3c7318ffaae90e9c0de/rfcs/rfc-035-schema-emitter.md#change-a--the-neutral-ir-fieldtype-records--ir--target
- https://github.com/the-greenman/srs/blob/9d4f5e9063c3c09af960f3c7318ffaae90e9c0de/scripts/lib/schema-emitter.mjs

**Review Trigger**: Review when a target requires semantic interpretation unavailable in the neutral IR, or when a proposed backend bypasses it.


**Title**: Place composite-renderer dispatch in the view layer

**Decision Status**: accepted

**Decision Date**: 2026-07-31

**Decision Rationale**: Composite renderer choice is a presentation arrangement, not a property of a Field or Type. View ownership permits multiple legitimate presentations of the same records while retaining a portable precedence contract.

**Decision**: Composite renderer selection is owned by the view layer rather than Field or Type, so different views may present the same semantic records differently.

**Scope**: Composite rendering and view semantics

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: - Keep compositeRenderer on FieldGroup or the replacement Type.
- Put renderer selection on each instance.
- Allow only a repository-wide renderer choice.

**Accepted Costs**: Renderer declarations move to view capabilities and cannot be recovered from semantic Fields alone.

**Evidence**:
- https://github.com/the-greenman/srs/blob/f120e9f3174b2eddd773e259a91034eb958b60c2/rfcs/rfc-036-composite-rendering.md#change-b--three-declaration-sites-in-the-view-layer-with-a-total-precedence-order
- https://github.com/the-greenman/srs/blob/ae52927de4e45490cb427fee2b332d5351f536cd/docs/schema/2.0/view.json#L107-L148

**Review Trigger**: Review when renderer selection is proposed on a semantic definition or instance, or when view-level declarations cannot express a needed presentation.


**Title**: Generate structural reference projections from semantic records

**Decision Status**: accepted

**Decision Date**: 2026-07-31

**Decision Rationale**: Resolved semantic records are the structural authority. Narrative stays in authored prose around stable typed slots, while tooling generates the structural reference so hand-authored pseudo-IDL and schemas cannot silently diverge.

**Decision**: Resolved Field, Type, and value-object records are the semantic source; contributors keep narrative in published subsection records around a stable typed view slot, while tooling generates a property-table reference, optional pseudo-IDL, and schema from the resolved model.

**Scope**: Canonical prose and structural reference publication

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Continue comparing hand-authored pseudo-IDL to generated schemas.
- Generate human prose from JSON Schema and make the schema canonical.
- Embed raw JSON Schema as the main contributor-facing reference.

**Accepted Costs**: The architecture needs effective-Type resolution, typed generated-view support, a complete emitter inventory, and staged residual checks before authorship can flip.

**Evidence**:
- https://github.com/the-greenman/srs/issues/274
- https://github.com/the-greenman/srs/issues/274#issuecomment-5145639920

**Review Trigger**: Review when a generated projection cannot convey a required structural rule, or when a narrative change proposes to become a second structural authority.


**Title**: Use authored Field names as Record value keys

**Decision Status**: accepted

**Decision Date**: 2026-07-31

**Decision Rationale**: Record instances and projected schemas need one legible value shape. Version-pinned Types make authored Field names stable enough to key values, avoiding a permanent UUID-key bridge or a target-specific name transform.

**Decision**: The revision-2 Record carrier will store fieldValues as an object keyed verbatim by Field.name, with field identity recovered through the Record's version-pinned Type rather than repeated as a fieldId in each value.

**Scope**: Revision-2 Record value carrier

**Governing Values**:
- practical-expression
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Keep the UUID-keyed FieldValue array.
- Key the object by field UUID.
- Transform authored names to lowerCamelCase.
- Add a separate fieldId map to each Type.

**Accepted Costs**: Readable keys become load-bearing within a pinned Type version; stored write order and per-entry UUID redundancy disappear, and the ecosystem requires an atomic migration.

**Evidence**:
- https://github.com/the-greenman/srs/blob/e0fb4b050447febcd5ecb8f6ccb7864196e656d6/rfcs/rfc-039-record-field-value-carrier.md#change-a--fieldvalues-becomes-an-object-keyed-by-fieldname
- https://github.com/the-greenman/srs/pull/306

**Review Trigger**: Review when Field-name mutation, Type-version pinning, or a new carrier format would make verbatim authored keys ambiguous or unsafe.


**Title**: Make the authoritative store, not the manifest, define repository content

**Decision Status**: accepted

**Decision Date**: 2026-08-01

**Decision Rationale**: An index can become stale or disagree with the stored objects it claims to enumerate. A common logical store-authority contract makes repository content coherent across backends while leaving each backend free to implement discovery.

**Decision**: A repository's authoritative content is what its authoritative store reports across the instance, relation, container, source-document, definition, and extension sets; manifest.json is not content authority except for its inline root container.

**Scope**: Repository content authority and enumeration

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Keep manifest indexes authoritative.
- Let each implementation choose between index and tree authority.

**Accepted Costs**: Implementations must replace index-driven enumeration and accept a coordinated breaking storage migration.

**Evidence**:
- https://github.com/the-greenman/srs/blob/1a1746d3ebf8346914fd88920dcaf2b80b07d877/rfcs/rfc-038-tree-authoritative-storage.md#L162-L179
- https://github.com/the-greenman/srs/blob/1a1746d3ebf8346914fd88920dcaf2b80b07d877/rfcs/rfc-038-tree-authoritative-storage.md#L749-L754

**Review Trigger**: Review when a new backend cannot answer the authoritative-set contract, or when a manifest field is proposed as a second content authority.


**Title**: Land carrier and storage changes as one final generation

**Decision Status**: accepted

**Decision Date**: 2026-08-01

**Decision Rationale**: The Record carrier and repository-authority contracts define one final meaning. Supporting either half as an intermediate public generation would make partial conformance look valid and preserve a bridge with no durable semantic role.

**Decision**: The RFC-039 carrier migration and RFC-038 repository-storage migration land as one composed first-party release train at dataModelRevision 2; neither design ships alone and no intermediate repository generation is supported.

**Scope**: RFC-038/RFC-039 first-party migration and release generation

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Ship the carrier change before the repository-authority change.
- Support an intermediate generation between the two contracts.
- Defer one known first-party population to a later release.

**Accepted Costs**: The coupled train is larger, has more prerequisites, and keeps both accepted designs unavailable until the whole ecosystem is ready.

**Evidence**:
- https://github.com/the-greenman/srs/blob/0c0ee75fb7b582879a908ed1e2ad5c937185ba4f/rfcs/rfc-038-tree-authoritative-storage.md#composition-with-rfc-039
- https://github.com/the-greenman/srs/blob/e0fb4b050447febcd5ecb8f6ccb7864196e656d6/rfcs/rfc-039-record-field-value-carrier.md#abstract

**Review Trigger**: Review if a real external compatibility population requires a staged release, or if the two contracts become independently coherent.


**Title**: Close definition-layer gaps in the model rather than a remainder overlay

**Decision Status**: accepted

**Decision Date**: 2026-07-31

**Decision Rationale**: A hand-maintained overlay would make part of SRS meaning repository-specific and non-portable. The model and emitters must instead become expressive enough to carry the live definition layer as one self-contained artifact.

**Decision**: Metamodel v1.1.0 must express the live definition-layer surface in SRS records and emit the complete artifact; it must not depend on a hand-maintained remainder overlay for meaning the records cannot carry.

**Scope**: Definition-layer self-hosting and schema emission

**Governing Values**:
- semantic-integrity
- evidence-led-evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Keep the core metamodel smaller and merge a hand-maintained remainder/*.json overlay into generated schemas.

**Accepted Costs**: The metamodel and emitters must become expressive enough to carry the full live definition layer, increasing modelling and projection work.

**Evidence**:
- https://github.com/the-greenman/srs/issues/273#issuecomment-5141760683
- https://github.com/the-greenman/srs/issues/273

**Review Trigger**: Review when a live definition-layer concern cannot be represented in the metamodel, distinguishing a genuine new semantic facet from incidental target syntax.


**Title**: Pin the CLI that defines a required semantic drift gate

**Decision Status**: accepted

**Decision Date**: 2026-08-01

**Decision Rationale**: A required semantic check must not change because an external latest release moved. One declared CLI version makes rendering behavior reproducible and turns upgrades into reviewable changes with re-rendered evidence.

**Decision**: The required release-drift check uses one named srs-rust release declared once, so its semantic rendering behavior changes only through a reviewable repository commit.

**Scope**: Required release-drift conformance gate

**Governing Values**:
- semantic-integrity
- continuity
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Always download the latest CLI release.
- Accept that a required check can change behavior without a commit to this repository.

**Accepted Costs**: The project must review and maintain a cross-repository version pin, and new CLI behavior is not adopted automatically.

**Evidence**:
- https://github.com/the-greenman/srs/issues/316
- https://github.com/the-greenman/srs/pull/336
- https://github.com/the-greenman/srs/blob/c132784ce959787b5ee40b2472c4b996abe35363/.github/workflows/release-drift.yml#L1-L52

**Review Trigger**: Review on every intentional CLI-pin advance, or when the current pin no longer validates the semantic behavior the project intends.


