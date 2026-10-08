> **GitHub issue**: [the-greenman/srs#851](https://github.com/the-greenman/srs/issues/851)

# RFC-048: Compositions name no content — remove container-id literals from section sources

**Status**: Draft (Revision 1)
**Affects**: `Composition` / `DocumentSection` / `SectionSource` (`container-subset` and `discovery-query` variants); `Container.childContainerIds` (now read by a renderer scope); `docs/schema/2.0/composition.json`; package validation (a new content-id check); the spec-authoring Compositions `spec-document-view` and `unified-document-view`; the gallery example package and `gallery.srsj`; downstream Compositions in `muDemocracy.org`. Builds on **RFC-043 (Accepted)** (rulings E, M, P, Q), **RFC-034 (Accepted)** (declared child containers), **RFC-042 Revision 5 (Accepted)** (`containerScope`), and supersedes nothing.
**Author**: design draft for the-greenman/srs#851 (owner: "It's important.")
**Date**: 2026-10-08

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-08 | Initial draft. Opened from srs#851. `depthOffset` is explicitly out of scope (owner ruling 2026-10-08, filed as srs#911). |

---

## Charter alignment

**Cell(s):** cell:containment, cell:reference, cell:description, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Containment: declaration over location.** Aligned. Which containers make up a document is declared once, on the content side (`childContainerIds`), not repeated as ids inside every template that renders it.
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
- No recorded decision requires a container literal in a Composition.

**One-way-per-goal:** The goal is "a Composition reaches the containers it renders". Today two mechanisms serve it: the literal (`containerId`, `containerIds`) and the rendered-container binding RFC-043 added for arranged sections. This RFC collapses onto the second and removes the first. To reach *several* containers it does not add a third mechanism: it reads the one existing declared container-to-container edge, `childContainerIds` (RFC-034 Change B, "the one place a Container references another Container"). It deliberately does **not** reuse `anchorInstanceId`, which is the typing anchor (RFC-009) and not a nesting edge.

**Layer test:**
- **Which layer owns this?** EXPRESSION plane, composition layer (the Composition) reading the MEANING plane's instances layer (the Container). The content-id rule is checked by the OPERATION plane's package validator.
- **Consume or clone downward?** Consume. The Composition reads the Container's declared edges through the reference taxonomy and no longer carries a copy of a Container id.
- **Does the layer below stand alone without this?** Yes. Containers, records and relations are valid with every Composition absent. This RFC removes a lower-layer fact (a container id) from the upper layer; it adds nothing to the lower one except the data change in Change D (the spec root declares its Parts as children).

**Consequence map (complex).** The decision touches Containment (where the document's parts are declared), Reference (how a template points at them), Description (who owns each part's heading) and Portability (whether the package travels). Three options were plotted:

| Option | Containment | Reference | Description | Portability | Column coherence |
|---|---|---|---|---|---|
| A. Children scope over the declared edge (recommended) | declared once on the root | rule over a declared edge | heading comes from the child container's title | package fully portable | Earth: structure declared, not inferred. Holds. |
| B. Content-side `sectionId` labels on each child edge | declared, plus a label per edge | a label match (label over identifier) | each Composition section keeps its own title | portable, but needs a new edge shape | Earth rule "identifier over label" strained. |
| C. One Composition per Part, container supplied at render | declared outside the document | none | titles lost, document assembly leaves the standard | portable, but the whole-document view disappears | Fails: no spec document. |

Emergence: Option A makes `childContainerIds` carry rendering meaning for the first time, which also changes what "effective membership" of the spec root means (Change D, "What breaks"). That is the one emergent effect; the owner is asked to rule on it (Decision 1).

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

Other id-typed fields in the schema (`renderViewId`, `typeDispatch` values, `titleFieldId`, `ordering.fieldId`, `CompositeRendererDirective.fieldId`/`roles`, `ExactTypeRef.typeId`, `themeId`) reference *definitions* (Views, Fields, Types, Themes), which are package contents and travel with the package; they are not content ids and stay. The other schema files that mention instance or container ids (`blueprint.json` has one mention) were not found to hold a binding position; the validator in Change A is defined on the Composition and the check enumerates positions, so a later addition is a visible edit and not a silent gap. In `muDemocracy.org` a code search finds 15 `muSrs` Compositions mentioning `container-subset` with `containerId` (plus 5 exploration copies); the exact count of literal sites is not measurable from search results and RFC-043 counted 6 sections in `muDemocracy.org`. The exact inventory is an acceptance step (Rev 1 does not claim a number).

### Problem 3 — the allowlist is a debt with an expiry

RFC-043 ruling P keeps the 24 literals alive behind an enforced allowlist (`scripts/check-composition-container-literal.mjs`, `scripts/composition-container-literal-allowlist.json`), registered with `expiry: srs#851`. That is deliberate and correct; it is not a destination.

---

## Proposed Changes

### Change A — a package names no content id

A package artifact MUST NOT contain an instance id or a container id in any position that selects or binds content. For Compositions, the positions are exactly the three in the inventory above. The package validator reports an error for each. The consequence: a Composition becomes valid in any repository, and the only thing that can break it is a missing *definition* (a View, a Field, a Type), which the package already declares as dependencies. What it forbids: a one-off Composition written for one specific container. Such a Composition is applied to that container at render time instead (the render operation's container parameter), which already works.

### Change B — `containerId` may be omitted on any `container-subset` section

RFC-043 allowed omission only on an arranged section. This RFC allows it on every `container-subset` section: absent always means the container being rendered. If the render supplies no container and the section has none, the section is an error diagnostic and renders nothing (unchanged from RFC-043). The literal stays *schema-valid* so that old packages still load, but it is a Change A error, so no new or maintained package may carry it. The consequence: the "rendered container" binding becomes the only way a Composition reaches a container, which is the one-way-per-goal outcome.

### Change C — a `children` container scope for multi-container documents

`containerScope` gains one value, `children`. A `container-subset` section with `containerScope: "children"` and no `containerId` renders, in `childContainerIds` order, each declared child container of the rendered container as a nested section titled by that child container's title, one heading level deeper, using the section's `ordering`, `typeFilter`, `typeDispatch` and other directives for each child. The rendered container's own direct members are **not** rendered by this section (so the Part anchor records that sit in the spec root are not printed). `children` differs from `subtree` in exactly that: `subtree` renders the container's own members and then descends; `children` renders only the children. It follows declared edges only, never `contains` Relations, and does not recurse past one level; a child that has its own children is a nested document of its own and is reached by that child being the rendered container.

To make this work with arrangement, RFC-043 [R10] is amended: `ordering.source: "arranged"` is permitted with `children` (the existing ban on combining it with `subtree` is unchanged), because each child renders by its own arrangement and there is no depth interleaving between the rendered container and its children. The consequence: `spec-document-view` shrinks from nine sections to one.

### Change D — data migration for this repository

- The spec root container (`manifest.container`) declares its nine Part containers in `childContainerIds`, in the order the document currently renders them. The Part containers already exist (`srs/containers/part--*.json`); only the edge is new.
- `spec-document-view` and `unified-document-view` each replace their nine sections with one `children` section.
- The gallery example: `articles-and-roles` has two sections that differ in ordering (articles by article number, roles unordered), which a single `children` section cannot express. It is split into two Compositions, `articles` and `roles`, each applied to its own container at render time. `decision-deliberation` drops its one literal. `gallery.srsj` is rebuilt from the package.
- The enforced allowlist file, its registry row in `scripts/checks.json`, and `check-composition-container-literal.mjs` are replaced by the Change A check, which has no allowlist.
- `muDemocracy.org` Compositions are migrated by the same rule in that repository's own change; this RFC states the rule and owns no edit there.

The migration of repository data is a CLI/registry operation (`srs-rust`); the corpus gate validates it. The shape-changing parts (`composition.json`, the `children` scope) are the only binary-visible change, so a binary that predates this RFC rejects a Composition using `children`; that requires a `dataModelRevision` decision (Decision 3).

---

## What this does not guarantee

- It does not decide how a Container obtains its `childContainerIds`; that stays an authoring act on the content side.
- It does not make heading text identical to today's. A Part's heading becomes its Container's title, `Part: Foundations`, not the Composition's `Foundations` (Decision 2).
- It does not change `depthOffset` (srs#911).

---

## Conformance Rules

> **[R1]** A package artifact MUST NOT contain an instance id or a container id in a selection or binding position. For a Composition the positions are `container-subset.containerId`, `discovery-query.containerIds[]`, and `discovery-query.query.containerId`. A validator MUST report an error for each occurrence, checkable from the package alone.
>
> **[R2]** A `container-subset` section MAY omit `containerId` regardless of `ordering.source`. When omitted it binds to the container supplied to the render operation. If none is supplied the section MUST produce an error diagnostic and render nothing. (Replaces RFC-043 [R10]'s restriction of omission to arranged sections.)
>
> **[R3]** `containerScope: "children"` MUST be valid only on a `container-subset` section with no `containerId`. It MUST render each container named in the rendered container's `childContainerIds`, in that order, as a nested section one heading level deeper, titled by the child container's title, and MUST NOT render the rendered container's own direct members. It MUST follow declared edges only and MUST NOT recurse.
>
> **[R4]** `ordering.source: "arranged"` MAY be combined with `containerScope: "children"`; each child renders by its own arrangement. It MUST NOT be combined with `"subtree"` (RFC-043 [R10], unchanged).
>
> **[R5]** The check that enforces [R1] MUST NOT carry an allowlist. A repository that cannot yet comply is not valid.
>
> **[R6]** Rendering a Composition that has no literal MUST produce the same output in any repository holding an equivalent container graph; it MUST NOT depend on an id embedded in the Composition.

---

## Schema changes

| Schema file | Change |
|---|---|
| `composition.json` | `containerScope` enum gains `children`; the `container-subset` `containerId` description is rewritten (omission is allowed on any section; a literal is a [R1] error); RFC-043's arranged/subtree constraint text is amended per [R4]. No property is removed, so older Compositions still parse. |

If the owner chooses to retire the literal properties from the schema entirely instead of leaving them as validator errors (Decision 4), `containerId` and `containerIds` would be removed from `SectionSource`, which is a breaking change to the schema and a `dataModelRevision` bump.

Schema changes must be synced to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` via their sync pipelines after this RFC merges.

---

## What breaks

- **This repository:** the 24 literal sites above (18 + 3 + 3). All are migrated by Change D; rendered `docs/spec/**` is regenerated with the pinned CLI and **changes**: Part headings read `Part: …` unless Decision 2 is ruled otherwise, and the document gains one heading level where the nested section sits.
- **Effective membership of the spec root changes.** Declaring the nine Parts as children makes the root's effective membership (RFC-034 [R3], the recursive closure over `childContainerIds`) include every record in the nine Parts. Any discovery query scoped to the root's effective membership, and any consumer that treats the root's effective set as "the root's own records", sees more. Decision 1.
- **`muDemocracy.org`:** at least 15 `muSrs` Compositions mention container-subset with a container id; the literal count is to be measured at implementation.
- **Binaries:** a build that predates `children` rejects a Composition using it. Nothing breaks for Compositions that do not use it.
- **Third-party packages** carrying a literal become invalid under [R1]; the error names the section.

---

## Rationale

The literal exists because a section needs *some* way to reach a container, and the document-of-parts shape (one Composition, many Parts) was the only shape that needed more than the rendered container. Every other literal in the corpus is either a single-container Composition (solved by Change B, because the container is supplied at render time) or a Part list (solved by Change C). Reusing `childContainerIds` keeps one container-to-container edge in the standard; adding a role or label to that edge, or reaching Parts through their anchor records, would give containers a second way to reference each other.

## Alternatives Considered

### Alt A — label each child edge with a `sectionId` (content-side binding)

Each section keeps its own title and finds its container by a label carried on the edge. Rejected as the recommendation because it adds a field to the one edge the standard keeps minimal, and because it matches by label where the Identity cell prefers identifier over label. Its real advantage, exact titles, is also available by renaming the Part containers (Decision 2).

### Alt B — reach Parts through their anchor records

The Part records are members of the root, and each Part container is anchored on its record. A section could say "the container anchored on each member of this type". Rejected: `anchorInstanceId` is the typing anchor and "declared, never positional" (RFC-009); using it for nesting would create a second container-to-container path.

### Alt C — one Composition per Part

Rejected: the whole-document view, the reason for the spec Compositions, would no longer exist in the standard.

### Alt D — keep the allowlist

Rejected: ruling P set an expiry, and a standing allowlist is the mimicry the process rules forbid.

---

## Open Questions

1. **Decision 1.** Is it acceptable that declaring the Parts as children widens the spec root's effective membership? Recommendation: yes, because the Parts *are* part of the document the root represents, and no current check uses the root's effective set as the root's own records (to be confirmed by running the corpus checks before acceptance).
2. **Decision 2.** Part headings: accept the container title (`Part: Foundations`), or rename the nine containers to the headings the Compositions use today? Recommendation: rename the containers, so the rendered headings stay as they are and the title lives in one place.
3. **Decision 3.** Does `children` require a `dataModelRevision` bump (9 → 10), which gates older binaries, or is an additive enum value sufficient? Recommendation: no bump; it is an additive value on an optional property, and RFC-042 Revision 5 added `containerScope` values the same way.
4. **Decision 4.** Leave `containerId`/`containerIds` in the schema as validator-rejected properties, or remove them in a breaking schema change? Recommendation: leave them, so old packages load and the error names the section.
5. **Decision 5.** Split `articles-and-roles` in the gallery example into two Compositions, or keep one and give up per-container ordering? Recommendation: split.
