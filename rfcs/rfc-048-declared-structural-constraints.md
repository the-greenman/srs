> **GitHub issue**: [the-greenman/srs#820](https://github.com/the-greenman/srs/issues/820)

# RFC-048: Declared structural constraints on relation types

**Status**: Draft (Revision 3)
**Affects**: `RelationTypeDefinition` (three new constraint facets); `Blueprint` `RelationSpec` (`cardinality` and `required` removed); the core package's `precedes` and `contains` definitions (new definition version); `repo validate` and the relation-writing operations of conforming implementations (new warning diagnostics); `dataModelRevision` (one bump, covering both halves); `docs/schema/2.0/relation-type.json`, `docs/schema/2.0/blueprint.json`. Builds on **RFC-005 (Accepted)** (installed relation types, the effective package set), **RFC-029 (Accepted)** (the implicit core package), **RFC-033 (Accepted)** (`dataModelRevision`), **RFC-034 (Accepted)** (Containers; `childContainerIds` acyclic) and **RFC-042 (Accepted)** (the concept tree). Context only: RFC-038, RFC-043.
**Amends (Door 3, same PR, each Accepted RFC takes a revision bump and a history row):**
- **RFC-005 Change A** ("What is NOT added to the core shape", and "All seven are `many-to-many` cardinality (not enforced at core)"): cardinality, endpoint-type and acyclicity facets are now declarable on a definition; core `precedes` and `contains` gain `acyclic`.
- **RFC-005 Change B** is not changed but **restored and executed**: it already says one definition governs a key. This RFC reaffirms it for core keys (the core definition governs; a local copy is a reference copy, ruling 8) and sets the severity of a non-identical local copy for the warnings-first period (`relation-type-core-key-shadow`, warning). Door note: this restates an Accepted rule and adds a diagnostic; the diagnostic is the Door 2 content, the restatement is Door 1 against ruling 8.
- **RFC-009** (`blueprint.json` schema-changes row): `RelationSpec` loses `cardinality` and `required`.
- **RFC-029**: the embedded core package is authoritative for its relation-type keys (it already forbids the implicit merge from becoming "a silent shadowing mechanism"); its relation-type contents become version 2 for `precedes` and `contains`, and the package version moves 1.0.0 to 1.1.0.
- *Non-normative note:* srs-rust ADR-025's amendment for srs-rust#685 (a repository's own definition of a core key wins) is superseded by ruling 8. That is an implementation follow-up, not spec text.
- **RFC-021** was checked and defines no `RelationSpec` cardinality or `required`; it is not amended.

**Author**: design dialogue draft (owner rulings 2026-10-07 on the-greenman/srs#820)
**Date**: 2026-10-07

---

## Revision history

The seven owner rulings of 2026-10-07, numbered for citation:
1. The relation type definition holds the constraints; Blueprint does not.
2. Exactly three facets: endpoint-type restriction, cardinality, acyclicity. Symmetry, transitivity, inverse and uniqueness-within-scope are deferred.
3. Violations are warnings first; a path to errors only at a declared boundary, via a new definition version.
4. Core defaults only for what is genuinely global: `precedes` and `contains` acyclic. No cardinality on core `contains`. `depends-on` is not acyclic.
5. No overlay or refinement of core relation types and no relation inheritance now; relational inheritance is a named future RFC.
6. The `contains` single-parent rule is relocated to the authoring guide (srs#818 / #819) and is not held here; the held-rules table is rewritten accordingly.
7. Enforcement lives once in the core service (`capability-layering.md`) behind CLI, WASM and MCP; the RFC carries no implementation detail beyond that.
8. (2026-10-08) "Option C. This was the design. A repo copy can legitimately have a local definition of a core type — but this is just for reference." The embedded core definition is authoritative for every core key; a local definition of a core key is a reference copy and never governs resolution or validation. This is RFC-005 Change B's one-definition-per-key rule restored, not an overlay (ruling 5 stands).

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-07 | Initial draft applying rulings 1 to 7. |
| 2 | 2026-10-07 | Review round 1 (8 blocking, 11 should-fix). **B1** counting sentence in [R3]. **B2** `min` population stated in [R3]/[R4]. **B3** diagnostic payload table with sort keys; [R15] names the fields. **B4** self-loop gap closed: `acyclic` reports self-loops unless `irreflexive` is also declared ([R6], [R9]). **B5** exact write-time evaluation ([R8]). **B6** the actual resolution rule, read from the shipped merge, stated in Change D and [R12]: a repository's own definition of a key always wins, so local copies of `precedes` are ungoverned by core version 2; the by-key alternative is Open Question 1. **B7** the Amends list. **B8** embedding, the revision gate in the same release, a testable revision rule, and the unmigrated-corpus behaviour; one bump (old Open Question 2 closed). **S1** to **S11** applied as noted in the text; declined: RFC-021 amendment (nothing to amend). |
| 3 | 2026-10-08 | Owner ruling 8 applied. Change D and [R12] rewritten: the core definition governs every core key, a local copy is a reference copy; a non-identical copy draws the new warning `relation-type-core-key-shadow`. The Revision 2 fork (core facets by winning definition or by key) is **resolved by ruling 8** and removed from Open Questions: both options dissolve, because each core key has one governing definition. Consequence restated (core version 2 reaches every repository at once, 0 new cycle warnings; 8 distinct non-identical copies in 28 files draw the shadow warning until migrated; the governance `derived-from` / `evidences` self-loop gap closes). Amends list: RFC-005 Change B restored rather than amended; ADR-025 note. Migration may remove matching copies; governance needs a 1.3.0 release. [R15] fixtures replaced. Alt L (local wins) and Alt M (by-key overlay) added. Open Questions renumbered: only the path to errors remains an owner fork. |

---

## Charter alignment

**Cell(s):** cell:conformance, cell:containment, cell:reference, cell:assertion, cell:governance, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Conformance: one way over many** (`rfc-decision-cce3c00e`). Primary cell. Aligned: graph shape gets one declaring home, the relation type, and the inert Blueprint vocabulary is collapsed onto it rather than kept beside it.
- **Containment: declaration over location** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned: `contains` is declared acyclic as data on its definition. Single-parent is deliberately not declared on the core `contains` (see the consequence map).
- **Reference: declared strength over convenient reach** (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`). Aligned: an endpoint restriction names a Type by a declared reference strength (LINEAGE, a bare `typeId`), not by an unresolved string.
- **Assertion: statement over side-effect** (`rfc-decision-cce3c00e`). Aligned: a violating relation is reported, never altered, dropped or silently repaired.
- **Governance: migration over drift** (`rfc-decision-cce3c00e`, `rfc-decision-628cf6c4`). Aligned: removing two Blueprint properties is a registered migration, and one revision stamp covers both halves of this RFC (Change G).
- **Portability: preserve over recognize** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned: constraints are properties of the definition and travel with the package that carries it.

**Axis preference:**
- **5–11 Succession↔Conformance: Reliability over Renewal**, default pole taken. The boundary clause reads *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* Warnings-first is the clause applied: no previously valid corpus becomes invalid. Errors arrive only by an explicit later definition version at a declared boundary ([R14]).
- **2–8 Identity↔Assertion: Evolution over Continuity**, default pole taken. Its phase-bound boundary clause (*precommitted to flip to Continuity at the first full public release*) is the one boundary this RFC names as a candidate for the error path, and does not decide (Open Question 1).
- **3–9 Description↔Governance: Shared Coherence over Local Autonomy**, default pole taken for the two core defaults, and bounded by the same axis's explicit-local boundary for everything else: a rule one repository chose stays that repository's rule (ruling 4).
- **1–7 Versioning↔Reference: Semantic Integrity over Practical Expression**, default pole taken (typed endpoint references).
- **6–12 Containment↔Portability: Portability over Possession**, default pole taken.

**Decisions consulted:** `rfc-decision-a8dcbfe5` (RFC-003: core identical by id and version), `rfc-decision-c20fcff8` (level test), `rfc-decision-1e7c0c8e` (a generic tool defines what is possible), `rfc-decision-cce3c00e` (grid; one way over many), `rfc-decision-9ee14517` (layer rules), `rfc-decision-0118e938` (one layer per construct), `rfc-decision-7caca3a1` (decision modes), `rfc-decision-e99a9437` (doors), `rfc-decision-8aed3412` (reusable parts; relations are global claims), `rfc-decision-0df19d60` (context order on the Container), `rfc-decision-0750c62f` (a Container is a declared selection), `rfc-decision-628cf6c4` (a rename is a migration), `rfc-decision-5f8204bc` (retirement has one way per layer), `rfc-decision-43249f53` (one state mechanism; the rejected two-tier boundary), `rfc-decision-c8704763` (the Reference taxonomy), `rfc-decision-2e0cd70a` (carry meaning you do not recognise), `rfc-decision-4431046e` (how a decision record changes).

**Contradictions found:** None overridden. Three tensions are named and resolved inside existing rulings.
- `rfc-decision-5f8204bc` says relation type definitions are SUBSTRATE ENTRIES that retire by status because instance data addresses them by string key and cannot pin a version. A "new definition version" of core `precedes` (Change D) is therefore a new version of a definition that no relation pins. That is consistent: nothing pins version 1, so version 2 reaches every relation whose key resolves to the core definition (not those resolving to a repository's own copy, Change D). It is also why the safety of the change rests on warnings, not on pinning ([R14]).
- `rfc-decision-43249f53` rejected a two-tier boundary as a drift seam. This RFC keeps `irreflexive` beside the new `acyclic`. They overlap on exactly one case, a self-loop, and the overlap is named and given one resolution ([R9]); the severity difference (an existing error versus a new warning) is the reason they are not collapsed. Whether to collapse them anyway is Open Question 2.
- The shipped implementation lets a repository's own definition of a core key win, silently (srs-rust PR #738, recorded only as an ADR-025 amendment, ratified by no decision). That contradicts RFC-005 Change B, RFC-029 ("not a silent shadowing mechanism") and `rfc-decision-a8dcbfe5` (RFC-003 assumes core is identical by id and version in every implementation). Ruling 8 settles it for the standard: core governs; the implementation drift is a follow-up, not a supersession of any decision.
- `rfc-decision-8aed3412` and `rfc-decision-0df19d60` refuse context carried on an edge and refuse to let a shared record take one parent from an edge. Declaring single-parent on core `contains` would do exactly that, so it is not declared. This is a reason in the RFC, not a contradiction.

**One-way-per-goal:** The goal is "declare the shape of the relation graph". Four things touch it today:
- **`RelationTypeDefinition.irreflexive` and `requireSameType`** declare a self-loop ban and a same-Type requirement. They stay, and the three new facets sit beside them on the same object. One home: the relation type. This is where `rfc-decision-43249f53`'s objection to a two-tier boundary bites: `irreflexive` and the new `acyclic` overlap on exactly one case, a self-loop. The overlap is named and resolved once ([R9]: `irreflexive` alone reports it when both are declared) and they are kept apart because their strength differs (an existing error versus a new warning); collapsing them is a reversible adopted choice (Open Question 2).
- **Blueprint `RelationSpec.cardinality` and `required`** declare cardinality and presence. They are inert (no validation reads them). This RFC **collapses them onto the relation type** and removes them (Change C). Without that, two vocabularies would declare multiplicity.
- **`Type.validationRules`** is intra-record only and is not a mechanism for this goal (Alternatives, Alt B).
- **Invariants I-150 / RFC-034 [R7]** declare acyclicity of the `childContainerIds` graph. That is a different graph (Containers, which are not relation endpoints). It is untouched, and the possible future unification is noted in Change F, not decided.
- **Which definition a core key resolves to** has one answer: the core definition shipped with the implementation (ruling 8, RFC-005 Change B). A local copy is a reference copy, never a second governing definition, so there is one governing definition per key and the core facets have one place to live.
- The retired `allowedSourceTypes` / `allowedTargetTypes` had no successor; the endpoint facet is that successor under new names, not a parallel mechanism.

**Layer test:**
- **Which layer owns this?** MEANING plane, definitions layer: a `RelationTypeDefinition` is a closed-vocabulary declaration at the same stack position as Field and Type. Enforcement binds the OPERATION plane's core service, one implementation behind CLI, WASM and MCP adapters (`srs-rust/docs/architecture/capability-layering.md`); adapters add no semantics.
- **Consume or clone downward?** Consume. An endpoint restriction references a Type through the existing LINEAGE reference form. Nothing restates what a Type is.
- **Does the layer below stand alone without this?** Yes. Instances and relations are valid with every facet absent. A definition declaring no facet constrains nothing, and E1 to E4 still apply unchanged.

**Level test** (`rfc-decision-c20fcff8`): each facet is declarable in a repository's own package data and checkable by `repo validate`, so it belongs in the standard. The rules this replaces fail the test and are re-dispositioned in Motivation.

**Consequence map (complex decision).** The decision touches six cells. The options are the placements of the constraint surface and the severity at which it speaks.

| Option | Conformance (one way over many) | Containment (declaration over location) | Reference (declared strength) | Assertion (statement over side-effect) | Governance (migration over drift) | Portability (preserve over recognize) | Outcome |
|---|---|---|---|---|---|---|---|
| **Chosen. Three facets on the relation type; warnings first; core acyclic defaults only** | One declaring home; Blueprint collapsed onto it. | `contains` acyclic declared; no single-parent rule imposed on every corpus. | Types named by LINEAGE `typeId`. | A violation is a diagnostic; no edge is altered. | Blueprint removal is one registered migration. Core default arrives as a definition version and governs every core key at once (one governing definition per key). | Constraints travel in the definition; local copies are reference copies. | **Chosen** (owner rulings 1 to 4, 8). |
| Local copy of a core key wins (shipped behaviour, srs-rust PR #738) | Two governing definitions per key, chosen by accident of file presence. | n/a | Resolution by key silently swaps meaning. | The swap is a side-effect of a file existing, with no diagnostic. | Drift: coverage shrinks as tools write copies. | Copies travel and silently capture the key. | Rejected (ruling 8). |
| Core facets applied by key on top of a local winner | One rule, two definitions merged. | n/a | A definition gains facets it did not write. | n/a | n/a | n/a | Rejected: an overlay (ruling 5). |
| Constraints on the Blueprint | Second home for graph shape beside the relation type, or the relation type has none. | Constraint is per-document, so a global claim becomes contextual. | Already `ExactTypeRef`. | Same. | No migration, but the inert vocabulary stays inert. | Constraint lives in a document template, not with the relation. | Rejected (ruling 1). |
| Constraints on `Type.validationRules` | A third home, intra-record by construction. | n/a | Cannot see another record. | n/a | n/a | n/a | Rejected. |
| Overlay or refinement of core relation types; relation inheritance | One way becomes two (base plus overlay). | Lets a repository silently re-define `contains`. | Needs a new reference strength. | n/a | Needs conflict resolution between overlay and base. | Overlays do not travel with the base. | Deferred to a named future RFC (ruling 5). |
| Single-parent as a global `contains` rule | Fits "one way". | RFC-034 refuses single-parent for Containers; shared records need several. | n/a | An edge would carry a context-specific fact (`rfc-decision-8aed3412`). | Would invalidate shared-part reuse. | A corpus that reuses parts could not travel in. | Rejected (ruling 4). |
| Errors from the first release | Strongest contract. | n/a | n/a | Breaks standing corpora at once. | Forces a migration for every corpus on upgrade. | An older corpus is refused by a newer reader. | Rejected: axis 5–11 boundary clause (ruling 3). |
| Declare `depends-on` acyclic | Looks tidy. | n/a | n/a | Would call 4 real, intended 2-cycles invalid. | n/a | n/a | Rejected (srs#608). A one-repository rule would leak into the standard. |

Column coherence. Earth (structure is declared, never inferred) holds: shape is stated in the definition and not inferred from a walk. Air (meaning stated once and validated against its statement; conflicts resolve by declared authority, visibly) holds: when data conflicts with the definition, the definition wins by being reported and the data is not edited. Water (connection is explicit and carried) holds: no relation is created, dropped or re-typed. Fire (change preserves what it replaces) holds: the Blueprint properties are removed by migration, and the values removed are named in the migration output.

Emergence. Two effects the single-cell reading would miss. First, `repo validate` becomes a consumer of relation type definitions beyond lookup, which invites a growing constraint language; the guard is the closed list of three facets and the Not In Scope list, so any further facet needs its own RFC. Second, removing pair-scoped cardinality from Blueprint pushes authors who need "an argument has exactly one conclusion" toward a dedicated, namespaced relation type with endpoint restrictions. That proliferation of narrow relation types is a real cost of ruling 1, and it is stated rather than hidden (Consequences of Change C).

This decision yields rulings for the owner, not guard compliance. Rulings 1 to 8 are given (numbered in the revision history); the one owner decision that remains is Open Question 1.

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

srs#820 held several rules as debts. Under the rulings, the two that concern this RFC are re-dispositioned here; the rest are not this RFC's business and are recorded on srs#820 and srs#236.

| Held rule (as filed on srs#820) | Disposition now |
|---|---|
| `contains` has one parent; a leaf's parent is a `concept` (RFC-042 [R2]) | **Not held** (ruling 6). Relocated to the authoring guide (srs#818 / #819). Single parent is RFC-042's choice for the spec's concept tree, not a global rule. This RFC promises nothing about it. |
| `precedes` forms no cycles | **Core, this RFC** (Change D). |

The naming-grammar `pattern` on Field `name` / `namespace` (srs#236) and the version-bump table of `mechanism-b3c293f9` (not mechanisable, an authoring rule) are unrelated to the three facets and stay on srs#820 and srs#236.

---

## Proposed Changes

### Change A — Three facets on `RelationTypeDefinition`

`RelationTypeDefinition` gains four optional properties that together express three facets. A definition that sets none of them constrains nothing, exactly as today.

**Endpoint-type restriction** is two optional lists, `sourceTypeIds` and `targetTypeIds`, each a list of bare Type UUIDs. When a list is present, the instance at that end of every relation of this type must be a Record bound to one of the listed Types. The reference form is LINEAGE (`rfc-decision-c8704763`): it names the Type's identity and matches whatever version a Record is bound to. A Type moving from version 1 to version 2 therefore does not turn existing relations into violations, and no definition needs a new version because a Type did. The match is on the Record's `typeId` only and does not follow `ext:type-inheritance` (Open Question 3). The new names are deliberate: the retired `allowedSourceTypes` / `allowedTargetTypes` held strings of a retired kind, and reusing a retired name for a different shape would break `rfc-decision-628cf6c4`. The facet composes with the existing `requireSameType`: all declared conditions must hold.

Edge cases. A Note has no Type, so it satisfies no non-empty list; core declares no restriction, so this bites only a custom type. Graduating a Note to a Record can therefore change the outcome of the next validation, in either direction. A Record whose `typeId` no longer resolves is reported by the existing Type-resolution check and is not also reported as `relation-endpoint-type`. An endpoint instance id that does not resolve, or that is a `containerId`, is left to the existing relation checks (E1, E2) and is not also reported as `relation-endpoint-type`.

**Cardinality** is one optional object, `cardinality`, with two optional sides, `perSource` and `perTarget`. Each side holds an optional `min` and an optional `max`. `perSource` bounds how many relations of this type may leave one source instance; `perTarget` bounds how many may arrive at one target instance. An absent `max` is unbounded and an absent `min` is 0. This replaces the four-valued `one-to-many` style enum, which cannot say "at most 3" or "at least 1".

Counting is deliberately plain. Every relation of the type whose both endpoints resolve counts toward the instance at its source (for `perSource`) or target (for `perTarget`), whether or not it also passes the endpoint restriction (a failing edge is reported separately and still counts). Two relations with the same source and target are two relations and count twice; uniqueness is Not In Scope. A Note or any other instance counts like a Record for `max`.

A `max` is violated by an instance with more relations than allowed; an instance with zero relations never violates a `max`. A `min` is violated by a member of the *population* with too few relations, and a zero-relation member is exactly the case it catches. The population is every Record in the loaded repository whose `typeId` is in the corresponding list, whatever its lifecycle state: an archived Record that matches is still counted, which is the price of a rule an implementation can check without reading lifecycle definitions. A `min` is therefore only meaningful where an endpoint restriction names that side (`perSource.min` needs `sourceTypeIds`, `perTarget.min` needs `targetTypeIds`), and a definition setting one without it is malformed ([R5]). Without a population, "every instance in the repository" would have to carry the edge.

**Acyclicity** is one optional boolean, `acyclic`. When true, the directed graph formed by the relations of this relation type alone, read source to target as stored, must contain no cycle. A cycle is any closed directed path of one or more relations, so a self-loop is a cycle. Cycles that mix relation types are out of scope. `irreflexive` (E3) rejects self-loops as an error and is unchanged. When a type declares both, a self-loop is reported by E3 only; when it declares `acyclic` without `irreflexive`, a self-loop is reported as `relation-cycle`. The core `precedes` and `contains` declare `irreflexive`, so on them `acyclic` in effect reports cycles of two or more relations. Reporting is one diagnostic per strongly connected component of more than one instance, and one per self-loop where `irreflexive` is absent. A component report names every instance in the component and every relation of the type between them, not one representative cycle.

*Consequences.* A repository can now state "no loops", "at most one", "at least one of these" and "only between these Types" as data and have it checked. It cannot yet state symmetry, transitivity, inverse or uniqueness (Not In Scope). A `min` fixed on the archived population can warn about a Record nobody will relate again; that is accepted and visible rather than silently skipped.

The meaning of the example below is in the prose: `perSource.min: 1` together with `sourceTypeIds` says "every Record of the argument Type has at least one `concludes` relation", and the restriction is what defines which Records that is. The illustration is a fragment of a custom definition with placeholder ids.

```json
{
  "key": "org.example/concludes",
  "acyclic": true,
  "sourceTypeIds": ["00000000-0000-4000-8000-0000000000a1"],
  "targetTypeIds": ["00000000-0000-4000-8000-0000000000c1"],
  "cardinality": { "perSource": { "min": 1, "max": 1 } }
}
```

### Change B — Diagnostics and severity

A violation of any instance-level facet is a **warning** in `repo validate`'s `payload.diagnostics`, never an error and never a refusal to load. The stable codes and the payload every diagnostic carries:

| Code | Severity | Raised when | Payload beyond the common fields |
|---|---|---|---|
| `relation-endpoint-type` | warning | A relation's source or target is not a Record bound to a listed Type. One per relation per failing end. | `end` (`source` or `target`) |
| `relation-cardinality-exceeded` | warning | An instance has more relations than a declared `max`. One per instance and side. | `side`, `limit`, `count` |
| `relation-cardinality-unmet` | warning | A member of the population has fewer relations than a declared `min`. One per instance and side. | `side`, `limit`, `count` |
| `relation-cycle` | warning | A relation type declared `acyclic` has a cycle (Change A). One per component or self-loop. | none |
| `relation-type-constraint-unresolved-type` | warning | A listed Type UUID does not resolve in the effective package set (for example because the Type was later retired). The facet that names it is not evaluated. | `typeId` |
| `relation-type-core-key-shadow` | warning | A local definition of a core key is not identical to the governing core definition ([R12]). One per local definition. | `localId`, `localVersion`, `coreId`, `coreVersion`, `path` |
| `relation-type-constraint-invalid` | error | A definition's new properties are malformed ([R5]). The offending facet is not evaluated; the definition and the corpus still load. | `definitionId`, `reason` |

Common fields on every diagnostic: `code`, `severity`, `relationType` (the definition's key), `instanceIds` (array), `relationIds` (array) and a human-readable `message` that carries no normative content. `instanceIds` and `relationIds` are empty where not applicable (a definition-level code has both empty).

Order is deterministic. Diagnostics sort by `code`, then `relationType`, then by a per-code key: `relationIds[0]` ascending for `relation-endpoint-type`; the instance id ascending, then `side` (`source` before `target`), for the two cardinality codes; the smallest member instance id for `relation-cycle`; `localId` ascending, then `path`, for `relation-type-core-key-shadow`. Inside one diagnostic `instanceIds` and `relationIds` are sorted ascending.

Write-time behaviour is exact. The operations that persist a new relation (relation create, and any operation that creates relations as part of creating a Record) evaluate, for the added relation only: its endpoint restriction; the `max` of each side, counting the relations that already exist plus the new one; and acyclicity, by asking whether the new relation's target already reaches its source over existing relations of the type (or whether source equals target where `irreflexive` is absent). They return the same diagnostics in their result and do not refuse the write. Operations that delete or move a relation or a Record evaluate nothing, because removing an edge can newly break only a `min`, and a `min` is reported by `repo validate` alone: a node must exist before its edge can, so refusing creation on an unmet minimum would make the data impossible to author.

This extends what the MCP write tools already do. They enforce the type and relation contracts, so a structurally invalid edge is rejected at the door. Graph shape joins that contract at warning strength, a structural defence for agent-authored data: an agent that closes a `precedes` loop is told at the moment it writes. It also fits srs-rust#557's planned cycle diagnostics: `relation-cycle` is that issue's cycle half, driven by the declaration instead of a hard-wired type name. Its fan-out half is a cardinality fact a definition may declare for its own sequence type; core `precedes` declares none. Its duplicate-edge and container-endpoint halves are not graph-shape facets of the kind declared here and are outside this RFC. srs-rust#558 (ordering keyed off the definition, not the `precedes` string) is the same move at read time.

*Consequences.* Authors see graph faults that were silent, and a corpus is never rejected for them. The cost is that the standard promises nothing stronger than a warning yet, and an author who ignores warnings keeps a broken chain. The one error, `relation-type-constraint-invalid`, applies only to definitions that declare the new properties, so no existing definition can trigger it. It is an error because definitions are the trust boundary and reject what they cannot interpret (`rfc-decision-2e0cd70a`), but it does not stop the load, and it is exempt from the no-raising rule of [R7]. Some malformed cases (`min` above `max`, a `min` without its population) are validator rules, not JSON Schema rules, because JSON Schema cannot compare two properties of an object.

### Change C — Blueprint no longer declares cardinality or presence

`RelationSpec.cardinality` and `RelationSpec.required` are **removed** from `blueprint.json`, and the `structure` description that says it "declares cardinality and required constraints" is rewritten. `RelationSpec` keeps `relationType`, `sourceType` and `targetType`: what a Blueprint still declares is *which* relations make up the structure, and the relation type named there is the reference to that type's constraints. A reduced form that kept `cardinality` as a reference would only restate `relationType`, so removal is the single-home answer.

Removing a property that stored definitions carry is a data-shape change. Blueprints are definitions and definitions reject unknown properties, so every existing Blueprint that sets either property becomes invalid until it is migrated. The migration (Change G) deletes the two properties, lists every value it removes, and does not translate them. They cannot be translated mechanically: a Blueprint value is scoped to a pair of Types inside one structure ("a `decision` has exactly one `outcome`"), while a relation type's cardinality is global to the type. Keeping the four-value enum on the relation type would make the values translatable in form but not in scope (Alt H).

*Consequences.* One home for multiplicity. An author who needs a pair-scoped rule defines a dedicated, namespaced relation type with endpoint restrictions and a cardinality, and the Blueprint names it. That is more definitions and is an accepted cost (see the emergence note). `required` ("this relation must be present for the Blueprint to be complete") has no direct successor: the closest form is a `min` on a dedicated relation type. The generative consumers that read these properties today (brief and schema generation) lose the hint; that is a follow-on for the implementation, not a change to the standard.

### Change D — Core defaults, and which definition governs

The core package's `precedes` and `contains` definitions each gain `acyclic: true` as definition version 2 (same `id`, `version` 1 to 2; the core package version moves 1.0.0 to 1.1.0). They gain nothing else.

Only what is genuinely global is declared:
- **`precedes` acyclic.** A sequence that loops has no order.
- **`contains` acyclic.** Part-of with a cycle makes a thing its own ancestor, and navigation and tree walks already have to prune it.

Everything else is deliberately not declared:
- **No cardinality on core `contains`.** Single parent is RFC-042's choice for the spec's concept tree: a leaf has exactly one `contains` parent, which is a concept, and a concept at most one. It is not a global rule. RFC-034 refuses single parent for Containers, and `rfc-decision-8aed3412` and `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge, because a relation is a global claim and a shared part legitimately sits in several places. No surveyed corpus has a `contains` target with two parents (Counts), but that is practice, not law.
- **No cardinality on core `precedes`.** Chains branch: the measurements show a branching `precedes` in two repositories.
- **`depends-on` is not acyclic.** srs#608 measured three irreducible 2-cycles in the concept graph of `srs/srs`, and muSrs has a fourth. Declaring it acyclic would make intended data invalid and put one repository's rule into the standard.

A repository that wants a stricter rule for its own types declares it on its own relation type. There is no overlay and no inheritance of core relation types (ruling 5). Relation inheritance, by analogy to `ext:type-inheritance`, is a named future RFC and is not designed here.

**Which definition governs a core key (ruling 8).** The core package is embedded in the implementation, not carried by the corpus (RFC-029). For every key the core package defines, **the governing definition is the core definition shipped with the implementation**. A repository's local definition of a core key is a **reference copy**: it is allowed, and it never governs relation resolution, validation, or any facet. This is RFC-005 Change B's rule (one definition governs a key) restored for core keys, not an overlay: nothing is merged into the local copy, which is simply not consulted. Relations reference relation types by key only (`relationType` is a string), so nothing about a relation changes when the governing definition does.

A local copy of a core key falls into one of two classes:
- **Identical** to the governing core definition (same `id`, `version` and content): a reference copy. No diagnostic.
- **Anything else**: a different `id`, or the same `id` with a different `version` or content, including a stale version-1 copy beside core version 2. A warning, `relation-type-core-key-shadow`, once per local definition; never an error and never a refusal to load. One code covers both cases, rather than an info-level variant for a stale same-id copy, because warnings-first needs one signal and a stale copy is exactly what an author should see.

This corrects the shipped behaviour, which skips the core definition whenever the repository has any definition with the same key (srs-rust PR #738, commit df9a81c1, 2026-07-24, introduced to make 35 failing fixture tests pass, and recorded only as an amendment to ADR-025). ADR-025's own context says conflicts are "detected and rejected loudly", srs-rust#685 asked for the loud rule, RFC-005 Change B was never amended, RFC-029 says the implicit merge must not become "a silent shadowing mechanism", and no decision ratifies the silent rule. The copies predate the core relation types (srs#229, 2026-07-24): the gallery `precedes` dates from 2026-05-31, muSrs's from 2026-06-04, governance 1.0.0 from 2026-06-28. `srs/srs/package/core` is the source of the embedded bundle (same ids, byte-identical bundle), not a copy.

The consequence is stated plainly. **Core version 2's `acyclic` reaches every repository at once**, including muSrs, every governance-seeded repository and srs-web users' repositories, and it produces 0 new cycle warnings today (no `precedes` or `contains` cycle exists in any corpus surveyed). No surveyed copy differs from core in meaning: each has the same category and differs only in `id`, namespace, wording, `inverseType` and sometimes `irreflexive`. Every one of them draws the shadow warning until it is removed or made identical: 8 distinct non-identical definitions in 28 files, listed in What breaks. The governance copies of `derived-from` (36b78f14) and `evidences` (35c7aba2) lack `irreflexive`, so a self-loop on those keys goes unreported in every governance-seeded repository today; under core-authoritative resolution the core definitions govern and that gap closes.

Tools that write reference copies remain legitimate. `srs repo copy` writes the core relation types into its output as local files, and `package install` adds local copies of core relation types. Writing an **identical** copy is class (i) and draws nothing; writing a **non-identical** copy is what produces the warning.

### Change E — Path to errors

Version 2 of the core definitions is a warning contract. This RFC adds no severity property. When the standard wants a facet to fail validation, that is a standing-contract change under axis 5–11: a later RFC introduces an explicit enforcement property whose first appearance is in a new definition version, and it takes effect only for a repository whose effective package set carries that version, at a boundary the RFC declares. The candidate boundary is the first full public release, where axis 2–8 is already precommitted to flip to Continuity. The boundary and the property are not designed here (Open Question 1). Until then a corpus that violates a facet is valid.

### Change F — Containers are untouched

I-150 and RFC-034 [R7] already require the `childContainerIds` graph to be acyclic and treat a cycle as a validation error. That declares acyclicity for a graph of Containers, and Containers are not Relation endpoints (a `containerId` never appears as a Relation source or target). This RFC does not touch that invariant, its severity, or route it through the new facet. If Containers ever become relation endpoints, I-150 could be restated as `acyclic` on a relation type; that unification is noted, not proposed.

### Change G — Revision, embedding and migration

One `dataModelRevision` bump covers both halves. Adding the facets alone would need none: it changes no stored instance or relation. Removing the two Blueprint properties changes the shape of stored definitions, and RFC-033 defines `dataModelRevision` as the migration generation for exactly such a delta. Stamping both halves under one revision keeps a single gate.

Who decides. The revision is a property of the corpus; the embedded core package is a property of the binary. A binary decides at the corpus level, per RFC-033: it refuses a corpus stamped above the revision it supports and never silently downgrades it. A binary from before this RFC embeds core version 1, so it never sees version 2 and its `precedes` stays unconstrained; it does reject a definition that declares `acyclic` or the other new properties as an unknown property, because the relation-type schema and the implementation's definition type are both closed. To make that refusal happen at the corpus level instead of definition by definition, a repository whose package declares any new property MUST carry the new revision ([R13]).

The gate. The revision bump lands in the **same implementation release** that embeds core version 2 and accepts the new properties, following the choreography in `CLAUDE.md`: (1) implementation support lands (supported-revision constant, migration-registry entry, fixture test); (2) the release is cut with the corpus gate green; (3) the spec-side PR merges; (4) one pin advance in each pinned client.

The revision number is a rule, not a literal: it is the revision after the highest revision assigned when this RFC is accepted. At drafting, RFC-046 holds 9 and RFC-043 holds 8.

An unmigrated corpus. A binary supporting the new revision, given a corpus at the prior revision, reports it as needing the registry migration; it does not strip anything silently. Until migrated, every Blueprint that sets a removed property fails definition validation (42 RelationSpecs across 7 live Blueprints today, Counts). One registry migration deletes the two properties, lists every removed value by Blueprint and `RelationSpec`, and stamps the new revision (`rfc-decision-628cf6c4`).

---

## Conformance Rules

> **[R1]** `RelationTypeDefinition` MAY declare `sourceTypeIds` and `targetTypeIds`, each a list of Type UUIDs. When present and non-empty, a relation of that type MUST have, at that end, a Record bound to a Type whose `typeId` is in the list, matched on `typeId` regardless of `typeVersion`. A Note MUST NOT satisfy a non-empty list. An absent or empty list MUST impose no restriction.
>
> **[R2]** A relation whose endpoint does not resolve, is a `containerId`, or is a Record whose `typeId` does not resolve MUST NOT also be reported as `relation-endpoint-type`.
>
> **[R3]** `RelationTypeDefinition` MAY declare `cardinality` with optional `perSource` and `perTarget` sides, each with optional integer `min` (at least 0) and `max` (at least 1); an absent `max` means unbounded and an absent `min` means 0. For an instance, `perSource` MUST count every relation of the type, whose endpoints both resolve, that has the instance as its source, and `perTarget` every such relation that has it as its target, whether or not the relation passes the endpoint restriction. Two relations with the same source and target MUST count as two.
>
> **[R4]** An instance with more relations than a declared `max` MUST be reported once per instance and side. A member of the *population* with fewer relations than a declared `min` MUST be reported once per instance and side, where the population is every Record in the loaded repository whose `typeId` is in the corresponding list (`sourceTypeIds` for `perSource`, `targetTypeIds` for `perTarget`), whatever its lifecycle state. An instance with zero relations MUST NOT be reported for a `max`.
>
> **[R5]** A definition MUST be reported as `relation-type-constraint-invalid` (error) only when it declares one of the new properties and: `min` exceeds `max`; a `perSource.min` is declared without `sourceTypeIds`, or a `perTarget.min` without `targetTypeIds`; or a facet property has the wrong kind. A listed Type UUID that does not resolve in the effective package set MUST be reported as `relation-type-constraint-unresolved-type` (warning), not as an error. Neither report MUST stop the load of the definition or the corpus, and the affected facet MUST NOT be evaluated. A definition that declares none of the new properties MUST NOT be reported under either code.
>
> **[R6]** `RelationTypeDefinition` MAY declare `acyclic: true`. When true, the directed graph formed only by relations of that type, source to target as stored, MUST contain no cycle of one or more relations. A strongly connected component of more than one instance MUST be reported once as `relation-cycle`, naming every instance in it and every relation of the type between them. A self-loop MUST be reported as `relation-cycle` unless the definition also declares `irreflexive: true` ([R9]). Cycles mixing relation types MUST NOT be reported under this facet.
>
> **[R7]** A violation of [R1], [R4] or [R6] MUST be reported with severity `warning` and the code `relation-endpoint-type`, `relation-cardinality-exceeded`, `relation-cardinality-unmet` or `relation-cycle` respectively, carrying the fields and in the order listed in Change B. An implementation MUST NOT report these at a higher severity and MUST NOT refuse to load or write a corpus because of them. The code `relation-type-constraint-invalid` is the one error and is exempt from this rule.
>
> **[R8]** The operations that persist a new relation MUST evaluate, for the added relation only, [R1], the `max` of [R4] counting existing relations plus the new one, and [R6] (by asking whether the target already reaches the source over existing relations of the type), MUST return the resulting diagnostics in their result, and MUST NOT refuse the write because of them. Operations that delete or move a relation or Record MUST NOT evaluate these. A `min` MUST be reported by `repo validate` only.
>
> **[R9]** Where a definition declares both `irreflexive` and `acyclic`, a self-loop MUST be reported by E3 only and MUST NOT also be reported as `relation-cycle`. `irreflexive` and `requireSameType` MUST retain their present meaning and severity.
>
> **[R10]** Enforcement of [R1] to [R9] MUST be implemented once in the repository core service and exposed identically through the CLI, the WASM binding and the MCP write tools. An adapter MUST NOT add, relax or reinterpret a constraint.
>
> **[R11]** The core package's `precedes` and `contains` definitions MUST each be published as version 2 (same `id`) declaring `acyclic: true` and no other new facet. The core `precedes`, `contains` and `depends-on` definitions MUST NOT declare `cardinality`, and `depends-on` MUST NOT declare `acyclic`. An implementation that embeds the core package MUST embed version 2 in the same release that implements this RFC.
>
> **[R12]** For every relation type key that the embedded core package defines, the governing definition MUST be the core definition shipped with the implementation. A local definition of a core key MUST NOT govern relation resolution, validation or any facet. A local definition identical to the governing core definition (same `id`, `version` and content) MUST NOT be reported. Any other local definition of a core key MUST be reported once as `relation-type-core-key-shadow` with severity `warning`, carrying `relationType` (the key), `localId`, `localVersion`, `coreId`, `coreVersion` and `path` (the local file), and MUST NOT stop the load. Two non-core definitions of one key remain an installation conflict (RFC-005 Change B).
>
> **[R13]** `RelationSpec` in a Blueprint MUST NOT carry `cardinality` or `required`. The migration MUST delete both from every stored Blueprint, MUST list each removed value, and MUST stamp the new `dataModelRevision`. A repository whose package declares any new relation-type property MUST carry that revision, and an implementation MUST NOT write such a property into a corpus stamped below it.
>
> **[R14]** Promotion of any facet to error severity MUST be made by a later RFC that introduces an explicit enforcement property, first appearing in a new definition version, and effective only for a repository whose effective package set carries that version. An implementation MUST NOT raise severity on its own.
>
> **[R15]** A conformance fixture MUST fail unless the CLI, MCP and WASM paths return, for each case, the same `code`, `severity`, `relationType`, `instanceIds`, `relationIds` and per-code fields, in the same order. The cases MUST include: one violating edge for each of [R1], [R3], [R4] and [R6]; a self-loop with and without `irreflexive`; a **local copy of `precedes` with a different `id` and no `acyclic`** over a graph containing a cycle, which MUST produce `relation-cycle` (core governs) and `relation-type-core-key-shadow`; an **identical reference copy** of a core definition, which MUST produce no diagnostic; and a **same-`id` version-1 copy beside core version 2**, where core version 2 MUST govern and `relation-type-core-key-shadow` MUST be reported.

Each rule is testable by fixture ([R1] to [R6], [R9], [R15]), by reading the diagnostic and confirming the write succeeded ([R7], [R8]), or by inspecting shipped definitions, migrated Blueprints and later RFCs ([R11] to [R14]).

---

## Schema changes

| Schema file | Change |
|---|---|
| `relation-type.json` | add optional `sourceTypeIds` and `targetTypeIds` (array of strings with `format: uuid`, `minItems` 1, `uniqueItems` true); `cardinality` (object, `additionalProperties` false, with optional `perSource` and `perTarget`, each an object, `additionalProperties` false, with optional integer `min` at least 0 and integer `max` at least 1); `acyclic` (boolean). Update the `requireSameType` description, whose text still says `allowedSourceTypes` / `allowedTargetTypes` were "retired with no successor". The cross-property rules (`min` not above `max`, `min` needs its population) are validator rules, not schema rules. |
| `blueprint.json` | remove `cardinality` and `required` from `$defs/RelationSpec`; rewrite the `RelationSpec` description and the `structure` property description (currently "Declares cardinality and required constraints."). |
| `package/core/relation-types/precedes.json`, `contains.json` | package data, not schema: version 2 with `acyclic: true`; `package/core/package.json` version 1.1.0. The `srs/srs` copies of `precedes` and `contains` are the same files. |
| `package/metamodel/**` | generated from the schemas by `scripts/gen-metamodel-package.mjs`, never hand-edited: the relation-type Type gains the new fields and the Blueprint RelationSpec Type loses its two. |
| `manifest.json`, `protocol.json` and all other schemas | None. |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

The closed definition types in the implementation (the relation-type definition and the Blueprint `RelationSpec`) must follow the same shape change; that sync is a note for the implementation, not specified here.

---

## What breaks

All counts are as of 2026-10-07 and are not part of the normative text. They come from a read-only pass over each repository's `relations/` and Blueprint files: group relations by `relationType`, then, for `precedes`, `contains` and `depends-on`, count edges, self-loops, strongly connected components of more than one instance (Tarjan) and targets with two or more incoming edges; separately, load every JSON file with `rootTypes` and `structure` and count its `RelationSpec`s and which carry `cardinality` or `required`. Blueprint counts are unique by definition `id` and version.

**Instance data: nothing breaks.** Every new instance-level report is a warning and is absent from every existing definition except the two core ones.

| Repository | `precedes` edges | `contains` edges | Cycles incl. self-loops | `contains` targets with 2+ parents |
|---|---|---|---|---|
| `srs/srs` | 263 | 567 | 0 | 0 |
| srs-programme | 32 | 191 | 0 | 0 |
| muSrs | 224 | 626 | 0 | 0 |
| srs-context | 0 | 0 | 0 | 0 |
| semanticops.com source | 0 | 0 | 0 | 0 |
| **Total** | **519** | **1,384** | **0** | **0** |

Declaring the two core defaults produces 0 cycle warnings across 1,903 edges. Core governs every core key (Change D), so this holds for every repository, including those carrying their own copies. `depends-on` has 4 two-cycles (3 in `srs/srs`, 1 in muSrs), which is the evidence against declaring it acyclic. `precedes` branches twice (one source with two outgoing relations in `srs/srs`, one target with two incoming in muSrs).

**Blueprints: 42 RelationSpecs in 7 live Blueprints are invalid until migrated.**

| Repository | Blueprint files | Unique Blueprints | RelationSpecs | With `cardinality` | With `required` |
|---|---|---|---|---|---|
| muSrs | 6 | 6 | 39 | 39 | 22 |
| srs-programme | 1 | 1 | 3 | 3 | 3 |
| `srs/srs`, srs-context, semanticops.com | 0 | 0 | 0 | 0 | 0 |
| **Live total** | **7** | **7** | **42** | **42** | **25** |

Separately, this repository's `com.mudemocracy.governance` package ships the decision-log Blueprint in 4 releases and the gallery example carries it once: 5 files, one unique Blueprint with 2 RelationSpecs, both properties set on both. It shares its id with a Blueprint in muSrs, so it adds no new unique definition to the live total. The migration deletes the properties mechanically; the values are listed and not carried over.

**Local copies of core keys: shadow warnings, no invalidity.** Distinct non-identical definitions of a core key, by key and carrier (same scan, over each carrier's relation-type files; all differ from core in `id` and none in meaning):

| Key and definition | Carried by | Files |
|---|---|---|
| `precedes` 8d18debb | muSrs | 1 |
| `precedes` b24aaf29, `supersedes` 6e86ebd3, `derived-from` 36b78f14, `evidences` 35c7aba2 | `com.mudemocracy.governance` releases 1.0.0 to 1.2.1 (4 files each), the gallery example (1 each) and srs-web (1 each) | 24 |
| `precedes` 66666666, 9a1b0c40, and a same-`id` (f7a8b9c0) non-identical copy | srs-rust test fixtures | 3 |
| **Total: 8 distinct definitions** | | **28** |

Packages seeded from governance (its `.srsj` seeds, srs-gov and srs-web seeds) carry the same four definitions and draw the same warnings once loaded. A registry migration MAY remove local copies whose meaning matches core (every surveyed copy qualifies); removal is safe because relations reference relation types by key. It is not required for validity, since the shadow is a warning. The governance package, which is additive-only, needs a new minor release (1.3.0) that drops its copies.

**Binaries.** A binary from before the implementing release refuses a migrated corpus as newer (Change G). Every currently pinned client predates it; the cost is the usual one implementation release and one pin advance per client. The migrations needed are the one Blueprint migration; no relation, Record or Container is rewritten.

---

## Rationale

**Why the relation type is the home.** A relation's shape is a property of what the relation means, and a relation is a global claim about its endpoints (`rfc-decision-8aed3412`). A constraint that varies by document belongs to the document's selection or structure, not to the claim. Putting shape on the relation type gives one place, travelling with the definition that already travels in packages (ruling 1).

**Why exactly three facets.** They are the ones with a demonstrated consumer: acyclicity (srs-rust#557, #558), cardinality (the RFC-005-deferred facet and the Blueprint vocabulary), and endpoint types (the retired `allowedSourceTypes` / `allowedTargetTypes`, no successor). Each is checkable from the edges and Types alone, without a query language (ruling 2).

**Why LINEAGE type references.** A constraint should keep holding when a Type gains a version. Pinning would make every Type version bump an edit to every relation type naming it, with violations in between. Strength is declared where the reference is defined (`rfc-decision-c8704763`).

**Why warnings, and why no severity property now.** A standing corpus must not become invalid on upgrade (axis 5–11, ruling 3). A severity property would be a second knob every author must set before there is evidence for the right default; the honest path to errors is a later, explicit definition version at a declared boundary ([R14]).

**Why `min` needs a population.** "At least one edge" has to be asked of something. Naming the population through the endpoint restriction keeps the rule checkable.

**Why remove, not reference, the Blueprint properties.** A `relationType` already names the definition; a "reference" to its constraints would restate it. Keeping the inert properties would leave two multiplicity vocabularies, one enforced and one not.

**Why the core definition governs every core key.** One definition per key is RFC-005 Change B's rule and ruling 8 restores it for core keys. Letting a local copy win makes coverage depend on whether some tool happened to write a file, and it shrinks as tools write more copies; applying core's facets on top of a local winner is an overlay. With core authoritative, a copy is only a reference and costs nothing when it is identical.

---

## Not In Scope

- **Symmetry, transitivity, inverse (as an enforceable property) and uniqueness-within-scope.** Each is deferred. `inverseType` stays a display key. The duplicate-edge diagnostic of srs-rust#557 is a uniqueness fact and is not delivered here.
- **Overlay or refinement of core relation types, and relation inheritance.** A named future RFC, the relational analogue of `ext:type-inheritance`. Not designed here.
- **A severity or enforcement property, and any error-level violation.** Path only ([R14]).
- **A single-parent rule on core `contains`.** An authoring-guide rule for the spec's concept tree (srs#818 / #819).
- **The naming grammar `pattern` on Field `name` / `namespace`.** srs#236.
- **The version-bump half of `mechanism-b3c293f9`.** Not mechanisable; an authoring rule.
- **Constraints across relation types** and **Container graphs** (I-150 stands as it is).
- **Implementation detail.** Beyond the layering statement of [R10], how the core service computes cycles and counts is not part of the standard.

---

## Alternatives Considered

### Alt A — Constraints on the Blueprint

Keep `RelationSpec.cardinality` and `required`, and make validation read them. Rejected (ruling 1): a Blueprint is a per-structure template, so the constraint would be contextual to a document while the relation is a global claim, and the relation type would still need its own home for cases with no Blueprint. Two homes for one goal.

### Alt B — Constraints on `Type.validationRules`

Rejected. Rules there are intra-record by construction and cannot see another record's edges. It would be a third home.

### Alt C — Overlay or refinement of core relation types; relation inheritance

Let a repository add facets to core `contains` or `precedes`, or have a relation type extend another. Deferred (ruling 5). It needs a conflict rule between base and overlay, a new reference strength, and a story for how overlays travel. Applying core's facets by key on top of a local winner is the same thing in miniature (Alt M).

### Alt D — Single-parent as a global `contains` rule

Rejected (ruling 4). RFC-034 refuses it for Containers, and `rfc-decision-8aed3412` / `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge. Measured practice (0 multi-parent targets in 1,384 edges) is not a law.

### Alt E — Errors first

Rejected (ruling 3). It would make any existing violation an invalid corpus on upgrade. Errors come by a declared boundary ([R14]).

### Alt F — Keep Blueprint `required` and drop only `cardinality`

Rejected. `required` has no successor in the relation type, so keeping it would leave exactly the second home this RFC removes. The cost of dropping it is stated in Change C.

### Alt G — Declare `depends-on` acyclic

Rejected. srs#608 shows 3 irreducible 2-cycles in the concept graph, and muSrs has a fourth. It would make intended data invalid and put a one-repository rule into the standard.

### Alt H — Keep the existing four-value cardinality enum

Reuse `one-to-one | one-to-many | many-to-one | many-to-many` on the relation type, which would make the 42 Blueprint values translatable in form. Rejected: the enum cannot say "at most 3" or "at least 1", has no population for a minimum, and the Blueprint values are pair-scoped while a type's cardinality is global, so form-level translation would silently widen their scope.

### Alt I — One discriminated `constraints[]` list

A single list of `{kind, ...}` entries instead of four named properties. Rejected for now: it admits a fourth kind without an RFC (against the closed list of three), and a list of discriminated objects is harder for the closed definition schema to validate than named properties with their own shapes.

### Alt J — Pinned or mixed endpoint references

Name the endpoint Types as `ExactTypeRef` (pinned), or allow either form. Rejected: pinned makes every Type version an edit to the definition, and a mixed form is two spellings of one thing (`rfc-decision-628cf6c4`).

### Alt K — A severity property now

Add `enforcement: warning | error` on the definition immediately. Rejected: it hands every author a knob with no evidence for the default and lets a package raise a violation to an error on a repository that did not choose it; the path is [R14].

### Alt L — A local copy of a core key wins (the shipped behaviour)

The implementation skips the core definition whenever a repository defines the key (srs-rust PR #738). Rejected (ruling 8): it is silent drift with no diagnostic; the standard's coverage shrinks as `repo copy` and `package install` write copies; it leaves two governing definitions for one key, contradicting RFC-005 Change B and RFC-029; and today it hides the missing `irreflexive` on the governance `derived-from` and `evidences` copies.

### Alt M — Core facets applied by key on top of a local winner

Keep local-wins but merge core's facets into whichever definition wins. Rejected: it is an overlay (ruling 5) — a definition gains facets it did not write, with a merge rule that nobody declared. Under ruling 8 it is also unnecessary, because the core definition is the one that governs.

---

## Open Questions

1. **Owner decision: the path to errors.** Which boundary promotes a facet to an error and by what mechanism? *Options:* per-package opt-in through an explicit enforcement property (new definition version); a named `dataModelRevision`; the first full public release (the axis 2–8 flip). *Recommendation:* per-package opt-in first, since it needs no repository-wide boundary; revisit the default at the public-release flip. [R14] holds the path and designs nothing.
2. **Adopted in this draft, owner may reverse: keep `irreflexive` beside `acyclic`.** They overlap on a self-loop and differ in strength (E3 error versus new warning). The alternative is to retire `irreflexive`, a migration of every definition that declares it (15 definitions in `srs/srs`'s packages and 34 in muSrs's, counting relation-type definition files), turning a standing error into a warning against axis 5–11. Recommendation: keep both.
3. **Adopted in this draft, owner may reverse: endpoint restrictions match `typeId` exactly and do not follow `ext:type-inheritance`.** The alternative also accepts subtypes, at the cost of a second reference-resolution rule. Recommendation: exact for now; revisit with the relation-inheritance RFC.
4. **Adopted in this draft, owner may reverse: a Blueprint's `required` has no successor outside a dedicated relation type with a `min`.** The alternative is a later completeness check on the Blueprint, which would be its own RFC. Recommendation: accept the gap now.

Resolved: the Revision 2 question "does core's `acyclic` apply by the winning definition or by key?" is resolved by ruling 8 (Revision 3); both options dissolve because each core key has one governing definition, the core one.
