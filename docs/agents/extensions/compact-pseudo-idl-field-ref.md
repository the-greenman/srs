# Compact pseudo-IDL

> The Compact pseudo-IDL: field-ref section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
field-ref {
  fieldId: ref → `field` (id) // References a Field by its stable id (reference mode closes the metacircular loop).
  typeId?: string // Stable UUID of the referenced Type.
}
```


## Generated reference: `ProtocolStage`

**Referenced Type Id**: 4c00003e-0000-4000-a000-00000000003e

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `protocol-stage` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `stageId` | string | yes | — | core | Stable key within this Protocol. Referenced by other stages' dependsOn (Invariant 29). |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `order` | integer | yes | minimum: 0 | core | The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015). |
| `purpose` | string | no | — | core | What this field/type captures (1-2 sentences). |
| `question` | string | no | — | core | The core question this stage answers. |
| `dependsOn` | string[] | no | — | core | stageId values within the enclosing Protocol — epistemic dependencies, not just ordering. A stage may not depend on itself (Invariant 29). |
| `completionCriteria` | string | no | — | core | How to know this stage is sufficient to proceed. |
| `contributesTo` | ref → `field-ref` (inline)[] | no | — | core | The Record Fields this stage feeds (Invariant 30). |
| `outputType` | string | no | format: uuid | core | Present when this stage produces its own intermediate Record. A LINEAGE reference (bare UUID; rfc-decision-c8704763) to the Type this stage produces its own intermediate Record as — the effective package set resolves it. typeVersion is dropped (version-optional hybrids are forbidden). |
| `aiGuidance` | ref → `ai-guidance` (inline) | no | — | core | Inline LLM guidance for extracting/populating this field or type. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/ProtocolStage>
