# Addressability

> A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be named, in this repository or another (RFC-049) — and so that …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be named, in this repository or another (RFC-049) — and so that a transcript fragment and a field on a record are co-addressable, which is what makes an assertion linking them possible. The stable Address is core. Alongside it, `ext:addressability` provides the live cursor: the current focus of an active process run, which moves continuously and is stamped onto conversation material as it is produced. Because it is stamped at production time, asking for everything said while attention was on this field becomes a query, not a search.

**Notes**: A stable address and a live cursor are structurally similar and must not be merged: one identifies an element, the other records where focus currently is. Likewise a cursor is set live and a source reference is set retrospectively.

## AttentionState.containerId must reference a valid…

**Number**: 34

`AttentionState.containerId` must reference a valid `Container.containerId`. Other Address components (`recordId`, `fieldId`, `protocolRunId`, `stageId`) are optional and may be absent when focus has not yet narrowed.


## The `AttentionState` shape

`AttentionState`, in pseudo-IDL:

```typescript
{
  containerId: UUID
  recordId?: UUID
  fieldId?: UUID
  protocolRunId?: UUID
  stageId?: string
}
```


## ext:addressability

**Required for**: any implementation with live facilitation or multi-session extraction.

Defines the live cursor over the core Address (`AttentionState`) and the mechanisms that connect conversation material to document elements through it. The Address itself is core (RFC-049).


## `AttentionState`

The current focus of an active Protocol run: a live cursor across the address space. `AttentionState` and the core `Address` are structurally related but serve distinct roles: an `Address` is a stable identifier for a specific element; `AttentionState` is the mutable cursor that records *where focus currently is* during an active session. An `AttentionState` value at a point in time resolves to a document-space `Address`, but it is stored separately because it changes continuously as the Protocol advances. A cursor with a `fieldId` and no `recordId` (allowed by Invariant 34) resolves to its container's Address; the `fieldId` is dropped from the resolved Address, not from the cursor (RFC-049). Its shape is unchanged by RFC-049 and it carries no `repositoryId`: a stored tag names things in the repository of the session that wrote it.

Conversation material is tagged with the active `AttentionState` as it is produced. This makes context assembly efficient: "all chunks produced while focus was on this Field" is a queryable address predicate.

Example: the `AttentionState` shape.

`AttentionState` is set live by the session or Protocol runner. `SourceReference` is set retrospectively at extraction or editorial review time. Both are needed; they answer different questions.


## Context Query (behavioural requirement)

A conforming `ext:addressability` implementation must be able to assemble relevant material given an address (the core `Address`, RFC-049) and a purpose. This is a behavioural requirement, not a data shape.

**Required query patterns:**

| Pattern | Address | Returns |
|---|---|---|
| Field context | `{recordId}/{fieldId}` | Current value, chunks tagged to this Field, Field `aiGuidance` |
| Record context | `{recordId}` | All field values, chunks tagged to this Record, Relations, Protocol run history |
| Stage context | `{runId}/{stageId}` | All chunks produced during this stage, Fields active in this stage |

**Recommended assembly order for AI assistance:**

1. Type and Field `aiGuidance` — what this field captures, how to extract it
2. Current value — what has already been established
3. Chunks tagged to this Field via AttentionState — most focused context
4. Chunks tagged to the parent Record — broader session context
5. Related Records via Relations — structural context

**Note (2026-08-21, `rfc-decision-2a1e1590`)**: the per-field Revision snapshot mechanism (addressable field-value history, `revisionId`, revision chains, revision-trace queries) previously specified here is removed under the dormancy rule, zero corpus use, and it was incompletely specified (a PascalCase wire-format leak in its agent tag, and a coupling that named a pre-RFC-006 field). `Address`, `AttentionState`, and the Context Query requirement above are untouched by that removal. Return trigger: a consumer needs transition history or field-level audit - anticipated first claimant is the muDemocracy Decision Log governance audit surface.
