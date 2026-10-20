> **GitHub issue**: [the-greenman/srs#941](https://github.com/the-greenman/srs/issues/941)

# RFC-052: The root container is stored in the container set

**Status**: Accepted (Revision 4)
**Affects**:
- **Schemas:** `manifest.json` (`container` → `rootContainerId`); `srsj-envelope.json` (its embedded manifest); three descriptions in `container.json`.
- **RFC-013 (Accepted, Revision 8):** [R1] is amended and [R9] is withdrawn (Door 3).
- **RFC-038 (Accepted, Revision 15):** [R1], [R22]'s manifest clause, Change F's root-delete paragraph, and Change K's retained-field list (Door 3).
- **Rules that name `manifest.container`**, which change by reading rule only ([R2]):
  - RFC-013 [R2] and I-79;
  - RFC-025 [R1];
  - RFC-026 [R5](b), [R12] and Change C step 1;
  - RFC-029 [R5], [R6] and I-87;
  - RFC-038 Phase 2;
  - RFC-042 Changes D and F;
  - RFC-043 [R5] and [R12].
- **Coordinated:** RFC-050 (Draft) names `manifest.container` in one example and reads the same way.
- **Revision:** `dataModelRevision` 10.

Answers SP-30. Split from RFC-051 (the-greenman/srs#940), where it was ruling 2. Implementation: the-greenman/srs-rust#1417 (lands before srs-rust#1414).
**Author**: design draft; owner ruling 2026-10-20 on #940: "worth the cost as long as this happens soon and is not lost"
**Date**: 2026-10-20

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-20 | Split from RFC-051 Revision 9 (Change I and [R16]). |
| 4 | 2026-10-20 | **Accepted by the owner** (2026-10-20, the-greenman/srs#941). The spec-side change lands in two phases, as RFC-043 did. Now: this text, the Door 3 amendment notes, the gated invariant and mechanism records, the successor decision record and the doc updates; the schema files are staged under `docs/schema/staged/rfc-052/`. Later, in one PR after srs-rust#1417 ships revision 10: the corpus migration, the metamodel Field change, the schema promotion and the pin advance. No normative rule changes in this revision. |
| 3 | 2026-10-20 | Final check: RFC-038 Change K's sentence keeping `manifest.container` inline and canonical is withdrawn explicitly. |
| 2 | 2026-10-20 | Review (#941). **Blocking, fixed:** [R1] and [R7] gave contradictory migration status; a revision-10 manifest carrying `container` is now its own error. **Should-fix, fixed:** the root's file name is fixed; the migration is specified (registry entry, ordering, refusals); RFC-038 Change F and Change K are amended explicitly; [R4]'s cascade is a MUST and its scope is stated; the missing readers and the metamodel Field are listed; the schema table is completed; prior texts are quoted; the single-cutover sentence is resolved; Door 3 is named; the governance seeds are handled. |

---

## Charter alignment

**Cell(s):** cell:repository, cell:conformance
**Decision mode:** complicated. The substance was ruled by the owner (#940, ruling 2). The RFC amends three accepted RFCs, so it is Door 3, and the owner merges.

**Governing cell preference:**
- **Repository, "catalog over circumstance":** aligned. The manifest becomes a descriptor only.
- **Conformance, "one way over many":** aligned. A container is stored one way, not two.

**Axis preference:** 2–8 Evolution over Continuity, the default pole. The change is made before the Continuity flip.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-7caca3a1, rfc-decision-e99a9437, rfc-decision-2fb87c1e, rfc-decision-628cf6c4, rfc-decision-4431046e, rfc-decision-86f49083.

**Contradictions found:** rfc-decision-2fb87c1e says *"manifest.json is not content authority except for its inline root container"*. Its exception clause is superseded, and its position stands. This was ruled on 2026-10-20 (#940, ruling 2), after testing against the compass; a successor record is created at acceptance.

**One-way-per-goal:** two ways of storing a container collapse into one.

**Layer test:**
- **Which layer owns this?** Storage, under `ext:repository`.
- **Consume or clone downward?** Nothing is cloned.
- **Does the layer below stand alone without this?** Yes. Records and relations are untouched.

---

## Abstract

`manifest.json` carries the root container inline, so the repository's identity and navigation live in a different place, and a different format, from every other container, and adding a navigation section edits the manifest. This RFC stores the root container in `containers/` like any other container, at `containers/<containerId>.json`, and has the manifest name it by a required `rootContainerId`. The root keeps every role it has: it is the identity object, and its entry order is the navigation order. The manifest stops holding any content.

---

## Motivation

- **Two encodings of one construct.** RFC-038 made the manifest "a stable descriptor", but kept the root container inline as an exception (rfc-decision-2fb87c1e). Every reader of containers therefore handles two forms, and every root-membership edit is a write to `manifest.json`.
- **The window.** All corpora are first-party today. After the Continuity flip (axis 2–8) the two encodings would be permanent.
- **It simplifies RFC-051.** With the root stored like every other container, per-entry storage needs no root special case.

---

## Proposed Changes

### Change A — The manifest names the root container

The required `container` property is replaced by a required `rootContainerId`, which names a container in the container set. A migrated root is stored at `containers/<containerId>.json`. The root container:
- is still the repository's identity object and the top of structural navigation (RFC-013);
- keeps its `identityInstanceId` and its identity rule (RFC-043 [R2]);
- keeps its entry order as the navigation order (RFC-043 [R12]).

The consequences:
- adding or reordering a navigation section edits the root's file, not `manifest.json`;
- the manifest holds configuration and identity pointers only;
- concurrent root edits merge like any other container's.

### Change B — The rules this changes

Each rule below is marked NEW, CHANGED or REMOVED, and quotes its prior text.

- **RFC-013 [R1], CHANGED.** *Prior:* "A conforming SRS repository manifest MUST include a `container` member. A manifest without `container` is invalid." *Now:* [R1] below.
- **RFC-013 [R9], REMOVED.** *Prior:* "The root container is identified solely by `manifest.container`; it MUST NOT be required to appear elsewhere in the repository's container set. A Container entry elsewhere in the container set declaring the same `containerId` as `manifest.container` is a duplicate logical identifier … FATAL." *Now:* [R5] below. The root has one representation, in the container set.
- **RFC-038 [R1], CHANGED.** *Prior:* "`manifest.json` MUST NOT be treated as an authority for any of them, **except the root container**, which it carries inline at `manifest.container` and for which it is authoritative (RFC-013 I-79)." *Now:* [R3] below. There is no exception, and the container set's row reads "Container (the root included) | `containers/`".
- **RFC-038 [R22], CHANGED (its manifest clause only).** *Prior:* "… MUST NOT modify `manifest.json`, MUST NOT modify `manifest.container`, …". *Now:* [R4] below. Its other clauses (own target only, the declared cascade) stand.
- **RFC-038 Change F, CHANGED.** *Prior:* "Deleting a root-container member is therefore not a routine unscoped operation: it is an explicit container-membership operation, and it writes the manifest." *Now:* "… and it writes the root container's file."
- **RFC-038 Change K, CHANGED.**
  - In the retained-field list, `container` is replaced by `rootContainerId`.
  - Two sentences are withdrawn: *"The root-container model is retained and untouched. `manifest.container` stays inline and canonical"*, and *"conflicting on those is correct"*, said of root-membership edits.
  - `manifest.updatedAt` no longer advances on root-membership edits.
- **Reading rule, NEW** ([R2]). Every other accepted rule that names `manifest.container` (listed in the header) reads as naming the container `rootContainerId` names. For example, RFC-013 [R2]'s *"(`manifest.container`)"* reads *"(the container `manifest.rootContainerId` names)"*, and I-79's *"`manifest.container` is REQUIRED"* reads *"`manifest.rootContainerId` is REQUIRED, and names a container of the container set"*. A slice's manifest names its root by `rootContainerId`: the closure root that RFC-026 already writes as the slice's root container.

### Change C — Migration

The migration is a registry entry, `rfc052-root-container`, that operates on the raw tree. It is ordered after the revision-9 (RFC-046) entry. A corpus at revision 7 or 8 reaches it through the existing chain. For each manifest it:
1. **refuses before any write** if `containers/<containerId>.json` already exists (`migration-root-path-exists`), or if any container file already declares the root's `containerId` (`migration-root-duplicate`, already fatal under RFC-013 [R9]);
2. writes the root to `containers/<containerId>.json`, removes `container`, writes `rootContainerId`, and stamps revision 10.

`.srsj`, `.srs` and bundle forms are migrated by a pre-load transformer to the same outcome. The gate is that navigation order, identity resolution and every Composition's rendered output are byte-identical before and after. The migration is all-or-nothing, and re-running it reports `alreadyApplied`.

**Published package seeds** (`com.mudemocracy.governance` 1.0.0–1.2.1) are immutable published versions, so they are not rewritten. The pre-load transformer migrates them on load.

**Pre-existing, outside this RFC:** those seeds' root id (`e2e8489a…`) differs from RFC-025 [R1]'s `54432eb2…`. This is reported separately.

---

## What breaks

- **Manifests:**
  - srs-programme, `srs`, srs-context and muSrs;
  - the 3 fixture manifests;
  - `gallery.srsj`;
  - the 4 governance seeds, through the transformer only.
- **Readers of `manifest.container`:**
  - `srs` scripts: `check-publication-reachability.mjs`, `part-container-membership.mjs`, `check-spec-coherence.mjs`, `render-invariants.mjs` and `check-spec-rendered-order.mjs`;
  - the guard test `tests/guards/run.mjs`;
  - `gen-metamodel-package.mjs`, which defines the manifest's `container` Field (165). Field semantics are immutable, so a new `root_container_id` Field is added and 165 is retired;
  - clerk `render-handbook.mjs`;
  - every implementation's manifest loader.
- **Records:** I-79, I-87, mechanism-027b1fa3, mechanism-1ca691f3, mechanism-3d8fa08c and rfc-0c185e05 are reworded at the fold.
- **Payloads and APIs:** nothing breaks, because every adapter already presents the root as a Container.

---

## Conformance Rules

> **[R1]** At `dataModelRevision` 10 a manifest MUST carry `rootContainerId`, the `containerId` of a container in the container set, and MUST NOT carry `container`. A `rootContainerId` that is absent or names no container MUST be an error fatal to the load (`manifest-root-container-missing`). A revision-10 manifest that carries `container` MUST be an error fatal to the load (`manifest-root-container-inline`). *(Amends RFC-013 [R1].)*
>
> **[R2]** Every rule of an accepted RFC that names `manifest.container` MUST be read as naming the container that `manifest.rootContainerId` names. *(The rules are listed in the header.)*
>
> **[R3]** `manifest.json` MUST NOT be authoritative for any content set. *(Amends RFC-038 [R1].)*
>
> **[R4]** A routine instance create, update or delete that is not an explicit container-membership operation MUST NOT modify `manifest.json`. A record delete's cascade MUST remove that record's entries from the root container, as from any other (RFC-043 [R7]). RFC-038 [R22]'s other clauses stand. *(Amends RFC-038 [R22].)*
>
> **[R5]** The root container MUST have exactly one representation, in the container set. Two containers declaring one `containerId` are a duplicate under RFC-038 [R12]. *(Withdraws RFC-013 [R9].)*
>
> **[R6]** Deleting the container that `rootContainerId` names MUST be refused, changing nothing (`container-root-delete`).
>
> **[R7]** A binary supporting only revision 9 or lower MUST refuse a revision-10 corpus. A revision-10 binary MUST report a revision-9-or-lower corpus as needing the registry migration (`container-migration-needed`, naming RFC-052 and `rfc052-root-container`), and MUST refuse other operations. The migration MUST:
> - refuse before any write on `migration-root-path-exists` or `migration-root-duplicate`;
> - write the root at `containers/<containerId>.json`;
> - pass Change C's gate;
> - be all-or-nothing;
> - report `alreadyApplied` on a revision-10 corpus.
>
> | Code | Severity | Load |
> |---|---|---|
> | `manifest-root-container-missing` | error | fatal |
> | `manifest-root-container-inline` | error | fatal |
> | `container-migration-needed` | error | fatal; only the migration runs |
> | `container-root-delete` | rejected operation | none; nothing is written |
> | `migration-root-path-exists`, `migration-root-duplicate` | migration refusal | nothing is written |

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `manifest.json` | Generated. `container`, and its `$defs` `Container` and `ContainerEntry` (used only by it), are removed. `rootContainerId` (UUID) is added and required. The `dataModelRevision` description gains revision 10. | Every manifest changes at migration |
| `srsj-envelope.json` | Generated. The embedded manifest follows `manifest.json`, and its embedded `Container` and `ContainerEntry` definitions are removed. | Every `.srsj` is migrated |
| `container.json` | Descriptions only: the three mentions of `manifest.container` (in `memberInstanceIds`, and twice in `identityInstanceId`) read "the container `manifest.rootContainerId` names". | None |

The chain: the metamodel package (a new `root_container_id` Field; Field 165 retired), `generation-ledger.md`, and `rfc-541-closure-test.mjs` / `rfc-534-closure-test.mjs`. No other schema embeds the manifest or an inline Container.

---

## Rationale

Ruling 2 on #940 was made after testing both options against the compass. Keeping the root inline passed only Reliability over Renewal, and only on cost. Moving it passes Conformance (one encoding), Repository (the manifest as a pure descriptor) and axis 2–8. As its own RFC it lands first, with a small migration, independent of RFC-051's storage change. Separate revisions keep each migration and each PR small.

---

## Alternatives Considered

- **Keep the root inline.** Rejected by ruling 2: two encodings, made permanent at the Continuity flip.
- **Keep the property name `container`, holding only an id.** Rejected: one name with two shapes across revisions (Description: "one name over many"), and a rename is a migration either way (rfc-decision-628cf6c4).
- **Compose with RFC-051 at one revision** (the precedent is rfc-decision-86f49083). Rejected: the changes are independent, and one combined migration is larger and harder to gate.

---

## Open Questions

None. The substance was ruled on #940 (ruling 2). The decision record is created at acceptance: it partially supersedes rfc-decision-2fb87c1e's inline-root exception.
