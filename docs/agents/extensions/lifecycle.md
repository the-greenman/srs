# Lifecycle

> Lifecycle: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:lifecycle

**Status**: live

**Adds**: `Lifecycle`: an installable, referenceable container of `LifecycleState`s and `LifecycleTransition`s, fully integrated with the vocabulary substrate (RFC-006) as a `VocabularyEntry` specialisation. Required for governance tools, decision logs, and any implementation where records progress through defined states.

**Cost of Non-Adoption**: Without it, a record has no defined-state progression to govern: no installable `Lifecycle` container, no `LifecycleState`/`LifecycleTransition` vocabulary, and no state machine for governance tooling or decision logs to drive off.
