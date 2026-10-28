# Generated reference: `ConformanceScenario`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ConformanceScenario>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c000042-0000-4000-a000-000000000042

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `conformance-scenario` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `query` | ref → `discovery-query` (inline) | yes | — | core | The DiscoveryQuery a ConformanceScenario executes against the fixture repo. |
| `expectedInstanceIds` | string[] | yes | format: uuid | core | Minimum required result set for a ConformanceScenario. For exactMatch:true scenarios, this is also the maximum. |
| `exactMatch` | boolean | yes | — | core | If true, the result set MUST equal expectedInstanceIds exactly. If false, the result set MUST be a superset. |
| `expectedSegments` | ref → `expected-segments` (inline) | no | — | core | Optional structured expectation over one field of one instance's exact ordered TextSegment sequence (ConformanceScenario.expectedSegments). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/ConformanceScenario>

**Compact pseudo-IDL**

```typescript
conformance-scenario {
  name: string // Machine-readable name within the namespace; snake_case.
  description: string // Human-readable description of this entity.
  query: ref → `discovery-query` (inline) // The DiscoveryQuery a ConformanceScenario executes against the fixture repo.
  expectedInstanceIds: string[] // Minimum required result set for a ConformanceScenario. For exactMatch:true scenarios, this is also the maximum.
  exactMatch: boolean // If true, the result set MUST equal expectedInstanceIds exactly. If false, the result set MUST be a superset.
  expectedSegments?: ref → `expected-segments` (inline) // Optional structured expectation over one field of one instance's exact ordered TextSegment sequence (ConformanceScenario.expectedSegments).
}
```
