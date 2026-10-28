# Compact pseudo-IDL

> The Compact pseudo-IDL: note section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
note {
  instanceId: string // Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage.
  title?: string // Human-readable title.
  tags?: string[] // Free-form classification tags.
  sections: ref → `note-section` (inline)[] // Ordered list of named text sections (Tier 0 Note).
  sourceRefs?: ref → `source-reference` (inline)[] // References to source material this instance was derived from or attaches to (RFC-017/RFC-023).
  createdAt?: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `SourceReference`

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
