# Address

> A stable identifier for anything that can be referred to, across document, process and conversation space and across repositories.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A stable identifier for anything that can be referred to, across document, process and conversation space and across repositories. The Address is core (RFC-049): an implementation resolves an Address only within its boundary, the set of repositories the implementation declares; an Address it cannot resolve stays valid.

**Notes**: The Address names; a registry locates (ext:registry). The live cursor that points at an Address while a session runs, AttentionState, is ext:addressability's, and must not be confused with the Address itself.

## `Address`

A stable identifier for any element across document space, process space and conversation space. The Address is core, in the Foundation group (RFC-049); `ext:addressability` adds only the live cursor that points at one, `AttentionState`.

Example: the `Address` union.

Every element that can be referred to has an Address. A transcript chunk and a document-space field are co-addressable because an assertion about one that references the other needs both to be nameable.

**Spaces.** The union has exactly three spaces: `document` (`containerId`, `recordId`, `fieldId`), `process` (`runId`, `stageId`, given content by `ext:protocol`) and `conversation` (`sessionId`, `chunkId`, `annotationId`, given content by the conversation layer). A `document` Address carries at least one of `containerId` and `recordId`, and `fieldId` only with `recordId`. `containerId` is context, not identity: a record need not be named through a container, and a container that is given is checked when the Address is resolved.

**`repositoryId`.** Every Address may carry the `manifest.repositoryId` of the repository holding the thing addressed, a KEYED reference resolved against the implementation's boundary (`rfc-decision-c8704763`). Absent, or equal to the holder's own id, it means the repository that holds the Address; for a request that no repository holds, the repository the request is made against. Two Addresses are equal when they agree on space, `repositoryId` (an absent one standing for the holder's) and identity components; `containerId` does not count when `recordId` is present. Equality says which repository's copy is meant; record identity is still the `instanceId` wherever a record is held. An Address that cannot be resolved where it is read is still a valid Address.


## The `Address` union

`Address`, in pseudo-IDL (core, RFC-049):

```typescript
type Address =
  | {
      space: "document"
      repositoryId?: UUID  // the holding repository; absent = the holder's own
      containerId?: UUID   // context; at least one of containerId, recordId
      recordId?: UUID
      fieldId?: UUID       // only with recordId
    }
  | {
      space: "process"
      repositoryId?: UUID
      runId: UUID          // Protocol run ID; requires ext:protocol
      stageId?: string
    }
  | {
      space: "conversation"
      repositoryId?: UUID
      sessionId: UUID
      chunkId?: UUID
      annotationId?: UUID
    }
```


## Boundary, resolution and routed writes

Every implementation resolves an Address that names a repository, and every read it scopes by repository id, only within its **boundary**: without `ext:registry`, the one repository it serves; with a registry, the `repository` entries that loaded from the one registry it uses for resolution (RFC-049). Resolution is read-through and read-only. Its failures are results of that resolution, never invalidity of what holds the Address, and they are reported in one fixed order: `not-in-boundary`, then the entry's and the target's own outcomes.

A write is a separate act. It is applied to exactly one named repository, and no write changes two repositories. An implementation that does not route writes refuses one that names another repository. No implementation writes to a repository whose registry entry is read-only, however the target is named.


## Conformance Rules (RFC-049): the Address

**[R0]** *(Core)* The `Address` is a core construct: a union of exactly three spaces, `document`, `process` and `conversation`. Every Address MAY carry one optional `repositoryId`, a repository's `manifest.repositoryId` written as a lower-case canonical UUID. A `document`-space Address MUST carry at least one of `containerId` and `recordId`, and MUST NOT carry `fieldId` without `recordId`.

**[R11]** *(Core)* An Address whose `repositoryId` is outside the boundary, whose resolution fails, or whose space the implementation does not support is still a valid Address. Failure to resolve it is a resolution result and MUST NOT make the record, relation or other construct that holds it invalid, and an implementation that rewrites a construct holding an Address MUST write the Address unchanged.

**[R12]** *(Core)* Two Addresses are equal when they have the same space, the same `repositoryId` (an absent one standing for the repository that holds the Address, [R13]) and the same identity components; in the `document` space, when `recordId` is present, `containerId` is context and does not take part. A context is still checked when the Address is resolved, so of two equal Addresses the one whose container does not hold the record resolves to `target-not-found` ([R5]): equality says what is named, resolution says whether the context given is right. Address equality says which repository's copy is meant; it does not define record identity, which is the `instanceId` wherever a record is held.


## Conformance Rules (RFC-049): resolution and the boundary

**[R5]** *(Core)* Resolving an Address, or any read an implementation scopes by repository id, has one of these outcomes besides success, each a result of that one resolution:
- `not-in-boundary`: the repository id is not in the implementation's boundary ([R8]), including an id whose registry entries failed at load ([R15]);
- `locator-unusable` (only with `ext:registry`): the entry's locator mode or URL scheme is not one the implementation can reach, or it does not lead to a repository;
- `id-mismatch` (only with `ext:registry`): see [R6];
- `revision-unsupported`: the target repository's `dataModelRevision` is above what the implementation supports, or below it and not migrated;
- `target-not-found`: the repository resolves but the container, record or field addressed is not in it, or the record is not a member of the given container (RFC-049 Change C);
- `space-unsupported`: the Address's space is not supported by the target or the resolving implementation.

**[R8]** *(Core)* Every implementation resolves an Address with a `repositoryId`, and every read it scopes by repository id, only within its **boundary**, and reports `not-in-boundary` for any other repository id, except the id of the repository that holds the Address or that the request is made against ([R13]). An implementation without `ext:registry`, or with it but using no registry for resolution, has a boundary of exactly one repository, the one it serves. An implementation using a registry for resolution has as its boundary the `repository` entries that loaded from the one registry it uses for resolution, and resolves only through them. No implementation takes a locator for resolution from any repository's content.


## Conformance Rules (RFC-049): requests and writes

**[R13]** *(Core)* An Address without `repositoryId` names a thing in the repository that holds it, and an Address whose `repositoryId` is the holder's own id names the same thing; it resolves as if the id were absent, whether or not that repository is a registry entry. A transient Address that no repository holds (a request to an implementation) names a thing in the repository the request is made against; an implementation serving more than one repository MUST name one default repository, a `repository` entry of its registry, for requests that carry no `repositoryId`, and MUST state it where it describes itself to clients; if the default's entry did not load, it MUST report that and refuse the requests that rely on the default with `not-in-boundary`. A conversation-layer tag names things in the repository of the session that wrote it.

**[R16]** *(Core)* A write that carries a `repositoryId` equal to the repository the request is made against (for an implementation serving more than one repository, its default, [R13]) is treated as one without it. A write is applied only to the one repository it names, and no write changes more than one repository. An implementation that does not route writes to other repositories (one without `ext:registry`, or one that does not take up [R17]'s MAY) MUST refuse a write naming another repository, writing nothing, with `write-not-routed`, and MUST NOT apply it to any other repository. Any implementation that loads a registry MUST refuse, writing nothing, with `read-only`, a write to a repository whose entry has `readOnly: true`, or whose locator is `remote` when it treats `remote` entries as read-only (which it MAY), however the target was named, including as the default. For a write naming another repository, `write-not-routed` comes first.
