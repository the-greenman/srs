# Protocol

> An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:protocol

**Status**: live

**Adds**: An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient, and which Record fields it feeds. Stages declare epistemic dependencies on other stages rather than a fixed ordering, so a stage may run once what it needs is established regardless of where it sits in the declared sequence. A Protocol is a package definition, not an instance, deliberately separated from presentation. For live facilitation, declare together with `ext:addressability` (recommended, not required).

**Cost of Non-Adoption**: Without it, there is no epistemically ordered process guiding a conversation toward a Record: no named stages, no declared epistemic dependencies between them, and no way to tell when a stage's understanding is sufficient to feed the Record fields it targets.
