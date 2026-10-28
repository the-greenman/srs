# The `CompositeRendererDirective` shape

> The `CompositeRendererDirective` shape: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Presentation shapes (reference)](/agents/presentation/presentation-shapes-reference.md).

`CompositeRendererDirective`, in pseudo-IDL:

```typescript
{
  fieldId: UUID
  // The composite-range Field this directive binds. MUST resolve to a Field whose
  // fieldType.datatype is "ref" and mode is "inline" ([CR-036-3]); a fieldId absent from
  // a rendered instance's Type is ignored without a diagnostic ([CR-036-4]).

  renderer: string
  // Composite renderer identifier, as `CompositeRendererBinding.renderer` (`ext:views-l1`).
  // "baseline" is the reserved sentinel meaning explicitly no renderer, used to cancel a
  // broader declaration site. Grammar enforced at render and validation time ([CR-036-1]).

  roles?: { [roleName: string]: UUID }
  // Explicit, UUID-anchored role -> Field.id binding, overriding the by-name defaults of
  // [CR-036-8].
}
```
