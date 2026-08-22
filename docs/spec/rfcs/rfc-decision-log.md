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
2. Federation entities (registry, events, cross-repository relation fields) - zero data; 34 prose records and 7 invariants specify it. Cell: Portability. Trigger: a second real repository needing live cross-repo assertions; the travel mandate covers artifact-form portability meanwhile.
3. Revisions sidecars + ChangelogCollection - ruled in rfc-decision-2a1e1590 (cross-referenced, not re-ruled here).
4. SectionSource variants fixed-instances and relation-query - 0 of 13 real sections. Cell: Conformance (one way over many; container-subset and type-query are the two live ways). Trigger: a composition need neither live variant expresses.
5. FieldView.protection - zero use. Cell: Description. Trigger: a real authoring surface needing field-level edit protection.
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


