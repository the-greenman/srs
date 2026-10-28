# The `TextSegment` shape

> Sentinels: "note-title", "note-section", "tag", "label".

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
{
  fieldId:   string  // UUID for package-resolved fields; sentinel string for special segments
  fieldName: string  // field name or sentinel
  text:      string  // raw stored value (normalization applied at match time)
}
```

Sentinels: `"note-title"`, `"note-section"`, `"tag"`, `"label"`.
