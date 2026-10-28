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
- [Compact pseudo-IDL: field](/agents/foundations/compact-pseudo-idl-field.md): The Compact pseudo-IDL: field section of the specification.
- [`FieldAssignment` (appendix)](/agents/foundations/fieldassignment-appendix.md): Raw JSON Schema: <https://srs.semanticops.com/schema/2.0/type.json#/$defs/com.semanticops.srs__field-assignment__v1>
- [Compact pseudo-IDL: type](/agents/foundations/compact-pseudo-idl-type.md): The Compact pseudo-IDL: type section of the specification.
- [Compact pseudo-IDL: note-section](/agents/foundations/compact-pseudo-idl-note-section.md): The Compact pseudo-IDL: note-section section of the specification.
- [Compact pseudo-IDL: note](/agents/foundations/compact-pseudo-idl-note.md): The Compact pseudo-IDL: note section of the specification.
- [Compact pseudo-IDL: source-reference](/agents/foundations/compact-pseudo-idl-source-reference.md): The Compact pseudo-IDL: source-reference section of the specification.
- [Compact pseudo-IDL: record](/agents/foundations/compact-pseudo-idl-record.md): The Compact pseudo-IDL: record section of the specification.
- [Compact pseudo-IDL: relation](/agents/foundations/compact-pseudo-idl-relation.md): The Compact pseudo-IDL: relation section of the specification.
- [Compact pseudo-IDL: container](/agents/foundations/compact-pseudo-idl-container.md): The Compact pseudo-IDL: container section of the specification.
- [Compact pseudo-IDL: vocabulary](/agents/foundations/compact-pseudo-idl-vocabulary.md): The Compact pseudo-IDL: vocabulary section of the specification.
- [Compact pseudo-IDL: term](/agents/foundations/compact-pseudo-idl-term.md): The Compact pseudo-IDL: term section of the specification.
- [Compact pseudo-IDL: lifecycle](/agents/foundations/compact-pseudo-idl-lifecycle.md): The Compact pseudo-IDL: lifecycle section of the specification.
- [Compact pseudo-IDL: relation-type-definition](/agents/foundations/compact-pseudo-idl-relation-type-definition.md): The Compact pseudo-IDL: relation-type-definition section of the specification.

The core entity model a repository is built from: Field, Type, Vocabulary and Term, record tiers, Relation, and Container. Every later Part presupposes these.
