> **GitHub issue**: [the-greenman/srs#198](https://github.com/the-greenman/srs/issues/198) (Revision 9: [the-greenman/srs#886](https://github.com/the-greenman/srs/issues/886); Revision 10: [the-greenman/srs#894](https://github.com/the-greenman/srs/issues/894))

# RFC-026: ext:slices — Container Slices (Subset Repository Export)

**Status**: Accepted (Revision 10)
**Affects**: `ext:repository` (new optional `slice` manifest block); `docs/schema/2.0/manifest.json` (add `slice` property and `$defs.Slice`, `$defs.SliceSpec`, `$defs.SliceExternalRef`); from Revision 9, the package set a slice carries (RFC-003 reference strengths, RFC-044 `packageDependencies`) and the slice root's identity entry (RFC-043 [R2])
**Author**: the-greenman (from issue the-greenman/srs#194)
**Date**: 2026-07-20
**Builds on**: RFC-017 (`.srs` archive format, Change D determinism, archive_pack/archive_unpack)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 9 | 2026-10-04 | Door 3 amendment encoding the owner rulings of 2026-10-04 on the srs-rust#631 design checkpoint (the-greenman/srs#886). **Packages carried whole (ruling D1, option P3):** Change C item 3 ("type and field definitions ... copied into the slice archive's `package/` directory as a self-contained definition set, even if sourced from multiple packages") is replaced: a slice carries every package of the source's package set that its content uses, whole and byte-for-byte unchanged, at its source path, keeping each package's identity (`id`, `version`) and boundary. "Used" is defined by an algorithm: seeds are included records' Types and included relations' relation types, followed through the RFC-003 PINNED and LINEAGE reference sites, then closed over every definition of every used package and over RFC-044 `packageDependencies` satisfied in the source, transitively. The source's primary package is always carried, and a package at the repository root is refused (`slice-root-level-package-unsupported`). A What breaks subsection is added. The matching "What is excluded" bullet, [R11], [R13], Change E item 2 and the remaining-errors list are re-worded; the slice manifest's package references list exactly the carried packages; new rule [R15]. **Root identity (ruling D2):** export is refused with `slice-root-identity-invalid` when the boundary container's identity entry is not a depth-0 entry without descendants (RFC-043 [R2]); the outline is never rewritten; [R12] amended, new rule [R16]. **Empty containers (ruling D3), spec finding, moot under I-151:** the sub-container subset test of Change C item 6, as written here and restated in Revision 8, is vacuously true for a container with no entries, so every empty container in the source would join every slice; recorded as history. Under I-151 an undeclared empty container is never carried, and a declared child with no entries is carried. **Correction found while folding:** Change C items 2 and 6 were replaced by RFC-034 [R9] at that RFC's acceptance (2026-09-06, Invariant I-151: the slice carries the closure root, its transitive `childContainerIds` descendants and the root's effective member set, never an unrelated container that happens to be a subset), but this text was never marked, and Revision 8 re-stated the replaced subset rule. The RFC-034 rule is marked as the one in force. **Owner ruling of 2026-10-04 on Open Question 2: the accepted RFC-034 [R9] / Invariant I-151 container rule stands.** I-151 is the rule for slice closure: the boundary's members plus the members of its declared `childContainerIds` descendants, and exactly those declared descendant containers are carried. Change C items 2 and 6 are marked superseded by RFC-034 [R9]. srs-rust#631 (ADR-051) shipped the package rule stated here, plus an always-carried primary package and the `slice-root-level-package-unsupported` refusal, which are folded; the implementation (srs-rust#631, with srs-rust#1259 amended) conforms to I-151. The dogfood findings and unmade refusals were Open Questions 4 to 6, resolved by the owner on 2026-10-04: **Q4 adopted** (with a `slice` block, Invariant I-81, a root identity record that is not a `purpose` record, is reported at info, added to Change E item 5 and [R17]); **Q5 closed with no change** (under I-151 the srs-rust#1259 re-run produced no I-82 warnings for any muSrs container; they came only from the superseded subset rule carrying undeclared containers, so I-82 keeps its severity, to be reopened if a real slice shows it; *superseded by Revision 10: a real slice showed it, and I-82 is now info inside a slice*); **Q6 adopted** (new refusals `slice-definition-identity-conflict` and `slice-package-outside-repository`, written nothing, new rule [R18], tracked by srs-rust#1263); **Q3 deferred** (no current case needs it). **Editorial finding:** Revision 8's repeat-until-stable step adds nothing at revision 8, because the subset test and the ids it adds are the same set; no behaviour changes. **Expected absences (ruling 4):** Change E item 5 lists the three diagnostic classes (a Composition naming a Container outside the slice; `rootTypeRefs` matching no Container in the slice; Invariant I-81 on the slice root, added by the Q4 ruling) that are info, not warning, on a slice; rule [R17] *(Revision 10 adds a fourth, Invariant I-82)*. **Owner-accepted default folded:** source documents referenced by included relations' `sourceRefs` are carried (Change C item 5). Charter alignment added. No schema property added or changed. Review round 1 (Spec Integrity: 2 blocking, 10 should-fix; Completeness: 4 blocking, 7 should-fix) folded; round 2: 0 blocking, 3 should-fix folded. |
| 10 | 2026-10-05 | Door 3 amendment encoding the owner ruling of 2026-10-05 that reopens Open Question 5 (the-greenman/srs#894). **Invariant I-82 is info inside a slice:** with a `slice` block present, I-82 (RFC-013, a root container member that anchors no container) is reported at severity info, not warning. It is added to Change E item 5 as class (iv); item 5, [R13] and [R17] now say four classes. Rationale: a real slice shows it. The essay snapshot of srs-web#465 validates with 0 errors and two I-82 warnings, for its document-state and comment members. They are members of the bundle and anchor no container, which is expected for a content slice, the same reasoning as the Q4 ruling on I-81. **Open Question 5 is resolved by this ruling** (Revision 9 had closed it with "I-82 keeps its severity", to be reopened if a real slice showed it); the Revision 9 statements that I-82 keeps its severity are superseded. The Validators line of What breaks is updated. Implementation is tracked by srs-rust#1276. No schema property added or changed. |
| 8 | 2026-10-01 | Door 3 amendment executing RFC-043 (the-greenman/srs#849, accepted): amends Change C steps 1, 2 and 6, Rule [R5], and the "Container membership traversal is through `memberInstanceIds`" paragraph (closure reads entry ids and `rootInstanceIds` is removed; a slice keeps each contained container's entries for included records and drops excluded records' entries by the promoting removal, RFC-043 [R18], [R7]). Effective at `dataModelRevision` 8; the text above stays in force for revision-7 corpora until then. |
| 7 | 2026-09-12 | **Amended by RFC-038 [R25]** (tree-authoritative storage, srs#766). RFC-038 [R2] retires `manifest.containerIndex`/`instanceIndex`/`sourceDocumentIndex`; RFC-038's own stub record claimed this RFC's [R5]/[R6]/[R13] as folded against the tree-authoritative store, but the rule text and the surrounding closure prose still read verbatim against the retired properties, with no restating invariant — filed as srs#766. **[R5](a)** (`spec.id` boundary test) and **Change C steps 2 and 6** (member/sub-container traversal and the slice archive's own sub-container output) now resolve against the repository's tree-authoritative **container set**, not `containerIndex`; restated as invariant **I-152**. **[R6]** (relation-endpoint test) and **[R13]** (validator relaxations, Change E items 1/3/4) now resolve against the tree-authoritative **instance set** (and, for the container-completeness clause, the container set); restated as invariant **I-153**. Change C step 5 and Change E item 4 (source-document inclusion and tombstone relaxation) resolve against the source-document sidecar scan per RFC-038 [R25]'s existing RFC-017 [R2]/[R12] amendment (I-102, I-112) — no new invariant needed, the mechanism is already general. The Change B `spec.id` field description and the Schema changes section's embedded `SliceSpec` copy are corrected to match `docs/schema/2.0/manifest.json`'s already-current text (RFC-038's #297 cutover). No conformance behavior changes: every relaxation and boundary test means what it always meant against the authoritative store; only the retired-property vocabulary is corrected. |
| 6 | 2026-07-21 | Accepted; spec records authored in `srs/srs` — `ext:slices` extension record (`212379f4`), RFC-026 stub record (`efda4896`). |
| 5 | 2026-07-21 | **Remove package-boundary closure entirely; a package export is not a repository slice.** RFC-026 now defines container-membership closure only. Package export (distributing a package's *definitions* as a `package-bundle.json`) is a different artifact class, homed in RFC-003 (Subset package export). Changes: drop Change C (package closure) and renumber (container closure → C, dangling-edge policy → D, validation semantics → E); narrow `SliceSpec.type` to `["container"]`; remove the package conformance rule and the package branch of the `manifest.container` rule; update abstract, motivation, rationale, alternatives, and open questions. Supersedes the never-published Rev 4 (package-definitions-only-as-slice), which mis-modelled a package bundle as a records-free `.srs` repository. |
| 3 | 2026-07-20 | Fix new blocking issue from round 2 review: Change C item 5 sub-container rule — mixed-membership sub-containers MUST be excluded entirely (mirrors Change D item 6 rule). |
| 2 | 2026-07-20 | Address Stage 3 review findings. Blocking: (SI-1/C-11) qualify backward-compatibility claim — pre-RFC-026 validators will reject the `slice` property; (SI-2/C-2) add normative rule for `manifest.container` in package-boundary slices (filter source root's memberInstanceIds to included set); (SI-3/C-4) fix Change D item 2 — replace undefined "transitive contains relations from root container" with memberInstanceIds/rootInstanceIds traversal; (SI-6/C-1) redefine package-boundary `spec.id` as `PackageRef.packageId`, closure as Tier 2 Records by typeId namespace — remove ADR-033/PackageBoundarySnapshot references; (SI-7/C-3) add normative statement that closure root becomes `manifest.container` in container slices. Should-fix: (SI-4) add `manifest.properties` entry to schema diff; (SI-5) add `relationId` to `SliceExternalRef`; (C-5) add validator-directed conformance rule (R14); (C-6) add RFC-005 non-applicability note for `externalRelationRefs.relationType`; (C-7) add Field definition completeness rule for Type FieldAssignments; (C-8) fix Alt C RFC citation (RFC-005, not RFC-022). Nits: (SI-8) elevate Change C/D sub-steps to MUST language; (SI-9) add relationType format guidance; (SI-10/C-9/C-10) fix R8 producer-side scoping and both-endpoints clause, add tombstone handling, close OQ2 as resolved. |
| 1 | 2026-07-20 | Initial draft |

---

## Charter alignment

Added at Revision 9. RFC-026 predates the Charter Check (srs#463); this section covers the Revision 9 amendment, not the accepted Revisions 1 to 8. Revision 10 is a one-class extension of the same list (last paragraph).

**Cell(s):** cell:portability, cell:identity, cell:reference, cell:containment, cell:repository
**Decision mode:** complicated

The three choices were put to the owner as options at the srs-rust#631 design checkpoint and ruled on 2026-10-04. Each ruled option is the one the cell preferences already pick (table below), so the amendment resolves by rule: cell citation, governing preference and past-decision search. The author's own derivations, stated as such in the text, are: the closure of Change C item 3 steps 3 and 4, its edge cases, the relation-type seed, and the two expected-absence classes. Each follows from a ruling plus an existing rule ("whole", RFC-044, RFC-005, the prototype's diagnostics), and the owner's merge ratifies them. The one point that set a ruling against accepted text (a declared memberless child container, ruling D3 against RFC-034 [R9]) was put to the owner and ruled on 2026-10-04: I-151 stands, so there is no supersession.

**Governing cell preference:**
- Portability (♓): *preserve over recognize* (`rfc-decision-cce3c00e`, `rfc-decision-8948e43f`). Aligned. A slice carries each package it uses unchanged, so lifecycles, vocabularies, relation types, compositions, views, themes, blueprints and protocols travel with the records that need them. Under the Revision 8 text a slice of a record whose Type names a Lifecycle failed validation.
- Identity (♉): *identifier over label*. Aligned. A carried package keeps its `id` and `version`, and its content is the content that identity names. A pruned package that kept its identity, or a merged package that needed a new one, would be the one false or invented identity in the slice.
- Reference (♎): *declared strength over convenient reach* (`rfc-decision-c8704763`). Aligned. "Used" follows the PINNED and LINEAGE sites RFC-003 Change C already tabulates, plus the declared RFC-044 `packageDependencies`. It follows one KEYED site, an included relation's `relationType`, on purpose and says so: RFC-005 makes an unresolved relation type a validation error. It never follows a string that merely matches an id, and it does not follow tag keys.
- Containment (♍): *declaration over location*. Aligned. Which containers a slice carries is decided by declared `childContainerIds` edges (RFC-034 [R9], I-151), never by an unrelated container's entries happening to fall inside the slice. Revision 9 marks that rule as in force, so an empty container can no longer join a slice through a vacuous subset test.
- Repository (♑): *catalog over circumstance*. Aligned. The slice root's identity entry must already satisfy the root rule (RFC-043 [R2]). The export refuses rather than rewrite the outline to fit, so the slice says what the source says.

| Option (ruling D1) | Portability | Identity | Reference | Outcome |
|---|---|---|---|---|
| P1: keep boundaries, prune unreferenced Types and Fields | met | **violated**: a pruned package keeps `id@version` with different content | met | rejected (Alt G) |
| P2: merge into one `package/` (the Revision 8 text) | met only for Types and Fields | **violated**: the merged package has no defined identity; sub-package `packageDependencies` and `upstreamPackage` are lost | met | rejected (Alt H) |
| **P3: carry used packages whole (ruled)** | met | met | met | adopted |

**Axis preference:**
- 6–12 Containment/Portability: default pole (Portability over Possession) taken. The slice is the content-side travelling form `rfc-decision-8948e43f` names, and Revision 9 makes it carry every definition kind a container's records can use.
- 5–11 Succession/Conformance: default pole (Reliability over Renewal) taken. Boundary clause: *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* The standing contracts here are RFC-034 [R9] (I-151) and the RFC-003 reference-site table. Revision 9 marks the first as in force and cites the second; it rewrites neither. Ruling D3 is read inside RFC-034 [R9], and the one case where reading it literally would have amended [R9] was ruled by the owner on 2026-10-04: [R9] stands (Open Question 2, resolved).
- 2–8 Identity/Assertion: default pole (Evolution over Continuity) taken. No stored data changes (What breaks). The Continuity flip leaves these rules valid because they already preserve identity.
- 1–7 Versioning/Reference: default pole (Semantic Integrity over Practical Expression) taken. Package identity is never rewritten to make a slice smaller.

**Decisions consulted:** `rfc-decision-cce3c00e` (grid), `rfc-decision-8948e43f` (what a container can hold, a bundle can carry; RFC-026 is named as the content-side travelling form), `rfc-decision-c8704763` (reference strengths), `rfc-decision-a8dcbfe5` (RFC-003 Revision 10: the embedded core package is declared, not carried), `rfc-decision-0750c62f` (a Container is a declared selection; nesting declared through `childContainerIds`), `rfc-decision-0118e938` (one layer per construct), `rfc-decision-9ee14517` (layer rules), `rfc-decision-c20fcff8` (level test), `rfc-decision-7caca3a1` (decision modes), `rfc-decision-e99a9437` (doors), `rfc-decision-4431046e` (corrections and refinements), `rfc-decision-16b20c56` (Attribution: stated over assumed), `rfc-decision-4f1e12e5` and `rfc-decision-5f18603e` (federation removed, return committed; `externalRelationRefs` is unchanged). The decision-log search for `slice`, `snapshot`, `package identity`, `whole package` and `travelling` finds `8948e43f` as the only ruling that names slices.
**Contradictions found:** None with a decision record. Two with accepted RFC text: (1) this RFC's own Change C items 2 and 6 and its Revision 8 restatement contradict RFC-034 [R9] (I-151), which replaced them at its acceptance. This is corrected here as a fold that was never marked (a correction, `rfc-decision-4431046e`), not a change of position. (2) Owner ruling D3, read literally, would have dropped a declared memberless child that RFC-034 [R9] requires a slice to carry. The owner ruled on 2026-10-04 that RFC-034 [R9] / I-151 stands, so D3 is moot and nothing is superseded.

**One-way-per-goal:** The goal "which definitions does this content need" already has one mechanism, RFC-003's reference-strength closure. Revision 9 collapses onto it and does not keep a second, per-kind list (Change C item 3's "type and field definitions"). The goal "which containers does a slice carry" already has one rule, RFC-034 [R9]. Revision 9 marks it as the rule in force and retires this RFC's subset test, which was a parallel rule.

**Layer test:**
- Which layer owns this? The slice is an OPERATION-plane artifact rule: what a conforming exporter writes, and what a validator relaxes when it reads a `slice` block. It consumes the MEANING plane (packages, definitions, records, relations) and the EXPRESSION plane's selection layer (the boundary Container, `rfc-decision-0750c62f`).
- Consume or clone downward? Consume. Packages travel as packages (the RFC-014 package set, RFC-044 requirements), "used" is computed from the RFC-003 reference-site table, container closure is RFC-034's `effective(C)`, and the outline treatment is RFC-043 [R7]/[R18]. Nothing is re-implemented.
- Does the layer below stand alone without this? Yes. Packages, records and containers are unchanged and valid with no slice present. Revision 9 changes only what an exporter copies and how a validator rates diagnostics on a slice.

**Level test (`rfc-decision-c20fcff8`):** passes. [R15] is checkable by comparing each carried package's files with the source's and recomputing the used set; [R16] by offering a boundary container whose identity entry has a descendant; [R17] by reading diagnostic severities on a slice; [R18] by offering two source packages that define one `id` and `version` differently, and a carried local package outside the repository root.

**Revision 10 (srs#894, owner ruling 2026-10-05).** Cell: ♓ Portability. Decision mode: complicated. Decisions consulted: `rfc-decision-cce3c00e` (grid) and the Q4 ruling of Revision 9, whose reasoning it repeats for I-82. Governing preference: preserve over recognize. The diagnostic still reports the member that anchors no container, only at info inside a slice, so nothing is hidden. One way per goal: it joins the one list of Change E item 5, no second list. Layer test: a validator-severity rule on the OPERATION plane. The invariant itself, and its severity outside a slice, are unchanged. Level test: checkable by validating a slice whose root has a member that anchors no container, and the same tree without the `slice` block.

---

## Abstract

This RFC defines `ext:slices` — a normative extension that allows a *slice* of a source repository to be exported as a valid, independently openable `.srs` archive. A slice is a subset of the source: its content is determined by a **container-membership** *closure rule* applied to the source repository. The exported archive is format-identical to a whole-repository export (RFC-017) and carries a `slice` block in its manifest recording origin provenance. Any SRS tool can open, validate, and render a slice, provided its validator applies the Change E relaxations when a `slice` block is present. From Revision 9, a slice carries the packages its content uses, each whole and unchanged with its own identity. Its container closure is RFC-034's declared `childContainerIds` closure, and a boundary container whose identity entry cannot be a root identity is refused.

A slice is a **repository** subset — it has records, a root container, and its own repository identity. A *package export* — distributing a package's Type/Field **definitions** as a `package-bundle.json` — is a different artifact class (distributable, updatable metadata, not a repository) and is defined by **RFC-003 (Subset package export)**, not here. Record-level closure (an arbitrary set of records) is also out of scope and deferred.

---

## Motivation

> **Non-goal — package export.** Distributing a package's *definitions* (its Types and Fields) is a different artifact class: a `package-bundle.json` — a distributable, updatable metadata bundle — **not** a repository slice. A definitions-only bundle has no records and no root-container identity record, so it cannot be a valid `.srs` repository (RFC-013). Package export is defined by **RFC-003 (Subset package export)**. A container slice is the right tool only when you want the *records* that use a package's types — compose a container over those records and export it (Change C).

### Problem 1 — Container export has no portable representation

A clerk who owns a "Decision Log" container wants to export it — with its records, type definitions, and source documents — for archival, distribution, or review by a party without repository access. The `.srs` whole-archive format is the obvious carrier, but `archive_pack` (RFC-017) always exports the full repository. There is no defined format for a portable container extract.

### Problem 2 — No provenance marker for slice origin

Even if partial exports were produced ad hoc, a consumer opening the resulting archive has no normative way to know it is a slice, what source repository it came from, or what closure rule produced it. This gap makes slices unreliable as distribution artifacts: consumers cannot tell whether "missing" content is expected (by design of the closure rule) or accidental (corruption, truncation).

### Problem 3 — No defined semantics for dangling relations at export time

When a relation in the source repository connects an included record to an excluded record, the current spec provides no guidance on what to do. Without a normative dangling-edge policy, implementations diverge: some drop relations silently, some include them with broken targets, and some refuse to export. This makes slices non-portable across implementations.

---

## Proposed Changes

### Change A — `ext:slices` extension declaration

Define `ext:slices` as a new SRS extension. A repository that exports a slice in conformance with this RFC MUST declare `"ext:slices"` in the `declaredExtensions` array of the **slice archive's** manifest, not in the source repository's manifest. The source repository need not declare `ext:slices`; only the exported slice archive does.

### Change B — `slice` block in the manifest

Add an optional `slice` property to `manifest.json`. When present, it marks the archive as a slice (a partial export) rather than a whole-repository export. A pre-RFC-026 tool that schema-validates a manifest with `additionalProperties: false` will surface a schema error when it encounters the `slice` property; RFC-026-aware validators MUST apply the relaxations in Change E when this block is present.

**Shape:**

```json
"slice": {
  "origin": {
    "repositoryId": "<uuid of the source repository>"
  },
  "spec": {
    "type": "container",
    "id": "<containerId uuid>"
  },
  "exportedAt": "<ISO-8601 timestamp>"
}
```

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `origin.repositoryId` | `string (uuid)` | yes | The `repositoryId` of the source repository from which this slice was produced. |
| `spec.type` | `string` | yes | Closure rule applied. Currently the only defined value is `"container"` (container-membership closure). |
| `spec.id` | `string (uuid)` | yes | The boundary identifier: a `containerId` present in the source repository's container set (tree-authoritative enumeration, RFC-038 [R1]; amended by RFC-038 [R25] — the manifest's `containerIndex` is retired, RFC-038 [R2]; I-152). |
| `exportedAt` | `string (date-time)` | yes | ISO-8601 timestamp of when the slice was produced. |

The slice archive's own `manifest.repositoryId` MUST be a **new UUID**, distinct from `slice.origin.repositoryId`. A slice archive is a standalone repository — its `repositoryId` identifies the archive artifact, not the source repository.

**Revision 9: the rest of the manifest.** The slice manifest keeps every property of the source manifest except the ones this RFC rewrites: `repositoryId` (new, above), `container` (the closure root, Change C item 1), `declaredExtensions` (gains `ext:slices`, [R4]), `slice` (this block), and the package references `packageRef` and `packageRefs`, which list exactly the packages the slice carries (Change C item 3, [R15]). Each entry is copied unchanged from the source, and the entries for packages not carried are removed. `dataModelRevision` stays the source's. Any other source manifest property is copied as it is, with one exception. `upstreamPackage` (RFC-014) is copied only when the package it names is carried, and is omitted otherwise, because Invariant 84 requires a package reference with its `packageId`. *(Owner-accepted default, srs-rust#631, 2026-10-04; the `upstreamPackage` exception follows from Invariant 84.)*

### Change C — Container-membership closure

A container slice exports a container and all elements reachable from it through defined closure rules.

`slice.spec.id` for a container slice MUST equal a `containerId` present in the source repository's container set *(amended by RFC-038 [R25] — resolves against the container set, not `containerIndex`, which is retired per RFC-038 [R2]; I-152)*.

**Normative closure for a `spec.type: "container"` slice:**

The closure root is the container identified by `spec.id`. The following items MUST be included:

1. **`manifest.container`** — the closure root container identified by `slice.spec.id` MUST be set as the slice archive's `manifest.container`. This makes it the repository root container for the purposes of RFC-013. Its `containerId` is preserved from the source.

   *Revision 9 (owner ruling D2, 2026-10-04):* the closure root becomes the slice's root container, so RFC-043 [R2]'s root rule applies to it: "In the root container the entry named by `identityInstanceId` MUST be at depth 0 and MUST have no descendants." A non-root Container in the source need not meet that rule. Therefore, at `dataModelRevision` 8 and later, when the closure root has an `identityInstanceId` whose entry, as the Container stands in the source, is at a depth above 0 or has descendants, the exporter MUST refuse the export. The refusal is checked before anything is written; the exporter writes nothing, and it reports one diagnostic:
   - code `slice-root-identity-invalid`, severity error;
   - naming the Container (`containerId`), the entry (`identityInstanceId`) and the reason (`depth-nonzero` or `has-descendants`).

   The exporter MUST NOT re-depth, move or drop entries, and MUST NOT drop or reassign `identityInstanceId`, to make the outline fit. The user fixes the source: move the identity entry to depth 0 and its children elsewhere, or change `identityInstanceId`. Example: a Container whose identity record sits at depth 1 under a heading entry is refused; the same Container with the identity entry first at depth 0 exports.

   Cases outside this rule:
   - A closure root with no `identityInstanceId` is not refused.
   - An `identityInstanceId` naming no entry at all is already invalid in the source (RFC-043 [R3]).
   - RFC-043's pointer guard (an operation that would exclude a container's identity or anchor entry is rejected) cannot fire here, because every entry of the closure root is included (item 2).
   - At revision 7 there are no entry depths, and this rule does not apply.


2. **Member instances** *(superseded: replaced by RFC-034 [R9]; see the Revision 9 correction below. Kept as history.)* *(amended by RFC-038 [R25] — traversal resolves against the container set, not `containerIndex`, which is retired per RFC-038 [R2]; I-152)* — all instances appearing in the root container's `memberInstanceIds` and `rootInstanceIds` MUST be included. For each Container in the source repository's container set whose `rootInstanceIds` are a subset of the already-included instance set, that sub-container's `memberInstanceIds` MUST also be included. Repeat until no new instances are added. (This is membership traversal through the `memberInstanceIds`/`rootInstanceIds` fields of Container objects — `containerId` MUST NOT appear as a `Relation.sourceInstanceId` or `Relation.targetInstanceId` and therefore cannot be a Relation endpoint.)

> **Amended by RFC-043 (effective at `dataModelRevision` 8).** *(Its step 2 and step 6 sentences are superseded by RFC-034 [R9]; see the Revision 9 correction below. Its step 1 sentence and its last sentence, on keeping entries, stay in force.)* Change C steps 1, 2 and 6 read ids from entries. A Container has no `rootInstanceIds` (RFC-043 [R4]), and `direct(C)` is the set of `instanceId` values of `memberInstanceIds`, read flat and ignoring `depth` (RFC-043 [R3]). Step 1: the root container is set as `manifest.container` with its `containerId` preserved. Step 2: all instances whose ids are entries of the root container MUST be included, and for each Container in the source's container set whose entry ids are a subset of the already-included instance set, that sub-container's entry ids MUST also be included, repeated until no new instances are added. Step 6: a Container is included only when all of its entry ids are within the included instance set. In every container the slice contains, the slice MUST keep the entries for the included records and MUST drop each excluded record's entry by the promoting removal, so every container in the slice is a valid outline (RFC-043 [R18], [R7]). *(Prior text, in force until a corpus is at revision 8: "all instances appearing in the root container's `memberInstanceIds` and `rootInstanceIds` MUST be included. For each Container ... whose `rootInstanceIds` are a subset of the already-included instance set".)*

> **Correction at Revision 9: steps 2 and 6 were replaced by RFC-034 [R9] (in force since 2026-09-06, Invariant I-151).** RFC-034 replaced this RFC's Change C items 2 and 6 when it was accepted. Its Change D.3 reads: "For a container slice, RFC-026 Change C items 2 and 6 are replaced as follows: include `effective(root)` as the member-instance set; include the closure root Container and every Container reachable from it through `childContainerIds`; preserve those declared child edges in the exported Containers; and do not include an unrelated Container merely because its roots or members happen to be subsets of the included instance set." Yet but this text was never marked, and Revision 8 restated the replaced subset rule. The rule in force, at every revision, is RFC-034 [R9] (read at revision 8 per RFC-043):
>
> - The included instance set is `effective(root)`: the entry ids of the closure root, plus the entry ids of every Container reachable from it through `childContainerIds`, transitively (RFC-034 [R3]).
> - The slice carries the closure root and each Container reachable from it through `childContainerIds`, and it keeps the declared child edges among them.
> - It MUST NOT carry an unrelated Container only because that Container's entries happen to fall inside the included set.
>
> RFC-043 [R18]/[R7] then applies to every Container the slice carries, as stated above. Under `effective(root)` every entry of a carried Container is included, so the promoting removal acts only on an entry whose instance does not resolve in the source. The subset test above, in both its revision-7 and revision-8 wording, is not a conformance rule. A slice made by it is conformant only where the two rules happen to agree. That is a real difference in behaviour between the Revision 8 text and I-151, not something Revision 9 introduces: I-151 has governed since 2026-09-06.
>
> *Editorial finding (no behaviour change).* At revision 8 the subset test's repeat-until-stable step adds nothing. "Include the entry ids of each Container whose entry ids are a subset of the included set" adds ids that are already included, because the test and the addition are the same set. At revision 7 it could add ids, because it tested `rootInstanceIds` and added `memberInstanceIds`. The step therefore reduces to "the included set is the root's entry ids". RFC-034's `effective(root)` reaches the same set, plus the entries of declared descendants that are not also root entries. Those can exist: RFC-034 [R7] (read at revision 8) asks only that a child's anchor entry sit in its parent. A slice built by the subset test therefore omits the other entries of declared children, which I-151 requires it to include.

3. **Packages** *(replaced at Revision 9, owner ruling D1 option P3, 2026-10-04)*: the slice MUST carry every package of the source repository's package set (the packages its `packageRef` and `packageRefs` name) that the slice uses, **whole and unchanged**. A package's set of files is not filtered: unreferenced Types and Fields stay in. Its file bytes are not edited, its identity (`id`, `version`) is not changed, and it is not merged with another package. Each carried package keeps its own boundary at the same path, relative to the repository root, that it has in the source. A package the slice does not use MUST NOT be carried.

   **Which packages are used: the algorithm.**
   - Inputs: the included records and relations (items 2 and 4), and the source's effective package set (the RFC-014 union of its packages, with the RFC-029 core package).
   - Definition reach: every reference below is resolved in that effective set, exactly as the source resolves it. "Following" a definition means following its PINNED and LINEAGE reference sites as tabulated in RFC-003 Change C, transitively. For example, a Type brings its Fields, its Lifecycle (`lifecycleRef`) and its supertypes; a `ref` Field brings its target Type; a Field brings its Vocabulary (`vocabularyRef`).
   - Step 0, the primary package: the source's primary package (the one its `packageRef` names, or the first `packageRefs` entry, conventionally at `package/`) is always used, whether or not a record uses it. It is the repository's own package, and srs-rust#631 carries it unconditionally.
   - Step 1, seeds:
     - each included record's Type (`typeId`, `typeVersion`);
     - for each included relation, the RelationTypeDefinition its `relationType` key resolves to. A relation-type key is KEYED in RFC-003 and is not followed there. A slice follows it on purpose, because RFC-005 makes a relation whose type does not resolve a validation error, so a slice that left it behind would be invalid.
   - Step 2, follow: follow every seed. Every package that *provides* a reached definition (its package manifest lists it) is used.
   - Step 3, whole packages: every definition listed by every used package is followed in the same way, and the packages providing what it reaches are used.
   - Step 4, requirements: for each `packageDependencies` entry (RFC-044) of a used package, every package in the source's package set with that `packageId` whose `version` satisfies the entry under RFC-044's compatibility-band rule is used.
   - Repeat steps 3 and 4 until no package is added. The set is finite, so this terminates. The output is the used set, and the slice manifest lists it in the source's order (Change B).

   Seeds stop at records and relations. A Container references no definition: its `anchorInstanceId` and `identityInstanceId` name records, which are already seeds, and its `tags` are KEYED keys, which are not followed. Steps 0, 3 and 4 are derived from "whole", from RFC-044 and from what srs-rust#631 shipped (ADR-051), not separate owner rulings; the owner's merge of Revision 9 ratifies them.

   **Edge cases.**
   - *Several providers.* When more than one source package lists a definition with the same `id` and `version`, each provider is used. Two providers whose definitions under one `id` and `version` differ are an identity conflict in the source. The exporter MUST refuse it with `slice-definition-identity-conflict` and write nothing ([R18]; `rfc-decision-cce3c00e`: an identity conflict is fatal).
   - *Remote packages.* A package reference of mode `remote` (definitions expected pre-installed in the consumer's registry) takes part in the algorithm through the definitions the source's effective set holds for it. When used, it is carried as the same `remote` reference, not as files. The slice is exactly as self-contained as its source for that package: a consumer needs the same registry the source needs (a Portability caveat inherited from the source, not introduced by the slice).
   - *References that resolve nowhere.* A PINNED or LINEAGE reference that resolves in no package of the source is not an export failure. The exporter does not invent a package for it, and the slice reports the same unresolved-reference diagnostic the source does.
   - *A package at the repository root.* A local package whose package directory is the repository root itself cannot be carried as its own boundary, because its files cannot be told apart from the repository's. The exporter MUST refuse with `slice-root-level-package-unsupported` and write nothing. (A package path resolving outside the repository root is refused with `slice-package-outside-repository`, [R18].)
   - *The RFC-029 core package* is embedded by every implementation and needs no package reference (Invariant 85: "A conforming SRS implementation MUST make all `com.semanticops.core/*` types and fields resolvable in every repository without any `packageRef` or `packageRefs` declaration"). It is never carried. Core definitions are still followed in steps 2 and 3, so packages they reach are used. This matches RFC-003 Revision 10 (`rfc-decision-a8dcbfe5`).
   - *Unsatisfied requirements.* A `packageDependencies` entry that no package in the source satisfies stays unsatisfied in the slice. It yields the same `package-dependency-unsatisfied` warning there as in the source (RFC-044: never a load failure), and it is not an export failure.
   - *No package used.* When the used set is empty (only possible when the source declares no package), the slice manifest carries neither `packageRef` nor `packageRefs`. The records then use only core Types, which Invariant 85 makes resolvable.

   **Cost and consequence.**
   - A slice of one record whose Type sits in a large package carries that whole package. Through steps 3 and 4, it also carries every package the large one reaches, so a slice is never smaller than the packages its records use and can approach the source's whole package set.
   - The srs-rust#631 prototype (https://github.com/the-greenman/srs-rust/issues/631) sliced three muSrs containers from a source with 7 package boundaries, carrying packages whole. Every slice validated with 0 errors.
   - Carrying whole packages also publishes definitions the slicer may not have meant to share (Types, Compositions, Protocols unrelated to the exported records). A slice exported to share content shares its packages too.
   - In exchange, every carried package is the package its identity names. The slice's packages validate exactly as they do in the source, including lifecycles, vocabularies, relation types, compositions, views, themes, blueprints and protocols, none of which the Revision 8 text carried.

   *(Prior text, Revisions 1 to 8: "**Type and field definitions** — the field and type definitions instantiated by the included instances MUST be copied into the slice archive's `package/` directory as a self-contained definition set, even if sourced from multiple packages in the source repository. A definition MUST be included if at least one included instance references it by `typeId` or `fieldId`. Additionally, all Field definitions declared in an included Type's `fields[]` FieldAssignments MUST be included when that Type is included, regardless of whether individual instances carry values for those optional fields.")*

4. **Relations among included instances** — all relations whose both `sourceInstanceId` and `targetInstanceId` are in the included instance set MUST be included. Relations that span the closure boundary (one endpoint inside, one outside) MUST be excluded from the relations collection and recorded in `slice.externalRelationRefs[]` per Change D.

5. **Source documents** *(amended by RFC-038 [R25] — resolves against the source-document sidecar scan, not a manifest `sourceDocumentIndex`, which is retired per RFC-038 [R2]; this is RFC-017 [R2]/[R12]'s own amendment, I-102/I-112, applied here)* — all source-document sidecar entries referenced by included instances (via `sourceRefs[]` with `sourceType: "repository-document"`) MUST be included. Their `contentPath` files MUST be included unless the entry is in the tombstone state (content absent per RFC-017 [R12]), in which case the sidecar entry MUST be included and the absent content file MUST be omitted.

   *Revision 9 (owner-accepted default, srs-rust#631, 2026-10-04):* "referenced by included instances" also covers source documents referenced through the `sourceRefs[]` of an **included relation**. A relation carried into the slice brings the source documents it cites, under the same tombstone rule.

6. **Sub-containers** *(superseded: replaced by RFC-034 [R9]; see the Revision 9 correction under item 2. Kept as history.)* *(amended by RFC-038 [R25] — resolves against the container set, not `containerIndex`, which is retired per RFC-038 [R2]; I-152)* — any Container in the source repository's container set whose `rootInstanceIds` and `memberInstanceIds` are all within the included instance set MUST be included in the slice archive's container set. The slice archive's container set MUST NOT include any Container whose members extend beyond the included instance set.

   > **Revision 9: replaced by RFC-034 [R9] (I-151); spec finding on empty containers (owner ruling D3, 2026-10-04).** This item is replaced by RFC-034 [R9] (see the correction under item 2). The subset test it states, "all within the included instance set", is **vacuously true for a Container with no entries**. Read literally, it would put every empty Container in the source into every slice. The srs-rust#631 prototype hit this on a muSrs container with 0 entries. The owner ruled that a sub-container is carried only if it has at least one entry. Under the rule in force, an empty Container that is not a declared `childContainerIds` descendant of the closure root is never carried, whatever its entries, so the ruling holds without a further rule. A **declared** descendant with no entries is valid (RFC-034 [R7]: "A rootless child is valid"), and I-151 requires the slice to carry it and keep the edge to it. Ruling D3 is therefore moot under I-151 (owner ruling of 2026-10-04: I-151 stands): an undeclared empty container is never carried, and a declared child with no entries is carried with its edge kept. The vacuous-truth finding is kept as history.

**What is excluded:**

- Instances not in the included instance set (`effective(root)`, RFC-034 [R9]; see item 2).
- Containers that are neither the closure root nor reachable from it through `childContainerIds` (RFC-034 [R9]; see items 2 and 6).
- Packages of the source that the slice does not use (item 3, Revision 9). A carried package is never partial: unreferenced definitions inside a used package are carried.
- Source documents not referenced by any included instance or included relation.
- Relations with at least one endpoint outside the included instance set.

*(Prior text of the first three bullets, Revisions 1 to 8: "Instances not reached by the member traversal in item 2." "Containers not satisfying the sub-container rule in item 6." "Type and field definitions not referenced by any included instance (directly or via Type FieldAssignments)." The fourth read "Source documents not referenced by any included instance.")*

The exported archive MUST pass `srs repo validate` with the relaxations specified in Change E.

### Change D — Dangling-edge policy

When a relation in the source repository has one endpoint inside the closure and one endpoint outside it, that relation is a *dangling edge* at export time. Dangling edges MUST NOT appear in the slice archive's relations collection.

Dangling edges MUST instead be recorded in the `slice.externalRelationRefs` array in the slice manifest. Each entry records the `relationId`, `sourceInstanceId`, `targetInstanceId`, and `relationType` of the excluded relation, providing a complete provenance trace of what cross-boundary edges were cut at export.

```json
"slice": {
  "origin": { "repositoryId": "..." },
  "spec": { "type": "container", "id": "..." },
  "exportedAt": "...",
  "externalRelationRefs": [
    {
      "relationId": "<uuid>",
      "sourceInstanceId": "<uuid>",
      "targetInstanceId": "<uuid>",
      "relationType": "depends-on"
    }
  ]
}
```

An empty `externalRelationRefs` array (or omission of the field) indicates no edges were cut. A consumer MAY use `externalRelationRefs` for provenance tracing or to prompt the user that "this slice has N cross-boundary relations to the source repository"; it MUST NOT treat a non-empty list as a validation error.

Relations where both endpoints fall outside the closure MUST NOT appear in `externalRelationRefs` — those relations are simply absent from the slice.

The `relationType` field in `externalRelationRefs` entries is a provenance copy of the original relation's type string. It is NOT subject to RFC-005 definition-lookup requirements in the slice archive — the type definition for a cut relation's type may not be installed in the slice's package directory, and this is not an error.

This approach follows the ext:federation graceful-degradation contract: cross-boundary edges are not silently dropped; they are preserved as provenance data so the slice is inspectable and the cut is auditable without requiring access to the source repository.

### Change E — Validation semantics for slices

An RFC-026-aware validator MUST apply the following relaxations when the manifest being validated contains a `slice` block:

1. **`externalRelationRefs` UUIDs** *(amended by RFC-038 [R25] — resolves against the instance set, not `instanceIndex`, which is retired per RFC-038 [R2]; I-153)* — instance UUIDs appearing in `slice.externalRelationRefs` that are absent from the slice's instance set MUST NOT produce a validation error. An implementation MAY surface an informational (non-blocking) diagnostic noting the count of external references.

2. **Packages not carried** *(re-worded at Revision 9)*: a container slice carries only the packages it uses (Change C item 3). A validator MUST NOT require a source package that is absent from the slice, and its absence MUST NOT produce a diagnostic. *(Prior text: "**Incomplete package definitions** — for a container slice, the `package/` directory contains only the definitions referenced by included instances. The absence of definitions not referenced by any included instance MUST NOT produce a validation error.")*

3. **Incomplete container hierarchy** *(amended by RFC-038 [R25] — resolves against the container set, not `containerIndex`, which is retired per RFC-038 [R2]; I-152)* — a container slice need not include the source repository's full container set. A container set that covers only the exported sub-hierarchy MUST NOT produce a validation error.

4. **Tombstone source documents** *(amended by RFC-038 [R25] — resolves against the source-document sidecar scan, not a manifest `sourceDocumentIndex`, which is retired per RFC-038 [R2]; RFC-017 [R2]/[R12]'s own amendment, I-112, applied here)* — a source-document sidecar entry whose `contentPath` file is absent (tombstone state, RFC-017 [R12]) MUST NOT produce a validation error.

5. **Expected absences from whole packages** *(added at Revision 9, owner ruling 4, 2026-10-04)*: carried packages are whole, so they hold definitions written for the source's content, and some of that content is not in the slice. Exactly four diagnostic classes are expected absences in a slice, and a validator MUST report them at severity **info**, not warning or error:
   - (i) a Composition section source whose `containerId` or `containerIds` names a Container that is not in the slice's container set;
   - (ii) a Composition whose `rootTypeRefs` match no Container in the slice, where matching is RFC-009's: a Container whose `anchorInstanceId` record has one of those Types. The Types themselves still resolve, because item 3 carries them; only the Container that would match is absent;
   - (iii) Invariant I-81 (RFC-013), the root identity record is not a `purpose` record *(added by the owner ruling of 2026-10-04 on Open Question 4)*. A slice says what it is through its identity record, and every content slice, such as an essay snapshot, would otherwise warn.
   - (iv) Invariant I-82 (RFC-013), a root container member that anchors no container *(added by the owner ruling of 2026-10-05, Revision 10, which resolves Open Question 5)*. A slice is a bundle, and some of its members, such as a document-state or comment record in an essay snapshot, anchor no container. That is expected for a content slice. The essay snapshot of srs-web#465 validated with 0 errors and two I-82 warnings, for exactly those members. Outside a slice, I-82 keeps its warning.

   Classes (i) and (ii) are the ones the srs-rust#631 prototype produced; class (iii) is the Q4 ruling; class (iv) is the Q5 ruling of Revision 10. Every other diagnostic keeps its normal severity. In particular, a reference from one definition to another definition is never an expected absence: item 3's algorithm makes it resolve, and if it does not, it remains an error. A later revision adds a class here only by amending this list.

The following remain errors regardless of slice status:

- Any relation in the slice's relations collection whose `sourceInstanceId` or `targetInstanceId` is not in the slice's instance set *(amended by RFC-038 [R25] — not `instanceIndex`, which is retired per RFC-038 [R2]; I-153)*. (Dangling edges must go into `externalRelationRefs`, not the relations collection.)
- Any `typeId` referenced by an included instance that does not resolve to a definition in the slice's carried packages (or, for a core definition, in the RFC-029 core package).
- Any `fieldId` referenced by an included instance (directly or via a Type's FieldAssignment) that does not resolve to a definition in the slice's carried packages (or the RFC-029 core package).
- Any other definition-to-definition reference in a carried package that does not resolve. The package was valid in the source, and the slice carries it unchanged together with every package its references reach.

*(Prior text of the first two bullets, Revisions 1 to 8: "... does not resolve to a definition in the slice archive's `package/` directory.")*
- Any schema validation error on any included instance file.

**Implementation conformance (informative, Revision 9).** srs-rust#631 (branch `feat/631-slice-export`, ADR-051) implemented `srs slice export` and the WASM `export_slice` ahead of this revision, as srs-rust#1210 did for RFC-003 Revision 10. Its package rule is the one Change C item 3 states. It also refuses with `slice-exported-at-invalid` and `slice-repository-id-reused`, which enforce Change B and [R3]. Its validator reports [R3], [R10] and [R12] violations as errors and an undeclared `ext:slices` ([R4]) as a warning; it emits one info diagnostic with the cut-edge count (Change E item 1) and the two info classes of Change E item 5. The implementation (srs-rust#631 and srs-rust#1259, ADR-051) conforms to Invariant I-151 on container closure.

---

## Conformance Rules

> **[R1]** A slice archive MUST be a conformant `.srs` ZIP archive as defined by RFC-017 Change D (deterministic entry order, zeroed timestamps, Deflate-or-Store, empty extra fields, UTF-8 filenames). The slice format is not a new archive format — it is a whole-archive `.srs` with a subset of content.
>
> **[R2]** A slice archive's `manifest.json` MUST contain a `slice` block with: `slice.origin.repositoryId` (UUID of the source repository), `slice.spec.type` (currently the only defined value is `"container"`), `slice.spec.id` (the scoping boundary UUID — a `containerId`), and `slice.exportedAt` (ISO-8601 timestamp).
>
> **[R3]** A slice archive's `manifest.repositoryId` MUST be a new UUID, distinct from `slice.origin.repositoryId`. A slice is a standalone archive artifact with its own identity, not a renamed copy of the source repository.
>
> **[R4]** A slice archive MUST declare `"ext:slices"` in `manifest.declaredExtensions`. The source repository need not declare this extension.
>
> **[R5]** *(Amended by RFC-038 [R25] — (a)'s test and Change C's traversal resolve against the container set, not `containerIndex`, which is retired per RFC-038 [R2]; folded as invariant I-152.)* For a container slice (`spec.type: "container"`): the included instances, relations, type/field definitions, source documents, sub-containers, and `manifest.container` MUST conform to the normative closure defined in Change C. Specifically: (a) `spec.id` MUST be a `containerId` present in the source repository's container set; (b) `manifest.container` MUST be the closure root container identified by `spec.id`; (c) member traversal MUST follow the `memberInstanceIds`/`rootInstanceIds` fields on Container objects, not `Relation` edges from `containerId` values.
>
> **Amended by RFC-043 (effective at `dataModelRevision` 8).** [R5] (c) reads: member traversal MUST follow the `instanceId` values of the entries of `memberInstanceIds` on Container objects, not `Relation` edges from `containerId` values; there is no `rootInstanceIds` field. A slice MUST keep, in every container it contains, the entries for the included records and MUST drop each excluded record's entry by RFC-043 [R7] (RFC-043 [R18]). *(Prior text, in force until a corpus is at revision 8: "member traversal MUST follow the `memberInstanceIds`/`rootInstanceIds` fields on Container objects".)*
>
> **Revision 9 correction.** The included instances and sub-containers of [R5] are those of RFC-034 [R9] (I-151): `effective(root)`, and the closure root with its transitive `childContainerIds` descendants, keeping the declared edges. Change C's subset test is not a conformance rule (Change C, correction under item 2). The included packages are those of [R15].
>
> **[R6]** *(Amended by RFC-038 [R25] — the endpoint test resolves against the instance set, not `instanceIndex`, which is retired per RFC-038 [R2]; folded as invariant I-153.)* A conformant slice producer MUST NOT include in the slice archive's relations collection any relation with a `targetInstanceId` or `sourceInstanceId` that is not present in the slice archive's instance set. Such cross-boundary relations MUST be recorded in `slice.externalRelationRefs[]` instead.
>
> **[R7]** A conformant slice producer MUST populate `slice.externalRelationRefs[]` with every relation from the source repository that was excluded because exactly one endpoint fell outside the closure. This is a producer-side obligation: a consumer of the slice archive cannot verify completeness without access to the source repository. Relations where both endpoints fall outside the closure MUST NOT appear in `externalRelationRefs`.
>
> **[R8]** A conformant consumer MUST NOT treat a non-empty `slice.externalRelationRefs[]` as a validation error. The list is provenance data, not a defect.
>
> **[R9]** A slice archive MUST pass `srs repo validate` with the normative relaxations defined in Change E. Any validation error not covered by those relaxations is a real error.
>
> **[R10]** Container-membership closure (`spec.type: "container"`) is the only closure rule defined by this RFC. Record-level closure (`spec.type: "record"`) is deferred and MUST NOT be produced or accepted. A **package export is not a slice** — `spec.type: "package"` MUST NOT be produced or accepted; distributing a package's definitions is a `package-bundle.json` governed by RFC-003, not this RFC. An implementation encountering any unrecognised `spec.type` value MUST surface a diagnostic and MUST NOT silently ignore the `slice` block.
>
> **[R11]** *(Amended at Revision 9.)* A slice archive MUST carry the packages [R15] requires. A conformant consumer MUST resolve every definition reference from within the slice's carried packages (and the RFC-029 core package it embeds, and any `remote` package reference exactly as for the source), and MUST NOT require access to the source repository to validate or render the slice. A reference from one carried definition to another that does not resolve in the slice is an error. *(Prior text: "A slice archive MUST include a self-contained `package/` directory containing all type and field definitions referenced by the included instances (directly or via Type FieldAssignments). A conformant consumer MUST resolve `typeId`/`fieldId` references from within the slice archive's own package directory — it MUST NOT require access to the source repository's packages to validate or render the slice.")*
>
> **[R12]** A slice archive MUST have a valid `manifest.container` as required by RFC-013, and RFC-013 applies in full — `manifest.container` MUST be the closure root container identified by `slice.spec.id`, and its `identityInstanceId` (when present) MUST name a member. A slice is a repository, so it carries a repository's identity record; there is no identity waiver. *(Revision 9:)* RFC-043 [R2]'s root-container identity rule applies to the slice's root, and [R16] states what an exporter does when the closure root does not meet it.
>
> **[R13]** *(Amended by RFC-038 [R25] — the `instanceIndex`/`containerIndex` tests resolve against the instance set and container set, both retired as manifest properties per RFC-038 [R2]; folded as invariant I-153 (instance set) and I-152 (container set).)* A conformant RFC-026-aware validator MUST apply the relaxations defined in Change E when the manifest being validated contains a `slice` block. Specifically: it MUST NOT treat `externalRelationRefs` UUIDs absent from the slice's instance set as a validation error, MUST NOT require packages of the source that the slice does not carry (Revision 9; prior text: "MUST NOT require type/field definitions not referenced by included instances"), MUST report the expected absences of Change E item 5 (including Invariants I-81 and I-82) at severity info, and MUST NOT require a complete container set or present `contentPath` files for tombstoned source documents.
>
> **[R14]** The `relationType` values in `slice.externalRelationRefs[]` entries are provenance copies and are NOT subject to RFC-005 definition-lookup requirements. A validator MUST NOT require these type strings to resolve to installed `RelationTypeDefinition` records in the slice archive's package directory.
>
> **[R15]** *(Added at Revision 9.)* A slice MUST carry exactly the packages that Change C item 3's algorithm marks as used, and no other package of the source. The used set always holds the source's primary package, and is otherwise computed from the included records' Types and the RelationTypeDefinitions of the included relations' `relationType` keys. It follows RFC-003's PINNED and LINEAGE reference sites, and it is closed over every definition of every used package and over used packages' RFC-044 `packageDependencies` satisfied in the source. Each carried local package MUST be byte-for-byte identical to the source package, file for file, at the same path relative to the repository root, with its `id` and `version` unchanged; it MUST NOT be pruned, merged with another package or re-identified. A used `remote` package reference is carried as the same reference. The RFC-029 core package is never carried. The slice manifest's `packageRef`/`packageRefs` MUST list exactly the carried packages, each entry unchanged from the source, in the source's order. The source's primary package is always carried. The exporter MUST refuse with `slice-root-level-package-unsupported`, and write nothing, when a package's directory is the repository root.
>
> **[R16]** *(Added at Revision 9.)* At `dataModelRevision` 8 and later, when the closure root has an `identityInstanceId` whose entry in the source is at a depth above 0 or has descendants, an exporter MUST refuse the export before writing anything. It MUST report one error-severity diagnostic, `slice-root-identity-invalid`, naming the Container, the entry and the reason (`depth-nonzero` or `has-descendants`). It MUST write no slice, and it MUST NOT rewrite the outline or the `identityInstanceId` to satisfy RFC-043 [R2].
>
> **[R17]** *(Added at Revision 9.)* A validator reading a manifest with a `slice` block MUST report the four expected-absence classes listed in Change E item 5 at severity info, and every other diagnostic at its normal severity. Change E item 5 is the one statement of the list.
>
> **[R18]** *(Added at Revision 9.)* An exporter MUST refuse the export, report one error-severity diagnostic and write nothing, in each of two cases. (a) `slice-definition-identity-conflict`: two source packages carried by the slice hold different definitions under the same `id` and `version` (`rfc-decision-cce3c00e`). The diagnostic names the definition `id`, the `version` and both packages. (b) `slice-package-outside-repository`: a local package that the slice carries has a path that resolves outside the repository root, which an archive cannot hold at the same path (RFC-017). The diagnostic names the package and its path. Like [R16] and the `slice-root-level-package-unsupported` refusal of [R15], neither refusal rewrites, drops or re-identifies anything to make the export succeed.

---

## Schema changes

| Schema file | Change |
|---|---|
| `docs/schema/2.0/manifest.json` | Add optional `slice` property to the top-level manifest `properties` object (`"slice": { "$ref": "#/$defs/Slice" }`). Add `$defs.Slice`, `$defs.SliceSpec`, and `$defs.SliceExternalRef` definitions (see details below). |

No other files in `docs/schema/2.0/` require changes:

- The slice archive's instance files (`record.json`, `note.json`, `typed-record.json`) are unchanged — the slice extension is expressed entirely through the manifest.
- `relations-collection.json` is unchanged — the slice's relations collection contains only valid (non-dangling) relations; dangling edges are in the manifest `slice` block, not the relations file.
- `package-manifest.json` is unchanged — the package directory in a container slice is a structural copy of definitions from the source, not a new package format. *(Revision 9: each carried package is the source package unchanged, so this holds more strongly.)*

**Revision 9: no schema property is added or changed.** Revision 9 changes what an exporter carries, what the slice manifest's existing properties hold (Change B: `packageRef`/`packageRefs` list exactly the carried packages; `upstreamPackage` is kept only with its package), where carried packages sit in the archive (their source paths), and how a validator rates two diagnostic classes on a slice. All of these are content and behaviour rules expressed with existing schema properties. The `SliceSpec.type` description ("records, relations, definitions, and source documents reachable from a container") stays true when packages are carried whole, so it is left as it is and the schema mirrors need no sync.

### What breaks (Revision 9)

- **Stored data:** nothing. No record, relation, container, package or manifest in any repository changes, so no migration is needed.
- **Exporters:** an exporter written to the Revision 8 text (one merged `package/`, a subset-test container closure) does not conform to [R15] or I-151 and must change. srs-rust#631 implements this revision in parallel.
- **Slices already made:** a slice written to the Revision 8 text is still a valid repository; its merged `package/` is an ordinary local package. [R15] binds exporters. A validator cannot see whether a package is byte-identical to a source it does not have, and MUST NOT report a pre-Revision-9 slice's package as non-conformant on that ground.
- **Exports that used to succeed:** a boundary container whose identity entry is nested or has children is now refused ([R16]). No muSrs container is affected (all identity entries are depth-0 leaves). A package whose directory is the repository root is also refused (Change C item 3), as is a source holding two different definitions under one `id` and `version` in carried packages, or a carried local package outside the repository root ([R18]); no muSrs source is known to be affected, and srs-rust#1263 tracks the implementation.
- **Size and disclosure:** slices grow, because packages are carried whole and their reach is closed over (Change C item 3, *Cost and consequence*).
- **Validators:** four diagnostic classes on a slice drop to info (Change E item 5: two from the first draft, Invariant I-81 from the Q4 ruling, Invariant I-82 from the Q5 ruling of Revision 10). Nothing that was info rises.

**Property entry to add to `manifest.json` top-level `properties`:**

```json
"slice": {
  "$ref": "#/$defs/Slice",
  "description": "ext:slices (RFC-026). Present when this archive is a partial export (slice) of a source repository."
}
```

**`$defs` shapes to add to `manifest.json`:**

```json
"Slice": {
  "type": "object",
  "required": ["origin", "spec", "exportedAt"],
  "additionalProperties": false,
  "description": "ext:slices (RFC-026). Present when this archive is a partial export (slice) of a source repository.",
  "properties": {
    "origin": {
      "type": "object",
      "required": ["repositoryId"],
      "additionalProperties": false,
      "properties": {
        "repositoryId": {
          "type": "string",
          "format": "uuid",
          "description": "repositoryId of the source repository this slice was exported from."
        }
      }
    },
    "spec": { "$ref": "#/$defs/SliceSpec" },
    "exportedAt": {
      "type": "string",
      "format": "date-time",
      "description": "When this slice was produced."
    },
    "externalRelationRefs": {
      "type": "array",
      "items": { "$ref": "#/$defs/SliceExternalRef" },
      "description": "Relations cut at export because exactly one endpoint fell outside the closure. Provenance only — not a validation error (RFC-026 R8). Relations where both endpoints are outside the closure are omitted entirely."
    }
  }
},
"SliceSpec": {
  "type": "object",
  "required": ["type", "id"],
  "additionalProperties": false,
  "description": "Identifies the closure rule and boundary that scoped this slice.",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["container"],
      "description": "Closure rule. 'container' = container-membership closure (records, relations, definitions, and source documents reachable from a container). Package export is not a slice — a package's definitions are distributed as a package-bundle.json (RFC-003), not as a slice type."
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "The boundary UUID: a containerId present in the source repository's container set (tree-authoritative enumeration, RFC-038 [R1]; the manifest's containerIndex is retired, RFC-038 [R2])."
    }
  }
},
"SliceExternalRef": {
  "type": "object",
  "required": ["relationId", "sourceInstanceId", "targetInstanceId", "relationType"],
  "additionalProperties": false,
  "description": "A relation cut at export time because exactly one endpoint was outside the closure. The relationType field is a provenance copy and is NOT subject to RFC-005 definition-lookup in the slice archive (R14).",
  "properties": {
    "relationId": {
      "type": "string",
      "format": "uuid",
      "description": "Stable UUID of the original relation. Preserved for future reintegration (RFC-026 Open Question 1)."
    },
    "sourceInstanceId": {
      "type": "string",
      "format": "uuid"
    },
    "targetInstanceId": {
      "type": "string",
      "format": "uuid"
    },
    "relationType": {
      "type": "string",
      "description": "The relationType of the cut relation. Canonical types: contains, depends-on, supersedes, refines, derived-from, evidences, precedes. Custom types use namespace/name format. NOT subject to RFC-005 definition-lookup in the slice archive."
    }
  }
}
```

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`)
- `srs-vscode/schemas/2.0/` (via `srs-vscode/scripts/sync-schemas-from-spec.sh`)

---

## Rationale

**A slice is a valid `.srs` archive, not a new format.** Reusing the RFC-017 archive format means every existing RFC-026-aware SRS tool can open, validate, and render a slice without additional tooling. The only new information is the `slice` manifest block. Pre-RFC-026 strict validators will surface a schema error on the new `slice` property (because `manifest.json` uses `additionalProperties: false`); this is expected and makes the version boundary explicit rather than silently ignoring slice semantics.

**Provenance via manifest block, not sidecar.** The `slice` block lives in `manifest.json`, the single authoritative entry point for any `.srs` archive. A consumer discovering a slice does not need to scan additional files — the manifest tells them everything about the export's origin and scope. Encoding provenance in a separate sidecar would require consumers to locate and parse an additional file, and would be silently missing in archives produced by non-conformant tools.

**New `repositoryId` for the slice.** A slice is an independent artifact. Giving it the source repository's `repositoryId` would cause any tool that tracks repositories by UUID to confuse the slice with the source. The `slice.origin.repositoryId` provides the provenance link; the archive's own `repositoryId` keeps the archive distinct.

**`externalRelationRefs` over silent drop.** Silently dropping cross-boundary relations loses provenance. A consumer receiving a container slice of "Decision Records" cannot know whether the absence of a `depends-on` edge is because the dependency was never modelled, or because the dependency target fell outside the exported container. Recording cut edges in `externalRelationRefs` makes the slice auditable: a tool can report "this slice cut 12 cross-boundary relations to the source repository" and a reviewer can decide whether those dependencies matter for their use case. This follows the ext:federation graceful-degradation contract, which established the same principle for federated repositories: absent content is surfaced, not silently hidden.

**`externalRelationRefs` in the manifest, not the relations collection.** Cut relations are not valid relations within the slice — they reference instance UUIDs that do not exist in the slice's `instanceIndex`. Placing them in the relations collection would create dangling edges that fail `repo validate`. The manifest is the correct location for provenance metadata that is not part of the repository's semantic content.

**`relationId` in `SliceExternalRef`.** The SRS Relation object carries a stable `relationId` UUID. Including it in `externalRelationRefs` preserves the ability for a future reintegration RFC to uniquely identify which relation to resurrect — two relations of the same type between the same instance pair (e.g., two `evidences` edges) are distinguishable only by `relationId`.

**A package export is not a slice.** A slice is a *repository* subset: it has records, a root container, and its own repository identity (RFC-013). Distributing a package's Type/Field *definitions* produces a records-free artifact that cannot satisfy RFC-013 (there is no member identity record to name) — so it is neither a repository nor a slice. That artifact is a `package-bundle.json` — distributable, updatable metadata — defined by **RFC-003 (Subset package export)**. Keeping the two apart avoids overloading the slice model with a records-free special case and lets each artifact carry the identity and lifecycle appropriate to it. To export the *records* that use a package's types, compose a container over them and take a container slice.

**Container closure copies definitions, does not reference the source.** A container slice must be self-contained: a consumer must be able to validate and render it without access to the source repository. Referencing definitions by package identity (expecting them to be pre-installed) would break the portability goal. The definition copy is a one-time cost at export time. All Field definitions in a Type's FieldAssignments are included even for optional fields with no values — an empty slot for an optional field is valid and the field's definition must be present for the schema to be self-consistent.

**Why whole packages (Revision 9).** The paragraph above still holds: the slice copies, it does not reference. Revision 9 changes the unit copied from a definition to a package, for three reasons.
- *Completeness.* Packages now hold ten definition kinds, not two. A Type's `lifecycleRef` and a Field's `vocabularyRef` are validation errors when unresolved, so a slice that copied only Types and Fields was invalid whenever its records used a lifecycle or a vocabulary.
- *Identity.* A merged `package/` has no defined `id` or `version`. Any choice either borrows a source package's identity for different content or invents a new identity. Each sub-package's `packageDependencies` (RFC-044) and `upstreamPackage` link (RFC-014) would also have no home.
- *Evidence.* The srs-rust#631 prototype exported three muSrs containers (7 package boundaries) with whole packages, and every slice validated with 0 errors.

The cost is size: a slice carries definitions its records do not use. That cost is accepted, because a slice is a snapshot, and every package in it should be the package its identity names. "Used" reuses RFC-003's reference strengths rather than a second closure list (one way per goal). It also closes over the carried packages' own references and requirements, so a carried package is never left with a reference it cannot resolve.

**Why refuse a bad root identity (Revision 9).** The closure root becomes the slice's root container, and RFC-043 [R2] constrains a root's identity entry in a way it does not constrain other Containers. The exporter could rewrite the outline (lift the identity entry to depth 0, promote its descendants) or drop the identity, but either would make the slice disagree with its source about the Container it claims to snapshot. Refusing tells the user what to fix in the source. No muSrs container hits this case.

**Container membership traversal is through `memberInstanceIds`, not Relations.** Container objects use `memberInstanceIds` and `rootInstanceIds` to declare their members. These are the canonical SRS mechanism for container membership. A `containerId` MUST NOT appear in `Relation.sourceInstanceId` or `Relation.targetInstanceId` (RFC-013); therefore `contains`-typed Relation traversal starting from a container is undefined. The correct traversal is: start with the root container's `memberInstanceIds` ∪ `rootInstanceIds`, then recursively include members of sub-containers whose roots are within the already-included set.

> **Amended by RFC-043 (effective at `dataModelRevision` 8).** Container objects use `memberInstanceIds`, an ordered list of entries `{instanceId, depth?}`, to declare their members; `rootInstanceIds` is removed (RFC-043 [R1], [R4]). The correct traversal is: start with the `instanceId` values of the root container's entries (depth ignored), then recursively include the entries of sub-containers whose entry ids are within the already-included set. *(Prior text, in force until a corpus is at revision 8: "start with the root container's `memberInstanceIds` ∪ `rootInstanceIds`, then recursively include members of sub-containers whose roots are within the already-included set".)*

**Record-level closure is deferred.** General record-closure (export an arbitrary set of records) requires a dependency-closure engine that traverses `depends-on`, `derived-from`, and other relation types to find the minimum complete set. This engine does not yet exist in the spec or implementation. This RFC defers record closure rather than define it incompletely. The `spec.type` enum is intentionally closed to `["container"]`; record closure will be added in a future RFC when its dependency-traversal semantics are defined. (Package export is deliberately absent from this enum — it is not a slice; see RFC-003.)

---

## Alternatives Considered

### Alt A — New archive format for slices (`.srss` or similar)

Defining a separate archive format for slices was considered. Rejected: it would require new tooling for producers and consumers, and existing `srs repo validate` and `srs render` commands would not work on slices without modification. The whole-archive format with a manifest marker achieves the same result with zero new format infrastructure.

### Alt B — Silent drop of dangling edges

Dropping cross-boundary relations without recording them was considered for simplicity. Rejected: it permanently loses provenance. A consumer cannot distinguish a slice that genuinely has no cross-boundary dependencies from one that had many. The ext:federation graceful-degradation precedent showed that explicit external-reference recording is the right model.

### Alt C — Include dangling edges in the relations collection with a `status: "external"` marker

Preserving cross-boundary relations in the slice's relations collection with a new `status` field was considered. Rejected: it would require validators to ignore dangling-target errors for `status: "external"` relations, creating a validator special-case. It also conflicts with the `status` field on Relations established by RFC-005 (Deletion Semantics, Change B). The `externalRelationRefs` list in the manifest is cleaner: it is unambiguously provenance data, not a semantic relation in the repository.

### Alt D — Reuse source repository's `repositoryId` for the slice

Copying `repositoryId` from the source into the slice manifest was considered (with `slice.origin.repositoryId` being omitted as redundant). Rejected: it causes UUID collisions when a system tracks multiple slice archives of the same source repository, and confuses any tool that indexes archives by `repositoryId`. A new UUID per slice keeps archives distinct and the provenance link is carried by `slice.origin.repositoryId`.

### Alt E — `slice` as a sidecar file alongside `manifest.json`

Placing slice metadata in a separate `slice.json` file was considered. Rejected: `manifest.json` is the guaranteed entry point; every SRS tool reads it first. A sidecar requires consumers to discover and parse an extra file and may be absent in hand-assembled archives.

### Alt F — Model package export as a slice (`spec.type: "package"`)

Earlier revisions treated package export as a slice closure type — Rev 1–3 as a full content export of a package boundary (all instances of the package's types), Rev 4 as a definitions-only `.srs` archive with a minimal root container and an RFC-013 identity waiver. **Rejected in Rev 5.** A definitions-only bundle has no records and therefore no RFC-013 identity record, so forcing it into the `.srs`/repository framing requires a validation waiver that papers over a category error: a package export is *not a repository*. It is a `package-bundle.json` — distributable, updatable metadata — with its own identity and lifecycle, defined by **RFC-003 (Subset package export)**. Removing `"package"` from the slice enum keeps the slice model coherent (every slice is a repository subset) and homes package export where its update/distribution machinery already lives (RFC-014 `upstreamPackage`, `ext:registry`). The "records that use a package's types" use case is served without a package closure rule: compose a container over those records and take a container slice.

### Alt G — Keep package boundaries, prune unreferenced definitions (Revision 9, option P1)

Carry each used package but drop the Types and Fields no included record reaches (using the RFC-003 reference-site closure, so lifecycles and vocabularies still resolve). Rejected by owner ruling D1: a pruned package would keep its source `id` and `version` while holding different content. That is a false identity claim (Identity, identifier over label), and a consumer comparing it with the real package by identity would be misled.

### Alt H — Merge into one `package/` (the Revision 1 to 8 text, option P2)

Flatten every used definition from every source package into one package directory. Rejected by owner ruling D1. The merged package needs an identity: borrowing the primary package's is false, and a fresh UUID creates a package that exists nowhere else. Sub-package `packageDependencies` and `upstreamPackage` are lost. Two packages that each hold a definition with the same `id` would need a precedence rule, while an identity conflict must be fatal, never settled by precedence (`rfc-decision-cce3c00e`).

---

## Open Questions

1. **Slice reintegration (provenance for merge-back)** — this RFC establishes the provenance marker (`slice.origin.repositoryId`, `externalRelationRefs` including `relationId`) required to make slice reintegration *possible* without specifying it. The mechanics of merging a slice back into the source repository — including divergence detection, conflict resolution, and the interaction with RFC-014 (import tracking) and RFC-010 (assisted three-way merge) — are deferred to a future RFC (tracked in muDemocracy.org#116). The `slice` block's provenance fields are designed to be sufficient for a future reintegration RFC to build on.

   Note that `slice.origin.repositoryId` is **single-origin**: a slice records exactly one source repository. If a future capability needs to *combine* slices from multiple source repositories into one artifact, this field would need to become plural (a list of origins). The current single-origin shape is deliberate and should not be read as foreclosing that evolution — cross-repository composition is `ext:federation` / RFC-010 territory today.

2. **Resolved (owner ruling 2026-10-04): the accepted RFC-034 [R9] / Invariant I-151 container rule stands.** The question was which container rule governs slice closure, given that srs-rust#631 shipped the subset test with ruling D3 and RFC-034 [R9] had replaced it. I-151 is the rule in force: the boundary's members plus the members of its declared `childContainerIds` descendants, and exactly those declared descendant containers are carried. Change C items 2 and 6 are marked superseded by RFC-034 [R9]. Ruling D3 is moot under I-151: an undeclared empty container is never carried, and a declared child with no entries is carried with its edge kept. The vacuous-truth finding on the subset test is kept as history. The implementation (srs-rust#631, with srs-rust#1259 amended to conform) follows I-151. No supersession of RFC-034 [R9] is made.

3. **Compositions in a package the slice does not otherwise use (Revision 9).** "Used" starts from records and relations. A Composition that renders the boundary Container, but lives in a package none of the slice's records use, is not carried, so the slice cannot render that document. Until a later revision adds it, an essay snapshot made with Revision 9 carries the essay but not its rendering Composition unless that Composition's package is used for another reason. The driving use case, an essay snapshot (the-greenman/muDemocracy.org#276), wants that render. The option is to add a fourth starting point: every Composition in the source whose sources name a carried Container (`containerId`/`containerIds`), with its package carried whole. **Recommendation:** adopt it in a later revision if the snapshot use case needs it. It is not in Revision 9 because the owner ruling defines "used" without it. **Note for the driving case:** for the essay snapshot, the essay Composition lives in the essay package, which is carried because the paragraph Types are used, so the render survives. The question stays open for a Composition in a package the slice does not otherwise use. **Deferred (owner, 2026-10-04):** no current case needs it.

4. **Resolved (owner ruling 2026-10-04): adopt.** When a `slice` block is present, Invariant I-81 (the root identity record is not a `purpose` record) is reported at info. Rationale: a slice says what it is through its identity record, and every content slice, such as an essay snapshot, would otherwise warn. Added to Change E item 5 as class (iii) and to [R17].

5. **Resolved (owner ruling 2026-10-05, Revision 10): adopt. This reopens and supersedes the 2026-10-04 closure below.** When a `slice` block is present, Invariant I-82 (a root container member that anchors no container) is reported at info. A real slice showed it: the essay snapshot of srs-web#465 validates with 0 errors and two I-82 warnings, for its document-state and comment members. Added to Change E item 5 as class (iv) and to [R13] and [R17]; tracked by srs-rust#1276. *History, the 2026-10-04 closure (superseded):* **Closed (owner ruling 2026-10-04): no change.** Under I-151 the srs-rust#1259 re-run produced no Invariant I-82 warnings for any muSrs container. The warnings came only from the superseded subset rule carrying undeclared containers. I-82 keeps its severity. Reopen if a real slice shows it.

6. **Resolved (owner ruling 2026-10-04): adopt in Revision 9.** The exporter refuses both cases and writes nothing: `slice-definition-identity-conflict` (two carried source packages hold different definitions under one `id` and `version`; `rfc-decision-cce3c00e`) and `slice-package-outside-repository` (a carried local package whose path resolves outside the repository root; RFC-017). New rule [R18]. Implementation is tracked by srs-rust#1263.
