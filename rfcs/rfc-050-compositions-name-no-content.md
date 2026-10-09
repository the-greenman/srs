> **GitHub issue**: [the-greenman/srs#851](https://github.com/the-greenman/srs/issues/851)

# RFC-050: Compositions name no content — remove container-id literals from section sources

**Status**: Draft (Revision 3)
**Affects**: `Composition` / `DocumentSection` / `SectionSource` (`container-subset` and `discovery-query` variants); `Container.childContainerIds` (read by a renderer scope; its meaning and unordered status are unchanged); `docs/schema/2.0/composition.json`; package validation (a new content-id check); the spec-authoring Compositions `spec-document-view` and `unified-document-view`; the gallery example package and `gallery.srsj`; downstream Compositions in `muDemocracy.org`. Builds on **RFC-043 (Accepted)** (rulings E, M, P, Q), **RFC-034 (Accepted)** (declared child containers), **RFC-042 Revision 5 (Accepted)** (`containerScope`, nested-section placement). It amends RFC-043 [R9] and [R10] (Door 3, Revision 12) and adds a third `containerScope` value to RFC-042 Revision 5 [R20]-[R23] (Door 3, RFC-042 Revision 6): [R22] and [R23] apply to `subtree` only, and a `children` section renders each child as a top-level section at `2 + depthOffset` with no lead-content treatment, its anchor appearing as an ordinary member of its child. It executes RFC-043 ruling P; it supersedes no recorded decision.
**Author**: design draft for the-greenman/srs#851 (owner: "It's important.")
**Date**: 2026-10-08

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-08 | Initial draft. Opened from srs#851. `depthOffset` is explicitly out of scope (owner ruling 2026-10-08, filed as srs#911). |
| 3 | 2026-10-08 | Review round 2 (1 blocking, 3 should-fix, 2 nits). Effective-membership figure corrected to 533 (the nine anchors are in both sets); RFC-042 [R20]-[R23] and RFC-043 [R9] named in the amendments with the `subtree`-only scoping of [R22]/[R23]; the gallery `articles` Composition takes a new id and the old one is deleted (no literal-bearing copy survives, so [R5] holds); [R6] defines "equivalent" and names three fixtures; an anchor that is not a member of the rendered container's arrangement goes to the tail with a diagnostic. |
| 2 | 2026-10-08 | Review round 1 (Integrity: 4 blocking, 5 should-fix; Completeness: 3 blocking, 6 should-fix). **Blocking:** `children` no longer reads `childContainerIds` order (RFC-034 [R3] forbids it): it reuses RFC-042's anchor-position placement rule, so RFC-034 is not amended; the heading levels of a `children` section are now stated and the "gains one level" contradiction is removed; `discovery-query` gets a rendered-container binding instead of losing its scope; Composition versioning and the gallery split are specified; the root's effective-membership change now has numbers (10 direct entries to 542). **Should-fix:** [R1] narrowed to the Composition positions; behaviour of a literal on read; edge cases; landing order and pin choreography; a before/after sketch; muDemocracy.org wording. |

---

## Charter alignment

**Cell(s):** cell:containment, cell:reference, cell:description, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Containment: declaration over location.** Aligned. Which containers make up a document is declared once, on the content side (`childContainerIds`, positioned by anchor), not repeated as ids inside every template that renders it.
- **Reference: declared strength over convenient reach.** Aligned. A literal container id in a template is a PINNED reference to content from a layer that is supposed to hold only type-layer rules. This RFC replaces it with a rule over the rendered container's declared edges.
- **Description: one name over many.** Aligned. The section title stays the Composition's; the container is found by declaration, not by a second copy of its id.
- **Portability: preserve over recognize.** Aligned. A package that names a container id travels to a repository where that id does not exist; a rule over declared edges travels intact.

**Axis preference:**
- **6–12 Containment/Portability, Portability over Possession.** Default pole taken: a template that carries a content id is captive to the repository it was written in.
- **5–11 Succession/Conformance, Reliability over Renewal.** Default pole taken. Standing contracts hold: RFC-043's ruling P allowed the 24 literals "for now" with an enforced expiry, and this RFC is the explicit supersession at a declared boundary that ruling anticipated. It does not drop the ruling early; it executes it.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-0750c62f, rfc-decision-8948e43f, rfc-decision-c8704763, rfc-decision-5f8204bc, rfc-decision-7caca3a1, rfc-decision-e99a9437.

**Contradictions found:**
- RFC-043 ruling E made the `containerId` literal *optional only on an arranged section*, and [R10] bans `ordering.source: "arranged"` together with `containerScope: "subtree"`. Both are rules this RFC amends (Door 3 on RFC-043, Revision 12, same PR). They are not recorded `rfc-decision-*` rulings, so no successor decision record is needed to amend them, but the amendment is named here so it is not silent.
- RFC-043 ruling P ("allowed for now, expiry #851") is not contradicted; it is executed. Its allowlist and registry row are deleted by the implementation that follows acceptance, as ruling P requires.
- RFC-034 [R3] ("MUST NOT infer an ordering from ... `childContainerIds` order") is **honoured, not amended**: the `children` scope positions each child by its anchor record's place in the parent's arrangement, exactly as RFC-042 Revision 5 already does for `subtree`.
- RFC-042 Revision 5 [R21] defines `containerScope` as two values on `container-subset`; this RFC adds a third (Door 3, RFC-042 Revision 6, same PR).
- No recorded decision requires a container literal in a Composition.

**One-way-per-goal:** The goal is "a Composition reaches the containers it renders". Today two mechanisms serve it: the literal (`containerId`, `containerIds`) and the rendered-container binding RFC-043 added for arranged sections. This RFC collapses onto the second and removes the first. To reach *several* containers it does not add a third mechanism: it reads the one existing declared container-to-container edge, `childContainerIds` (RFC-034 Change B, "the one place a Container references another Container"). It deliberately does **not** reuse `anchorInstanceId`, which is the typing anchor (RFC-009) and not a nesting edge.

**Layer test:**
- **Which layer owns this?** EXPRESSION plane, composition layer (the Composition) reading the MEANING plane's instances layer (the Container). The content-id rule is checked by the OPERATION plane's package validator.
- **Consume or clone downward?** Consume. The Composition reads the Container's declared edges through the reference taxonomy and no longer carries a copy of a Container id.
- **Does the layer below stand alone without this?** Yes. Containers, records and relations are valid with every Composition absent. This RFC removes a lower-layer fact (a container id) from the upper layer; it adds nothing to the lower one except the data change in Change D (the spec root declares its Parts as children).

**Consequence map (complex).** The decision touches Containment (where the document's parts are declared), Reference (how a template points at them), Description (who owns each part's heading) and Portability (whether the package travels). Three options were plotted:

| Option | Containment | Reference | Description | Portability | Column coherence |
|---|---|---|---|---|---|
| A. Children scope over the declared edge (recommended) | declared once on the root | rule over a declared edge | heading comes from the child container's title | package fully portable | Holds: structure is declared on the content, not inferred. |
| B. Content-side `sectionId` labels on each child edge | declared, plus a label per edge | a label match (label over identifier) | each Composition section keeps its own title | portable, but needs a new edge shape | Strained: a label stands where the standard prefers an identifier. |
| C. One Composition per Part, container supplied at render | declared outside the document | none | titles lost, document assembly leaves the standard | portable, but the whole-document view disappears | Fails: no spec document. |

Emergence: declaring the Parts as children of the spec root changes what the root's effective membership contains, from 10 entries to 533 (Change D, "What breaks"). That is the one emergent effect, and the owner is asked to rule on it (Decision 1). In plain terms for the two Options B names: B would add a label to the one container-to-container edge, and the standard prefers identifiers over labels (the Identity cell, `rfc-decision-cce3c00e`).

---

## Abstract

A Composition is a type-layer template and must not name specific content. RFC-043 removed record ids from Compositions (`memberOrder`) and made an arranged section bind to the container being rendered, but left one leak: a `container-subset` section may still hold the literal id of a specific container. This RFC makes "a package artifact names no instance or container id" a normative rule with a validator check, lets every `container-subset` section omit `containerId` and bind to the container being rendered, and adds one new `containerScope` value, `children`, so one section can render every declared child container of the rendered container. The 24 literals in this repository and the Compositions in `muDemocracy.org` are migrated, and the enforced allowlist from RFC-043 ruling P is deleted.

---

## Motivation

### Problem 1 — a template that names content

`spec-document-view` and `unified-document-view` each contain nine `container-subset` sections, one per Part of the specification, and each section carries the UUID of that Part's Container. Those UUIDs exist only in this repository. The Composition is shipped as a package definition, so it names content that a different repository, or a copy of this one, does not have. This is the same layer leak RFC-043 removed for record ids (`rfc-decision-9ee14517`, layer rules 1 and 5: a layer must stand alone with the layers above it absent, and a concern expressed in two layers is drift).

### Problem 2 — the leak is wider than one field

Inventory of every field in the Composition schema that can hold an instance or container id (checked against `docs/schema/2.0/composition.json`):

| Position | Holds | Literals today in this repository |
|---|---|---|
| `container-subset` source, `containerId` | one Container id | 24 (18 in the two spec Compositions, 3 in the gallery example package, 3 in `gallery.srsj`) |
| `discovery-query` source, `containerIds[]` | Container ids | 0 |
| `discovery-query` source, `query.containerId` | one Container id | 0 |

Other id-typed fields in the schema (`renderViewId`, `typeDispatch` values, `titleFieldId`, `ordering.fieldId`, `CompositeRendererDirective.fieldId`/`roles`, `ExactTypeRef.typeId`, `themeId`) reference *definitions* (Views, Fields, Types, Themes), which are package contents and travel with the package; they are not content ids and stay. No other schema file was found to hold a content-id binding position; the validator enumerates positions, so a later addition is a visible edit and not a silent gap. In `muDemocracy.org` a code search finds 15 `muSrs` Compositions that mention `container-subset` together with `containerId` (plus 5 copies under `explorations/`). A text search cannot say how many of those are literals; RFC-043 counted 6 sections. This RFC does not claim a number: measuring the literal sites is a named acceptance step, owned by the implementation issue in `muDemocracy.org`, and acceptance is blocked on it. The `the-spine-reader` Composition RFC-043 names lives in `muDemocracy.org`, not in this repository, which is why it is not among the 24. The released `com.mudemocracy.governance` packages (1.0.0 to 1.2.1) in this repository's `packages/` carry a Composition with the same id as the gallery's `articles-and-roles` (`78b11038`) but with no literal; they are unaffected.

### Problem 3 — the allowlist is a debt with an expiry

RFC-043 ruling P keeps the 24 literals alive behind an enforced allowlist (`scripts/check-composition-container-literal.mjs`, `scripts/composition-container-literal-allowlist.json`), registered with `expiry: srs#851`. That is deliberate and correct; it is not a destination.

---

## Proposed Changes

### Change A — a package names no content id

A Composition MUST NOT contain a container id in a position that selects or binds content. The positions are exactly three: `container-subset.containerId`, `discovery-query.containerIds[]` and `discovery-query.query.containerId`. The package validator reports an error for each, and the check applies to a Composition wherever it travels: in a repository package, in an installed copy, in a `.srspkg` bundle, and in a `.srsj` archive. It runs at package validation. No other artifact kind (Field, Type, View, Blueprint, Theme, Protocol, Lifecycle) has such a position today; authors of a new artifact kind SHOULD NOT add one. The consequence: a Composition is valid in any repository, and the only thing that can break it is a missing *definition* (a View, Field or Type), which the package already declares. What it forbids: a one-off Composition written for one specific container; that Composition is applied to its container at render time instead, which already works.

**A literal that is already present** (an old package) still loads. It is honoured with a diagnostic, and the container supplied to the render still overrides it, as RFC-043 ruling Q keeps. So old packages behave exactly as today and the diagnostic says what to remove.

### Change B — `containerId` may be omitted on any `container-subset` section

RFC-043 allowed omission only on an arranged section. This RFC allows it on every `container-subset` section: absent always means the container being rendered. If the render supplies no container and the section has none, the section is an error diagnostic and renders nothing (unchanged from RFC-043). The same rule applies to `discovery-query`: where `containerIds` and `query.containerId` are absent and `containerScope` is `explicit` or `subtree`, the section is scoped to the rendered container (today it falls back to `explicit` with a diagnostic and has no meaning for "the rendered container"); `repository` is unchanged. The consequence: the rendered-container binding becomes the only way a Composition reaches a container, which is the one-way-per-goal outcome.

### Change C — a `children` container scope for multi-container documents

The `container-subset` variant of `containerScope` gains one value, `children` (the `discovery-query` enum is unchanged). A `container-subset` section with `containerScope: "children"` and no `containerId` renders the **declared child containers of the rendered container**, and nothing of the rendered container itself. In prose, the rules are these.

- **Which children, and in what order.** The children are the containers named in the rendered container's `childContainerIds`. Their order is **not** read from that array (RFC-034 [R3] forbids it and this RFC does not amend [R3]). Each child is placed where RFC-042 Revision 5 already places a nested section: at the position of its `anchorInstanceId` among the rendered container's own arranged entries, and a child with no anchor, or whose anchor is not a member of the rendered container's arrangement, renders after every anchored child, by container title and then `containerId` (with a diagnostic in the second case). For the spec root this means the root's arrangement orders the nine Parts, which is the order they have today.
- **What a child renders.** Each child renders as a **top-level section**, not as a nested one: its heading is the child container's `title`, at the level a section title has today (level `2 + depthOffset`), and its members' headings are one level below that (`3 + depthOffset + entry depth`), exactly as the nine hand-written sections render them now. The child renders its **own** members by its **own** arrangement. The anchor record is not given a separate lead-content rendering by `children`: it appears once, as a member of its child, where it already is.
- **What the section's own directives do.** `ordering`, `typeFilter`, `typeDispatch`, `titleFieldId`, `renderViewId`, `emptyBehavior`, `required`, `relationsPresentation` and `compositeRenderers` apply to each child exactly as they would to a section naming that child. The section's own `title` is not printed (the children print theirs); the schema does not require one.
- **What it does not do.** It does not descend: a child that itself declares children is not descended into (none of the nine Parts does), and it can be rendered as a document of its own by supplying it as the rendered container. A record that is a member of two children renders in each. An empty `childContainerIds`, or a child left empty by `typeFilter`, is handled by `emptyBehavior` like any empty section. An unresolvable child id is already invalid under RFC-034 [R7].

To make this work with arrangement, RFC-043 [R10] is amended: `ordering.source: "arranged"` is permitted with `children` (the ban on combining it with `subtree` is unchanged), because each child renders by its own arrangement and nothing interleaves.

The consequence: `spec-document-view` shrinks from nine sections to one, and its rendered headings keep their levels. The one change to the text is the Part heading wording (Decision 2).

*Before and after, in words.* Before: nine `container-subset` sections, each with its own title and its own container id, all arranged. After: one `container-subset` section, no container id, arranged, with `containerScope` `children`; and in the repository's content, the spec root container lists its nine Part containers in `childContainerIds`.

### Change D — data migration for this repository

- The spec root container (`manifest.container`) declares its nine Part containers in `childContainerIds`. Each Part's anchor record is already a direct member of the root, so RFC-034's coherence expectation (a child's anchor is in the parent's direct members) already holds. The array order is irrelevant and is not rendered from.
- `spec-document-view` and `unified-document-view` (both at version 1) each take version 2 and replace their nine sections with one `children` section. `rationale-document-view`, `spec-glossary` and `rfc-document-view` carry no literal (the allowlist has no entries for them) and are unchanged.
- The gallery example: `articles-and-roles` has two sections that differ in ordering (articles by article number, roles unordered), which a single `children` section cannot express, and the gallery has no parent container that declares the two as children. It is split: the old `articles-and-roles` Composition (`78b11038`) is deleted from the example, and two new Compositions with new ids, `articles` and `roles`, replace it. A new id also avoids any clash with the unrelated `78b11038` Composition in the released `com.mudemocracy.governance` packages, and leaves no literal-bearing copy for the [R5] check to find. Each is applied to its container at render time (`--container`). `decision-deliberation` drops its one literal and likewise renders when a container is supplied. `gallery.srsj` is rebuilt from the package. The gallery loses its single combined "articles and roles" view; that is acceptable here because it is an example and not the whole-document view the spec Compositions exist for (Alt C).
- The enforced allowlist file, `check-composition-container-literal.mjs` and its `scripts/checks.json` row are replaced by the [R1] check, which has no allowlist ([R5]). The allowlist's own `reason` text cites "ruling M" where the ruling is P; the file is deleted, so no fix is needed.
- `muDemocracy.org` Compositions are migrated by the same rule in that repository's own change; this RFC states the rule and owns no edit there.

**Landing order.** `children` is a shape an older `srs` binary rejects, so this follows the revision-bump choreography in order: (1) `srs-rust` supports `children` (renderer, validator, fixture test); (2) a release cuts with the corpus gate green; (3) the spec PR merges with the schema change; (4) one pin advance, `SRS_RUST_CLI_TAG`, in the same PR that moves the spec Compositions onto `children` and re-renders. Until step 4 the spec Compositions stay on the nine-section shape. The Change A check and the allowlist deletion land with step 4.

---

## What this does not guarantee

- It does not decide how a Container obtains its `childContainerIds`; that stays an authoring act on the content side.
- It does not make heading text identical to today's. A Part's heading becomes its Container's title, `Part: Foundations`, not the Composition's `Foundations` (Decision 2).
- It does not change `depthOffset` (srs#911).
- It does not give `childContainerIds` an order. Placement comes from anchors.

---

## Conformance Rules

> **[R1]** A Composition MUST NOT contain a container id in `container-subset.containerId`, `discovery-query.containerIds[]` or `discovery-query.query.containerId`. A validator MUST report an error for each occurrence, from the Composition alone, in a repository package, an installed copy, a `.srspkg` bundle and a `.srsj` archive. On read, a literal that is present MUST still be honoured with a diagnostic, and the container supplied to the render MUST override it (RFC-043 ruling Q).
>
> **[R2]** A `container-subset` section MAY omit `containerId` regardless of `ordering.source`; absent, it binds to the container supplied to the render. A `discovery-query` section whose `containerIds` and `query.containerId` are absent and whose `containerScope` is `explicit` or `subtree` binds to the same container. If none is supplied the section MUST produce an error diagnostic and render nothing. (Replaces RFC-043 [R10]'s restriction of omission to arranged sections.)
>
> **[R3]** `containerScope: "children"` is valid only on a `container-subset` section with no `containerId`. It MUST render each container named in the rendered container's `childContainerIds` as a top-level section titled by the child container's title, with the members' headings one level below, positioned by each child's anchor record in the rendered container's arrangement (a child with no anchor, or whose anchor is not in that arrangement, after every anchored child, by title then `containerId`), and MUST NOT read an order from the `childContainerIds` array. It MUST NOT render the rendered container's own direct members, MUST NOT descend into a child's own children, and MUST apply the section's directives to each child.
>
> **[R4]** `ordering.source: "arranged"` MAY be combined with `containerScope: "children"`. It MUST NOT be combined with `"subtree"` (RFC-043 [R10], unchanged).
>
> **[R5]** The check that enforces [R1] MUST NOT carry an allowlist. A repository that cannot yet comply is not valid.
>
> **[R6]** A render of a Composition with no container literal MUST depend only on the container supplied and that container's declared edges. "Equivalent" means isomorphic modulo container and instance ids, with the same titles, anchors, entry order and depths. A conformance fixture MUST render one Composition in two such repositories and compare the outputs, and MUST include three scenarios: a permutation of the `childContainerIds` array, which MUST give identical output (proving RFC-034 [R3] is honoured); a child with no anchor, which MUST render at the tail; and `depthOffset` greater than 0, which MUST shift the child titles and member headings by the same amount.

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `composition.json` | the `container-subset` `containerScope` enum gains `children` (the `discovery-query` enum is unchanged); the `container-subset` `containerId` and the `discovery-query` `containerIds` descriptions are rewritten (omission is allowed; a literal is an [R1] error); RFC-043's arranged/subtree text is amended per [R4]. No property is removed. | None: every existing Composition still parses. |
| `container.json` | None. `childContainerIds` keeps its meaning and its "order carries no meaning" text. | None. |

If the owner chooses to remove `containerId` and `containerIds` from the schema instead of leaving them as validator-rejected properties (Decision 4), that is a breaking schema change.

Schema changes must be synced to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` via their sync pipelines after this RFC merges.

---

## What breaks

- **This repository:** the 24 literal sites (18 in the two spec Compositions, 3 in the gallery example package, 3 in `gallery.srsj`). All are migrated by Change D. Rendered `docs/spec/**` is regenerated with the pinned CLI. Heading levels do not change; the Part headings read `Part: …` unless Decision 2 is ruled otherwise.
- **The spec root's effective membership grows from 10 entries to 533.** The root has 10 direct entries (its identity record and nine Part anchors); the nine Parts hold 532 records (11 + 108 + 27 + 43 + 143 + 81 + 73 + 32 + 14), and effective membership is the deduplicated closure over `childContainerIds` (RFC-034 [R3]), and the nine anchors are in both sets: 10 direct + 532 in the Parts - 9 shared anchors = 533. Anything that reads the root's *effective* set sees 533. Consumers to check before acceptance, each by running it: discovery queries scoped to the root, the slice closure (RFC-026), `containers_for_instance`, `check-publication-reachability.mjs`, the part-container membership check, and the root identity and navigation rules (RFC-043 [R12]). This has not been run for Rev 2, so Decision 1 stays open rather than being asserted.
- **`muDemocracy.org`:** the literal count is unmeasured (see Problem 2); acceptance waits on it.
- **Binaries:** a build that predates `children` rejects a Composition using it; the landing order above keeps the pinned build rendering the old shape until the pin advances.
- **Third-party packages** carrying a literal still load and render with a diagnostic, and fail the [R1] check.
- **Gallery:** the single combined articles-and-roles view is gone, replaced by two Compositions with new ids; nothing in the repository references the removed id (the `78b11038` id in `packages/` is a different Composition).

---

## Rationale

The literal exists because a section needs *some* way to reach a container, and the document-of-parts shape (one Composition, many Parts) was the only one needing more than the rendered container. Every other literal is either a single-container Composition (solved by Change B, because the container is supplied at render time) or a Part list (solved by Change C). Reusing `childContainerIds` and RFC-042's anchor placement keeps one container-to-container edge and one placement rule; adding a role or label to the edge, or reaching Parts by their anchor records alone, would give containers a second way to reference each other.

## Alternatives Considered

### Alt A — label each child edge with a `sectionId` (content-side binding)

Each section keeps its own title and finds its container by a label on the edge. Rejected as the recommendation: it adds a field to the one edge the standard keeps minimal, and it matches by label where the Identity cell prefers identifier over label. Its real advantage, exact titles, is also available by renaming the Part containers (Decision 2).

### Alt B — reach Parts through their anchor records without a declared edge

Each Part container is anchored on a record in the root. A section could say "the container anchored on each member of this type". Rejected: `anchorInstanceId` is the typing anchor and "declared, never positional" (RFC-009); using it as the nesting edge would create a second container-to-container path.

### Alt C — one Composition per Part

Rejected: the whole-document view, the reason for the spec Compositions, would no longer exist in the standard.

### Alt D — keep the allowlist

Rejected: ruling P set an expiry, and a standing allowlist is the mimicry the process rules forbid.

### Alt E — reuse `subtree` with an "omit own members" flag

Would say what `children` says by a second route (`subtree` plus a modifier), and `subtree` nests one level deeper and gives a Part's anchor lead-content treatment, which changes headings. Rejected as a second way to say the same thing.

### Alt F — read `childContainerIds` array order

Would give the array an order meaning RFC-034 [R3] forbids and every merge and canonicalisation tool treats as a set. Rejected; anchor placement gives the same order with no change to those tools.

---

## Open Questions

Truly open (need the owner): Decisions 1 and 2. Decisions 3 to 5 carry a recommendation the draft already assumes; they are stated so the owner can overrule them.

1. **Decision 1 (not decided until the consumers listed in "What breaks" have been run).** Is it acceptable that declaring the Parts as children grows the spec root's effective membership from 10 to 533? Recommendation: yes, because the Parts *are* part of the document the root represents; the consumers listed in "What breaks" must be run first and any one that breaks is a blocker.
2. **Decision 2.** Part headings: accept the container title (`Part: Foundations`), or rename the nine containers to the headings the Compositions use today (`Foundations`)? Recommendation: rename the containers, so the rendered headings stay as they are and the title lives in one place. Cost: nine container titles change; no script or package in this repository reads the `Part: ` prefix (searched). If the owner prefers the prefix, the rendered `docs/spec` text changes in nine headings in each of two documents and nothing else.
3. **Decision 3.** Does `children` bump `dataModelRevision`? Recommendation: no. It is an additive value on an optional property; the landing order above keeps the pinned build rendering the old shape until the pin advances, and an older binary meeting `children` fails with a clear validation error rather than rendering something wrong. A bump would gate older binaries more strictly at the cost of a migration entry with nothing to migrate.
4. **Decision 4.** Leave `containerId`/`containerIds` in the schema as validator-rejected properties, or remove them? Recommendation: leave them, so old packages load and the error names the section.
5. **Decision 5.** Split `articles-and-roles` in the gallery (Change D) or keep one and give up per-container ordering? Recommendation: split.
