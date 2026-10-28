# Compact pseudo-IDL

> The Compact pseudo-IDL: source-reference section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

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


## Generated reference: `Record`

**Referenced Type Id**: 4c000017-0000-4000-a000-000000000017

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `record` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `instanceId` | string | yes | format: uuid | core | Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage. |
| `typeId` | string | yes | format: uuid | core | Stable UUID of the referenced Type. |
| `typeVersion` | integer | yes | minimum: 1 | core | Version of the Type this ref targets (version-exact anchor). |
| `typeNamespace` | string | yes | — | core | Denormalized hint: the namespace of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `typeName` | string | yes | — | core | Denormalized hint: the name of the bound Type. If it conflicts with the resolved Type, typeId wins. |
| `lifecycleState` | string | no | — | core | ext:lifecycle — current lifecycle state of this Record. |
| `fieldValues` | dependent → type_id | yes | — | core | RFC-039: the name-keyed recursive value carrier, shaped by the Record's bound Type (resolved via typeId). Deliberately lossy at this envelope layer (approximated, per metamodel-fidelity.md); the Type's own projected schema validates the interior. |
| `sourceRefs` | ref → `source-reference` (inline)[] | no | — | core | References to source material this instance was derived from or attaches to (RFC-017/RFC-023). |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | no | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/record.json>
