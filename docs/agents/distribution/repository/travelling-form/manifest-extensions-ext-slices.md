# Manifest extensions (`ext:slices`)

> When ext:slices is declared in a slice archive's manifest.declaredExtensions, RepositoryManifest gains one optional property:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

When `ext:slices` is declared in a slice archive's `manifest.declaredExtensions`, `RepositoryManifest` gains one optional property:

Example: the `slice` manifest property.

| Field | Type | Required | Description |
|---|---|---|---|
| `origin.repositoryId` | `string (uuid)` | yes | `repositoryId` of the source repository this slice was exported from. |
| `spec.type` | `string` | yes | Closure rule. Currently only `"container"` is defined. |
| `spec.id` | `string (uuid)` | yes | The `containerId` that scoped the slice, present in the source repository's container set (RFC-038 [R1]; the manifest's `containerIndex` is retired, RFC-038 [R2]; I-152). |
| `exportedAt` | `string (date-time)` | yes | ISO-8601 timestamp of when the slice was produced. |
| `externalRelationRefs` | `array` | no | Relations cut at export because exactly one endpoint fell outside the closure. Provenance only — not a validation error. |

The slice archive's `manifest.repositoryId` MUST be a **new UUID** distinct from `slice.origin.repositoryId`; the archive is a standalone artifact.
