# Foundations

> The core entity model a repository is built from: Field, Type, Vocabulary and Term, record tiers, Relation, and Container.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md).

Pages under this one:

- [Stable identity](/agents/foundations/stable-identity.md): The rule that every SRS entity carries a UUID that is minted once and never changes — not when the entity is copied, exported, imported, renamed for display, or moved between repositories.
- [Namespace](/agents/foundations/namespace.md): A dot-separated, lowercase identifier that groups definitions under an authority and keeps names from colliding between independent publishers.
- [Version lineage](/agents/foundations/version-lineage.md): A positive integer scoped to one UUID's history, expressing how a definition has evolved while remaining the same definition.
- [Canonical reference](/agents/foundations/canonical-reference.md): How one definition points at another.
- [Field](/agents/foundations/field.md): The atomic reusable semantic unit: one named, versioned, UUID-identified piece of meaning, defined once and composed into any number of Types.
- [AI guidance](/agents/foundations/ai-guidance.md): Structured instruction carried on a definition telling a language model what the definition captures and how to populate it: a required purpose, and optional extraction, negativeGuidance, and worked …
- [Type](/agents/foundations/type.md): A named, versioned, UUID-identified composition of Fields describing one kind of semantic object.
- [Type specialisation](/agents/foundations/type-specialisation.md): Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own.
- [Vocabulary](/agents/foundations/vocabulary.md): A controlled set of strings that appear in instance data and must mean something stable.
- [Lifecycle](/agents/foundations/lifecycle.md): A named state machine (a closed vocabulary of states plus the transitions between them and exactly one initial state) that a Type may declare inline or reference as an installed, shareable definition.
- [Foundation Group (Core)](/agents/foundations/foundation-group-core.md): The Foundation group is required for all conforming implementations.

The core entity model a repository is built from: Field, Type, Vocabulary and Term, record tiers, Relation, and Container. Every later Part presupposes these.
