# A container slice closes over the root's childContainerIds descendants and effective members

> An RFC-026 container slice MUST include the closure root, its transitive childContainerIds descendants, and the root's effective member set.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: I-151

An RFC-026 container slice MUST include the closure root, its transitive childContainerIds descendants, and the root's effective member set. It MUST preserve declared edges among those Containers and MUST NOT include an unrelated Container solely because its roots or members are subsets of the included instance set.
