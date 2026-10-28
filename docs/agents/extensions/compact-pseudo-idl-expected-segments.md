# Compact pseudo-IDL

> The Compact pseudo-IDL: expected-segments section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
expected-segments {
  instanceId: string // Stable UUID identity of a Tier 0 (Note) or Tier 2 (Record) instance — distinct from a definition's id+namespace/name/version lineage.
  fieldName: string // Field name (snake_case) for package-resolved fields; sentinel string for special segments matching fieldId sentinels; or NoteSection.name for named special segments.
  segments: string[] // The exact ordered list of TextSegment.text values expected for one field of one instance (ExpectedSegments).
}
```


## Generated reference: `ConformanceScenario`

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
