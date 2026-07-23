# Semantic Record System Specification

## RFCs

**Title**: RFC-001: Views L2 — Rendering Hierarchy and Default Rendering Baseline
**RFC Number**: 001
**Status**: accepted
**Affected Components**: <!-- srs-integration:v1
ext:views-l2
ext:views-l1
schema:document-view.json
schema:view.json
-->
**Proposal Artifact Path**: rfcs/rfc-001.md
**Content**: Defines the default (View-agnostic) rendering baseline, a normative heading hierarchy (`depthOffset`/`titleFieldId`), a portable `format` vocabulary with an L1/L2 precedence rule, and reserves `themeRef`/`themeVariants` plus the `ThemeReference`/`ThemeVariant` types on `DocumentView` for RFC-002. Full text: rfcs/rfc-001.md.

**Title**: RFC-002: ext:themes-l1 — Visual Theming for Document Views
**RFC Number**: 002
**Status**: accepted
**Affected Components**: <!-- srs-integration:v1
ext:themes-l1
schema:theme.json
schema:package-manifest.json
schema:package-bundle.json
-->
**Proposal Artifact Path**: rfcs/rfc-002.md
**Content**: Defines the `ext:themes-l1` extension, attaching a non-destructive `Theme` (assets, element/page templates, stylesheet, CSS-class injection) to a `DocumentView`, with graceful degradation for implementations that do not support it. Full text: rfcs/rfc-002.md.

**Title**: RFC-004: Language-Neutral Schema Notation for Spec Records
**RFC Number**: 004
**Status**: draft
**Proposal Artifact Path**: rfcs/rfc-004.md
**Content**: Draft: `ext:schema-notation`, a semantic, target-neutral schema definition model for spec authoring (JSON Schema / TypeScript / protobuf / Rust are projections). Carries the proposed-package / proposed-schemas boundary fixture under rfcs/rfc-004/. Full text: rfcs/rfc-004.md.

**Title**: RFC-003: Definition Distribution and Repository Slices
**RFC Number**: 003
**Status**: draft
**Proposal Artifact Path**: rfcs/rfc-003.md
**Content**: Draft: distribution model and container slices for SRS repositories. Import-tracking / package-binding sub-scope was carved out into RFC-014. Full text: rfcs/rfc-003.md.

**Title**: RFC-009: Root-record Type as the typing anchor for Containers, Document Views, and distributable units
**RFC Number**: 009
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: ext:views-l2 (DocumentView), Container (core), ext:blueprint (Blueprint), document-view.json, container.json, manifest.json, blueprint.json

<!-- srs-integration:v1
ext:views-l2
schema:document-view.json
schema:container.json
schema:manifest.json
schema:blueprint.json
I-63
I-64
I-65
I-66
I-78
-->
**Proposal Artifact Path**: rfcs/rfc-009-root-record-type-anchor.md
**Content**: Adds UUID-based typed anchors to the Blueprint→View→Container linkage: DocumentView.rootTypeRefs (ExactTypeRef[]) for Container matching; Blueprint.rootTypes formally defined as ExactTypeRef[]; containers_for_instance as a normative core operation; Container metadata spec alignment (description, vocabulary-backed tags). Invariants I-63 through I-66 and I-78. Tracked in srs#39 (original), srs#67 (blueprint extension).

**Title**: RFC-011: DocumentView query extensions — lifecycle-state exclusion and repository-wide type queries
**RFC Number**: 011
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: ext:views-l2 (SectionSource.type-query), document-view.json

<!-- srs-integration:v1
ext:views-l2
schema:document-view.json
-->
**Proposal Artifact Path**: rfcs/rfc-011-documentview-query-extensions.md
**Content**: Adds three optional fields to SectionSource.type-query: lifecycleStates (multi-value inclusion filter), excludeLifecycleStates (exclusion filter), and containerScope (explicit | repository | subtree). Enables the decision-log pattern: rendering all non-superseded/non-abandoned decisions across a repository without listing every container ID. Tracked in the-greenman/srs#41.

**Title**: RFC-014: Import Tracking & Package Binding
**RFC Number**: 014
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `Package`, `PackageRef`, `UpstreamPackage` (Distribution Group); `ext:import-tracking`; `manifest.json` schema

<!-- srs-integration:v1
ext:import-tracking
schema:manifest.json
I-83
I-84
-->
**Proposal Artifact Path**: rfcs/rfc-014-import-tracking-package-binding.md
**Content**: Formalises the minimum viable provenance and upgrade contract for SRS repositories created from upstream packages.

**Problems addressed:** (1) `meta.upstreamPackage` is informal — stored in the non-normative `meta` object, tools may ignore it. (2) Upgrade semantics are unspecified — no spec guidance on whether old package versions must be retained when a new version is installed. (3) Divergence detection has no formal definition — `ImportRecord.conflictState: "diverged"` exists but its trigger and meaning at the repository level are undefined.

**Changes:** (A) Promotes `upstreamPackage` from `manifest.meta` to a first-class top-level manifest property. (B) Removes the `external`-mode restriction from `PackageRef.packageVersion` and `PackageRef.packageId`, making both applicable to local-mode entries. (C) Specifies multi-version install semantics: prior `PackageRef` entries MUST be retained when a new version is installed (install-alongside, not replace). (D) Makes record-definition version pinning normative: tools MUST NOT rewrite `typeId`/`fieldId`/`fieldValues` as a result of a package upgrade. (E) Defines repository-level divergence detection: when `upstreamPackage` is set, a tool MAY compare locally installed definition files against a reference copy and populate `ImportRecord.conflictState: "diverged"` for differing definitions.

**Scope exclusions:** registry distribution (`ext:registry`), federation (`ext:federation`), package authoring workflows, and upstream-ahead detection (requires registry access). These remain in RFC-003.

**Conformance rules:** R1–R10. Key structural rules: R6 extends Invariant 50 to multi-version repos (union resolution); R10 requires `upstreamPackage.packageId` to match a `PackageRef` entry.

**GitHub issue:** srs#109. Gates srs-rust#234 (Gate 0) and muDemocracy.org#37.

**Title**: RFC-016: Invariant Record Projection
**RFC Number**: 016
**Status**: accepted
**Affected Components**: `com.semanticops.spec/invariant` (rendering); `scripts/publish-spec.mjs`

<!-- srs-integration:v1
tooling-only
-->
**Proposal Artifact Path**: rfcs/rfc-016-invariant-record-projection.md
**Content**: Fixes the rendering pipeline so the Key Invariants section of rendered spec views is projected from `com.semanticops.spec/invariant` records rather than hand-written subsection prose.

**Problems addressed:** (1) Invariant records I-63–I-66 and I-78–I-84 (added by RFC-009, RFC-013, and RFC-014) are invisible in all rendered spec views because the Rust CLI renders the Key Invariants section from subsection Content field prose, not from invariant records. (2) Invariants 1–62 are duplicated — encoded as records and again as inline prose — creating a silent divergence risk with no validation.

**Changes:** (A) Adds `scripts/render-invariants.mjs`, an ESM module that reads all `com.semanticops.spec/invariant` records from `srs/records/invariants/`, sorts by `invariant-number` (type-aware: JSON number used directly; `"I-NN"` string parsed to integer), groups by normalised `group` field, and returns the Key Invariants region body as a markdown string. (B) Updates `scripts/publish-spec.mjs` to import and call `renderInvariants` after `renderDocumentViews()`, performing wholesale region replacement of the Key Invariants section in each rendered view. (C, Phase 2) Removal of inline `**N.**` prose from subsection Content fields — deferred; tracked in srs#117.

**Scope exclusions:** Rust CLI changes to `srs render document-view`, Phase 2 subsection body cleanup (srs#117), new invariant type fields.

**Conformance rules:** R1–R7. Key rules: R1 (all invariant records appear in rendered output), R2 (ascending sort by derived integer key), R3 (no duplicates), R5 (pipeline fails on malformed records), R6 (absent group → "Other" heading), R7 (trailing `---` artifacts stripped).

**GitHub issue:** srs#116. Closes srs#99.

**Title**: RFC-028: Lifecycle Update Command
**RFC Number**: 028
**Status**: accepted
**Author**: the-greenman (from issue the-greenman/srs#81)
**Affected Components**: ext:lifecycle (CLI contract), srs-usage.md (agentic write-workflow reference)

<!-- srs-integration:v1
tooling-only
-->
**Proposal Artifact Path**: rfcs/rfc-028-lifecycle-update-command.md
**Content**: srs lifecycle supports list, get, and create but has no update subcommand. This forces direct JSON file editing to modify an existing lifecycle definition, violating the CLI-first rule in srs-usage.md. This RFC adds srs lifecycle update <lifecycleId> to the spec, modelling it on srs type update. No schema changes are required. Full-replace semantics: caller fetches, edits, and sends the complete lifecycle JSON back. Seven conformance rules covering schema validation, id-match, RFC-006 V9 integrity (isFinal, transition id uniqueness, initial-state active-status), and full-replace write semantics.

**Title**: RFC-018: Repository Changelog Extension (`ext:changelog`)
**RFC Number**: 018
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `manifest.json` (new `changelogPath` property); new schema file `changelog.json` (ChangelogCollection + ChangelogEntry); `ext:changelog` extension declaration

<!-- srs-integration:v1
ext:changelog
schema:changelog.json
schema:manifest.json
-->
**Proposal Artifact Path**: rfcs/rfc-018-changelog-extension.md
**Content**: Introduces `ext:changelog`, an opt-in extension that maintains a lightweight, append-only log of entity-level changes in an SRS repository.

**Problems addressed:** (1) No way to determine what changed since a sync point — the `repo copy` round-trip workflow cannot distinguish actually modified records from path-changed files. (2) Sync and replication tooling must rely on git history, binding SRS to a specific VCS backend and breaking for `.srsj`/in-memory stores. (3) No normative record of operation provenance — no standard way to record who or what asserted a change.

**Changes:** (A) New extension key `ext:changelog`; repositories opt in via `manifest.declaredExtensions`; implementation creates an empty changelog file on first declaration. (B) New `changelogPath` optional field on `manifest.json` (default: `changelog/changelog.json`). (C) New schema `changelog.json` defining `ChangelogCollection` and `ChangelogEntry` (`entryId` UUID4, `instanceId`, `changeKind` enum: `created`/`updated`/`deleted`/`note-created`/`note-updated`/`note-deleted`, `timestamp`, optional `assertedBy`; `noteId` required for note variants). (D) Normative `srs changelog list --repo <path> [--since <iso8601>] [--instance <uuid>]` CLI command.

**Conformance rules:** R1–R10. Key rules: R1–R2 (maintain and append-on-write), R3 (UUID4 uniqueness), R4 (append-only immutability), R5 (no changelogPath without extension), R7 (noteId MUST when note variant), R9 (normative CLI query), R10 (SHOULD lock on write).

**GitHub issue:** srs#141. Addresses srs#52 (spec gap: no changelog concept).

**Title**: RFC-006: Vocabulary Substrate — Terms, Vocabularies, Lifecycles, and Controlled Value Sets
**RFC Number**: 006
**Status**: accepted
**Author**: design dialogue draft
**Affected Components**: `Vocabulary`/`Term` substrate; `vocabularyRef` on select/multiselect; installable `Lifecycle` (`Type.lifecycleRef`).

<!-- srs-integration:v1
ext:lifecycle
schema:vocabulary.json
schema:term.json
schema:lifecycle.json
schema:field.json
schema:type.json
schema:relation-type.json
schema:package-manifest.json
schema:package-bundle.json
I-65
type:com.semanticops.srs/vocabulary
type:com.semanticops.srs/term
type:com.semanticops.srs/lifecycle
-->
**Proposal Artifact Path**: rfcs/rfc-006-vocabulary-substrate.md
**Content**: Unifies four controlled-vocabulary patterns (tags, select values, relation types, lifecycle states) into one keyed vocabulary-entry substrate; introduces `Vocabulary`/`Term`, binds `select`/`multiselect` via `vocabularyRef`, and makes `Lifecycle` an installable, referenceable container (`Type.lifecycleRef`). Full text: rfcs/rfc-006-vocabulary-substrate.md.

**Title**: RFC-007: Composite Group Rendering
**RFC Number**: 007
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `FieldGroup.compositeRenderer` dispatch; `groupFieldRowTemplates`; `compositeRendererConfig` on `ElementTemplates`.

<!-- srs-integration:v1
ext:field-groups
ext:themes-l1
schema:type.json
schema:theme.json
-->
**Proposal Artifact Path**: rfcs/rfc-007-composite-group-rendering.md
**Content**: Adds a composite-renderer dispatch (`FieldGroup.compositeRenderer`, first value `table`) so structured groups render as composed output rather than raw rows, retroactively specifies `groupFieldRowTemplates`, and adds a generalised `compositeRendererConfig` surface on `ElementTemplates`. Full text: rfcs/rfc-007-composite-group-rendering.md.

**Title**: RFC-008: Heterogeneous ContainerSubset Sections — typeFilter and typeDispatch
**RFC Number**: 008
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `typeDispatch` on `DocumentSection` + `typeFilter` on `container-subset` source (both `ext:views-l2`).

<!-- srs-integration:v1
ext:views-l2
schema:document-view.json
-->
**Proposal Artifact Path**: rfcs/rfc-008-heterogeneous-container-subset-sections.md
**Content**: Adds two backward-compatible optional fields under `ext:views-l2` — `typeDispatch` on `DocumentSection` (per-type L1 view selection) and `typeFilter` on the `container-subset` source — to allow heterogeneous cross-type sections that preserve `precedes` reading order. Full text: rfcs/rfc-008-heterogeneous-container-subset-sections.md.

**Title**: RFC-012: Discovery Contract & Text Projection
**RFC Number**: 012
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `discovery.json` schema + conformance fixture landed. `ext:discovery` extension record and I-113–I-124 invariants (R1–R12) authored (#206).

<!-- srs-integration:v1
schema:discovery.json
ext:discovery
I-113
I-114
I-115
I-116
I-117
I-118
I-119
I-120
I-121
I-122
I-123
I-124
-->
**Proposal Artifact Path**: rfcs/rfc-012-discovery-contract-text-projection.md
**Content**: Defines a portable Discovery Contract (structured filter axes), a deterministic Text Projection, normalization rules, and an opt-in `ext:discovery` extension, plus a conformance fixture. The `discovery.json` schema, `conformance/discovery/` fixture, `ext:discovery` extension record, and I-113–I-124 invariants are all folded into the canonical spec. Full text: rfcs/rfc-012-discovery-contract-text-projection.md.

**Title**: RFC-013: Required Root Container & Structural Navigation
**RFC Number**: 013
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `manifest.container` required; `Container.identityInstanceId`; structural navigation from membership + `precedes`.

<!-- srs-integration:v1
schema:manifest.json
schema:container.json
I-79
I-80
I-81
I-82
-->
**Proposal Artifact Path**: rfcs/rfc-013-required-root-container.md
**Content**: Makes `manifest.container` required, adds a reassignable identity pointer `Container.identityInstanceId` to both Container schemas, and defines a structural navigation model derived from existing primitives (container membership + `precedes` order). Full text: rfcs/rfc-013-required-root-container.md.

**Title**: RFC-015: View-Owned Ordering & Declared Root Presentations
**RFC Number**: 015
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `ordering.memberOrder` on `container-subset` sections + `renderedPresentations` on the manifest. Invariants I-125–I-128 (RFC-015 Rules [N+28]-[N+31]).

<!-- srs-integration:v1
schema:document-view.json
schema:manifest.json
I-125
I-126
I-127
I-128
-->
**Proposal Artifact Path**: rfcs/rfc-015-view-owned-ordering-declared-presentations.md
**Content**: Separates semantic order (`precedes`) from presentational order via a view-owned `ordering.memberOrder` list on `container-subset` DocumentView sections and a normative `renderedPresentations` array on the manifest declaring the default presentation. Full text: rfcs/rfc-015-view-owned-ordering-declared-presentations.md.

**Title**: RFC-017: Decision-log Attachments, Base-package Settings, Archive Determinism, and srsj-gzip Retirement
**RFC Number**: 017
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `attaches` sourceRole value + contentPath across SourceReference schemas landed. Invariants I-101–I-112 relocated to records/invariants/ and the `com.semanticops.base` `repo_settings` type (attachment_policy settings) authored in package/base (#207).

<!-- srs-integration:v1
schema:record.json
schema:note.json
schema:typed-record.json
schema:relations-collection.json
schema:source-document-meta.json
schema:manifest.json
type:com.semanticops.base/repo_settings
I-101
I-102
I-103
I-104
I-105
I-106
I-107
I-108
I-109
I-110
I-111
I-112
-->
**Proposal Artifact Path**: rfcs/rfc-017-attachments-base-package-archive-determinism.md
**Content**: Defines the attachment model for decision-log repositories — an `attaches` value on the `SourceReference.sourceRole` enum, an optional `com.semanticops.base` package with `repo_settings` (attachment_policy) settings, deterministic-ZIP archive requirements, srsj-gzip retirement, and a tombstone reference-only state. Schema changes, invariants I-101–I-112, and the `com.semanticops.base/repo_settings` type are all folded into the canonical spec. Full text: rfcs/rfc-017-attachments-base-package-archive-determinism.md.

**Title**: RFC-019: Cross-Field Validation Rules — validationRules on Type and CrossFieldRule Schema
**RFC Number**: 019
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `CrossFieldRule`/`CrossFieldRuleEffect` $defs + `validationRules` on `type.json` (`ext:cross-field-validation`); invariants I-89–I-97.

<!-- srs-integration:v1
ext:cross-field-validation
schema:type.json
I-89
I-90
I-91
I-92
I-93
I-94
I-95
I-96
I-97
-->
**Proposal Artifact Path**: rfcs/rfc-019-cross-field-validation-rules-schema.md
**Content**: Formalizes the JSON Schema `$defs` for `CrossFieldRule`/`CrossFieldRuleEffect` and the `validationRules` property on `type.json` for `ext:cross-field-validation`, and adds spec invariant records pinning the rule types and evaluation semantics. Full text: rfcs/rfc-019-cross-field-validation-rules-schema.md.

**Title**: RFC-020: Type-Level Identity Field (identityFieldId)
**RFC Number**: 020
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `identityFieldId` on `Type` (`type.json`); inheritance + views-l2 fallback prose (`ext:type-inheritance`, `ext:views-l2`).

<!-- srs-integration:v1
schema:type.json
ext:type-inheritance
ext:views-l2
-->
**Proposal Artifact Path**: rfcs/rfc-020-type-level-identity-field.md
**Content**: Adds an optional, inheritable, overridable `identityFieldId` to `Type`, naming one field of the effective field set as the record's identity/display field, giving clients a schema-driven display-label source. Full text: rfcs/rfc-020-type-level-identity-field.md.

**Title**: RFC-022: Relational lifecycle states — requiresRelation + transition fulfillment
**RFC Number**: 022
**Status**: accepted
**Author**: the-greenman
**Affected Components**: `LifecycleState.requiresRelation` (relationType/direction/enforcement) in `lifecycle.json` + inline `type.json`; invariants I-98–I-100.

<!-- srs-integration:v1
ext:lifecycle
schema:lifecycle.json
schema:type.json
I-98
I-99
I-100
-->
**Proposal Artifact Path**: rfcs/rfc-022-relational-lifecycle-states.md
**Content**: Adds `LifecycleState.requiresRelation` (with `relationType`/`direction`/`enforcement` hard|advisory) so a record may only rest in a state if a satisfying relation exists, plus atomic `fulfillment` on the transition write path and an at-rest validation warning. Full text: rfcs/rfc-022-relational-lifecycle-states.md.

**Title**: RFC-023: SourceReference vocabulary disjointness — sourceRole replaces relationType
**RFC Number**: 023
**Status**: accepted
**Author**: Peter Brownell
**Affected Components**: `SourceReference.sourceRole` replaces `relationType` across record/note/typed-record/relations-collection schemas; invariant I-88.

<!-- srs-integration:v1
schema:record.json
schema:note.json
schema:typed-record.json
schema:relations-collection.json
I-88
-->
**Proposal Artifact Path**: rfcs/rfc-023-sourceref-vocabulary-disjointness.md
**Content**: Renames `SourceReference.relationType` to `sourceRole`, de-collides its enum against the Relation vocabulary, defines the graduation mapping between the two, and adds a permanent disjointness conformance rule. Full text: rfcs/rfc-023-sourceref-vocabulary-disjointness.md.

**Title**: RFC-025: Governance Package — Primary-Export DocumentView and Seed Root Container
**RFC Number**: 025
**Status**: accepted
**Author**: the-greenman
**Affected Components**: Governance-package DocumentView + seed root container. No canonical spec record/schema artifact (downstream package only).

<!-- srs-integration:v1
tooling-only
-->
**Proposal Artifact Path**: rfcs/rfc-025-governance-primary-export-documentview.md
**Content**: Adds a `governance-document` DocumentView to the `com.mudemocracy.governance` package and fixes the empty-governance seed to ship a conforming root container plus a `renderedPresentations` default. Introduces no new spec types or schema fields. Full text: rfcs/rfc-025-governance-primary-export-documentview.md.

**Title**: RFC-026: ext:slices — Container Slices (Subset Repository Export)
**RFC Number**: 026
**Status**: accepted
**Author**: the-greenman (from issue the-greenman/srs#194)
**Affected Components**: `ext:slices` extension; optional `slice` block in `manifest.json` (`Slice`, `SliceSpec`, `SliceExternalRef` $defs); container-membership closure rules R1–R14; validation relaxations for slice archives.

<!-- srs-integration:v1
ext:slices
schema:manifest.json
-->
**Proposal Artifact Path**: rfcs/rfc-026-ext-slices-subset-export.md
**Content**: Defines `ext:slices` — a normative extension for container-membership slice export as a valid `.srs` archive. A container slice carries the records reachable from a container's membership, their type/field definitions, intra-slice relations, and referenced source documents. Dangling cross-boundary relations are preserved in `slice.externalRelationRefs[]` (not silently dropped), following the `ext:federation` graceful-degradation precedent. Schema change: `docs/schema/2.0/manifest.json` gains an optional `slice` property with `$defs.Slice`, `$defs.SliceSpec` (type enum: `["container"]`), and `$defs.SliceExternalRef`. Package export — distributing a package's definitions as a `package-bundle.json` — is explicitly excluded from this RFC's scope (RFC-003). Full text: rfcs/rfc-026-ext-slices-subset-export.md.

**Title**: RFC-027: Per-record relation display in document views (relationsPresentation)
**RFC Number**: 027
**Status**: accepted
**Author**: the-greenman (from issue the-greenman/srs#212)
**Affected Components**: `ext:views-l2` `DocumentSection.relationsPresentation` (RelationsPresentation, RelationPresentationEntry $defs in document-view.json); JSON projection ProjectedRecord.relations (ProjectedRelationRow, ProjectedRelationTarget $defs in document-view-output.json); rendering rules [I-027-1]-[I-027-8]; ext:views-l2 subsection amended.

<!-- srs-integration:v1
ext:views-l2
schema:document-view.json
schema:document-view-output.json
subsection:ext-views-l2
-->
**Proposal Artifact Path**: rfcs/rfc-027-document-view-relations-presentation.md
**Content**: Adds one optional property to DocumentSection in ext:views-l2: `relationsPresentation`. When present, each member the section renders is followed by a deterministic links block listing the member's Relations of the declared types — forward edges under a forward label, incoming edges (opt-in via `directions`) under an inverse label. Forward labels default to the installed RelationTypeDefinition label; inverse labels default to a mechanical humanization of the definition's declared inverseType query label (RFC-005); either can be overridden per view. Only stored forward edges are read (Invariant 16); edges display only when their own status is absent or active. Schema changes: `document-view.json` gains RelationsPresentation / RelationPresentationEntry $defs on DocumentSection; `document-view-output.json` gains ProjectedRecord.relations with ProjectedRelationRow / ProjectedRelationTarget $defs. Serves the decision-log links-in-export residual (muDemocracy.org#48 → srs#212) and the rendered supersession audit trail (muDemocracy.org#58). Full text: rfcs/rfc-027-document-view-relations-presentation.md.

**Title**: RFC-029: Core Base Package and Required com.semanticops.core/purpose Identity Type
**RFC Number**: 029
**Status**: accepted
**Author**: the-greenman (from issue the-greenman/srs#134)
**Affected Components**: com.semanticops.core namespace (new); com.semanticops.core/purpose Type (new Tier-2 type); manifest.json/container.json identityInstanceId descriptions; ext:repository (repo create behaviour); invariants I-85, I-86, I-87; RFC-013 I-81 (retained, layered)

<!-- srs-integration:v1
type:com.semanticops.core/purpose
schema:manifest.json
schema:container.json
I-85
I-86
I-87
-->
**Proposal Artifact Path**: rfcs/rfc-029-core-base-package-identity-type.md
**Content**: RFC-013 introduced identityInstanceId as a pointer from the root container to the repository's identity record, defaulting to an un-navigable, non-semantic Tier-0 root note. This RFC introduces a minimal com.semanticops.core/purpose Tier-2 type -- carrying a required statement field and an optional title field -- defined in an always-available core base package that every conforming SRS implementation implicitly merges into every repository's resolved package (RFC-014 R6 union), without requiring any packageRef declaration. identityInstanceId on the root container is tightened to MUST reference a Tier-2 purpose Record, superseding RFC-013's Tier-0-note default, subject to a migration grace period (R7) for existing repositories. This record was authored under issue the-greenman/srs#209 (renumbered from RFC-018 to resolve a number collision with RFC-018: Repository Changelog Extension); the RFC was originally accepted and implemented under the 018 number in July 2026 (see revision history in rfcs/rfc-029-core-base-package-identity-type.md).

