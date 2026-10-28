# Compact pseudo-IDL

> The Compact pseudo-IDL: conformance-scenario section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

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


## Generated reference: `Theme`

**Referenced Type Id**: 4c00004a-0000-4000-a000-00000000004a

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `theme` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `id` | string | yes | format: uuid | core | Globally unique, stable UUID identity of this entity. |
| `namespace` | string | yes | pattern: ^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$ | core | Reverse-DNS logical grouping. |
| `name` | string | yes | — | core | Machine-readable name within the namespace; snake_case. |
| `version` | integer | yes | minimum: 1 | core | Positive integer version within the UUID lineage. |
| `description` | string | yes | — | core | Human-readable description of this entity. |
| `targets` | string[] | yes | minItems: 1 | core | Output formats a Theme is designed for (e.g. 'html', 'markdown'). MUST contain at least one entry (Rule [T-1b]). |
| `assets` | map<string, ref> | no | — | core | ext:themes-l1 Theme.assets — named asset declarations, keyed by name (unique within the Theme). Referenced in templates as {{asset:name}}. |
| `cssClassFields` | string[] | no | format: uuid | core | fieldIds whose values are injected as CSS classes on record wrapper elements (RFC-032 Rev-7 [T-9]). |
| `pageTemplates` | ref → `page-templates` (inline) | no | — | core | Theme.pageTemplates — page-level chrome for paginated output formats. |
| `elementTemplates` | ref → `element-templates` (inline) | no | — | core | Theme.elementTemplates — templates that wrap auto-rendered content at each structural level. |
| `stylesheet` | ref → `stylesheet-declaration` (inline) | no | — | core | Theme.stylesheet — the theme's CSS declaration. |
| `typography` | ref → `typography-hints` (inline) | no | — | core | Theme.typography — informative typography hints. |
| `tags` | string[] | no | — | core | Free-form classification tags. |
| `createdAt` | date-time | yes | — | core | ISO-8601 creation timestamp. |
| `updatedAt` | date-time | no | — | core | ISO-8601 timestamp of the most recent update. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/theme.json>
