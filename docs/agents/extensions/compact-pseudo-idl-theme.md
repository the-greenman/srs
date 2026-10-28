# Compact pseudo-IDL

> The Compact pseudo-IDL: theme section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
theme {
  id: string // Globally unique, stable UUID identity of this entity.
  namespace: string // Reverse-DNS logical grouping.
  name: string // Machine-readable name within the namespace; snake_case.
  version: integer // Positive integer version within the UUID lineage.
  description: string // Human-readable description of this entity.
  targets: string[] // Output formats a Theme is designed for (e.g. 'html', 'markdown'). MUST contain at least one entry (Rule [T-1b]).
  assets?: map<string, ref> // ext:themes-l1 Theme.assets — named asset declarations, keyed by name (unique within the Theme). Referenced in templates as {{asset:name}}.
  cssClassFields?: string[] // fieldIds whose values are injected as CSS classes on record wrapper elements (RFC-032 Rev-7 [T-9]).
  pageTemplates?: ref → `page-templates` (inline) // Theme.pageTemplates — page-level chrome for paginated output formats.
  elementTemplates?: ref → `element-templates` (inline) // Theme.elementTemplates — templates that wrap auto-rendered content at each structural level.
  stylesheet?: ref → `stylesheet-declaration` (inline) // Theme.stylesheet — the theme's CSS declaration.
  typography?: ref → `typography-hints` (inline) // Theme.typography — informative typography hints.
  tags?: string[] // Free-form classification tags.
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
}
```


## Generated reference: `SrsjEnvelope`

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
