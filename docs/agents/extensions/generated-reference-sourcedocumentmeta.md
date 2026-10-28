# Generated reference: `SourceDocumentMeta`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/source-document-meta.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000022-0000-4000-a000-000000000022

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `source-document-meta` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `documentId` | string | yes | format: uuid | core | ext:repository — stable identifier for a source document, used as SourceReference.sourceId when sourceType is repository-document. |
| `contentPath` | string | yes | — | core | Relative path from source-documents/ to the document file (RFC-017). |
| `contentType` | string | yes | — | core | MIME type of the source document content. |
| `encoding` | string | no | — | core | Character encoding of the content file, e.g. utf-8. |
| `language` | string | no | — | core | BCP 47 language tag, e.g. en-GB. |
| `title` | string | no | — | core | Human-readable title. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `processingNote` | string | no | — | core | Caveats about quality or completeness of the source material. |
| `excerpt` | ref → `source-excerpt` (inline) | no | — | core | ext:repository — repository-local excerpt provenance (RFC-017). |
| `date` | date | no | — | core | Date the source document was produced or recorded. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `importedAt` | date-time | no | — | core | ISO-8601 timestamp at which this definition was imported. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/source-document-meta.json>
