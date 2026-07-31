> **GitHub issue**: [the-greenman/srs#267](https://github.com/the-greenman/srs/issues/267)

# RFC-034: Structural Container Composition

**Status**: Draft (Revision 4)

**Affects**: `Container` membership semantics; a new optional `Container.childContainerIds` composition edge; both closed Container JSON Schema definitions (`container.json` and `manifest.json#/$defs/Container`); the Container shape carried in SRSJ; `containers_for_instance`; RFC-011 `containerScope` semantics (`explicit` = `direct`, `subtree` = `effective`; supersedes the traversal branch of I-011-3); RFC-012 `containerId` filtering (R6/I-118); container view resolution; RFC-026 container-slice closure; core Container prose (subsection 4.6.4.6), I-66, and design-note 013 ("Why Containers and Relations are complementary").

**Does not affect**: the SRSJ envelope or path-keyed serialization model; CLI/API syntax; DocumentView source wire shapes; records; relations; or any runtime implementation in this revision (RFC-only).

| Revision | Date | Summary |
|---|---|---|
| 1 | 2026-07-29 | Proposed root-overlap inference for nested Container composition. |
| 2 | 2026-07-29 | Replaced inferred nesting with the explicit `childContainerIds` edge and separated authored scope from evaluated selection. |
| 3 | 2026-07-29 | Permit explicitly composed rootless children; define invalid-edge handling; reconcile RFC-011, RFC-012, and RFC-026; specify both schema deltas and SRSJ compatibility; strengthen overlap and materialization examples. |
| 4 | 2026-07-29 | Unify container-scope vocabulary on `direct`/`effective`: re-anchor `containerScope: "explicit"` to `direct(C)` (retaining RFC-011's original meaning and preserving shallow querying) and `"subtree"` to `effective(C)`, rather than collapsing both to effective. |

---

## Abstract

This RFC defines Containers as explicit, structural scopes. A Container directly names its members through `rootInstanceIds` and `memberInstanceIds`, and explicitly composes child Containers through a declared `childContainerIds` edge. The resulting effective membership is the recursive, deduplicated closure over that declared structure. Nesting is authored, never inferred from a shared instance id.

This resolves a conflict in the present specification. The core Container prose, I-66, and design-note 013 all suggest that a `contains` Relation can derive membership, while RFC-026 correctly treats explicit membership as the canonical, portable mechanism. A Relation remains a semantic claim between Records; it never changes a Container's boundary.

The RFC also distinguishes authored scope from a query result. Discovery, DocumentView sources, SQL views, JSONPath, and graph traversal can select Records, but none is a persisted definition of Container membership. This keeps a Container explainable, portable between repository stores, and suitable as the boundary of an RFC-026 slice.

---

## Motivation

### Problem 1 — membership has contradictory definitions

The Container definition says that when `memberInstanceIds` is omitted, membership is derived by traversing `contains` Relations from `rootInstanceIds`; I-66 repeats that possibility. But a Container id is not a Relation endpoint, and the specification does not define a direction, stopping condition, or common traversal policy. Two implementations can therefore derive different boundaries from the same repository.

RFC-026 takes the stronger and correct position: `rootInstanceIds` and `memberInstanceIds` are the canonical membership mechanism, and a container slice traverses those fields on nested Containers rather than Relations. This RFC makes that rule general rather than slice-specific.

### Problem 2 — nesting is observable but not declared

Repositories already use a section root as a member of the repository root Container and as the root of its section Container. This expresses a hierarchy, but no core rule states whether the parent includes the section's other members, how reverse membership behaves, or which operation owns the recursion.

A definition is also needed for what nesting does **not** do. Leaving nesting to be *inferred* from a shared id — a child Container whose root happens to appear in a parent's membership — is the same failure class this RFC rejects for Relations and queries. A second Container rooted at the same instance would change the first Container's boundary with no authored edge between them, and a loose collection that merely lists an instance would silently absorb every member of a Container later rooted at it. Nesting one scope inside another is an authoring decision and must be written as one, not read off a coincidence.

### Problem 3 — a query result is not an authored boundary

A type, tag, lifecycle, full-text, SQL, JSONPath, or graph query can produce a useful current list. It cannot by itself say which scope an author intended: its result can change when an unrelated Record changes, a package definition is updated, or a backend evaluates an expression differently. Treating such a result as Container membership makes slice contents, reverse lookup, and navigation depend on an implicit evaluation event.

The distinction is the one between a database table and a view. At a single repository revision the two can return identical rows; they are still not the same object. A table (authored Container) asserts a boundary; a view (evaluated query) states a rule. Extensional equality at one moment never makes them semantically equal — the section "Authored scope versus evaluated Selection" works this through.

---

## Proposed Changes

### Change A — direct membership

For a Container `C`, its **direct membership** is the unordered, duplicate-free set:

    direct(C) = set(C.rootInstanceIds or []) ∪ set(C.memberInstanceIds or [])

The two arrays continue to have their existing distinct authoring roles: roots are the instances that anchor a Container; `memberInstanceIds` supplies additional explicit members. Neither array implies an order. Existing rules concerning valid instance ids, `containerId`, and `identityInstanceId` continue to apply to direct membership.

An omitted `memberInstanceIds` means that the Container has no additional direct members. It does **not** opt into Relation traversal.

### Change B — declared composition and effective membership

A Container MAY declare an ordered-agnostic set of child scopes:

    Container.childContainerIds?: UUID[]   // containerIds of directly-nested Containers

A Container `child` is an **admitted child** of a distinct Container `parent` exactly when `child.containerId ∈ parent.childContainerIds`. Nesting is declared, never inferred from membership overlap. A Container rooted at an instance that appears in another Container's membership acquires **no** relationship to it unless that Container names it in `childContainerIds`. `childContainerIds` holds `containerId`s, not instance ids; it is the one place a Container references another Container, and it never makes a `containerId` an instance member (I-20 is unaffected).

**Structural coherence.** A child MAY be rootless. When an admitted child has one or more `rootInstanceIds`, those roots SHOULD be a subset of `direct(parent)`. This preserves the existing root-node convention for navigable sections: a parent's direct membership contains the Records that anchor its child scopes. A rootless child remains valid because the explicit `childContainerIds` edge is sufficient to author composition; this is useful for loose collections and folder-like scopes that have no distinguished root Record. If a rooted child's roots are not all in `direct(parent)`, an implementation SHOULD emit a structural-coherence diagnostic, but the declared edge remains authoritative and the child's members still contribute to effective membership.

The **effective membership** of a Container is the least fixed point:

    effective(C) = direct(C)
                 ∪ ⋃ effective(child), for every child in C.childContainerIds

Because admission is a declared edge, this recursion follows only `childContainerIds` and never scans unrelated Containers: `effective(C)` is computable from `C` and its declared descendants alone, which keeps an RFC-026 slice self-contained. Every child id MUST resolve to an existing, distinct Container, and the `childContainerIds` graph MUST be acyclic. A missing target, self-reference, or longer cycle is a validation error. For any `C` whose reachable child graph contains such an error, `effective(C)` is undefined and an operation requiring it MUST fail with a diagnostic rather than silently omit an edge or return a partial set. For a valid graph, the repository has a finite number of Containers, so the recursion terminates; its result is an unordered, duplicate-free set. `childContainerIds` order carries no meaning — ordering remains `precedes`/DocumentView-owned (RFC-015).

This RFC does not impose a single-parent rule or a rooted-tree requirement. A Container MAY appear in more than one parent's `childContainerIds` (overlapping scopes), provided the whole graph stays acyclic. Such a Container has no single folder path; that is permitted, and only the tree-shaped subset of Containers maps onto a folder hierarchy.

### Change C — Relations do not define membership

`contains` is a typed semantic Relation between two instance ids. It may be queried, displayed, or used as evidence about part-whole meaning, but it MUST NOT add an instance to a Container's direct or effective membership. The same is true of every other Relation type.

This RFC removes both `contains`-traversal branches in the core Container prose (subsection 4.6.4.6): the `rootInstanceIds` note that an implementation "may derive nested members by traversing contains Relations from these roots," and the `memberInstanceIds` rule that omitted membership "is defined by traversing contains Relations." It supersedes the corresponding branch of I-66 and reverses design-note 013's position that relation-derived and explicit membership are "both valid; neither replaces the other" — explicit structural membership (Changes A–B) is now the sole mechanism. It does not change the meaning or direction of any Relation.

### Change D — operations use one membership definition

The following operations MUST use `effective(C)` when they answer the question “what is in this Container?” or “which Containers include this instance?”

| Operation | Required result |
|---|---|
| `containers_for_instance(instanceId)` | Every Container `C` for which `instanceId ∈ effective(C)` |
| Container-member listing and `container resolve-view` | The effective member set, with presentation ordering applied separately where that surface defines one |
| RFC-026 slice closure | The same effective member set, followed by RFC-026's existing relation, definition, and source-document closure rules |

The position of an id in either membership array MUST NOT be used as a membership or presentation order. `precedes` and DocumentView-owned ordering remain the applicable ordering mechanisms.

This rule makes the following targeted amendments to existing query and slice contracts:

1. **RFC-011 `containerScope`.** The system uses one scoping vocabulary, anchored to the two sets Changes A–B define. `"explicit"` evaluates over `direct(C)` for each named Container — the container's own members, without its nested subtree. `"subtree"` evaluates over `effective(C)` — the recursive closure over `childContainerIds`; it follows declared child edges only and MUST NOT traverse `contains` Relations. The two scopes therefore differ whenever a Container has admitted children, and `"subtree"` is the scope that descends. Implementations MUST deduplicate results. This retains RFC-011's `"explicit"` meaning (scope to the named Containers' own membership) and supersedes only the traversal branch of RFC-011 I-011-3, without changing the `SectionSource.type-query` wire shape. `"repository"` remains unchanged. The `direct` ⇄ `"explicit"` and `effective` ⇄ `"subtree"` mapping is the shallow/deep control the rest of the system already relies on — RFC-013 navigation, for example, is the root Container's `direct` members, not its `effective` closure.
2. **RFC-012 discovery.** A `containerId` predicate matches exactly when the candidate instance belongs to `effective(C)` for the named Container `C` — discovery scopes to the full `effective` (deep) closure by default, the sensible default for "what is in this scope." This supersedes RFC-012 R6/I-118's three-condition rule and removes its `contains`-Relation branch. The authoritative inputs are the Container objects and their declared child graph, not `instanceIndex`. `find` does not currently offer a `direct`-only container filter; a caller that needs the shallow scope uses RFC-011 `containerScope: "explicit"` or structural navigation. A `direct`-only discovery axis is a possible future addition, out of scope here.
3. **RFC-026 slices.** For a container slice, RFC-026 Change C items 2 and 6 are replaced as follows: include `effective(root)` as the member-instance set; include the closure root Container and every Container reachable from it through `childContainerIds`; preserve those declared child edges in the exported Containers; and do not include an unrelated Container merely because its roots or members happen to be subsets of the included instance set. RFC-026's existing definition, relation, source-document, and external-edge closure rules then apply to that member-instance set.

### Change E — queries are separate, read-only constructs

`srs find`, a DocumentView `type-query`/`relation-query`, an SQL view, a JSONPath expression, and a graph traversal all produce selections. They are not Container membership and MUST NOT change direct or effective membership merely because their result changes.

An implementation MAY offer any of those query surfaces. Their syntax, optimization, result ordering, and authorization policy are outside this RFC. A query result can be materialized into `memberInstanceIds` by an authoring action, but that action creates a new explicit structural boundary; it does not make the query the boundary's live definition.

---

## Schema Changes

Both closed Container schema definitions MUST admit the same new optional property:

```json
{
  "childContainerIds": {
    "type": "array",
    "items": {
      "type": "string",
      "format": "uuid"
    },
    "uniqueItems": true,
    "description": "Container IDs of directly composed child scopes. Order carries no meaning."
  }
}
```

| Schema location | Required change |
|---|---|
| `docs/schema/2.0/container.json` | Add `childContainerIds` to the top-level Container `properties`. |
| `docs/schema/2.0/manifest.json#/$defs/Container` | Add the identical property to the embedded Container definition. |

The property contains Container UUIDs, not instance UUIDs. It therefore does not weaken I-20 and MUST NOT be accepted in `rootInstanceIds`, `memberInstanceIds`, or Relation endpoints.

SRSJ requires no envelope or serialization-algorithm change: a serialized Container may carry `childContainerIds` in the same way it carries any other Container property. Compatibility is asymmetric because the existing Container schemas are closed. Existing repositories without the field remain valid under the revised schemas; a repository that uses the new field will be rejected by an older validator that does not recognize it.

---

## Authored scope versus evaluated Selection

The separation this RFC draws — an authored Container versus an evaluated query — is the difference between a database table and a view. At one repository revision they can return identical rows:

    direct(Project)          = {a, b, c}
    evaluate(ActiveRecords)  = {a, b, c}    // at revision R1

They are not the same object. After `c` becomes inactive:

    direct(Project)          = {a, b, c}    // unchanged — an authored boundary
    evaluate(ActiveRecords)  = {a, b}       // changed — a rule re-evaluated

A Container asserts a boundary; a query states a rule. Extensional equality at one revision never makes them semantically equal.

This RFC deliberately does **not** introduce a named `Selection` record for the evaluated side. That role is already occupied by DocumentView sources (`fixed-instances`, `type-query`, and `relation-query`) and `srs find`. A source may itself name fixed instances or evaluate a changing predicate; in either case it is a presentation selection, not the authority for a repository boundary. Reifying `Selection` now would duplicate DocumentView and reintroduce, one layer up, the "two constructs for one job" ambiguity this RFC removes at the Container level. A first-class `Selection` construct is therefore **deferred** to a future RFC, gated on a concrete need that DocumentView sources cannot serve — for example a reusable named query referenced by several views, or a saved search independent of any view. Until then, materializing the instance ids selected by a query into `memberInstanceIds` is the explicit bridge from an evaluated result to an authored boundary. Declaring `childContainerIds` is a separate structural authoring decision; a Record query does not produce Container ids.

---

## Conformance Rules

> **[R1]** A Container's direct membership is exactly the duplicate-free union of its `rootInstanceIds` and `memberInstanceIds`. An omitted `memberInstanceIds` contributes no additional direct members.
>
> **[R2]** A Container is an admitted child of another Container exactly when it is distinct and its `containerId` appears in the other Container's `childContainerIds`. Membership-array overlap alone MUST NOT create admission.
>
> **[R3]** A conforming implementation MUST calculate effective membership using the recursive closure over `childContainerIds` in Change B and MUST deduplicate instance ids. It MUST NOT infer an ordering from either membership array or from `childContainerIds` order.
>
> **[R4]** A Relation of any type, including `contains`, MUST NOT cause an instance to appear in a Container's direct or effective membership.
>
> **[R5]** `containers_for_instance`, Container member resolution, and RFC-026 container-slice membership closure MUST agree on effective membership for the same repository state.
>
> **[R6]** A Record-selection query MUST NOT be treated as persisted Container membership unless an authoring operation writes its selected ids to the Container's explicit membership fields.
>
> **[R7]** Every `childContainerIds` entry MUST reference an existing, distinct Container, and the `childContainerIds` graph MUST be acyclic. A missing target, self-reference, or cycle is a validation error. For any Container whose reachable child graph contains such an error, effective-membership evaluation MUST fail with a diagnostic and MUST NOT return a partial result. A rootless child is valid. When a child has roots, those roots SHOULD occur in the parent's direct membership; a violation produces a structural-coherence diagnostic but MUST NOT remove the declared edge from effective-membership evaluation.
>
> **[R8]** Container-scoped queries MUST use one scoping vocabulary anchored to Changes A–B: RFC-011 `containerScope: "explicit"` MUST evaluate `direct(C)`; RFC-011 `containerScope: "subtree"` and RFC-012 `containerId` filtering MUST evaluate `effective(C)`. `"subtree"`/`effective` evaluation MUST follow `childContainerIds` descendants only and MUST NOT use Relations to discover child Containers.
>
> **[R9]** An RFC-026 container slice MUST include the closure root, its transitive `childContainerIds` descendants, and the root's effective member set. It MUST preserve declared edges among those Containers and MUST NOT include an unrelated Container solely because its roots or members are subsets of the included instance set.

---

## Compatibility and Migration

This RFC adds one new optional Container property, `childContainerIds`. A repository that expresses no nesting, or whose scope is fully captured by explicit membership arrays, needs no change: an absent `childContainerIds` means the Container has no admitted children.

A repository whose nesting was previously *implied* by a section root appearing in a parent's membership must now declare that nesting explicitly in `childContainerIds`; root co-membership alone no longer composes scope. An implementation MAY offer assisted migration that proposes a `childContainerIds` edge for each Container whose non-empty `rootInstanceIds` are a subset of another Container's direct membership, but MUST present the proposed edges for author review — the implicit form cannot distinguish deliberate nesting from incidental overlap, which is the ambiguity this RFC removes.

A repository that relied on an implementation-specific `contains` traversal must materialize its intended boundary into `memberInstanceIds` and `childContainerIds`. There is deliberately no normative automatic migration from Relations: the old specification never fixed the Relation direction, traversal depth, or cycle policy needed to derive one safely.

During adoption, an implementation that previously applied Relation-derived or overlap-derived membership SHOULD emit a diagnostic explaining that the behavior is no longer conformant. It MUST use the explicit structural rule for all newly evaluated membership operations. Because Change D routes `containers_for_instance` and member listing through `effective(C)`, an implementation that previously answered those from direct membership only will return additional results for instances reached through declared child Containers; this is the intended correction, not a data migration.

Repositories that use `childContainerIds` require a validator aware of this RFC. Pre-RFC-034 validators use closed Container schemas and will reject the unknown property. This is forward incompatibility for newly authored composition, not a migration requirement for repositories that do not use the field.

---

## Alternatives Considered

| Alternative | Strength | Why it is not Container membership |
|---|---|---|
| Authored explicit ids | Portable, reviewable, stable under unrelated Record edits | Adopted as direct membership |
| Root-overlap inference (this RFC, Revision 1) | No new property; reuses the existing root-node convention | Nesting inferred from a shared id is itself an evaluation of coincidence — creating a Container rooted at another Container's member silently enlarged that Container's scope, the same non-locality this RFC rejects for queries, and made an RFC-026 slice depend on unrelated Containers. Replaced by the explicit `childContainerIds` edge in Revision 2. |
| Restricted type/tag/lifecycle predicate | Convenient live list within a scope | Membership changes when matching Record data changes; requires a query language and evaluation policy |
| JSONPath | Standardized JSON-tree selection ([RFC 9535](https://www.rfc-editor.org/rfc/rfc9535.html)) | SRSJ is a path-keyed serialization, not the portable semantic model; a stored JSONPath would not naturally survive filesystem or SQL storage |
| SQL view | Expressive and efficient for relational backends | SQL dialect/schema/query-plan dependencies make it a backend query surface, not a repository-format boundary |
| Relation/graph traversal | Useful for semantic exploration | Relation edges assert meaning, not scope; traversal policy is not a portable authoring claim |

The rejected alternatives remain valuable as queries and views. The distinction is intentional: an authored Container says “these instances form this scope”; a query says “these instances match this evaluation now.”

---

## Tier-0 and Open Knowledge Format (informative)

The [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) is a useful thought experiment, not a target or conformance profile for this RFC. An OKF bundle is a hierarchy of directories and Markdown concept files whose identity is path-based. `index.md` is a reserved directory listing rather than a concept, and producers may use unknown frontmatter keys.

The structural model has a natural informal correspondence:

| Folder-oriented reading | SRS Tier-0 reading |
|---|---|
| Directory | Container scope |
| Markdown concept | Tier-0 Note |
| Nested directory | Explicitly declared child Container |
| Directory listing | A presentation of a Container's direct/effective members |

This comparison reveals why a query-defined Container is the wrong abstraction for Tier 0. A filter can export its current hits into a folder, but the folder preserves only that snapshot; it does not preserve the dynamic rule that selected it. Explicit structural composition, by contrast, retains the organizing relationship independently of any query engine.

An OKF directory does not necessarily contain a distinguished concept that can serve as a root Note. Explicit composition therefore permits a rootless child Container. When a Tier-0 scope does have a distinguished root Note, placing that Note in the parent's direct membership preserves the root-node convention and supplies a natural navigation anchor; it is not required merely to represent the directory edge.

No OKF exporter, importer, metadata extension, ID-preservation mechanism, tree restriction, or round-trip guarantee is specified here. Folder compatibility is informative evidence when choosing an SRS Container model, not an acceptance criterion for SRS conformance.

---

## Testability

The following scenarios are normative paper exercises for this proposal. They define observable outcomes that a later implementation RFC or conformance suite can mechanize; this RFC adds no executable fixture.

| Scenario | Setup | Required outcome |
|---|---|---|
| Direct membership | `A.rootInstanceIds = [a]`, `A.memberInstanceIds = [b]`, no `childContainerIds` | `direct(A) = effective(A) = {a, b}` |
| Recursive nesting | `B.roots = [a]`, `B.members = [b]`, `B.childContainerIds = [C]`; `C.roots = [b]`, `C.members = [c]`; `A.members = [a]`, `A.childContainerIds = [B]` | `effective(A) = effective(B) = {a, b, c}`; `effective(C) = {b, c}` |
| Overlap is not nesting | `Area.roots = [a]`, `Area.members = [b]`; later `Proj.roots = [b]`, `Proj.members = [x]`; `Area.childContainerIds` omits `Proj` | `Proj` is **not** admitted; `effective(Area) = {a, b}`, unchanged by the creation of `Proj` |
| Declared nesting | `Area.childContainerIds = [Proj]`; `Proj.roots = [b]`, `b ∈ direct(Area)` | `Proj` admitted; `effective(Area) ⊇ effective(Proj)` |
| Rootless declared child | `A.childContainerIds = [B]`; `B` has no roots and `B.members = [b]` | `B` is admitted and `effective(A) = direct(A) ∪ {b}` |
| Root-coherence warning | `Area.childContainerIds = [Proj]`; `Proj.roots = [q]`, `q ∉ direct(Area)` | Structural-coherence diagnostic; the declared edge remains authoritative and `effective(Proj) ⊆ effective(Area)` |
| Missing child target | `A.childContainerIds = [Missing]`, and no such Container exists | Validation error; `effective(A)` is undefined and membership operations on `A` fail rather than returning a partial set |
| Cycle rejected | `A.childContainerIds = [B]`, `B.childContainerIds = [A]` | Validation error; a conforming implementation rejects the cycle |
| Root-is-own-member | `A.roots = [a]`, `A.members = [a]`, `A.childContainerIds = [B]`; `B.roots = [a]`, with no other members or children | `direct(A) = effective(A) = effective(B) = {a}`; only the declared `A → B` edge exists, and shared root `a` creates no reverse admission |
| Identity member interaction | `A` is an RFC-013 root Container with `identityInstanceId = idA`; `idA ∈ direct(A)` and is a root of no child | `idA ∈ effective(A)`; it participates in membership but is excluded from navigation per RFC-013, and does not admit any child |
| Effective reverse lookup | Recursive-nesting setup plus instance `c` | `containers_for_instance(c)` includes `C`, `B`, and `A` |
| `contains` independence | Add any `contains` Relation from `a` to unrelated `z` | `z` is absent from every effective membership unless explicitly included through the structural rules |
| Query independence | A type/tag/query returns `z` while `z` is structurally absent from `A` | `z` remains absent from `effective(A)`; a view may display it only through its own query source |
| Scope: explicit is direct | `A.childContainerIds = [B]`; `A.members = [a]`; `b ∈ direct(B)` | RFC-011 `containerScope: "explicit"` over `A` yields candidates from `direct(A) = {a}` and MUST NOT include `b` |
| Scope: subtree is effective | Same setup | RFC-011 `containerScope: "subtree"` over `A`, and RFC-012 `containerId = A`, yield candidates from `effective(A) ⊇ {a, b}` |
| Scoped query / Relation independence | The above plus an unrelated `contains` Relation from a member of `A` to `z` | Neither `"explicit"`, `"subtree"`, nor `containerId = A` acquires `z` through the Relation; only the structural sets participate |
| Slice integration | `A.childContainerIds = [B]`; unrelated `C` happens to have all of its members in `effective(A)` | An RFC-026 slice rooted at `A` includes `A` and `B`, preserves `A → B`, and excludes `C` |
| Tier-0 folder analogy | Nested Tier-0 Containers represent directories, including one child with no distinguished root Note | Declared `childContainerIds` reproduce the folder hierarchy; a root Note may supply a navigation anchor but is not required for the directory edge |
| Dynamic snapshot distinction | A predicate currently selects `{b, c}` and later selects `{b, c, d}` after a Record edit | A materialized Container remains `{b, c}` until an author writes `d`; the query result may change independently |

---

## Potential Fixtures and Query Examples (informative)

The following fixtures use short symbolic ids to make the membership shape readable. A real
conformance fixture would replace them with UUIDs. They are examples of the proposed semantics,
not a new query syntax or an executable fixture.

### Fixture A — nested document scope

This fixture represents a repository with one engineering area, split into architecture and
delivery. The `purpose` Record is a member of the repository root but is unrelated to the
engineering hierarchy.

| Container | Roots | Additional direct members | `childContainerIds` | Effective membership |
|---|---|---|---|---|
| `repository` | `purpose` | `engineering-root` | `engineering` | `{purpose, engineering-root, architecture-root, adr-1, delivery-root, release-1}` |
| `engineering` | `engineering-root` | `architecture-root`, `delivery-root` | `architecture`, `delivery` | `{engineering-root, architecture-root, adr-1, delivery-root, release-1}` |
| `architecture` | `architecture-root` | `adr-1` | none | `{architecture-root, adr-1}` |
| `delivery` | `delivery-root` | `release-1` | none | `{delivery-root, release-1}` |

`engineering` declares `architecture` and `delivery` in its `childContainerIds`; `repository`
declares `engineering`. Each declared edge satisfies the coherence invariant — for example
`architecture-root`, a root of `architecture`, is in `direct(engineering)`. Recursion gives the
repository the complete engineering scope without copying every leaf id into its membership
arrays, and without depending on any Container outside the declared chain.

### Fixture B — overlapping structural scopes

The proposal deliberately does not force every Container into a folder tree. This fixture gives one
review scope two authored parents:

| Container | Roots | Additional direct members | `childContainerIds` |
|---|---|---|---|
| `engineering` | `engineering-root` | `review-root` | `review` |
| `compliance` | `compliance-root` | `review-root` | `review` |
| `review` | `review-root` | `review-checklist` | none |

Both `engineering` and `compliance` declare `review` in `childContainerIds`. Each declaration is
root-coherent because `review-root` is a direct member of both parents. `review` therefore has two
parents, while its effective scope remains `{review-root, review-checklist}`. Both parent scopes
include that set through their independently authored edges. This DAG cannot be represented as one
folder tree without choosing a path or duplicating the folder, which is why the Tier-0/OKF
comparison informs the design but does not constrain all SRS Containers to a tree.

### Fixture C — scope is independent of the Relation graph

Add a Relation:

```json
{
  "relationType": "contains",
  "sourceInstanceId": "adr-1",
  "targetInstanceId": "implementation-note"
}
```

If `implementation-note` occurs in none of the membership arrays and is not reached through an
admitted child, it is outside `effective(architecture)` and `effective(engineering)`. The Relation
is still available to a graph query or renderer; it is not an implicit membership write.

### Fixture D — a standalone collection

```json
{
  "containerId": "scratch",
  "title": "Scratch",
  "memberInstanceIds": ["idea-1", "idea-2"]
}
```

`scratch` has no roots and is named in no Container's `childContainerIds`, so it is not an admitted
child of anything. Nor does it become a parent merely because another Container happens to include
`idea-1` or `idea-2`; nesting only follows a declared `childContainerIds` edge. Its effective
membership is exactly `{idea-1, idea-2}`.

A parent MAY later declare `scratch` in `childContainerIds`. That explicit edit admits the rootless
collection and composes `{idea-1, idea-2}` into the parent's effective scope. Nothing about the
Records themselves can cause that transition. This supports both standalone loose collections and
folder-like rootless child scopes.

### Examples: inspecting scope versus querying Records

These examples show the intended division of responsibility. They use existing or illustrative
query surfaces; the RFC defines their relationship to membership, not their command/API grammar.

**1. Structural membership.** Asking whether `adr-1` is in a scope uses effective membership:

```text
containers_for_instance("adr-1")
→ [architecture, engineering, repository]
```

No type, tag, text, Relation, or JSON expression participates in this result.

**2. Discovery inside an authored scope.** A client may query the engineering boundary for active
architecture decisions:

```text
srs find --repo <repo> --container <engineering-id> \
  --type-namespace architecture --type-name decision \
  --lifecycle-state active
```

The Container determines the candidate scope; the type and lifecycle axes determine which members
are displayed. A newly active matching Record is not added to `engineering` merely because this
query returns it.

**3. A DocumentView list.** A view can render decisions from anywhere in the authored engineering
scope, including its nested sections. Because `architecture/decision` Records live in the
`architecture` child Container — inside `effective(engineering)` but not `direct(engineering)` —
the view uses the deep scope:

```json
{
  "source": {
    "type": "type-query",
    "semanticObjectType": "architecture/decision",
    "containerIds": ["<engineering-id>"],
    "containerScope": "subtree"
  }
}
```

`"subtree"` evaluates `effective(engineering)`; `"explicit"` would evaluate only
`direct(engineering)` and render nothing here, since no decision is a direct member of
`engineering` itself. The view is a presentation/query contract: it does not define the Container
and is free to choose a different scope, type, lifecycle, or ordering from another view over the
same Container.

**4. SQL-backed implementation.** An SQL implementation may expose effective membership through a
recursive view or table-valued function, then compose an ordinary query over it:

```sql
SELECT r.*
FROM effective_container_members(:engineering_id) AS m
JOIN records AS r ON r.instance_id = m.instance_id
WHERE r.type_key = 'architecture/decision'
  AND r.lifecycle_state = 'active';
```

`effective_container_members` is an implementation projection of Changes A–B. The SQL statement
is not serialized in the Container and is not required to be portable to a JSON Store.

**5. JSONPath inspection of an SRSJ serialization.** JSONPath can inspect one serialized
Container's direct array:

```text
$.data['containers/engineering.json'].memberInstanceIds[*]
```

This yields only direct ids at that serialization path. It neither resolves records nor calculates
the recursive closure over `childContainerIds`. Storing this expression as membership would make the
Container depend on an SRSJ path and exclude filesystem/SQL-equivalent repositories.

**6. Relation traversal.** A DocumentView can select Records related to a fixed Record:

```json
{
  "source": {
    "type": "relation-query",
    "fromInstanceId": "adr-1",
    "relationType": "contains",
    "direction": "forward"
  }
}
```

This expresses a semantic-neighbour list. Its target set is independent of whether those Records
are members of `architecture`; a renderer may use both the scope and the Relation graph without
conflating them.

---

## Non-Goals

- A general SRS query language or query AST.
- SQL, JSONPath, graph-query, or DocumentView syntax changes.
- Dynamic or predicate-defined Container membership.
- A first-class `Selection` record — the evaluated counterpart is served by DocumentView sources and `find`, and reifying it is deferred (see "Authored scope versus evaluated Selection").
- A Container taxonomy, or any Container property beyond the single `childContainerIds` composition edge defined here.
- An OKF importer, exporter, extension, or compatibility certification.
- A single-parent tree or unique folder path for every Container.

## Cross-References

- RFC-009 — root-record type anchor and `containers_for_instance`
- RFC-011 — DocumentView query extensions (the evaluated-Selection surface)
- RFC-012 — discovery query contract
- RFC-013 — root Container and structural navigation
- RFC-015 — presentation ordering is not membership ordering
- RFC-026 — container-slice closure
- Design-note 013 — "Why Containers and Relations are complementary" (its "both strategies are valid" statement is superseded here)
- Core subsection 4.6.4.6 — Container definition (its `contains`-traversal prose is superseded here)
- I-66 — `containers_for_instance` (its `contains`-traversal branch is superseded here)
