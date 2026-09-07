# RFC-042: The concept tree is the spine of the specification

**Status**: Accepted (Revision 3)
**Affects**: the `com.semanticops.spec` authoring package (`srs/package/spec-authoring-core/`): `section` and `subsection` retire as authored structure; a new `mechanism` Type; `concept` and `example` revived as carrying Types; `invariant.applies_to` retires; the spec repository's compositions, root container and Part containers; RFC-016 [R6] (index grouping); the `scripts/check-spec-coherence.mjs` contract (srs#560); the `normativeSites` entry of `scripts/spec-language-registry.json`. No core schema, no `dataModelRevision` change.
**Builds on**: RFC-013 (root container and structural navigation, Rule [N+12]), RFC-015 (ordering is a view-layer arrangement, never a semantic claim, applied to the tree in Change A), RFC-016 (invariant projection), RFC-020 (`identityFieldId`), RFC-034 (Container Structure and Nesting, **Accepted, Revision 6**; declared membership — `rootInstanceIds`/`memberInstanceIds` direct, `childContainerIds` effective closure — `contains`-Relation traversal retired from membership entirely, srs-rust#974), `rfc-decision-0750c62f` (Container is a declared selection on the expression plane; `contains` is the part-of tree that navigation, depth and the tree walk are built on), `rfc-decision-0118e938` (one layer per construct), `rfc-decision-92d2da05` (Composition vocabulary)
**Author**: design dialogue draft (srs#558; owner ruling 2026-09-05, srs#556 comment 5552715003)
**Date**: 2026-09-06

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-09-06 | Initial draft. Executes the concept-tree ruling and consumes the srs#608 result (the concept graph is not a DAG; the unit of layering is the strongly connected component) and the srs#609 finding (four concepts never introduced). |
| 2 | 2026-09-07 | Folds in the owner's five rulings on PR #620 (comment 5568325871): cells confirmed as tagged with the standing cross-reference-cycle note; the nine-Part list accepted as a starting point; invariant index grouping by containing concept ratified, superseding RFC-016 [R6]; [R2] (leaf-under-leaf forbidden) kept, with the sibling-`refines` escape hatch recorded; `section`/`subsection` deprecate-then-remove confirmed. Adds the owner's layered-order clause as normative text in Change A and a new Conformance Rule [R13], citing RFC-015 and the muDemocracy #73/#75 ordering-layering ruling; records the known limit that Compositions are flat (no alternate hierarchy today; re-nesting is Door 2). **Reconciles Change D, Change G, [R7], [R12] and Alt E with `rfc-decision-0750c62f` and its shipped consequences** (srs-rust#969: navigation below the root already descends the part-of tree via `NavigationNode.children`/`repository_navigation_with_depth`, closing srs#573; srs-rust#974: RFC-034 is Accepted and its `childContainerIds` declared-membership model is implemented, and the pre-RFC-034 `contains`-traversal fallback for container membership no longer exists) — Rev 1 drafted against RFC-034 as an undecided Draft and hedged accordingly; that hedge is now stale and is corrected, not merely footnoted. Re-measures the corpus: 44 concepts, 348 leaves, 395 `contains` / 178 `precedes` / 90 `depends-on` edges, 122 baked headings in 23 leaf records (`check-spec-coherence.mjs`, landed since Rev 1 as srs#560), 68 `example` records already created and 10 `section`/65 `subsection` records still unmigrated — the concept-tree migration (srs#561–#564) is already landing additively in parallel with this RFC, which is why the counts moved. Open Questions is empty; nothing raised in Rev 1 remains open. |
| 3 | 2026-09-07 | Accepted; owner ruling 2026-09-07 ("lets flip rfc 42"), Door 2 authorization. RFC stub record created (`com.semanticops.spec/rfc`, instanceId `d66102f9-062d-4e56-b549-b568adf1f4e4`) and transitioned draft → proposed → accepted via the CLI. Canonical folding is the Wave 3 units (srs#559, #562, #563, #564), none of which has executed yet, so the record is grandfathered in `rfcs/integration-allowlist.json` pending their completion (follow-up: srs#559). |

---

## Charter alignment

**Cell(s):** cell:containment, cell:reference
**Decision mode:** complicated

**Governing cell preference:** Containment: *declaration over location* (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned. The tree, the order and the prerequisites are declared edges (`contains`, `precedes`, `depends-on`). Today the document's outline is located in markdown strings and in the position of headings inside a `content` field; this RFC moves it to declared relations. Reference: *declared strength over convenient reach* (`rfc-decision-cce3c00e`, `rfc-decision-c8704763`). Aligned. A prerequisite is a `depends-on` edge between two concept records, stated once, checked mechanically; it is not a prose cross-reference that reaches forward by convenience and goes stale when the order moves.

The brief for this unit named the first cell "♎ Process". The grid has no Process cell. ♎ is Reference, and Reference is the right cell: a prerequisite is a declared reference between concepts. The naming slip is recorded here so the grid is not read as having a thirteenth cell.

**Axis preference:** 6–12 Containment↔Portability: default pole, Portability over Possession. A part-of tree carried as `contains` relations travels with the repository in every store and every archive; a tree that lives only in the renderer's heading counter does not. 1–7 Versioning↔Reference: default pole, Semantic Integrity over Practical Expression. The forward-reference check is computed over declared edges, never inferred from prose. No non-default pole is taken.

**Decisions consulted:** `rfc-decision-0750c62f` (Container is a declared selection on the EXPRESSION plane; `contains` is the part-of tree that "the concept graph, navigation depth, layering and the tree walk are built on"; this RFC is that sentence executed), `rfc-decision-0118e938` (one layer per construct; the tree carries no presentation data and the containers carry no meaning), `rfc-decision-cce3c00e` (grid and cell preferences), `rfc-decision-9ee14517` (layer rules, applied below), `rfc-decision-92d2da05` (Composition, Presentation, Projection vocabulary, used throughout), `rfc-decision-4431046e` (correction versus refinement; RFC-016 [R6] is amended by supersession in this RFC, not edited in place), `rfc-decision-7caca3a1` (decision mode), `rfc-decision-53635966` (Tier 1 removal; the leaf types here are all Tier 2 Records).

**Contradictions found:** None. One amendment is made explicitly, not silently: RFC-016 [R6] groups the generated invariant index by the free-text `applies_to` field. That field retires here, so [R6] is superseded by a rule that groups by the containing concept (Change E). RFC-034 is not contradicted, and its acceptance since Rev 1 sharpens rather than unsettles this RFC: RFC-034 (now Accepted, Revision 6) retired the `contains`-Relation traversal from Container membership entirely (Change C) and replaced it with declared membership (`rootInstanceIds`/`memberInstanceIds`, and `childContainerIds` for nesting). This RFC never used `contains` as a membership mechanism — it uses `contains` only as the part-of tree that membership is checked *against* (Change D) — so nothing here relied on the traversal fallback RFC-034 removed. Rev 1 hedged this point ("nothing in this RFC depends on RFC-034's disposition") because RFC-034 was still Draft; Rev 2 states the now-settled position directly instead of leaving the hedge to go stale.

**One-way-per-goal:** No second mechanism is introduced, and four proposed ones are removed. The original design for this epic (srs#556 body) proposed two fields (`exposition_role`, `layer`) and three relation types (`introduces`, `presupposes`, `constrains`). Each duplicated a goal that a canonical mechanism already serves: the leaf's Type is its role; Part membership in the tree is its layer; placement in the tree is its introduction; `depends-on` is "presupposes"; an invariant's `contains` parent is what it constrains. The proposal collapses onto three installed canonical relation types that every traversal in the toolchain already reads. Alternatives Considered lists the five retired mechanisms with the ruling's reasons.

**Layer test:**
- Which layer owns this? MEANING plane, instances layer, for the tree itself: concept and leaf Records, and the `contains`, `precedes` and `depends-on` relations among them. EXPRESSION plane for everything that reads the tree: the Part containers (selection), the compositions (composition), and navigation and rendering depth (presentation).
- Consume or clone downward? Consume. Parts are containers whose declared membership is a subtree of the part-of tree; compositions select over the tree with the existing `container-subset` and `discovery-query` sources; navigation and depth ride `contains` (`rfc-decision-0750c62f`). Nothing re-implements the walk: `srs tree`, `container_service::member_ids` and the composition renderer already traverse `contains`.
- Does the layer below stand alone without this? Yes. Delete every container, composition and presentation and the concept tree remains a complete, valid Record-and-Relation graph that `srs repo validate` accepts and `srs tree` walks. That is the srs#608 experiment as run: 44 concept records and 104 relations were added with zero containers, zero existing records touched and `docs/spec/srs-spec.md` byte-identical.

**Charter growth:** none. The charter is consumed here, not extended.

---

## Abstract

The specification's structure moves out of markdown strings and into records and relations. Every node of the exposition is a `com.semanticops.spec/concept` record. `contains` is the part-of tree, `precedes` is reading order among siblings, and `depends-on` is the prerequisite between concepts. Prose, invariants, examples, tables, design notes and generated type references are typed leaf records that hang under a concept by `contains`; the leaf's Type is its role. No relation type and no field is added anywhere. The `section` and `subsection` Types retire as authored structure, a `mechanism` Type carries the normative prose that `subsection` carried, and the `concept` and `example` Types (defined, previously empty) become the spine and the worked examples.

Because the concept graph measured on the real corpus is not a DAG (three irreducible two-cycles, srs#608), the unit of layering is the strongly connected component, and the forward-reference check runs over the condensation of `depends-on`. Five coherence checks are stated over the tree so that reading order is a derived, enforced property instead of prose discipline.

---

## Motivation

### Problem 1: the outline lives in strings

The rendered specification (`docs/spec/srs-spec.md`, 4,097 lines on master 2026-09-06) is produced from 10 `section` and 65 `subsection` records whose only fields are `title` and `content`. The document's real outline is inside the `content` strings: measured today, 21 of the 75 section and subsection records carry 119 markdown headings in `content`, and 159 headings sit in prose fields across all spec records. The Vocabulary and Term block renders at `###` (section level) while nested inside the Foundation Group, and two orphan `##` sections sit after the Conformance section (rendered lines 4051 and 4082). No check sees any of this, because to the record model a heading is a character in a string.

### Problem 2: nothing carries the reading order's justification

The document opens with its conformance model, which presupposes Package (introduced 1,148 lines later) and Record (496 lines later). `FieldType` arrives before Vocabulary, which it depends on. The srs#608 experiment declared the prerequisites as `depends-on` edges and measured: **16 of 89 edges point forward** in the current order. The order is bad because nothing in the record model states what a passage presupposes, so nothing can fail the build when the order violates it.

### Problem 3: three types are defined and unused; one field does a relation's job

`concept` and `example` are defined in the authoring package with zero records until srs#608 added 44 concepts; `example` still has zero while 112 fenced code blocks sit inside prose fields (73 of them in section and subsection content). Every one of the 119 `invariant` records is exiled to a generated appendix and names what it constrains in a free-text `applies_to` field that RFC-016 [R6] groups by string equality. A reader meeting Field cannot find the invariants that bind Field without a separate search.

### Problem 4: the concept graph is not a DAG

The epic assumed the concepts form a DAG under `depends-on`. srs#608 falsified that on the corpus: 44 concepts, 89 edges, Tarjan yields 41 components, and three are two-cycles that survive a strict reading (Type ⇄ FieldAssignment, Relation ⇄ RelationTypeDefinition, Conformance ⇄ Extension). The corpus corroborates it: the document already introduces two of the three pairs inside a single subsection. A design that orders concepts one at a time cannot be satisfied. The design has to order components.

### Problem 5: four load-bearing concepts have no introduction

srs#609: Stable identity, Instance, Semantic order and Projection are presupposed by 16 edges and introduced nowhere in the specification. Each has a concept record and a glossary entry since srs#608; the document body still never states them.

---

## Proposed Changes

### Change A: concept records are the tree, three canonical relations are its edges

The exposition of a specification authored with `com.semanticops.spec` is a rooted forest of `concept` records.

| Relation | Meaning in the tree | Reads |
|---|---|---|
| `contains` | part-of: the target is exposited inside the source | `source contains target` |
| `precedes` | reading order between two children of the same parent | `source precedes target` |
| `depends-on` | prerequisite: the source cannot be understood before the target | `source depends-on target` |

A **node** is a `concept` record. A **leaf** is a Record of one of the leaf Types (Change B). A leaf has exactly one `contains` parent, and that parent is a concept. A concept has at most one `contains` parent; a concept with none is a **root**. Reading order among the children of one parent (concepts and leaves alike) is the Rule [N+12] order: topological sort over the `precedes` edges among those children, `createdAt` then `instanceId` as tiebreaks. The **reading order** of the whole exposition is the pre-order traversal: Parts in root-container order (Change D), then at every node the node's own leaves and child concepts interleaved by their sibling order.

`depends-on` is stated only between concepts. A leaf never carries a `depends-on` edge; its prerequisites are its parent's.

**Worked example.** The Type concept contains the FieldAssignment concept and a `mechanism` leaf carrying the Type prose. Type `depends-on` Field. Under Field, a `mechanism` leaf precedes a `generated-type-reference` leaf, which precedes an `example` leaf. `srs tree --root <Field>` returns exactly that shape at depth one, and `srs find --type com.semanticops.spec/concept` returns the 44 nodes.

What becomes possible: an agent or a script reads the structure from relations without parsing prose. What becomes forbidden: a heading, a numbered label or a horizontal rule standing in for structure inside a prose field (Change F, check 5). What it costs: every existing section and subsection record is retyped or split (Change C), which is the migration srs#561 to srs#564 execute.

**Order is layered, and the layers are independent (owner ruling, PR #620 comment 5568325871, verbatim: *"These layers are independent. Concepts can be ordered in many different ways as is contextually appropriate. At a meaning layer we are recording semantic or even temporal ordering, but we can tell a story with those elements in a different way."*).** The `precedes` chain over the tree defined above is the **semantic** (or temporal) order: a claim about the concepts and leaves themselves, at the MEANING plane, alongside `contains` and `depends-on`. A Composition (Change G) MAY present the same concepts and leaves in a different sequence; that sequence is a **presentation** arrangement at the EXPRESSION plane, never a claim, and where the two differ the Composition is a view of the meaning, not a competing statement of it. This is RFC-015's ordering test (a composite-range Field's presentational order never belongs on the Type) and the ordering-layering ruling (muDemocracy #73/#75: `precedes` is semantic order, the view layer owns presentational order) applied to the concept tree — it is why carrying two orders here is not a one-way-per-goal violation: one is semantics, one is telling. See Conformance Rule [R13].

**Known limit, stated so it is not discovered later.** Compositions are flat (`ext:views-l2`; a `DocumentSection` cannot contain a `DocumentSection`) — so an alternate *reading order* over the tree is expressible today (a Composition sequences the same nodes differently) but an alternate *hierarchy* is not (a Composition cannot present a different parent-child shape than `contains` declares). Re-nesting compositions or containers to lift that limit is a Door 2 question, out of this RFC's scope; this RFC only records the boundary.

### Change B: the leaf Types, and `mechanism` replaces `subsection`

The leaf's Type is its role. The leaf Types are:

| Type | Role | Fields (unchanged unless stated) |
|---|---|---|
| `mechanism` | **new**: normative prose defining how a construct works | `title` (required), `content` (required). The same two fields `subsection` carries today; nothing more. |
| `invariant` | a constraint on the parent concept | `invariant_number`, `title`, `normative_statement`, `rationale`. **`applies_to` retires** (Change E). |
| `example` | a worked example, revived | `title`, `content`. Unchanged. |
| `design-note` | rationale, never normative | unchanged |
| `table` | tabular data | unchanged |
| `generated-type-reference` | the generated reference for a core Type | unchanged |
| `extension` | an extension's declaration record | unchanged |

`mechanism` is a Type in `spec-authoring-core`, version 1, with a fresh UUID minted at srs#559. It needs nothing from the core: it is two existing Fields composed by a Type, the same shape as `subsection`, under a name that states the role. `identityFieldId` is set to `title` on `mechanism`, `example` and every leaf Type that lacks it, so `tree`, `find` and navigation label the record by its title instead of its type name (RFC-020; already done for `concept`).

`section` and `subsection` retire **as authored structure**: after migration no record of either Type exists in the spec repository, and no new one is created. The Type definitions stay in the package, marked `status: deprecated` in their descriptions, until the last record is gone; then they are removed under the definition-layer retirement rule (`rfc-decision-5f8204bc`). Migration: each `subsection` whose content is one subject becomes one `mechanism` under the concept it describes; each subsection whose content carries headings is split at the headings into several leaves (srs#562); each `section` becomes a concept (its title) or dissolves into the Part it named (srs#561, srs#563). A retype that preserves the `instanceId` is preferred where the tooling offers it (srs#178); where it does not, the successor carries a `derived-from` edge to the retired record.

Rendering consequence: the renderer treats every leaf Type the same way it treats `subsection` today, one heading per leaf at the depth of its position in the tree. RFC 2119 keywords are legitimate in a `mechanism`'s `content` and an `invariant`'s `normative_statement` and nowhere else; the registry's `normativeSites` gains the `mechanism` Type and drops the `expositionRoles` entry, which named a field that no longer exists (Change G).

### Change C: `example` records replace fenced code in prose

The 112 fenced code blocks inside prose fields (measured 2026-09-06; 73 in section and subsection content) move into `example` records, one per block or per group of blocks that illustrate one point, placed as leaves under the concept they illustrate and ordered by `precedes` after the `mechanism` they belong to. Short inline code spans stay in prose. After migration a prose field carries no fenced block; the `content` Field's `aiGuidance` already says so, and check 5 makes it a build failure instead of guidance.

**Worked example.** The Relation subsection today carries a fenced JSON relation file inside its prose. After migration: a `mechanism` "Relation" carries the prose, and an `example` "A relation file" carries the JSON with a one-sentence title; `mechanism precedes example` under the Relation concept.

### Change D: Parts are the root container's navigation sections

A **Part** is a root concept that is a non-identity member of the repository's root container (`manifest.container`, RFC-013). Part order is the RFC-013 navigation order: Rule [N+12] over the root container's members with the identity record removed. Each Part has one **Part container**: a Container whose `anchorInstanceId` is the Part concept and whose declared membership is the Part concept's subtree (every concept and leaf reachable from it by `contains`).

**Membership is declared, never derived, and this RFC never assumed otherwise.** RFC-034 is now Accepted (Revision 6) and its `childContainerIds`/declared-membership model is implemented (srs-rust#974, `rfc-decision-0750c62f`): a Container's membership is `direct(C)` — its own `rootInstanceIds` ∪ `memberInstanceIds` — closed recursively over `childContainerIds` for `effective(C)`, and the pre-RFC-034 fallback that once walked `contains` Relations to compute membership has been removed from the core entirely, not merely deprecated. A Part container therefore carries the Part's subtree in `memberInstanceIds` (Parts here are flat and do not nest, so `childContainerIds` is not needed to express one), kept in sync by a script that walks `contains` from the Part concept and writes the result — the same walk `check-spec-coherence.mjs` check 4 already performs to detect drift. A Part container whose declared `memberInstanceIds` differs from the subtree the walk computes is a structural-coherence diagnostic (check 4), because there is now exactly one membership reading (declared) to compare against, not two. Rev 1 wrote this while RFC-034 was still Draft and hedged ("under either membership reading the Part's subtree is the same set") against a `contains`-traversal reading that might still ship; that reading did not ship (RFC-034 Change C retired it), and Rev 2 states the accepted mechanism directly.

The Part set is authored, not derived. The illustrative target, following the srs#556 reading order and the nine-layer condensation srs#608 measured, is: Reading this specification; Foundations; Instances; Structure; Distribution; Presentation; Extensions; Conformance; Governance. srs#563 fixes the final list. The sole constraint this RFC places on it is check 4: every non-trivial strongly connected component lies inside one Part, and no `depends-on` edge points from an earlier Part to a later one.

The four concepts srs#609 found without an introduction get these sites:

| Concept | Site in the tree | Why there |
|---|---|---|
| Stable identity | First child of Foundations, before Namespace and Field | Layer 0 in the condensation; every later concept depends on it |
| Instance | Root of Instances; it already `contains` Note and Record | Layer 1; the definition-versus-instance id-space split is stated once, above the two things it splits |
| Semantic order | Child of Structure, sibling immediately after Relation, and the home of the `precedes` mechanism leaf | Layer 6; `precedes` is a claim, and the claim is introduced where Relation is |
| Projection | Root of Presentation; it already `contains` View, Composition and Theme | Layer 5; the principle that rendered output is derived and never authoritative is stated above the three constructs that rest on it |

Each site gets a `mechanism` leaf carrying the introduction. Writing those four leaves is Door 2 and is part of srs#563.

### Change E: invariants are leaves; `applies_to` retires

Every `invariant` record has exactly one `contains` parent, the concept it constrains. The free-text `applies_to` field retires from the `invariant` Type: the parent is the machine-readable form of what the field said in prose. Placement in `records/invariants/` remains the ratification act (srs#410, `check-invariant-placement`); the directory and the tree edge are orthogonal, and both hold.

Rendering: an invariant renders beside its parent, in sibling order, and the numbered index (RFC-016) is generated from the same records as a second projection. RFC-016 [R6] is superseded: the index groups by the containing concept's title in reading order, and the "Other" group is reserved for an invariant with no parent, which check 2 reports as an error, not a fact to render. RFC-016 [R1] to [R3], [R5] and [R7] stand.

**Worked example.** Invariant 9 ("UUIDs are stable across copy, export and import") today carries `applies_to: "all implementations"`. After migration it is `contains`-parented by the Stable identity concept, renders under that concept's introduction, and appears in the index under "Stable identity". Diffing the I-number set before and after is the acceptance test srs#564 runs.

### Change F: five coherence checks over the tree

`scripts/check-spec-coherence.mjs` (srs#560, not yet written) asserts the five checks below, registered in `scripts/checks.json`, run by `validate-all.mjs`, with a per-site allowlist in the `check-rfc-integration` pattern; shrinking the allowlist is the migration. Inputs: the record tree (`scripts/lib/rfc-038-tree.mjs`), the relations directory, `manifest.container` and the Part containers.

**Check 1: no forward reference.** Let `pos(x)` be the index of concept `x` in the reading order (Change A). Compute the strongly connected components of the `depends-on` graph over concepts (Tarjan). A `depends-on` edge `s → t` is a **forward reference** exactly when `SCC(s) ≠ SCC(t)` and `pos(t) > pos(s)`. Every forward reference is a violation. An edge inside one component is never a violation. Equivalently: the reading order, restricted to one representative per component, is a topological order of the condensation.

**Check 1a: components are introduced together.** The members of a non-trivial component are adjacent in the reading order: either siblings with no other sibling between them, or one member is the `contains` parent of the others. Today's three components satisfy this by construction (Type `contains` FieldAssignment already; Relation and RelationTypeDefinition, Conformance and Extension become adjacent siblings). The mutual definition is the content; it is stated, not hidden.

**Worked example (against srs#608's data).** Conformance `depends-on` Package. Today Conformance is introduced at rendered line 85 and Package at 1,233, so `pos(Package) > pos(Conformance)`; the components differ; violation. Conformance `depends-on` Extension and Extension `depends-on` Conformance: same component; no violation in either direction, whichever is read first.

**Check 2: one home per leaf.** Every record of a leaf Type has exactly one incoming `contains` edge, and its source is a `concept`. Zero parents is an orphan; two is a duplicate home. Every `concept` has at most one incoming `contains` edge.

**Check 3: no orphan concepts.** Every `concept` that is not a Part is reachable from a Part by `contains`. A concept outside every Part is exposited nowhere and is an error. The spec-rfc-process records (`rfc`, `rfc-decision`, `rfc-change`, and their siblings) are not exposition and are outside this check.

**Check 4: Part-order monotonicity.** For every `depends-on` edge `s → t` with `Part(s) ≠ Part(t)`: `Part(t)` precedes `Part(s)` in root-container order. Every non-trivial component lies within one Part. Every Part container's declared membership equals its anchor's subtree.

**Check 5: no baked headings.** No prose field of any spec-authoring record matches `^#{1,6} ` on any line, contains a fenced code block, or contains a standalone horizontal rule. Prose fields are the registry's `proseFields` list. This is the check that would have caught all 159 headings and stops the drift recurring.

Each check is a build failure once its allowlist entries for a Part are gone; srs#563 flips Parts I to IV to fail-closed. Checks 2, 3 and 5 are corpus rules and run in the Node pipeline only (ADR-004); check 1 and check 4 read the same walk `srs tree` performs and could later move into the core as a diagnostic, which is srs-rust's call.

### Change G: navigation, rendering and compositions

Below the root container, navigation follows the part-of tree: a Part's children are the Part concept's `contains` children in sibling order, recursively, and depth is the `contains` depth (`rfc-decision-0750c62f`). This is now shipped, not merely ruled: srs-rust#969 (merged, closing srs#573) added `NavigationNode.children` and `repository_navigation_with_depth`, built on the same `tree_service::build_tree` walk `srs tree` already used, so navigation below the root container descends the part-of tree today rather than stopping at depth one. Heading depth in a rendered document follows the same tree: srs-rust#969's own investigation of srs#574 found `render_service::render_record_at_level` already recurses `contains` children at `heading_level + 1` in structured mode — depth in a rendered Composition already rides the part-of tree, confirming existing behaviour rather than requiring new code. This RFC constrains the outcome, which is already met: one heading per node and per leaf, at its tree depth, in reading order.

For the spec repository's compositions:

| Composition | Today | After |
|---|---|---|
| `spec-document-view` (`docs/spec/srs-spec.md`) | one `discovery-query` section over `section` records; the renderer walks `contains` from each and flattens to one heading level | one `container-subset` section per Part, ordered by the Part containers' root-container order, rendered at tree depth. The Key Invariants region becomes the generated index (Change E) |
| `unified-document-view` | sections over `section` plus `design-note` | the same Part sections; `design-note` leaves render in place under their concept, so the separate design-notes section drops |
| `rationale-document-view` (`srs-rationale.md`) | `discovery-query` over `design-note` | unchanged |
| `spec-glossary` (`srs-glossary.md`) | `discovery-query` over `concept`, alphabetical | unchanged |
| RFC catalog and decision log | over spec-rfc-process records | unchanged |

`manifest.aiGuidance.suggestedEntryPoints` (defined, plumbed into `agent-index`, used by no repository) is populated with the Part concepts' ids.

The `check-spec-language` registry: `normativeSites.expositionRoles` is removed, and a `normativeSites.types` entry names `com.semanticops.spec/mechanism` so that RFC 2119 keywords in a mechanism's `content` are in scope for the keyword-register rule instead of reported as out of place. That is a registry data edit, not a checker change.

### Change H: the zero-context-agent acceptance test

Acceptance for this RFC's migration is the test the AI-native repositories note (`09b57270`) states: an agent that knows nothing about SRS, given the repository over MCP with `tree` and `agent-index` exposed (srs-rust#949), can list the concepts, state their reading order, and state each concept's prerequisites, using only the repository. Concretely: `tree` from each Part root returns the nodes and leaves at their depths; `find --type concept` returns every node; the `depends-on` relations of a node are readable from its record resource; the repo map's entry points are the Parts. If any of those needs the rendered markdown, the migration is not done.

---

## Conformance Rules

These rules bind a repository that adopts the `com.semanticops.spec` authoring package. They are package-level authoring rules, not core conformance rules.

> **[R1]** Every exposition node MUST be a `com.semanticops.spec/concept` record. Every leaf MUST be a record of one of the leaf Types in Change B.
>
> **[R2]** A leaf MUST have exactly one `contains` parent, and that parent MUST be a `concept`. A `concept` MUST have at most one `contains` parent.
>
> **[R3]** Reading order among the children of one parent MUST be the Rule [N+12] order over the `precedes` edges among those children. The reading order of the exposition MUST be the pre-order traversal of the Parts in root-container order.
>
> **[R4]** A prerequisite MUST be stated as a `depends-on` edge from concept to concept. A leaf MUST NOT be the source of a `depends-on` edge.
>
> **[R5]** A `depends-on` edge whose source and target lie in different strongly connected components MUST point to a concept that is earlier in the reading order. An edge inside one component is not a forward reference.
>
> **[R6]** The members of a non-trivial strongly connected component MUST be adjacent in the reading order: siblings with no other sibling between them, or one member the `contains` parent of the others.
>
> **[R7]** A Part MUST be a root concept that is a non-identity member of the root container. Each Part MUST have one Part container whose `anchorInstanceId` is the Part and whose declared membership equals the Part's subtree. Every non-Part concept MUST be reachable from a Part by `contains`.
>
> **[R8]** A `depends-on` edge between concepts in different Parts MUST point to an earlier Part. A non-trivial strongly connected component MUST lie within one Part.
>
> **[R9]** An `invariant` record's `contains` parent is the concept it constrains. The generated invariant index MUST group by that parent, in reading order. This supersedes RFC-016 [R6].
>
> **[R10]** A prose field of a spec-authoring record MUST NOT contain a markdown heading, a fenced code block or a standalone horizontal rule. Structure is records and relations; code is an `example` record; tabular data is a `table` record.
>
> **[R11]** No record of Type `section` or `subsection` MAY be created after this RFC is accepted. Existing records are migrated by srs#561 to srs#564.
>
> **[R12]** A conforming reader MUST derive navigation below the root container and heading depth in a rendered document from the `contains` tree, at `contains` depth, in reading order.
>
> **[R13]** The `precedes` chain over the tree is the semantic (or temporal) reading order and is a claim about the concepts and leaves. A Composition MAY sequence the same nodes in a different order for presentation; that sequence MUST NOT be read as a competing claim about the concepts' semantic order, and where a Composition's order differs from the tree's `precedes` order, the tree's order is authoritative for what the elements assert about each other. A Composition MUST NOT present a parent-child shape that differs from `contains`; `ext:views-l2` compositions are flat, so an alternate hierarchy is not expressible under this RFC (Door 2, out of scope).

---

## Schema changes

**None.** No file in `srs/docs/schema/2.0/` changes. `dataModelRevision` stays at 7. The changes are Type definitions and records inside the `com.semanticops.spec` authoring package (`srs/package/spec-authoring-core/`): one new Type (`mechanism`), `identityFieldId` set on the leaf Types, `applies_to` removed from `invariant`, and `section`/`subsection` deprecated. No schema mirror in `srs-rust` or `srs-vscode` is touched.

---

## Rationale

**Three canonical relations, because every traversal already reads them.** `container_service::member_ids` walks `contains` transitively; `tree_service` recurses over it with depth limiting and cycle pruning; `container-subset` sections resolve through it; `sort_by_precedes_chain_diagnosed` orders any sibling set by `precedes`. A new relation type would need every one of those to learn it. `depends-on` is the canonical prerequisite edge, and "presupposes" would have been a second name for it.

**Type as role, because a Type is what SRS has for saying what a record is.** An `exposition_role` field on a `subsection` would be a select value telling the reader what kind of thing the record is, while the Type system stands beside it doing the same job. That is the E4/`semanticObjectType` proving case again.

**Components, not concepts, because the corpus said so.** The design was run as a falsifiable experiment before this RFC was written (srs#558 owner ruling 2026-09-06). Three cycles are real: a Type's normative content is assignment content and a FieldAssignment is "a Field reference within a Type"; a Relation is invalid until its type resolves to an installed definition whose `key` is the string the Relation stores; the conformance claim is literally `Core [+ ext:<name>]`. Ordering the condensation keeps "reads in layers" true and stops pretending an order exists inside the pairs. It cost 44 additive records to learn instead of a Parts I to IV rewrite that would have failed to order three pairs and never known why.

**A leaf that can contain becomes a node, so [R2] stays as written, with the escape hatch recorded rather than taken (owner ruling, PR #620 comment 5568325871).** An `example` illustrating one `mechanism` is that mechanism's next sibling, never its child, because nesting a leaf under a leaf would mean a leaf can have children — and then "what is a node?" needs two rules (the Type test in Change A for concepts, plus a has-children test for leaves that turn out to contain something), which is the one-way-per-goal violation this design exists to avoid. The shared concept parent already carries the semantic claim that the mechanism and its example belong together; only their nearest-neighbour position is presentational. If that positional association ever needs to be structural instead — if "this example belongs to that mechanism" must be checkable independent of sibling order — the fix is a *relation between siblings*: `example` `refines` its `mechanism` (RFC-022 supersession semantics already cover "a more detailed / illustrative version of"), never a second contains-parent or a leaf that contains a leaf.

**Parts as containers, because Parts are selection, not meaning.** A Part groups a subtree for navigation and rendering. That is a declared selection on the EXPRESSION plane, which is what a Container is (`rfc-decision-0750c62f`). Putting a `layer` field on the records would have moved a selection into the meaning layer, which layer rule 1 forbids.

**Invariants inline with a generated index, because one source beats two.** The owner decided at planning (srs#556): inline with the mechanism, index generated. `applies_to` was the prose form of the `contains` edge.

**Examples as records, because CommonMark spends 28% of its length on 655 examples that double as its conformance suite** and SRS had zero `example` records against 112 fenced blocks. The record is addressable, diffable and countable; the fenced block inside a string is none of those.

---

## Alternatives Considered

### Alt A: the original srs#556 design (two fields, three relation types)

`exposition_role` and `layer` on `section`/`subsection`; `introduces`, `presupposes` and `constrains` relation types. Retired by the owner's ruling (srs#556, 2026-09-05), each for a stated reason:

| Proposed | Ruling | Reason |
|---|---|---|
| `exposition_role` field | not needed | the leaf's Type is its role |
| `layer` field | not needed | Part membership in the tree is the layer |
| `introduces` relation | not needed | placement in the tree is the introduction |
| `presupposes` relation | not needed | canonical `depends-on` means exactly this |
| `constrains` relation | not needed | an invariant's `contains` parent is what it constrains; `applies_to` retires with it |

Four mechanisms beside existing ones failed one-way-per-goal; three canonical relations pass it.

### Alt B: keep `subsection`, add `mechanism` as a role value

Rejected. A role value on a generic prose Type is `exposition_role` under another name. The Type is the role.

### Alt C: order concepts, break the cycles by deleting an edge

Rejected by the experiment's brief: report a cycle, never resolve one by deleting an edge. Each of the three cycles is a mutual definition the corpus already renders together. Deleting an edge would hide the fact the reader most needs.

### Alt D: a `Part` Type or a navigation taxonomy

Rejected. RFC-013 excludes a navigation taxonomy; a Part is a root concept plus a container over its subtree, both existing constructs. A `Part` Type would be a concept that is not allowed to be anything else.

### Alt E: nested compositions as the depth mechanism

Settled since Rev 1, not by a new ruling but by inspection: srs#574 asked whether depth needs a depth-aware `render_section` or nested `DocumentSection`. srs-rust#969 found `render_service::render_record_at_level` already recurses `contains` children at `heading_level + 1` — the depth-aware mechanism already existed and needed no code change. Nested `DocumentSection` was never built and is not needed for depth; it remains the Door 2 question for an alternate *hierarchy* (the known limit recorded in Change A), not for depth, which this RFC's output constraint (one heading per node at tree depth) already covers with the shipped mechanism.

---

## Compatibility

Nothing breaks in the core or in any other repository. No core schema, invariant or extension changes; `dataModelRevision` stays at 7; the `srs` binary needs no change to validate a migrated corpus, because `contains`, `precedes` and `depends-on` are installed canonical relation types and `mechanism` is an ordinary package Type.

What changes in the spec repository. Rev 1 measured 2026-09-06, before srs#561–#564 began landing; Rev 2 re-measures 2026-09-07 (`check-spec-coherence.mjs`, `srs repo map`, `srs record list`) rather than trusting the Rev 1 numbers — the migration this RFC describes is already landing additively, ahead of and independent of this RFC's acceptance, which is why several counts already moved:

| Set | Rev 1 (2026-09-06) | Rev 2 (2026-09-07) | Disposition |
|---|---|---|---|
| `section` records | 10 | 10 (unchanged) | become concepts or dissolve into Parts (srs#561, srs#563) |
| `subsection` records | 65 | 65 (unchanged) | retyped to `mechanism` or split into several leaves (srs#562); `mechanism` Type not yet minted |
| `invariant` records | 119 | 125 | gain one `contains` parent each; `applies_to` value drops (srs#564); `applies_to` field still present on the Type as of this measurement |
| `example` records | 0 | 68 | already being created under Change C ahead of this RFC; fenced-block migration is in progress, not yet complete |
| fenced code blocks in prose (all spec records) | 112 | 112 (unchanged total, redistributed) | mostly moved out of `section`/`subsection` content already (2 of 112 remain there; most of the rest sit in `generated-type-reference` (31, a generator projection, exempt) and `example` (71)) |
| baked headings in leaf records | 159 (in 21 section/subsection records) | 122 (in 23 leaf records; `check-spec-coherence.mjs` check 5, landed since Rev 1 as srs#560) | become records (srs#562) |
| `generated-type-reference` records | 30 | 30 (unchanged) | re-parented from sections to concepts (srs#563) |
| `design-note` records | 45 | 43 | gain a `contains` parent (srs#563); the rationale composition is unchanged |
| `extension` records | 10 | 10 (unchanged) | re-parented under the Extensions Part (srs#565) |
| `concept` records | 44 | 44 (unchanged) | more are added for concepts the tree needs (srs#561) |
| `contains` / `precedes` / `depends-on` edges | 159 / 137 / 90 | 395 / 178 / 90 | `contains` and `precedes` grew as concept-to-leaf edges were added under srs#561–#564; `depends-on` (the prerequisite graph srs#608 measured) is unchanged; `check-spec-coherence.mjs` reports 395 records with a `contains` parent, 0 with more than one, 348 leaves with a home and 0 without |
| Part containers | 0 (illustrative only) | 10 (existing RFC-013 section containers; not yet re-anchored to the illustrative nine-Part list) | `check-spec-coherence.mjs` check 4 reports this vacuous until srs#563 hangs the concept tree under the Parts |

`docs/spec/srs-spec.md` changes. Heading levels are corrected, reading order moves, and invariants render inline. The RFC integration gate's `I-<n>` tokens still resolve because the invariant records keep their numbers and directory. `check-invariant-placement` is unchanged. `check-publication-reachability` needs its exclusions re-seeded once the compositions change.

Consumers of the rendered markdown (`srs.semanticops.com`, the schema mirrors' documentation links) see a re-ordered document; no consumer reads the retired `section` Type by id.

---

## Open Questions

None open as of Revision 2. The owner ruled on all five Rev 1 questions (PR #620 comment 5568325871, 2026-09-05) and the ruling is folded into the sections above rather than left standing here:

1. **Cell naming** — settled as `cell:containment, cell:reference` (Charter alignment, above), with the standing practice recorded: cells are chosen and then refined by periodic cross-reference at the grid census, not derived once and fixed; a mis-seated statement gets re-homed there, and work is not held for cell certainty.
2. **Part list** — settled: the illustrative nine-Part list (Change D) is accepted as the starting point; the checks ([R7], [R8]), not the list, are what this RFC binds. The final list stays srs#563's.
3. **Index grouping** — settled: the generated invariant index groups by containing concept ([R9], Change E), superseding RFC-016 [R6].
4. **Leaf parent restricted to concepts** — settled: [R2] is kept as written. The escape hatch is recorded, not taken (Rationale, above): a structural example-to-mechanism association is a sibling `refines` relation, never a leaf nested under a leaf.
5. **`section`/`subsection` disposal** — settled: deprecate then remove (Change B), as written.

Everything this RFC depends on that was still open when Rev 1 was drafted is now closed: RFC-034 is Accepted, srs#573 and srs#574 are both resolved in the reconciliation above (Change D, Change G, Alt E), and the owner's layered-order clause is folded into Change A and [R13]. Nothing raised against this RFC's design is outstanding; what remains is execution — srs#561 through srs#565 carrying out Changes B through E on the corpus, which this RFC does not gate on.
