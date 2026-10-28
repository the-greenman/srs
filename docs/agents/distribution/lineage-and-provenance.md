# Lineage and provenance

> Two distinct records of where a definition came from.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

Two distinct records of where a definition came from. Lineage is the relationship to what it was derived from — tracked from a source and expecting upstream updates, or deliberately forked with no further tracking, and possibly both during a transition. Provenance is the publishing origin: who published it, in which package, at what package version, imported when. Together they let a consumer answer whether a local definition has diverged from what it was copied from, and who is answerable for the original.

**Notes**: A package's semver and a definition's integer version are different axes and must not be conflated.

## upstreamPackage.packageId MUST match at least one PackageRef entry's packageId

**Number**: I-84

When `manifest.upstreamPackage` is set, there MUST exist at least one entry in `manifest.packageRefs` (or `manifest.packageRef`) whose `packageId` matches `manifest.upstreamPackage.packageId`. A manifest where no `PackageRef` entry's `packageId` matches `upstreamPackage.packageId` MUST be reported as a validation error. Manifest-only validators MAY skip this check when no `PackageRef` entry carries `packageId` (i.e., all local-mode entries predate RFC-014 and omit the field), and SHOULD report the repository state as indeterminate rather than emitting a validation error in that case.


## Import tracking

How a consumer that receives packages from an upstream publisher records what it imported, whether local content has diverged from the upstream source, and whether the upstream has moved ahead. Divergence and update conflicts are detected and surfaced instead of silently overwritten or silently missed.

### The `ImportMode` values

`ImportMode`, in pseudo-IDL:

```typescript
"upstream-tracked" | "local-copy" | "local-fork"
```


### The `ImportRecord` shape

`ImportRecord`, in pseudo-IDL:

```typescript
{
  definitionId: UUID
  definitionType: "field" | "type" | "view" | "blueprint" | "protocol" | "relation-type"
  namespace: string
  name: string
  version: integer

  mode: ImportMode
  importedAt: ISO8601

  sourcePackageId: UUID
  sourcePackageName: string
  sourcePackageVersion: string

  latestKnownUpstreamVersion?: integer
  updateAvailable?: boolean
  updateCheckedAt?: ISO8601

  conflictState?: "clean" | "local-ahead" | "upstream-ahead" | "diverged"
  conflictDetectedAt?: ISO8601

  localVersion?: integer
  localEditedAt?: ISO8601
}
```


### The `ImportSummary` shape

`ImportSummary`, in pseudo-IDL:

```typescript
{
  generatedAt: ISO8601
  fields: ImportRecord[]
  types: ImportRecord[]
  views: ImportRecord[]
  blueprints: ImportRecord[]
  protocols: ImportRecord[]
  relationTypes: ImportRecord[]
}
```


### The `UpstreamPackage` shape

`UpstreamPackage`, in pseudo-IDL:

```typescript
{
  packageId:   UUID      // Stable UUID of the upstream Package. Never changes across upgrades.
  namespace:   string    // Reverse-DNS namespace, e.g. "com.mudemocracy.governance"
  name:        string    // Package name, e.g. "governance"
  version:     string    // Semver of the upstream version at last install/upgrade
  installedAt: ISO8601   // Timestamp of the last install or upgrade event
}
```


### `ImportMode`

Example: the `ImportMode` values.

| Mode | Meaning |
|---|---|
| `"upstream-tracked"` | Consumer expects updates from the source Package. Conflicts surfaced when local and upstream diverge. |
| `"local-copy"` | Imported as a snapshot. No update tracking. |
| `"local-fork"` | Deliberately diverged. Upstream lineage preserved for reference. |


### `ImportRecord`

One record per imported definition in a consumer's local registry.

Example: the `ImportRecord` shape.


### `ImportSummary`

A consumer's complete picture of its imported definitions.

Example: the `ImportSummary` shape.

---


### Repository-Level Provenance (RFC-014)

When a repository is initialised from a published SRS Package, it records provenance in `manifest.json` at `manifest.upstreamPackage`. This is a normative top-level field — the machine-readable anchor for divergence detection and non-destructive package upgrades.


### `UpstreamPackage`

Shape recorded at install time and updated on upgrade:

Example: the `UpstreamPackage` shape.


### Repository-Level Divergence Detection

When `upstreamPackage` is set, a conforming `ext:import-tracking` implementation MAY detect whether the locally installed definitions differ from the canonical content of the upstream package at that same version (RFC-014 Change E, R8). The comparison is performed against a reference copy (either a byte-for-byte snapshot stored at install time, or re-fetched from the published source if network access is available). A tool without a reference copy simply skips the check.

Divergence is surfaced using the same `conflictState` vocabulary already defined for `ImportRecord`:

| State | Description |
|---|---|
| `"clean"` | Local package content matches the reference copy at install time. No drift. |
| `"local-ahead"` | Local package has definitions not present in the upstream at install time; all differing ids are locally-added. |
| `"diverged"` | One or more local definition files differ from what the upstream declared under the same `id`+`version` key. |

When both `local-ahead` and `diverged` conditions hold simultaneously, implementations MUST report `diverged` as the primary status and include locally-added definitions as a supplementary list.

The `"upstream-ahead"` state (a newer version exists upstream) requires `ext:registry` and is out of scope for local divergence detection.
