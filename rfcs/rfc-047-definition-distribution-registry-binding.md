> **Origin**: carried from RFC-003 Revision 5 (`rfcs/rfc-003.md`, the-greenman/srs#857). RFC-003 Revision 6 narrowed RFC-003 to whole-package export so that subset could be accepted; every other part of RFC-003 Revision 5 moved here unchanged, except where noted in the Revision history. GitHub issue: to be filed when the owner approves RFC-003 Revision 6's mechanics.

# RFC-047: Definition Distribution — Entry Points, Subset Export, Registry, and Binding

**Status**: Draft (Revision 1)
**Affects**: Distribution Group (Core), `ext:import-tracking`, `ext:registry`, `ext:binding`, `ext:themes-l1`
**Builds on**: RFC-003 (the Package Bundle, whole-package export and the `.srspkg` file form, [C1]–[C6]); RFC-014 (Accepted); RFC-026 (Accepted); RFC-044 (Accepted)
**Author**: Codex draft (as RFC-003 Revisions 1–5); carried to its own number 2026-10-02
**Date**: 2026-05-27 (carried 2026-10-02)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-02 | Carried verbatim from RFC-003 Revision 5 (whose history, Revisions 1–5, is in `rfcs/rfc-003.md`): Changes A, B, D and G, Change C's subset export, registry Distribution bullet, import semantics, *Relationship to import tracking* and `ConflictRecord`, and the Deferred Follow-Ons. Edits are limited to: Change C retitled *Subset export and registry distribution*, with the Package Bundle, whole-package export and `.srspkg` text replaced by citations of RFC-003; the subset half of Revision 5's `[C3]` restated as [S1]. Not yet re-reviewed against the current model: `DocumentView` (now Composition), `Schema` (RFC-004, superseded by RFC-033) and the federation removal (`rfc-decision-4f1e12e5`) are known stale points. Needs a Charter Check before any acceptance. |

---

## Abstract

SRS already defines the core ingredients for sharing semantic definitions and exchanging repository content: `Package`, `Lineage`, `Provenance`, `ext:import-tracking`, `ext:registry`, `ext:repository`, and `ext:federation`. What remains underspecified is the practical distribution model: how reusable fields, "templates", and protocols should be packaged for reuse; how a subset of an existing repository should be exported as a portable artefact; and how consumers should distinguish "install this shared library" from "import this slice of semantic content".

This RFC makes that distinction explicit.

- **Reusable definitions** are shared as **Packages**
- **Repository content** is shared as **Repository Archives** (RFC-017) or **Container Slices** (RFC-026)
- **Registries** catalog definition packages
- **Bindings** determine whether upstream content is authoritative, tracked, or explicit-only
- **Federation** and archive import rules govern repository-level exchange

The RFC also introduces package entry points for discoverability. Partial *repository* export (a subset of records with their relations, definitions, and source documents) is defined by RFC-026 (`ext:slices`), not here; this RFC owns the definitions side of distribution.

---

## Motivation

### Problem 1 — "fields, templates, and protocols" are shareable, but the share unit is ambiguous

Older planning documents describe a field library and decision templates as the reusable authoring surface:

- fields are atomic reusable definitions
- templates are curated compositions of fields
- template-level prompt framing is distinct from field-level extraction semantics

That model remains correct in spirit, but in SRS v2 the formal shareable artefact is not "a template" as a standalone core type. The current spec's reusable unit is `Package`, which may contain `Field`, `Type`, `View`, `DocumentView`, `Schema`, `Protocol`, and `RelationTypeDefinition`.

Without a clear statement of this mapping, implementers will invent parallel export formats for "field libraries" and "template bundles" instead of using the Package system already present in the spec.

### Problem 2 — subset export is implied, but not defined

`ext:repository` defines a full archive as a self-contained snapshot of a live repository. Import and re-import are identity-based. This is correct for full exchange, but many real workflows require exporting only part of a repository:

- a small library of reusable governance definitions
- one protocol family
- one document kit built from fields, views, and document views
- a selected set of records and supporting evidence for handoff to another repository

Today a producer can construct such an export ad hoc, but the spec does not say what closure rules apply, when a new `repositoryId` is required, or how the receiving side should interpret the result.

Of these, the *definitions* cases are addressed by this RFC (Change C — package export). The *records* case — handing off content with its supporting evidence — is a repository subset and is addressed by container slices (RFC-026), not by this RFC.

### Problem 3 — distribution mechanism is described structurally but not operationally

The spec defines `Registry` and `RepositoryRegistry` as data shapes, but does not yet say what a typical publishing pipeline looks like. As a result, it is unclear whether "distribution" means:

- publishing a definition package to a registry
- zipping a repository snapshot
- exporting a subset as a new repository
- or all three

This RFC defines those roles cleanly without introducing a central service requirement.

### Problem 4 — binding and override behaviour is not declared

Real systems do not all relate to upstream content in the same way.

- In a **governance hierarchy**, a subordinate repository may be bound to a core SRS such that core decisions, protocols, and other scoped content automatically become effective locally
- In a **federated environment**, another group's content may be visible and discoverable, but adoption should happen only by explicit import
- In both cases, a local repository may hold derived or forked elements that conflict with upstream changes

The current spec has import modes and lineage, but it does not yet let a repository declare the governing relationship it wants with an upstream source, nor how conflicts should be surfaced when authority and local derivation collide.

---

## Design Principles

**Keep definitions separate from content.** Reusable semantic definitions are not the same thing as semantic instances. Packages and repositories must remain distinct artefact types.

**Preserve existing identity rules.** Distribution must continue to rely on `id`, `version`, `instanceId`, `relationId`, `documentId`, `packageId`, and `repositoryId`, not filenames or storage paths.

**Subset export must be closure-based.** A portable subset is not an arbitrary file copy; it is a selected root plus the dependencies required to make it valid and comprehensible elsewhere.

**Local-first publication is valid.** A package registry may be a static JSON file in Git or object storage. A `.srspkg` bundle or a container slice (RFC-026) may be handed over as a file with no server infrastructure.

**"Template" remains an informal umbrella term.** The spec should not reintroduce a new core template type. In SRS v2, template-like behaviour is expressed through `Type`, `View`, `DocumentView`, `Schema`, and `Protocol`.

**Binding must be declared, not assumed.** Consumers must be able to state whether an upstream source is authoritative, merely tracked, or only importable on explicit request.

**Authority does not erase conflict.** Even when an upstream source has precedence, conflicting local content must remain visible and addressable rather than being silently discarded.

---

## Proposed Changes

### Change A — Clarify the reusable distribution model around `Package`

Add the following normative clarification to the `Package` section in the Distribution Group.

> `Package` is the primary reusable distribution unit for semantic definitions. A Package may contain any combination of Fields, Types, Views, DocumentViews, Schemas, Protocols, and Relation type definitions. Implementations that colloquially speak of "field libraries", "template libraries", "protocol packs", or "document kits" must express those libraries as Packages rather than as implementation-specific export formats.

Add the following explanatory note:

> In older field-library terminology, a "template" is usually not a single SRS construct. Depending on behaviour, it may correspond to a `Type`, `View`, `DocumentView`, `Schema`, `Protocol`, or a package-level combination of several of these. "Template" remains a valid user-facing label, but it is not introduced here as a new core schema type.

This makes the mapping from the older field-library architecture to SRS explicit:

- field library → `Package.fields[]`
- reusable record template → `Type` plus optional `View`
- reusable document template → `DocumentView`
- reusable extraction kit → `Schema`
- reusable facilitation pattern → `Protocol`

---

### Change B — Add package entry points for discoverability and subset publication

Extend `Reference.definitionType` and `ImportRecord.definitionType` so that, when this RFC is co-applied with RFC-002, the resulting portable vocabulary is:

```typescript
"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type"
```

This aligns the reference and import-tracking vocabularies with objects that are already package content and may reasonably appear in a package's public surface. In particular, visual themes introduced by RFC-002 `ext:themes-l1` are already first-class sharable artefacts and participate in the same package and registry mechanisms.

Add the following optional field to `Package`:

```typescript
entryRefs?: Reference[]
// Definitions intended as the package's direct public entry points.
// Examples: a top-level Type, DocumentView, Schema, or Protocol that a consumer
// would intentionally install, select, or build from.
```

`entryRefs` is not a dependency list. It is the authored public surface of the package.

#### Semantics

- A package may contain helper definitions that are not in `entryRefs`
- Every `entryRefs[]` item must either:
  - resolve to a definition present in the package's own content arrays, or
  - appear in `dependencyRefs[]` when the package is exposing an externally supplied dependency
- In `mode: "bundled"`, every locally defined `entryRefs[]` item must be present in the corresponding package content array
- `entryRefs` may reference `field`, `type`, `view`, `document-view`, `schema`, `protocol`, `theme`, or `relation-type`

#### Purpose

`entryRefs` solves two related problems:

1. It tells a registry consumer which definitions are meant to be selected directly
2. It provides a clean starting set for subset package export

For example, a governance package may contain twenty shared fields, four types, three single-record views, one `DocumentView`, and one `Protocol`, but expose only:

- `governance/decision@2`
- `governance/decision_record@1`
- `governance/decision_protocol@1`

as its public entry points.

#### Registry surfacing

Add the following optional field to `RegistryEntry`:

```typescript
entryRefs?: Reference[]
// Optional copy of the package's public entry surface for lightweight discovery.
// Allows clients to browse installable protocol/type/document-view entry points
// without downloading the entire package first.

declaredExtensions?: string[]
// Optional list of SRS extensions the package's public surface depends on or enables.
// Examples: "ext:protocol", "ext:views-l2", "ext:themes-l1".
// Supports UI and AI discovery workflows such as "find packages that provide
// sharable themes" or "find protocol packages for ext:protocol".

providedDefinitionTypes?: Array<"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type">
// Optional summary of definition kinds exposed by the package's public surface.
// Examples: "protocol", "document-view", "theme".

themeCount?: integer
// Optional count of Theme definitions in the package.
```

Registry consumers should be able to filter by `entryRefs`, `declaredExtensions`, and `providedDefinitionTypes` without downloading full package payloads. This is intended to support both human-facing package browsers and AI-assisted discovery and installation workflows.

---

---

### Change C — Subset export and registry distribution

The Package Bundle, whole-package export, the `.srspkg` file form and its determinism are RFC-003's ([C1]–[C6]). This change adds the second form of package export and its distribution.

- **Subset export** — synthesise a new package from a selected subset of definitions across one or more source packages, emitted as a Package Bundle under RFC-003 [C1], [C2], [C4], [C5] and [C6].
- **Distribution.** The `.srspkg` bundle is *itself* the distributed artifact. An `ext:registry` catalog entry's `downloadUrl` points at the `.srspkg` with a `sha256` `checksum`; `srs package install` consumes it directly. No archive wrapper (e.g. a `.tar.gz` of a directory tree) is required.

#### Export algorithm (subset)

1. Select one or more root definitions, typically from `entryRefs`.
2. Compute the transitive dependency closure required for the selected definitions to validate and render correctly (see **Dependency closure rules**).
3. Emit a Package Bundle containing exactly that closure, definitions inlined.
4. Preserve the original definition `id`, `namespace`, `name`, and `version` for every carried definition (RFC-003 [C4]).
5. Mint the bundle's package identity per [S1].

#### Package identity (subset)

**Subset export** MUST mint a **new** `packageId` and an initial `packageVersion`. A curated subset is a genuinely new package with no prior lineage; this is the *publication event*.

> **[S1]** For a **subset** export, the producer MUST mint a **new** `packageId` and an initial `packageVersion` (a publication event). *(The subset half of RFC-003 Revision 5's `[C3]`.)*

#### Dependency closure rules

- Exporting a `Type` includes all referenced `Field`s
- When `ext:type-inheritance` is declared, exporting a derived `Type` includes the full transitive closure of its base Types and the Fields required by those base Types
- Exporting a `View` includes its referenced `Type` and that Type's referenced `Field`s
- Exporting a `DocumentView` includes any referenced `View`s, all `Type`s those Views require, all `Field`s those Types require, and any referenced `Theme`s reachable through `themeRef` or `themeVariants[]` when `ext:themes-l1` is declared
- Exporting a `Schema` includes all referenced `Type`s and their dependent `Field`s
- Exporting a `Protocol` includes `targetType`, all `outputType`s, all `contributesTo` field references, and their dependent Types/Fields

#### Import semantics

Import of subset packages uses the existing definition identity rules:

- same `id` + `version`, same content → no-op
- same `id` + `version`, different content → conflict
- new `id` + `version` → insert

On the consumer side there is **no auto-migration** (RFC-014 R3): a newer package version installs *alongside* the prior one; records that bind to earlier definition versions are not rewritten. Migration remains intentional, via `supersedes`/`refines`.

#### Relationship to import tracking

Consumers importing a subset package should record imported definitions in `ext:import-tracking` exactly as they would for a full package:

- `upstream-tracked` when they expect updates from the source lineage
- `local-copy` when they are taking a frozen snapshot
- `local-fork` when they intend to diverge intentionally

This RFC also extends `ext:import-tracking` with a shared conflict surface so plain import collisions and binding collisions use one canonical mechanism.

#### `ConflictRecord`

When `ext:import-tracking` is declared, implementations may persist conflicts detected during package import, repository import, or binding evaluation as:

```typescript
{
  conflictId: UUID

  targetKind: "definition" | "instance"
  bindingId?: string

  localIdentity:
    | { definitionRef: Reference }
    | { instanceId: UUID }
  sourceIdentity?:
    | { definitionRef: Reference }
    | { instanceId: UUID }

  conflictType: "same-identity-different-content" | "derived-divergence" | "authority-shadow" | "incompatible-upgrade"

  effectiveResolution: "prefer-source" | "prefer-local" | "manual-pending"
  status: "open" | "resolved" | "dismissed"

  detectedAt: ISO8601
  resolvedAt?: ISO8601
  note?: string
}
```

#### Conflict semantics

- When `targetKind === "definition"`, identity must be expressed using `definitionRef`
- When `targetKind === "instance"`, identity must be expressed using `instanceId`
- `same-identity-different-content` means the same stable identity key resolved to different content
- `derived-divergence` means a local element sharing lineage with an upstream element has materially diverged
- `authority-shadow` means local content remains stored but is not effective because an authoritative source has precedence
- `incompatible-upgrade` means an upstream change cannot be applied cleanly to the local dependent content

Implementations may automatically choose an effective side according to binding or import policy, but they must still create and preserve a `ConflictRecord` until the divergence is acknowledged or resolved.

---
### Change D — Define `ext:binding`

Add a new optional extension:

| Extension | Identifier | Depends on | Notes |
|---|---|---|---|
| Binding | `ext:binding` | `ext:import-tracking` | Declared binding mode, authoritative precedence, and conflict surfacing for imported definitions and repository content |

This extension allows a repository to declare how it is bound to upstream packages and repositories.

#### `BindingMode`

```typescript
"authoritative-upstream" | "tracked-upstream" | "explicit-import"
```

| Mode | Meaning |
|---|---|
| `"authoritative-upstream"` | Matching upstream content becomes locally effective automatically within the declared scope. Conflicts are still recorded and surfaced. |
| `"tracked-upstream"` | Upstream updates are discovered and tracked, but do not become effective until explicitly accepted by the consumer. |
| `"explicit-import"` | Upstream content is available only for deliberate manual import. No automatic tracking or adoption occurs. |

#### `BindingResolution`

```typescript
"prefer-source" | "manual" | "prefer-local"
```

This field controls which side becomes the effective version when content in scope conflicts. It does not suppress conflict recording.

#### `BindingScope`

```typescript
type BindingScope =
  | {
      targetKind: "definitions"
      definitionTypes?: Array<"field" | "type" | "view" | "document-view" | "schema" | "protocol" | "theme" | "relation-type">
      namespaces?: string[]
      names?: string[]
    }
  | {
      targetKind: "instances"
      typeNamespace?: string
      typeName?: string
      typeId?: UUID
      instanceIds?: UUID[]
    }
```

#### `BindingSource`

When `ext:binding` is declared, `RepositoryManifest` gains:

```typescript
bindings?: Array<{
  bindingId: string

  sourceKind: "package" | "repository"

  sourcePackageId?: UUID
  sourceRepositoryId?: UUID

  mode: BindingMode
  resolution: BindingResolution
  autoUpdate?: boolean
  // Meaning depends on mode; see auto-update behaviour table below.

  scope: BindingScope[]

  note?: string
}>
```

`sourcePackageId` is used when the authority is a definition package. `sourceRepositoryId` is used when the authority is a repository, such as a core governance SRS containing authoritative decisions or protocols.

#### Binding semantics

Bindings are declarations of governing relationship, not just import history.

- A repository may bind to a **core governance source** using `mode: "authoritative-upstream"` and `resolution: "prefer-source"`
- A repository may bind to a **federated peer source** using `mode: "explicit-import"` and `resolution: "manual"`
- A repository may track an evolving upstream package using `mode: "tracked-upstream"`

#### Normative behaviour

1. `authoritative-upstream` may automatically install or refresh newer upstream content for items in scope
2. `tracked-upstream` may automatically detect updates, but must not make them effective without an explicit accept/promote action
3. `explicit-import` must never change local effective content without an explicit import action
4. No binding mode may silently delete local conflicting content
5. Existing bound runs or records must not be silently rebound in place

This last rule is especially important for facilitation. If a `ProtocolRun` started against protocol version 3, a later import of version 4 may become the effective default for future runs, but it must not mutate the already-running or already-recorded run.

Conflicts produced under this extension must be recorded using `ext:import-tracking` `ConflictRecord`s.

#### Auto-update behaviour

| `mode` | `autoUpdate` | Required behaviour |
|---|---|---|
| `"authoritative-upstream"` | `true` | Implementation should automatically fetch/install updates for items in scope when reachable. Updated source content becomes effective per `resolution`. |
| `"authoritative-upstream"` | `false` or absent | Implementation may require manual sync/fetch, but once the upstream update is accepted locally, source precedence still governs effective content. |
| `"tracked-upstream"` | `true` | Implementation may automatically detect or fetch updates, but must keep them non-effective until an explicit accept/promote action occurs. |
| `"tracked-upstream"` | `false` or absent | Update detection and fetch are manual. No upstream change becomes effective automatically. |
| `"explicit-import"` | `true` | Invalid. Implementations must reject the binding or treat `autoUpdate` as `false` and surface a validation warning. |
| `"explicit-import"` | `false` or absent | Only explicit import actions may create or update local content from the source. |

#### Governance hierarchy example

A local cooperative repository may declare:

```json
{
  "bindings": [
    {
      "bindingId": "core-governance-protocols",
      "sourceKind": "repository",
      "sourceRepositoryId": "11111111-1111-1111-1111-111111111111",
      "mode": "authoritative-upstream",
      "resolution": "prefer-source",
      "autoUpdate": true,
      "scope": [
        {
          "targetKind": "definitions",
          "definitionTypes": ["protocol"],
          "namespaces": ["mudemocracy"]
        },
        {
          "targetKind": "instances",
          "typeNamespace": "governance",
          "typeName": "decision",
          "instanceIds": [
            "33333333-3333-3333-3333-333333333333",
            "44444444-4444-4444-4444-444444444444"
          ]
        }
      ]
    }
  ]
}
```

In this model, upstream governance decisions and protocols are authoritative for the declared scope. Local conflicting content may remain stored, but the effective content is the source-preferred version until the conflict is addressed.

#### Federated example

A repository consuming another group's protocol library in a federation may declare:

```json
{
  "bindings": [
    {
      "bindingId": "community-protocols",
      "sourceKind": "package",
      "sourcePackageId": "22222222-2222-2222-2222-222222222222",
      "mode": "explicit-import",
      "resolution": "manual",
      "scope": [
        {
          "targetKind": "definitions",
          "definitionTypes": ["protocol"],
          "namespaces": ["community.adr"]
        }
      ]
    }
  ]
}
```

In this model, the peer library is visible and importable, but it has no automatic override power.

---

### Change G — Clarify the distribution mechanism

Add the following non-normative guidance after `ext:registry` and `ext:federation`.

#### Recommended distribution workflow

**For reusable definitions:**

1. Author or edit definitions locally
2. Publish them as a `Package`
3. Add a `RegistryEntry` with `downloadUrl`, `checksum`, `entryRefs`, and discovery metadata such as `declaredExtensions`
4. Consumers declare binding mode for that source: authoritative, tracked, or explicit-import
5. Consumers install or update the package through their local registry/import-tracking workflow

**For hierarchical governance:**

1. Declare a `BindingSource` pointing to the core repository or package
2. Use `mode: "authoritative-upstream"` when the core source should become effective automatically
3. Record and surface local derived conflicts rather than discarding them

**For federated exchange:**

1. Discover peer repositories or packages through federation or registries
2. Use `mode: "explicit-import"` when peer content should be adopted only by explicit local choice
3. Preserve conflict records for any imported derived divergence

**For repository content handoff:**

1. Export either a full repository archive (RFC-017) or a container slice (RFC-026)
2. Share the resulting `.srs` archive via filesystem, Git, object storage, or HTTP
3. Consumers either mount it as a repository or merge it into an existing repository

**For long-lived repository discovery:**

1. Maintain a `RepositoryRegistry`
2. Optionally federate registries via `childRegistries`
3. Preserve unresolved external repository citations rather than rejecting them

This makes the intended roles explicit:

- `Registry` → catalogs reusable definition packages
- `Registry` metadata → supports human and AI discovery by extension, entry point, and definition kind
- `BindingSource` → declares whether an upstream source is authoritative, tracked, or explicit-only
- `RepositoryRegistry` → catalogs repositories
- `.srs` archive → shareable transport format for repository content

No central service is required for any of the above.

---

## Consequences

### Benefits

- Reuses the current Package/Registry/Import Tracking model instead of creating a parallel "template sharing" mechanism
- Gives a clean answer to the field-library requirement that fields are atomic and templates are curated compositions
- Adds an explicit answer for governance hierarchies versus federated peer exchange
- Makes subset export portable and auditable
- Preserves the identity-based import rules already defined by the spec
- Makes conflict handling a first-class, addressable concern instead of an implementation footnote
- Supports both offline file exchange and hosted distribution

### Tradeoffs

- Introduces one more optional extension: `ext:binding`
- Requires producers to compute dependency closure deliberately rather than copying files loosely

---

## Deferred Follow-Ons

The following items are intentionally deferred rather than treated as blockers for this RFC:

1. **Extension-expandable definition kinds**
   A future RFC should decide whether `Reference.definitionType` remains a closed core enum extended piecemeal, or becomes an extension-expandable registry/open union so future packageable extension constructs can participate without repeated core amendments. The addition of `theme` in RFC-002 demonstrates that this pressure already exists.

2. **Record-level slice closure**
   RFC-026 defers record-selection closure (an arbitrary set of records plus its dependency closure) to a future RFC (RFC-026 R10). When that RFC lands, it may also define a machine-readable selection model — a closure DSL, query object, or standard traversal expression — for reproducible slice generation.

---

## Summary

This RFC does not propose a new universal sharing mechanism. It sharpens the ones SRS already has:

- share reusable definitions as **Packages**, exported as **Package Bundles** (`.srspkg`)
- declare governing relationships through **Bindings**
- track updates with **Import Tracking**
- publish discoverability metadata with **Registry**
- share content as **Repository Archives** (RFC-017)
- share subsets as **Container Slices** (RFC-026)

That separation aligns with both the current SRS spec and the older field-library architecture: reusable fields stay reusable, template-like compositions stay packageable, and repository content can move independently without being confused for a definition library.