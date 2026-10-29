# Generated reference: `SourceReference`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/record.json#/$defs/SourceReference>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundation Group (Core)](/agents/foundations/foundation-group-core.md).

**Referenced Type Id**: 4c000014-0000-4000-a000-000000000014

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `source-reference` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `sourceType` | string | yes | enum: "transcript-chunk" \| "transcript-segment" \| "external-document" \| "repository-document" | core | RFC-023 SourceReference kind. repository-document is added by ext:repository. |
| `sourceId` | string | yes | — | core | Free-form when sourceType is transcript-chunk/transcript-segment/external-document. When sourceType is repository-document, MUST be a SourceDocumentMeta.documentId. |
| `sourceStandard` | string | no | — | core | Identifies the standard/convention the sourceId is expressed in. |
| `streamId` | string | no | format: uuid | core | Identifies a stream this source reference belongs to. |
| `sourceRole` | string | no | enum: "evidence" \| "extracted-from" \| "quoted-from" \| "inspired-by" \| "attaches" | core | RFC-023 — the role the source material plays for this instance. attaches added by RFC-017. |
| `confidence` | number | no | minimum: 0, maximum: 1 | core | Confidence score for this source reference, 0-1. |
| `note` | string | no | — | core | Free-form human clarification. Shared by SourceReference.note and SourceAnchor.note. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/record.json#/$defs/SourceReference>

**Compact pseudo-IDL**

```typescript
source-reference {
  sourceType: string // RFC-023 SourceReference kind. repository-document is added by ext:repository.
  sourceId: string // Free-form when sourceType is transcript-chunk/transcript-segment/external-document. When sourceType is repository-document, MUST be a SourceDocumentMeta.documentId.
  sourceStandard?: string // Identifies the standard/convention the sourceId is expressed in.
  streamId?: string // Identifies a stream this source reference belongs to.
  sourceRole?: string // RFC-023 — the role the source material plays for this instance. attaches added by RFC-017.
  confidence?: number // Confidence score for this source reference, 0-1.
  note?: string // Free-form human clarification. Shared by SourceReference.note and SourceAnchor.note.
}
```
