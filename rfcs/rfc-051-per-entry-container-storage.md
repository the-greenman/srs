> **GitHub issue**: [the-greenman/srs#940](https://github.com/the-greenman/srs/issues/940)

# RFC-051: Per-entry container storage — one file per entry, so concurrent membership edits merge cleanly

**Status**: Accepted (Revision 13)
**Affects**:
- **Storage:** container storage under `containers/` (`ext:repository`).
- **Schemas:** new `stored-container-entry.json`; `container.json` (description); `manifest.json` (revision description). Both existing files are generated, through the metamodel package, generation ledger and closure tests.
- **RFC-043 (Accepted, Revision 11):** [R1], [R2], [R5], [R6], [R7], [R14], [R18] and [R20], plus Change D, restated over stored entries. This is Door 3: RFC-043 Revision 12 (RFC-050, still a Draft, will take the next number).
- **RFC-038 (Accepted, Revision 16 after RFC-052):** [R5], [R8], [R9], [R13], [R14], [R22] and [R23] (Door 3, RFC-038 Revision 17).
- **RFC-043 [R13]:** its "except [R2] diagnostics" exception is extended to this RFC's [R4] and [R6] diagnostics.
- **RFC-026:** reached through RFC-043 [R18], for slices.
- **RFC-010 (Draft), coordinated:** at revision 11 it merges stored containers per [R10], and never emits `container-arrangement`. Its RFC-043 paragraph (line 109) applies to revisions 8–10 only.
- **Builds on RFC-052 (Accepted, the-greenman/srs#941),** which moves the root container into the container set at `dataModelRevision` 10. This RFC is `dataModelRevision` 11.

Answers SP-30 (srs-programme: "Several writers can overwrite each other").
**Author**: design draft (owner, 2026-10-20: "We are getting too close to the point when a spec fix at this level will not be possible again")
**Date**: 2026-10-20

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1–5 | 2026-10-20 | Draft and four review rounds (#940 comments) |
| 6–9 | 2026-10-20 | Owner rulings applied (#940); three more review rounds; the last found no blocking findings |
| 13 | 2026-10-20 | **Accepted by the owner** (2026-10-20, the-greenman/srs#940). Two-phase landing, as RFC-043 and RFC-052: now, this text, the Door 3 amendment notes, the gated records, the key-algorithm mechanism record (the Appendix) and the successor decision record, with the schemas staged under `docs/schema/staged/rfc-051/`; later, in one PR after srs-rust#1414 ships revision 11 (and after RFC-052's promotion), the corpus migration, the schema promotion and the pin advance. No normative rule changes. |
| 12 | 2026-10-20 | Final check (#940): no blocking findings. The re-attached entries join [R8]'s write set; [R13] names every pending migration, and converts a stray flat file at revision 11; [R10] covers a path added on one side; two wording nits. |
| 11 | 2026-10-20 | Review of Revision 10 (#940). Normative content that the simplification had left only in the Changes is restored to the rules. **Blocking, fixed:** [R10] now defines the per-path merge and the never-silent property. **Should-fix, fixed:** RFC-010 coordination; the dangling-pointer row and the withdrawn [R14] pointer clause; repair keys re-attached entries in turn; the decoding definitions move into [R5]; [R13] states the registry entry, pre-load transformer, gate and revision-10 handling; the complex-mode consequence map is restored; create, delete, head `$schema` and classification are in the rules; RFC-043 [R13]'s flattening exception is extended; the Appendix gains the fallback vector; the fixture case names are listed. |
| 10 | 2026-10-20 | **Simplified.** The root-container move is split out as RFC-052. Every rule is stated once (in Conformance Rules); the Changes explain. The normative merge rule is reduced to "merge file by file", and RFC-010's conflict kinds are left to RFC-010. Normalising invalid outlines is replaced by refusal (no corpus has one). The cutover procedure moves to clerk#91, and the fixture list to srs-rust#1414. The key algorithm moves to an appendix, which becomes a mechanism record at acceptance. |

---

## Charter alignment

**Cell(s):** cell:repository, cell:containment, cell:conformance, cell:portability
**Decision mode:** complex

**Governing cell preference:**
- **Repository, "catalog over circumstance":** aligned. Whether membership edits combine becomes a property of the format, not of the merge tool.
- **Containment, "declaration over location":** aligned. Order and nesting are declared per entry (`parent`, `key`), and each entry declares its container.
- **Conformance, "one way over many":** aligned. The spec's merge result and a text merge's agree; there is one key outcome per operation.
- **Portability, "preserve over recognize":** aligned. Entries travel as ordinary files.

**Axis preference:** all default poles.
- **2–8 (Evolution over Continuity):** this is the reason for acting before the flip.
- **5–11 (Reliability over Renewal):** the logical Container and the member operations are unchanged.
- **3–9 (Shared Coherence over Local Autonomy):** one key algorithm.
- **6–12 (Portability over Possession):** the travelling forms carry the layout unchanged.

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-7caca3a1, rfc-decision-e99a9437, rfc-decision-0750c62f, rfc-decision-0118e938, rfc-decision-4431046e, rfc-decision-628cf6c4, rfc-decision-8948e43f, rfc-decision-0df19d60, rfc-decision-2fb87c1e, rfc-decision-86f49083, rfc-decision-5f18603e.

**Contradictions found:** rfc-decision-0df19d60's accepted cost reads *"two writers who reorder one container concurrently conflict as a whole"*. That cost changes: conflicts are now per entry. Its position (order is declared on the Container) stands. This is ruled (ruling 4).

RFC-043's Rationale rejected a stored parent pointer as *"a second representation"*. Here `parent` **replaces** `depth`, so each fact is still stored once.

**One-way-per-goal:** today the spec's [R14] merge and every real text merge disagree. This RFC collapses them into one.

**Layer test:**
- **Which layer owns this?** The logical Container stays on the EXPRESSION plane, selection layer (0750c62f), unchanged. Its storage encoding falls under `ext:repository`. The compass's source-of-truth map has no row for storage encodings; Change G adds one.
- **Consume or clone downward?** Nothing is cloned.
- **Does the layer below stand alone without this?** Yes.

**Consequence map (complex).**

| Option | Repository | Containment | Conformance | Portability | Column coherence |
|---|---|---|---|---|---|
| **This RFC:** per-entry files, `parent` + `key` | membership edits touch disjoint files | order and nesting declared per entry | one merge outcome; one key outcome | files travel as files | Holds. Earth: structure is declared per object. |
| A. An [R14] merge driver | conflict-free only where it is installed | unchanged | two outcomes where it is absent | unchanged | Strained: circumstance over catalog |
| B. Per-entry files keeping `depth` | disjoint files | depth is relative, so a clean merge can break the outline | merge "succeeds", then validation fails | as this RFC | Fails |
| D. Record-side membership | disjoint files | membership declared twice | two ways | as this RFC | Fails (layer rule 1) |
| F. git `merge=union` | no install | unchanged | a "clean" merge produces invalid JSON | unchanged | Fails |

Emergence:
1. Moving a run is a one-file write.
2. The merge result is independent of which side is "ours".
3. A new outcome appears, detached entries (ruling 1).
4. Remaining conflicts are visible to any text tool.

---

## Abstract

A Container's members are one array in one file, so two branches that each add a record to the same container always conflict in git. That happens even though RFC-043 [R14] says such a merge is clean.

This RFC stores each Container as a directory:
- a one-line head file for its own fields;
- one one-line file per entry, naming the entry's container, its parent and an order key.

Adding, removing or moving a member writes only the entries whose stored values change, usually one. Any text merge then reaches the result the specification defines, apart from a few named outcomes, each with a deterministic, non-fatal treatment.

The logical Container (RFC-043's outline of `{instanceId, depth?}`) and the behaviour of every member operation are unchanged in every API, payload, binding and archive reader. Keys come from one shared algorithm, so the same edit always writes the same bytes. The change lands at `dataModelRevision` 11, after RFC-052.

---

## Motivation

**The spec's merge rule and every real merge disagree.** RFC-043 [R14]: *"Ids added by either side MUST be appended at depth 0 … ours before theirs."* Two branches that each add a member therefore merge cleanly by the spec. But git merges the container file line by line, both appends land at the end of one array, and git reports a conflict. RFC-038 met this problem for the manifest index and for relations, and fixed it in storage (*"standalone files are an elimination"*). Container membership is the one shared array left.

**Measured cost** (all four first-party corpora since 2026-08-21; merges re-run with `git merge-tree`; lower bounds):

| Repository | Containers / entries | Member edits: appends / middle inserts / removals / moves / depth changes | Merges with a real conflict / on a container | PR pairs open at once on one container |
|---|---|---|---|---|
| srs-programme | 18 / 850 | 121 / 7 / 0 / 2 / 0 | 7 / 6 | 18 |
| srs (`srs/`) | 19 / 536 | 1 / 5 / 0 / 0 / 0 | 39 / 1 | 1 |
| srs-context | 8 / 176 | 34 / 0 / 4 / 0 / 0 | 5 / 4 | 4 |
| muSrs | 56 / 1,430 | 16 / 0 / 0 / 0 / 0 | 11 / 2 | 3 |
| **Total** | **101 / 2,992** | **172 / 12 / 4 / 2 / 0** | **62 / 13** | **26** |

- **Appends:** 91% of member edits are appends.
- **What the conflicts were:** every container conflict was two appends colliding, each resolved by hand in the same way. On 2026-10-20 alone, four PRs were re-resolved six times.
- **Out of scope:** in `srs`, 38 of 39 conflicts were in generated renders.

**The window.** Every corpus is first-party, and every reader goes through the srs core apart from three `srs` scripts and one srs-vscode schema glob. Past the Continuity flip (axis 2–8), the shared-array layout becomes permanent.

---

## Proposed Changes

These Changes explain. The normative text is the Conformance Rules.

### Change A — A container is a directory

`containers/<containerId>/container.json` is the **head**: every Container property except `memberInstanceIds`. `containers/<containerId>/entries/<instanceId>.json` is one **entry**, holding:
- `containerId`;
- `instanceId`;
- `parent`: optional, another entry's `instanceId`; absent means top level;
- `key`: the position among siblings.

There is no stored `depth`. Names equal the in-file ids, as relation files' names do. A record cannot appear twice in one container, because that would be two files with one name. Each entry declares its container because RFC-038 [R6] requires an object's kind to come from its content, not its location, and so a file copied into the wrong directory is reported rather than silently changing membership.

**Every file is one line.** git pairs similar files as renames. With multi-line files, one commit removing entry X and adding a similar Y, against another branch editing X, merges *cleanly* with the edit landing on Y, silently (reproduced in review). With one-line files the same case is always a visible conflict (tested). Heads are one line for the same reason. The cost is that two concurrent edits to one head conflict even on different fields, which happened once in the 190 measured edits.

### Change B — The outline is decoded from the entries

Readers still see RFC-043's outline. It is decoded from the entries:
1. Siblings (entries with the same `parent`) are ordered by `key`, then `instanceId`.
2. The tree is walked depth-first, each entry before its children.
3. Each entry's depth is its number of `parent` links.

Two outcomes need a rule, because a clean merge can produce them:
- an **orphan**, whose parent has been removed on the other branch;
- a **loop**, from crossing moves.

Both are decoded deterministically and reported as warnings:
- each loop is broken at the entry on the loop with the lowest `instanceId`;
- orphans and loop breaks go to the top level after every attached top-level entry;
- tails and descendants come along beneath them;
- nothing is lost.

Repair re-attaches them. They are warnings because `parent` is layout, Air-column information: the decode rule is the declared authority, and failing closed would turn a routine merge into an unloadable repository (ruling 1).

### Change C — The member operations write only what changes

Every RFC-043 Change D operation keeps its exact behaviour and inputs: add, insert, remove, move, set depth and repair, including adoption and promotion. RFC-043 [R15] stands. What changes is what is written:
- the entry added, moved or removed;
- the entries whose `parent` changes;
- any tied siblings that must be re-keyed.

An append writes one file. A remove also rewrites its children. No operation writes the head.

An operation on a container that holds detached entries first re-attaches them, as part of the same all-or-nothing outcome. Otherwise some outlines (an append at the very end) would have no encoding.

### Change D — Keys from one algorithm

Keys follow the fractional-indexing scheme in the Appendix (ruling 3):
- appends run `a0`, `a1` … `az`, `b00`;
- an insert takes the key between its neighbours;
- every written entry is keyed in outline order, between its preceding sibling and the next sibling that keeps its key.

So one edit always writes the same bytes, wherever it is made.

Concurrent appends compute the same key. The `instanceId` tie-break orders them, and nothing conflicts; this is the 91% case. Where written entries land among equal keys, the write set is decided first:
- if the tied key already places them all by `instanceId`, nothing else is written;
- otherwise the tied siblings after the place are re-keyed.

### Change E — Merging is file by file

RFC-043 [R14] is replaced by one rule: a stored container merges file by file, and the result is the decoding of the merged files. How conflicts are reported is RFC-010's business (a Draft), not this RFC's. Measured against git's behaviour (the full table is in #940):
- **Never silent.** A text merge never silently loses or misapplies a change, because every rename-paired case is a visible conflict.
- **Sometimes conservative.** It can conflict where a per-file reading would be clean (rename/delete, rename/rename). Keeping both sides resolves each.
- **Clean, then reported.** Three clean merges leave a reported state:
  - an orphan or a loop: a warning (Change B);
  - an identity or anchor pointer naming a removed entry: RFC-043 [R3]'s validation error, non-fatal, fixed by a head edit;
  - a container deleted against an added entry: a headless directory, a warning, ignored, and removed by repair.

### Change F — Enumeration, archives, slices, migration

- **Enumeration:** one container per directory that has a head, keyed by `containerId`.
- **Classification:** the head and the entry are told apart by content (`title` against `key`).
- **Travelling forms:** `.srsj` and `.srs` carry the files unchanged in format.
- **Slices:** slices write directories.
- **Migration** (revision 10 → 11, ordered after RFC-052's entry):
  - each container file becomes a directory, with parents derived from RFC-043 [R5];
  - keys are successive appends, so migration is deterministic, and branches that only appended merge cleanly after cutover; others are replayed by clerk#91;
  - an outline that violates RFC-043 [R2] is refused before any write (no current corpus has one);
  - the gate is a normalised outline round trip, byte-identical renders and navigation;
  - the migration is all-or-nothing and idempotent.

**What breaks:**
- **Container files:** 101 container files (2,992 entries) and 4 root containers (37 entries, in the container set since RFC-052).
- **This repository:** 6 fixture containers (35 entries) and 3 fixture roots.
- **`.srsj`:** `gallery.srsj` and four governance seeds.
- **Direct readers:**
  - three `srs` scripts: `check-publication-reachability.mjs`, `part-container-membership.mjs` and `lib/container-entries.mjs`;
  - srs-vscode's `SchemaProvider.ts` glob;
  - srs-web's `rfc038-concurrency` e2e test, which becomes the acceptance test.
- **Nothing else breaks:** records, relations, Compositions, payloads and operation behaviour are unchanged.

### Conformance fixture cases

These are added to `conformance/arrangement`; the detail is in srs-rust#1414:
- concurrent appends with equal keys;
- an orphan;
- a loop with a tail;
- a loop with no attached entry;
- add/add, with equal and with different values;
- a dangling pointer;
- a container deleted against an added entry;
- rename pairing;
- rename/delete and rename/rename;
- write sets with tie runs;
- detached entries followed by an operation;
- deterministic migration;
- head versus entry classification;
- a stray file;
- the key vectors.

### Change G — Spec prose and the compass

- The source-of-truth map row for membership names `srs/containers/<containerId>/`.
- A new row is added for storage encodings, under `ext:repository`.
- The container file-format and path mechanism records are updated.
- The Appendix becomes a mechanism record.

---

## Conformance Rules

> **[R1]** At `dataModelRevision` 11 every Container MUST be stored as a directory `containers/<containerId>/` holding a head `container.json` and, when it has members, `entries/<instanceId>.json`, one per entry. The head MUST conform to `container.json` and MUST NOT carry `memberInstanceIds`. An entry MUST conform to `stored-container-entry.json`: `containerId`, `instanceId` and `key` are required, and `parent` and `$schema` are optional. A head MAY carry `$schema` (RFC-038 [R7]). No other file or subdirectory MAY appear in a container directory; an empty `entries/` MUST be ignored. Create MUST write a head and no entries. Delete MUST remove the whole directory. Copy MUST rewrite every entry's `containerId`, keeping its `parent` and `key`. *(Amends RFC-038 [R5] and [R8], and RFC-043 [R1].)*
>
> **[R2]** In-file ids MUST be authoritative. A directory or file name that differs from its in-file id or from the canonical lowercase UUID form, and an entry whose `containerId` differs from its directory's, MUST be errors. *(Amends RFC-038 [R9]; mirrors [R11].)*
>
> **[R3]** A head and an entry MUST each be written as UTF-8 JSON on one line, with properties in byte-wise key order, no insignificant whitespace, and a trailing LF.
>
> **[R4]** A `key` MUST have the shape the Appendix defines, MUST NOT be the reserved key, and MUST be compared byte-wise. Any other key is an error.
>
> **[R5]** The logical `memberInstanceIds` MUST be decoded as follows.
> - **Detached entries.** An entry is *attached* when its `parent` chain reaches an entry with no `parent`. An *orphan* is an entry whose `parent` names no entry of the container. A *loop* is a set of entries whose `parent` chains return to themselves, including an entry that is its own parent.
> - **Breaks.** Each loop's *break* is the entry on the loop with the lowest `instanceId`, treated as having no parent. Orphans are also treated as having no parent. Every other entry, including tails into a loop and descendants of an orphan, attaches beneath its `parent`.
> - **Order.** Siblings are ordered by `key`, then `instanceId`, byte-wise.
> - **Top level.** The top level is the attached parentless entries, then every orphan and break, in sibling order.
> - **Walk.** The walk is depth-first and pre-order. Each entry's depth is its number of `parent` links to the top level.
>
> Adapters, payloads and archive readers MUST present this form and MUST NOT expose `parent` or `key`. *(Amends RFC-043 [R5].)*
>
> **[R6]** Orphans and loops MUST be reported as warnings and MUST NOT be errors. *(Replaces RFC-043 [R2]'s depth conditions; its unresolved-entry and root-identity conditions stand. Under the latter, the identity entry has no `parent` and is no entry's `parent`.)*
>
> **[R7]** No tool MAY rewrite an entry's `key` or `parent` except as the target of a member operation or the migration. *(Amends RFC-043 [R6] and RFC-038 [R14].)*
>
> **[R8]** Every RFC-043 Change D operation MUST produce the outline RFC-043 defines, with the same inputs and rejections. It MUST first re-attach detached entries as [R11] does, within its own all-or-nothing outcome.
> - **Write set:** it MUST write exactly the entries [R11] re-attaches; the entry it adds, moves or removes; the entries whose `parent` changes; and the tied siblings that [R9] requires. It MUST NOT write any other entry, or the head.
> - **Record-delete cascade:** a cascade MAY write entries only in this way, as declared cascade targets.
>
> *(Amends RFC-043 [R7] and RFC-038 [R22].)*
>
> **[R9]** The entries an operation writes MUST be keyed in outline order, each by the Appendix's *key between* its preceding sibling's key and the key of the next sibling that keeps its key. Where the place lies among equal keys, the write set MUST be decided first:
> - if the tied key places every written entry correctly by `instanceId`, they MUST take it and nothing else is written;
> - otherwise every tied sibling after the place MUST join the write set.
>
> **[R10]** A three-way merge of a stored container is defined per path (each head and entry file):
> - a path added, changed or removed on one side takes that side;
> - a path changed identically on both sides keeps that change;
> - any other combination, delete against modify included, is a conflict on that path.
>
> The merged container is the decoding of the merged paths. A merge MAY report a conflict this definition would not, such as a text merge pairing two files as a rename. It MUST NOT produce a clean result that differs from it, and MUST NOT silently lose or misapply a change. RFC-043 [R14]'s clause *"a merge that would remove the identity or anchor entry MUST be reported as a conflict"* is withdrawn: such a result is RFC-043 [R3]'s validation error ([R14] below), fixed by a head edit. *(Replaces RFC-043 [R14].)*
>
> **[R11]** Repair MUST:
> 1. compute one outline, first removing unresolved entries (RFC-043 [R20]) and then re-attaching every orphan and loop break at the top level, in decoding order, each keyed by the Appendix's *key between* the last attached top-level entry (or the previous re-attached entry) and nothing;
> 2. remove every container directory that has no head;
> 3. report each change it made.
>
> It MUST NOT remove a detached entry. *(Amends RFC-043 [R20].)*
>
> **[R12]** Enumeration MUST return one container per directory that has a head, and MUST NOT enumerate heads or entries as members of any set. An entry's `instanceId` MUST resolve against the instance set. Heads and entries MUST be classified by content: a head requires `title`, an entry requires `key`. Archive writers MUST carry every file of each container they carry. Slices MUST write stored directories. *(Amends RFC-038 [R13] and [R23], and RFC-043 [R18].)*
>
> **[R13]** `dataModelRevision` 11 MUST mean [R1].
> - A binary supporting only revision 10 or lower MUST refuse a revision-11 corpus.
> - A revision-11 binary MUST report a revision-10-or-lower corpus, and any flat container file, as `container-migration-needed`, naming every pending registry entry in order (`rfc052-root-container`, then `rfc051-container-entries`), and MUST refuse other operations.
> - The migration MUST be the registry entry `rfc051-container-entries`, operating on the raw tree and ordered after RFC-052's `rfc052-root-container`. `.srsj`, `.srs` and bundle forms MUST be migrated to the same outcome by a pre-load transformer. It MUST:
>   - key entries as successive appends;
>   - refuse, before any write, an outline that violates RFC-043 [R2], with RFC-043's `arrangement-*` codes;
>   - reproduce every container's logical `memberInstanceIds` (with absent `depth` equal to `depth: 0`), and leave every Composition's render and the navigation order byte-identical; if that gate fails, it MUST write nothing;
>   - be all-or-nothing;
>   - convert any flat container file it finds, even in a corpus already stamped revision 11, and otherwise report `alreadyApplied` on a revision-11 corpus.
>
> **[R14]** Diagnostics MUST carry these codes, severities and load effects:
>
> | Code | Severity | Load | When |
> |---|---|---|---|
> | `container-schema` | error | fatal | a head or entry fails its schema, or a head carries `memberInstanceIds` |
> | `container-name-mismatch` | error | fatal | [R2] names |
> | `container-entry-misplaced` | error | fatal | an entry's `containerId` differs from its directory |
> | `container-stray-file` | error | fatal | any other file or subdirectory in a container directory |
> | `arrangement-key` | error | fatal | [R4] |
> | `container-migration-needed` | error | fatal; only the migration runs | a revision-10-or-lower corpus, or a flat `containers/*.json` |
> | `container-head-missing` | warning | the directory is ignored | entries with no head |
> | `arrangement-orphan` | warning | none | each orphan |
> | `arrangement-cycle` | warning | none | each loop, naming its break |
> | `container-pointer-unresolved` | error | not fatal; fixed by a head edit | `identityInstanceId` or `anchorInstanceId` names no entry (RFC-043 [R3], which assigned no code) |

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `stored-container-entry.json` | **New**, generated from a new metamodel Type `stored-container-entry`, with a ledger row and closure coverage: `containerId` and `instanceId` (UUID, required), `parent` (UUID), `key` (string, pattern `^[A-Za-z][0-9A-Za-z]*$`, required; the Appendix's length and fraction rules are validator checks), `$schema` (`const`); `additionalProperties: false`. The name avoids the metamodel's existing `container-entry` (the logical `{instanceId, depth}`). | One file per entry after migration |
| `container.json` | Description only: a stored head carries no `memberInstanceIds` ([R1]). The definition stays, for the logical form. | Every container file becomes a head |
| `manifest.json` | The `dataModelRevision` description gains revision 11. | None |

---

## Rationale

- **Storage, not a tool.** A merge driver works only where it is installed. GitHub's own merges ignore it, as does every tool that doesn't know SRS. RFC-038 ruled for elimination in storage, and this applies that ruling to the last shared array.
- **`parent` + `key`, not `depth`.** Depth is relative to the previous entry, so as a per-file fact a clean merge could break the outline (Alternative B).
- **Operation behaviour kept.** Operations are defined on the outline; storage only decides what is written.
- **Merge rule reduced to "file by file".** That is all storage can promise. Conflict *classification* belongs to RFC-010, which has no implementation yet.
- **Refusal, not normalisation.** No corpus has an invalid outline, and normalising nothing is code for nobody.
- **Why now:** axis 2–8.

---

## Alternatives Considered

- **A. An [R14] merge driver, tooling only.** Conforming, and it is the fallback if this RFC is deferred (clerk#91 is its first step). It works only where installed, and leaves "ours before theirs".
- **B. Per-entry files keeping `depth`.** A clean merge can break the outline.
- **C. Order kept in the head.** That is the shared file again, and two homes for one outline.
- **D. Records declare their containers.** Two ways to declare membership (layer rule 1, 0118e938).
- **E. Sharding the array.** It reduces conflicts rather than eliminating them.
- **F. git `merge=union`.** It unions lines, not JSON, producing invalid files, and GitHub ignores it.
- **G. A sequence CRDT, or LSEQ/Logoot.** Site identifiers solve ties that `instanceId` already makes harmless.

---

## Rulings

Owner, 2026-10-20 (#940), after testing each option against the compass:
1. **Detached entries: warnings with a deterministic decode, re-attached by repair.** `parent` is Air-column information. Fatal errors would be the named column-coherence violation; tombstones would be a second way to remove. *Tension recorded:* the fallback placement is a stated rule rather than a declaration, and repair restores the declaration.
2. **The root container moves into the container set.** Split out as RFC-052. Owner condition: "soon, and not lost" (srs-rust tracking issues).
3. **One key algorithm** (axis 3–9). Writer-chosen keys would make the same edit conflict across branches.
4. **One new storage decision record at acceptance.** It partially supersedes 0df19d60 (its merge-cost clause) and, through RFC-052, 2fb87c1e (its inline-root exception).

---

## Appendix — The key algorithm

Fractional indexing, after D. Greenspan, *Implementing Fractional Indexing* (2020). This appendix becomes a mechanism record at acceptance.

**Digits.** `0`–`9`, `A`–`Z`, `a`–`z` are the digits 0–61. Their byte order matches their digit order.

**Shape.** A key is an integer part followed by an optional fraction.
- **Integer part:** a head, then digits. Heads `a`, `b` … `z` take 1, 2 … 26 digits (non-negative). Heads `Z`, `Y` … `A` take 1, 2 … 26 digits (negative).
- **Fraction:** a run of digits that MUST NOT end in `0`.
- **Reserved:** `A` followed by 26 `0`s is never written.

**Increment / decrement an integer part.** Add or subtract one in base 62, keeping the head.
- **On overflow:**
  - `Z` becomes `a0`;
  - `z` has no successor;
  - any other head moves to the next letter, and its digits become `0`s: one more digit for a lowercase head, one fewer for an uppercase head.
- **On underflow:**
  - `a` becomes `Zz`;
  - `A` has no predecessor;
  - any other head moves to the previous letter, and its digits become `z`s: one fewer digit for a lowercase head, one more for an uppercase head.

**Midpoint of fractions `x < y`** (`y` may be absent, meaning "the end"):
1. If `y` is present, let *n* be the length of the longest common prefix of `x` (padded with `0`s as needed) and `y`. If *n* > 0, the result is that prefix followed by the midpoint of the remainders.
2. Let *dx* be `x`'s first digit (0 if `x` is empty), and *dy* be `y`'s first digit (62 if `y` is absent).
3. If *dy* − *dx* > 1, the result is the digit ⌈(*dx*+*dy*)/2⌉.
4. Otherwise, if `y` is present and longer than one digit, the result is `y`'s first digit.
5. Otherwise, the result is `x`'s first digit (`0` if `x` is empty) followed by the midpoint of the rest of `x` and the end.

**Key between `a` and `b`** (either may be absent; `a` < `b`):
- **neither:** `a0`;
- **only `b`:**
  - if `b`'s integer part is the reserved one, it followed by midpoint("", `b`'s fraction);
  - else, if `b` has a fraction, `b`'s integer part;
  - else `b`'s integer part decremented. If that would be the reserved key, use the reserved integer part followed by midpoint("", end), which is `A`, 26 `0`s, `V`;
- **only `a`:** `a`'s integer part incremented; if it has no successor, `a`'s integer part followed by midpoint(`a`'s fraction, end);
- **both, same integer part:** that part followed by the midpoint of the fractions;
- **both, different integer parts:** `a`'s integer part incremented, if that is less than `b`; else `a`'s integer part followed by midpoint(`a`'s fraction, end).

**Vectors:**

| Case | Result |
|---|---|
| between nothing and nothing | `a0` |
| after `a0` | `a1` |
| after `az` | `b00` |
| between `a0` and `a1` | `a0V` |
| before `a0` | `Zz` |
| 850th append | `bCh` |
| before `A`, 25 `0`s, `1` | `A`, 26 `0`s, `V` |

Key length: 5,000 appends need at most four characters. 50 inserts at one spot reach 11–12 characters.
