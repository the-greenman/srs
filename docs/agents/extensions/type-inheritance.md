# Type Inheritance

> Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own, under a substitutability constraint — a system that knows the base Type bu…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:type-inheritance

**Status**: live

**Adds**: Single inheritance between Types: a specialising Type names one base Type, gains its effective field list, and adds its own, under a substitutability constraint — a system that knows the base Type but not the specialisation can still read the inherited fields and should preserve the unknown ones rather than discard them. A specialisation may tighten an inherited optional field to required, but never relax a required one, and may never alter Field semantics.

**Cost of Non-Adoption**: Without it, Types cannot specialise one another: each Type's field list is defined independently, with no inherited base, no substitutability guarantee for a system that knows only the base Type, and no way to tighten an inherited field without redefining the Type from scratch.
