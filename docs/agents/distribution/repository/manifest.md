# Manifest

> Every repository declares its manifest at manifest.json, the one file a reader or a loader consults first: the repository's repositoryId, its srsVersion and dataModelRevision, its packageRef, and the…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

Every repository declares its manifest at `manifest.json`, the one file a reader or a loader consults first: the repository's `repositoryId`, its `srsVersion` and `dataModelRevision`, its `packageRef`, and the `rootContainerId` that names its required root Container.

The manifest is a descriptor, not an index. It carries no `instanceIndex` and no other index (RFC-038 [R2]): the `records/`, `relations/` and `containers/` trees are the authoritative membership (RFC-038 [R1]). `PackageRef` names where the package that defines this repository's Fields and Types lives, local or by reference. A `SourceAnchor` anchors a source document to the position in a Tier 2 Record's content it was extracted from.

The manifest's `rootContainerId` names the repository's required root Container (RFC-013, RFC-052): a Container stored at `containers/<rootContainerId>/` like every other container (RFC-051). Its `identityInstanceId` names the repository's identity Record, and every other member is a navigation section.

The root Container's order is navigation order: navigation is the order of the root Container's `memberInstanceIds` entries, excluding the entry named by `identityInstanceId`, with depth-0 entries as the navigation sections and deeper entries nested under their derived parent ([R12]). Navigation is not derived from the `precedes` chain or Rule [N+12], and the identity entry is at depth 0 with no descendants ([R2]).

From revision 10 a repository always has exactly one root Container (RFC-052 [R1], [R8]). Setting the root is pointer-only: it changes only `rootContainerId`, to name an existing Container, and changes no Container. The promoted Container and the previous root keep their own titles, identity Records and entries, and the previous root stays an ordinary Container. An id that names no Container is refused (`container-not-found`), and so is unsetting the root (`manifest-root-container-missing`, meaning only that the manifest has no root); neither writes anything. To rename a root, create a Container and point at it; changing a root's title, identity or members is an ordinary Container edit.

A corpus still to be migrated to revision 10 is recognised by the `dataModelRevision` its manifest declares (9 or lower), never by the manifest's shape: it is reported as `container-migration-needed` and refused for every other operation, whatever its shape (RFC-052 [R7]). The migration refuses, before any write, a manifest that carries neither `container` nor `rootContainerId` (`migration-root-missing`), or both (`migration-root-duplicate`). A manifest that already names a stored root by `rootContainerId` is only restamped to revision 10, after checking that exactly one Container declares that id (`manifest-root-container-missing` if none, `migration-root-duplicate` if several) and that it validates.

## `RepositoryManifest`

The root manifest. Must be present at `manifest.json` in the repository root.

Example: the `RepositoryManifest` shape.


## The `RepositoryManifest` shape

`RepositoryManifest`, in pseudo-IDL:

```typescript
{
  formatVersion: string      // SRS repository format version, e.g. "1.0"
  srsVersion: string         // SRS spec version, e.g. "2.0"
  conformance: string        // full conformance declaration string

  repositoryId: UUID         // stable identifier; does not change on export or copy
  title: string              // human-readable name for this repository

  container: Container       // inline Container — canonical; authoritative over
                             // any separate container.json in the root

  packageRef?: PackageRef    // reference to local or external package definitions

  instanceIndex: InstanceIndexEntry[]
  // Authoritative list of all SRS instances in this repository.
  // An instance not in the index is not a member, even if its file is present.

  relationsPath?: string | string[]
  // Relative path(s) to relation file(s). Default: "relations/relations.json"

  sourceDocumentsPath?: string
  // Relative path to source documents folder. Default: "source-documents/"

  sourceDocumentIndex?: SourceDocumentIndexEntry[]
  // Optional explicit index of source documents. When present, implementations
  // may use this for discovery instead of scanning for *.meta.json files.
  // When absent, discovery is by sidecar scan. See Invariant 52.

  relationsChecksums?: RelationsChecksumEntry[]
  // Optional checksums for each relations file declared in relationsPath.
  // Enables fast no-op detection for relation collections during re-import.

  createdAt: ISO8601
  updatedAt?: ISO8601
}
```


## `PackageRef`

Reference to the package supplying Field and Type definitions for this repository.

Example: the `PackageRef` shape.

When `packageRef` is absent, all Type and Field definitions are expected pre-installed. When `mode` is `"local"`, the package at `path` must be `mode: "bundled"` and must include all Fields and Types referenced by any Tier 2 Record in the repository (see Invariant 50).


## The `PackageRef` shape

`PackageRef`, in pseudo-IDL:

```typescript
{
  mode: "local" | "remote"  // renamed from "external" (rfc-decision-c8704763)

  // local: definitions live in the repository under package/
  path?: string           // relative path to package.json; default: "package/package.json"

  // remote: definitions are expected pre-installed in the consumer's registry
  packageId?: UUID
  packageName?: string
  packageVersion?: string
}
```


## `InstanceIndexEntry`

One entry in the manifest instance index.

Example: the `InstanceIndexEntry` shape.

`path` is the authoritative locator. If `typeName` or `title` conflict with the resolved instance file, the file content takes precedence.


## The `InstanceIndexEntry` shape

`InstanceIndexEntry`, in pseudo-IDL:

```typescript
{
  instanceId: UUID
  tier: 0 | 2             // 0: Note, 2: Record (1 is a retired gap — Tier 1/TypedRecord, rfc-decision-53635966)
  path: string            // relative path from repository root
                          // e.g. "records/decisions/decision-mounting-system.json"

  typeId?: UUID           // Tier 2 only: the Type this Record instantiates
  typeName?: string       // denormalised convenience; not authoritative
  title?: string          // denormalised for display; not authoritative

  checksum?: string       // digest of the instance file: "<algorithm>:<hex>"
                          // e.g. "sha256:4b2c...". Enables fast no-op detection
                          // during re-import without reading file content.
}
```


## `RelationsChecksumEntry`

One entry in the optional `relationsChecksums` manifest field.

Example: the `RelationsChecksumEntry` shape.


## The `RelationsChecksumEntry` shape

`RelationsChecksumEntry`, in pseudo-IDL:

```typescript
{
  path: string       // matches an entry in relationsPath
  checksum: string   // digest of the relations file: "<algorithm>:<hex>"
}
```


## `SourceAnchor`

A lightweight locator for a position within a source document. Used primarily when capturing a repository-local excerpt from a larger mutable source document in a standalone repository.

Example: the `SourceAnchor` shape.


## The `SourceAnchor` shape

`SourceAnchor`, in pseudo-IDL:

```typescript
{
  kind: "line-range" | "char-range" | "timestamp-range" | "message-id" | "json-pointer" | "custom"
  value: string
  note?: string
}
```


## Relations storage

Relations are stored as a **JSON object** conforming to the relations-collection schema: a `$schema` key and a `relations` array. A bare JSON array is not a conforming relations file. The default location is `relations/relations.json`. When `relationsPath` is an array of paths, their `relations` arrays are concatenated for resolution. A `relationId` must be unique across all relation files in the repository.


## Schema conventions

Every JSON file in a repository should declare its schema via a `$schema` key as the first property. This makes the repository self-describing to JSON Schema validators and AI agents without requiring external tooling.

**Canonical schema URLs** (SRS 2.0 structural schemas):

| File type | `$schema` value |
|-----------|----------------|
| `manifest.json` | `https://srs.semanticops.com/schema/2.0/manifest.json` |
| Notes (Tier 0) | `https://srs.semanticops.com/schema/2.0/note.json` |
| Records (Tier 2) | `https://srs.semanticops.com/schema/2.0/record.json` |
| Relations collection | `https://srs.semanticops.com/schema/2.0/relations-collection.json` |
| Source document sidecar | `https://srs.semanticops.com/schema/2.0/source-document-meta.json` |
| Field definition | `https://srs.semanticops.com/schema/2.0/field.json` |
| Type definition | `https://srs.semanticops.com/schema/2.0/type.json` |
| Package | `https://srs.semanticops.com/schema/2.0/package.json` |

**Domain schemas**: A package may supply additional domain schemas that validate type-specific field constraints. These narrow the structural Record schema with `allOf` and are placed in `package/schemas/`. A domain schema's `$id` should follow the pattern `https://srs.semanticops.com/schema/domain/<namespace>/<typeName>/<version>.json`. Records conforming to a specific Type may declare the domain schema `$id` instead of the generic record schema URL.

**Relations collection format**: The relations file must be a JSON object with a `$schema` key and a `relations` array — not a bare array. This ensures the file is self-identifying.

**Offline use**: Conforming implementations are not required to fetch schema files at runtime. The `$schema` key is a documentation and tooling hint, not a live reference. A repository may include a local copy of the structural schemas in a `schemas/` directory at the repository root for offline validation.

**AI comprehension**: The presence of `$schema` in every file allows an AI agent to identify the purpose of any file without reading its full content. Combined with the `instanceIndex` in `manifest.json` and any `aiGuidance` blocks, a repository becomes traversable by an LLM without prior knowledge of its structure.
