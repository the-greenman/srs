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


**Title**: Defer minting `section-purpose` until the purpose concept converges

**Decision Status**: accepted

**Decision Date**: 2026-08-10

**Decision Rationale**: A Field's meaning belongs to the Field and its identity is permanent, so minting fixes a semantic the project has not finished learning. The purpose concept is demonstrably unconverged: five overlapping expressions exist across three namespaces — `com.semanticops.srs/summary@1` (1–3 sentence summary for lists and previews), `com.semanticops.spec/summary@1` (the same semantic, a second UUID in a second namespace), `com.semanticops.core/statement@1` (repository mission, the machine-readable repository identity text), `com.semanticops.srs/purpose@1` (what a *definition* captures), and the charter's own per-section `Purpose` blocks, which are a yardstick for why a section exists rather than a summary of what it contains. None of the four minted Fields carries the charter's semantics, and one pair is an outright duplicate. Minting a fifth definition into that space would compound an existing coherence defect and permanently fix a meaning still under experiment.

Two arguments commonly advanced for declining are explicitly **not** relied on here, because both are unsound at this phase. First, authoring cost: `required: true` would oblige purpose statements on 10 section and 65 subsection records, but the corpus has one author, no dependents, and no compatibility surface, so that cost is close to free now and rises monotonically from here. Second, absence of observed harm: no evidence has accumulated that missing purpose statements cause defects, but the specification has never been read by anyone other than its author, so that is absence of observation, not absence of problem. The purpose fields defined so far were experiments in understanding how to define purpose, and they are read here as experimental results rather than as settled practice.

Deferring the Field does not defer the discipline. Minting is the irreversible act; authoring purpose statements is not. Sections may continue to carry purpose prose while the semantics settle, at no cost to a later decision.

**Decision**: The SRS standard does not mint `com.semanticops.spec/section-purpose` during formation. The charter's Purpose facet — "a section whose purpose cannot be stated in one sentence is a section that does not belong" — remains an authoring discipline expressed in prose, not a Field. Minting is deferred, not declined: the requirement is revisited before the first full public release, gated on first resolving the existing overlap between `com.semanticops.srs/summary`, `com.semanticops.spec/summary`, `com.semanticops.core/statement`, and `com.semanticops.srs/purpose`.

**Scope**: SRS standard layer

**Governing Values**:
- semantic-integrity
- shared-coherence
- evidence-led-evolution

**Project Phase**: formation

**Alternatives Considered**: - **Mint `section-purpose` with `required: true` now.** Cheapest it will ever be — one author, no dependents, formation phase. Rejected because it fixes an unconverged semantic permanently and adds a fifth overlapping definition to a space that already contains a duplicate.
- **Mint with `required: false`.** Rejected: an optional defence against scope creep is no defence, and it still fixes the semantic.
- **Mint scoped to the 10 section records, absent on the 65 subsections.** A cheaper probe that would generate the missing authoring evidence at the granularity where scope creep actually occurs. Rejected for this cycle on the same immutability ground — the probe can be run in prose without minting anything — but retained as the leading candidate at the revisit.
- **Decline permanently.** Rejected: the charter's reasoning is sound and untested, not refuted, and permanent decline would foreclose it precisely when reversal becomes expensive.
- **Defer with a trigger on #285 / #272**, as originally proposed on #329. Rejected: publication reachability and instance-layer self-hosting have no bearing on whether the purpose concept has converged, and neither issue's completion would answer the question.

**Accepted Costs**: The charter's stated defence against scope creep remains unenforced for the duration of formation, resting on authoring discipline rather than on the contract. If the specification grows sections that cannot state a one-sentence purpose, nothing in the model will surface that. The project accepts this in exchange for not fixing a semantic it has not learned, and bounds it with a hard revisit before the temporal default reverses to Continuity — after which the same addition requires a version boundary, migration and compatibility analysis, recovery evidence, and ratification.

**Evidence**:
- https://github.com/the-greenman/srs/issues/329
- srs/source-documents/spec/srs-purpose-and-scope.md
- srs/records/rfc-decisions/foundational-values-and-phase.json
- docs/research/epic-256-decision-map/values-statement.md

**Review Trigger**: Revisit before the first full public release, which is the precommitted point at which the temporal default reverses from evidence-led Evolution to Continuity and this addition stops being nearly free. The revisit is gated on a prior convergence step: resolve the overlap between `com.semanticops.srs/summary`, `com.semanticops.spec/summary`, `com.semanticops.core/statement`, and `com.semanticops.srs/purpose` — in particular the duplicated `summary` pair — so that a minted `section-purpose` has a defined boundary against its neighbours. If that convergence has not happened by the release boundary, the decision to mint must be taken or refused explicitly at that point rather than lapsing.


**Title**: Rename DocumentView to Composition

**Decision Status**: accepted

**Decision Date**: 2026-08-19

**Decision Rationale**: The corpus itself could not use the old name unambiguously: RFC-015's renderedPresentations.viewId points at a DocumentView, and two entities shared the word "view" across ext:views-l1/ext:views-l2. Composition names exactly what the entity does. The owner had arrived at this name previously and the decision was lost unrecorded — this record exists so it cannot be lost again.

**Decision**: The document-composition entity is named Composition; the name DocumentView retires. The rendering-chain vocabulary is Composition → Presentation → Projection: a Composition defines how records compose into a document; a Presentation is a repository's declared commitment to render a Composition in a format (manifest.renderedPresentations); a Projection is the produced artifact. "Export" retires as vocabulary with the VIEW_EXPORTS mechanism.

**Scope**: Rendering-chain vocabulary and the document-composition entity name

**Governing Values**:
- shared-coherence
- evolution

**Project Phase**: formation

**Alternatives Considered**: - Keep DocumentView: rejected — the View/DocumentView collision is unresolvable in prose and already confused RFC-015's own key naming.
- Arrangement, Edition, Outline, Assembly: rejected — weaker semantic fit; none name the composing act.
- Rename in vocabulary only, keep the entity name in schemas: rejected — a permanent prose/model split is the drift class this project retires.

**Accepted Costs**: A breaking rename across the ecosystem (~83 srs-rust files, the schema file, the package-manifest documentViews[] key, CLI commands, payload goldens, MCP resource paths), executed only at srs#272's regeneration where the schemas are rewritten anyway (Evolution phase). RFC-034 (srs#267, unaccepted) must rephrase "structural container composition" to container structure/nesting so the noun stays unambiguous. srs#411 lands first with the old key; the viewId→compositionId key rename travels with the entity rename at #272.

**Evidence**:
- https://github.com/the-greenman/srs/pull/389#issuecomment-5339733683
- https://github.com/the-greenman/srs/issues/272#issuecomment-5339733831

**Review Trigger**: Review if srs#272's regeneration cannot execute the rename atomically with the schema rewrite, or if RFC-034's rephrasing is refused.


**Title**: Carry meaning you do not recognise

**Decision Status**: accepted

**Decision Date**: 2026-08-20

**Decision Rationale**: The governed spec exists so that meaning can be carried: a repository built in one system — and even more importantly, the packages created somewhere — must be shareable. The key motivator is the sharing of practice: fields, types, blueprints and protocols must be portable so that the process of creating meaning is shared, even more than the content itself. Interoperability cannot be sacrificed; extensibility is bounded by it. Silent tolerance (the engine's prior behaviour: a flattened catch-all with no diagnostics) and silent loss are both defects of the same kind — the fix to Postel's law is not less tolerance but mandatory naming of what was tolerated.

**Decision**: Unknown content in instance-layer data is governed by a three-verb contract with graded diagnostics. DETECT: unknown elements are always identified — content in `meta` gets at most a quiet mention (it is the sanctioned extension carrier; not recognising its contents is expected, not a defect); unknown fields elsewhere draw a louder warning. LOAD: unknown instance-layer content never fails a load — it must not break the reader, and the reader should not break it. WRITE: a conformant writer preserves what it does not understand (the ideal), or refuses loudly when preservation is genuinely impossible; silently discarding unknown content is the one forbidden behaviour. Emitted JSON Schemas express the PRODUCTION contract — closed except `meta` — while round-tripped out-of-contract keys are carried despite being schema-invalid: the validation complaint IS the louder diagnostic. The definition layer is unchanged by this decision: definitions remain reject-unknown (they are the trust boundary), and extension remains inheritance-only.

**Scope**: Instance-layer unknown-content handling: reader, writer, and emitted-schema conformance

**Governing Values**:
- shared-coherence
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: - Strictly closed everywhere (emit `additionalProperties: false` universally, reject on load): rejected — overturns the ruled instance-layer tolerance, breaks carriage of foreign extension content, and sacrifices the extensibility the meta bag exists to sanction.
- Open everywhere (sanction arbitrary top-level unknowns, full writer passthrough): rejected — the record's shape stops being knowable and the write contract stops being schema-checkable; reopens one layer down the silent-drift surface the definition-layer ruling closed.
- Refuse-only on write (no preservation obligation): rejected as the default — loud refusal remains the sanctioned fallback, but preservation is the ideal; a standard whose writers routinely refuse foreign content does not carry meaning.

**Accepted Costs**: Writers carry preservation machinery (verbatim `meta` passthrough at minimum; out-of-contract carriage where feasible) or accept refusing work. Out-of-contract keys hold a dual status — loadable and carried, yet schema-invalid — which the spec must document explicitly so the complaint is understood as graded diagnosis, not contradiction. srs-rust#847 (record update patch/preserve mode) graduates from enhancement to conformance support. The emitter must know it is emitting an instance-facing schema (closed-except-meta) versus a definition schema (fully closed).

**Evidence**:
- https://github.com/the-greenman/srs/issues/237#issuecomment-5237687810
- https://github.com/the-greenman/srs/issues/273#issuecomment-5367009305

**Review Trigger**: Review if practice-package portability testing shows the preserve-ideal is unimplementable for a real class of writers, or if graded diagnostics prove too quiet to prevent silent semantic drift in shared packages.


**Title**: Defaults arrive later, as one mechanism

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The owner's rule was conditional: keep and define now only if a consistent rule is simple now. It is not. The layered chain spans three levels including Protocol, which has no defaults surface and whose schema is weeks old; the design requires application-timing semantics (writer-materialized versus reader-resolved — which decides whether a record's meaning depends on its definition context), the required-interaction (JSON Schema's precedent: a default does not satisfy required), inheritance interaction for assignment-level overrides, and an effective-default resolution mirroring effective-Type resolution. With zero live corpus uses to falsify against, designing this today is speculative elegance — the exact posture evidence-led Evolution forbids. Removal is cheap now; a half-specified fragment kept alive at one level is how two-ways-of-doing-the-job gets seeded.

**Decision**: Defaults are an essential FUTURE capability, and both current defaultValue sites are removed now. `Field.defaultValue` (already ruled removed, #234 2026-08-08) and `FieldAssignment.defaultValue` are removed together in the #273 train — the latter EXPLICITLY SUPERSEDING #274's ledger row "Generate defaultValue". When defaults arrive they arrive once, as a single layered-override capability — a higher level overrides a lower: a Protocol may override a Type, which may override a Field — designed whole in its own RFC as a versioned metamodel capability. There must never be two ways of doing the job; no fragment of the old mechanism survives to seed a second way.

**Scope**: Definition-layer defaults: removal now, the shape of their future return, and the supersession of #274's FieldAssignment.defaultValue ledger row

**Governing Values**:
- evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: - Define the consistent rule now: rejected by the owner's own conditional — the rule is not simple (three-layer resolution including a defaults-less Protocol layer; timing, required, inheritance, and sovereignty semantics; no corpus evidence to design against).
- Keep `FieldAssignment.defaultValue` per #274's ledger while removing the Field-level site: rejected — a half-specified single-site fragment contradicts the one-mechanism rule and pre-empts the future design's own choice of carrier.
- Remove without recording intent: rejected — the intent (defaults essential, layered override, one mechanism) is the part that must not be lost; this record and the roadmap entry carry it.

**Accepted Costs**: The one live (decorative) authored value in `srs/package/fields/status.json` is deleted. #274's ratified ledger row is superseded and the ledger no longer matches — this record is the supersession trail. The future RFC inherits named obligations: effective-default resolution across Protocol → Type → Field, application timing, the default-does-not-satisfy-required precedent, inheritance interaction, and the writer-materialized-versus-reader-resolved sovereignty question. The roadmap carries the capability so removal cannot read as abandonment.

**Evidence**:
- https://github.com/the-greenman/srs/issues/234#issuecomment-5225578699
- https://github.com/the-greenman/srs/issues/274#issuecomment-5145639920
- https://github.com/the-greenman/srs/issues/273#issuecomment-5367009305

**Review Trigger**: The RFC starts when any real consumer needs pre-filled values — a Protocol stage, a Blueprint authoring form, or a Type wanting authoring sugar — not before.


**Title**: One escape bag, one name: meta

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: Owner ruling, verbatim: "meta. Don't have two things!" One concept must not carry two names — the same one-way-per-goal principle that collapsed E4/semanticObjectType and rejected parallel default mechanisms, applied to naming. The original option pricing ("breaking is free exactly once" inside the #242/#297 train) expired when that train landed; the owner accepts the standalone breaking cost under the Evolution phase rather than carrying a permanent two-name split whose distinction every future reader must relearn.

**Decision**: The per-layer escape bag has one name everywhere: `meta`. The substrate layer's `properties` bag (VocabularyEntry, Term, RelationTypeDefinition) renames to `meta`, matching the instance layer's existing convention. The per-layer POLICIES remain distinct as ruled (#237's three-layer table: definitions have no bag; substrate reject-unknown with a `meta` escape; instances tolerate with `meta`) — the name is unified, the semantics stay layered. Executed as its own small breaking unit, not a #273 rider: substrate schemas + engine structs + substrate data migration + mirror choreography together.

**Scope**: Escape-bag naming across the substrate and instance layers

**Governing Values**:
- shared-coherence
- evolution

**Project Phase**: formation

**Alternatives Considered**: - Keep both names with a stated normative distinction (substrate `properties` = definitional extension surface; instance `meta` = tolerated annotation): rejected by the ruling — the layered policies already carry the distinction; a second NAME adds nothing the policy table does not, and costs a permanent explanation.
- Fold the rename into the #273 train: rejected — #273 is definition-layer; the substrate rename is its own bounded breaking change with its own migration.

**Accepted Costs**: A standalone breaking substrate change post-train: `vocabulary.json`-family schemas, the Rust engine's substrate structs, any substrate data carrying `properties` keys (a deterministic key-rename migration), and the full schema-mirror one-landing choreography. Emitted-schema and validator surfaces that special-case the bag name touch once. The decision record "Carry meaning you do not recognise" (2e0cd70a) reads naturally after this: `meta` is THE sanctioned carrier at every layer that has one.

**Evidence**:
- https://github.com/the-greenman/srs/issues/237#issuecomment-5225580634
- https://github.com/the-greenman/srs/issues/273#issuecomment-5367009305

**Review Trigger**: Review only if the substrate data migration surfaces a live consumer reading the `properties` key by name outside the first-party corpus.


**Title**: The Pattern Grid: the preference layer for spec decisions

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The 2026-08-21 pattern-consistency audit (srs#435, ~50 findings) showed one-way-per-goal stated consistently but executed ~70% deep, with drift following one repeated shape: a rule stated once, remaining sites silent or contradictory. Case-at-a-time ruling produces exactly this; the owner's rulings require principles first, built as a structured framework of axes and agreed tradeoffs, applied consistently. The grid is that framework, built by the Synthetic Logic method (orthogonal lenses, jointly exhaustive and mutually exclusive, completeness by gap-hunting). Its fitness is evidenced, not asserted: the three foundational tensions already ratified in subsection 01-5 map onto axes 1-7, 2-8, 3-9 in listed order; the three axes without a prior tension are exactly where the principle-coverage census found the holes; the audit's three messiest concern clusters (ordering, membership, status) are exactly the concerns that straddle two cells; the column coherence check passed for all four elements; and the usage attestation's heat pattern (corpus lives in Earth and Air; Water and relational Fire dormant) locates the mission's remaining work. Two independent instruments - the prior foundational values and the grid census - agree on where the gaps are, which is the strongest available evidence that the lens set fits the domain.

**Decision**: The SRS standard adopts the Pattern Grid as its decision framework: a 3x4 matrix of four elements (Fire: action/change; Earth: structure/data; Air: information/process/standards; Water: relation/connection/attribution/trust) crossed with three levels (Individual, Relational, Systemic), yielding twelve zodiac-anchored cells whose row-by-row reading reproduces the zodiac in order, with modality constant on the diagonals (Cardinal = where authority is anchored, Fixed = the stability core, Mutable = where change is legal) and opposites forming six axes.

Ratified with the grid, as one system:

SIX AXIS PREFERENCES (default pole + boundary clause): 1-7 Semantic Integrity over Practical Expression; 2-8 Evolution over Continuity, phase-bound, precommitted to flip to Continuity at the first full public release; 3-9 Shared Coherence over Local Autonomy (all three restating subsection 01-5); 4-10 Office over Testimony (in the mythic register, Athena over Aphrodite) - the procedural record over the personal vouch; testimony fills gaps, never contradicts authority, and can be promoted into office by verification; 5-11 Reliability over Renewal - standing contracts hold; renewal only as explicit supersession at a declared boundary; 6-12 Portability over Possession - the travelling form is the test; a capability that exists only in place is captivity; the exception delegates to axis 3-9's explicit-local boundary.

FOUR COLUMN PRINCIPLES, each maturing Individual to Relational to Systemic: Fire, change preserves what it replaces; Earth, structure is declared, never inferred (identity conflicts are fatal and never resolved by precedence); Air, meaning is stated once and validated against its statement (informational conflicts resolve by declared authority - the hint loses, visibly); Water, connection is explicit and carried, never implied or dropped.

TWELVE CELL PREFERENCES (this over that): Versioning, increment over edit; Identity, identifier over label; Description, one name over many; Attribution, stated over assumed; Succession, successor over overwrite; Containment, declaration over location; Reference, declared strength over convenient reach; Assertion, statement over side-effect; Governance, migration over drift; Repository, catalog over circumstance; Conformance, one way over many; Portability, preserve over recognize.

STANDING RULE: every new RFC and decision names its cell. A proposal that contradicts its cell's preference is flagged at review; a proposal that lands in no cell is a finding against the grid itself, to be resolved by refining the grid, not by ignoring the proposal.

**Scope**: Governs how decisions about the SRS standard are made and reviewed: the charter rulings, the pattern-audit dispositions, the removal shortlist, and all future RFCs and decision records, which name their cell from this ruling forward. The grid is an instrument of the standard's governance, not a normative data-model construct; nothing in this decision changes any schema or record format. Cell names and wording are refinable by future ruling (the zodiac anchors and the axis structure are the stable identity); refinements are recorded as successor decisions, not silent edits.

**Governing Values**:
- shared-coherence
- semantic-integrity
- evolution
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: (1) Continue ruling case-at-a-time with the four foundational values as a checklist - rejected: this is the regime under which the audited drift accumulated; values without located tensions and preferences do not compose into consistent rulings. (2) A flat principle list per audit concern (identity, reference, ordering, ...) - rejected: the ten concern families are not orthogonal (three straddle two cells), so a flat list re-creates the unowned-seam problem the audit exposed; the grid locates each concern and names which cell owns a straddle. (3) A different lens set (the T3 cube, a 2x2, per-entity axes) - not pursued: the 3x4 element-by-level matrix is the owner's selected practice instrument, and its in-order zodiac reproduction plus the independent convergence with 01-5 and the census gave positive evidence of fit that alternatives were not tested against.

**Accepted Costs**: The grid adds a naming layer (cells, axes, mythic register) that new contributors must learn before charter-level work; the zodiac anchoring reads as esoteric to some audiences and is deliberately retained as internal governance vocabulary rather than normative spec text. Preferences stated at this altitude will occasionally under-determine a concrete choice (the lifecycle state-mutation coupling is a known instance) - such cases are resolved by explicit ruling, and the ruling is recorded against its cell. Committing to Portability over Possession and Office over Testimony prices future convenience features (place-bound capabilities, credibility-based shortcuts) as exceptions needing justification.

**Evidence**:
- srs#435 (audit, census, column check, preference layer - the tracking issue and comment thread)
- subsection 01-5 Foundational values and development phase (the prior tensions, mapped in order)
- 2026-08-21 usage attestation over muSrs, the spec repository, and derivative trees
- Synthetic Logic Practice Guide (method source)
- rfc-decision-2e0cd70a (carry meaning you do not recognise)
- rfc-decision-0225099b (defaults arrive later, as one mechanism)
- rfc-decision-6fc7e142 (one escape bag, one name: meta)
- RFC-038 [R12] and Invariant 28 (the Earth/Air conflict-rule distinction)

**Review Trigger**: Refine when a proposal lands in no cell, when a cell's preference is overridden twice for the same reason (the boundary clause is wrong), or at the Continuity flip (first full public release), when axis 2-8's default pole reverses and the layer should be re-read whole against the new phase.


**Title**: One state mechanism: workflow status is a Lifecycle

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The pattern audit found six parallel status mechanisms with four vocabularies and no two enums equal (findings C12, C13, B14): the fully-specified state machine had zero users in the spec repository while a bare enum carried the spec's primary workflow, and nothing enforced draft-to-proposed-to-accepted or prevented withdrawn-to-implemented. The attestation then showed production muSrs DOES use ext:lifecycle load-bearingly (a five-state governance lifecycle with an excludeLifecycleStates query), turning the question from removal to unification. Conformance's preference (one way over many) picks unification; the owner ruled: make status right - it should be defined as a real lifecycle. Dogfooding also closes the credibility gap of a standard that avoids its own machinery.

**Decision**: Cell: Conformance (one way over many), with Versioning owning the state value. Anything in the standard's own corpus or its packages that models workflow state - named stages a record moves through - is a Lifecycle (ext:lifecycle): a defined state set with transitions, bound to the Type via lifecycleRef, with the record's position carried in lifecycleState. Bare status enum Fields for workflow state are retired as a parallel mechanism. First migration: the spec's own rfc_status field (49 records, seven values, no transitions) becomes a real spec-rfc-process Lifecycle - the standard dogfoods its own state machinery, and RFC supersession gains RFC-022 requiresRelation coupling (rfc_status superseded requires the supersedes assertion it today carries only in prose).

The line this draws: Lifecycle = workflow state on records (Fire, individual: where the record is in its process). Substrate entry status (active/deprecated/tombstone/retired) is NOT workflow state - it is the retirement mechanism of the substrate layer under axis 5-11 (Reliability over Renewal) and stays as-is. Enum value domains remain legal for genuinely stateless labels; the test is transitions: if some value changes are meaningful and others are wrong, it is a Lifecycle.

**Scope**: Governs the spec repository's rfc-status field and all future package authoring guidance: workflow state is modelled as Lifecycle, not enum. Does not change the substrate retirement status vocabulary (axis 5-11 territory), does not resurrect Relation.status (removed with relation provenance machinery), and does not forbid stateless enum value domains. Execution is a post-train unit: define the spec-rfc-process Lifecycle, bind it on the rfc type, migrate the 49 records, retire the rfc_status Field via deletion (the definition-layer retirement rule).

**Governing Values**:
- shared-coherence
- semantic-integrity

**Project Phase**: formation

**Alternatives Considered**: Sanctioning two tiers (bare enum for light cases, Lifecycle when transitions matter, boundary stated once) was the honest alternative - cheaper, matching current practice. Rejected by the owner in favor of one mechanism: the two-tier boundary would itself become a drift seam, and the spec's own workflow is exactly the case where transition enforcement has value (the audit found nothing prevents impossible status jumps today).

**Accepted Costs**: Migrating 49 rfc records and the rfc type; a Lifecycle definition to maintain; authoring friction for trivial cases that would have been a three-value enum (they now either justify statelessness or take the machine). The spec-rfc-process package grows a lifecycles entry from today's empty array.

**Evidence**:
- srs#435 findings C12, C13, B14 and the census status-lifecycle axis
- 2026-08-21 attestation: muSrs governance_lifecycle in production use; spec repo zero lifecycleState, 49 rfc_status records
- rfc-decision-cce3c00e (the Pattern Grid preference layer - Conformance: one way over many)
- RFC-022 (relational lifecycle states / requiresRelation)

**Review Trigger**: Review if the migration surfaces workflow cases the Lifecycle machine genuinely cannot express, or when package-authoring practice shows the stateless-enum test being routinely argued - the boundary clause may need sharpening.


**Title**: Tier 1 was a theory: TypedRecord is removed

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The 2026-08-21 attestation found zero TypedRecords in every corpus - production muSrs, the spec's own 384-record repository, and both derivative trees - and zero graduatedAt anywhere. The graduation path has had no middle rung in practice across the system's entire life. Axis 2-8's boundary clause requires evolution decisions to be evidence-led and names speculative elegance as insufficient; a tier that exists only in theory is exactly that. The owner ruled: Tier 1 is a theory... at this point there is no evidence. Lets remove it. The dormancy rule applies: the cell keeps the concept's name and its return trigger.

**Decision**: Cell: Identity (Earth, individual), under axis 2-8's evidence clause. The record model goes from three tiers to two: Tier 0 (Note - free text sections, no type binding) and Tier 2 (Record - instantiated Type). Tier 1 (TypedRecord - named fields without a Type binding) and the graduatedAt timestamps are removed from the standard. The gradual-refinement theory the middle tier expressed - meaning matures from free text toward typed structure - survives without it: graduation is Note to Record, linked by derived-from, and partial structure inside a Note remains what it always was, sections. Tier numbering (0 and 2) is retained as-is to keep every existing reference, invariant, and discussion stable; renumbering would be churn without meaning.

**Scope**: Removes: the TypedRecord entity (typed-record.json), the graduatedAt field on Note and TypedRecord, Tier 1 from the discovery Text Projection (re-expressed I-120 covers two tiers), tier-1 handling in implementations, and Tier 1 from the tier taxonomy prose. Keeps: Note (Tier 0) and Record (Tier 2) unchanged; the graduation concept as Note-to-Record via derived-from. Execution is its own breaking unit with a dataModelRevision bump, sequenced after the #273 train; roadmap entry per the dormancy rule with return trigger: evidence of a real consumer producing semi-structured records that fit neither tier - if that evidence arrives, the middle tier returns as an evidence-shaped design, not this one.

**Governing Values**:
- semantic-integrity
- evolution

**Project Phase**: formation

**Alternatives Considered**: (1) Keep Tier 1 as specified - rejected: it is the definition of specified-but-unexercised surface, and the audit showed such surface is where drift accumulates (the tier's ordering, for example, was un-overridable by the view layer, finding B4, and nobody had ever hit it). (2) Keep the tier but mark it experimental - rejected: a third conformance class for a construct with zero users is complexity without evidence. (3) Remove Note instead and make Records the only tier - rejected without debate: Notes are heavily used (26 across corpora) and are the capture surface the mission depends on.

**Accepted Costs**: The theory of gradual semantic refinement loses its explicit intermediate representation; if a future consumer genuinely needs schema-light named fields, the return costs a fresh design informed by that consumer. Removal touches the discovery conformance fixture, schemas, both implementations, and the tier prose - a real breaking unit. The tier numbering gap (0, 2) is a permanent small oddity, accepted deliberately for reference stability.

**Evidence**:
- 2026-08-21 attestation: 0 TypedRecords and 0 graduatedAt in all four corpora (muSrs 32 records, spec repo 384, both derivatives)
- srs#435 finding B4 (Tier 0/1 order un-overridable - a latent defect nobody ever hit)
- rfc-decision-cce3c00e (the Pattern Grid - axis 2-8 boundary clause: evidence-led, speculative elegance insufficient; the dormancy rule)

**Review Trigger**: The roadmap return trigger: a real consumer produces semi-structured records (named fields, no Type) that fit neither Note sections nor a lightweight Type. Until then, the two-tier model stands.


**Title**: State is mutable, semantics are not: the Fire carve-out, and Revisions and Changelog are removed

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The column coherence check (srs#435, finding F1) surfaced the coupling: lifecycle state transitions are the one Fire mechanism that mutates in place, and the only specified preservation mechanism (Revisions) was simultaneously on the removal shortlist. Ruling the removal first would have silently decided the carve-out; the owner ruled both explicitly: the carve out makes sense - state is mutable, and if revisions and changelog are incompletely specified, remove them and add them back at a later stage. The incompleteness is documented: zero corpus files anywhere (attestation), the RevisionAgent PascalCase wire-format leak (audit C8), provenance.lifecycleTransition documented against a field name RFC-006 renamed (C19), and no implementation exercising the chain. Production evidence agrees with the carve-out: muSrs mutates lifecycle state tracelessly and nothing has been harmed.

**Decision**: Cell: Versioning (Fire, individual), carving the boundary of the column principle change preserves what it replaces. The Fire principle governs SEMANTIC content: a record's meaning changes by version increment or successor-and-link, never in place. STATE is the sanctioned exception: designated state fields - lifecycleState is the canonical case - mutate in place, because a state value is the record's current position in a process, not part of its meaning. The carve-out is exact: a field is state only if it is bound to a defined machine (a Lifecycle) whose transitions make some changes legal and others not; nothing else earns in-place mutation by calling itself state.

With the carve-out ruled, the transition-history machinery loses its structural necessity and its removal follows under axis 2-8's evidence clause: per-field Revision sidecars (revisions.json) and ChangelogCollection (changelog.json) are removed from the standard, with the ext:addressability coupling that depends on revision provenance ([LC-AX2]'s provenance.lifecycleTransition matching) simplified accordingly. Dormancy rule applies: return trigger is a real consumer needing transition history or field-level audit - the muDemocracy Decision Log's governance audit surface is the anticipated first claimant, and when it arrives the history mechanism is designed against its actual requirements.

**Scope**: Amends the Fire column principle's boundary in the Pattern Grid (rfc-decision-cce3c00e): increment over edit governs semantics; machine-bound state mutates in place. Removes revisions.json, changelog.json, ext:changelog prose records, and the revision-dependent clauses of ext:addressability's lifecycle coupling. Does not touch: the Lifecycle machinery itself (strengthened by the status-unification decision of the same date), record createdAt/updatedAt envelope timestamps, or RFC revision-history records in the spec process (those are authored content, not the removed mechanism). Execution rides the removal batch after the #273 train; roadmap entries carry the cell and trigger.

**Governing Values**:
- evolution
- semantic-integrity

**Project Phase**: formation

**Alternatives Considered**: (1) Require transition traces (keep a minimal changelog): honest under a strict reading of the Fire principle, and re-legitimizes the machinery - rejected because no present consumer needs history, the specified mechanism has documented defects, and axis 2-8 prices maintaining defective unused machinery as speculative. When the Decision Log's audit surface arrives, a mechanism designed against real requirements will be better than this one preserved. (2) Remove the machinery without ruling the carve-out - rejected: it silently decides the principle by default, the exact failure mode the coupling flag existed to prevent. (3) Make lifecycleState itself versioned/successor-based - rejected: it would make every state transition a record-identity event, conflating process position with meaning.

**Accepted Costs**: Until the history mechanism returns, state transitions are unwitnessed: a record shows where it is, not how it got there. Auditability of lifecycle progression is deferred to the claimant that needs it. The [LC-AX2] addressability coupling loses its revision-provenance leg. The carve-out adds one boundary definition (machine-bound state) that reviewers must apply.

**Evidence**:
- srs#435 finding F1 (the coupling) and the column coherence check
- 2026-08-21 attestation: zero revisions.json / ChangelogCollection files in all corpora; muSrs mutates lifecycleState tracelessly in production
- srs#435 findings C8 (RevisionAgent PascalCase leak) and C19 (provenance.lifecycleTransition names a pre-RFC-006 field) - the incomplete-specification evidence
- rfc-decision-cce3c00e (the Fire column principle this carves)

**Review Trigger**: The roadmap return trigger: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface. Also review if a second field class beyond lifecycleState claims the state carve-out; the machine-bound test must hold or the boundary is wrong.


**Title**: Every reference names its strength: the Reference taxonomy

**Decision Status**: accepted

**Decision Date**: 2026-08-21

**Decision Rationale**: The audit found reference the least uniform axis (~8 shapes; findings A2, A5-A9, A11, C5). All three open choices were determined by the ratified preference layer: object-everywhere rejected by axis 2-8's evidence clause (breaking with no evidence-led need); the string form demoted by axis 1-7 (stored form serves integrity, the string is expression); aliases dropped by Description's one-name-over-many. The folded-in items (packageDependencies rename for the manifest-side dependencyRefs, lifecycleRef and Protocol TypeRef as LINEAGE, definitionType enum derived from the package-manifest's ten kinds, locator mode unification) follow from one-form-per-strength.

**Decision**: Cell: Reference (Air, relational) - declared strength over convenient reach; the axis 1-7 preference (Semantic Integrity over Practical Expression) made mechanism. Four reference strengths, one form each:

PINNED - this thing, this version; semantics frozen. Form: the domain-named {id, version} pair, both required. Appears as an object when the reference is a value (arrays, slots - the ExactTypeRef shape, collapsed to one shared definition) and as flat sibling properties when spread at an entity root (Record.typeId + typeVersion, the extends* pairs). One rule, two positions; the pair, not the wrapper, is the canonical thing. Used by: record-to-type binding, Blueprint.rootTypes, rootTypeRefs, inheritance extends, bundle dependencyRefs.

LINEAGE - this thing, whatever version the context installs. Form: bare UUID (format: uuid); the effective package set resolves. Used by: fieldId in assignments/views/themes, renderViewId, typeDispatch values, lifecycleRef, discovery and theme typeId, vocabularyRef (migrated), Protocol TypeRef (typeVersion dropped - version-optional hybrids are forbidden).

KEYED - whatever matches this name in an explicitly-scoped set. Form: string key with the scope stated by the construct: namespace/name resolves against the effective package set (typeFilter, typeDispatch keys); bare keys resolve against an installed substrate container (relationType, lifecycle state keys, term keys). Alias resolution is dropped: KEYED is key-only (one name over many); renaming a substrate entry is a supersession act through the status vocabulary. Package dependencies are the one sanctioned constraint form: KEYED with a semver range, existing only at the package layer.

LOCATOR - where to fetch bytes, never what they mean. Form: one mode-discriminated shape {mode: local|remote|bundled, path|url|id}, shared by packageRef and ThemeReference (packageRef's 'external' becomes 'remote'). After fetch, identity is verified from the fetched content's own ids; a locator never overrides semantics.

Cross-rules: hints never resolve (Invariant 28 generalized - a denormalized companion loses to its ref, visibly); substrate entries are KEYED references and their UUIDs serve lineage and package management, not reference; the canonical string form namespace/name@version is demoted to the DISPLAY serialization of a pinned reference (CLI output, docs, diagnostics) and never a stored form; strength is declared where the reference is defined - in the metamodel, the strengths become the modes of the ref-datatype Field; no fifth strength without a charter amendment.

The axis 2-8 corollary, stated once: instances PIN; presentation and dispatch follow LINEAGE or KEYED; nothing else absorbs a version bump.

**Scope**: Governs every reference in the standard. Execution: schema and IDL edits ride the #273 train (they touch the same files); the ExactTypeRef $ref collapse and small annotations ride the schema-mechanical unit; vocabularyRef and packageRef.external migrations are in-train data moves. Dispositioned findings: A2, A5, A6, A7, A8, A9, A11, C5.

**Governing Values**:
- shared-coherence
- semantic-integrity

**Project Phase**: formation

**Alternatives Considered**: Object-form-everywhere (rejected: breaking without evidence); keeping ns/name@version as a stored form (rejected: the fifth shape the taxonomy exists to eliminate); implementing aliases (rejected: a second resolution path needing its own justification; returns via the roadmap only with practice-sharing evidence).

**Accepted Costs**: The one-rule-two-positions PINNED form is a stated asymmetry reviewers must know; version-independent dispatch remains a deliberate Practical Expression concession bounded by axis 1-7's clause; dropping aliases prices substrate renames as supersession acts.

**Evidence**:
- srs#435 audit findings A2, A5, A6, A7, A8, A9, A11, C5 and the reference-taxonomy draft + decisions-vs-layer review on the thread
- rfc-decision-cce3c00e (the preference layer that determined the choices)
- RFC-008 (version-independent dispatch rationale), RFC-009 (UUID-anchored chain), Invariant 28

**Review Trigger**: A construct that genuinely needs a fifth strength, or the display-form demotion proving insufficient for a real interchange case.


**Title**: Retirement has one way per layer

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: The audit found nine-plus replacement mechanisms across five layers (supersession inventory) with the same words meaning different things in different enums. The preference layer determined the shape: Reliability over Renewal demands standing contracts hold and renewal be explicit; the three-layer split follows from how each layer is referenced (pinned / keyed / linked). The owner's dispositions had already ruled the parts (deprecation-by-deletion for Fields, substrate status vocabulary, RFC-022 supersession); this record states them once as one system.

**Decision**: Axis 5-11 (Reliability over Renewal) applied: each layer has exactly one retirement mechanism, and renewal never silently breaks a standing contract.

DEFINITIONS (Field, Type, View, Composition, Theme, Blueprint, Protocol, Package definitions) retire by DELETION, with version history as the trail - there is no deprecation state at the definition layer (the audit's carve-out C10, now stated). A definition that must signal replacement does so by a successor version; consumers pin, so deletion cannot break a pinned reference retroactively.

SUBSTRATE ENTRIES (Terms, LifecycleStates, RelationTypeDefinitions) retire by STATUS - the existing four-stage vocabulary (active, deprecated, tombstone, retired) - because instance data addresses them by string key and cannot be version-pinned; the key must keep resolving while carrying its retirement.

INSTANCES (Records) retire by SUPERSESSION - successor-and-link (supersedes/refines), per the Fire column principle; history stays addressable.

Cross-layer rules: every retirement exception (allowlist entry, grandfather clause, compatibility label) carries its expiry condition and dies when the condition is met - a justification whose cited ground has changed is expired even if nobody noticed (the self-expiring-exception rule, now charter-level after finding C5's silent expiry). JSON Schema's deprecated:true annotation accompanies every documented deprecation (machine-readable, finding C16). The word 'deprecated' is reserved for the substrate status; definitions are never 'deprecated', they are removed.

**Scope**: Governs all future retirements and the removal executions now queued. Dispositioned findings: C10 (stated as rule), C15 direction (extension retirement becomes a status-bearing declaration when extensions gain structure - until then prose retirement is a known gap, not a sanctioned mechanism), C16, C20 (the word 'tombstone' stays substrate-only; the source-document index concept is renamed in its own cleanup), the C17 vocabulary split (evidence/evidences) rides the #273 train.

**Governing Values**:
- shared-coherence
- semantic-integrity

**Project Phase**: formation

**Alternatives Considered**: A single cross-layer deprecation status (rejected: definitions are pinned, so status on them is dead weight - deletion with version history is strictly cleaner); no expiry rule for exceptions (rejected: finding C5 showed an allowlist justification silently expiring when its cited schema condition changed).

**Accepted Costs**: Definition deletion is abrupt for consumers who ignored pinning discipline - accepted, since unpinned consumption of definitions is already outside the contract. The expiry rule adds review overhead to every exception.

**Evidence**:
- srs#435 supersession inventory and findings C5, C10, C15, C16, C17, C20
- rfc-decision-cce3c00e (axis 5-11: Reliability over Renewal)
- RFC-022 (supersession coupling), the substrate status vocabulary (RFC-006 V5/V6)

**Review Trigger**: A retirement case that genuinely fits none of the three layer mechanisms, or extension structure landing (which converts C15's prose gap into a status field).


**Title**: A rename is a migration

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: The audit's naming findings (C8's five spellings, C20's double meaning, A13/C19's stale renamed references) all trace to renames executed partially - the name changed where convenient and lingered elsewhere. Shared Coherence wins by default on axis 3-9, so a name's meaning is system-wide property; changing it locally-only produces exactly the incompatible-interpretation state the axis's boundary clause forbids. The migration framing already governs carrier changes; this extends it to names as such.

**Decision**: Axis 3-9 (Shared Coherence over Local Autonomy) with Description's preference (one name over many): a name in the standard - a property key, a substrate key, an entity name, a spec term - is a contract, and changing one is a MIGRATION, never an edit. A rename ships as: the ruled decision naming old and new; a deterministic data/schema migration where stored forms carry the name; a generation stamp where the carrier changes (dataModelRevision); and the one-name end state - the old name does not linger as an accepted alias (KEYED is key-only per the reference taxonomy; substrate renames go through supersession status per the retirement ruling). Already-executed instances of this pattern are its precedent, not exceptions: valueType to fieldType (RFC-032), properties to meta (#433), Evolution to Governance (grid cell), DocumentView to Composition (#272). A rename that cannot afford its migration is not ready to happen.

**Scope**: Governs every future rename in spec text, schemas, substrate keys, and grid vocabulary. The pending renames it disciplines: properties→meta (srs#433, already scoped this way), Composition (#272), packageRef external→remote and the dependencyRefs→packageDependencies rename (reference-taxonomy execution), the evidence/evidences vocabulary reconciliation (#273 train). Stale-reference cleanups from past renames (A13, C19) ride the truth-sync unit.

**Governing Values**:
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: Alias-based grace periods for renames (rejected - two live names is the C8/C20 state this rule exists to prevent; grace lives in the migration tooling, not the name space); treating prose-only renames as exempt (rejected - A13 showed normative records lagging a ruled rename for months).

**Accepted Costs**: Renames become heavier: even a better name waits until its migration is affordable. Accepted deliberately - the phase-bound Evolution default makes them cheap NOW, and the Continuity flip will make this rule the main guard later.

**Evidence**:
- srs#435 findings C8, C20, A13, C19
- rfc-decision-cce3c00e (axis 3-9, Description's preference)
- rfc-decision-6fc7e142 (properties→meta - the pattern's cleanest instance)
- RFC-032 (valueType→fieldType, the carrier-migration precedent)

**Review Trigger**: At the Continuity flip, when rename costs rise: confirm the rule's migration bar matches the post-flip breaking-change bar.


**Title**: What a container can hold, a bundle can carry

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: The mission is semantic sovereignty THROUGH portable data, and the practice-sharing articulation (rfc-decision-2e0cd70a) ranks the sharing of fields, types, blueprints and protocols above the content itself. The attestation showed the Water column dormant while srs#390 sat as a known gap: both governance-shaped packages would be unexportable the day they used what containers can hold. Portability over Possession makes the travelling form the test, not an afterthought.

**Decision**: Axis 6-12 (Portability over Possession) applied as the travel mandate: every construct the standard lets a repository hold MUST be expressible in the standard's travelling forms - the package bundle for definitions, the archive/slice forms for content. A capability that exists only in place is captivity, the purpose statement's named failure mode. Concretely and immediately: the package-bundle format's inability to carry Themes, Blueprints, and Protocols (srs#390) is promoted from bug to mandate violation - the bundle grows to carry every one of the package-manifest's ten definition kinds, and the two lists are derived from one source so they cannot diverge again (finding A6's enum derivation). Standing rule for every future construct: the travelling form ships in the same RFC that introduces the held form, or the RFC states the explicit axis 3-9 local-boundary exception that keeps it in place.

**Scope**: Promotes srs#390 to mandated work (bundle carries all ten kinds; execution scheduled with the #272/#273 window where bundle schemas are already open). Binds all future RFCs introducing holdable constructs. Does not mandate federation machinery (removed separately) - travel here is the artifact forms, not the transport.

**Governing Values**:
- semantic-integrity
- shared-coherence
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: Treating #390 as an ordinary capability gap to schedule on demand (rejected: the mission's own failure mode deserves a standing rule, not a ticket); mandating full parity including runtime state (rejected: state and runtime surfaces are not held constructs; the mandate covers what the standard defines as holdable).

**Accepted Costs**: Every future construct pays a travel tax at design time (its bundle/archive expression, or an explicit exception). The bundle format grows and its schema churns with the ten-kinds derivation.

**Evidence**:
- srs#390 (the proving gap)
- srs#435 findings B7, C11, A6
- rfc-decision-cce3c00e (axis 6-12) and rfc-decision-2e0cd70a (practice-sharing mission)
- RFC-026 (slices, the content-side travelling form)

**Review Trigger**: A construct whose travelling form is genuinely impossible rather than unbuilt - that would mean the construct itself violates the axis and needs redesign, not exemption.


**Title**: Attribution is optional, single-shaped, and never authority

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: The census found Attribution the one cell with no governing principle at all, and the polarity with Repository empty - while the column coherence check showed systemic trust (Portability, the mission cell) inherits upward from it. The attestation found the machinery at absolute zero use (0 of 250 relations) in five divergent shapes. Ruling the principle before removing the machinery is the F1 lesson applied: never let a removal silently decide a principle. Office over Testimony is also the anti-mimicry defense in axis form - the tool-enforced record over the plausible-looking assertion.

**Decision**: Axis 4-10 (Office over Testimony - Athena over Aphrodite) and the Attribution cell (stated over assumed), ruled as the cell's foundation principle:

OPTIONAL - attribution is never required for validity. An unattributed statement is unattributed, not invalid and not implicitly attributed to anyone.

SINGLE-SHAPED - when attribution is expressed, there is ONE shape for who/when/why across the standard: one asserter vocabulary (one casing, one set of kinds - replacing the five spellings the audit found), one timestamp convention, one reference-to-source convention (sourceRefs). The concrete shape is designed when the machinery returns (see below); this ruling fixes its constraints in advance.

NEVER AUTHORITY - attribution informs trust and diagnosis; it never overrides the record. The catalog, the manifest, the validated content are office; who-said-so is testimony, which fills gaps and can be PROMOTED into office only by a verification mechanism (a signature, a ratified decision, a verified publisher) - promotion is the sanctioned path by which testimony hardens, and it produces office artifacts, not privileged testimony.

With the principle ruled, the current machinery's removal (the five divergent shapes: Relation provenance fields, FieldMeta.source's divergence, RevisionAgent's casing) is safe: the cell keeps its principle and its dormancy trigger - attribution machinery returns, in the single shape, when a consumer needs it, with travelling packages needing trustable publishers as the anticipated claimant.

**Scope**: Establishes the Attribution cell's principle and the constraints on any future attribution mechanism. Enables the removal of the current provenance machinery (executed under the attested-removals record). Governs the future verification design (testimony-to-office promotion) when practice-sharing demands publisher trust. The single-shape constraint retroactively governs FieldMeta if it survives in any form.

**Governing Values**:
- shared-coherence
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: Unifying the five shapes now (rejected: unifying unused machinery is speculative - axis 2-8; the constraint is recorded instead so the return is shaped); making attribution mandatory for AI-asserted writes (deferred, not rejected: a real candidate for the verification design when agent-written content needs marking - noted for the return trigger).

**Accepted Costs**: Until the machinery returns, the standard cannot express who asserted what - accepted, the office layer (validated records, tool-enforced writes) carries trust alone. The promotion path is a constraint on future design, priced now.

**Evidence**:
- srs#435 census (the empty cell and empty polarity) and findings C6, C7, C8
- 2026-08-21 attestation (0/250 relations carry provenance; five divergent shapes)
- rfc-decision-cce3c00e (axis 4-10, Athena over Aphrodite; the column inheritance argument)

**Review Trigger**: The return claimant arrives: travelling packages need trustable publishers, or agent-written content needs marking. The mechanism then designed must satisfy all three clauses.


**Title**: The attested removals: pruning the dormant machinery

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: Ruling 3 of the track's governing rulings: unused systems are removed after muSrs attestation, with roadmap return triggers - a spec that does what it says beats one that half-does things. The attestation (production muSrs as decisive witness, the spec repository, two derivative trees) supplied the evidence per candidate; the preference layer supplied the tests (dormancy, cell preferences, the Succession limit case that KEEPS machinery a preference requires). The 34-prose-records federation finding also confirms the audit's meta-observation: spec weight was anti-correlated with usage - pruning restores the correlation.

**Decision**: Under the dormancy rule (rfc-decision-cce3c00e) and axis 2-8's evidence clause, the constructs the 2026-08-21 usage attestation found exercised nowhere are removed from the standard. Each entry keeps its cell's name and carries its return trigger to the roadmap; a return re-enters through the charter as an evidence-shaped design.

REMOVED:
1. Relation provenance fields (assertedBy, confidence, status, createdBy, validFrom, validUntil) - 0 of 250 relations anywhere. Cell: Attribution; the cell's principle is ruled separately and survives the machinery. Trigger: the attribution mechanism's return claimant.
2. Federation entities (registry, events, cross-repository relation fields) - zero data; 34 prose records and 7 invariants specify it. Cell: Portability. Return: COMMITTED, not evidence-gated - federation is core to SRS (owner, 2026-08-22); this removal is a deliberate reset of a design that predates real practice, not a judgment on the capability. The redesign returns as a planned roadmap phase, grounded in the sharing forms that actually emerged (bundles, slices, git-hosted repositories) and the axis 4-10 verification path; the owner schedules it. The travel mandate covers artifact-form portability meanwhile.
3. Revisions sidecars + ChangelogCollection - ruled in rfc-decision-2a1e1590 (cross-referenced, not re-ruled here).
4. SectionSource variants fixed-instances and relation-query - 0 of 13 real sections. Cell: Conformance (one way over many; container-subset and type-query are the two live ways). Trigger: a composition need neither live variant expresses.
5. View.protection (the view-root enum, none/read-only/fill-in - corrected attribution: it sits on the View, not on FieldView) - zero use, and a hint without a contract: no enforcement semantics are defined anywhere. Cell: Description. Trigger: a real authoring surface needing edit protection, which must design the missing enforcement half. Note: FieldView.required is NOT in this entry - it is attested in production use (muSrs decision-log view) and is dispositioned separately as a form-vs-validity distinction ruling.
6. ext:repeatable-fields - nothing beyond repeatable:false outside a stale ancestor tree. Cell: Identity. Trigger: a consumer with genuine array-valued assignments (note: RFC-032 cardinality already carries list semantics - the return may be a merge, not a revival).
7. vocabularyRef's string form - absorbed by the reference taxonomy (becomes LINEAGE); listed for completeness.

DISPOSED WITHOUT REMOVAL:
8. sourceRole vs the deprecated relationType alias at 100% usage: MIGRATE the 231 sourceRefs to sourceRole in the #273 train; if the train slips past the next release window, un-deprecate relationType instead - one name either way (rename-is-a-migration applies).
9. The 13 custom RelationTypeDefinitions with zero assertions: user-space corpus cleanup, not spec surface - noted to corpus owners.

EXPLICITLY KEPT, with reasons of record:
- supersedes / refines / derived-from / evidences relation types: Succession's preference (successor over overwrite) REQUIRES its mechanism - a cell preference's machinery is not removable while the preference stands. The evidences/evidence spelling reconciliation rides the #273 train.
- ext:lifecycle and type-inheritance: attested in production use in muSrs.
- Protocols: the definition model is kept (well-designed, near-term consumers in the Workflow Editor and the protocol-runs-first Decision Log direction); the genuinely thin RUN semantics are the dormant half, designed at consumer time. 
- Instance meta and substrate properties (renaming to meta): policy affordances, not usage-gated features.
- ext:discovery: conformance contract, not corpus machinery.

**Scope**: Authorizes the removal execution units (relation provenance, federation, small surfaces) and the sourceRole in-train migration. Each removal PR cites this record; each roadmap entry carries cell + trigger and lands when the roadmap (PR #389) merges. Implementation follow-ups in srs-rust are filed as each spec unit lands.

**Governing Values**:
- evolution
- semantic-integrity
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: Keeping the machinery marked experimental (rejected: a third conformance class for zero-user constructs); removing the supersedes family for symmetry with its zero usage (rejected: the dormancy rule's limit case - preference-required machinery stays); deleting protocols wholesale (rejected on the owner's cost condition: fixing the well-designed definition model is clearly cheaper than re-planning it).

**Accepted Costs**: The spec loses stated ambitions (federation, field-level provenance) until practice earns them back; the prose removals are large diffs through normative records; returns will not match the removed designs - deliberately, since the removed designs were speculation.

**Evidence**:
- 2026-08-21 usage attestation (per-candidate zero-use evidence; muSrs decisive witness)
- srs#435 removal shortlist, decisions-vs-layer review, and the protocols cost assessment
- rfc-decision-cce3c00e (dormancy rule, cell preferences), rfc-decision-2a1e1590 (revisions/changelog), the attribution and travel decisions of the same batch

**Review Trigger**: Each entry's own return trigger, recorded on the roadmap. Collectively: if two returns arrive within one phase, re-examine whether the attestation's corpus base was too narrow.


**Title**: Layers stay separate: the layer rules

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: The owner's ruling: layers must be kept separate, as a baked decision register. The evidence is the audit's freshest confirmed findings, each a layer violation the grid alone did not name: SectionSource re-implementing the discovery contract inside composition (rule 2), FieldView.required carrying validity in presentation (rule 3), View.exportConfig holding projection config in the presentation layer (rule 1), protection as behavior without a contract (rule 6). Each rule generalizes ground already ruled once (I-28, spec independence, capability layering, view-owned presentation, the three-layer policy) - the register states the stacking discipline in one place instead of leaving it distributed as precedent.

**Decision**: A companion register to the Pattern Grid (rfc-decision-cce3c00e): where the grid locates concerns by element and level, the layer rules govern STACKING - what sits on what, what may know about what. The stack has three planes, each with named layers:

MEANING (what things are): substrate -> definitions -> instances. Per-layer contracts already ruled: the three-layer unknown-key policy, retirement one-way-per-layer, the reference taxonomy binding the layers (instances PIN definitions; definitions KEY substrate).

EXPRESSION (how meaning is shown): selection -> composition -> presentation -> projection. Selection is the one query shape (the discovery contract); composition arranges selected meaning into document structure; presentation renders it (views, themes); projection is the emitted artifact. Each stage consumes its predecessor's output and adds exactly its own concern.

OPERATION (who does what): core service -> adapters (CLI, WASM, MCP) -> clients. Capability layering, raised from implementation ADR to charter level: semantics live once in the core; adapters translate; clients present.

THE SIX LAYER RULES:
1. ONE HOME - every construct names its plane and layer; a concern expressed in two layers is drift by definition.
2. CONSUME, DON'T CLONE - an upper layer references the lower layer's constructs through the reference taxonomy; it never re-implements a lower-layer mechanism. (The SectionSource root cause: type-query cloning the discovery axes divergently.)
3. EXPRESSION NEVER ALTERS MEANING - nothing in selection, composition, presentation, or projection may change validity, identity, state, or relations. Meaning-plane facts are set only in the meaning plane. (FieldView.required carrying validity; relations-never-change-lifecycle, generalized.)
4. CROSSINGS ARE DECLARED, AND THE LOWER LAYER WINS - where a layer legitimately carries another layer's data (denormalized hints, composition order as a render default), the crossing is named where it occurs and conflicts resolve downward, visibly (Invariant 28 generalized). Identity conflicts remain fatal per the Earth rule - they are not crossings.
5. EVERY LAYER STANDS ALONE BELOW - a layer must be complete and valid with every layer above it absent: the spec without any implementation, records without any view, selection results without any composition. Deleting all expression changes nothing about meaning. (Spec independence, generalized to every boundary.)
6. BEHAVIOR NEEDS A CONTRACT - an affordance enters the standard only with enforcement semantics; until then it is application-private behind axis 3-9's explicit-local boundary. (The protection lesson: a hint without a contract is neither testable nor portable.)

THE REVIEW TEST, three questions asked of every proposal alongside its cell: Which layer owns this? Does it consume or clone downward? Can the layer below it still stand alone?

**Scope**: Governs all future design decisions and reviews alongside the Pattern Grid; the #272 Composition remodel executes rules 1-3 for the expression plane (selection via the one query shape, exportConfig relocation, the required distinction); the operation plane's rule binds spec-adjacent tooling decisions (the capability-layering ADR remains the implementation-side elaboration). Refinable by successor decision per the charter rule.

**Governing Values**:
- shared-coherence
- semantic-integrity
- local-autonomy

**Project Phase**: formation

**Alternatives Considered**: Folding layer discipline into the grid's cell preferences (rejected: layers are orthogonal to element x level - SectionSource's violation crossed cells but was invisible to cell preferences; stacking needs its own register). Leaving it as accumulated precedent (rejected: that is the rule-stated-once-sites-silent failure shape the audit diagnosed).

**Accepted Costs**: A second register reviewers must apply (the three-question test alongside the cell check); some legitimate conveniences become formal crossings needing declaration; plane/layer vocabulary to learn.

**Evidence**:
- srs#435: the SectionSource, FieldView.required, exportConfig, and protection layer checks (owner-confirmed 2026-08-22)
- rfc-decision-cce3c00e (the grid this register accompanies)
- Invariant 28 (crossing precedent), subsection 01-5 and spec independence (rule 5 precedent), srs-rust capability-layering architecture doc (operation plane), RFC-015/RFC-036 view-owned rulings (rule 3 precedent), the three-layer forward-compat policy (meaning plane)

**Review Trigger**: A construct that genuinely needs a new layer or plane; or the three-question test failing to catch a violation the audit style later finds - the register, like the grid, is refined rather than bypassed.


**Title**: Invariant normativity is RFC acceptance plus projection-root placement

**Decision Status**: accepted

**Decision Date**: 2026-08-22

**Decision Rationale**: srs#410 (D4 of the #285 disposition batch) originally directed narrowing RFC-016 [R1] on the premise that the three RFC-011 invariant records under package/records/ were unratified. That premise was factually wrong: RFC-011 is Accepted (Revision 1) and the three records (invariant_number 011-1/2/3) are ordinary com.semanticops.spec/invariant records with no proposed/lifecycle marker. With the premise gone, Semantic Integrity points the other way: an accepted normative statement that reaches no reader is the census's own defect class, and RFC-016's founding purpose was precisely that invariants added via the RFC pipeline reach the rendered spec. Rule-text-matches-reality also cuts for the literal [R1] here: the rule was correct, the placement (and therefore the projection) is what failed it. Narrowing [R1] would have fixed the spec to match a buggy outcome. A residual gap remained even after relocation: the three records carried rule-set-qualified invariant_number values (011-1/2/3) that render-invariants.mjs's parseSortKey does not derive a sort key for, and no RFC-016/RFC-011/RFC-039/RFC-020 text nor prior rfc-decision defines one. The owner's 2026-08-22 disposition resolved this under the Evolution-phase default (nothing in the spec is fixed pre-ratification) plus rfc-decision-628cf6c4 (a rename is a migration): renumber to the next sequential canonical I-<n> rather than inventing a second sort-key derivation, since a projected invariant has exactly one numbering form.

**Decision**: An invariant is normative when its governing RFC is Accepted AND its record is placed in the projection root (records/invariants/); placement in the root is itself the ratification act, not a consequence of it. A com.semanticops.spec/invariant record anywhere else in the repository is a fail-closed diagnostic (checked by scripts/check-invariant-placement.mjs), not a legitimate exclusion — closing the trap that let the next stray invariant either silently violate literal RFC-016 [R1] again, or force widening the projection to match it. A projected invariant has exactly one numbering form: canonical I-<n>, assigned sequentially at the moment of relocation into the projection root. A rule-set-qualified numbering form (e.g. "011-1") remains legitimate for pre-ratification RFC-authoring records, but does not carry into the projection; it is preserved only as historical text in the relocated record's rationale.

**Scope**: Every com.semanticops.spec/invariant record, present and future, across this repository: where it may live, when it becomes normative, and what numbering form a projected invariant carries. Executed immediately for the three RFC-011 invariants (relocated from srs/package/records/ to srs/records/invariants/, renumbered 011-1/2/3 to I-142/I-143/I-144).

**Governing Values**:
- semantic-integrity
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: (1) Narrow RFC-016 [R1]'s rule text to match render-invariants.mjs's existing projection-root scope, leaving the three RFC-011 invariants unpublished under package/records/ (the original D4 direction) — rejected: built on the false premise that RFC-011 is unaccepted, and would have fixed the spec to match a buggy outcome, the project's most-punished defect class. (2) Widen the RFC-016 projection to scan the whole repository for com.semanticops.spec/invariant records rather than only records/invariants/ — rejected: makes a raw file-drop anywhere in the tree a normative act with no RFC behind it, intolerable under the governed-spec ruling (rfc-decision foundational-values-and-phase). (3) Extend render-invariants.mjs's parseSortKey / RFC-016 [R2] with a second derivation rule for rule-set-qualified invariant_number values (e.g. "011-3" -> 11.003) instead of renumbering — rejected: sanctions a parallel numbering form surviving inside the projection itself, the one-name-over-many violation rfc-decision-628cf6c4 already rules against.

**Accepted Costs**: The relocation is a content-affecting migration, not a pure rule-text fix: the three records' invariant_number values change from 011-1/2/3 to I-142/143/144, and every cross-reference between them (I-142 is referenced inside I-143's normative_statement) had to be updated at the same time. Renumbering is deliberately NOT retroactively applied to any other rule-set-qualified numbering that may exist in unaccepted RFC proposals elsewhere in the tree; each is decided at its own relocation, not by this record.

**Evidence**:
- https://github.com/the-greenman/srs/issues/410
- https://github.com/the-greenman/srs/issues/410#issuecomment-5359064563
- https://github.com/the-greenman/srs/issues/410#issuecomment-5359115825
- https://github.com/the-greenman/srs/issues/410#issuecomment-5359349640
- https://github.com/the-greenman/srs/issues/410#issuecomment-5359455272
- https://github.com/the-greenman/srs/issues/410#issuecomment-5361506852
- https://github.com/the-greenman/srs/issues/410#issuecomment-5380236658
- https://github.com/the-greenman/srs/issues/285#issuecomment-5332260013
- rfcs/rfc-011-documentview-query-extensions.md
- rfcs/rfc-016-invariant-record-projection.md
- rfc-decision-628cf6c4 (a rename is a migration)
- scripts/check-invariant-placement.mjs

**Review Trigger**: A future com.semanticops.spec/invariant record discovered outside records/invariants/ that scripts/check-invariant-placement.mjs flags: resolve by relocating and renumbering per this decision, not by adding a new publication-reachability exclusion for it.


**Title**: The grid learns to read: autoclassification and the stance vocabulary

**Decision Status**: accepted

**Decision Date**: 2026-08-23

**Decision Rationale**: The owner adopted both on 2026-08-23 after reading the Systemic Data Ethics artifact - the third independent domain application of the geometry (columns Alignment/Control/Explainability/Consequences confirming the invariant tetrad), and the one that pioneered the classification move: the grid used not only to locate one's own concerns but to READ OTHER FRAMEWORKS, at scale, with a trained classifier - in 2021, before language models made the mechanism trivial. Both adoptions are proven-in-sibling like the three operations before them (8f5aca2c), and autoclassification closes a loop the charter opened this week: the balance operation needs placements at scale, the #462 slugs provide the label set, and the classification prompt supplies the scale.

**Decision**: Cell: Governance. Two further operations join the grid (extending rfc-decision-8f5aca2c), adopted from the Systemic Data Ethics sibling - the method's earliest large application, which mapped the external data-ethics field into the same 4x3 geometry:

1. AUTOCLASSIFICATION. Statements of a corpus are classified into grid cells at scale. The label set is the twelve cell slugs (the #462 vocabulary); the rubric is the cells' definitions and preferences as recorded; the modern mechanism is LLM classification (superseding the sibling's 2021 AutoML ancestor, trained on ~732 hand-labelled citations from external ethics frameworks). Three uses, in order of adoption: (a) MECHANIZED BALANCE - the standard's own normative corpus (invariants, rules, RFC statements, decision records) is auto-placed into cells each assessment cycle, making the cyclical balance counts (rfc-decision-8f5aca2c) instrumented rather than hand-censused; (b) COVERAGE MAPS OF EXTERNAL FRAMEWORKS - any peer framework's text yields its shape (which cells it fills, where it is blind) in minutes, mechanizing the precedents research's comparison work; (c) later, the muDemocracy instrument: a community's constitution and policies, fed in, yield an instant coverage and balance diagnosis.

Disciplines that bind autoclassification: placements are DIAGNOSTIC-mode input (rfc-decision-7caca3a1) and provisional - fuzzy edges are expected and carried, not forced; a statement landing in no cell is a finding to surface, never a forced fit (the premature-classification pathology applies to classifiers before it applies to people); and per axis 4-10, AUTO-PLACEMENTS ARE TESTIMONY - they inform and never override the reviewed placement of record, and they are promoted into office only by review. The sibling's own field-level finding stands as proof of yield: the data-ethics literature over-indexes on systemic aspiration (fire) and is thinnest at individual-level explainability - a balance reading of an entire field.

2. THE STANCE VOCABULARY. The sixteen half-hexagram stances are named, giving the operations register a plain-language layer over the esoteric one. Lower trigrams (the internal stance): Initiative 111, Engagement 110, Integrity 101, Purpose 100, Transparency 011, Adaptation 010, Structure 001, Harmony 000. Upper trigrams (the outward expression): Leadership 111, Judgement 110, Articulation 101, Accountability 100, Visioning 011, Reflection 010, Participation 001, Care 000. Binary reads bottom-to-top, yang=1; the polarity assignments are verified identical to this charter's own (the sibling and the SRS mapping agree line for line). Applied to the ratified preference profile: SRS in formation is ENGAGEMENT x ARTICULATION - an engaged, transforming inner stance (agency, transformation, vision) expressing through structured, transparent articulation; at the precommitted Continuity flip the inner stance becomes PURPOSE x ARTICULATION. The names are grid vocabulary, refinable under rename-is-a-migration.

**Scope**: Extends the grid's operations register; changes no preference or layer rule. Execution: a pool unit implements the mechanized census of the normative corpus (classification prompt + first run + counts diffed against the 2026-08-21 hand census), gated on #462's slug vocabulary landing; the grid page and compass (#461) document both operations; the stance vocabulary applies immediately to hexagram readings. External-framework coverage maps and the muDemocracy instrument are uses, not units - they run when wanted. The sibling corpus itself remains background; the operations are adopted, its content is not incorporated.

**Governing Values**:
- evolution
- shared-coherence

**Project Phase**: formation

**Alternatives Considered**: Adopting autoclassification as authoritative placement (rejected outright: Office over Testimony - a classifier's placement never outranks the reviewed record; the 2021 ancestor was a suggestion engine and so is this). Inventing fresh stance names rather than adopting the sibling's (deferred: the sibling's names are attested by use; refinement stays open under rename-is-a-migration). Waiting for #273's self-hosting to add classification (rejected: the balance cycle needs it now, and the mechanism is prompt-plus-slugs, not schema work).

**Accepted Costs**: Classification quality varies with the rubric and model - mitigated by testimony status, review promotion, and the no-cell finding rule; the stance names import a vocabulary designed for organizational ethics into spec governance, and some names may read oddly against SRS material until refined; one more operations layer for newcomers to learn (the plain-language layer exists precisely to lower that cost).

**Evidence**:
- The Systemic Data Ethics sibling: the framework definition (12 domains, 3 levels x 4 dimensions, zodiac-anchored), the trigram binary mapping (the 16 stance names; polarity assignments verified identical to this charter's), and the 2021 autoclassification corpus (~732 hand-labelled citations from external frameworks + AutoML training set; the field-shape finding)
- rfc-decision-8f5aca2c (the balance operation this mechanizes), rfc-decision-7caca3a1 (diagnostic mode), rfc-decision-16b20c56 (testimony/office - the auto-placement clause), rfc-decision-628cf6c4 (rename-is-a-migration for the stance names)
- srs#462 (the cell-slug label vocabulary)

**Review Trigger**: The ritual guard extends to these: two cycles of auto-census placements recorded but never diffed or read means the operation is cut. Persistent disagreement between auto-placement and reviewed placement on the same statements is a finding against the rubric or the grid, whichever the pattern indicates - never silently against the classifier alone.


