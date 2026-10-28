# The `ExportConfig` shape

> The The `ExportConfig` shape section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`ExportConfig`, in pseudo-IDL:

```typescript
{
  format?: string        // target format hint, e.g. "markdown", "adoc", "json"
  preamble?: string
  // Template string rendered before field values.
  // Variable substitution uses {{variable-name}} syntax.
  // Standard variables: {{instance-id}}, {{date}}, {{status}}, {{namespace}}, {{name}}

  omitEmptyFields?: boolean  // default: false
}
```
