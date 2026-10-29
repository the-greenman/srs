# The root container's identityInstanceId MUST reference a Tier-2 com.semanticops.core/purpose Record

> The root container's identityInstanceId (on the container manifest.rootContainerId names, RFC-052), when present, MUST reference a Tier-2 Record of type com.semanticops.core/purpose.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: I-87

The root container's `identityInstanceId` (on the container `manifest.rootContainerId` names, RFC-052), when present, MUST reference a Tier-2 Record of type `com.semanticops.core/purpose`. This invariant layers on RFC-013 I-81 (membership requirement retained; I-81 is not superseded); RFC-029 adds the type constraint on top. During the RFC-029 migration grace period (R7), an implementation MUST emit a migration warning rather than a validation error for existing repositories whose `identityInstanceId` resolves to a record that is not a Tier-2 `com.semanticops.core/purpose` Record (including Tier-0 notes). All newly-created repositories (post-RFC-029) must satisfy this invariant immediately.
