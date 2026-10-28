# Compact pseudo-IDL

> The Compact pseudo-IDL: srsj-envelope section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
srsj-envelope {
  srsj: string // The .srsj archive's version-gate string ([R24]).
  manifest: ref → `manifest` (inline) // The archived repository's Manifest (validates against manifest.json).
  data: map<string, open> // Flat map keyed by the file's relative path within the repository tree to that file's parsed JSON content. Distinct from the `meta` extension bag — this is the archive's actual file payload, not open metadata.
  readme?: ref → `bundled-readme` (inline) // RFC-045 [R2]: an optional readme carried by a travelling form, its actual path within the artifact and its UTF-8 text. Opaque: no model fact is derived from it ([R1]).
}
```


## Generated reference: `FieldRef`

**Referenced Type Id**: 4c00003d-0000-4000-a000-00000000003d

**Presentation Profile**: property-table-and-pseudo-idl

**Content**: Generated from the resolved effective `field-ref` Type — regenerate with `node scripts/gen-type-reference-tables.mjs` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.

| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |
|---|---|---|---|---|---|
| `fieldId` | ref → `field` (id) | yes | — | core | References a Field by its stable id (reference mode closes the metacircular loop). |
| `typeId` | string | no | format: uuid | core | Stable UUID of the referenced Type. |

Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/protocol.json#/$defs/FieldRef>
