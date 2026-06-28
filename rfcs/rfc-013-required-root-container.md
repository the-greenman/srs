> **GitHub issue**: [the-greenman/srs#96](https://github.com/the-greenman/srs/issues/96)

# RFC-013: Required Root Container & Structural Navigation

**Status**: Accepted (Revision 6)
**Affects**: `manifest.json` (`container` required, root-container semantics), `Container` (new `identityInstanceId` pointer), `ext:repository`, `ext:views-l2` (top-level DocumentView binding), `precedes` relation (nav ordering), schemas `manifest.json` + `container.json`
**Author**: Peter Brownell (from epic the-greenman/srs#95, Phase 0 / Gate 0)
**Date**: 2026-06-28
**Builds on**: RFC-009 (Root-record Type anchor — container typing via `rootTypeRefs` (I-63), `containers_for_instance` membership operation (I-66), soft-deprecated `containerType` (I-64))

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-28 | Initial draft |
| 6 | 2026-06-28 | Accepted; spec records authored in `srs/srs/` — invariants I-79 (`583debe6`), I-80 (`80d769eb`), I-81 (`5d527a48`), I-82 (`f64d7c25`) as `com.semanticops.spec/invariant` records under `records/invariants/`; `srs repo validate` clean (0 errors). Note: like the RFC-009 invariants I-63–I-78, these records are the source of truth but are not yet wired into the `srs-spec.md` "Key Invariants" rendered view — the view does not auto-collect invariant records; closing that render gap is tracked separately and is not part of this RFC. |
| 5 | 2026-06-28 | Accepted (GATE 0) and implementation started; RFC file committed to branch `rfc/013-required-root-container`; canonical schema edited (`container` → required; `identityInstanceId` on both Container schemas). Clarified in Migration that `srs/srs` gains its conforming root container during Phase 1 scaffolding (srs-rust#263–265), not as part of this RFC's authoring — the constraint is defined now and dogfooded as the implementation catches up. |
| 4 | 2026-06-28 | Rev 3 re-review returned **zero blocking** from both reviewers; address two convergent should-fix items on R5/Change C. Redefined the order derivation as explicit filter-then-project per Rule [N+21] (compute [N+12] over the full member set, then remove the identity record) so a `precedes` chain routing *through* the identity record no longer reorders the surviving sections, and R5's "equals the [N+12] order projected" claim is literally true. Scoped the cross-surface agreement claim: nav and a `precedes`-ordered root-container DocumentView agree up to [N+12]'s equal-`createdAt` latitude (identically when the renderer adopts the same `instanceId` secondary tiebreak); `ordering.fieldId` ([N+22]) and the OQ-1 binding are explicitly out of that agreement. |
| 3 | 2026-06-28 | Address Rev 2 re-review. **Blocking:** the Rev-2 order-derivation algorithm invented an ascending-`instanceId` tiebreak that conflicted with the existing Rule [N+12] (`ext:views-l2`, reaffirmed by RFC-008), which orders container members by `precedes` topological sort with a `createdAt`-ascending tiebreak. Rewrote Change C to *reuse* [N+12] — nav order is now defined as the [N+12] order restricted to non-identity root-container members (with `instanceId` as a secondary tiebreak only for equal `createdAt`), so navigation and root-container DocumentView rendering agree by construction; R5 updated to reference [N+12]. Collapsed the four prose order cases into one deterministic procedure (closes integrity F1/F2). **Nits:** clarified that "section" means "non-identity member" and may lack a section container (F3); stated that a reassignment target must be a member before the pointer moves so the repo is never transiently invalid (F4); removed the stray "I-82-adjacent" reference. |
| 2 | 2026-06-28 | Address review findings. **Blocking:** reframe Change D as requirement + ordering rule only — no schema field added this revision; downgrade R7 to a forward-looking SHOULD that becomes testable when the OQ-1 binding is specified (Phase 3, #97). Fully specify the `precedes` nav-order derivation (point-to-point edges → linear total order; deterministic cycle/fork/disconnected handling with ascending-`instanceId` tiebreak) in new Change C "Order derivation"; R5 now references it. **Should-fix:** correct the "Builds on" RFC-009 invariant attribution (I-66 = `containers_for_instance`, not membership def); align I-80/R2 with RFC-012's authority model (authoritative instance set, `instanceIndex` is a cache); state the `manifest.container` ↔ `containerIndex` relationship (R9); call out that both Container schemas are closed (`additionalProperties: false`) so the field must be added to both; add a Non-Goals section; reconcile the Change C `⊇` diagram with R4 (non-identity members ≡ sections). **Nits:** Migration now requires the identity note in the membership set and notes author-chosen order; scope I-82 to a non-empty `containerIndex`; define consumer behavior for a section root with no section container (R10); note OQ-1 is not bound by the identity-pointer rationale. |

---

## Abstract

Every SRS repository today *may* declare a root `manifest.container`, but nothing requires one, and there is no spec-level definition of how a repository expresses its own identity or its top-level navigation. This RFC makes `manifest.container` **required**, introduces an explicit, reassignable **identity pointer** (`Container.identityInstanceId`) that names the repository's identity record (default: the Tier 0 root note created by `repo create`), and defines a **structural navigation model** built entirely from primitives SRS already has — container membership for scope, a `precedes` chain for nav order, and an explicit top-level DocumentView binding for presentation. No new ordering primitive, no navigation taxonomy, no new universal type, and no base package are introduced.

---

## Motivation

### Problem 1 — A repository has no required identity

A SRS repository is a directory with a `manifest.json`. The manifest carries a `title` and an optional embedded `container`, but a consumer that opens an arbitrary repository has no guaranteed answer to "what *is* this repository, and what is its top-level structure?" The embedded `container` is described in the schema as "the canonical source of truth for this repository's identity," yet it is optional — so the canonical identity object may simply be absent. Clients (the governance editor, the web viewer, future engines) each invent their own fallback, and the fallbacks disagree.

### Problem 2 — "Which container is navigation, and in what order" is undefined

Issue #92 asked how a client decides which containers form top-level navigation and how they are ordered. The candidate answers proposed a new taxonomy: a `containerType` value meaning "navigable," a tag vocabulary, or a dedicated nav index. Every one of those adds a mechanism. The repository already has the primitives to express navigation structurally — a root container whose members are the section roots, ordered by a `precedes` chain — but the spec never states that this *is* the navigation model. Without that statement, the structural reading is just one convention among several.

### Problem 3 — The repository's "purpose statement" has no home

`repo create` already produces a Tier 0 root note (title = repo name, an `intent`/purpose section). It is a record like any other; nothing marks it as the repository's identity, and nothing lets it be upgraded later (note → typed record) without breaking references. There is no pointer to *which* record is the identity, distinct from the section roots that make up navigation.

### Problem 4 — Top-level DocumentView selection is undefined for a Tier 0 root

RFC-009 matches a DocumentView to a container by the container root's Type (`rootTypeRefs`). A Tier 0 root note has **no Type**, so `rootTypeRefs` auto-matching cannot select a top-level view for the root container. The spec needs an explicit binding from the root container to its top-level DocumentView(s) that does not depend on the root being typed.

---

## Proposed Changes

### Change A — `manifest.container` becomes required

`container` is added to the `required` array of `manifest.json`. Every conforming SRS repository MUST embed exactly one root Container in `manifest.container`. The embedded Container is the **root container**: it is the repository's identity object and the top of structural navigation.

The root container MUST satisfy the existing core Container invariants unchanged — in particular invariant **20** (`containerId` is not an instance ID and never appears in `rootInstanceIds`, `memberInstanceIds`, `Relation.sourceInstanceId`, or `Relation.targetInstanceId`) and invariant **21** (every id in `rootInstanceIds`/`memberInstanceIds` references a valid SRS instance id).

This is a **breaking change for the manifest schema only**: a repository that previously omitted `container` becomes invalid. See [Migration](#migration) for the one-time fix. No *record* shape changes; no existing well-formed Record, TypedRecord, Note, or Relation becomes invalid.

### Change B — Explicit identity pointer: `Container.identityInstanceId`

A new optional property is added to the Container shape:

| Property | Type | Required | Meaning |
|---|---|---|---|
| `identityInstanceId` | `UUID` | optional | The instance id of the record that *is* this container's identity / purpose statement. On the root container, this names the repository's identity record. |

Semantics:

- **Default.** On `repo create`, `identityInstanceId` is set to the instance id of the Tier 0 root note that `repo create` already produces, and that note is added to the root container's membership set (so I-81 holds out of the box). No new type and no base package are introduced — the existing root note is the default identity record.
- **Membership.** When present, `identityInstanceId` MUST equal one of the root container's member ids (an entry in `rootInstanceIds` or `memberInstanceIds`). The identity record is therefore always *a member of* the root container, distinct from but drawn from the same membership set as the section roots.
- **Distinct from section roots.** The identity record is **not** a navigation section. Navigation is derived from the *non-identity* members of the root container (see Change C). A consumer rendering navigation MUST exclude `identityInstanceId` from the section list.
- **Reassignable.** `identityInstanceId` may be repointed at any time — e.g. from the Tier 0 note to a later Tier 2 typed record — without changing the root container's `containerId` or the repository identity. The identity *pointer* is stable; the *target* may graduate (note → typed record). Repointing is a metadata edit, not a structural migration. The new target must already be a member of the root container before the pointer moves to it (so I-81 holds at every step); the pointer and its target-membership move together and the repository is never transiently invalid.

`identityInstanceId` is added to both schema definitions of the Container shape: the embedded `$defs/Container` in `manifest.json` and the standalone `container.json`. It is meaningful on any Container but normative only for the root container; other containers MAY carry it to name their own root/intent record.

### Change C — Structural navigation contract (no new primitive, no taxonomy)

Navigation for a repository is **derived**, not declared by a taxonomy. The model is fully expressed by primitives SRS already defines:

```
manifest.container  (root container, REQUIRED)
  identityInstanceId → <identity record>          repo identity / purpose (excluded from nav)
  members (a SET)    = { identity record } ∪ { section-root-A, section-root-B, ... }
       non-identity members ≡ the nav sections (R4)
  nav order          = the linear order induced by the `precedes` chain over the section roots
       each section root is itself the root of a section container (in containerIndex)
```

The root container's membership set partitions into exactly two roles: the single member named by `identityInstanceId` (the identity record) and the remaining **non-identity members**, which are the navigation sections. There is no third category — every non-identity member *is* a section (R4). The diagram's set notation is therefore an exact partition, not an open superset. ("Section" here means "non-identity member of the root container"; such a member SHOULD additionally be the root of a section container (R6) but need not be — one that is not is still a section and still navigates, rendered as a leaf per R10.)

The **ordering-ownership rule** states, normatively, that no new ordering field is introduced because each concern already has exactly one owner:

| Concern | Owner |
|---|---|
| semantic sequence (reading / navigation / document order) | `precedes` relation |
| membership / scope | Container `rootInstanceIds` / `memberInstanceIds` (an unordered **set**) |
| presentation arrangement | DocumentView `order` / `ordering` |

Therefore:

- **What the sections are** is the set of non-identity members of the root container.
- **What order they navigate in** is the order induced by the `precedes` chain over those section roots. A root container's member list is a set and imposes no order; a consumer MUST derive nav order from `precedes`, not from membership-array position.
- **No taxonomy.** Navigation membership is not signalled by a `containerType` value, a tag, or a dedicated nav index. A member is a nav section iff it is a non-identity member of the root container. This resolves #92 structurally: the question "which containers are navigation" needs no new mechanism.

**Order derivation (reuses Rule [N+12]).** `precedes` is a point-to-point relation (`sourceInstanceId` precedes `targetInstanceId`), not a `members[]` ordering, so nav order is *derived*. Per the "reuse over invention" thesis, RFC-013 does **not** define a new ordering procedure: **nav order is the existing Rule [N+12] order restricted to the non-identity members of the root container.** Rule [N+12] (`ext:views-l2`, reaffirmed by RFC-008) already specifies how to order a container's members by `precedes`, so a repository's top-level navigation and its root-container DocumentView rendering produce the *same* section order by construction.

The nav order is computed by **filter-then-project**, exactly the projection semantics Rule [N+21] already defines:

1. Compute the Rule [N+12] order over the **full** member set of the root container — all members, *including* the identity record — by topological sort over the `precedes` edges among those members.
2. **Remove the identity record** from that sequence. Per [N+21], removing a member that was a `precedes` bridge between two survivors MUST NOT reorder those survivors — so a chain that routes through the identity record (sectionA → identity → sectionB) still keeps sectionA before sectionB.
3. **Determinism for unordered members.** [N+12] orders members that share a `createdAt` (or that are disconnected, or within a cycle) only up to its `createdAt`-ascending tiebreak, which does not fully determine equal-timestamp siblings. For nav determinism, RFC-013 pins those residual ties by `instanceId` ascending as a secondary key (batch-authored records frequently share an identical `createdAt`). Where `createdAt` differs, nav order matches [N+12] exactly; the secondary key only refines [N+12] where [N+12] is itself silent.
4. **Non-simple-path diagnostic.** When the `precedes` graph over the section roots is not a simple chain — a fork (a member with two successors or two predecessors) or a cycle — the procedure above still yields a single deterministic order, but the implementation MUST emit a diagnostic (the section roots are expected to form a linear chain). A cycle's members are mutually unordered by `precedes` and so fall to the tiebreak.

The result is the [N+12] order projected onto the non-identity members. Because it is a function only of the root container's membership, the `precedes` edges over it, and the members' `createdAt`/`instanceId`, two conforming nav consumers given the same repository MUST produce the same nav order. The identity record never appears in nav order.

**Agreement with DocumentView rendering.** A root-container DocumentView that renders its sections via a `precedes`-ordered `container-subset` ([N+12], no `ordering.fieldId`) produces the same section order as navigation, *up to* [N+12]'s permitted reordering of equal-`createdAt` siblings — and produces an *identical* order when the renderer also applies the `instanceId` secondary tiebreak (RECOMMENDED for any surface that wants byte-identical agreement with nav). Two cases fall outside this agreement and are out of scope here: a section whose `ordering.fieldId` is set overrides `precedes` per [N+22] (then DocumentView order intentionally differs from nav), and the exact top-level view binding is OQ-1 (#97).

**A section root with no section container.** Per R6/I-82, each section root SHOULD be the root of a Container in `containerIndex`, but this is a SHOULD. When a section root has no corresponding section container, a consumer MUST still render it as a navigation entry (a leaf), using the section root instance itself for the entry's label; it MUST NOT drop the section from navigation (R10).

### Change D — Explicit top-level DocumentView binding to the root container

Because the root container's root may be a Tier 0 note (no Type), RFC-009 `rootTypeRefs` auto-matching cannot select its top-level DocumentView. The top-level DocumentView(s) for a repository are therefore bound to the root container **explicitly**, by one or both of:

- a manifest- or container-level pointer naming the DocumentView(s) for the root container, and/or
- resolving the view by id via `resolve_container_view(view_id)` against the root container.

**Scope of this change.** This RFC establishes only the *requirement* and the *selection rule*: the top-level DocumentView for the root container must come from an explicit binding, and `rootTypeRefs` auto-match MUST NOT be used to select it. `rootTypeRefs` auto-match continues to apply unchanged to typed section containers. **No schema field is added by Change D in this revision** — the exact field name, location, and shape of the binding (manifest-level pointer, container-level field, and/or `resolve_container_view(view_id)` resolution) is an Open Question (OQ-1) deferred to the `ext:views-l2` surface and the Phase 3 view-binding work (#97). Because no binding field yet exists, the selection rule (R7) is a forward-looking SHOULD until OQ-1 is resolved; it is not a Gate-0 conformance obligation. The principle is fixed now; the wire shape is settled in #97.

---

## Conformance Rules

> **[R1]** A conforming SRS repository manifest MUST include a `container` member. A manifest without `container` is invalid.
>
> **[R2]** The root container (`manifest.container`) MUST satisfy core Container invariants 20 and 21 — its `containerId` MUST NOT appear as any instance id or relation endpoint, and every id in `rootInstanceIds`/`memberInstanceIds` MUST resolve to a member of the repository's authoritative instance set (the union of the instance files declared by the repository; `instanceIndex` in `manifest.json` is the cache of that set per RFC-012 R6, not an independent authority).
>
> **[R3]** When `identityInstanceId` is present on a Container, it MUST equal an id contained in that Container's `rootInstanceIds` or `memberInstanceIds`. If it resolves to no such member, the repository is invalid.
>
> **[R4]** A consumer deriving structural navigation from the root container MUST treat the non-identity members of the root container as the navigation sections and MUST exclude the member named by `identityInstanceId` from that section list.
>
> **[R5]** A consumer MUST derive navigation order by projecting the existing Rule [N+12] order (`ext:views-l2`) onto the non-identity members of the root container (filter-then-project per [N+21]), as specified in Change C, and MUST NOT derive order from the position of ids within `rootInstanceIds`/`memberInstanceIds` (which is an unordered set). The resulting nav order MUST equal the [N+12] order projected onto the section roots; where [N+12] leaves equal-`createdAt` siblings unordered, the consumer MUST pin them by `instanceId` ascending. Given the same repository, two conforming nav consumers MUST produce the same total order. A `precedes`-ordered root-container DocumentView agrees with this nav order up to [N+12]'s equal-`createdAt` latitude, and identically when it adopts the same `instanceId` secondary tiebreak.
>
> **[R6]** Each non-identity section root of the root container SHOULD be the root (`rootInstanceIds` entry) of some Container listed in `containerIndex`. A section root with no corresponding section container is a diagnostic, not an error.
>
> **[R7]** *(Forward-looking; becomes testable when the OQ-1 binding is specified in #97.)* A consumer selecting the top-level DocumentView for the root container SHOULD use the explicit root-container view binding once defined, and SHOULD NOT rely on RFC-009 `rootTypeRefs` auto-match for the root container. `rootTypeRefs` auto-match remains the normative selection mechanism for typed section containers. This RFC adds no binding field, so R7 carries no Gate-0 conformance obligation.
>
> **[R8]** `identityInstanceId` MUST be reassignable: changing its value to a different member of the root container MUST NOT change the `repositoryId`, the root container's `containerId`, or any instance id, and MUST NOT require rewriting relations.
>
> **[R9]** The root container is identified solely by `manifest.container`; it MUST NOT be required to appear in `containerIndex`. `containerIndex` lists the repository's other Containers (notably the section containers of R6). An implementation MUST treat `manifest.container` as the root container regardless of whether a same-`containerId` entry also appears in `containerIndex`.
>
> **[R10]** When a non-identity section root has no corresponding section container (R6 unmet), a consumer MUST still render it as a navigation entry (a leaf) and MUST NOT drop it from navigation.

---

## New invariants

These are authored as `com.semanticops.spec/invariant` records in `srs/srs/`, taking the next free numbers after I-78.

| # | Invariant | Force |
|---|---|---|
| **I-79** | `manifest.container` is REQUIRED and MUST satisfy core Container invariants 20–21. | MUST (error) |
| **I-80** | Every id in the root container's `rootInstanceIds` and `memberInstanceIds` MUST resolve to a member of the repository's authoritative instance set (`instanceIndex` is the cache of that set, not an independent authority — RFC-012 R6). | MUST (error) |
| **I-81** | When present, `identityInstanceId` MUST resolve to a member of the root container (an id in its `rootInstanceIds` or `memberInstanceIds`). | MUST (error) |
| **I-82** | When `containerIndex` is non-empty, each non-identity section root of the root container SHOULD be the root of some Container in `containerIndex`. An absent or empty `containerIndex` suppresses this diagnostic. | SHOULD (diagnostic) |

I-80 is the root-container specialization of core invariant 21 (it pins membership resolution for the *required* root container, where 21 is a general statement over all containers). Its authority model matches RFC-012 R6: validity is defined against the authoritative instance set, with `instanceIndex` as a (possibly stale) cache — not the other way round. It is stated separately so the required-root-container guarantee is self-contained.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Add `"container"` to the top-level `required` array. Add `identityInstanceId` (`{ "type": "string", "format": "uuid" }`) to `$defs/Container.properties`. |
| `docs/schema/2.0/container.json` | Add `identityInstanceId` (`{ "type": "string", "format": "uuid" }`) to `properties`. |

No other schema files change. The new field is additive on the Container shape; making `container` required is the only constraint-tightening change.

**Both Container definitions are closed.** The embedded `$defs/Container` in `manifest.json` and the standalone `container.json` both declare `additionalProperties: false`. `identityInstanceId` is therefore *rejected* by both schemas until it is explicitly added — adding it to both files is load-bearing, not documentation. Omitting either one would make a repository that uses the field invalid under that schema.

Schema changes must be synced to the mirror repositories **before** this spec PR merges (per the epic's merge-order constraint):
- `srs-rust/crates/srs-schema/schemas/2.0/` — coordinated via the-greenman/srs-rust#269.
- `srs-vscode/schemas/2.0/` — coordinated via the-greenman/srs-vscode#25.

Per the `/rfc` single-repo workflow, this session edits only the canonical schema in `srs/docs/schema/2.0/`; the mirrors refresh from the `srs` release artifact through their own pipelines.

---

## Migration

Making `container` required is a breaking change for any existing repository manifest that omits it. The migration is one-time and mechanical:

1. Add an embedded `container` to the manifest with a fresh `containerId` (UUID), `title` = repository title, and `rootInstanceIds`/`memberInstanceIds` listing the existing top-level instances (the section roots) **and the identity record itself**. The identity record must be in the membership set so the `identityInstanceId` pointer satisfies I-81.
2. Set `identityInstanceId` to the existing Tier 0 root note if one exists (and ensure it is included in step 1's membership set); otherwise leave it unset (it is optional) until an identity record is designated.
3. Assert a `precedes` chain over the section roots to fix navigation order. No order is implied by the prior membership arrays (they are a set), so the initial order is **author-chosen**; the order-derivation algorithm in Change C then makes it deterministic from those edges.

No record, relation, type, or field definition changes. The `srs/srs` spec repository itself is subject to R1 and will gain a conforming root container during **Phase 1** of epic #95, when `repo create` scaffolds the root container and the implementation begins enforcing it (the-greenman/srs-rust#263–#265). Until that scaffolding lands, the new manifest constraint is defined here but not yet enforced by the reference implementation, so existing repositories — including `srs/srs` — remain loadable; the constraint is dogfooded as the implementation catches up.

---

## Non-Goals

This RFC deliberately does **not** introduce, and the following are out of scope (per epic #95):

- **No new identity Type and no base package.** The default identity record is the existing Tier 0 root note from `repo create`; no universal "repository identity" Type is defined and no package is mandated for every repository.
- **No graduation tooling.** The RFC states that repointing `identityInstanceId` (note → typed record) is a metadata edit, but the *command/tooling* to graduate a note into a typed record is out of scope and tracked separately (the-greenman/srs-rust#270).
- **No navigation taxonomy.** No `containerType` value, tag vocabulary, or nav-index mechanism is added (see Change C and Alt B).
- **No new ordering primitive.** Sequence remains owned by `precedes`; this RFC only specifies how to *derive* nav order from it.
- **No DocumentView binding schema.** Change D fixes the requirement and selection rule but adds no binding field; the wire shape is OQ-1, settled in Phase 3 (#97).
- **No web work.** All client/web consumption (sidebar nav, WASM `resolve_container_view`) is Phase 4 of the epic and out of scope here.

---

## Rationale

**Reuse over invention.** The central design choice is to express navigation with primitives the spec already defines — containers for scope, `precedes` for order, DocumentViews for presentation — rather than add a navigation taxonomy. Issue #92 framed nav membership as possibly needing a new `containerType` value, tag vocabulary, or nav index; each would create a second way to say something the existing primitives already say, and second ways drift. The ordering-ownership table makes the single-owner rule normative so future RFCs do not reintroduce a competing order field.

**Identity as a reassignable pointer, not a type.** Designating the identity record by a UUID pointer (`identityInstanceId`) rather than by a Type or a reserved namespace keeps the identity record an ordinary instance. This is what makes graduation (note → typed record) a metadata edit instead of a migration: repoint the pointer, keep every id stable. A type-based marker would force the identity record into a fixed Type and break the "start as a Tier 0 note" default.

**Pointer on the container, not the manifest.** The embedded `manifest.container` is already declared the canonical source of truth for repository identity, and invariant (c)/R3 requires the pointer to resolve to *a member of the root container*. Co-locating the pointer with the membership set it references keeps identity self-describing in one object and lets any container name its own intent record. A manifest-level pointer would split identity across two objects and contradict the schema's existing "container is the identity source of truth" statement (see Alternatives).

**Explicit view binding because the root may be untyped.** RFC-009 deliberately keys DocumentView selection on the container root's Type. A Tier 0 root note has no Type, so the root container needs an explicit binding rather than a special-case "untyped → default view" rule, which would be a second selection mechanism.

---

## Alternatives Considered

### Alt A — Manifest-level identity pointer (`manifest.identityInstanceId`)

Place the identity pointer at the top of the manifest instead of on the root container. **Rejected:** it splits repository identity across two objects (the manifest names the pointer; the container holds the membership it must resolve against), and it contradicts the schema's existing statement that `manifest.container` is "the canonical source of truth for this repository's identity." The container-level field keeps identity in one self-describing object and generalizes cleanly to non-root containers.

### Alt B — Navigation taxonomy via `containerType` or tags

Signal nav membership with a `containerType` value (e.g. `"navigable"`) or a reserved tag, and order via an explicit `navOrder` field or manifest nav index. **Rejected:** this is the mechanism #92 hypothesized and then argued against. It adds a taxonomy and a second ordering source competing with `precedes`, both of which can drift from the structural truth (which members the root container actually has, in what `precedes` order). The structural model needs no new vocabulary.

### Alt C — A new universal "repository identity" Type and base package

Introduce a canonical identity Type and ship a base package every repository installs. **Rejected:** explicitly out of scope per the epic. The Tier 0 root note already exists; a mandatory base package would impose a dependency on every repository and a fixed Type on the identity record, defeating the reassignable-pointer goal.

### Alt D — Make `container` optional with a diagnostic

Keep `container` optional but emit a diagnostic when absent. **Rejected:** the whole point of the epic is a *guaranteed* root container so navigation and identity are always derivable. A diagnostic-only rule leaves consumers with the same "maybe-absent identity" fallback problem this RFC sets out to remove.

---

## Open Questions

1. **OQ-1 — Top-level DocumentView binding shape.** Change D requires an explicit binding from the root container to its top-level DocumentView(s) but defers the exact field name/shape (a manifest-level pointer, a container-level field, and/or `resolve_container_view(view_id)` resolution) to the `ext:views-l2` surface. This does not affect the manifest/container schema changed by this RFC. **To resolve before the view-binding work in Phase 3 (#97), not before Gate 0.** Note: the "pointer on the container, not the manifest" rationale for the *identity* pointer (Change B) is specific to identity and does **not** pre-decide OQ-1 — the view binding may land at either level on its own merits.

All other questions raised by #92 and the epic are resolved structurally in this RFC.
