# Registry

> One catalog of entries by kind, each mapping an identity to a locator: published definition packages (package) and the repositories an implementation may reach (repository), RFC-049.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

One catalog of entries by kind, each mapping an identity to a locator: published definition packages (`package`) and the repositories an implementation may reach (`repository`), RFC-049. For resolving an Address, the operator who loads a registry vouches for its entries, and an implementation uses one registry; for discovery, a consumer may index several catalogs.

## The `RegistryEntry` shape

Kind `package`, in pseudo-IDL. Before RFC-049 this was the only entry, and its optional `downloadUrl` is now `locator`:

```typescript
{
  kind: "package"
  locator: { mode: "remote", url: string } | { mode: "local", path: string }
  packageId: UUID           // identity, with packageVersion
  packageVersion: string
  packageName: string       // display; lookup by it is discovery
  publisher: string
  publishedAt: ISO8601
  fieldCount: integer       // min: 0
  typeCount: integer        // min: 0
  label?: string
  description?: string
  homepage?: string
  tags?: string[]
  viewCount?: integer
  schemaCount?: integer
  protocolCount?: integer
  relationTypeCount?: integer
  checksum?: string         // SHA-256 hex digest for integrity verification
}
```


## The `Registry` shape

Only `entries` is required (RFC-049).

```typescript
{
  entries: RegistryEntry[]    // required; may be empty
  registryRevision?: integer  // the registry's own shape counter; this shape is 1
  schemaVersion?: string
  registryId?: UUID           // inert metadata; nothing resolves by it
  registryName?: string
  catalogVersion?: string     // the catalog's own version (semver)
  updatedAt?: ISO8601
  homepage?: string
  // the top level is closed (rfc-decision-2e0cd70a); a writer still keeps unknown top-level properties on rewrite ([R9])
}
```


## `RegistryEntry`

One entry in a registry (RFC-049). Every entry states its `kind`, carries the identity fields its kind defines, a `locator` in the charter's LOCATOR shape (`{mode: "local", path}` or `{mode: "remote", url}`; a registry carries no artifacts, so `bundled` is not valid), and an optional display-only `label`. A relative `path` resolves against the directory holding the registry. The kinds are `package` (identity `packageId` and `packageVersion`) and `repository` (identity `id`). Other fields are kept on rewrite and never used.

Example: the `RegistryEntry` shape (`package` kind).


## `Registry`

Entries by kind, held in one document outside everything it lists (RFC-049).

Example: the `Registry` shape.

`entries` is required; every other document field is optional and nothing resolves by any of them. A published catalog fills in its name, version and update time; an operator's own list of repositories carries entries only. The document carries its own generation counter, `registryRevision`: this shape is 1, and an unstamped catalog is 0 and is migrated on read.

The operator who loads a registry vouches for its entries. That is the registry's only authority, and the operator's `readOnly` flag on a repository entry is its only write control. Several catalogs may coexist, and a consumer may index several for discovery; for resolution an implementation uses exactly one registry. Lookup by a label or display name is discovery and returns every match; resolving goes by identity only. Failure is per entry. Schema: `docs/schema/2.0/registry.json`.


## `repository` registry entry

One repository an implementation may resolve into and route writes to (RFC-049). Its identity is `id`, the repository's `manifest.repositoryId`; its locator leads to the repository (`local` path, relative to the registry file, or `remote` URL such as an HTTP or MCP endpoint). The `repository` entries that load form the implementation's boundary. Before reading or writing through an entry, the implementation verifies that the repository reached reports the entry's `id`.

`readOnly: true` is the operator's statement that this server never writes to that repository, for example a local copy of an external reference repository. It binds the implementation that loads the registry; absent, the server does not refuse on its own account, which grants nothing the target or its transport refuses, and an implementation MAY treat every `remote` entry as read-only. A clone keeps its source's id, so at most one copy of a repository can be in a boundary: two entries with one identity both fail.

Example: a registry of repositories.


## A registry of repositories

One MCP server's own list: two working repositories and a read-only copy of an external reference repository (RFC-049).

```json
{
  "entries": [
    { "id": "0b6f3c2e-5d1a-4f7b-9c8e-2a4d6e8f0a1b", "kind": "repository", "label": "essays", "locator": { "mode": "local", "path": "../essays" } },
    { "id": "4172fada-bc3e-4d2f-8a1b-6c5d4e3f2a10", "kind": "repository", "label": "research", "locator": { "mode": "local", "path": "../research" } },
    { "id": "e07b9a64-31c2-4e8d-b5f0-7a9c1d2e3f40", "kind": "repository", "label": "reference standard", "locator": { "mode": "local", "path": "../vendor/standard" }, "readOnly": true }
  ],
  "registryRevision": 1
}
```


## Conformance Rules (RFC-049): registry entries

**[R3]** *(`ext:registry`)* Every registry entry MUST carry a `kind`, a `locator` in the LOCATOR shape with mode `local` (`{mode: local, path}`) or `remote` (`{mode: remote, url}`); a registry carries no artifacts, so `bundled` is not valid in it; and the fields its kind requires ([R14]). An entry's `label`, and any other display field, MUST NOT be used to resolve anything; lookup by them is discovery and returns every matching entry.

**[R4]** *(`ext:registry`)* The identity of a `package` entry is `packageId` and `packageVersion`; of a `repository` entry, `id`. Two entries of a kind the implementation supports with the same identity both fail ([R15]); neither is used. An entry that carries its identity takes part in such a conflict even if it is otherwise malformed.

**[R14]** *(`ext:registry`)* The kinds this RFC defines require these fields beyond `kind` and `locator`:
- `package`: `packageId` (UUID), `packageName`, `packageVersion`, `publisher`, `publishedAt`, `fieldCount`, `typeCount`; it MAY carry `label`, `description`, `homepage`, `tags`, `viewCount`, `schemaCount`, `protocolCount`, `relationTypeCount` and `checksum`. `downloadUrl` is not a field of the kind; [R9]'s migration replaces it.
- `repository`: `id` (UUID); it MAY carry `label` and `readOnly` (boolean; absent means `false`, [R16]).

Other fields on an entry are kept on rewrite ([R9]) and never used.


## Conformance Rules (RFC-049): loading, resolving and writing through a registry

**[R6]** *(`ext:registry`)* If the repository reached through a `repository` entry reports a different id from the entry's, the implementation MUST fail resolution or a write through that entry with `id-mismatch` and MUST NOT use either id as an override.

**[R7]** *(`ext:registry`)* Resolution MUST NOT write to or alter the target repository, and MUST NOT make the target's content part of the resolving repository. (This governs resolution only; declared mirroring is left to a later RFC.)

**[R10]** *(`ext:registry`)* A read resolved through a `repository` entry MUST return the same result as the same request made directly against the target repository.

**[R15]** *(`ext:registry`)* Loading a registry reports, per entry and affecting only the entries named: `entry-malformed` (an entry missing `kind`, a valid `locator` or a field [R14] requires, with a `bundled` locator, or with a `readOnly` that is not a boolean, which fails safe: the entry is outside the boundary and cannot be written), `duplicate-identity` (every entry in a [R4] conflict) and `kind-unsupported` (an entry whose kind the implementation does not support, which it keeps but does not use). It refuses the whole document, loading nothing, only when the document is not a JSON object with an `entries` array (`registry-malformed`), or its `registryRevision` is above the supported revision or below it with no transformer for a step (`registry-revision-unsupported`, [R9]).

**[R17]** *(`ext:registry`)* An implementation MAY route a write that carries a `repositoryId` to a member of its boundary, as a write to that one repository through that repository's own services and contracts. Before writing it MUST verify that the repository reached reports the entry's `id` ([R6]). It MUST refuse a write, writing nothing, with the first of these that holds, in this order: `not-in-boundary` (the id is not in its boundary); `read-only` ([R16]; decided from the entry, so a read-only target is never reached); `locator-unusable`; `id-mismatch`; `revision-unsupported` (as in [R5]); `write-refused` (the target or its transport refuses a write that is valid, for example a permission error, a lock, or a remote endpoint that does not accept writes); or the target repository's own validation diagnostics when the write itself is invalid there. Resolution outcomes in [R5] that can hold together are reported in the same order.


## Conformance Rules (RFC-049): the registry document

**[R9]** *(`ext:registry`)* The registry's held form and its travelling form are one JSON document, written by RFC-003 [C5]'s rules: UTF-8 without a byte-order mark, every object's members in ascending order of member name by Unicode code point at every depth, no duplicate names, array order kept except `entries`. `entries` MUST be ordered by `kind`; within a kind the writer supports, by the kind's identity fields in the order [R4] lists them, an absent field first; and every remaining tie and every entry of a kind the writer does not support by the entry's own [C5] serialization. All comparisons are of the text as written, by Unicode code point. The same build of a writer MUST write byte-identical files for identical content. A writer MUST stamp `registryRevision`, an integer that counts registry shapes only, with the revision of the shape it writes; this RFC's shape is `registryRevision` 1. A writer that rewrites a registry MUST keep entries, entry fields and top-level properties it does not understand, unchanged. A reader MUST read an absent stamp as revision 0, MUST refuse, loading nothing, a registry stamped above its supported revision, and MUST bring a registry stamped below it forward through a registry-form transformer for each intervening step, refusing it when a step has none. The step from 0 to 1 has this transformer: on every entry without `kind`, add `kind: "package"`, and replace `downloadUrl` by `locator: {mode: "remote", url: <downloadUrl>}` (an entry without `downloadUrl` gets no locator and fails as `entry-malformed`). How a registry is supplied (flag, file, environment) is the implementation's.
