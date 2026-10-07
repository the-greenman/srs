> **GitHub issue**: [the-greenman/srs#820](https://github.com/the-greenman/srs/issues/820)

# RFC-048: Declared structural constraints on relation types

**Status**: Draft (Revision 1)
**Affects**: `RelationTypeDefinition` (three new constraint facets); `Blueprint` `RelationSpec` (`cardinality` and `required` removed); the core package's `precedes` and `contains` definitions (new definition version); `repo validate` and the relation-writing operations of conforming implementations (new warning diagnostics); `dataModelRevision` (next unassigned revision, for the Blueprint half only); `docs/schema/2.0/relation-type.json`, `docs/schema/2.0/blueprint.json`. Builds on **RFC-005 (Accepted)** (installed relation types, the effective package set), **RFC-029 (Accepted)** (the implicit core package), **RFC-033 (Accepted)** (`dataModelRevision`), **RFC-034 (Accepted)** (Containers; `childContainerIds` acyclic) and **RFC-042 (Accepted)** (the concept tree). Context only: RFC-038, RFC-043.
**Author**: design dialogue draft (owner rulings 2026-10-07 on the-greenman/srs#820)
**Date**: 2026-10-07

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-07 | Initial draft. Seven owner rulings of 2026-10-07 are applied as given (the relation type is the one home; exactly three facets; warnings first; core defaults only for `precedes` and `contains` acyclicity; no overlay or relation inheritance; the `contains` single-parent rule is not held here; enforcement lives once in the core service). |

---

## Charter alignment

**Cell(s):** cell:conformance, cell:containment, cell:reference, cell:assertion, cell:governance, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Conformance: one way over many** (`rfc-decision-cce3c00e`). Primary cell. Aligned: graph shape gets one declaring home, the relation type, and the inert Blueprint vocabulary is collapsed onto it rather than kept beside it.
- **Containment: declaration over location** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned: `contains` is declared acyclic as data on its definition. Single-parent is deliberately not declared on the core `contains` (see the consequence map).
- **Reference: declared strength over convenient reach** (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`). Aligned: an endpoint restriction names a Type by a declared reference strength (LINEAGE, a bare `typeId`), not by an unresolved string.
- **Assertion: statement over side-effect** (`rfc-decision-cce3c00e`). Aligned: a violating relation is reported, never altered, dropped or silently repaired.
- **Governance: migration over drift** (`rfc-decision-cce3c00e`, `rfc-decision-628cf6c4`). Aligned: removing two Blueprint properties is a registered migration with a revision stamp, not an edit.
- **Portability: preserve over recognize** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned: constraints are properties of the definition and travel with the package that carries it.

**Axis preference:**
- **5–11 Succession↔Conformance: Reliability over Renewal**, default pole taken. The boundary clause reads *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* Warnings-first is the clause applied: no previously valid corpus becomes invalid. Errors arrive only by an explicit later definition version at a declared boundary ([R14]).
- **2–8 Identity↔Assertion: Evolution over Continuity**, default pole taken. Its phase-bound boundary clause (*precommitted to flip to Continuity at the first full public release*) is the one boundary this RFC names as a candidate for the error path, and does not decide (Open Question 3).
- **3–9 Description↔Governance: Shared Coherence over Local Autonomy**, default pole taken for the two core defaults, and bounded by the same axis's explicit-local boundary for everything else: a rule one repository chose stays that repository's rule (ruling 4).
- **1–7 Versioning↔Reference: Semantic Integrity over Practical Expression**, default pole taken (typed endpoint references).
- **6–12 Containment↔Portability: Portability over Possession**, default pole taken.

**Decisions consulted:** `rfc-decision-c20fcff8` (level test), `rfc-decision-1e7c0c8e` (a generic tool defines what is possible), `rfc-decision-cce3c00e` (grid; one way over many), `rfc-decision-9ee14517` (layer rules), `rfc-decision-0118e938` (one layer per construct), `rfc-decision-7caca3a1` (decision modes), `rfc-decision-e99a9437` (doors), `rfc-decision-8aed3412` (reusable parts; relations are global claims), `rfc-decision-0df19d60` (context order on the Container), `rfc-decision-0750c62f` (a Container is a declared selection), `rfc-decision-628cf6c4` (a rename is a migration), `rfc-decision-5f8204bc` (retirement has one way per layer), `rfc-decision-43249f53` (one state mechanism; the rejected two-tier boundary), `rfc-decision-c8704763` (the Reference taxonomy), `rfc-decision-2e0cd70a` (carry meaning you do not recognise), `rfc-decision-4431046e` (how a decision record changes).

**Contradictions found:** None overridden. Three tensions are named and resolved inside existing rulings.
- `rfc-decision-5f8204bc` says relation type definitions are SUBSTRATE ENTRIES that retire by status because instance data addresses them by string key and cannot pin a version. A "new definition version" of core `precedes` (Change D) is therefore a new version of a definition that no relation pins. That is consistent: nothing pins version 1, so version 2 reaches every relation that resolves the key. It is also why the safety of the change rests on warnings, not on pinning ([R14]).
- `rfc-decision-43249f53` rejected a two-tier boundary as a drift seam. This RFC keeps `irreflexive` beside the new `acyclic`. They overlap on exactly one case, a self-loop, and the overlap is named and given one resolution ([R9]); the severity difference (an existing error versus a new warning) is the reason they are not collapsed. Whether to collapse them anyway is Open Question 4.
- `rfc-decision-8aed3412` and `rfc-decision-0df19d60` refuse context carried on an edge and refuse to let a shared record take one parent from an edge. Declaring single-parent on core `contains` would do exactly that, so it is not declared. This is a reason in the RFC, not a contradiction.

**One-way-per-goal:** The goal is "declare the shape of the relation graph". Four things touch it today:
- **`RelationTypeDefinition.irreflexive` and `requireSameType`** declare a self-loop ban and a same-Type requirement. They stay, and the three new facets sit beside them on the same object. One home: the relation type.
- **Blueprint `RelationSpec.cardinality` and `required`** declare cardinality and presence. They are inert (no validation reads them). This RFC **collapses them onto the relation type** and removes them (Change C). Without that, two vocabularies would declare multiplicity.
- **`Type.validationRules`** is intra-record only and is not a mechanism for this goal (Alternatives, Alt B).
- **Invariants I-150 / RFC-034 [R7]** declare acyclicity of the `childContainerIds` graph. That is a different graph (Containers, which are not relation endpoints). It is untouched, and the possible future unification is noted in Change F, not decided.
- The retired `allowedSourceTypes` / `allowedTargetTypes` had no successor; the endpoint facet is that successor under new names, not a parallel mechanism.

**Layer test:**
- **Which layer owns this?** MEANING plane, definitions layer: a `RelationTypeDefinition` is a closed-vocabulary declaration at the same stack position as Field and Type. Enforcement binds the OPERATION plane's core service, one implementation behind CLI, WASM and MCP adapters (`srs-rust/docs/architecture/capability-layering.md`); adapters add no semantics.
- **Consume or clone downward?** Consume. An endpoint restriction references a Type through the existing LINEAGE reference form. Nothing restates what a Type is.
- **Does the layer below stand alone without this?** Yes. Instances and relations are valid with every facet absent. A definition declaring no facet constrains nothing, and E1 to E4 still apply unchanged.

**Level test** (`rfc-decision-c20fcff8`): each facet is declarable in a repository's own package data and checkable by `repo validate`, so it belongs in the standard. The rules this replaces fail the test and are re-dispositioned in Motivation.

**Consequence map (complex decision).** The decision touches six cells. The options are the placements of the constraint surface and the severity at which it speaks.

| Option | Conformance (one way over many) | Containment (declaration over location) | Reference (declared strength) | Assertion (statement over side-effect) | Governance (migration over drift) | Portability (preserve over recognize) | Outcome |
|---|---|---|---|---|---|---|---|
| **Chosen. Three facets on the relation type; warnings first; core acyclic defaults only** | One declaring home; Blueprint collapsed onto it. | `contains` acyclic declared; no single-parent rule imposed on every corpus. | Types named by LINEAGE `typeId`. | A violation is a diagnostic; no edge is altered. | Blueprint removal is one registered migration. Core default arrives as a definition version. | Constraints travel in the definition. | **Chosen** (owner rulings 1 to 4). |
| Constraints on the Blueprint | Second home for graph shape beside the relation type, or the relation type has none. | Constraint is per-document, so a global claim becomes contextual. | Already `ExactTypeRef`. | Same. | No migration, but the inert vocabulary stays inert. | Constraint lives in a document template, not with the relation. | Rejected (ruling 1). |
| Constraints on `Type.validationRules` | A third home, intra-record by construction. | n/a | Cannot see another record. | n/a | n/a | n/a | Rejected. |
| Overlay or refinement of core relation types; relation inheritance | One way becomes two (base plus overlay). | Lets a repository silently re-define `contains`. | Needs a new reference strength. | n/a | Needs conflict resolution between overlay and base. | Overlays do not travel with the base. | Deferred to a named future RFC (ruling 5). |
| Single-parent as a global `contains` rule | Fits "one way". | RFC-034 refuses single-parent for Containers; shared records need several. | n/a | An edge would carry a context-specific fact (`rfc-decision-8aed3412`). | Would invalidate shared-part reuse. | A corpus that reuses parts could not travel in. | Rejected (ruling 4). |
| Errors from the first release | Strongest contract. | n/a | n/a | Breaks standing corpora at once. | Forces a migration for every corpus on upgrade. | An older corpus is refused by a newer reader. | Rejected: axis 5–11 boundary clause (ruling 3). |
| Declare `depends-on` acyclic | Looks tidy. | n/a | n/a | Would call 4 real, intended 2-cycles invalid. | n/a | n/a | Rejected (srs#608). A one-repository rule would leak into the standard. |

Column coherence. Earth (structure is declared, never inferred) holds: shape is stated in the definition and not inferred from a walk. Air (meaning stated once and validated against its statement; conflicts resolve by declared authority, visibly) holds: when data conflicts with the definition, the definition wins by being reported and the data is not edited. Water (connection is explicit and carried) holds: no relation is created, dropped or re-typed. Fire (change preserves what it replaces) holds: the Blueprint properties are removed by migration, and the values removed are named in the migration output.

Emergence. Two effects the single-cell reading would miss. First, `repo validate` becomes a consumer of relation type definitions beyond lookup, which invites a growing constraint language; the guard is the closed list of three facets and the Not In Scope list, so any further facet needs its own RFC. Second, removing pair-scoped cardinality from Blueprint pushes authors who need "an argument has exactly one conclusion" toward a dedicated, namespaced relation type with endpoint restrictions. That proliferation of narrow relation types is a real cost of ruling 1, and it is stated rather than hidden (Consequences of Change C).

This decision yields rulings for the owner, not guard compliance. Rulings 1 to 7 are given and stated as such below; the questions that remain are in Open Questions.

---

## Abstract

SRS has no vocabulary to say what shape a relation graph must have. A repository cannot declare that `precedes` must not loop, that a leaf may have at most one parent, or that a relation connects only certain Types, and `repo validate` checks none of it. Blueprint carries a multiplicity vocabulary that no code reads. This RFC puts exactly three declarable facets (endpoint-type restriction, cardinality, acyclicity) on `RelationTypeDefinition`, the one home, removes the inert Blueprint properties, declares `precedes` and `contains` acyclic in the core package, and reports every violation as a validation warning. Nothing that is valid today becomes invalid.

---

## Motivation

### Problem 1 — The standard cannot declare graph shape, so rules are either unchecked or private scripts

The relation checks that exist are exactly four. E1 and E2 resolve the relation type and the two endpoints, E3 bans a self-loop where `irreflexive` is true, and E4 requires the same Type where `requireSameType` is true. Nothing checks cardinality, a cycle longer than one edge, or which Types a relation may connect. The definitions of these were retired or deferred: RFC-005 deferred cardinality ("enforcement requires graph inspection; deferred until a consumer needs it") and its `allowedSourceTypes` / `allowedTargetTypes` were keyed on the retired `semanticObjectType` string and removed with no successor (srs#372, `rfc-decision-c8704763`).

The cost is visible. `precedes` cycles degrade silently: the tree service prunes a cycle at read time, and the graph code emits a render-time message that never reaches the validation report (srs-rust#557). The spec's own concept-tree rules are held up by a bespoke script that binds only this repository. Under the level test (`rfc-decision-c20fcff8`) a rule no repository can declare and no implementation can check is an authoring rule; the missing piece is the vocabulary.

### Problem 2 — Blueprint holds the richest vocabulary and it is inert

`RelationSpec` in `blueprint.json` carries `cardinality` (`one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`) and `required` (a boolean). No validation reads either; the only consumers generate briefs and schemas. A multiplicity vocabulary that nothing enforces, on an object that is not the relation's definition, is a second home waiting to drift from the first. In the corpora surveyed, 7 live Blueprint files set them: 1 in srs-programme (3 `RelationSpec`s, each with both properties) and 6 in muSrs (39 `RelationSpec`s with `cardinality`, 22 of them also with `required`). `srs/srs`, srs-context and the semanticops.com source have no Blueprint.

### Problem 3 — The held-rules queue on srs#820 needs rewriting

srs#820 held four rules as debts. Applying the rulings of 2026-10-07, their dispositions are:

| Held rule (as filed on srs#820) | Disposition now |
|---|---|
| `contains` has one parent; a leaf's parent is a `concept` (RFC-042 [R2]) | **Not held.** Relocated to the authoring guide (srs#818 / #819). Single parent is RFC-042's choice for the spec's concept tree, not a global rule. This RFC promises nothing about it. |
| `precedes` forms no cycles | **Core, this RFC** (Change D). |
| `mechanism-b3c293f9`, naming grammar: snake_case `name`, namespace grammar | **Related, not in scope.** A `pattern` on `name` / `namespace` in `field.json` is srs#236, a separate one-line change. It is not one of this RFC's three facets. |
| `mechanism-b3c293f9`, the version-bump table | **Not mechanisable.** SRS cannot observe whether a meaning changed. It stays an authoring rule. |

---

## Proposed Changes

### Change A — Three facets on `RelationTypeDefinition`

`RelationTypeDefinition` gains four optional properties that together express three facets. A definition that sets none of them constrains nothing, exactly as today.

**Endpoint-type restriction** is two optional lists, `sourceTypeIds` and `targetTypeIds`, each a list of bare Type UUIDs. When a list is present, the instance at that end of every relation of this type must be a Record bound to one of the listed Types. The reference form is LINEAGE (`rfc-decision-c8704763`): it names the Type's identity and matches whatever version a Record is bound to. A Type moving from version 1 to version 2 therefore does not turn existing relations into violations, and no relation type definition needs a new version because a Type did. (A pinned form would require exactly that, and every Type version bump would become a definition edit.) The match is on the Record's `typeId` only: it does not follow `ext:type-inheritance`, so a Record of a subtype does not satisfy a restriction naming its parent (Open Question 5). A Note has no Type, so it satisfies no non-empty list. The new names are deliberate: the retired `allowedSourceTypes` / `allowedTargetTypes` held strings of a retired kind, and reusing a retired name for a different shape would break `rfc-decision-628cf6c4`. It composes with the existing `requireSameType`: all declared conditions must hold.

**Cardinality** is one optional object, `cardinality`, with two optional sides, `perSource` and `perTarget`. Each side holds an optional `min` and an optional `max` (integers; `max` at least 1; `min` at most `max`). `perSource` bounds how many relations of this type may leave one source instance. `perTarget` bounds how many may arrive at one target instance. An absent `max` is unbounded and an absent `min` is 0. This replaces the four-valued `one-to-many` style enum, which cannot say "at most 3" or "at least 1".

The meaning of a violation depends on which bound it is. A `max` is violated by an instance that has more edges than allowed, and an instance with zero edges can never violate it. A `min` is violated by an instance in the *population* that has too few edges, and a zero-edge instance is exactly the case it catches. The population is the set of Records bound to a listed Type on that side, so a `min` is only meaningful where an endpoint restriction names that side: `perSource.min` needs `sourceTypeIds`, and `perTarget.min` needs `targetTypeIds`. A definition that sets a `min` on a side with no restriction is malformed ([R5]); without a population, "every instance in the repository" would have to carry the edge, which is never what an author means.

**Acyclicity** is one optional boolean, `acyclic`. When true, the directed graph formed by the edges of this relation type alone, read source to target as stored, must contain no cycle. Cycles formed by mixing relation types are out of scope. A cycle is any closed directed path of one or more edges, so a self-loop is a cycle. `irreflexive` (E3) already rejects self-loops as an error and is unchanged. When a type declares both and a self-loop is present, only E3 reports it ([R9]); `acyclic` reports cycles of two or more edges. Reporting is one diagnostic per strongly connected component (or per self-loop), naming its instances and relation ids, so a cycle is one finding and not one per edge.

*Consequences.* A repository can now state "no loops", "at most one", "at least one of these" and "only between these Types" as data and have it checked. It cannot yet state symmetry, transitivity, inverse or uniqueness (Not In Scope). A definition that names a Type that does not resolve in the effective package set is malformed ([R5]), the same standing as an unresolved `fieldId` in a Type.

An illustration of a custom type using all three facets (the prose above is the specification):

```
"key": "org.example/concludes",   "acyclic": true,
"sourceTypeIds": ["<argument typeId>"],  "targetTypeIds": ["<claim typeId>"],
"cardinality": { "perSource": { "min": 1, "max": 1 } }
```

### Change B — Diagnostics and severity

A violation of any instance-level facet is a **warning** in `repo validate`'s `payload.diagnostics`, never an error and never a refusal to load. Four stable codes:

| Code | Raised when |
|---|---|
| `relation-endpoint-type` | A relation's source or target is not bound to a listed Type (or is a Note). One per relation. |
| `relation-cardinality-exceeded` | An instance has more edges of the type than a declared `max`. One per instance and side. |
| `relation-cardinality-unmet` | An instance in the declared population has fewer edges than a declared `min`. One per instance and side. |
| `relation-cycle` | A relation type declared `acyclic` has a directed cycle of two or more edges. One per strongly connected component. |

Each diagnostic carries the relation type key, the instance ids and, where an edge is at fault, the relation ids, in a deterministic order. A malformed definition (Change A) is the one error: `relation-type-constraint-invalid`, because definitions are the trust boundary and reject what they cannot interpret (`rfc-decision-2e0cd70a`).

The relation-writing operations of an implementation (create, move, delete of a relation; creation of a Record that creates relations) evaluate the endpoint, `max` and acyclicity facets for the edge they add and return the same diagnostics in their result. They do not refuse the write: a violation is a warning there too. A `min` is only ever reported by `repo validate`, because a node must exist before its edge can, so refusing creation on an unmet minimum would make the data impossible to author.

This extends what the MCP write tools already do. They enforce the type and relation contracts, so a structurally invalid edge is rejected at the door. Graph shape joins that contract at warning strength, which is a structural defence for agent-authored data: an agent that closes a `precedes` loop is told at the moment it writes, not at the next full validation. It also fits srs-rust#557's planned cycle diagnostics: `relation-cycle` is the cycle half of that issue, driven by the declaration instead of a hard-wired type name. Its fan-out half is a cardinality fact that a definition may declare for its own sequence type; core `precedes` declares none (below). Its duplicate-edge and container-endpoint halves are not graph-shape facets of the kind declared here and are outside this RFC. srs-rust#558 (ordering keyed off the definition, not the `precedes` string) is the same move at read time.

*Consequences.* Authors see graph faults that were silent. A corpus is never rejected for them. The cost is that the standard promises nothing stronger than a warning yet, and an author who ignores warnings keeps a broken chain.

### Change C — Blueprint no longer declares cardinality or presence

`RelationSpec.cardinality` and `RelationSpec.required` are **removed** from `blueprint.json`. `RelationSpec` keeps `relationType`, `sourceType` and `targetType`: what a Blueprint still declares is *which* relations make up the structure, and the relation type named there is the reference to that type's constraints. A reduced form that kept `cardinality` as a reference would only restate `relationType`, which already names the definition, so removal is the single-home answer and "reference" adds nothing.

Removing a property that stored definitions carry is a data-shape change. Blueprints are definitions and definitions reject unknown properties, so every existing Blueprint that sets either property becomes invalid until it is migrated. The migration (Change G) deletes the two properties, reports every value it removes, and does not translate them. They cannot be translated mechanically: a Blueprint value is scoped to a pair of Types inside one structure ("a `decision` has exactly one `outcome`"), while a relation type's cardinality is global to the type.

*Consequences.* One home for multiplicity. An author who needs a pair-scoped rule now defines a dedicated, namespaced relation type with endpoint restrictions and a cardinality, and the Blueprint names it. That is more definitions and is an accepted cost (see the emergence note above). `required` ("this relation must be present for the Blueprint to be complete") has no direct successor: its closest form is a `min` on a dedicated relation type. A Blueprint that wants presence-completeness checks has to say it through such a type. The generative consumers that read these properties today (brief and schema generation) lose the hint; that is a follow-on for the implementation, not a change to the standard.

### Change D — Core defaults: `precedes` and `contains` are acyclic

The core package's `precedes` and `contains` definitions each gain `acyclic: true` as definition version 2 (same `id`, `version` 1 to 2; the core package's own version moves 1.0.0 to 1.1.0). They gain nothing else.

Only what is genuinely global is declared:
- **`precedes` acyclic.** A sequence that loops has no order. The cycle is a defect in any corpus.
- **`contains` acyclic.** Part-of with a cycle makes a thing its own ancestor, and navigation and tree walks already have to prune it.

Everything else is deliberately not declared:
- **No cardinality on core `contains`.** Single parent is RFC-042's choice for the spec's concept tree: a leaf has exactly one `contains` parent, which is a concept, and a concept has at most one. It is not a global rule. RFC-034 refuses single parent for Containers, and `rfc-decision-8aed3412` and `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge, because a relation is a global claim and a shared part legitimately sits in several places. In practice, no corpus I surveyed has a `contains` target with two parents (567 edges in `srs/srs`, 191 in srs-programme, 626 in muSrs), but that is practice, and practice is not law.
- **No cardinality on core `precedes`.** Chains branch. `srs/srs` has one `precedes` source with two outgoing edges and muSrs has one target with two incoming ones, so a linked-list rule would flag real data.
- **`depends-on` is not acyclic.** srs#608 measured three irreducible 2-cycles in the concept graph of `srs/srs`, and muSrs has a fourth. Declaring `depends-on` acyclic would make intended data invalid and would be one repository's rule leaking into the standard.

A repository that wants a stricter rule for its own types declares it on its own relation type. There is no overlay and no inheritance of core relation types (ruling 5): a repository cannot add facets to core `contains`, and the spec package manages its own choice with its own relation type or the authoring-guide rule (srs#818 / #819). Relation inheritance, by analogy to `ext:type-inheritance`, is a named future RFC and is not designed here.

Which definition governs a key is still decided by RFC-005 Change B and this RFC does not change that. A package that carries its own copy of `precedes` has its own definition and receives no inherited facet. The surveyed corpora carry local `precedes` copies in one place that matters: muSrs defines its own (`com.mudemocracy`). The governance package carries one in each of its 4 releases under `packages/`, and the gallery example carries one. None declares `acyclic`. They keep resolving as before and add the facet by publishing a new version of their own definition (Open Question 1).

*Consequences.* A cycle in any `precedes` or `contains` graph that resolves to the core definition now produces a warning. None exists in the corpora measured (below). The core package gains a version; every implementation embedding the core package must carry version 2.

### Change E — Path to errors

Version 2 of the constraint surface is a warning contract. This RFC adds no severity property. When the standard wants a facet to fail validation, that is a standing-contract change under axis 5–11: a later RFC introduces an explicit enforcement property whose first appearance is in a new definition version, and it takes effect only for a repository whose effective package set carries that version, at a boundary the RFC declares. The candidate boundary is the first full public release, where axis 2–8 is already precommitted to flip to Continuity. The boundary and the property are not designed here (Open Question 3). Until then a corpus that violates a facet is valid.

### Change F — Containers are untouched

I-150 and RFC-034 [R7] already require the `childContainerIds` graph to be acyclic and treat a cycle as a validation error. That declares acyclicity for a graph of Containers, and Containers are not Relation endpoints (a `containerId` never appears as a Relation source or target). This RFC does not touch that invariant, does not change its severity and does not route it through the new facet. If Containers ever become relation endpoints, or the container graph is expressed through a relation type, I-150 could be restated as `acyclic` on that type; that unification is noted, not proposed.

### Change G — Revision and migration

The additive half needs no bump. Adding optional properties to `relation-type.json` changes no stored instance or relation, so there is nothing to migrate. An older binary that meets a definition with the new properties rejects it as an unknown property (the definition layer is reject-unknown), which is a loud refusal and not a silent drop, so nothing is lost or rewritten behind the owner's back. The version it needs is the release that implements this RFC; its embedded core package carries version 2.

The Blueprint half does need a bump. Removing `cardinality` and `required` is a change to the shape of stored definitions that existing corpora carry, and RFC-033 defines `dataModelRevision` as exactly the migration generation for such deltas: a newer corpus is refused by an older binary and never silently downgraded. Changes C and A therefore ship together under one `dataModelRevision` bump, **the next unassigned revision** after the highest accepted one when this RFC lands (10 if RFC-046's revision 9 has landed first). One registry migration deletes the two Blueprint properties, lists every removed value by Blueprint and `RelationSpec`, and stamps the new revision. Per `rfc-decision-628cf6c4` it is a registered migration, not an edit.

---

## Conformance Rules

> **[R1]** `RelationTypeDefinition` MAY declare `sourceTypeIds` and `targetTypeIds`, each a list of Type UUIDs. When present, a relation of that type MUST have, at that end, a Record bound to a Type whose `typeId` is in the list, matched on `typeId` regardless of `typeVersion`.
>
> **[R2]** A Note MUST NOT satisfy a non-empty `sourceTypeIds` or `targetTypeIds`. An empty list, or an absent property, MUST impose no restriction.
>
> **[R3]** `RelationTypeDefinition` MAY declare `cardinality` with optional `perSource` and `perTarget` sides, each with optional integer `min` (at least 0) and `max` (at least 1). An absent `max` MUST mean unbounded and an absent `min` MUST mean 0. `perSource` MUST count the relations of that type leaving one source instance and `perTarget` the relations arriving at one target instance.
>
> **[R4]** An instance with more relations than a declared `max` MUST be reported once per instance and side. An instance in the population with fewer relations than a declared `min` MUST be reported once per instance and side. An instance with zero relations MUST NOT be reported for a `max`.
>
> **[R5]** A definition MUST be reported as `relation-type-constraint-invalid` (error) when: `min` exceeds `max`; a `perSource.min` is declared without `sourceTypeIds`, or a `perTarget.min` without `targetTypeIds`; a listed Type UUID does not resolve in the effective package set; or a facet property has the wrong kind.
>
> **[R6]** `RelationTypeDefinition` MAY declare `acyclic: true`. When true, the directed graph formed only by relations of that type, source to target as stored, MUST contain no cycle of two or more edges, and an implementation MUST report each strongly connected component once as `relation-cycle`. Cycles mixing relation types MUST NOT be reported under this facet.
>
> **[R7]** A violation of [R1], [R4] or [R6] MUST be reported with severity `warning`, with the stable code `relation-endpoint-type`, `relation-cardinality-exceeded`, `relation-cardinality-unmet` or `relation-cycle` respectively, the relation type key, the instance ids and, where an edge is at fault, the relation ids. An implementation MUST NOT report these at a higher severity, and MUST NOT refuse to load or write a corpus because of them.
>
> **[R8]** The operations that add a relation MUST evaluate [R1], the `max` of [R4] and [R6] for the added edge and MUST return the diagnostics in their result without refusing the write. A `min` MUST be reported by `repo validate` only.
>
> **[R9]** Where a definition declares both `irreflexive` and `acyclic`, a self-loop MUST be reported by E3 only and MUST NOT also be reported as `relation-cycle`. `irreflexive` and `requireSameType` MUST retain their present meaning and severity.
>
> **[R10]** Enforcement of [R1] to [R9] MUST be implemented once in the repository core service and exposed identically through the CLI, the WASM binding and the MCP write tools. An adapter MUST NOT add, relax or reinterpret a constraint.
>
> **[R11]** The core package's `precedes` and `contains` definitions MUST each be published as version 2 (same `id`) declaring `acyclic: true` and no other facet. The core package's `depends-on` definition MUST NOT declare `acyclic`. No core definition MUST declare `cardinality`.
>
> **[R12]** A repository's own definition of a relation type key MUST NOT inherit a facet from a core definition of the same key; the definition RFC-005 Change B resolves for a key is the only definition whose facets apply.
>
> **[R13]** `RelationSpec` in a Blueprint MUST NOT carry `cardinality` or `required`. The migration MUST delete both from every stored Blueprint, MUST list each removed value, and MUST stamp the new `dataModelRevision`.
>
> **[R14]** Promotion of any facet to error severity MUST be made by a later RFC that introduces an explicit enforcement property, first appearing in a new definition version, and effective only for a repository whose effective package set carries that version. No implementation MUST raise severity on its own.
>
> **[R15]** The addition of the four new properties to `relation-type.json` MUST be accompanied by a conformance fixture that fails when any of [R1], [R3], [R6] or [R7] is not implemented identically by the CLI, MCP and WASM paths.

Each rule is testable: [R1] to [R6] and [R9] by a fixture with one violating edge each; [R7] and [R8] by reading the diagnostic and checking the write succeeded; [R10] and [R15] by the three-path fixture; [R11] to [R13] by inspecting the shipped definitions and migrated Blueprints; [R12] by a fixture with a local copy; [R14] by inspection of any later RFC.

---

## Schema changes

| Schema file | Change |
|---|---|
| `relation-type.json` | add optional `sourceTypeIds`, `targetTypeIds` (arrays of UUID), `cardinality` (`perSource` / `perTarget`, each `min` / `max`) and `acyclic` (boolean); update the `requireSameType` description, whose text still says `allowedSourceTypes` / `allowedTargetTypes` were "retired with no successor". |
| `blueprint.json` | remove `cardinality` and `required` from `$defs/RelationSpec`; update its description. |
| `package/core/relation-types/precedes.json`, `contains.json` | these are package data, not schema: version 2 with `acyclic: true`; `package/core/package.json` version 1.1.0. |
| `package/metamodel/**` | generated from the schemas by `scripts/gen-metamodel-package.mjs`, not hand-edited: the relation-type Type gains the new fields and the `relation_spec_cardinality` Field and its `required` counterpart leave the Blueprint RelationSpec Type. |
| `manifest.json`, `protocol.json` and all other schemas | None. (`protocol.json` mentions Blueprint by reference only.) |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

---

## What breaks

**Instance data: nothing.** All four instance-level facets report at warning strength and are absent from every existing definition except the two core ones. Measured with a read-only pass over `relations/` in five repositories:

| Repository | `precedes` edges | `contains` edges | `precedes` or `contains` cycles (incl. self-loops) | `contains` targets with 2+ parents |
|---|---|---|---|---|
| `srs/srs` | 263 | 567 | 0 | 0 |
| srs-programme | 32 | 191 | 0 | 0 |
| muSrs | 224 | 626 | 0 | 0 |
| srs-context | 0 | 0 | 0 | 0 |
| semanticops.com source | 0 | 0 | 0 | 0 |
| **Total** | **519** | **1,384** | **0** | **0** |

So declaring the two core defaults produces 0 warnings across 1,903 edges. For the record: `depends-on` has 4 two-cycles across these corpora (3 in `srs/srs`, 1 in muSrs) and would have produced 4 warnings, which is the evidence against declaring it acyclic. Branching `precedes` occurs twice (one source with two outgoing edges in `srs/srs`, one target with two incoming in muSrs).

**Blueprints: 7 live files and 42 `RelationSpec`s are invalid until migrated.** srs-programme has 1 Blueprint (3 `RelationSpec`s, all 3 with `cardinality` and `required`). muSrs has 6 Blueprint files (39 `RelationSpec`s, all 39 with `cardinality`, 22 with `required`); some may be copies of one another across its `packages/` directory, which I did not de-duplicate. In this repository, the `com.mudemocracy.governance` package ships 4 releases (1.0.0, 1.1.0, 1.2.0, 1.2.1) each carrying the decision-log Blueprint, plus 1 gallery example, all with both properties (10 `RelationSpec`s in total). The `srs/srs`, srs-context and semanticops.com repositories have no Blueprint. The migration deletes the properties mechanically; the 42 values are listed and not carried over.

**Pinned binaries.** A binary from before this RFC's implementation refuses a migrated corpus as newer ([R13]). A repository that writes the new facets into its own package, with no corpus migration, is refused only at that definition and loudly. Every currently pinned build predates this RFC; the cost is the usual one implementation release and one pin advance per client. `rfc-decision-2e0cd70a`'s carry-what-you-do-not-recognise contract covers instance data and does not cover definitions, which stay reject-unknown.

**Migrations needed:** the one Blueprint migration above. No relation, record or container is rewritten.

---

## Rationale

**Why the relation type is the home.** A relation's shape is a property of what the relation means, and a relation is a global claim about its endpoints (`rfc-decision-8aed3412`). A constraint that varies by document belongs to the document's selection or structure, not to the claim. Putting shape on the relation type means one place, travelling with the definition that already travels in packages.

**Why exactly three facets.** They are the ones with a demonstrated consumer: acyclicity (srs-rust#557, #558), cardinality (the RFC-005-deferred facet and the Blueprint vocabulary), and endpoint types (the retired `allowedSourceTypes` / `allowedTargetTypes`, no successor). Each is checkable from the edges and Types alone, without a query language.

**Why LINEAGE type references.** A relation constraint should keep holding when a Type gains a version. Pinning would make every Type version bump an edit to every relation type that names it, with violations in between. This follows `rfc-decision-c8704763`: strength is declared where the reference is defined, and a constraint on identity is lineage.

**Why warnings, and why no severity property now.** A standing corpus must not become invalid on upgrade (axis 5–11). A severity property would be a second knob that every author has to choose before there is evidence for the right default; the honest path to errors is a later, explicit definition version at a declared boundary ([R14]).

**Why min needs a population.** "At least one edge" has to be asked of something. Naming the population through the endpoint restriction keeps the rule checkable and stops it from meaning "every instance in the repository".

**Why remove, not reference, the Blueprint properties.** A `relationType` already names the definition; a "reference" to its constraints would restate it. Keeping the inert properties would leave two multiplicity vocabularies, one enforced and one not. The cost is that pair-scoped rules need a dedicated relation type.

---

## Not In Scope

- **Symmetry, transitivity, inverse (as an enforceable property) and uniqueness-within-scope.** Each is deferred. `inverseType` stays a display key. The duplicate-edge diagnostic of srs-rust#557 is a uniqueness fact and is not delivered here.
- **Overlay or refinement of core relation types, and relation inheritance.** Named as a future RFC (the relational analogue of `ext:type-inheritance`). Not designed here.
- **A severity or enforcement property, and any error-level violation.** Path only ([R14]).
- **A single-parent rule on core `contains`.** An authoring-guide rule for the spec's concept tree (srs#818 / #819).
- **The naming grammar `pattern` on Field `name` / `namespace`.** srs#236, separate from these three facets.
- **The version-bump half of `mechanism-b3c293f9`.** Not mechanisable; an authoring rule.
- **Constraints across relation types** (a cycle mixing `precedes` and `depends-on`) and **Container graphs** (I-150 stands as it is).
- **srs-rust implementation detail.** Beyond the layering statement of [R10], how the core service computes cycles and counts is not part of the standard.

---

## Alternatives Considered

### Alt A — Constraints on the Blueprint

Keep `RelationSpec.cardinality` and `required`, and make validation read them. Rejected (ruling 1): a Blueprint is a per-structure template, so the constraint would be contextual to a document while the relation is a global claim, and the relation type would still need its own home for the cases with no Blueprint. Two homes for one goal.

### Alt B — Constraints on `Type.validationRules`

Rejected. Rules there are intra-record by construction (`rfc-decision-c20fcff8` notes this) and cannot see another record's edges. It would be a third home.

### Alt C — Overlay or refinement of core relation types; relation inheritance

Let a repository add facets to core `contains` or `precedes`, or have a relation type extend another. Deferred, not adopted (ruling 5). It needs a conflict rule between base and overlay, a new reference strength, and a story for how overlays travel. The need is not demonstrated: the spec package can declare its own relation type or keep the authoring-guide rule. The future RFC is recorded as a named deferral.

### Alt D — Single-parent as a global `contains` rule

Rejected (ruling 4). RFC-034 refuses it for Containers, and `rfc-decision-8aed3412` / `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge. Measured practice (0 multi-parent targets in 1,384 edges) is not a law.

### Alt E — Errors first

Rejected (ruling 3). It would make any existing violation an invalid corpus on upgrade and put a binary-version cost on every corpus. Warnings are the standing-contract-preserving step; errors come by a declared boundary ([R14]).

### Alt F — Keep Blueprint `required` and drop only `cardinality`

Rejected. `required` is the one property with no successor in the relation type, so keeping it would leave exactly the second home this RFC removes. The cost of dropping it (a dedicated relation type with a `min`) is stated in Change C.

### Alt G — Declare `depends-on` acyclic

Rejected. srs#608 shows 3 irreducible 2-cycles in the concept graph, and muSrs has a fourth. It would make intended data invalid and put a one-repository rule into the standard.

---

## Open Questions

1. **How a core version 2 coexists with packages that carry their own copy of a core key.** RFC-005 Change B says two definitions with the same key that differ in `id`, `version` or content are an installation conflict. Yet the corpora already hold such copies: muSrs defines its own `precedes` (`com.mudemocracy`), and each governance package release carries one with a different `id` from the core one. I could not confirm from the specification alone how the shipped implementation resolves these, and the answer decides whether those copies are conflicts, shadow the core definition, or are ignored. *Options:* (a) leave RFC-005 as is and let each such package publish its own `acyclic` version, as written in [R12]; (b) amend RFC-005 so a higher version of the same `id` supersedes a lower one; (c) have the implementation treat a local copy of a core key as the core definition. *Recommendation:* (a) for this RFC, plus a confirmation from the implementation of what happens today, so that the muSrs and governance copies are not left silently ungoverned.
2. **Do Blueprint and relation-type changes ship under one revision or two?** They are written as one bump (Change G). *Options:* one bump covering both, or the additive facets first with no bump and the Blueprint removal in a second RFC. *Recommendation:* one bump. The additive half needs none, and splitting leaves the inert Blueprint vocabulary for another release.
3. **What boundary, if any, promotes a facet to error, and does the first public release count?** *Options:* the first full public release (the axis 2–8 precommitted flip); a named `dataModelRevision`; per-package opt-in only. *Recommendation:* per-package opt-in first, since it needs no repository-wide boundary and fits [R14]. The public-release flip is the natural point to revisit the default.
4. **Collapse `irreflexive` into `acyclic`?** They overlap on a self-loop and differ in strength (E3 error versus new warning). *Options:* keep both ([R9]); retire `irreflexive` as a successor-version migration of all 15 definitions in `srs/srs` and the 34 in muSrs. *Recommendation:* keep both. Retiring it would turn a standing error into a warning, which contradicts axis 5–11.
5. **Do endpoint restrictions follow `ext:type-inheritance`?** As written, a Record of a subtype does not satisfy a restriction naming its parent. *Options:* exact `typeId` only; also accept subtypes. *Recommendation:* exact `typeId` only for now, since inheritance resolution would add a second reference-resolution rule; revisit with the relation-inheritance RFC.
6. **Should a Blueprint's `required` have a successor outside the relation type?** Change C leaves a Blueprint with no way to say a relation is required for completeness other than a dedicated relation type with a `min`. *Options:* accept that; or later add a completeness check on the Blueprint itself. *Recommendation:* accept it now; a Blueprint-level check would be a new RFC with its own justification.
