# AI guidance

> Structured instruction carried on a definition telling a language model what the definition captures and how to populate it: a required purpose, and optional extraction, negativeGuidance, and worked …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

Structured instruction carried on a definition telling a language model what the definition captures and how to populate it: a required `purpose`, and optional `extraction`, `negativeGuidance`, and worked `examples`. It travels with the definition instead of living in an application's prompt, which is what makes a package usable by a tool that has never seen it before. Guidance belongs to the entity that owns the meaning: a Field's guidance is the Field's, and a Type's guidance supplies session framing only — it never redefines a Field's extraction semantics.

**Notes**: Composition order is a recommended default, not an invariant: Type framing, View framing, Field extraction, negative guidance, examples.

## Field's aiGuidance belongs to the Field.

**Number**: 3

A `Field`'s `aiGuidance` belongs to the Field. Type-level `aiGuidance` provides session framing only.


## The `AiGuidanceExample` shape

`AiGuidanceExample`, in pseudo-IDL:

```typescript
{
  description?: string  // labels this example
  input?: string        // sample source text; omit for output-only examples
  output: string        // the ideal value the AI should produce
}
```


## The `AiGuidance` shape

`AiGuidance`, in pseudo-IDL:

```typescript
{
  purpose: string            // what this field/type captures (1-2 sentences)
  extraction?: string        // LLM instruction for how to extract or populate
  negativeGuidance?: string  // what the LLM must NOT include or do
  examples?: AiGuidanceExample[]
}
```


## `AiGuidanceExample`

A single example for AI guidance.

Example: the `AiGuidanceExample` shape.

`output` is required. An example without `input` demonstrates expected output form without requiring a specific source.


## `AiGuidance`

Structured AI guidance for a Field or Type.

Example: the `AiGuidance` shape.

The minimum valid `AiGuidance` is `{ purpose: "..." }`.
