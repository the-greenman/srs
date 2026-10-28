# The `DiscoveryQuery` shape

> The `DiscoveryQuery` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

```typescript
{
  typeId?:         UUID      // exact match on Record.typeId
  typeNamespace?:  string    // exact match on Record.typeNamespace
  typeName?:       string    // exact match on Record.typeName
  containerId?:    UUID      // instance is a member of this container (RFC-009 I-66)
  tag?:            string[]  // AND semantics: all tags must be present
  lifecycleState?: string    // exact match on Record.lifecycleState (ext:lifecycle)
  lifecycleStates?: string[] // OR semantics: matches ANY listed lifecycleState (ext:lifecycle) [RFC-012 Rev 12, srs#525]
  excludeLifecycleStates?: string[] // excludes instances whose lifecycleState matches any listed value, applied after lifecycleState/lifecycleStates (ext:lifecycle) [RFC-012 Rev 7]
  tier?:           0 | 2     // instance tier (Note=0, Record=2; Tier 1/TypedRecord removed, rfc-decision-53635966 — the numbering gap is retained deliberately)
  contentMatch?:   string    // free-text recall-floor predicate
}
```
