# Container

> A grouping boundary over a collection of instances, answering the scoping question the Relation graph cannot: which instances belong together, what counts as this project.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Structure](/agents/structure.md).

A grouping boundary over a collection of instances, answering the scoping question the Relation graph cannot: which instances belong together, what counts as this project. It is not a semantic object, having no Fields and holding no semantic state, and its claim is different in kind from a `contains` Relation: an edge says one instance is part of another; a Container says these instances form a unit for boundary purposes. Membership is declared: the union of its roots and explicit members, closed over declared child Containers, and never derived from a Relation (RFC-034).

**Notes**: A Container may name one member as its identity or purpose record, and one member whose Type is the Container's typing anchor. Its own id lives in a different space from instance ids and must never appear on a Relation. Nested scopes are declared through `childContainerIds`; `contains` remains the part-of tree where meaning lives and must still be maintained (rfc-decision-0750c62f).

## Container.containerId is not an instance ID. It must not appear in…

**Number**: 20

`Container.containerId` is not an instance ID. It must not appear as the `instanceId` of any entry in `Container.memberInstanceIds`, nor in `Relation.sourceInstanceId` or `Relation.targetInstanceId`; `Container.rootInstanceIds` is removed ([R4]) and `memberInstanceIds` is an ordered list of entries `{instanceId, depth?}` ([R1]).


## Container.rootInstanceIds and Container.memberInstanceIds, when…

**Number**: 21

Every entry in `Container.memberInstanceIds` MUST have an `instanceId` that references a valid SRS instance ID (`Note.instanceId` or `Record.instanceId`), appearing exactly once and resolving to an instance ([R2]). This is required of every container, not only the root container; a dangling entry is a validation error, and the repair operation removes it ([R20]). `rootInstanceIds` is removed ([R4]).

Amended by RFC-051 (the-greenman/srs#940): a stored container's entries are one file each, and the depth conditions hold by construction because the outline is decoded from each entry's parent and key; an orphan or a loop is a warning, not a violation of this invariant.


## containerType should equal resolved root Type name when rootInstanceIds is present

**Number**: I-64

When a Container carries `anchorInstanceId` and also carries `containerType`, implementations SHOULD emit a diagnostic if `containerType` does not equal the resolved Type name of the anchor record (the local name within its namespace). The anchor record is authoritative and a mismatch does NOT make the Container invalid. `rootInstanceIds` is removed ([R4]), so the root Record Type is the Type of the anchor entry.


## All conforming implementations must provide containers_for_instance

**Number**: I-66

`effective(C)` is the recursive, duplicate-free closure over the `instanceId` values of C's `memberInstanceIds` entries read flat, ignoring `depth`, and over `childContainerIds` ([R3], [R18]); `rootInstanceIds` is removed ([R4]). Order and depth of entries never change which containers an instance belongs to.


## identityInstanceId resolves to a member of its container

**Number**: I-81

When present on a Container, `identityInstanceId` MUST equal the `instanceId` of an entry in that Container's `memberInstanceIds` ([R3]). In the root container the identity entry MUST be at depth 0 and MUST have no descendants ([R2]). A mutating operation that would remove the identity entry is rejected until the pointer is moved to another member ([R7]); the repair operation never changes the pointer ([R20]). `rootInstanceIds` is removed ([R4]).


## Section roots SHOULD root a container in the container set

**Number**: I-82

When the repository's container set (RFC-038 [R1]) is non-empty, each non-identity section root of the root container (its navigation sections) SHOULD be the root of some Container in that set. An empty container set suppresses this diagnostic. A section root with no corresponding section container is a diagnostic, not an error, and a consumer MUST still render it as a navigation leaf rather than dropping it. `containerIndex` is retired (RFC-038 [R2]) and is no longer the membership authority for this check.


## Container.anchorInstanceId resolves to a member of its container, and is the declared typing anchor

**Number**: I-145

`anchorInstanceId`, when present, MUST equal the `instanceId` of an entry in `memberInstanceIds` ([R3]) and remains the sole declared typing anchor; position in the entry list carries no typing role ([R5]). The `rootInstanceIds[0]` positional fallback is withdrawn and `rootInstanceIds` is removed ([R4], [R19]); the migration writes `anchorInstanceId` explicitly wherever the fallback applied.


## Container direct membership is the union of its roots and explicit members

**Number**: I-146

A Container's direct membership `direct(C)` is exactly the set of `instanceId` values of its `memberInstanceIds` entries, read flat whatever their depth ([R3]). An omitted `memberInstanceIds` contributes no members and MUST NOT be read as opting into Relation traversal. The set is duplicate-free; the list that carries it is ordered ([R1], [R2]), and `rootInstanceIds` is removed ([R4]).


## Container nesting is declared through childContainerIds and effective membership is its closure

**Number**: I-147

A Container is an admitted child of another Container exactly when it is distinct and its containerId appears in the other Container's childContainerIds; membership-array overlap alone MUST NOT create admission. A conforming implementation MUST compute effective membership as the recursive closure over childContainerIds (effective(C) = direct(C) united with effective(child) for every declared child), MUST deduplicate instance ids, and MUST NOT infer an ordering from either membership array or from childContainerIds order.


## Relations never define Container membership

**Number**: I-148

A Relation of any type, including contains, MUST NOT cause an instance to appear in a Container's direct or effective membership.


## A query result is not Container membership

**Number**: I-149

A Record-selection query MUST NOT be treated as persisted Container membership unless an authoring operation writes its selected ids as entries in the Container's `memberInstanceIds`.


## childContainerIds entries resolve, are distinct, and form an acyclic graph

**Number**: I-150

Every childContainerIds entry MUST reference an existing, distinct Container, and the childContainerIds graph MUST be acyclic. A missing target, self-reference, or cycle is a validation error. For any Container whose reachable child graph contains such an error, effective-membership evaluation MUST fail with a diagnostic and MUST NOT return a partial result. A rootless child is valid. When a child has roots, those roots SHOULD occur in the parent's direct membership; a violation produces a structural-coherence diagnostic but MUST NOT remove the declared edge from effective-membership evaluation.


## Container

A lightweight grouping boundary over a collection of instances. Containers answer scoping questions — which instances belong together, what constitutes "this project" — that the Relation graph alone cannot answer.

Containers are not semantic objects with Fields. They do not own semantic state; Records do. A `contains` Relation asserts "A is part of B" (a semantic claim); a Container asserts "these instances form a unit for boundary purposes" (a scope claim). Both are needed; neither replaces the other.

See the generated reference below for `Container`'s current property table, optional pseudo-IDL, and a link to the raw JSON Schema (srs#527, the #274 ratified ledger extended to the instance layer) — this prose no longer hand-duplicates the property list.

`Container.containerId` is not an instance ID and must not appear in `Relation.sourceInstanceId` or `targetInstanceId`. See Invariant 20.


## Membership and nesting (RFC-034)

A Container is a declared selection on the expression plane (rfc-decision-0750c62f). Its direct membership is the set `direct(C)` of the `instanceId` values of its `memberInstanceIds` entries, read flat whatever their depth (RFC-043 [R3]); an omitted `memberInstanceIds` adds nothing (I-146).

Nested scopes are declared through `childContainerIds`, an unordered set of `containerId`s and the one place a Container references another Container; nesting is never inferred from membership overlap. Effective membership is the closure `effective(C) = direct(C) ∪ ⋃ effective(child)` over the declared children (I-147). Every child id resolves to an existing, distinct Container, the child graph is acyclic, a child can be memberless, and a populated child's members normally sit in the parent's direct membership (I-150). A Container can have more than one parent; only the tree-shaped subset maps onto a folder hierarchy.

Relations do not define membership (I-148). `contains` remains the part-of tree that navigation depth, layering and any tree walk are built on, and it is still maintained; a Container is a bookmark over that tree. This supersedes the pre-RFC-034 rule that omitted membership was derived by traversing `contains` from the roots.

One definition serves every membership question: `containers_for_instance` (I-66), member listing and view resolution, RFC-012 `containerId` discovery (I-118), RFC-011 `containerScope` with `"explicit"` as `direct(C)` and `"subtree"` as `effective(C)` (I-144), and the RFC-026 slice closure (I-151). `memberInstanceIds` is the one membership list and it is ordered: the list order is the Container's sequence and each entry's `depth` its nesting (RFC-043 [R1]); `precedes` states only a sequence the content requires. A query is a separate, read-only selection and never changes membership by itself (I-149).

`memberInstanceIds` is a flat ordered outline of entries `{instanceId, depth?}` and `rootInstanceIds` is removed ([R1], [R4]). Membership is the entry ids read flat ([R3]); each id appears once and resolves ([R2]); an entry's parent is the nearest preceding entry with a smaller depth ([R5]). Removing an entry promotes its descendants one level ([R7]).

From dataModelRevision 11 (RFC-051) membership and nesting are stored per entry: each entry file names its container, its parent and an order key (mechanism "Container entry order keys"), and the outline readers see is decoded from those files.


## Container entry order keys

Each stored container entry (RFC-051) carries a `key`, compared byte-wise, placing it among its siblings. Keys follow fractional indexing (Greenspan, 2020), so one edit always writes the same bytes.

The digits are `0`–`9`, `A`–`Z`, `a`–`z`, valued 0 to 61; their byte order is their value order. A key is an integer part and an optional fraction. The integer part is a head and digits: heads `a` to `z` take 1 to 26 digits, heads `Z` to `A` take 1 to 26 digits (negative). The fraction MUST NOT end in `0`. The key `A` followed by 26 `0`s is reserved and never written.

To increment an integer part, add one in base 62 keeping the head; on overflow `Z` becomes `a0`, `z` has no successor, and any other head moves to the next letter with all-`0` digits, one more for a lowercase head and one fewer for an uppercase one. Decrement mirrors this: `a` becomes `Zz`, `A` has no predecessor.

The midpoint of fractions x < y, with y possibly the end: when y is present and shares a longest common prefix of n > 0 digits with x (padded with `0`s), keep the prefix and take the midpoint of the remainders. Otherwise let dx be x's first digit (0 if empty) and dy be y's (62 at the end). If dy − dx > 1 the result is the digit ⌈(dx+dy)/2⌉; else, if y has more than one digit, it is y's first digit; else it is x's first digit followed by the midpoint of x's remainder and the end.

The key between a and b: with neither, `a0`. Before b: b's integer part with the midpoint of the empty fraction and b's fraction when that part is reserved; b's integer part when b has a fraction; otherwise b's integer part decremented, or the reserved part followed by `V` if decrementing would reach it. After a: a's integer part incremented, or with no successor a's integer part and the midpoint of its fraction and the end. Between a and b with equal integer parts: that part and the midpoint of the fractions; with different parts: a's part incremented when that is below b, else a's part and the midpoint of its fraction and the end.

Vectors: first `a0`; then `a1`; after `az`, `b00`; between `a0` and `a1`, `a0V`; before `a0`, `Zz`; the 850th append, `bCh`.
