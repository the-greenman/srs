> **GitHub issue**: [the-greenman/srs#820](https://github.com/the-greenman/srs/issues/820)

# RFC-048: Declared structural constraints on relation types

**Status**: Draft (Revision 6)
**Affects**: `RelationTypeDefinition` (three new validity facets: endpoint-type restriction, an upper bound, acyclicity); the core package's `precedes` and `contains` definitions (new definition version); resolution of core relation-type keys (the core definition governs); `repo validate` and the relation-writing operations of conforming implementations (new warning diagnostics); `dataModelRevision` (one bump); `docs/schema/2.0/relation-type.json`. **No change to `blueprint.json` or to Blueprint semantics.** Builds on **RFC-013 (Accepted)** (the root container), **RFC-029 (Accepted)** (the implicit core package), **RFC-033 (Accepted)** (`dataModelRevision`), **RFC-034 (Accepted)** (Containers; `childContainerIds` acyclic) and **RFC-042 (Accepted)** (the concept tree). Context only: RFC-009, RFC-038, RFC-043.
**Amends (Door 3, same PR, each Accepted RFC takes a revision bump and a history row):**
- **RFC-005** (one revision covering Change A and Change B). *Change A*: "What is NOT added to the core shape" gains endpoint-type, upper-bound and acyclicity facets, and "All seven are `many-to-many` cardinality (not enforced at core)" is replaced by "core `precedes` and `contains` declare `acyclic`; no core definition declares an upper bound". *Change B* and the E1 rule gain a core-key carve-out: "a local definition of a core key is a reference copy; a non-identical one is reported only as `relation-type-core-key-shadow` (warning), never as an installation conflict, and Relations of that key remain accepted, governed by the core definition."
- Rulings 8 and 9 (with 11) will be recorded as `rfc-decision` records at acceptance (Stage 6 decision log). Ruling 10 will not: it is a naming convention, an authoring rule routed to srs#819.
- **RFC-029** (Door 3 revision): adds the sentence "the embedded core package is authoritative for its relation-type keys; a local definition of a core key is a reference copy" (RFC-029 already forbids the implicit merge from becoming "a silent shadowing mechanism"); its relation-type contents become version 2 for `precedes` and `contains`, and the package version moves 1.0.0 to 1.1.0.
- *Non-normative note:* srs-rust ADR-025's amendment for srs-rust#685 (a repository's own definition of a core key wins) is superseded by ruling 8. That is an implementation follow-up, not spec text.
- **RFC-021** was checked and defines no `RelationSpec` cardinality or `required`; it is not amended.

**Author**: design dialogue draft (owner rulings 2026-10-07 and 2026-10-08 on the-greenman/srs#820)
**Date**: 2026-10-07 (Revision 5: 2026-10-08)

---

## Revision history

The eleven owner rulings, numbered for citation (1 to 7 on 2026-10-07; 8 to 11 on 2026-10-08):
1. The relation type definition holds the constraints; Blueprint does not. *Refined by ruling 9:* the relation type holds the **validity** constraints; completeness is bounded and is not this RFC's (ruling 11).
2. Exactly three facets: endpoint-type restriction, cardinality, acyclicity. Symmetry, transitivity, inverse and uniqueness-within-scope are deferred. *Refined by rulings 9 and 10:* the three facets are endpoint-type restriction, **an upper bound** (`maxPerSource` / `maxPerTarget`) and acyclicity.
3. Violations are warnings first; a path to errors only at a declared boundary, via a new definition version.
4. Core defaults only for what is genuinely global: `precedes` and `contains` acyclic. No cardinality on core `contains`. `depends-on` is not acyclic.
5. No overlay or refinement of core relation types and no relation inheritance now; relational inheritance is a named future RFC.
6. The `contains` single-parent rule is relocated to the authoring guide (srs#818 / #819) and is not held here; the held-rules table is rewritten accordingly.
7. Enforcement lives once in the core service (`capability-layering.md`) behind CLI, WASM and MCP; the RFC carries no implementation detail beyond that.
8. "Option C. This was the design. A repo copy can legitimately have a local definition of a core type — but this is just for reference." The embedded core definition is authoritative for every core key; a local definition of a core key is a reference copy and never governs resolution or validation. This makes core authority explicit and carves Change B's conflict rule out for core keys; it is not an overlay (ruling 5 stands).
9. **Boundary.** "A blueprint is defining structural relations between a specific set of things. Our other relations have to be global as they have no containment. So a blueprint is working with a different boundary. ... Completeness means different things within a blueprint and other contexts." Blueprints guide a way of doing things; a required element is a process matter, not a meaning-layer one. Validity is global and belongs to the relation type (prohibitions only); completeness is bounded.
10. **Naming.** References put the role first (`sourceInstanceId`, `sourceType`, `sourceTypeIds`); bounds put the bound first (JSON Schema `minItems`, `maxLength`; RFC-017 `max_per_file_bytes`). The upper-bound facet is therefore `maxPerSource` / `maxPerTarget`, and the word `cardinality` is not used on the relation type (it keeps its Blueprint meaning only).
11. (Owner direction.) "Blueprints offer a way to define relational rules within a set boundary, which fills in functionality global-only relations cannot provide. This may need a deeper look at how we define blueprints and use them." RFC-048 defines the global half only; the bounded half, and what a Blueprint's expectations mean, belong to a Blueprint rework.

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-07 | Initial draft applying rulings 1 to 7. |
| 2 | 2026-10-07 | Review round 1 (8 blocking, 11 should-fix): counting rule, diagnostic payload and sort keys, self-loop handling, exact write-time evaluation, the shipped resolution rule for core keys, the Amends list, embedding and the revision gate. Declined: RFC-021 amendment (nothing to amend). |
| 3 | 2026-10-08 | Ruling 8 applied: the core definition governs every core key; a non-identical local copy draws `relation-type-core-key-shadow`. The Revision 2 fork (core facets by winning definition or by key) is **resolved by ruling 8**. Alt L and Alt M added. |
| 4 | 2026-10-08 | Review round 2. Measured 0 self-loops on any core key across 7,696 relations, so moving governance of the governance `derived-from` / `evidences` copies to core creates no E3 error. Abstract rewritten; "identical" and "local definition" defined; stale core copies counted; door labels (RFC-005 Change B to Builds on); core 1.1.0 bundle row; Problem 4. |
| 5 | 2026-10-08 | Rulings 9 and 10 applied. **Validity versus completeness:** relation-type facets are prohibitions only; `min` and its population rules, the `relation-cardinality-unmet` diagnostic and the "min needs an endpoint restriction" rule are **dropped**. **Change C reversed:** Blueprint `cardinality` and `required` are **kept** and re-described as completeness expectations over a Container instantiated from the Blueprint; no Blueprint migration, the 42 `RelationSpec`s in 7 live Blueprints do not break. The layer test for authors is stated ([R13]). Blueprint completeness checking is a held debt (Not In Scope). **Naming:** the `cardinality` object becomes `maxPerSource` / `maxPerTarget`; the diagnostic becomes `relation-max-exceeded` with `end`. With no remaining cross-property validator rule, `relation-type-constraint-invalid` is dropped and every new diagnostic is a warning. The revision bump remains, now justified by the new relation-type properties alone. **Resolved by ruling 9:** the Blueprint `required` successor question and the archived-Records-in-the-population question (both moot). Rebased on origin/master. |
| 6 | 2026-10-08 | Ruling 11 and the Blueprint investigation. **Blueprint half withdrawn to a pointer:** no change to `blueprint.json` (not even descriptions) and no RFC-009 amendment; Revision 5's claims that Blueprint expectations apply "within a Container instantiated from the Blueprint", that a Blueprint on the root container expresses a repository-wide rule, and the pinned meaning of `required` / `cardinality` are removed (no Blueprint binding exists; RFC-009 forbids inferring provenance from the anchor match; the implementation already reads `cardinality` differently, srs-rust#1100). Kept: the validity / completeness distinction, the author's layer test and [R13]. The held completeness debt is paid by a Blueprint rework. Closing review: RFC-005 Change B under Amends with a core-key carve-out (also E1); "restored" reworded; [R14] universal revision rule; the migration MAY clause limited to the repository's own copies identical to a prior core version; sort tie-breaks; `list` on the unresolved-type diagnostic; an all-unresolved list restricts nothing; `relationIds` for `relation-max-exceeded`; write-time cycles name the post-write component; nits. |

---

## Charter alignment

**Cell(s):** cell:conformance, cell:containment, cell:description, cell:reference, cell:assertion, cell:governance, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Conformance: one way over many** (`rfc-decision-cce3c00e`). Primary cell. Aligned: global validity of the relation graph has one home, the relation type, and each core key has one governing definition. Bounded completeness is a different goal; this RFC does not give it a home, it holds it for the Blueprint rework.
- **Containment: declaration over location** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned, and the reason for the split: a relation has no containment boundary, so a relation type can carry only rules that hold everywhere. A rule that needs a boundary needs a declared one, and no Container today declares which Blueprint it instantiates. `contains` is declared acyclic; single parent is not declared on core `contains`.
- **Description: one name over many** (`rfc-decision-cce3c00e`, `rfc-decision-628cf6c4`). Aligned: *validity* and *prohibition* name the relation-type facets; *completeness* names the bounded question. The word `cardinality` is not used on the relation type, so it keeps its one existing (Blueprint) usage (ruling 10).
- **Reference: declared strength over convenient reach** (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`). Aligned: an endpoint restriction names a Type by LINEAGE (a bare `typeId`).
- **Assertion: statement over side-effect** (`rfc-decision-cce3c00e`). Aligned: a violating relation is reported, never altered, dropped or silently repaired.
- **Governance: migration over drift** (`rfc-decision-cce3c00e`, `rfc-decision-628cf6c4`). Aligned: the new properties arrive under one revision stamp; no property is renamed or removed.
- **Portability: preserve over recognize** (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned: constraints are properties of the definition and travel with it; local copies of core keys are reference copies.

**Axis preference:**
- **5–11 Succession↔Conformance: Reliability over Renewal**, default pole taken. The boundary clause reads *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* Warnings-first is the clause applied: no previously valid relation, Record or Blueprint becomes invalid. Errors arrive only by an explicit later definition version at a declared boundary ([R12]).
- **2–8 Identity↔Assertion: Evolution over Continuity**, default pole taken. Its phase-bound boundary clause (*precommitted to flip to Continuity at the first full public release*) is the one boundary this RFC names as a candidate for the error path, and does not decide (Open Question 1).
- **3–9 Description↔Governance: Shared Coherence over Local Autonomy**, default pole taken for the global half: the three prohibitions, the two core defaults and core-key governance. Blueprints are the candidate *explicit-local boundary* this axis names, the place a set of records could carry its own relational rules; this RFC defines only the global half and leaves that boundary to the Blueprint rework (ruling 11). A rule one repository chose stays that repository's rule (ruling 4).
- **6–12 Containment↔Portability: Portability over Possession**, default pole taken: constraints travel with the definitions that carry them.
- **1–7 Versioning↔Reference: Semantic Integrity over Practical Expression**, default pole taken (typed endpoint references).

**Decisions consulted:** `rfc-decision-a8dcbfe5` (RFC-003: core identical by id and version), `rfc-decision-c20fcff8` (level test), `rfc-decision-1e7c0c8e` (a generic tool defines what is possible), `rfc-decision-cce3c00e` (grid; one way over many), `rfc-decision-9ee14517` (layer rules), `rfc-decision-0118e938` (one layer per construct), `rfc-decision-7caca3a1` (decision modes), `rfc-decision-e99a9437` (doors), `rfc-decision-8aed3412` (reusable parts; relations are global claims), `rfc-decision-0df19d60` (context order on the Container), `rfc-decision-0750c62f` (a Container is a declared selection), `rfc-decision-628cf6c4` (a rename is a migration), `rfc-decision-5f8204bc` (retirement has one way per layer), `rfc-decision-43249f53` (one state mechanism; the rejected two-tier boundary), `rfc-decision-c8704763` (the Reference taxonomy), `rfc-decision-2e0cd70a` (carry meaning you do not recognise), `rfc-decision-4431046e` (how a decision record changes).

**Contradictions found:** None overridden. Five tensions are named and resolved inside existing rulings.
- `rfc-decision-5f8204bc` says relation type definitions are SUBSTRATE ENTRIES that retire by status because instance data addresses them by string key and cannot pin a version. A new version of core `precedes` (Change D) is therefore a new version of a definition no relation pins: version 2 reaches every relation of the key, including in repositories that carry a local copy (ruling 8). That is why the safety of the change rests on warnings, not on pinning.
- `rfc-decision-43249f53` rejected a two-tier boundary as a drift seam ("authors would drift across the line case by case"). It is answered twice. (a) Two vocabularies touch multiplicity: the relation type's upper bound and the Blueprint's `cardinality`. They serve two goals, validity everywhere and completeness within some boundary, and the line between them is a stated test ([R13]), not a case-by-case judgement: *could the record graph be meaningful but unfinished while this is unmet?* This RFC does not change or define the Blueprint vocabulary; it only refuses to let `repo validate` read it as validity. (b) `irreflexive` and `acyclic` overlap on one case, a self-loop; the overlap is resolved once ([R8]) and they differ in strength (an existing error versus a new warning); collapsing them is a reversible adopted choice (Open Question 2).
- The shipped implementation lets a repository's own definition of a core key win, silently (srs-rust PR #738, recorded only as an ADR-025 amendment, ratified by no decision). That contradicts RFC-005 Change B, RFC-029 ("not a silent shadowing mechanism") and `rfc-decision-a8dcbfe5`. Ruling 8 settles it for the standard; the implementation drift is a follow-up.
- `rfc-decision-8aed3412` and `rfc-decision-0df19d60` say a relation is a global claim and refuse context carried on an edge. That is the ground of ruling 9: a relation type has no boundary, so a lower bound ("every X has at least one") on it is a completeness rule without a boundary. The relation type therefore carries prohibitions only.
- The same two decisions refuse to let a shared record take one parent from an edge. Single parent on core `contains` would do exactly that, so it is not declared.

**One-way-per-goal:** Two goals, each with one home.
- **Goal 1, validity of the relation graph everywhere.** Home: `RelationTypeDefinition`. `irreflexive` and `requireSameType` already live there; the three new facets sit beside them. The retired `allowedSourceTypes` / `allowedTargetTypes` had no successor; the endpoint facet is that successor under new names. **Which definition a core key resolves to** has one answer, the core definition (ruling 8). Invariant I-150 / RFC-034 [R7] declare acyclicity of the `childContainerIds` graph, a different graph whose nodes are not relation endpoints; untouched (Change F). `Type.validationRules` is intra-record and not a mechanism for this goal (Alt B).
- **Goal 2, completeness of a bounded set of records.** Not given a home here. The Blueprint fields are the drafts' intended carrier, but they are inert, bound to no Container, and read differently by different consumers. What they mean, what boundary they apply to and how a Container declares its Blueprint are held for the Blueprint rework (Blueprint binding, template versus contract, a local-rule vocabulary, one home among Protocol, Blueprint and Composition, and a completeness report in the core service; issue to be filed by the owner). This RFC only states that `repo validate` does not read them ([R13]).
- The two goals cannot drift into each other: [R13] is the test that sorts a rule into one of them, and only the validity half has a mechanism after this RFC.

**Layer test:**
- **Which layer owns this?** MEANING plane, definitions layer: `RelationTypeDefinition`, beside Field and Type. Enforcement binds the OPERATION plane's core service, one implementation behind CLI, WASM and MCP (`capability-layering.md`). The bounded half is not placed by this RFC.
- **Consume or clone downward?** Consume. An endpoint restriction references a Type through the existing LINEAGE form.
- **Does the layer below stand alone without this?** Yes. Instances and relations are valid with every facet absent; a definition declaring no facet constrains nothing, and E1 to E4 apply unchanged. Records are valid whether or not any Blueprint expectation is met, as today.

**Level test** (`rfc-decision-c20fcff8`): each validity facet is declarable in a repository's own package data and checkable by `repo validate`, so it belongs in the standard. Bounded completeness is held, with its payer named (the Blueprint rework), which is the level test's hold disposition.

**Consequence map (complex decision).** The decision touches seven cells. The options are the placements of the constraint surface, the kinds of constraint each layer carries, and the severity at which they speak.

| Option | Conformance (one way over many) | Containment (declaration over location) | Description (one name over many) | Reference / Assertion | Governance (migration over drift) | Portability (preserve over recognize) | Outcome |
|---|---|---|---|---|---|---|---|
| **Chosen. Prohibitions on the relation type; completeness held for the Blueprint rework; warnings first; core governs core keys** | One home for validity. | No rule claims a boundary that is not declared. | `cardinality` not reused; validity and completeness are two words. | LINEAGE `typeId`; violations reported, never repaired. | No removal, no rename; one stamp for new properties. | Constraints travel with definitions. | **Chosen** (rulings 1 to 11). |
| A lower bound (`min`) on the relation type (Revisions 1 to 4) | Looks like one home for multiplicity. | A completeness rule with no boundary: needed rulings on population, archived Records and Notes. | `cardinality` on two objects with two meanings. | n/a | n/a | A repository's practice would bind every corpus. | Rejected (ruling 9). |
| Remove Blueprint `cardinality` / `required` (Revisions 1 to 4) | Collapses two goals into one. | Loses the drafts' only bounded vocabulary. | n/a | n/a | A migration breaking 42 `RelationSpec`s in 7 Blueprints. | n/a | Rejected (ruling 9). |
| Define Blueprint completeness here (Revision 5) | A second home invented without a binding. | Claims a Container boundary no Container declares. | Pins a meaning the implementation already reads differently. | n/a | n/a | n/a | Withdrawn (ruling 11): a Blueprint rework. |
| Validity constraints on the Blueprint | Graph validity in a per-document template. | A global claim made contextual. | n/a | n/a | n/a | Validity lives away from the relation. | Rejected (ruling 1). |
| Local copy of a core key wins (shipped, srs-rust PR #738) | Two governing definitions per key. | n/a | n/a | Resolution by key silently swaps meaning; no diagnostic. | Coverage shrinks as tools write copies. | Copies silently capture the key. | Rejected (ruling 8). |
| Core facets applied by key on top of a local winner | Two definitions merged. | n/a | n/a | A definition gains facets it did not write. | n/a | n/a | Rejected: an overlay (ruling 5). |
| Overlay or relation inheritance | One way becomes two. | Lets a repository re-define `contains`. | n/a | A new reference strength. | Conflict rules needed. | Overlays do not travel. | Deferred (ruling 5). |
| Single-parent as a global `contains` rule | Fits "one way". | Shared records need several parents; RFC-034 refuses it. | n/a | An edge carries a context fact. | Invalidates shared-part reuse. | n/a | Rejected (ruling 4). |
| Errors from the first release | Strongest contract. | n/a | n/a | Breaks standing corpora. | Forces migration on upgrade. | Older corpora refused. | Rejected (ruling 3). |
| `depends-on` acyclic | Tidy. | n/a | n/a | Calls 4 intended 2-cycles invalid. | n/a | n/a | Rejected (srs#608). |

Column coherence. Earth (structure is declared, never inferred) holds: shape is stated on the definition, and no rule infers a boundary from an anchor match. Air (meaning stated once and validated against its statement; conflicts resolve by declared authority, visibly) holds: when data conflicts with a definition the definition wins by being reported, and a local copy of a core key loses to core visibly (the shadow warning). Water (connection is explicit and carried) holds: no relation is created, dropped or re-typed. Fire (change preserves what it replaces) holds: nothing is removed or renamed.

Emergence. Two effects the single-cell reading would miss. First, `repo validate` becomes a consumer of relation type definitions beyond lookup, which invites a growing constraint language; the guard is the closed list of three prohibitions and the Not In Scope list. Second, rulings 9 and 11 name a layer distinction (validity versus completeness) the standard had not stated, and it reaches beyond relations: any future "required" or "at least" rule now has a test to pass ([R13]), and the bounded half has a named payer, the Blueprint rework.

This decision yields rulings for the owner, not guard compliance. Rulings 1 to 11 are given (numbered in the revision history); the one owner decision that remains is Open Question 1.

---

## Abstract

SRS has no vocabulary to say what a relation graph must never contain. A repository cannot declare that its own sequence relation must not loop, that a custom `org.example/concludes` relation leaves each argument at most once, or that a relation connects only certain Types, and `repo validate` checks none of it. This RFC separates two questions the standard had mixed. **Validity** is global: a relation is a claim with no boundary, so its type may carry only prohibitions, and a violation means the data is wrong. **Completeness** is bounded: it is an expectation over some specific set of records, and an unmet expectation means the work is not finished. This RFC defines the global half only. It commits the standard to five things. (1) Exactly three prohibitions on `RelationTypeDefinition`: endpoint-type restriction, an upper bound (`maxPerSource`, `maxPerTarget`) and acyclicity, every violation a validation warning. (2) Core `precedes` and `contains` become version 2 declaring `acyclic`. (3) For every core key the core definition shipped with the implementation governs; a repository's local copy is a reference copy, and a non-identical copy draws the warning `relation-type-core-key-shadow`. (4) `repo validate` does not read Blueprint `cardinality` or `required`; Blueprints are unchanged, and what their expectations mean and what boundary they apply to are held for a Blueprint rework. (5) One `dataModelRevision` bump, in the implementation release that embeds core version 2. **What becomes invalid:** a corpus below the new revision, until it is migrated (a stamp); and, by moving governance of core keys to core's `irreflexive`, any self-loop on a core key held under a local copy lacking it (0 exist today). No relation, Record, Container or Blueprint becomes invalid through the new facets.

---

## Motivation

### Problem 1 — The standard cannot declare graph shape, so rules are either unchecked or private scripts

The relation checks that exist are exactly four. E1 and E2 resolve the relation type and the two endpoints, E3 bans a self-loop where `irreflexive` is true, and E4 requires the same Type where `requireSameType` is true. Nothing checks how many relations an instance may have, a cycle longer than one edge, or which Types a relation may connect. RFC-005 deferred cardinality ("enforcement requires graph inspection; deferred until a consumer needs it"), and its `allowedSourceTypes` / `allowedTargetTypes` were keyed on the retired `semanticObjectType` string and removed with no successor (srs#372, `rfc-decision-c8704763`).

The cost is visible. `precedes` cycles degrade silently: the tree service prunes a cycle at read time, and the graph code emits a render-time message that never reaches the validation report (srs-rust#557). The spec's own concept-tree rules are held up by a bespoke script that binds only this repository. Under the level test (`rfc-decision-c20fcff8`) a rule no repository can declare and no implementation can check is an authoring rule; the missing piece is the vocabulary.

### Problem 2 — Blueprint's multiplicity vocabulary is inert and its meaning is unsettled

`RelationSpec` in `blueprint.json` carries `cardinality` (`one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`) and `required` (a boolean), and the `structure` property says it "declares cardinality and required constraints". Nothing validates against a Blueprint and nothing is bound to one: no Container, Record or Protocol run names the Blueprint it instantiates, and the consumers are generative (form-schema generation, MCP brief prompts, CLI/WASM, the srs-vscode preview). Earlier drafts of this RFC read the fields as completeness expectations; that reading is the drafts' intent, unratified and unimplemented. Read as validity, they would be a second home for graph shape beside the relation type. As of 2026-10-08, of the 7 live Blueprints (1 in srs-programme with 3 `RelationSpec`s; 6 in muSrs with 39) only problem-set's expectations are honoured by its container; guide (0 `contains` edges across 5 containers) and homepage (a `required` `precedes` unmet, order having moved to the RFC-043 outline) are stale; argument, initial-argument and programme-unit are never instantiated as containers.

### Problem 3 — The held-rules queue on srs#820 needs rewriting

srs#820 held several rules as debts. Under the rulings, the two that concern this RFC are re-dispositioned here; the rest stay on srs#820 and srs#236.

| Held rule (as filed on srs#820) | Disposition now |
|---|---|
| `contains` has one parent; a leaf's parent is a `concept` (RFC-042 [R2]) | **Not held** (ruling 6). Relocated to the authoring guide (srs#818 / #819). Single parent is RFC-042's choice for the spec's concept tree, not a global rule. For srs#818 (non-normative): in the spec's 10 Part containers single parent holds (0 multi-parent), but "a leaf's parent is a concept" fails 40 times across 13 parent-to-child type pairs. |
| `precedes` forms no cycles | **Core, this RFC** (Change D). |

The naming-grammar `pattern` on Field `name` / `namespace` (srs#236) and the version-bump table of `mechanism-b3c293f9` (not mechanisable, an authoring rule) are unrelated to the three facets.

### Problem 4 — A local copy of a core key silently replaces the core definition

The shipped implementation skips the core definition of a key whenever the repository has any definition with that key (srs-rust PR #738), with no diagnostic. The standard says the opposite: RFC-005 Change B lets one definition govern a key, and RFC-029 forbids the implicit merge from becoming a silent shadowing mechanism. The cost is concrete: the `com.mudemocracy.governance` copies of `derived-from` and `evidences` omit `irreflexive`, so a self-loop on those keys is not reported in any governance-seeded repository, and any constraint added to core would reach only repositories that carry no copy. Change D fixes this per ruling 8.

---

## Proposed Changes

### Change A — Three prohibitions on `RelationTypeDefinition`

`RelationTypeDefinition` gains five optional properties that together express three facets. Every facet is a **prohibition**: it says what is never valid anywhere, so a violation means the data is wrong whatever stage the work is at. No facet says what must be present; that is completeness, which needs a boundary (Change C). A definition that sets none of them constrains nothing, exactly as today.

**Endpoint-type restriction** is two optional lists, `sourceTypeIds` and `targetTypeIds`, each a list of bare Type UUIDs. When a list is present, the instance at that end of every relation of this type must be a Record bound to one of the listed Types. The reference form is LINEAGE (`rfc-decision-c8704763`): it names the Type's identity and matches whatever version a Record is bound to, so a Type moving to version 2 does not turn existing relations into violations. The match is on the Record's `typeId` only and does not follow `ext:type-inheritance` (Open Question 3). The facet composes with the existing `requireSameType`: all declared conditions must hold.

Edge cases. A Note has no Type, so it satisfies no non-empty list; core declares no restriction, so this bites only a custom type, and graduating a Note can change the outcome of the next validation in either direction. A Record whose `typeId` does not resolve is reported by the existing Type-resolution check and not also as `relation-endpoint-type`. An endpoint id that does not resolve, or that is a `containerId`, is left to E1 and E2. A listed Type UUID that does not resolve in the effective package set draws a warning, and only that entry of the list is skipped; if every entry of a list is unresolved, the list restricts nothing.

**Upper bound** is two optional positive integers, `maxPerSource` and `maxPerTarget`. `maxPerSource: N` means at most N relations of this type may leave one source instance; `maxPerTarget: N` means at most N may arrive at one target instance. Absent means unbounded. There is no lower bound: "every X has at least one" is a completeness rule with no boundary, so it is not a relation-type facet (Rationale).

Counting is plain. Every relation of the type whose both endpoints resolve counts toward the instance at its source (for `maxPerSource`) or target (for `maxPerTarget`), whether or not it also passes the endpoint restriction (a failing edge is reported separately and still counts). Two relations with the same source and target are two relations and count twice; uniqueness is Not In Scope. A Note counts like any other instance. An instance with zero relations never violates an upper bound.

**Acyclicity** is one optional boolean, `acyclic`. When true, the directed graph formed by the relations of this type alone, read source to target as stored, must contain no cycle. A cycle is any closed directed path of one or more relations, so a self-loop is a cycle. Cycles that mix relation types are out of scope. `irreflexive` (E3) rejects self-loops as an error and is unchanged: when a type declares both, a self-loop is reported by E3 only; when it declares `acyclic` without `irreflexive`, a self-loop is reported as `relation-cycle`. Core `precedes` and `contains` declare `irreflexive`, so on them `acyclic` in effect reports cycles of two or more relations. Reporting is one diagnostic per strongly connected component of more than one instance, naming every instance in it and every relation of the type between them, plus one per self-loop where `irreflexive` is absent (a self-loop on an instance inside a larger component is reported separately).

**Naming.** No property-naming convention is written down beyond case (camelCase JSON keys, snake_case `Field.name`, RFC-033). The de facto rule followed here (ruling 10): a reference puts its role first (`sourceInstanceId`, `sourceType`, so `sourceTypeIds`), and a bound puts the bound first (JSON Schema `minItems`, `maxLength`; RFC-017 `max_per_file_bytes`, read as bound, per, scope), so `maxPerSource`. The word `cardinality` is not used on the relation type; it keeps its Blueprint meaning only. The retired `allowedSourceTypes` / `allowedTargetTypes` are not revived, since a retired name reused for a different shape breaks `rfc-decision-628cf6c4`. Writing the convention down is routed to srs#819 (structural authoring rules in the spec language guide); that pointer is non-normative.

*Consequences.* A repository can now state "no loops", "at most N" and "only between these Types" as data and have it checked. It cannot state "at least one" on a relation type; that is a completeness question, held (Change C). It cannot yet state symmetry, transitivity, inverse or uniqueness (Not In Scope).

The meaning of the example is in the prose: a custom `concludes` relation that never loops, connects an argument Type to a claim Type, and leaves each argument at most once. It is a fragment with placeholder ids.

```json
{
  "key": "org.example/concludes",
  "acyclic": true,
  "sourceTypeIds": ["00000000-0000-4000-8000-0000000000a1"],
  "targetTypeIds": ["00000000-0000-4000-8000-0000000000c1"],
  "maxPerSource": 1
}
```

### Change B — Diagnostics and severity

Every diagnostic this RFC introduces is a **warning** in `repo validate`'s `payload.diagnostics`, never an error and never a refusal to load.

| Code | Raised when | Payload beyond the common fields |
|---|---|---|
| `relation-endpoint-type` | A relation's source or target is not a Record bound to a listed Type. One per relation per failing end. | `end` (`source` or `target`) |
| `relation-max-exceeded` | An instance has more relations of the type than `maxPerSource` (at its source end) or `maxPerTarget` (at its target end). One per instance and end. `relationIds` are the counted relations at that instance and end. | `end`, `limit`, `count` |
| `relation-cycle` | A type declared `acyclic` has a cycle (Change A). One per component or self-loop. | none |
| `relation-type-constraint-unresolved-type` | A listed Type UUID does not resolve in the effective package set (for example because the Type was later retired). One per list entry; only that entry is skipped. | `list` (`sourceTypeIds` or `targetTypeIds`), `typeId` |
| `relation-type-core-key-shadow` | A local definition of a core key is not identical to the governing core definition ([R11]). One per local definition. | `localId`, `localVersion`, `coreId`, `coreVersion`, `path` |

Common fields on every diagnostic: `code`, `severity` (`warning`), `relationType` (the definition's key), `instanceIds` (array), `relationIds` (array) and a human-readable `message` with no normative content. `instanceIds` and `relationIds` are empty where not applicable (both definition-level codes have both empty).

Order is deterministic. Diagnostics sort by `code`, then `relationType`, then a per-code key: `relationIds[0]`, then `end` (`source` before `target`), for `relation-endpoint-type`; the instance id, then `end`, for `relation-max-exceeded`; the smallest member instance id, then `instanceIds` length, then `relationIds[0]`, for `relation-cycle`; `list`, then `typeId`, for `relation-type-constraint-unresolved-type`; `localId`, then `path`, for `relation-type-core-key-shadow`. All ascending. Inside one diagnostic `instanceIds` and `relationIds` are sorted ascending.

A new property of the wrong JSON kind (a negative `maxPerSource`, a non-UUID in `sourceTypeIds`) fails the closed `relation-type.json` schema and is treated as any schema-invalid definition is treated today; it has no code of its own. With no lower bound, no cross-property rule remains that JSON Schema cannot express, so Revision 4's `relation-type-constraint-invalid` error is gone.

Write-time behaviour is exact. The operations that persist a new relation (relation create, and any operation that creates relations as part of creating a Record) evaluate, for the added relation only: its endpoint restriction; the upper bound at each end, counting the relations that already exist plus the new one; and acyclicity, by asking whether the new relation's target already reaches its source over existing relations of the type (or whether source equals target where `irreflexive` is absent); a cycle found at write time is reported naming the strongly connected component as it stands after the write, identical to what `repo validate` would report. They return the same diagnostics in their result and do not refuse the write. Operations that delete a relation or a Record evaluate nothing, because removing an edge cannot newly break a prohibition. Operations that change an instance's Type (graduating a Note, an update that changes `typeId`) evaluate nothing and leave the effect to `repo validate`.

This extends what the MCP write tools already do. They enforce the type and relation contracts at the door; graph shape joins that contract at warning strength, a structural defence for agent-authored data: an agent that closes a `precedes` loop is told at the moment it writes. It fits srs-rust#557: `relation-cycle` is that issue's cycle half, driven by the declaration instead of a hard-wired type name; its fan-out half is an upper bound a definition may declare for its own sequence type (core `precedes` declares none); its duplicate-edge and container-endpoint halves are outside this RFC. srs-rust#558 (ordering keyed off the definition, not the `precedes` string) is the same move at read time.

*Consequences.* Authors see graph faults that were silent, and a corpus is never rejected for them. The standard promises nothing stronger than a warning yet, and an author who ignores warnings keeps a broken chain.

### Change C — Blueprint: unchanged; the boundary is held

This RFC makes **no change to `blueprint.json`**, not even to descriptions, and does not amend RFC-009. Blueprint `RelationSpec.cardinality` and `required` keep their shape, values and current (generative) consumers.

It states one thing about them: `repo validate` does not read them, and an unmet Blueprint expectation makes nothing invalid ([R13]). That is the status quo, stated so that a later Blueprint RFC owns completeness instead of inheriting a validity reading by default.

It also states the test that sorts any rule into the right layer, for authors ([R13]): *could a record graph be meaningful but unfinished while this is unmet?* Then it is a completeness expectation and does not belong on a relation type. *If a violation means the data is wrong whatever stage the work is at*, it is a validity prohibition and belongs on the relation type.

What Blueprint expectations mean, what boundary they apply to, and how a Container declares the Blueprint it instantiates are held for the Blueprint rework (Blueprint binding, template versus contract, a local-rule vocabulary, one home among Protocol, Blueprint and Composition, and a completeness report in the core service; issue to be filed by the owner). That rework is the payer of the held completeness debt. Three facts it will start from: no binding exists (`container.json` has no Blueprint property and closes `additionalProperties`); RFC-009 says the anchor-type match "is structural compatibility, not provenance" and must not be used to infer it; and the implementation already parses `cardinality` with its own reading (one-to-one and many-to-one as a minimum of 1, and `N..M` ranges, srs-rust#1100), so fixing a meaning here would have pinned semantics nobody ratified.

*Consequences.* Nothing breaks and nothing changes for Blueprints. The cost is that completeness stays unexpressed until the rework lands.

### Change D — Core defaults, and which definition governs

The core package's `precedes` and `contains` definitions each gain `acyclic: true` as definition version 2 (same `id`, `version` 1 to 2; the core package version moves 1.0.0 to 1.1.0). They gain nothing else.

Only what is genuinely global is declared:
- **`precedes` acyclic.** A sequence that loops has no order.
- **`contains` acyclic.** Part-of with a cycle makes a thing its own ancestor, and navigation and tree walks already have to prune it.

Everything else is deliberately not declared:
- **No upper bound on core `contains`.** Single parent is RFC-042's choice for the spec's concept tree, not a global rule. RFC-034 refuses single parent for Containers, and `rfc-decision-8aed3412` and `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge. No surveyed corpus has a `contains` target with two parents (What breaks), but that is practice, not law.
- **No upper bound on core `precedes`.** Chains branch: the measurements show a branching `precedes` in two repositories.
- **`depends-on` is not acyclic.** srs#608 measured three irreducible 2-cycles in the concept graph of `srs/srs`, and muSrs has a fourth. Declaring it acyclic would make intended data invalid and put one repository's rule into the standard.

A repository that wants a stricter rule for its own types declares it on its own relation type. There is no overlay and no inheritance of core relation types (ruling 5); relation inheritance, by analogy to `ext:type-inheritance`, is a named future RFC.

**Which definition governs a core key (ruling 8).** The core package is embedded in the implementation, not carried by the corpus (RFC-029). For every key the core package defines, **the governing definition is the core definition shipped with the implementation**. A repository's local definition of a core key is a **reference copy**: allowed, and never consulted for relation resolution, validation, or any facet. This makes core authority explicit and carves Change B's conflict rule out for core keys (Amends); it is not an overlay. Relations reference relation types by key only, so nothing about a relation changes when the governing definition does.

A *local definition* is any relation type definition in the effective package set outside the core package, including one from an installed dependency package (such as `com.mudemocracy.governance` 1.2.1). *Identical* means JSON-value equality of the whole definition object, key order and whitespace ignored, with nothing excluded (`createdAt`, `updatedAt` and `meta` included). A local copy of a core key falls into one of two classes:
- **(i) Identical** to the governing core definition: a reference copy. No diagnostic.
- **(ii) Anything else**: a different `id`, or the same `id` with a different `version` or content, including a stale version-1 copy beside core version 2. The warning `relation-type-core-key-shadow`, once per local definition; never an error, never a refusal to load, and no other diagnostic (in particular, never an installation conflict). One code covers both cases because warnings-first needs one signal, and a stale copy is exactly what an author should see.

This corrects the shipped behaviour, which skips the core definition whenever the repository has any definition with the same key (srs-rust PR #738, commit df9a81c1, 2026-07-24, introduced to make 35 failing fixture tests pass, and recorded only as an amendment to ADR-025). ADR-025's own context says conflicts are "detected and rejected loudly", srs-rust#685 asked for the loud rule, RFC-005 Change B was never amended, RFC-029 says the implicit merge must not become "a silent shadowing mechanism", and no decision ratifies the silent rule. The copies predate the core relation types (srs#229, 2026-07-24): the gallery `precedes` dates from 2026-05-31, muSrs's from 2026-06-04, governance 1.0.0 from 2026-06-28. `srs/srs/package/core` is the source of the embedded bundle, not a copy.

The consequence, plainly. **Core version 2's `acyclic` reaches every repository at once**, including muSrs, every governance-seeded repository and srs-web users' repositories, and it produces 0 new cycle warnings today. No surveyed copy differs from core in category or direction; they differ in `id`, namespace, wording, `inverseType` and, for two governance copies, the absence of `irreflexive`, which is a difference in meaning. Every one draws the shadow warning until removed or made identical (What breaks). Under core governance the governance `derived-from` (36b78f14) and `evidences` (35c7aba2) keys become irreflexive again, so a self-loop on them becomes an E3 error, the rule RFC-005 always stated for every core key; none exists today, so no downgrade during the warnings-first period is needed.

Tools that write reference copies remain legitimate: `srs repo copy` writes the core relation types into its output, and `package install` adds local copies. Writing an identical copy draws nothing; writing a non-identical one is what produces the warning.

### Change E — Path to errors

Version 2 of the core definitions is a warning contract. This RFC adds no severity property. When the standard wants a facet to fail validation, that is a standing-contract change under axis 5–11: a later RFC introduces an explicit enforcement property whose first appearance is in a new definition version, effective only for a repository whose effective package set carries that version, at a boundary the RFC declares. The candidate boundary is the first full public release, where axis 2–8 is already precommitted to flip to Continuity. Not designed here (Open Question 1).

### Change F — Containers are untouched

I-150 and RFC-034 [R7] already require the `childContainerIds` graph to be acyclic and treat a cycle as a validation error. That graph's nodes are Containers, which are not relation endpoints. This RFC does not touch that invariant or its severity. If Containers ever became relation endpoints, I-150 could be restated as `acyclic` on a relation type; that is noted, not proposed. A Container is also the boundary that Change C's completeness expectations need, which is a use of Containers, not a change to them.

### Change G — Revision and embedding

One `dataModelRevision` bump. No stored instance or relation changes shape, and no property is removed. The bump exists because definitions with the new relation-type properties will appear in corpora: a repository may declare them on its own types, and `repo copy` / `package install` write copies of core version 2, which carries `acyclic`, into corpora as local files. A binary from before this RFC rejects any such definition as an unknown property (the relation-type schema and the implementation's definition type are both closed). The bump turns that piecemeal refusal into the corpus-level refusal RFC-033 defines: an older binary refuses a corpus stamped above the revision it supports and never silently downgrades it. The registry migration for this revision is a stamp; for local copies of core keys in the repository's own package that are identical to a prior core version it MAY refresh them to the governing version or remove them, which is safe because relations reference relation types by key. Copies inside installed dependency packages are left to their publisher (governance 1.3.0).

The gate. The bump lands in the **same implementation release** that embeds core version 2 and accepts the new properties, following the choreography in `CLAUDE.md`: (1) implementation support lands (supported-revision constant, migration-registry entry, fixture test); (2) the release is cut with the corpus gate green; (3) the spec-side PR merges; (4) one pin advance in each pinned client.

The revision number is a rule, not a literal: the revision after the highest revision assigned when this RFC is accepted. At drafting, RFC-046 holds 9 and RFC-043 holds 8. A binary supporting the new revision reports any corpus below it as needing the registry migration ([R14]).

---

## Conformance Rules

> **[R1]** `RelationTypeDefinition` MAY declare `sourceTypeIds` and `targetTypeIds`, each a list of Type UUIDs. When present and non-empty, a relation of that type MUST have, at that end, a Record bound to a Type whose `typeId` is in the list, matched on `typeId` regardless of `typeVersion`. A Note MUST NOT satisfy a non-empty list. An absent list, or a list every entry of which is unresolved ([R2]), MUST impose no restriction. A relation whose endpoint does not resolve, is a `containerId`, or is a Record whose `typeId` does not resolve MUST NOT also be reported as `relation-endpoint-type`.
>
> **[R2]** Each listed Type UUID that does not resolve in the effective package set MUST be reported as `relation-type-constraint-unresolved-type`, once per list entry, and only that entry MUST be skipped. A new relation-type property of the wrong JSON kind fails the closed schema and MUST be treated as any other schema-invalid definition is treated.
>
> **[R3]** `RelationTypeDefinition` MAY declare `maxPerSource` and `maxPerTarget`, each an integer of at least 1; absent means unbounded. For an instance, the count at its source end MUST be every relation of the type, whose endpoints both resolve, that has the instance as its source, and the count at its target end every such relation that has it as its target, whether or not the relation passes the endpoint restriction. Two relations with the same source and target MUST count as two.
>
> **[R4]** An instance whose count at an end exceeds the declared bound for that end MUST be reported once per instance and end as `relation-max-exceeded`, with `relationIds` the counted relations at that instance and end. An instance with zero relations MUST NOT be reported. `RelationTypeDefinition` MUST NOT declare a lower bound.
>
> **[R5]** `RelationTypeDefinition` MAY declare `acyclic: true`. When true, the directed graph formed only by relations of that type, source to target as stored, MUST contain no cycle of one or more relations. A strongly connected component of more than one instance MUST be reported once as `relation-cycle`, naming every instance in it and every relation of the type between them. A self-loop MUST be reported as `relation-cycle` unless the definition also declares `irreflexive: true` ([R8]), and a self-loop on an instance that is also in a larger component MUST be reported separately from that component. Cycles mixing relation types MUST NOT be reported under this facet.
>
> **[R6]** Every diagnostic introduced by this RFC MUST have severity `warning` and MUST carry the fields, and appear in the order, listed in Change B. An implementation MUST NOT report these at a higher severity and MUST NOT refuse to load or write a corpus because of them.
>
> **[R7]** The operations that persist a new relation MUST evaluate, for the added relation only, [R1], [R4] counting existing relations plus the new one, and [R5] (by asking whether the target already reaches the source over existing relations of the type), MUST return the resulting diagnostics in their result (a cycle named by its strongly connected component after the write, identical to `repo validate`), and MUST NOT refuse the write because of them. Operations that delete a relation or a Record, and operations that change an instance's Type (graduating a Note, an update that changes a Record's `typeId`), MUST NOT evaluate these; the effect is left to `repo validate`.
>
> **[R8]** Where a definition declares both `irreflexive` and `acyclic`, a self-loop MUST be reported by E3 only and MUST NOT also be reported as `relation-cycle`. `irreflexive` and `requireSameType` MUST retain their present meaning and severity.
>
> **[R9]** Enforcement of [R1] to [R8] and [R11] MUST be implemented once in the repository core service and exposed identically through the CLI, the WASM binding and the MCP write tools. An adapter MUST NOT add, relax or reinterpret a constraint.
>
> **[R10]** The core package's `precedes` and `contains` definitions MUST each be published as version 2 (same `id`) declaring `acyclic: true` and no other new facet. The core `precedes`, `contains` and `depends-on` definitions MUST NOT declare `maxPerSource` or `maxPerTarget`, and `depends-on` MUST NOT declare `acyclic`. An implementation that embeds the core package MUST embed version 2 in the same release that implements this RFC.
>
> **[R11]** For every relation type key that the embedded core package defines, the governing definition MUST be the core definition shipped with the implementation. A local definition of a core key MUST NOT govern relation resolution, validation or any facet. A local definition identical to the governing core definition (JSON-value equality of the whole object) MUST NOT be reported. Any other local definition of a core key MUST be reported once as `relation-type-core-key-shadow`, carrying `relationType` (the key), `localId`, `localVersion`, `coreId`, `coreVersion` and `path`, MUST NOT stop the load, and MUST NOT be reported as an installation conflict or any other key-conflict error. Two non-core definitions of one key remain an installation conflict (RFC-005 Change B).
>
> **[R12]** Promotion of any facet to error severity MUST be made by a later RFC that introduces an explicit enforcement property, first appearing in a new definition version, and effective only for a repository whose effective package set carries that version. An implementation MUST NOT raise severity on its own.
>
> **[R13]** `repo validate` MUST NOT read Blueprint `RelationSpec.cardinality` or `required`, MUST NOT report an unmet Blueprint expectation, and an unmet expectation MUST NOT make a Record, relation, Container or Blueprint invalid. Authors SHOULD place a rule by this test: if a record graph could be meaningful but unfinished while the rule is unmet, it is a completeness expectation and does not belong on a relation type; if a violation means the data is wrong whatever stage the work is at, it is a validity prohibition and belongs on the relation type.
>
> **[R14]** A binary supporting the `dataModelRevision` this RFC introduces MUST report any corpus stamped below it as needing the registry migration, and the migration MUST stamp every corpus it migrates. An implementation MUST NOT write a new relation-type property into a corpus stamped below that revision. The migration MAY, for local copies of core keys in the repository's own package that are identical to a prior core version, refresh them to the governing version or remove them; copies inside installed dependency packages MUST be left to their publisher.
>
> **[R15]** A conformance fixture MUST fail unless the CLI, MCP and WASM paths return, for each case, the same `code`, `severity`, `relationType`, `instanceIds`, `relationIds` and per-code fields, in the same order. The cases MUST include: one violating edge for each of [R1] and [R5], and one for [R4] at each end (`maxPerSource` and `maxPerTarget`); one unresolved Type UUID in a list ([R2]); a self-loop with and without `irreflexive`; a **local copy of `precedes` with a different `id` and no `acyclic`** over a graph containing a cycle, which MUST produce `relation-cycle` (core governs) and `relation-type-core-key-shadow` and no other diagnostic; an **identical reference copy** of a core definition, which MUST produce no diagnostic; a **same-`id` version-1 copy beside core version 2**, where core version 2 MUST govern and `relation-type-core-key-shadow` MUST be reported; and a repository holding a **Blueprint whose `required` and `cardinality` expectations are unmet by records of its Types**, for which `repo validate` MUST emit nothing about the Blueprint.

Each rule is testable by fixture ([R1] to [R5], [R8], [R11], [R13], [R15]), by reading the diagnostic and confirming the write succeeded ([R6], [R7]), by inspection of the implementation's single core-service path ([R9]), or by inspecting shipped definitions, stamped corpora and later RFCs ([R10], [R12], [R14]).

---

## Schema changes

| Schema file | Change |
|---|---|
| `relation-type.json` | add optional `sourceTypeIds` and `targetTypeIds` (array of strings with `format: uuid`, `minItems` 1, `uniqueItems` true); `maxPerSource` and `maxPerTarget` (integer, `minimum` 1); `acyclic` (boolean). Update the `requireSameType` description, whose text still says `allowedSourceTypes` / `allowedTargetTypes` were "retired with no successor". |
| `package/core/relation-types/precedes.json`, `contains.json` | package data, not schema: version 2 with `acyclic: true`; `package/core/package.json` version 1.1.0. |
| `packages/com.semanticops.core/1.1.0/` | package data, not schema: the published core release bundle `packages/com.semanticops.core/1.1.0/core-bundle.srsj`, beside the existing 1.0.0. Implementation note: the implementation's embedded core bundle is refreshed from it (the embedded-bundle drift test guards equality). |
| `package/metamodel/**` | generated from the schemas by `scripts/gen-metamodel-package.mjs`, never hand-edited: the relation-type Type gains the new fields. |
| `blueprint.json`, `manifest.json`, `protocol.json` and all other schemas | None. |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

The implementation's closed relation-type definition type must follow the same shape change; that sync is a note for the implementation, not specified here.

---

## What breaks

All counts are as of 2026-10-07 / 2026-10-08 and are not part of the normative text. They come from a read-only pass: group each repository's `relations/` by `relationType`; for `precedes`, `contains` and `depends-on` count edges, self-loops, strongly connected components of more than one instance (Tarjan) and targets with two or more incoming edges; scan every relation-type definition file (and those embedded in `.srsj` / `.srs` artifacts) for core keys and compare with core; count Blueprint `RelationSpec`s.

**Relations, Records and Containers: nothing breaks.** Every new instance-level report is a warning.

| Repository | `precedes` edges | `contains` edges | Cycles incl. self-loops | `contains` targets with 2+ parents |
|---|---|---|---|---|
| `srs/srs` | 263 | 567 | 0 | 0 |
| srs-programme | 32 | 191 | 0 | 0 |
| muSrs | 224 | 626 | 0 | 0 |
| srs-context | 0 | 0 | 0 | 0 |
| semanticops.com source | 0 | 0 | 0 | 0 |
| **Total** | **519** | **1,384** | **0** | **0** |

The two core defaults produce 0 cycle warnings across 1,903 edges, and since core governs every core key this holds in every repository. `depends-on` has 4 two-cycles (3 in `srs/srs`, 1 in muSrs), the evidence against declaring it acyclic. `precedes` branches twice (one source with two outgoing relations in `srs/srs`, one target with two incoming in muSrs).

**Blueprints: nothing breaks.** No Blueprint is touched; the 42 `RelationSpec`s in the 7 live Blueprints keep their shape, values and consumers.

**Self-loops that become E3 errors: 0.** Under core governance a self-loop on any core key is an E3 error, including keys previously held by a local copy lacking `irreflexive` (governance `derived-from` 36b78f14 and `evidences` 35c7aba2). A read-only scan of 7,696 relations (the five corpora's `relations/`, plus every `.srsj` and `.srs` in srs-web, srs-rust and the srs repository) found none.

**Local copies of core keys: shadow warnings, no invalidity.** Distinct non-identical definitions of a core key (all but one differ from core in `id`; the srs-rust fixture copy f7a8b9c0 shares it; none differs in category or direction):

| Key and definition | Carried by | Files |
|---|---|---|
| `precedes` 8d18debb | muSrs | 1 |
| `precedes` b24aaf29, `supersedes` 6e86ebd3, `derived-from` 36b78f14, `evidences` 35c7aba2 | `com.mudemocracy.governance` releases 1.0.0 to 1.2.1 in the srs repository (4 files each), the gallery example (1 each) and srs-web (1 each) | 24 |
| `precedes` 66666666, 9a1b0c40, and a same-`id` (f7a8b9c0) non-identical copy | srs-rust test fixtures | 3 |
| **Total: 8 distinct definitions** | | **28** |

Packages seeded from governance (its `.srsj` seeds, srs-gov and srs-web seeds) carry the same four definitions and draw the same warnings once loaded. The governance package, which is additive-only, needs a new minor release (1.3.0) that drops its copies.

**Stale core copies.** Copies identical to core version 1 today draw nothing, but become non-identical once core `precedes` and `contains` are version 2: 17 definitions in 11 artifacts, namely 6 srs-web e2e fixtures (`essay`, `essay-catalog`, `essay-empty`, `r23`, `sample`, `rev8/essay-rev8`; `precedes` and `contains` each) and the `contains` copy in the gallery `.srsj` and in each of the 4 governance seeds. Output of `repo copy` and `package install` written before the release behaves the same way. `srs/srs/package/core` is the source of the bundle and moves to version 2 with the release, so it draws no warning. The migration may refresh those in a repository's own package; copies in installed packages are their publisher's.

**Binaries.** A binary from before the implementing release refuses a corpus stamped at the new revision (Change G). Every currently pinned client predates it; the cost is the usual one implementation release and one pin advance per client.

---

## Rationale

**Why validity and completeness are separate layers (ruling 9).** A relation is a global claim with no containment boundary (`rfc-decision-8aed3412`, `rfc-decision-0df19d60`). What can be said of every relation of a type everywhere is what is never valid: wrong endpoint Types, too many edges, a loop. "At least one" can only be asked of a specific set. Revisions 1 to 4 put a `min` on the relation type, and it immediately needed rulings about which Records form the population, whether archived Records count, and what a Note is: the symptom of asking a global layer a bounded question.

**Why this RFC leaves Blueprints alone (ruling 11).** Blueprints are the candidate home for bounded rules, but nothing binds a Container to a Blueprint, RFC-009 forbids inferring that binding from the anchor match, and the implementation already reads `cardinality` its own way. Defining completeness here would have invented a boundary and pinned a meaning; removing the fields (Revisions 1 to 4) would have broken 42 `RelationSpec`s. The rework is the right place.

**Why exactly three prohibitions.** They are the ones with a demonstrated consumer: acyclicity (srs-rust#557, #558), an upper bound (the RFC-005-deferred cardinality facet, reduced to its global half), and endpoint types (the retired `allowedSourceTypes` / `allowedTargetTypes`). Each is checkable from the edges and Types alone.

**Why `maxPerSource` and not a `cardinality` object (ruling 10).** With the lower bound gone, the object would hold one number per end. A bound-first, role-second name matches JSON Schema and RFC-017, and it leaves the word `cardinality` with its one existing meaning.

**Why LINEAGE type references.** A constraint should keep holding when a Type gains a version; pinning would make every Type version bump an edit to every relation type naming it (`rfc-decision-c8704763`).

**Why warnings, and no severity property now.** A standing corpus must not become invalid on upgrade (axis 5–11, ruling 3). A severity property would be a knob every author must set before there is evidence for the default; the path to errors is [R12].

**Why the core definition governs every core key (ruling 8).** Ruling 8 makes core authority explicit and carves Change B's conflict rule out for core keys. Letting a local copy win makes coverage depend on whether some tool happened to write a file; applying core's facets on top of a local winner is an overlay. With core authoritative, a copy is only a reference and costs nothing when it is identical.

---

## Not In Scope

- **What Blueprint expectations mean, their boundary, Blueprint binding, and completeness checking.** Held for the Blueprint rework (Blueprint binding, template versus contract, a local-rule vocabulary, one home among Protocol, Blueprint and Composition, and a completeness report in the core service; issue to be filed by the owner), the named payer of the completeness debt. [R13] keeps `repo validate` from reading them meanwhile.
- **Any lower bound on a relation type.** Completeness, by ruling 9.
- **Symmetry, transitivity, inverse (as an enforceable property) and uniqueness-within-scope.** Deferred. `inverseType` stays a display key. The duplicate-edge diagnostic of srs-rust#557 is a uniqueness fact.
- **Overlay or refinement of core relation types, and relation inheritance.** A named future RFC, the relational analogue of `ext:type-inheritance`.
- **A severity or enforcement property, and any error-level violation.** Path only ([R12]).
- **A single-parent rule on core `contains`.** An authoring-guide rule for the spec's concept tree (srs#818 / #819).
- **Writing the property-naming convention down.** srs#819 (non-normative pointer).
- **The naming grammar `pattern` on Field `name` / `namespace`.** srs#236.
- **The version-bump half of `mechanism-b3c293f9`.** Not mechanisable; an authoring rule.
- **Constraints across relation types** and **Container graphs** (I-150 stands as it is).
- **Implementation detail.** Beyond the layering statement of [R9], how the core service computes cycles and counts is not part of the standard.

---

## Alternatives Considered

### Alt A — Validity constraints on the Blueprint

Make validation read Blueprint `cardinality` and `required` as validity. Rejected (rulings 1 and 9): they would be a second home for graph validity, and the relation type would still need a home for global validity.

### Alt B — Constraints on `Type.validationRules`

Rejected. Rules there are intra-record by construction and cannot see another record's edges.

### Alt C — Overlay or refinement of core relation types; relation inheritance

Let a repository add facets to core `contains` or `precedes`, or have a relation type extend another. Deferred (ruling 5): it needs a conflict rule between base and overlay, a new reference strength, and a story for how overlays travel.

### Alt D — Single-parent as a global `contains` rule

Rejected (ruling 4). RFC-034 refuses it for Containers, and `rfc-decision-8aed3412` / `rfc-decision-0df19d60` refuse to let a shared record take one parent from an edge. Measured practice (0 multi-parent targets in 1,384 edges) is not a law.

### Alt E — Errors first

Rejected (ruling 3). Errors come by a declared boundary ([R12]).

### Alt F — Remove Blueprint `cardinality` and `required` (Revisions 1 to 4)

Collapse them onto the relation type and delete them by migration. Rejected (ruling 9): they are the drafts' carrier for bounded completeness, which the relation type cannot express, and removal would have broken 42 `RelationSpec`s in 7 live Blueprints.

### Alt F2 — Define Blueprint completeness in this RFC (Revision 5)

Re-describe `cardinality` and `required` as completeness expectations "within a Container instantiated from the Blueprint", and let a Blueprint on the root container express repository-wide rules. Withdrawn (ruling 11): no Container declares its Blueprint, RFC-009 forbids inferring it from the anchor match, nothing "applies" a Blueprint to the root container, and the implementation already reads `cardinality` differently (srs-rust#1100). It belongs to the Blueprint rework.

### Alt G — A global lower bound (`min`) on the relation type (Revisions 1 to 4)

Rejected (ruling 9): a completeness rule without a boundary. It needed a population rule, a lifecycle ruling and a Note ruling to mean anything, and it could warn about Records nobody will relate again.

### Alt H — Keep the four-value enum, or a `cardinality` object, on the relation type

Rejected (ruling 10). The enum cannot say "at most 3"; an object with only a maximum is one number per end; and both reuse `cardinality`, a word that already has the Blueprint's completeness meaning.

### Alt I — Declare `depends-on` acyclic

Rejected. srs#608 shows 3 irreducible 2-cycles in the concept graph, and muSrs has a fourth.

### Alt J — One discriminated `constraints[]` list

Rejected for now: it admits a fourth kind without an RFC, and a list of discriminated objects is harder for the closed schema to validate than named properties.

### Alt K — Pinned or mixed endpoint references

Rejected: pinned makes every Type version an edit to the definition; a mixed form is two spellings of one thing (`rfc-decision-628cf6c4`).

### Alt L — A severity property now

Rejected: a knob with no evidence for the default, and a package could raise a violation to an error on a repository that did not choose it; the path is [R12].

### Alt M — A local copy of a core key wins (the shipped behaviour)

Rejected (ruling 8): silent drift with no diagnostic; coverage shrinks as `repo copy` and `package install` write copies; two governing definitions for one key, contradicting RFC-005 Change B and RFC-029; and it hides the missing `irreflexive` on the governance `derived-from` and `evidences` copies.

### Alt N — Core facets applied by key on top of a local winner

Rejected: an overlay (ruling 5), and unnecessary once the core definition governs.

---

## Open Questions

1. **Owner decision: the path to errors.** Which boundary promotes a facet to an error and by what mechanism? *Options:* per-package opt-in through an explicit enforcement property (new definition version); a named `dataModelRevision`; the first full public release (the axis 2–8 flip). *Recommendation:* per-package opt-in first, since it needs no repository-wide boundary; revisit the default at the public-release flip. [R12] holds the path and designs nothing.
2. **Adopted in this draft, owner may reverse: keep `irreflexive` beside `acyclic`.** They overlap on a self-loop and differ in strength (E3 error versus new warning). The alternative retires `irreflexive`, a migration of every definition that declares it (as of 2026-10-07: 15 relation-type definition files in `srs/srs`'s packages and 34 in muSrs's), turning a standing error into a warning against axis 5–11. Recommendation: keep both.
3. **Adopted in this draft, owner may reverse: endpoint restrictions match `typeId` exactly and do not follow `ext:type-inheritance`.** The alternative also accepts subtypes, at the cost of a second reference-resolution rule. Recommendation: exact for now; revisit with the relation-inheritance RFC.

Resolved:
- "Does core's `acyclic` apply by the winning definition or by key?" (Revision 2) — resolved by ruling 8 (Revision 3): each core key has one governing definition, the core one.
- "Should a Blueprint's `required` have a successor outside the relation type?" and "Do archived Records count in the `min` population?" (Revision 4) — resolved by ruling 9 (Revision 5), narrowed by ruling 11 (Revision 6): `required` is untouched and its meaning is held for the Blueprint rework, and there is no `min` on the relation type, so no population.
