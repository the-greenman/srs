# Compact pseudo-IDL

> The Compact pseudo-IDL: protocol-stage section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
protocol-stage {
  stageId: string // Stable key within this Protocol. Referenced by other stages' dependsOn (Invariant 29).
  name: string // Machine-readable name within the namespace; snake_case.
  order: integer // The declared composition order of this field within the Type — structure, not presentation. Feeds canonical serialisation and provides the render default; a View may override for display (RFC-015).
  purpose?: string // What this field/type captures (1-2 sentences).
  question?: string // The core question this stage answers.
  dependsOn?: string[] // stageId values within the enclosing Protocol — epistemic dependencies, not just ordering. A stage may not depend on itself (Invariant 29).
  completionCriteria?: string // How to know this stage is sufficient to proceed.
  contributesTo?: ref → `field-ref` (inline)[] // The Record Fields this stage feeds (Invariant 30).
  outputType?: string // Present when this stage produces its own intermediate Record. A LINEAGE reference (bare UUID; rfc-decision-c8704763) to the Type this stage produces its own intermediate Record as — the effective package set resolves it. typeVersion is dropped (version-optional hybrids are forbidden).
  aiGuidance?: ref → `ai-guidance` (inline) // Inline LLM guidance for extracting/populating this field or type.
}
```


## Generated reference: `Protocol`

**Referenced Type Id**: 4c00003f-0000-4000-a000-00000000003f

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `protocol` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | no | — | core | Human-readable description of this entity. |
| `targetType` | string | yes | format: uuid | core | The Record type this Protocol converges on — a LINEAGE reference (bare UUID; rfc-decision-c8704763), never the canonical namespace/name@version form (DISPLAY-only, never stored). Empty string for loose, exploratory Protocols whose output is input context for a tighter Protocol. |
| `stages` | ref → `protocol-stage` (inline)[] | yes | — | core | The stages, in declaration order. Execution sequence is determined by dependsOn resolution, not array position; order is the declared composition order (Invariant 31). |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json>
