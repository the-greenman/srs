> **GitHub issue**: [the-greenman/srs#55](https://github.com/the-greenman/srs/issues/55)

# RFC-010: Assisted three-way merge for `ext:federation`

**Status**: Draft (Revision 4)
**Affects**: `ext:federation` (`FederationEvent`, `FederationEventsFile`), `Record` type-binding merge semantics, `Relation` merge semantics (`relations-collection.json`), `source-document-meta.json` (merge semantics), `Container` merge semantics, vocabulary-backed tag merge (RFC-006), new `merge-result.json` schema, `federation-events.json` schema
**Author**: Peter Brownell
**Date**: 2026-06-13
**Builds on**: `ext:federation` base spec (spec-resident, invariants 56–62). **Interacts with**: RFC-006 (Vocabulary Substrate — vocabulary-backed tags), RFC-009 (Root-record Type as Container typing anchor).

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-13 | Initial draft |
| 2 | 2026-06-13 | Address review findings. **Blocking:** rewrite relation merge against the real point-to-point `Relation` model (no `members[]` in 2.0 schema) — ordering is graph reconciliation over pairwise `precedes` edges with a concrete edge-delta algorithm; add `relation-dangling-endpoint` conflict and post-merge referential-integrity rule (I-75). **Should-fix:** rename `MergeResult.strategy`→`mergeStrategy` and `mergedInstanceIds`→`mergedSubjectIds`; add `tag-resolution` (I-76) and `container-root` conflicts; cross-reference RFC-006/RFC-009; designate canonical `MergeBase`; pin `resolution` enum and `MergeConflict` required fields; specify federation-events property placement; note per-kind resolution restriction is validation-enforced; handle adversarial duplicate Note section names; close OQ2. **Nits:** justify `definition-collision` from the spec-level `id@version` rule (not impl type names); clarify I-72 content-vs-label determinism. |
| 3 | 2026-06-13 | Address Rev 2 review. **Blocking:** pin ordering reconciliation to the canonical `precedes` type only (no schema mechanism exists to mark arbitrary types as "ordering"), removing the classification ambiguity that broke cross-implementation determinism. **Should-fix:** resolve the `auto-union`-vs-empty-`conflicts` contradiction by removing `auto-union` from the `Resolution` enum (clean merges are not conflicts); define `subjectId` for `ordering` (smallest node instanceId) and `tag-resolution`; coalesce `container-meta` to one conflict per container; pin the default resolution set for all unrestricted kinds. **Nits:** reorder I-74 into numeric position; note the deliberate `mergeStrategy` const-vs-enum divergence between `MergeResult` and `FederationEvent`. |
| 4 | 2026-06-13 | Clarify versioning/addressability relationship. Add `record-type-version` conflict kind + invariant **I-77**: divergent `typeId`/`typeVersion` for the same `instanceId` forces whole-record resolution rather than unsafe cross-type-version field merge. Add Rationale subsection "Relationship to versioning and addressability" — no versioning extension required; definition versioning and record-value history are orthogonal axes; addresses are invariant under merge. |

---

## Abstract

`ext:federation` today is **detect-only**: when a re-import or copy encounters an instance whose UUID matches an existing instance but whose content differs, the implementation must surface the conflict and stop — it cannot reconcile two independently-edited copies. This blocks the portable workflow where a repository is copied (zipped, emailed, forked in a browser), edited separately in two places, and then needs to be brought back together. This RFC promotes federation from detect-only to **assisted three-way merge**: given a common ancestor (the *merge base*) plus two divergent versions of the repository, it defines a deterministic, semantic merge at field / record / relation / definition granularity, a conflict taxonomy, and a `MergeResult` report. The merge algorithm is defined over data alone (base, ours, theirs → merged + conflicts) and is **provider-agnostic** — git's `merge-base` is one conforming ancestor provider, but the spec mandates no version-control system. Source-document binaries are add/replace-only (never byte-merged). The zip multi-file container and an optional SQLite read projection are described informatively; neither is normative.

---

## Motivation

### Problem 1 — Federation cannot reconcile divergent copies

The `ext:federation` model (invariants 56–62, `federation-events.json`) records `merge`, `split`, and `import` events and uses `InstanceIndexEntry.checksum` for fast no-op detection. But the only defined behaviour when an incoming instance has the same `instanceId` and a *different* checksum than the local copy is to surface a conflict — there is no specified way to **combine** the two. The portability story SRS is built for (copy a repository anywhere, edit it entirely client-side, bring it back) is therefore incomplete: two people who each edited a different field of the same Record cannot merge their work without manual, out-of-band reconciliation.

### Problem 2 — No defined notion of a common ancestor

Three-way merge requires a base: the last common state both copies descend from. The spec has no concept of a *merge base* and no defined way to obtain one. Without it, an implementation cannot tell an *add/add* (both sides created the same instance independently) from an *edit/edit* (both sides changed a shared ancestor), and cannot distinguish "this field was changed on one side" from "this field was changed on both sides." A reconciliation that lacks a base degrades to last-writer-wins or to surfacing every difference as a conflict — both unacceptable.

### Problem 3 — Merge granularity is undefined per entity kind

SRS entities have very different merge semantics. A Record's `fieldValues` can merge field-by-field; document ordering — a set of pairwise `precedes` edges — must reconcile as a graph and can become non-linear; a Field or Type *definition* at a fixed `id@version` is immutable and must never be silently combined; a source-document binary cannot be three-way merged at all. The spec defines none of this, so any two implementations that attempted to merge would disagree on results — fatal for a portable, interoperable format.

---

## Proposed Changes

This RFC adds an **assisted-merge capability to `ext:federation`**. No new extension is introduced; the capability is gated by the same `ext:federation` declaration. An implementation that declares `ext:federation` MAY support assisted merge; if it does, it MUST follow the rules below. Detect-only conformance remains valid (see [I-67]).

### Change A — The merge base (common ancestor)

Define **MergeBase**: the repository state that both the local copy (*ours*) and the incoming copy (*theirs*) descend from. A three-way merge takes three inputs — `base`, `ours`, `theirs` — each a set of instances, relations, definitions, and source-document index entries keyed by stable UUID.

The merge base is supplied by a **provider**, recorded abstractly so the spec mandates no specific tool:

```typescript
MergeBase {
  provider: string   // free-form provider id, e.g. "git", "federation-snapshot", "explicit"
  ref:      string    // provider-scoped reference to the common ancestor state
                      //   git:                 a commit-ish (the git merge-base SHA)
                      //   federation-snapshot: the eventId of the last shared federation event
                      //   explicit:            a caller-supplied snapshot identifier
}
```

A conforming merge MUST resolve `base`, `ours`, and `theirs` to concrete instance sets before merging. How the provider materialises those sets is out of scope; the merge algorithm operates only on the resolved data.

`MergeBase` is defined canonically in `merge-result.json`. `federation-events.json` carries a byte-identical synchronized copy of the `MergeBase` `$defs` entry (cross-file `$ref` is not used in the committed golden-schema workflow); the two copies MUST stay identical and are checked by `scripts/check-schema-sync.sh`.

> Informative: the recommended provider for the portable, browser-editable workflow is **git** — a repository carried as a zipped git working tree gives every JSON record per-file history for free, and `git merge-base` yields the common ancestor deterministically. The spec does not require git; an implementation with no version control MAY supply a base via `federation-snapshot` (the last federation event whose `affectedInstanceIds` both copies share) or `explicit`.

### Change B — Three-way merge algorithm and granularity

For each stable UUID present in any of `base`, `ours`, `theirs`, classify and merge by entity kind:

**Records / TypedRecords (`fieldValues`).** Field-level merge presupposes both sides agree on the record's type binding. **Precondition:** if `ours` and `theirs` bind the same `instanceId` to a different `typeId` or `typeVersion` relative to `base`, the record MUST NOT be field-merged — emit a single `record-type-version` conflict ([I-77]) for the whole record. Field-by-field reconciliation across a type-version boundary is unsafe: each side's `fieldValues` may be valid only under its own type version, so a per-field union could yield a record that validates against neither. (A `typeVersion` changed on only one side relative to `base` takes the changed binding, like any single-sided edit — that is a migration the other side did not make, not a divergence.) When the type binding agrees, merge per `fieldId`:
- A field changed on only one side (relative to `base`) takes the changed value. (clean)
- A field changed identically on both sides takes that value. (clean)
- A field changed to *different* non-base values on both sides is a `field-edit` conflict. (surfaced)
- A field present in `ours`/`theirs` but absent in `base` (added on one side) is added; added on both sides with different values is a `field-edit` conflict.
- Tier-0 Notes (free-text `sections[]`) merge per section keyed on `NoteSection.name`, which `note.json` requires to be unique within a Note. Divergent edits to the same section's content are a `note-section` conflict (free text is not further sub-merged). If an input Note violates the uniqueness invariant (duplicate `name`), the merge MUST treat that Note as a single opaque unit and surface a `note-section` conflict rather than mis-key its sections.

**Relations.** A `Relation` in the 2.0 model is strictly point-to-point: `relationId` (stable identity), `relationType`, `sourceInstanceId`, `targetInstanceId`, plus provenance. There is no member-list form; document ordering is expressed as a set of pairwise edges (e.g. a chain of `precedes` relations). Merge relations by `relationId`:
- A relation added on one side (absent in `base`) is added; the union of both sides' additions is taken.
- A relation removed on one side and untouched on the other is removed.
- A relation whose `relationType`/`sourceInstanceId`/`targetInstanceId`/provenance changed on exactly one side takes the changed value (clean); changed to different non-base values on both sides is a `relation-edit` conflict.
- A relation removed on one side and edited on the other is a `relation-delete-edit` conflict.

**Ordering (graph reconciliation over pairwise edges).** Graph reconciliation applies **only to relations of the canonical `precedes` type** — the single canonical ordering relation in the 2.0 vocabulary. All other relation types (including `contains`, `depends-on`, and any custom `namespace/name` type) are merged purely point-to-point by `relationId` as above; they never enter graph reconciliation. This fixed classification is deliberate: there is no schema mechanism for a package to mark an arbitrary relation type as "ordering," so keying on the canonical `precedes` type keeps classification deterministic across implementations (a prerequisite for [I-72]). Extending graph reconciliation to additional declared ordering types is deferred to a future RFC. The `precedes` edges form a directed graph; the merged order is computed deterministically, not by ad-hoc "move replay":
1. Compute the edge delta of *ours* vs *base* (added edges `Aₒ`, removed edges `Rₒ`) and of *theirs* vs *base* (`Aₜ`, `Rₜ`), where an edge is the `(relationType, sourceInstanceId, targetInstanceId)` triple.
2. Apply to *base* the union of additions `Aₒ ∪ Aₜ` and the union of removals `Rₒ ∪ Rₜ`. (An edge both added on one side and removed on the other is the `relation-delete-edit` case above and is surfaced, not applied.)
3. If the resulting edge set is a single total order over its nodes (a simple chain: no cycle, no node with two distinct successors or two distinct predecessors), that is the clean merged ordering.
4. Otherwise (a cycle, fork, or join introduced by combining both sides) emit one `ordering` conflict whose `base`/`ours`/`theirs` payloads carry the three node sequences. The reported sequences MUST be deterministic: order nodes by `(base-position, ours-position, theirs-position, instanceId)` so the conflict output does not depend on input ordering.

**Definitions (Field, Type, Relation type, View, Theme, Vocabulary, etc.).** Definitions are immutable at a given `id@version` (existing version-lineage rule):
- Identical `id` + `version` with byte-equivalent content on both sides: keep one. (clean)
- Identical `id` + `version` with **differing** content: `definition-collision` conflict — never auto-combined. This follows directly from the spec's `id@version` immutability rule: a definition's semantics are fixed for a given version, so two non-equivalent bodies at the same `id@version` cannot both be valid and cannot be silently reconciled.
- One side bumped to a new `version` (new `id@version`) while the other kept the old: keep **both** versions in the merged package (lineage is additive). This is clean — version bumps never overwrite.

**Source documents.** Binary/opaque content is **add/replace-only**, never byte-merged:
- A document added on one side (new `documentId`) is added.
- Same `documentId` with divergent `contentChecksum` on both sides is a `source-document` conflict; its only resolutions are choosing one whole side (`auto-ours`/`auto-theirs`) or `unresolved`. Content is never byte-merged, and the conflict MUST be surfaced, not silently chosen.
- Sidecar (`.meta.json`) fields merge as a Record would (per-field), independently of the binary content.

**Containers.** Containers carry no `fieldValues`. Merge `memberInstanceIds` as set-union. For `rootInstanceIds`, the **first entry is the typing anchor** (RFC-009): it determines the Container's type identity and which DocumentViews apply. If both sides retain the same `rootInstanceIds[0]`, merge the remainder as set-union cleanly. If `rootInstanceIds[0]` diverges between the two sides relative to `base`, emit a `container-root` conflict — this is a semantic divergence of the Container's type, not a clean union. Divergent `title`/`containerType`/`description` for the same `containerId` is a `container-meta` conflict.

**Tags (vocabulary-coupled).** `Record.tags`, `Note.tags`, and `Container.tags` merge as set-union. Because tags may be vocabulary-backed (RFC-006: when a closed `Vocabulary` governs a tag key, the tag MUST resolve to a `Term`), a union-merged tag set is **re-validated against the merged package after definition merge completes**. Any merged tag that fails vocabulary resolution under the merged package MUST be surfaced as a `tag-resolution` conflict (see [I-76]) — for example when one side's tag depends on a `Vocabulary` that the definition merge surfaced as a `definition-collision`.

**Referential integrity (dangling endpoints).** Instance-level merge determines which instances survive. A relation can survive untouched while an instance it points at is deleted on one side. After the instance and relation merges resolve, any surviving relation whose `sourceInstanceId` or `targetInstanceId` is absent from the merged instance set MUST be surfaced as a `relation-dangling-endpoint` conflict (resolutions: `auto-drop-relation` — drop the dangling relation — or `unresolved`). The merged output MUST satisfy relation referential integrity before it can be written as authoritative ([I-75]).

The output is a **MergeResult**: the merged instance/relation/definition set plus the list of conflicts. Clean merges produce an empty `conflicts` array.

### Change C — Conflict taxonomy and `MergeResult`

Define the `MergeResult` and `MergeConflict` shapes (new schema `merge-result.json`):

```typescript
MergeResult {
  repositoryId:      UUID            // the target repo being merged into (unchanged by merge)
  base:              MergeBase       // the ancestor used
  mergeStrategy:     "three-way-semantic"   // the reconciliation strategy (cf. FederationEvent.mergeStrategy)
  mergedSubjectIds:  UUID[]          // EVERY subject UUID — instance, relation, definition,
                                     // source-document, or container — whose merged content
                                     // differs from the target's pre-merge content
  conflicts:         MergeConflict[] // empty ⇒ clean merge
  generatedAt:       date-time
}

MergeConflict {
  conflictId:  UUID                  // required
  kind:        ConflictKind          // required
  scope:       ConflictScope         // required
  subjectId:   UUID                  // required: instanceId / relationId / definition id / documentId / containerId
  fieldId?:    UUID                  // present for field-edit and tag-resolution
  sectionName?: string               // present for note-section
  base?:       JSON                  // ancestor value (absent ⇒ added on both sides)
  ours:        JSON                  // required
  theirs:      JSON                  // required
  resolution:  Resolution            // required
  note?:       string
}

ConflictKind =
  | "field-edit"                // record/typed-record fieldValue diverged on both sides
  | "record-type-version"       // same instanceId bound to divergent typeId/typeVersion on both sides
  | "note-section"              // tier-0 note section content diverged (or malformed duplicate name)
  | "relation-edit"             // relation type/endpoints/provenance diverged on both sides
  | "relation-delete-edit"      // relation removed on one side, edited on the other
  | "relation-dangling-endpoint"// surviving relation points at a deleted instance
  | "ordering"                  // combined ordering edges are not a single total order
  | "definition-collision"      // same id@version, differing content
  | "source-document"           // same documentId, divergent binary contentChecksum
  | "container-root"            // rootInstanceIds[0] (the type anchor) diverged
  | "container-meta"            // container title/containerType/description diverged
  | "tag-resolution"            // a union-merged tag does not resolve against the merged Vocabulary

ConflictScope = "record" | "note" | "relation" | "definition"
              | "source-document" | "container" | "tag"

Resolution = "auto-ours" | "auto-theirs" | "auto-drop-relation" | "unresolved"
```

A `MergeConflict` records only a *surfaced* divergence; clean merges (including clean set-unions of relations, members, and tags) are applied silently and do not appear in `conflicts`. Per-kind resolution restrictions: `relation-dangling-endpoint` admits only `auto-drop-relation`/`unresolved`; `source-document` admits only `auto-ours`/`auto-theirs`/`unresolved`; **all other conflict kinds admit `auto-ours`/`auto-theirs`/`unresolved`**. These per-kind restrictions are enforced by the merge implementation's validation logic, not by `merge-result.json`'s schema (the schema permits the full `Resolution` enum on every conflict).

**Conflict identity (`subjectId`).** Every `MergeConflict` carries a `subjectId`. For most kinds it is the diverging entity's own UUID (instanceId / relationId / definition id / documentId / containerId). For `ordering` (which concerns a set of `precedes` edges, not one entity) `scope` is `relation` and `subjectId` is the lexicographically smallest `instanceId` among the nodes in the non-linear component. For `tag-resolution` `subjectId` is the tag-bearing instanceId and `fieldId` carries the offending tag key. For `container-meta`, a single conflict per `containerId` aggregates **all** divergent meta fields (`title`/`containerType`/`description`) into its `ours`/`theirs` payloads — divergences are coalesced, not split into one conflict per field. For `record-type-version`, `scope` is `record` and `subjectId` is the record's `instanceId` (the whole record is the subject; no `fieldId`).

`resolution: "unresolved"` means the conflict requires human/caller decision; the merge is **incomplete** until every `unresolved` conflict is resolved. A conflict carrying an `auto-*` resolution was reconciled automatically (e.g. `auto-drop-relation` on a dangling endpoint) and is recorded for audit but does not block completion. Clean merges (no divergence) produce an empty `conflicts` array.

### Change D — Record the merge as a `FederationEvent`

Extend `FederationEvent` (in `federation-events.json`) so a completed merge is auditable. Add three optional properties, populated only when `event === "merge"`:

- `mergeStrategy`: `"detect-only" | "three-way-semantic"` — which reconciliation was used.
- `mergeBase`: a `MergeBase` object — the ancestor the merge descended from.
- `mergeResultPath`: relative path to a persisted `MergeResult` file, when the implementation retains one.

The existing `strategy` property (`preserve-ids` | `new-ids-with-lineage`) is the *copy* strategy and is unchanged and orthogonal; `mergeStrategy` is the *reconciliation* strategy.

---

## Conformance Rules

> **[I-67]** Support for assisted merge is OPTIONAL for `ext:federation`. An implementation that does not implement it MUST retain detect-only behaviour: on an `instanceId` match with divergent content it MUST surface a conflict and MUST NOT silently overwrite or discard either side. Declaring `ext:federation` does not by itself assert assisted-merge support.

> **[I-68]** An assisted three-way merge MUST resolve a `MergeBase` for the two copies before merging. If no common ancestor state can be obtained at all, the implementation MUST fall back to detect-only behaviour ([I-67]) and MUST NOT perform last-writer-wins reconciliation. A *resolvable* base may still lack an entry for an individual subject (one added on both sides independently): that is a per-subject add/add case handled by Change B, not a trigger for whole-merge fallback.

> **[I-69]** Record/TypedRecord merge MUST operate per `fieldId` against the base: a field changed on exactly one side relative to base takes the changed value; a field changed to different non-base values on both sides MUST be reported as a `field-edit` conflict. Implementations MUST NOT merge two values of a single field by concatenation or coercion.

> **[I-70]** A definition (any package-level entity identified by `id` + `version`) with identical `id` and `version` but non-equivalent content on the two sides MUST be reported as a `definition-collision` conflict and MUST NOT be auto-combined. A `version` bump present on only one side MUST be preserved additively (both versions retained); it MUST NOT overwrite the other side's version.

> **[I-71]** Source-document content (the binary/opaque file referenced by a sidecar `contentPath`) MUST NOT be three-way byte-merged. Divergent `contentChecksum` for the same `documentId` MUST be reported as a `source-document` conflict whose only resolutions are `auto-ours`, `auto-theirs`, or `unresolved` (replace-only).

> **[I-72]** A three-way merge MUST be deterministic. (a) *Conflict detection is label-invariant:* the set of `(kind, subjectId, fieldId)` tuples produced for `merge(base, A, B)` MUST equal that for `merge(base, B, A)` — only the per-conflict `ours`/`theirs` payload orientation may differ. (b) *Clean content is label-invariant:* every value merged cleanly — without a surfaced conflict, including the set-unions and the ordering reconciliation of Change B — MUST be identical regardless of side labelling. The clean-merge path is never side-preferring; `auto-ours`/`auto-theirs` describe a caller's decision on a surfaced conflict, and `auto-drop-relation` is the deterministic resolution of a dangling endpoint — none is an automatic clean-merge outcome. (c) *Repeatability:* repeated runs on identical inputs MUST produce identical merged content and conflict sets.

> **[I-73]** A merge MUST NOT change the target repository's `repositoryId`. A completed assisted merge that altered repository content MUST record a `FederationEvent` with `event: "merge"`, `mergeStrategy: "three-way-semantic"`, and a `mergeBase`. The recorded `affectedInstanceIds` MUST include every UUID in the `MergeResult.mergedSubjectIds`.

> **[I-74]** A `MergeResult` containing any `MergeConflict` with `resolution: "unresolved"` represents an **incomplete** merge. An implementation MUST NOT write the merged state back as authoritative repository content until every `unresolved` conflict has been assigned a concrete resolution.

> **[I-75]** The output of a completed (fully-resolved) assisted merge MUST satisfy relation referential integrity: every relation in the merged state MUST have its `sourceInstanceId` and `targetInstanceId` present in the merged instance set. Any relation that would violate this MUST be surfaced as a `relation-dangling-endpoint` conflict (and [I-74] then applies until it is resolved). An implementation MUST NOT write a merged state that contains dangling relations as authoritative.

> **[I-76]** When a closed `Vocabulary` in the merged package governs a tag key (per RFC-006 vocabulary resolution), every tag bearing that key in the merged state MUST resolve to a `Term`. A union-merged tag that fails resolution under the merged package MUST be surfaced as a `tag-resolution` conflict. Free-string tags remain valid when no `Vocabulary` governs the key.

> **[I-77]** When `ours` and `theirs` bind the same `instanceId` to a `typeId` or `typeVersion` that differs on both sides relative to `base`, the merge MUST NOT reconcile that record at field granularity. It MUST instead surface a single `record-type-version` conflict for the whole record (resolutions `auto-ours`/`auto-theirs`/`unresolved`). A `typeId`/`typeVersion` changed on only one side relative to `base` is a clean single-sided binding change, not a conflict.

---

## Schema changes

| Schema file | Change |
|---|---|
| `merge-result.json` | **New file.** `$id`: `https://srs.semanticops.com/schema/2.0/merge-result.json`. Defines `MergeResult` (required: `repositoryId`, `base`, `mergeStrategy`, `mergedSubjectIds`, `conflicts`, `generatedAt`) with `$defs` for `MergeBase`, `MergeConflict`. `mergeStrategy` is `{ "const": "three-way-semantic" }`. **`MergeConflict` required:** `conflictId`, `kind`, `scope`, `subjectId`, `ours`, `theirs`, `resolution` (optional: `fieldId`, `sectionName`, `base`, `note`). `MergeConflict.kind`, `.scope`, and `.resolution` are string enums with **exactly** the members listed in Change C (`ConflictKind`, `ConflictScope`, `Resolution`). The per-kind resolution restrictions (e.g. `source-document` ⇒ only `auto-ours`/`auto-theirs`/`unresolved`) are NOT expressed in the schema — they are validation-logic obligations of invariants I-71/I-74; the schema permits the full `Resolution` enum on every conflict. `base`/`ours`/`theirs` value slots are unconstrained JSON (`true` schema). **`MergeBase`** (canonical here): `required: ["provider","ref"]`, both `string`, `additionalProperties: false`. `additionalProperties: false` throughout. |
| `federation-events.json` | Add three optional properties **inside `$defs.FederationEvent.properties`** (not the top-level file object): **(1)** `mergeStrategy`: `{ "type": "string", "enum": ["detect-only", "three-way-semantic"] }`. (Deliberately broader than `MergeResult.mergeStrategy`, which is `const: "three-way-semantic"`: a `MergeResult` exists only for an actual three-way merge, whereas the event log may also record a `detect-only` reconciliation. Do not unify the two.) **(2)** `mergeBase`: `{ "$ref": "#/$defs/MergeBase" }`, and add a `MergeBase` entry to **this file's** `$defs` that is byte-identical to the canonical one in `merge-result.json` (cross-file `$ref` is not used; identity is enforced by `check-schema-sync.sh`). **(3)** `mergeResultPath`: `{ "type": "string", "description": "Relative path to a persisted MergeResult file." }`. These are only meaningful when `event === "merge"`; that co-occurrence and I-73's mandatory-on-completion obligation are invariant-enforced, not schema-enforced (no `if/then`). No existing property changes; `FederationEvent.additionalProperties` stays `false` with the new keys added. |
| `source-document-meta.json` | No structural change. (The add/replace-only merge rule [I-71] is a behavioural constraint enforced against the existing `contentChecksum` in `SourceDocumentIndexEntry`; no field is added.) |

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (`merge-result.json` new; `federation-events.json` update)

**Note on spec records:** when Stage 6 runs, author spec records for the assisted-merge capability under `ext:federation` (a subsection alongside `07-14-ext-federation`), the `MergeResult`/`MergeConflict`/`MergeBase` entity descriptions, and invariant records I-67 through I-77.

---

## Rationale

### Why extend `ext:federation` rather than add `ext:merge`

Federation already owns cross-repository reconciliation: it defines merge/split/import events, the conflict-surfacing obligation, and checksum-based no-op detection. Assisted merge is the natural completion of that surface — it answers the question federation already poses ("these two copies diverged; now what?") instead of duplicating the event model and registry in a parallel extension. Detect-only remains a valid conformance point ([I-67]), so the extension stays adoptable in increments.

### Why the merge algorithm is provider-agnostic

Spec independence is a hard SRS constraint: the model must be implementable without any particular tool. Baking git into the normative merge would violate that and couple the data format to a VCS. Defining the merge over resolved data (`base`/`ours`/`theirs`) keeps the algorithm pure and testable in memory, while `MergeBase.provider` lets git, a federation snapshot, or an explicit caller supply the ancestor. This is also what makes the algorithm runnable in a browser/WASM context where the ancestor may come from a `gix`-read git object *or* from a stored snapshot.

### Why git is the recommended (but informative) provider

In the target workflow a repository travels as a zipped git working tree. Because every Record, relation file, and definition is its own JSON file, git already tracks per-entity history and computes a precise `merge-base` for two forks — exactly the ancestor [I-68] needs, with no bespoke history log to maintain. Layering this **syntactic** history (git) under the existing **semantic** version integers (`id@version`, `supersedes`/`refines`) gives two complementary axes: git answers "what did this file look like at the common ancestor," the version integers answer "is this a deliberately published successor." Neither subsumes the other.

### Why binaries are add/replace-only

Three-way text merge is meaningless for opaque bytes (PDF, audio, images). The source-document model already content-addresses files by `contentChecksum` and identifies them by `documentId`; the safe, predictable rule is replace-only with the divergence surfaced ([I-71]). The mergeable *metadata* (sidecar fields) is handled as a normal per-field Record merge, so titles, tags, and provenance still reconcile.

### Relationship to versioning and addressability

This RFC requires **no versioning extension** — none exists in SRS, and none is introduced. Assisted merge depends only on `ext:federation` and a resolvable `MergeBase`; the history substrate is externalised to the provider (git, `federation-snapshot`, `explicit`) precisely so the spec never mandates a version-control mechanism.

It is useful to separate two axes the spec already keeps distinct:

- **Definition versioning** — the integer `version` on Field/Type, part of a definition's address (`id@version`). This is core (always present), not an extension. Merge *reads* it as identity (I-70's collision/lineage rule) but never *creates or bumps* it; a version bump is an author action that merge preserves additively.
- **Record/value history** — base→ours→theirs ancestry. Records carry **no** intrinsic lineage `version` (only a `typeVersion` binding plus timestamps); this axis lives entirely in the `MergeBase` provider, outside the data model.

The two axes are **orthogonal and compose without depending on each other**. Record-value merge keys on `instanceId` and per-`fieldId` base deltas — it functions identically whether or not any definition version ever changes, treating `typeVersion` as a binding to be checked (I-77), not a driver of the algorithm. Definition merge uses `version` only because it is intrinsic to a definition's address, not because merge exercises versioning.

Addressability is **invariant under merge** by construction. Entities are addressed by stable UUID (`instanceId`, `relationId`, `containerId`, `documentId`) and definitions by `namespace/name@version`; these are preserved across copy and merge — the merge changes no `repositoryId` (I-73), mints no new UUIDs (unlike the `new-ids-with-lineage` *copy* strategy), and bumps no `version` (I-70). The `MergeBase` itself is an ancestry resolver, not an address — with one in-model exception: the `federation-snapshot` provider's `ref` is an SRS-internal federation `eventId`, the only case where the base is addressable within the repository.

### Why SQLite is a projection, not a format

A single SQLite file optimises query and indexing but is an opaque binary blob: git cannot three-way merge it, which directly defeats the merge capability this RFC defines, and it bloats a WASM payload. SQLite is therefore appropriate only as a **rebuildable read projection/index** derived from the JSON source of truth (the role reserved for `srs-projection` in the implementation), never as a source-of-truth or merge unit. This RFC adds no SQLite schema and imposes no SQLite requirement; the point is recorded here so the design intent is unambiguous.

---

## Alternatives Considered

### Alt A — CRDTs / ancestorless merge

Embed per-field operation logs (Lamport clocks, vector versions) in every instance so any two copies merge without a shared ancestor. **Rejected.** It imposes permanent metadata weight on every record, complicates the on-disk shape, and is far heavier than the target workflow needs — copies in this model always descend from a shared bundle, so a common ancestor is always available. Three-way merge with a base is simpler, deterministic, and matches how the data is actually distributed.

### Alt B — Last-writer-wins by timestamp

Use `updatedAt` to pick a winner field-by-field. **Rejected.** It silently discards edits, depends on trustworthy clocks across disconnected copies, and provides no audit of what was lost — the opposite of the federation conflict-surfacing guarantee. [I-68] explicitly forbids this fallback.

### Alt C — Standardise a zip container format (`.srsz`) in this RFC

Define a normative zip layout (the `ext:repository` directory plus `.git`, zipped) as a peer to `.srsj`. **Deferred, not rejected.** A zip is simply an `ext:repository` directory packaged for transport; it needs no new data-model semantics, and standardising a serialization/distribution envelope is implementation territory (the `ZipStore` adapter in `srs-rust`) rather than spec territory. If a portable interchange envelope later needs a normative manifest or magic header, that is its own small RFC. It is left as an open question below.

### Alt D — Make assisted merge mandatory for `ext:federation`

Require every federation implementation to perform three-way merge. **Rejected.** A read-only or constrained consumer can legitimately support import/detect without a merge engine. Keeping merge optional ([I-67]) preserves incremental adoption while still pinning the behaviour for any implementation that opts in.

---

## Open Questions

1. Should SRS standardise a portable zip interchange envelope (working name `.srsz`: the `ext:repository` directory plus an optional embedded `.git`) as a normative peer to `.srsj`, or leave packaging entirely to implementations? (See Alt C.) Leaning: separate, smaller RFC once the `ZipStore` adapter exists and a concrete interchange need is demonstrated.
2. **Resolved (Rev 2):** `MergeBase.provider` is a **free-form string**, not a closed enum. This is forward-compatible with providers not yet imagined and, importantly, keeps a VCS name (`"git"`) out of the normatively-validated value space — preserving spec independence ([I-68] requires *a* resolved base, never a git one). A future RFC MAY narrow to an enum once the provider set stabilises; narrowing a free-form string to an enum of observed values is a compatible tightening. `"git"`, `"federation-snapshot"`, and `"explicit"` are documented as recommended values, not enforced ones.
