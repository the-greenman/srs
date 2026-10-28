# Compact pseudo-IDL

> The Compact pseudo-IDL: manifest section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
manifest {
  srsVersion: string // SRS spec version this repository conforms to, e.g. '2.0' or '2.0-draft'.
  dataModelRevision?: integer // RFC-033/#265 — monotonic integer generation stamp for operational data-model migrations. Absent means revision 0.
  repositoryId: string // Stable UUID for this repository (or, on a Slice, the source repository it was exported from). Never changes on copy or export.
  namespace?: string // Reverse-DNS logical grouping.
  title: string // Human-readable title.
  description?: string // Human-readable description of this entity.
  declaredExtensions?: string[] // SRS extensions this repository conforms to, e.g. ['ext:lifecycle', 'ext:views-l1'].
  rootContainerId: string // RFC-052 [R1]: the containerId of the repository's root container, a Container in the container set (containers/) that is the repository's identity object and the top of structural navigation (RFC-013).
  packageRef?: ref → `package-ref` (inline) // Reference to the SRS Package that supplies field and type definitions (single package).
  packageRefs?: ref → `package-ref` (inline)[] // References to one or more SRS Packages (RFC-014 Change C, multi-package/multi-version repositories).
  upstreamPackage?: ref → `upstream-package` (inline) // RFC-014 (ext:import-tracking) — top-level normative provenance stamp for a repository initialised from an upstream Package.
  sourceDocumentsPath?: string // Relative path from manifest.json to the source-documents/ directory.
  aiGuidance?: ref → `repository-ai-guidance` (inline) // Comprehension guidance for AI agents reading this repository (Manifest.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object).
  renderedPresentations?: ref → `rendered-presentation` (inline)[] // RFC-015 [N+31] — declared presentations for this repository.
  slice?: ref → `slice` (inline) // ext:slices (RFC-026) — present when this archive is a partial export (slice) of a source repository.
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `View`

**Referenced Type Id**: 4c00003c-0000-4000-a000-00000000003c

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `view` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `compatibleTypes` | string[] | no | — | core | Optional Type-key hints (namespace/name) a View was designed for. Informational only. |
| `exportConfig` | ref → `export-config` (inline) | no | — | core | The shared render-output configuration shape (ext:views-l1), attached at both Composition and View (srs#525: one shape, two attachment points). |
| `aiGuidance` | ref → `view-ai-guidance` (inline) | no | — | core | Guidance for AI agents using a View (View.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object: purpose + extraction only). |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/view.json>
