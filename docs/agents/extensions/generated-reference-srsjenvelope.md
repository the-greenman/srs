# Generated reference: `SrsjEnvelope`

> Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/srsj-envelope.json>

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Referenced Type Id**: 4c00004b-0000-4000-a000-00000000004b

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `srsj-envelope` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `srsj` | string | yes | — | core | The .srsj archive's version-gate string ([R24]). |
| `manifest` | ref → `manifest` (inline) | yes | — | core | The archived repository's Manifest (validates against manifest.json). |
| `data` | map<string, open> | yes | — | core | Flat map keyed by the file's relative path within the repository tree to that file's parsed JSON content. Distinct from the `meta` extension bag — this is the archive's actual file payload, not open metadata. |
| `readme` | ref → `bundled-readme` (inline) | no | — | core | RFC-045 [R2]: an optional readme carried by a travelling form, its actual path within the artifact and its UTF-8 text. Opaque: no model fact is derived from it ([R1]). |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/srsj-envelope.json>

**Compact pseudo-IDL**

```typescript
srsj-envelope {
  srsj: string // The .srsj archive's version-gate string ([R24]).
  manifest: ref → `manifest` (inline) // The archived repository's Manifest (validates against manifest.json).
  data: map<string, open> // Flat map keyed by the file's relative path within the repository tree to that file's parsed JSON content. Distinct from the `meta` extension bag — this is the archive's actual file payload, not open metadata.
  readme?: ref → `bundled-readme` (inline) // RFC-045 [R2]: an optional readme carried by a travelling form, its actual path within the artifact and its UTF-8 text. Opaque: no model fact is derived from it ([R1]).
}
```
