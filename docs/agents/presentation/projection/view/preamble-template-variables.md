# Preamble Template Variables

> Standard variables in Composition.exportConfig.preamble:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

Standard variables in `Composition.exportConfig.preamble`:

| Variable | Resolves to |
|---|---|
| `{{container-title}}` | Container title from manifest |
| `{{container-id}}` | Container UUID |
| `{{date}}` | Render date |
| `{{heading-1}}` | Heading prefix at level `1 + depthOffset` (empty string in json mode) |
| `{{heading-2}}` | Heading prefix at level `2 + depthOffset` (empty string in json mode) |

In json mode all `{{heading-N}}` variables MUST resolve to `""`. Implementations MUST NOT emit the literal token.
