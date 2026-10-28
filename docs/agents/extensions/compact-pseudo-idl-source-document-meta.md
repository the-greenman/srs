# Compact pseudo-IDL

> The Compact pseudo-IDL: source-document-meta section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
source-document-meta {
  documentId: string // ext:repository — stable identifier for a source document, used as SourceReference.sourceId when sourceType is repository-document.
  contentPath: string // Relative path from source-documents/ to the document file (RFC-017).
  contentType: string // MIME type of the source document content.
  encoding?: string // Character encoding of the content file, e.g. utf-8.
  language?: string // BCP 47 language tag, e.g. en-GB.
  title?: string // Human-readable title.
  description?: string // Human-readable description of this entity.
  processingNote?: string // Caveats about quality or completeness of the source material.
  excerpt?: ref → `source-excerpt` (inline) // ext:repository — repository-local excerpt provenance (RFC-017).
  date?: date // Date the source document was produced or recorded.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
  importedAt?: date-time // ISO-8601 timestamp at which this definition was imported.
}
```


## Generated reference: `Manifest`

**Referenced Type Id**: 4c00002e-0000-4000-a000-00000000002e

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `manifest` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `srsVersion` | string | yes | — | core | SRS spec version this repository conforms to, e.g. '2.0' or '2.0-draft'. |
| `dataModelRevision` | integer | no | minimum: 0 | core | RFC-033/#265 — monotonic integer generation stamp for operational data-model migrations. Absent means revision 0. |
| `repositoryId` | string | yes | format: uuid | core | Stable UUID for this repository (or, on a Slice, the source repository it was exported from). Never changes on copy or export. |
| `namespace` | string | no | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `title` | string | yes | — | core | Human-readable title. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `declaredExtensions` | string[] | no | — | core | SRS extensions this repository conforms to, e.g. ['ext:lifecycle', 'ext:views-l1']. |
| `rootContainerId` | string | yes | format: uuid | core | RFC-052 [R1]: the containerId of the repository's root container, a Container in the container set (containers/) that is the repository's identity object and the top of structural navigation (RFC-013). |
| `packageRef` | ref → `package-ref` (inline) | no | — | core | Reference to the SRS Package that supplies field and type definitions (single package). |
| `packageRefs` | ref → `package-ref` (inline)[] | no | — | core | References to one or more SRS Packages (RFC-014 Change C, multi-package/multi-version repositories). |
| `upstreamPackage` | ref → `upstream-package` (inline) | no | — | core | RFC-014 (ext:import-tracking) — top-level normative provenance stamp for a repository initialised from an upstream Package. |
| `sourceDocumentsPath` | string | no | — | core | Relative path from manifest.json to the source-documents/ directory. |
| `aiGuidance` | ref → `repository-ai-guidance` (inline) | no | — | core | Comprehension guidance for AI agents reading this repository (Manifest.aiGuidance — a distinct, narrower shape from the generic AiGuidance value object). |
| `renderedPresentations` | ref → `rendered-presentation` (inline)[] | no | — | core | RFC-015 [N+31] — declared presentations for this repository. |
| `slice` | ref → `slice` (inline) | no | — | core | ext:slices (RFC-026) — present when this archive is a partial export (slice) of a source repository. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/manifest.json>
