> **GitHub issue**: [the-greenman/srs#296](https://github.com/the-greenman/srs/issues/296)

# RFC-038: Tree-authoritative repositories and conflict-free Git storage

**Status**: Draft (Revision 1)
**Affects**: `RepositoryManifest` (`instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, `relationsPath`), `InstanceIndexEntry`, `SourceDocumentIndexEntry`, `RelationsChecksumEntry`, `Relation` storage, `ext:repository` repository layout and archive format, `ext:json-store` (`.srsj`) membership, `dataModelRevision`; `docs/schema/2.0/{manifest,relations-collection}.json` and a new `docs/schema/2.0/relation.json`. Resolves a standing contradiction between `docs/schema/2.0/manifest.json:5` / `docs/spec/srs-spec.md:2507` and RFC-012 [R6] / RFC-013 [R2] / I-80 / I-118. Composed with RFC-039 (Accepted Rev 6 — `#242`) in one first-party cutover at a single `dataModelRevision: 2`. **Breaking (storage layer).**
**Author**: the-greenman (epic-256 worker)
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-07-31 | Initial draft. Design and migration plan only, per the process gate on #296 — no implementation, no schema file edited. All measurements taken over `srs@e0fb4b0` with `srs` built from `srs-rust@356c544`. |

---

## Abstract

A conforming SRS repository today answers "what is in this repository?" twice, and the two answers
are governed by rules that contradict each other. `docs/schema/2.0/manifest.json` calls
`manifest.json` "the authoritative index", requires `instanceIndex`, and `docs/spec/srs-spec.md:2507`
states that "an instance not in the index is not a member, even if its file is present". RFC-012
[R6], RFC-013 [R2] and Invariants I-80 and I-118 state the opposite: the instance file is
authoritative and `instanceIndex` is "the cache of that set … not an independent authority". Both are
ratified. Implementations have quietly picked one.

This RFC resolves the contradiction **in favour of the already-ratified tree-authoritative rule**, and
then supplies the piece that rule has always been missing: RFC-013 [R2] defines membership as "the
union of the instance files **declared by** the repository" without ever saying how a repository
declares them. Removing the index without defining enumeration would leave membership undefined, so
the substance of this RFC is the enumeration contract — reserved instance roots, classification,
diagnostics, and a backend-neutral catalog interface that returns logical identifiers rather than
paths.

The practical consequence is that a routine write stops touching a shared file. Adding one Tier-0
Note writes one file instead of two; creating one Relation writes one file instead of rewriting all
205. Two agents working from the same base no longer conflict over `srs/manifest.json`
(95,846 bytes, 3,560 lines, 375 indexed instances) or `srs/relations/relations.json`
(57,709 bytes, 1,440 lines) when their semantic changes are independent — the failure PR #291
reproduces today.

Three findings changed the design during drafting and are flagged rather than buried. The discovery
rule proposed in the issue's own option appraisal is **under-inclusive against the live corpus** and
would lose 7 instances (Change B). `$schema` cannot carry classification in either direction —
**29 live Tier-2 Records have no `$schema` at all**, and the one record that declares `record.json`
most loudly does not conform to it (Change C). And retiring `sourceDocumentIndex` costs **no
tombstones** — there are zero in the corpus — but does surface one live index/tree disagreement
(Change F).

---

## Motivation

### Problem 1 — the specification contains a direct contradiction about membership

Two ratified sources say incompatible things, in as many words.

**Membership is the index.** `docs/schema/2.0/manifest.json:5` describes the manifest as one that
"Acts as the authoritative index and entry point for the repository", and the schema lists
`instanceIndex` among its `required` properties. The prose is blunter still —
`docs/spec/srs-spec.md:2507`, in the `RepositoryManifest` definition:

> An instance not in the index is not a member, even if its file is present.

and `docs/spec/srs-spec.md:2849`, for the JSON Store:

> The `instanceIndex` in `manifest` is the authoritative list of members. A key present in `data` but
> absent from `instanceIndex` is not a repository member.

**Membership is the tree.** RFC-012 [R6] (`rfcs/rfc-012-discovery-contract-text-projection.md:247`):

> The authoritative source for membership is the instance file and the relations file. An
> implementation MAY use `instanceIndex` as a cache for performance, but MUST treat the instance file
> and relations file as authoritative when they differ from the cache.

RFC-013 [R2] (`rfcs/rfc-013-required-root-container.md:138`) repeats it, and the invariants carry it
into the normative spec at `docs/spec/srs-spec.md:3183` (I-80 — "The manifest instanceIndex is the
cache of that set (RFC-012 R6), not an independent authority") and `:3267` (I-118).

These cannot both hold. Take a valid instance file present in the tree and absent from the index:
`:2507` says it is not a member; I-80 says the index is not an authority and the instance set is the
union of the instance files. A conforming implementation cannot satisfy both, and today's does not
try — it walks `manifest.instance_index`, which is the `:2507` reading, while the invariants it also
claims to enforce say the opposite.

This is not a drafting nit. Every decision in this RFC is downstream of which rule wins, and the
question has been open long enough that both answers have consumers.

### Problem 2 — the authoritative index is a shared mutable file, so independent work conflicts

Because membership is recorded centrally, every write that adds or removes an instance edits the
same file. `srs/manifest.json` is **95,846 bytes across 3,560 lines** and indexes **375 instances**
(measured at `srs@e0fb4b0`). Adding one Tier-0 Note writes the note file — unique path, unique
`instanceId`, colliding with nothing — and then edits the one file every other concurrent writer is
also editing.

PR #291 is the reproduction the issue cites: six independent notes, six unique paths, no semantic
overlap, and a conflicting PR. Nothing about the six notes conflicts. The index does.

Relations have the same shape and a worse constant. `srs/relations/relations.json` is **57,709 bytes
across 1,440 lines holding 205 relations** (99 `precedes`, 106 `contains`). The relations-storage
rule at `docs/spec/srs-spec.md:2676` requires a collection object, so creating one relation
rewrites the file that holds the other 204.

`relationsPath` already accepts `string | string[]` and concatenates, so an implementation may
already shard. Sharding reduces the collision probability without removing the failure mode: two
writers assigned to the same shard still rewrite the same file, and the shard assignment itself has
to come from somewhere.

### Problem 3 — a global path-keyed array is not portable to the backends the model claims

The SRS core is a logical tree that may be represented by a filesystem, a JSON store, or a database.
`InstanceIndexEntry` is a path-keyed array, which a filesystem satisfies naturally, a JSON store
satisfies by convention, and a database can satisfy only by emulating a filesystem inside a column.

The Rust implementation has already recorded this as a defect rather than a property: ADR-041
("Storage backend guardrails") identifies instance enumeration walking `manifest.instance_index`
instead of asking the store, and its G3–G5 direction requires logical-id, query-shaped persistence
precisely so a database backend is not reduced to a path-keyed JSON-blob store.

There is a second-order effect worth stating because it has already caused a defect. When membership
is a path array, the tempting implementation of "list everything" is a path glob — and RFC-039 [R13]
was established after exactly that glob missed an entire record root. A membership model that hands
out paths invites path-shaped enumeration, and path-shaped enumeration is incomplete by construction
in this corpus (Change B).

---

## Proposed Changes

### Change A — the manifest becomes the repository descriptor; the store answers membership

The repository's **authoritative instance set** is the set of SRS instances the authoritative store
reports, not a list recorded in a file. On a filesystem that means the instances discoverable in the
reserved instance roots (Change B); in a JSON store, the `data` entries whose keys fall under those
roots; in a database, whatever the backing query returns.

`manifest.json` remains required, remains exactly one per repository, and remains the entry point.
What changes is its job: it describes the repository — identity, configuration, declared extensions,
package references, the root container — and stops enumerating its contents.

This resolves Problem 1 in favour of RFC-012 [R6], RFC-013 [R2], I-80 and I-118, which are the
already-ratified rules and the ones the root-container guarantee is built on. The consequence is that
`docs/spec/srs-spec.md:2507` and `:2849` and the manifest schema's "authoritative index" description
are **wrong after this RFC and must be retired**, not merely deprecated: they state the losing side
of a contradiction.

What this forecloses: after this RFC there is no supported way to have a valid instance file inside a
reserved root that is *not* a member. Exclusion by omission from a list is gone. If a repository
needs to hold an SRS-shaped file that is not a member, it must live outside the reserved roots — and
Change D makes that an explicit, diagnosable choice rather than a silent one.

### Change B — reserved instance roots, anchored at the repository root and at every local package

A `records/`, `notes/`, or `typed-records/` directory is a **reserved instance root** when it sits
directly beneath either

1. the repository root, or
2. the root of a **local package** — that is, any directory containing a `package.json` conforming to
   `package-manifest.json`.

Discovery recurses through the whole subtree of a reserved root; implementation-defined subfolders
stay legal, which they must, because the live corpus depends on them. Anything not under a reserved
root is application content and is not discovered.

**Anchors are discovered, not configured, and this is the part the issue's option appraisal got
wrong.** That appraisal recommends scanning "`records/**`, plus `records/**` under each declared
local package boundary". Taken literally against `srs@e0fb4b0`, that rule loses instances. The
manifest's `packageRefs` declares five local packages — `package/base`, `package/core`,
`package/spec-authoring-core`, `package/spec-rfc-process`, `package/metamodel` — and **all 7
instances under `package/records/` are beneath none of them**. They sit beside
`srs/package/package.json`, a sixth package manifest (`srs-specification-package`, namespace
`com.semanticops.srs`, version 2.0.0) that `packageRefs` does not list. A rule keyed on *declared*
package boundaries silently drops 7 of 375 indexed instances (1.9%); a rule keyed on the *presence of
a package manifest* finds them. This RFC therefore keys on presence.

**Legacy top-level roots are retained as reserved but are not where the data is.** The layout table at
`docs/spec/srs-spec.md:2448` assigns Tier 0 to `notes/`, Tier 1 to `typed-records/` and Tier 2 to
`records/`. The live spec repository has no top-level `notes/` and no top-level `typed-records/` at
all: **all 19 Tier-0 Notes are stored under `records/notes/`**. This is legal today only because
`:2472` permits implementation-defined subfolders "so long as every instance remains listed in
`RepositoryManifest.instanceIndex` with its full relative path" — a permission whose precondition
this RFC removes. Two consequences follow, and both are load-bearing:

- the subfolder permission must be restated unconditionally, since its stated condition is going away;
- **folder position MUST NOT imply tier.** Any rule of the form "`notes/` holds Tier 0" would
  misclassify all 19 live Notes. Tier comes from the object (Change C), never from where it sits.

### Change C — classification is declared-then-validated, and `$schema` is not sufficient in either direction

An object in a reserved root is classified by **its own content**:

- when `$schema` is present, it names the *intended* entity, and the object MUST validate against that
  schema — a mismatch is an error, not an invitation to reclassify by shape;
- when `$schema` is absent, the object MUST validate as **exactly one** entity; zero matches or two or
  more matches are both errors.

Both halves are forced by the corpus, and it is worth being precise about why, because the obvious
simplification — "require `$schema`" — is not available.

**`$schema` absent does not mean "not an instance".** Measured over `srs@e0fb4b0`, **29 live Tier-2
Records carry no `$schema`**: 7 under `srs/package/records/` and 22 under
`docs/spec/examples/gallery-project-v2/`. This is not sloppiness, it is what the specification
permits — `docs/spec/srs-spec.md:2692` says every JSON file "**should** declare its schema", a SHOULD,
not a MUST. Requiring `$schema` would invalidate 29 conforming records and rewrite two trees to buy a
classification shortcut.

**`$schema` present does not mean "conforms".** `tests/rfc-032/records/showcase-instance.json`
declares `$schema: …/2.0/record.json` and then stores its values under a property named `values`,
which `record.json` does not define. It is the single most confidently-labelled record in the corpus
and it does not validate. A classifier that trusts the declaration accepts a non-conforming record;
one that falls back to shape when the declaration fails silently relabels a broken file as something
else. Hence: the declaration selects, validation decides, and disagreement is an error.

### Change D — a closed candidate policy, so nothing is skipped silently

Inside a reserved instance root, exactly three outcomes are legal: the file is a conforming SRS
instance; or it is a **recognised sidecar** (`ext:addressability` `.revisions.json` files, which
already live beside records and are not instances); or it is an **error**. Malformed JSON, an
unrecognised shape, and an ambiguous shape are all diagnosed and named. Nothing under a reserved root
is skipped quietly.

Outside the reserved roots, files are application content: not discovered, not validated, not
touched. This is what keeps a repository able to hold a `README.md`, a build script, or an unrelated
`config.json` without the discovery layer forming an opinion about it.

The rule this replaces is a non-rule. Today an unindexed instance file is "not a member, even if its
file is present" (`:2507`) — which is to say, invisible, with no diagnostic and no way to tell an
intentional exclusion from an authoring mistake.

### Change E — Relations become one object per file

A Relation is stored as a standalone object at `relations/<relationId>.json`, one relation per file,
declaring `$schema: …/2.0/relation.json`. The collection format
(`relations-collection.json`) is retired as a **live** storage format; it survives only inside
snapshots (Change H), where a single immutable document is the point.

**The filename is the `relationId` and nothing else.** A relation's type, endpoints and prose may all
be edited; its identity may not. Naming by UUID means a relation file is never renamed, needs no
central allocator to avoid collisions, and its name is derivable from its content. A slug-based name
would churn on every retype and would need a disambiguator anyway.

`relationId` uniqueness across the repository is not new — `docs/spec/srs-spec.md:2676` already
requires it across all relation files. What changes is that violating it is now detectable as a
duplicate-logical-id error (Change G) rather than depending on where a concatenation happened to put
two entries.

**Enumeration order is defined and is not filesystem order.** Relations enumerate in ascending
`relationId`; instances enumerate in ascending `instanceId`. Directory iteration order is not stable
across platforms or backends, and every consumer that renders, exports or diffs needs a total order
that a database can reproduce without storing paths.

### Change F — source documents are identified by sidecar, and the corpus has no tombstones

`sourceDocumentIndex` is retired. A source document is identified by its `.meta.json` sidecar under
`sourceDocumentsPath`; the sidecar is the identity and the content file may be absent, which is the
tombstone case Invariant I-112 already permits.

The option appraisal's stated worry here was that retiring the index would destroy index-only
tombstones. Measured over `srs@e0fb4b0`, that worry does not materialise: of 4 index entries, **every
one has its content file present on disk — there are zero tombstones to preserve.** The migration
therefore has nothing to convert, and the appraisal's "retain the index solely for tombstones" option
is answered by a count rather than by argument.

The scan did surface a different discrepancy, which is the fail-closed audit case rather than a
tombstone. `srs/source-documents/` holds 7 content files in three classes:

| Class | Count | Files |
|---|---|---|
| Sidecar present, indexed | 4 | 3 under `ai-sessions/`, plus `spec/srs-spec.md` |
| **Sidecar present, NOT indexed** | **1** | `spec/srs-purpose-and-scope.md` |
| No sidecar, not indexed | 2 | `applications/scds_governance_application_profile.md`, `rationale/scds-rationale.md` |

`spec/srs-purpose-and-scope.md` is precisely a case where index and tree disagree: index-authoritative
rules say it is not a source document, sidecar-authoritative rules say it is. Under this RFC it
becomes one. That is a real membership change to a first-party repository and it is listed as a
migration audit item (Phase 0) rather than allowed to happen as a side-effect of the cutover. The two
files with no sidecar are unmanaged raw material and stay that way — they are not JSON, not in a
reserved instance root, and nothing about this RFC makes them members.

### Change G — duplicate and dangling identifiers become hard errors that name every locator

Two diagnostics move from "undetected" to "error".

**Duplicate logical id.** Two objects claiming the same `instanceId`, `relationId`, or `documentId`
are an error naming **every** conflicting locator, not just the second one found. When a global index
was the authority this was structurally near-impossible; with the tree authoritative it becomes
possible, so it must be diagnosed. Naming one locator would send an author to whichever file the
enumeration happened to reach second.

**Dangling reference.** A reference from one object to another that resolves to nothing is an error.
The issue's Required decisions name dangling references, and there is a live one to calibrate against
— srs#307. Four Types (`com.semanticops.srs/meta.spec-part@1`, `meta.concept@1`,
`meta.specification@1`, `meta.requirement@1`) each assign `fieldId`
`f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5c`, which no Field defines. The intended Field is almost
certainly `com.semanticops.srs/canonical_key` at
`f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c` — the same UUID with two groups transposed — and it is
referenced by **no Type at all**. `srs repo validate --repo srs` reports **0 errors** over this
today (38 warnings, all pre-existing tag-vocabulary noise).

This RFC does not fix srs#307; it is the acceptance test for the rule. A conforming implementation of
[R12] fails loudly on that repository, and the reference in a `FieldAssignment` is exactly the edge
that must be checked, since it is the one currently unchecked.

### Change H — a live catalog is derived and non-authoritative; snapshots stay as they are

Two things that both look like "a list of what is in the repository" are separated, because conflating
them is how the manifest index became authoritative in the first place.

A **live catalog** is a derived, rebuildable view produced by enumerating the authoritative store. It
may be cached in memory, on local disk outside version control, or in a database materialised view.
It is never a membership authority; it MUST be invalidated or rebuilt when the underlying content
changes, and MUST NOT be committed as a repository member. A cache that is committed is a shared
mutable file, which is the problem this RFC exists to remove.

A **snapshot** is an immutable point-in-time artifact — a `.srs` archive or a `.srsj` document. Within
a snapshot the enumerated contents *are* authoritative, because the snapshot is closed by
construction.

**No new serialised catalog format is standardised by this RFC.** `.srs` and `.srsj` already enumerate
their own contents, and `RepositorySnapshot` already carries instances and relations through
portability without paths. Standardising a dated inventory would add a schema, a verification rule and
a second thing to keep in sync, ahead of a consumer that needs it. If one is standardised later its
identity MUST be content-derived (a digest), with observation time and source revision as optional
provenance — a generated wall-clock timestamp inside an export would break the deterministic-archive
property ADR-039 requires.

### Change I — archives and `.srsj` enumerate from the store, not from the index

Both formats are specified today in terms of the index, and both statements have to change.
`docs/spec/srs-spec.md:2716` requires an archive to contain "All instance files referenced in the
manifest instance index", with produce step 1 "Verify the manifest instance index is complete and
consistent with the filesystem" and consume step 4 "Load all instances via the instance index".

After this RFC: producing an archive enumerates the authoritative store and writes every discovered
instance, every relation file, and every source-document sidecar and content file. The
completeness check becomes an internal consistency check of the snapshot — every reference resolves
within it — rather than a check of a list against a filesystem. Consuming an archive discovers
instances from the unpacked tree by the same rules as any repository, which means an archive and the
repository it came from are read by one code path instead of two.

For `.srsj`, membership is the `data` keys falling under reserved roots, and
`docs/spec/srs-spec.md:2849` is retired with `:2507`. RFC-039 [R13]'s prohibition applies with
particular force here: `data` keys are strings that look exactly like paths, and matching them with a
glob is the same defect in a new place. Reserved-root membership is decided by parsing the key into
segments and testing the anchor, not by pattern-matching the string.

### Change J — which manifest fields go, and which stay

Removed, because they are membership inventories or caches of them: `instanceIndex`,
`containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, and `relationsPath` (relation location
is now fixed by Change E rather than configured). The `InstanceIndexEntry`,
`SourceDocumentIndexEntry` and `RelationsChecksumEntry` shapes are retired with them.

Retained, because they are repository configuration and identity rather than contents:
`$schema`, `srsVersion`, `dataModelRevision`, `repositoryId`, `namespace`, `title`, `description`,
`declaredExtensions`, `container`, `packageRef` / `packageRefs`, `upstreamPackage`,
`sourceDocumentsPath`, `changelogPath`, `federationPath`, `federationEventsPath`, `aiGuidance`,
`meta`, `renderedPresentations`, `slice`, `createdAt`, `updatedAt`.

`instanceIndex` moves from `required` to absent, which is the single change that makes a routine
create stop touching the manifest.

**The root container is retained and untouched.** `manifest.container` stays inline and stays
canonical. Structural membership composition remains #267's, and this RFC neither changes
`memberInstanceIds` semantics nor takes a position on them. It does add one requirement in the
negative: a routine unscoped instance create MUST NOT modify the root container — otherwise the
hotspot simply moves from `instanceIndex` to `container.memberInstanceIds` and nothing is fixed.
Deliberate root-membership edits remain deliberate shared-file writes, and conflicting on those is
correct behaviour.

`containerIndex` deserves one sentence of justification since it is not obviously a membership claim:
non-root containers are ordinary discoverable objects under `containers/`, so the index is a lookup
cache, and its I-82 use is diagnostic rather than authoritative.

### Change K — a backend-neutral catalog interface that returns identifiers, not paths

Enumeration becomes a **store operation** returning logical identifiers with their kind and tier. A
service layer validates that result into a catalog; clients consume the catalog. Paths do not appear
in that contract: they are adapter-private locators, used for diagnostics (so an error can name a
file) and for projecting a portable tree, never as semantic identity.

This is what makes the model portable rather than filesystem-shaped with adapters bolted on. A
filesystem adapter walks reserved roots; a JSON-store adapter filters `data` keys; a database adapter
issues a query and never synthesises a path at all. Each returns the same logical catalog for the
same logical content, and a duplicate id is diagnosed identically by all three.

It is also the enforcement point for RFC-039 [R13]. If enumeration is a store operation returning
ids, there is no path list for a client to glob over, and the defect that rule was written for cannot
recur at this layer.

---

## Conformance Rules

> **[R1]** The authoritative instance set of a repository MUST be the set of SRS instances reported by
> the authoritative store. `manifest.json` MUST NOT be treated as a membership authority. An
> implementation MAY maintain a derived catalog for performance but MUST treat the store as
> authoritative when the two differ.

> **[R2]** `manifest.json` MUST remain required, exactly one per repository, and MUST NOT contain
> `instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, or `relationsPath`
> at `dataModelRevision ≥ 2`. A reader encountering any of them at `dataModelRevision ≥ 2` MUST report
> an error naming the file and property, and MUST NOT silently ignore it.

> **[R3]** On a filesystem repository, a directory named `records`, `notes`, or `typed-records` is a
> reserved instance root if and only if it is an immediate child of the repository root or of a
> directory containing a `package.json` conforming to `package-manifest.json`. Discovery MUST recurse
> through the entire subtree of a reserved instance root. Reserved instance roots MUST NOT be
> determined from `packageRefs` or from any other manifest-declared path list.

> **[R4]** The tier and kind of an instance MUST be determined from the object's own content. An
> implementation MUST NOT infer tier from the name or position of the directory containing it.

> **[R5]** When an object under a reserved instance root declares `$schema`, it MUST validate against
> that schema. Failure MUST be reported as an error naming the file and the declared schema, and the
> implementation MUST NOT reclassify the object by shape.

> **[R6]** When an object under a reserved instance root does not declare `$schema`, it MUST validate
> as exactly one SRS entity. Matching zero entities, or two or more, MUST be reported as an error
> naming the file and the candidate entities.

> **[R7]** Every file under a reserved instance root MUST be a conforming SRS instance, a recognised
> sidecar of one, or an error. Malformed, unrecognised, and ambiguous files MUST each produce a
> diagnostic naming the file. An implementation MUST NOT skip such a file silently.

> **[R8]** Files outside every reserved instance root MUST NOT be discovered as instances, MUST NOT be
> validated as SRS entities, and MUST be preserved unmodified by any repository operation.

> **[R9]** A Relation MUST be stored as a standalone object at `relations/<relationId>.json`
> containing exactly one Relation and declaring `$schema` of `relation.json`. Creating, updating, or
> deleting one Relation MUST NOT read or write any other Relation's file. At
> `dataModelRevision ≥ 2` a live repository MUST NOT contain a relations-collection file.

> **[R10]** Enumeration MUST be deterministic and total-ordered by logical identifier ascending —
> `instanceId` for instances, `relationId` for Relations, `documentId` for source documents.
> Implementations MUST NOT expose filesystem or key iteration order as enumeration order.

> **[R11]** Two objects declaring the same logical identifier MUST be reported as an error that names
> **every** conflicting locator. An implementation MUST NOT resolve the conflict by precedence,
> recency, or enumeration order.

> **[R12]** A reference from one object to another that resolves to no object in the authoritative
> set MUST be reported as an error naming the referring object, the referring property, and the
> unresolved identifier. This includes `FieldAssignment.fieldId`.

> **[R13]** A source document's identity MUST be its `.meta.json` sidecar under `sourceDocumentsPath`.
> A sidecar whose content file is absent MUST remain a valid source document (I-112). Source-document
> discovery MUST be by sidecar enumeration.

> **[R14]** A derived catalog MUST NOT be committed as a repository member, MUST NOT be used as a
> membership authority, and MUST be invalidated or rebuilt when the authoritative store changes. An
> implementation MUST verify a materialised catalog against content before serving it as a current
> view.

> **[R15]** Within an immutable snapshot (`.srs`, `.srsj`), the enumerated contents ARE authoritative
> for that snapshot. Producing a snapshot MUST enumerate the authoritative store. Consuming one MUST
> discover instances by the same rules as a live repository of the same `dataModelRevision`.

> **[R16]** If a serialised catalog artifact is standardised in future, its identity MUST be derived
> from a content digest. Observation time and source revision MUST be optional metadata. A generated
> wall-clock timestamp MUST NOT be written into a deterministic export (ADR-039).

> **[R17]** In `ext:json-store`, repository membership MUST be the set of `data` keys resolving under
> a reserved instance root per [R3], determined by segment-wise resolution of the key. An
> implementation MUST NOT determine membership by glob or substring match over `data` keys
> (RFC-039 [R13]).

> **[R18]** A repository or package at `dataModelRevision ≥ 2` MUST satisfy this RFC's storage
> contract. A reader encountering `dataModelRevision ≤ 1` data MUST reject it with a diagnostic naming
> the file and the expected revision, and MUST NOT coerce, partially read, or migrate it in place.

> **[R19]** A routine instance create, update, or delete that is not an explicit container-membership
> operation MUST NOT modify `manifest.json`, MUST NOT modify `manifest.container`, and MUST NOT read
> or write any instance file other than its own target.

> **[R20]** The store enumeration interface MUST return logical identifiers with kind and tier, and
> MUST NOT require a path to address an instance. Locators MAY be returned as adapter-private
> diagnostic metadata and MUST NOT be used as semantic identity.

---

## Schema changes

**No schema file is edited by this RFC.** Per the process gate on #296 this is design only; the table
below is the reviewed contract that the Phase-B cutover (#297) implements, in the composed release
train with RFC-039.

| Schema file | Change | Effect on existing data |
|---|---|---|
| `manifest.json` | Remove `instanceIndex` from `required`; remove the `instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, `relationsPath` properties and the `InstanceIndexEntry` / `SourceDocumentIndexEntry` / `RelationsChecksumEntry` definitions; retitle away from "authoritative index" | All 3 first-party manifests are rewritten. `srs/manifest.json` loses ~3,400 of 3,560 lines |
| `relation.json` | **New file.** Standalone single-Relation entity, `$schema`-declaring, same field set as a `relations-collection` member | 205 relations in `srs/` and 1 collection in `conformance/discovery/fixture-repo/` become one file each |
| `relations-collection.json` | Retained for snapshot use only; documented as not a live storage format at `dataModelRevision ≥ 2` | `srs/relations/relations.json` and `gallery-project-v2/relations/relations-collection.json` are removed after conversion |

Prose in `docs/spec/srs-spec.md` retired or rewritten by the same cutover: the `RepositoryManifest`
membership sentence (`:2507`), the JSON-Store membership rule (`:2849`), the repository layout
subfolder condition (`:2472`), Relations storage (`:2676`), and the archive produce/consume steps
(`:2716`–`:2750`). Invariants I-80 and I-118 are **not** retired — they are the rules this RFC
ratifies — but their wording, which describes `instanceIndex` as a cache, needs the reference to a
now-absent property removed.

Schema changes are synced to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`
through those repositories' own pipelines, from the `srs` release artifact. Their mirror PRs MUST
merge **before** the `srs` schema PR — a rule already violated once, on RFC-036, which turned
`srs-rust` `master` red. That ordering binds the Phase-B PR, not this one.

---

## Migration plan

The owner decision recorded on #296 fixes the boundary: there are **no SRS repositories in the wild**.
No public upgrade command, no compatibility reader, no supported intermediate format, and no
migration of third-party artifacts is owed. The corpus that must reach the final contract is the spec
repository, muSrs in `muDemocracy.org`, and first-party fixtures, examples, seeds and mirrors.

### Composition with RFC-039

RFC-039 (Accepted, Rev 6) states its side at
`rfcs/rfc-039-record-field-value-carrier.md:1093`: the designs are independently reviewable and have
no shared normative surface, first-party data moves **once**, and where they touch —
`manifest.json`'s stamped revision and `.srsj` enumeration — "RFC-038's decisions govern placement and
this RFC's govern value shape". This RFC adopts that division without amendment.

Concretely: both land at a **single `dataModelRevision: 2`**, in the composed #242 / #296 release
train tracked on #297. Neither ships alone, and this RFC does **not** take revision 3. Within one
migration run, RFC-039's Phase 0 (definitions) → 1 (instances) → 2 (repository) transform runs on
instance *content*; the phases below run on instance *placement*. Placement is applied last within
each phase so the carrier transform never has to resolve a file it has just moved.

### Phase 0 — audit, before anything is written

1. Enumerate all five instance-bearing trees under the new rules and diff against the current
   `instanceIndex` where one exists. Every discovered-but-unindexed and indexed-but-undiscoverable
   object is reported and resolved explicitly — adopted, relocated, or removed. **Fail closed**: the
   migration does not proceed with an unresolved disagreement.
2. Resolve the known disagreement `spec/srs-purpose-and-scope.md` (Change F) — sidecar present, not
   indexed; it becomes a member unless deliberately removed.
3. Resolve srs#307 (Change G) or record it as a known failure the new diagnostics will surface. It is
   fixed on its own row, not here.
4. Record baseline counts, identifier sets and content hashes for parity checking: 386 Tier-2,
   2 Tier-1, 22 Tier-0 instances and 205 relations, measured per tree, at the cutover base commit.
5. Confirm `conformance/discovery/fixture-repo/` — which today fails `srs repo validate` outright for
   a missing root container (RFC-013 I-79), independently of this RFC — is either fixed or explicitly
   scoped out of the parity check.

### Phase 1 — transform placement

6. Write each relation in every collection to `relations/<relationId>.json`; verify the set of
   `relationId`s is unchanged and unique; delete the collection file.
7. Strip the retired inventories from each manifest; stamp `dataModelRevision: 2` on every first-party
   repository and package manifest, including the six under `srs/package/` — of which only `metamodel`
   carries a stamp today.
8. Leave instance files where they are. No instance moves: every one of the 375 indexed instances in
   `srs/` is already under a reserved root by [R3] — 368 under `records/**` and 7 under
   `package/records/**`. This is a property of the corpus, verified in Phase 0, not an assumption.

### Phase 2 — verify

9. Re-enumerate and assert identity-set parity against the Phase-0 baseline: same instance ids, same
   relation ids, same document ids, same content hashes per instance.
10. Assert `srs repo validate` reports 0 errors, and that the new diagnostics fire where Phase 0 said
    they should.
11. Re-render `docs/spec/` and assert the rendered output is unchanged except where a retired property
    is quoted — placement changes must not change rendering.
12. Round-trip each `.srs` and `.srsj` artifact through pack/unpack and assert byte-stability of the
    deterministic archive (ADR-039).
13. Run the two mergeability proofs the issue requires as acceptance (below).

### Rollback

`git revert` of the cutover train, per the owner decision that git history is the development recovery
mechanism. There is no downgrade converter and none is owed: a staged-tree-plus-backup-artifact
procedure would be the right answer for a public migration and is unnecessary for a first-party one.

### Acceptance tests

The issue's acceptance criteria, as executable checks:

1. Two branches from one base each add a Tier-0 Note. Neither diff touches `manifest.json`. The
   branches merge with no textual conflict, and enumeration from the merge result finds both notes.
   PR #291 is the fixture.
2. Two branches from one base each create a Relation. Neither touches a shared file; merge is clean;
   both relations enumerate.
3. Filesystem, JSON-store, memory/tree and a database-shaped store return the same catalog — same ids,
   same tiers, same order — for the same logical content.
4. A duplicate `instanceId` and a duplicate `relationId` each produce an error naming both locators.
5. A malformed JSON file under a reserved root is an error; the same file outside every reserved root
   is untouched and undiagnosed.
6. A sidecar with no content file survives migration as a source document.
7. A catalog that disagrees with content is rebuilt or rejected, never served.
8. srs#307's dangling `fieldId` is an error under [R12].

---

## Corpus

Every figure below was measured at `srs@e0fb4b0` by an exhaustive walk of **1,011 files (891
JSON/`.srsj`)**, with `srs` built from `srs-rust@356c544`. Per CC-10, each row states the tree it was
measured over; nothing here is an `srs/`-scoped figure quoted corpus-wide.

| Tree | Manifest | `.srs` marker | Instances | `$schema` on instances |
|---|---|---|---|---|
| `srs/records/**` | `srs/manifest.json` | present | 19 T0, 349 T2 | 368 / 368 |
| `srs/package/records/**` | same manifest | — | 7 T2 | **0 / 7** |
| `conformance/discovery/fixture-repo/` | own | **absent** | 1 T0, 2 T1, 8 T2 | mixed |
| `docs/spec/examples/gallery-project-v2/` | own | **absent** | 2 T0, 22 T2 | **0 / 22** |
| `tests/rfc-032/` | **none** | absent | 1 record-shaped object | 1 / 1, non-conforming |

Corpus totals across the exploded `.json` trees: **386 Tier-2, 2 Tier-1, 22 Tier-0**. These match
RFC-039's independently-derived figures, which is the intended cross-check rather than a coincidence:
the two RFCs measured the same corpus by different routes and agree.

Two rows carry design weight beyond their size. `srs/package/records/**` is the tree that falsifies a
`packageRefs`-keyed discovery rule (Change B). `tests/rfc-032/` has no manifest at all, so it is
invisible to every manifest-based enumeration including the current one — it is reachable only under
this RFC's rules, and only once it acquires a manifest, which is a Phase-0 decision rather than an
automatic consequence.

Shared-file sizes at the same commit: `srs/manifest.json` 95,846 bytes / 3,560 lines / 375 indexed
instances / 12 indexed containers / 4 indexed source documents; `srs/relations/relations.json`
57,709 bytes / 1,440 lines / 205 relations (99 `precedes`, 106 `contains`). `relationsChecksums` is
absent from all three first-party manifests, so retiring it costs nothing anywhere.

---

## Rationale

**Why tree authority rather than index authority.** The contradiction had to be resolved in one
direction, and one direction was already load-bearing. RFC-013's required-root-container guarantee is
defined against "the repository's authoritative instance set", with `instanceIndex` explicitly
demoted to a cache; I-80 and I-118 carry that into the invariants. Choosing index authority would
mean amending three ratified rules and the guarantee built on them. Choosing tree authority means
retiring two prose sentences and a schema description that lost an argument the specification already
had.

It is also the only choice that fixes Problem 2. Index authority with better ergonomics is still a
shared mutable file.

**Why enumeration had to be specified here rather than left to implementations.** RFC-013 [R2] says
membership is "the union of the instance files declared by the repository" without saying how they are
declared. That was survivable while `instanceIndex` existed, because the index answered the question
in practice even though the rule said it was not authoritative. Removing the index without defining
enumeration would leave membership genuinely undefined for the first time. This is why the bulk of
this RFC is Changes B–D rather than Change A.

**Why presence of a package manifest, not `packageRefs`.** Because the corpus falsified the
alternative: 7 instances live under a package manifest that `packageRefs` does not declare
(Change B). Beyond the count, a discovery rule that reads a manifest-declared path list reintroduces
the thing being removed — a mutable registry that a writer must maintain, in the file that must stop
being touched.

**Why one relation per file rather than shards.** Sharding is a probability reduction; standalone
files are an elimination. The cost is 205 small files where there was one, which is what the
filesystem is for, and what every instance already does.

**Why no new snapshot inventory.** The appraisal asked whether to standardise one now. Nothing in the
corpus needs it: `.srs` and `.srsj` already enumerate their own contents and `RepositorySnapshot`
already carries portability data without paths. Standardising a format ahead of its consumer is how
`instanceIndex` became normative in the first place — a convenience that hardened into an authority.
[R16] fixes the identity rule now so a future artifact cannot be introduced with a wall-clock
timestamp and break ADR-039 determinism.

**What this RFC deliberately does not decide.** Root-container composition is #267's, and Change J
touches it only to forbid routine writes. Package definition indexes, federation aggregates and
changelog aggregates are out of scope by the issue's own framing and stay out — each is an aggregate
over definitions rather than a membership claim over instances, and each deserves the same analysis
separately rather than by extension from this one.

---

## Alternatives Considered

### Alt A — do nothing

The contradiction stays unresolved and implementations keep choosing. PR #291's failure mode recurs on
every pair of concurrent writers, which for an agent-authored repository is the normal case rather
than the exception. Rejected: the issue exists because the cost is already being paid.

### Alt B — keep the index, make it merge-friendly

Sort deterministically, one entry per line, or a union merge driver. This reduces conflict frequency
without changing that two independent writes touch one file; a union driver silently produces an index
containing both writers' entries *and* whatever ordering artifact results, with no validation that
the result is coherent. It also leaves Problems 1 and 3 entirely: the contradiction stands and the
path array is still not portable to a database. Rejected as a mitigation offered in place of a fix.

### Alt C — manifest-configured discovery roots

Keep an index-like list, but of *roots* rather than instances. Much smaller, and it changes rarely.
Rejected because it recreates a shared mutable registry in the file that must stop being written, and
because the corpus shows the failure mode: `packageRefs` is exactly such a list, and it is already
missing the root that holds 7 instances. A configured list is a list someone must remember to update.

### Alt D — scan the whole repository by shape

No reserved roots; anything that validates as an SRS entity is a member. Simple, and wrong in both
directions: it would capture application JSON that happens to validate, and it makes "add a file to
this repository" a semantic act. It also makes [R7]'s closed candidate policy impossible — with no
reserved boundary there is no set of files within which an unrecognised shape is an error.

### Alt E — require `$schema` on every object

Would make classification a single lookup. Rejected on evidence: 29 live Tier-2 Records have no
`$schema` and are conforming without it, since `docs/spec/srs-spec.md:2692` makes it a SHOULD. The
rule would invalidate them, and `tests/rfc-032/records/showcase-instance.json` shows that a
declaration is not proof of conformance anyway — so validation is needed regardless and the
requirement buys nothing it does not already have.

### Alt F — separate `dataModelRevision` for RFC-038

The issue's option appraisal originally recommended that #242 take the next revision and RFC-038 the
one after. Superseded by RFC-039 as Accepted, which fixes a single shared revision 2 and states that
neither cutover ships alone. Two revisions would imply a supported intermediate state that the owner
decision explicitly removes the need for.

---

## Cross-references

| RFC / ADR | Relationship |
|---|---|
| RFC-012 [R6] | Ratified tree authority for membership; this RFC promotes it to the general rule and supplies enumeration |
| RFC-013 [R2], I-79, I-80 | Required root container defined against the authoritative instance set; retained unchanged, root container stays inline |
| RFC-039 (#242, Accepted Rev 6) | Composed cutover at a single `dataModelRevision: 2`; RFC-038 governs placement, RFC-039 governs value shape |
| RFC-033 / #265 | `dataModelRevision` as a monotonic integer generation stamp |
| ADR-039 | Deterministic `.srs` archives — constrains [R16] |
| ADR-041 | Storage backend guardrails G3–G5; Change K is its enumeration half |
| ADR-042 | Typed logical-id persistence methods; the template Change K extends to relations |
| #267 | Root-container composition — explicitly out of scope |
| #297 / srs-rust#783 | Ecosystem cutover and core implementation |
| #291 | Evidence and acceptance fixture |
| #307 | Live dangling reference; the calibration case for [R12], fixed on its own row |

---

## Open Questions

1. **Does `tests/rfc-032/` become a repository?** It has no manifest, so it is invisible to
   enumeration under both the current rules and this RFC's. It can be given a manifest and migrated,
   or left as fixture data outside the repository model. This RFC does not decide it; Phase 0 does,
   and the choice affects only that tree. Recorded because CC-6 identifies it as a live counter-example
   and it should not be settled silently.

2. **Do `conformance/discovery/fixture-repo/` and `docs/spec/examples/gallery-project-v2/` acquire
   `.srs` markers?** `docs/spec/srs-spec.md:2448` says a reader "must locate the marker before
   treating a directory as a repository", and neither has one, yet both carry a manifest and both are
   loaded as repositories today. This is a pre-existing inconsistency that this RFC neither creates
   nor fixes, but tree-authoritative discovery makes the marker's role more load-bearing — it becomes
   the thing that says where reserved roots are anchored. Flagged for the owner; a Phase-0 decision.
