> **GitHub issue**: [the-greenman/srs#296](https://github.com/the-greenman/srs/issues/296)

# RFC-038: Tree-authoritative repositories and conflict-free Git storage

**Status**: Draft (Revision 7)
**Affects**: `RepositoryManifest` (`instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, `relationsPath`), `InstanceIndexEntry`, `ContainerIndexEntry`, `SourceDocumentIndexEntry`, `RelationsChecksumEntry`, `Relation` storage, `ext:repository` repository layout and archive format, `ext:json-store` (`.srsj`) membership and version gate, `ext:slices` (RFC-026 [R5], [R6], [R13]), `dataModelRevision`; `docs/schema/2.0/{manifest,relations-collection}.json` a new `docs/schema/2.0/relation.json`, and two further schemas recorded as owed and absent (a `.revisions.json` sidecar schema, and a `{srsj, manifest, data}` envelope schema that has never existed). Resolves a standing contradiction between the manifest schema / `RepositoryManifest` prose and RFC-012 [R6] / RFC-013 [R2] / I-80 / I-118. **Amends Accepted RFC-039 [R13]/[R14], RFC-026 [R5]/[R6]/[R13] and migration steps, RFC-013 [R6]/[R9], and RFC-017 [R2]/[R12].** Composed with RFC-039 (Accepted Rev 6 — `#242`) in one first-party cutover at a single `dataModelRevision: 2`. **Breaking (storage layer).**
**Author**: the-greenman (epic-256 worker)
**Date**: 2026-07-31

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 7 | 2026-08-01 | Owner direction resolves the remaining apparent migration choices: all first-party repositories and package artifacts migrate now, every migrated repository is made conformant, and no unmentioned repository population exists. The former owner-decision list is therefore a work list. The gallery is an intended repository and receives a marker; the discovery and RFC-032 fixtures remain test data rather than receiving invented repository identity. Revision history is preserved by adding its owed sidecar schema. `com.mudemocracy.governance` owns its namespace's 27 byte-identical definitions, so the duplicate copies leave the broad `com.mudemocracy` package. The two published governance packages join this cutover instead of waiting for #286. The only remaining owner act is formal RFC acceptance after review; no data-policy choice blocks migration. |
| 6 | 2026-08-01 | Owner selected the explicit `muSrs` root reconciliation introduced in Revision 5. The generation-2 inline root keeps `identityInstanceId: dc2723e7-aca3-4562-b893-47bd24da629d`, the Tier-2 `com.semanticops.core/purpose` record required by RFC-029 I-87; retains the purpose and decision log only in `memberInstanceIds`; retains the intent Note and five guides only in `rootInstanceIds`; omits the misleading legacy `containerType: repository-root`; and removes the conflicting standalone Container. This preserves the standalone file's navigational content without preserving its invalid identity choice or its five duplicate membership declarations. The migration and acceptance test now state that exact expected object rather than deferring the choice to the migration operator. |
| 5 | 2026-08-01 | Owner review cross-checked Revision 4 against the previously unmeasured `muSrs` migration target and found seven blocking gaps. **The sole migration inventory omitted `muSrs` entirely**: added its repository manifest, two package manifests and 21-relation collection, making the in-scope relation total 243 across 4 collections. **Its root Container exists twice with the same `containerId` and conflicting `identityInstanceId` values**: Phase 0 now requires an owner reconciliation, preserving the inline manifest Container as the sole generation-2 root representation. **Presence-keyed package discovery exposes 27 duplicated definitions** across `package/` and `packages/governance/`: [R12] now covers definition identifiers, [R13] requires exactly-one resolution, and Phase 0 removes or reconciles the duplicate declarations. **[R9] classified the Markdown payload of every source document as a fatal unrecognised file**: source-document content is now an opaque payload class, with sidecar candidates still closed and validated. **Every conforming `package.json` was inadmissible under its own local-package location**: package manifests are now explicitly admissible, declared definition paths are the definition candidates, and the most-specific nested reserved location wins. **[R17] said five sets after [R1] defined six**: all archive/catalog prose now includes the extension set. **Change F's delete cascade remained forbidden by [R22]**: the cascade exception is now normative and tested. |
| 4 | 2026-07-31 | Review round 2, both reviewers (16 blocking). *(Rule numbers below are Rev-3 numbering unless marked.)* **A ratified invariant says the opposite of Change G**: **Invariant 52** requires every sidecar's `contentPath` to resolve and obliges a consumer to surface the failure — the direct negation of [R15]'s tombstone rule, and it was not on the rewrite list. Added, with a statement that exactly one rule governs sidecar-without-content afterwards. **RFC-012 [R6] was quoted from its tail**: it opens *"A `containerId` filter MUST use…"* and is a `DiscoveryQuery`-filter rule, not a general membership rule — so the general warrant is RFC-013 [R2] + I-80, with [R6]/I-118 as scoped corroboration. This is the citation-inflation class RFC-039's review rounds punished, caught here in this RFC's own Motivation. **The amendment set was under-inclusive by four RFCs' worth of rules** — added RFC-026 [R6], Change C steps 5–6 (step 6 *writes* `containerIndex`, which [R2] makes an error, so it needed a substantive rewrite rather than a pointer swap) and Change E item 4; RFC-013 [R6]/[R9]; RFC-017 [R2]/[R12]. The Abstract's "amends two Accepted RFCs" was itself an undercount. **Three rules were mutually unsatisfiable**: `relations-collection.json` "survives only inside snapshots" contradicted [R17]'s "same rules as a live repository" — collections are now retired in snapshots too; **the definition set had no discovery rule** and [R5]/[R17] used two different notions of "local package root" (presence- vs `packageRefs`-keyed, 234 vs **167** files), which mattered because **srs#307's Types and `canonical_key` both live in the 67-file undeclared root** — so Change A's "definition discovery unchanged" and Change H's "[R13] fails loudly on #307" could not both hold; definition discovery is now presence-keyed and the contradiction is stated. **The migration deadlocked on deletes**: an instance delete leaves dangling relation endpoints → [R13] error → [R24] fatal, while [R22] forbade fixing them; delete is now a scoped cascade. **The stamping window was invalid**: RFC-039 Phase 2 step 8 stamps generation 2 *before* this RFC strips `instanceIndex`, leaving the corpus stamped-and-unstripped across RFC-039's own count assertion — ordering is now pinned below step granularity with one shared stamping step. **The artifact inventory was wrong in three places and is now a single table**: 6 repository manifests (3 exploded + **3 embedded in `.srsj`**, all carrying `instanceIndex`), 8 in-scope package manifests (the fixture and gallery packages were missed), and the two `packages/**` governance manifests **deferred to #286** per RFC-039's stated scope, which Rev 3 contradicted. Also: [R8]'s "disjoint `required` sets" was false (all three schemas require `instanceId`) and is restated as the property that actually holds; [R9] gained the schema conjunct so the 3 `.revisions.json` files are errors as the prose already claimed; extension-owned locations (`changelogPath`, `federationPath`, `federationEventsPath`) added to [R5] as a sixth set, since [R10] otherwise made `ext:changelog` and `ext:federation` unimplementable; `.srs/` contents declared implementation-private; the `.srsj` envelope schema recorded as **owed and absent** (RFC-039 recorded the same gap), replacing a wrong `package-bundle.json` row; `relation.json` arithmetic reconciled to 17 properties / 5 required with `$schema`; four stale rule cross-references fixed; `srs-usage.md` §"The instanceIndex trap" and the `CLAUDE.md` path added to the retirement list; [R24]'s fatality blast radius moved into the Abstract. |
| 3 | 2026-07-31 | Self-verification pass over Rev 2's own claims, before round-2 review returned. **Classification was still scoped to instance roots** while [R5] made five location classes discoverable — and **12 of 12 Containers declare no `$schema`**, so [R7]/[R8] are now written over reserved *locations* with a per-location admissible-entity set, or Change D's "nothing is skipped quietly" would have been false everywhere except instance roots. **Corrected counts** measured by shape rather than declaration: **150 Fields (not 146) and 45 Types (not 44)** — 4 Fields and 1 Type carry no `$schema`, so the `$schema`-keyed figures undercounted; `$schema` absence is now shown as a corpus-wide pattern rather than a Records quirk. **Invariant identifiers corrected**: the spec uses bare numbers for core invariants and `I-` prefixes for extension ones, so Rev 2's "I-46, I-49, I-50" named nothing — they are **Invariant 46, 49, 50** (contents verified). **Phase 2 step 13's ordering citation was wrong** — document order is Rule [N+12]'s `precedes` sort with a **`createdAt`** tiebreak, `instanceId` only secondary via RFC-013 [R5]; RFC-013's own Rev-3 history records that exact simplification being caught once before. **Phase 1 step 8 over-reached**: `core-bundle.srsj` has no `srsj`, no `manifest` and no `data`, so 3 of 4 artifacts take the bump, not 4. Added two positive evidence results — an independent implementation of [R3] returns **exactly the 375 instances `instanceIndex` lists**, and of 13 in-repo `package.json` files exactly **one** has a reserved directory beside it — plus an explicit note that **muSrs is unmeasured** (outside this repository) and cross-references to #285 and #272. |
| 2 | 2026-07-31 | Review round 1, both reviewers (18 blocking). *(Rule numbers in this row are Rev-1 numbering.)* **The rule set was not closed over the entities a repository actually contains**: [R8] forbade validating or modifying `manifest.json`, `relations/`, `containers/`, `source-documents/` and all of `package/**` — **262 of 637 files in `srs/`** — while [R2], [R9], [R12] and [R13] each required exactly that. Rules are now stated over **five named authoritative sets** and a two-level location model (reserved *instance* roots vs reserved *repository* locations), which also closes the hole where Change J removed `containerIndex` while no rule made `containers/` discoverable — it is **not** in the spec's reserved-folder table, so containers were located only by the index being deleted. **Two Accepted-RFC conflicts were asserted away rather than stated**: RFC-039 [R13] *mandates* `instanceIndex` enumeration (Rev 1 cited it three times as if it were only an anti-glob rule) and [R14] resolves references against it; RFC-026 `ext:slices` [R5]/[R13] quantify over `containerIndex` and `instanceIndex`. Both are now stated as **amendments this RFC makes**, with RFC-039's own cession of placement/enumeration as the warrant. **Version discrimination (Required decision #9) was entirely missing** — now [R24], using the `.srsj` `srsj` version gate, which already requires readers to reject unrecognised versions; the previous silent-empty-repository failure mode is named. Added the `relation.json` wire shape in prose (16 properties, 4 required) rather than by reference; a diagnostic model with fatality semantics ([R25]); delete semantics; recognised-sidecar recognition as a closed list; the `allOf` domain-`$schema` branch that `record.json` explicitly sanctions; [R6]'s candidate set with its verified disjointness property. **Corrected counts:** relations **222 across 3 collections** (205 `srs/` + 17 gallery + 0 fixture), not 205 — Rev 1 quoted an `srs/`-scoped figure beside corpus-wide instance counts, the exact CC-10 failure; package manifests **13 in-repo / 8 first-party**, not 6; `base` and `core` each miss 5 required properties so [R3] would silently disqualify them. Retirement list extended from 5 sites to the full set (I-46, I-49, I-50, I-82, I-102, I-112 and 9 further prose sites), and **citations moved from generated-projection line numbers to stable invariant/section ids** — re-rendering shifted every `srs-spec.md` line by +37 mid-review, which is precisely why line numbers into a projection are not citations. |
| 1 | 2026-07-31 | Initial draft. Design and migration plan only, per the process gate on #296. |

---

## Abstract

A conforming SRS repository today answers "what is in this repository?" twice, and the two answers
are governed by rules that contradict each other. `docs/schema/2.0/manifest.json` calls
`manifest.json` "the authoritative index", requires `instanceIndex`, and the `RepositoryManifest`
prose states that "an instance not in the index is not a member, even if its file is present".
RFC-012 [R6], RFC-013 [R2] and Invariants I-80 and I-118 state the opposite: the instance file is
authoritative and `instanceIndex` is "the cache of that set … not an independent authority". Both are
ratified. Implementations have quietly picked one.

This RFC resolves the contradiction **in favour of the already-ratified tree-authoritative rule**, and
then supplies the piece that rule has always been missing: RFC-013 [R2] defines membership as "the
union of the instance files **declared by** the repository" without ever saying how a repository
declares them. Removing the index without defining enumeration would leave membership undefined, so
the substance of this RFC is the enumeration contract — reserved locations, classification,
diagnostics, and a backend-neutral catalog interface that returns logical identifiers rather than
paths.

The practical consequence is that a routine write stops touching a shared file. Adding one Tier-0
Note writes one file instead of two; creating one Relation writes one file instead of rewriting all
205 in `srs/`. Two agents working from the same base no longer conflict over `srs/manifest.json`
(95,846 bytes, 3,560 lines, 375 indexed instances) or `srs/relations/relations.json`
(57,709 bytes, 1,440 lines) when their semantic changes are independent — the failure PR #291
reproduces today.

**One consequence deserves stating in the abstract rather than being derived from a rule.** Under
[R24] an error anywhere under a reserved repository location is **fatal to the load**: a single
malformed JSON file under `records/`, `relations/`, `containers/`, `source-documents/` or a package
root makes the repository refuse to open rather than open with one object missing. That is the
deliberate consequence of tree authority — when the tree is the authority, a file that fails to parse
is indistinguishable from a file that was never there, and silently loading a smaller repository is
the failure this RFC exists to remove. It also means two conditions live in the corpus today
(srs#307's dangling `fieldId`, and `base`/`core`'s non-conforming `package.json`) become load
failures rather than warnings, which is why both are Phase-0 prerequisites rather than audit notes.

Four findings changed the design and are flagged rather than buried. The discovery rule proposed in
the issue's own option appraisal is **under-inclusive against the live corpus** and would lose 7
instances (Change B). `$schema` cannot carry classification in either direction — **29 live Tier-2
Records have no `$schema` at all**, and the one record that declares `record.json` most loudly does
not conform to it (Change C). Retiring `sourceDocumentIndex` costs **no tombstones** — there are zero
in the corpus — but does surface one live index/tree disagreement (Change G). And this RFC **amends
four Accepted RFCs** rather than composing cleanly with them (Change M); Revision 1 claimed otherwise
and was wrong.

---

## Motivation

### Problem 1 — the specification contains a direct contradiction about membership

Two ratified sources say incompatible things, in as many words.

**Membership is the index.** The manifest schema (`docs/schema/2.0/manifest.json`, `description`)
describes it as one that "Acts as the authoritative index and entry point for the repository", and
lists `instanceIndex` among its `required` properties. The prose is blunter still — in the
`RepositoryManifest` definition (`ext:repository`, §Repository layout):

> An instance not in the index is not a member, even if its file is present.

and in the JSON Store section (`ext:json-store`, §Path conventions in `data`):

> The `instanceIndex` in `manifest` is the authoritative list of members. A key present in `data` but
> absent from `instanceIndex` is not a repository member.

**Membership is the tree.** The general warrant is RFC-013 [R2]
(`rfcs/rfc-013-required-root-container.md:138`), which defines the repository's authoritative
instance set as

> the union of the instance files declared by the repository; `instanceIndex` in `manifest.json` is
> the cache of that set per RFC-012 R6, not an independent authority

and its invariant projection **I-80**: "The manifest instanceIndex is the cache of that set (RFC-012
R6), not an independent authority."

RFC-012 **[R6]** corroborates this but must be quoted honestly, because it is **not** a general
membership rule. It opens *"A `containerId` filter MUST use the three-condition membership definition
of RFC-009 I-66…"* and only then says "The authoritative source for membership is the instance file
and the relations file. An implementation MAY use `instanceIndex` as a cache for performance, but
MUST treat the instance file and relations file as authoritative when they differ from the cache."
The authority sentences are the tail of a `DiscoveryQuery`-filter rule, and **I-118** is that same
rule's invariant projection. So the ratified general statement is RFC-013 [R2] + I-80; RFC-012
[R6] + I-118 are scoped corroboration. The contradiction below stands on the first pair alone.

These cannot both hold. Take a valid instance file present in the tree and absent from the index: the
`RepositoryManifest` prose says it is not a member; I-80 says the index is not an authority and the
instance set is the union of the instance files. A conforming implementation cannot satisfy both, and
today's does not try — it walks `manifest.instance_index`, which is the prose reading, while the
invariants it also claims to enforce say the opposite.

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
across 1,440 lines holding 205 relations** (99 `precedes`, 106 `contains`); across the in-scope live
repositories there are **243 relations across 3 collections**. The relations-storage rule requires a collection object, so
creating one relation rewrites the file that holds the other 204.

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
forbids glob enumeration after exactly that glob missed an entire record root. A membership model
that hands out paths invites path-shaped enumeration, and path-shaped enumeration is incomplete by
construction in this corpus (Change B).

---

## Proposed Changes

### Change A — the manifest becomes the repository descriptor; the store answers membership

The repository's **authoritative content** is what the authoritative store reports, not what a file
records. On a filesystem that means the objects discoverable in the reserved locations (Changes B and
D); in a JSON store, the `data` entries whose keys fall under them; in a database, whatever the
backing query returns.

Because Revision 1 said "authoritative instance set" and then wrote rules that quantified over
Fields, Relations, Containers and sidecars, this RFC now names **six authoritative sets**:

| Set | Members | Where they are found |
|---|---|---|
| **instance set** | Note, TypedRecord, Record | reserved instance roots (Change B) |
| **relation set** | Relation | `relations/` (Change E) |
| **container set** | non-root Container | `containers/`, plus the inline root container |
| **source-document set** | source documents | `.meta.json` sidecars under `sourceDocumentsPath` |
| **definition set** | Field, Type, View, DocumentView, Theme, RelationType, Vocabulary, Lifecycle, Blueprint, Protocol | local package roots (defined below), resolved through each package manifest's declared arrays |
| **extension set** | changelog, federation registry, federation events | the locations named by `changelogPath`, `federationPath`, `federationEventsPath` when the owning extension is declared |

A **local package root** is defined once, here, and used identically by [R3], [R5] and [R17]: a
directory inside the repository subtree containing a `package.json` that validates against
`package-manifest.json`. It is **presence-keyed, not `packageRefs`-keyed** — the same argument as
Change B, and it applies here with more force. The five declared `packageRefs` in `srs/` cover **167
files**; `package/**` holds **234** non-record files; the difference is a **67-file undeclared root**
at `srs/package/` holding 43 Fields, 14 Types, 7 RelationTypes, a DocumentView and a Vocabulary.

That 67-file gap is not academic, and it resolves a contradiction that would otherwise sit between
two of this RFC's own changes. **Both srs#307 Types and the `canonical_key` Field it should point at
live in that undeclared root** — which is precisely why `srs repo validate` reports 0 errors over the
dangling reference today: current discovery never loads them. So definition discovery **does change**
under this RFC, and it has to: if it did not, Change H's requirement that [R13] "fail loudly" on
srs#307 could not be met, because the objects involved would remain invisible.

Presence-keyed discovery also exposes duplication that a `packageRefs`-keyed loader currently hides.
In `muSrs`, both `package/` and `packages/governance/` contain conforming package manifests. Their
declared definition sets overlap at **27 logical identifiers**: 19 Fields, 4 Types, 1 View and 3
DocumentViews. The files are separate objects even where their bytes agree, so enumeration MUST NOT
silently coalesce them. [R12] applies duplicate-logical-id diagnostics to definition identifiers and
[R13] requires references to resolve to exactly one object. Phase 0 removes the duplicate declarations
or otherwise establishes one canonical owning package before generation 2 is stamped.

The definition **kinds** are taken from `package-manifest.json`'s own content arrays (`fields`,
`types`, `views`, `documentViews`, `themes`, `relationTypes`, `vocabularies`, `lifecycles`,
`blueprints`, `protocols`) rather than from a hand-kept list, so a kind cannot be added to a package
manifest and be unrepresentable in the catalog. `srs/manifest.json` declares `ext:lifecycle` and
`ext:themes-l1`, and `packages/com.mudemocracy.governance/1.1.0/package/` carries a lifecycle, a
protocol and a blueprint, so all three of the kinds a hand-kept list would have missed are live.

"Membership" in the sense the specification uses it — what I-80 and RFC-013 [R2] mean by "the
repository's authoritative instance set" — is the instance set. The other five are what the
repository *contains*; they were never in `instanceIndex` and are not made members by this RFC.

`manifest.json` remains required, remains exactly one per repository, and remains the entry point.
What changes is its job: it describes the repository — identity, configuration, declared extensions,
package references, the root container — and stops enumerating its contents.

This resolves Problem 1 in favour of RFC-012 [R6], RFC-013 [R2], I-80 and I-118, which are the
already-ratified rules and the ones the root-container guarantee is built on. The consequence is that
the `RepositoryManifest` membership sentence, the JSON-Store membership rule, and the manifest
schema's "authoritative index" description are **wrong after this RFC and must be retired**, not
merely deprecated: they state the losing side of a contradiction.

What this forecloses: after this RFC there is no supported way to have a valid instance file inside a
reserved instance root that is *not* a member. Exclusion by omission from a list is gone. If a
repository needs to hold an SRS-shaped file that is not a member, it must live outside the reserved
locations — and Change D makes that an explicit, diagnosable choice rather than a silent one.

### Change B — reserved instance roots, anchored at the repository root and at every local package

A `records/`, `notes/`, or `typed-records/` directory is a **reserved instance root** when it is an
immediate child of either

1. the **repository root** — the directory containing both the `.srs` marker and `manifest.json`; or
2. the root of a **local package** — a directory containing a `package.json` that validates against
   `package-manifest.json`.

Discovery recurses through the whole subtree of a reserved instance root; implementation-defined
subfolders stay legal, which they must, because the live corpus depends on them. The anchor search is
confined to the repository subtree and skips `.git/`, `node_modules/`, and `.srs/`. A package nested
inside a reserved instance root does not anchor further roots.

**Anchors are discovered, not configured, and this is the part the issue's option appraisal got
wrong.** That appraisal recommends scanning "`records/**`, plus `records/**` under each declared
local package boundary". Taken literally against `srs@e0fb4b0`, that rule loses instances. The
manifest's `packageRefs` declares five local packages — `package/base`, `package/core`,
`package/spec-authoring-core`, `package/spec-rfc-process`, `package/metamodel` — and **all 7
instances under `package/records/` are beneath none of them**. They sit beside
`srs/package/package.json`, a sixth package manifest (`srs-specification-package`, namespace
`com.semanticops.srs`, version 2.0.0) that `packageRefs` does not list. A rule keyed on *declared*
package boundaries silently drops 7 of 375 indexed instances (1.9%); a rule keyed on the *presence of
a conforming package manifest* finds them. This RFC therefore keys on presence.

**A near-miss package manifest must be diagnosed, not skipped.** Keying on conformance introduces one
silent-failure mode, and the corpus already contains it: `srs/package/base/package.json` and
`srs/package/core/package.json` each omit five required properties (`$schema`, `createdAt`,
`description`, `status`, `title`), so **2 of the 8 first-party package manifests do not validate** and
would not anchor. Nothing is lost today because neither holds a `records/`, but the loss mode is
exactly the quiet skip Change D abolishes everywhere else. A `package.json` that fails
`package-manifest.json` therefore produces a diagnostic. An npm `package.json` is **not** an anchor
and is **not** an error — it is application content, distinguished by having no `$schema` naming
`package-manifest.json` and no SRS-shaped body.

**Legacy top-level roots are retained as reserved but are not where the data is.** The layout table
(`ext:repository`, §Repository layout) assigns Tier 0 to `notes/`, Tier 1 to `typed-records/` and
Tier 2 to `records/`. The live spec repository has no top-level `notes/` and no top-level
`typed-records/` at all: **all 19 Tier-0 Notes are stored under `records/notes/`**. This is legal
today only because the layout section permits implementation-defined subfolders "so long as every
instance remains listed in `RepositoryManifest.instanceIndex` with its full relative path" — a
permission whose precondition this RFC removes. Two consequences follow, and both are load-bearing:

- the subfolder permission must be restated unconditionally, since its stated condition is going away;
- **folder position MUST NOT imply tier.** Any rule of the form "`notes/` holds Tier 0" would
  misclassify all 19 live Notes. Tier comes from the object (Change C), never from where it sits.

### Change C — classification is declared-then-validated, and `$schema` is not sufficient in either direction

An object under a reserved instance root is classified by **its own content**:

- when `$schema` is present, it names the *intended* entity. The object MUST validate against that
  schema, and the schema MUST resolve — directly, or through `allOf` composition — to exactly one
  core instance entity (`note.json`, `typed-record.json`, `record.json`). That entity is the
  classification. A validation failure, an unresolvable `$schema`, or a schema resolving to zero or
  several core entities are each errors — never an invitation to reclassify by shape;
- when `$schema` is absent, the object MUST validate as exactly one member of the same three-entity
  candidate set. Zero matches or two-or-more matches are both errors.

The `allOf` branch is not hypothetical: `record.json`'s own description sanctions it — *"Intended for
composition via allOf in domain schemas — `$schema` is not constrained here."* A domain schema that
composes `record.json` is a conforming Record, and Revision 1 left it unclassified.

**The candidate set is decidable, and the property that makes it so is narrower than "disjoint
required sets".** All three of `note.json`, `typed-record.json` and `record.json` require
`instanceId`, so their `required` sets are *not* disjoint and a check written that way would fail on
day one. What actually holds is this: each has a required property — `sections`, `fields`,
`typeId`/`fieldValues` respectively — that is **not a declared property of the other two**, and all
three are `additionalProperties: false`, so presenting one schema's discriminator to another is a
validation failure rather than an ignored extra key. That is the pairwise exclusion [R8] needs.
Empirically all 29 no-`$schema` live Records match `record.json` and nothing else. It is a property a
future schema edit could silently break, so it becomes a standing check rather than an assumption.

Both halves are forced by the corpus, and the obvious simplification — "require `$schema`" — is not
available.

**`$schema` absent does not mean "not an instance".** Measured over `srs@e0fb4b0`, **29 live Tier-2
Records carry no `$schema`**: 7 under `srs/package/records/` and 22 under
`docs/spec/examples/gallery-project-v2/`. This is not sloppiness, it is what the specification
permits — the schema-conventions section says every JSON file "**should** declare its schema", a
SHOULD, not a MUST. Requiring `$schema` would invalidate 29 conforming records to buy a shortcut.

**`$schema` present does not mean "conforms".** `tests/rfc-032/records/showcase-instance.json`
declares `$schema: …/2.0/record.json` and then stores its values under a property named `values`,
which `record.json` does not define. It is the single most confidently-labelled record in the corpus
and it does not validate. A classifier that trusts the declaration accepts a non-conforming record;
one that falls back to shape when the declaration fails silently relabels a broken file.

### Change D — reserved repository locations, and a closed candidate policy

Revision 1 conflated "where instances live" with "what the repository owns", and the result was a
rule that forbade the repository from reading its own manifest. The two are now distinct.

The **reserved repository locations** are: `manifest.json` and the `.srs` marker at the repository
root; every reserved instance root (Change B); `relations/`; `containers/`; the directory named by
`sourceDocumentsPath` (default `source-documents/`); and every local package root with its definition
subtrees. Each is discovered and validated as its own entity kind. Everything else in the tree is
**application content**: not discovered, not validated, not modified.

Reserved locations may nest, so classification uses the **most-specific applicable location**. A
`records/` directory immediately below a local package root is an instance root and its descendants
are classified as instances, not as package definitions merely because they are also descendants of
the package root. At a local package root, `package.json` itself is admissible as
`package-manifest.json`; definition candidates are the files at paths declared in that manifest's
definition arrays. Other descendants are governed by a more-specific reserved location or are
application content. This makes the package manifest capable of anchoring the location without then
failing its own admissible-entity test.

`containers/` has to be named explicitly because it is **not in the specification's reserved-folder
table at all** — the table lists `source-documents/`, `notes/`, `typed-records/`, `records/`,
`relations/`, `package/` and no more. Container files are located today *only* by `containerIndex`
paths. Revision 1 removed `containerIndex` while asserting containers were "ordinary discoverable
objects under `containers/`"; they were not discoverable by any rule it stated. The 12 containers in
`srs/`, 2 in the conformance fixture and 4 in the gallery would have become unreachable.

For every **candidate file** inside a reserved repository location exactly three outcomes are legal:
an object conforming to an entity admissible at that location; a **recognised sidecar**; or an error. Malformed JSON, an
unrecognised shape, and an ambiguous shape are each diagnosed and named. Nothing under a reserved
location's candidate policy is skipped quietly.

Source-document payload is the deliberate exception to object classification. Under
`sourceDocumentsPath`, files ending in `.meta.json` are source-document sidecar candidates and are
closed and validated by the rules above. Every other file is an **opaque source payload**: it is not
parsed or classified as an SRS entity and MUST be preserved unmodified. A sidecar's `contentPath`
MAY name one of those payloads; an unclaimed payload remains application-owned raw material. This is
what permits the five live Markdown files with sidecars and the two unclaimed Markdown inputs to
coexist with fail-closed sidecar discovery. Malformed or unrecognised `.meta.json` candidates still
fail the load; arbitrary payload bytes do not.

Classification therefore runs per location rather than only under instance roots ([R7], [R8]), and it
has to: **all 12 Containers in `srs/` declare no `$schema`**, as do 4 Fields, 1 Type and 1 Vocabulary.
A rule that keyed classification on a declaration would leave every Container in the corpus
unclassifiable at exactly the moment `containerIndex` stops locating them.

**Recognised sidecar** is a closed list, not a gesture. A file is a recognised sidecar when its name
ends with one of the reserved suffixes below **and** its base name resolves to a discovered instance
in the same directory. An orphaned sidecar — one whose base name resolves to nothing — is an error,
not a silent leftover.

| Suffix | Meaning | Schema |
|---|---|---|
| `.revisions.json` | `ext:addressability` revision history for the adjacent instance | **none exists — owed** |

That table has one row and a gap in it, which is the honest state of affairs: 3 `.revisions.json`
files exist (all under `docs/spec/examples/gallery-project-v2/records/**`), there is **no revisions
schema in `docs/schema/2.0/`**, and the specification never mentions the filename convention. They
match no entity, so under a closed policy they are errors until the schema exists. Recognition is
**not** gated on `declaredExtensions` — the gallery manifest declares none at all, so an
extension-gated rule would fail exactly where the files are. Adding the missing schema is a Phase-B
prerequisite, listed in Schema changes.

The rule this replaces is a non-rule. Today an unindexed instance file is "not a member, even if its
file is present" — which is to say, invisible, with no diagnostic and no way to tell an intentional
exclusion from an authoring mistake.

### Change E — Relations become one object per file

A Relation is stored as a standalone object at `relations/<relationId>.json`, one relation per file,
declaring `$schema` of `relation.json` (required, `const`-pinned, as `container.json` pins its own).
With `$schema` the entity is **17 properties, 5 required**; the 16/4 figures below are the inherited
Relation shape before it is added.

**The collection format is retired outright, in snapshots as well as live repositories.** Revision 3
said it "survives only inside snapshots", which cannot hold alongside [R17]'s requirement that a
snapshot be consumed "by the same rules as a live repository of the same generation" and Change I's
"one code path" claim: a generation-2 snapshot carrying a collection would be invalid under [R11] the
moment those rules were applied to it. So a generation-2 `.srs` or `.srsj` carries
`relations/<relationId>.json` entries exactly as a live repository does. `relations-collection.json`
is retained in `docs/schema/2.0/` only to describe generation-≤1 artifacts, which no conforming
generation-2 reader loads. This is not hypothetical: `gallery.srsj` today carries exactly one
`relations/relations.json` `data` key, and it is converted rather than preserved.

**The wire shape, stated here so the reader need not open another file.** A Relation carries sixteen
properties and `additionalProperties: false`. Four are required: `relationId` (uuid), `relationType`
(string — canonical values `contains`, `depends-on`, `supersedes`, `refines`, `derived-from`,
`evidences`, `precedes`), `sourceInstanceId` and `targetInstanceId` (uuids, read as *source
[relationType] target*). Twelve are optional: `assertedBy`, `confidence` (number, meaningful for
ai-asserted relations), `createdAt`, `createdBy`, `status`, `validFrom`, `validUntil`, `notes`,
`sourceRefs` (array), `meta` (object), and `sourceRepositoryId` / `targetRepositoryId`
(`ext:federation` only). The standalone entity is that field set exactly, plus the pinned `$schema`;
nothing is added and nothing is dropped.

**The filename is a locator, not the identity.** The specification already says the authoritative
identifier "is stored inside the file; it is not derived from the filename", and this RFC does not
change that: the in-file `relationId` is authoritative, the filename is a convention that makes the
locator derivable, and a filename that disagrees with the in-file `relationId` is an **error** naming
both. The UUID is written in canonical lowercase hyphenated form, which also makes the convention
safe on case-insensitive filesystems. Naming by UUID means a relation file is never renamed, needs no
central allocator, and its name is derivable from its content; a slug-based name would churn on every
retype and would need a disambiguator anyway.

`relations/` is flat — no subfolders — deliberately, and the asymmetry with instances is the point:
instance subfolders exist to carry authoring meaning (`records/invariants/`, `records/rfcs/`), whereas
a relation's meaning is entirely in `relationType`, so a folder could only encode a second, competing
classification. A local package may not carry its own `relations/`; relations are repository-level.

`relationId` uniqueness across the repository is not new — the relations-storage section already
requires it across all relation files. What changes is that violating it is detectable as a
duplicate-logical-id error ([R12]) rather than depending on where a concatenation happened to put two
entries.

**Enumeration order is defined and is not filesystem order.** Relations enumerate in ascending
`relationId`, instances in ascending `instanceId`, source documents in ascending `documentId` read
from the sidecar. Ascending means byte-wise over the canonical lowercase hyphenated UUID string, which
a database ordering by a native UUID column must reproduce rather than substitute. Directory
iteration order is not stable across platforms or backends, and every consumer that renders, exports
or diffs needs a total order all four backends can agree on.

### Change F — deletes, and what tree authority costs on the write path

Revision 1 was written almost entirely around *create*. Under tree authority a delete is "remove the
object", and two consequences need stating.

A deleted instance that is still named in the root container's `memberInstanceIds` leaves a dangling
id, which I-80 makes an error. Deleting a root-container member is therefore **not** a routine
unscoped operation: it is an explicit container-membership operation, and it writes the manifest. The
routine-write isolation rule ([R22]) is scoped accordingly rather than making the repository
un-fixable.

**The larger case is relations, and it has to be answered or the model deadlocks.** Deleting one
instance leaves every Relation naming it with a dangling endpoint. If that were a [R13] error and
[R24] made it fatal, deleting a single record would render the repository unopenable — while [R22]
forbade the delete from writing the relation files that would fix it. The resolution is that a
delete is a **scoped cascade**: deleting an instance is permitted to remove the Relations incident to
it, in the same operation, and those relation files are additional declared targets under [R22]'s
explicit cascade exception. An instance delete that leaves incident Relations behind is the diagnosable
state, not an unavoidable one. The same applies to a Container deleted while still referenced, and to
a source document deleted while a `SourceReference` names it.

There is no tombstone for a deleted instance, so re-importing an older archive resurrects it. That is
a real behaviour change and it is deliberate: the alternative is a tombstone list, which is a shared
mutable membership file by another name. Import remains governed by the existing rule that a consumer
must not silently discard instances present in the archive — resurrection is visible, not silent.

### Change G — source documents are identified by sidecar, and the corpus has no tombstones

`sourceDocumentIndex` is retired. A source document is identified by its `.meta.json` sidecar under
`sourceDocumentsPath`; the sidecar is the identity and the opaque content payload may be absent.

The option appraisal's stated worry was that retiring the index would destroy index-only tombstones.
Measured over `srs@e0fb4b0`, that worry does not materialise: of 4 index entries, **every one has its
content file present on disk — there are zero tombstones to preserve.** The migration has nothing to
convert, and the "retain the index solely for tombstones" option is answered by a count.

**Two ratified invariants have to move for this to be legal, and one of them says the opposite of
what this RFC needs.** I-112 says a *`sourceDocumentIndex` entry* whose content file is absent is a
valid tombstone — it is keyed to the property being deleted, so it is not a pre-existing warrant for
the sidecar case (Revision 1 cited it as though it were) and must be **rewritten**. More seriously,
**Invariant 52** currently reads:

> Every `SourceDocument` sidecar present under `sourceDocumentsPath` must have a `contentPath` that
> resolves to an existing content file in the same directory. A sidecar whose `contentPath` does not
> resolve is invalid. A conforming producer must not emit such a sidecar; a conforming consumer must
> surface the resolution failure before proceeding.

That is the direct negation of [R15]. Today the two coexist because they govern different things —
I-112 permits an *index entry* without content, Invariant 52 forbids a *sidecar* without content.
Moving tombstones onto sidecars collides the two. Invariant 52 is therefore rewritten, and after this
RFC exactly one rule governs sidecar-without-content: the sidecar is a valid tombstone. Invariant 102
is also rewritten, though it degrades rather than breaks — it already reads "present in
`sourceDocumentIndex` (**or discoverable via a `.meta.json` sidecar scan of `sourceDocumentsPath`**)",
so the fallback becomes the only clause.

The scan surfaced a different discrepancy, which is the fail-closed audit case rather than a
tombstone. `srs/source-documents/` holds 7 content files in three classes:

| Class | Count | Files |
|---|---|---|
| Sidecar present, indexed | 4 | 3 under `ai-sessions/`, plus `spec/srs-spec.md` |
| **Sidecar present, NOT indexed** | **1** | `spec/srs-purpose-and-scope.md` |
| No sidecar, not indexed | 2 | `applications/scds_governance_application_profile.md`, `rationale/scds-rationale.md` |

`spec/srs-purpose-and-scope.md` is precisely a case where index and tree disagree: index-authoritative
rules say it is not a source document, sidecar-authoritative rules say it is. Under this RFC it
becomes one. That is a real membership change to a first-party repository and it is a Phase-0 audit
item rather than a side-effect. The two files with no sidecar are unmanaged raw material and stay
that way.

### Change H — duplicate and dangling identifiers become hard errors that name every locator

**Duplicate logical id.** Two objects claiming the same `instanceId`, `relationId`, `documentId`, or
`containerId` are an error naming **every** conflicting locator, not just the second found. When a
global index was the authority this was structurally near-impossible; with the tree authoritative it
becomes possible, so it must be diagnosed. Naming one locator would send an author to whichever file
the enumeration happened to reach second.

**Dangling reference.** A reference that resolves to nothing in the set it targets is an error — and
"the set it targets" is why Change A had to name five of them. Revision 1 said "the authoritative
set", which, read against its own instance-scoped definition, would have made **every**
`FieldAssignment.fieldId` in all 51 Types dangling, since Fields live in the definition set, not the
instance set. `FieldAssignment.fieldId` resolves against the **definition set**; a Relation endpoint
resolves against the **instance set**; `sourceId` against the **source-document set**.

There is a live case to calibrate against — srs#307. Four Types
(`com.semanticops.srs/meta.spec-part@1`, `meta.concept@1`, `meta.specification@1`,
`meta.requirement@1`) each assign `fieldId` `f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5c`, which no Field
defines; the intended Field is `com.semanticops.srs/canonical_key` at the visually adjacent
`f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c`, and it is referenced by **no Type at all**. It is the only
dangling `fieldId` in the package tree, and `srs repo validate --repo srs` reports **0 errors** over
it today (38 warnings, all pre-existing tag-vocabulary noise).

This RFC does not fix srs#307; it is the acceptance test for the rule. A conforming implementation of
[R13] fails loudly on that repository.

### Change I — a live catalog is derived; snapshots stay as they are; archives carry everything

Two things that both look like "a list of what is in the repository" are separated, because
conflating them is how the manifest index became authoritative in the first place.

A **live catalog** is a derived, rebuildable view produced by enumerating the authoritative store. It
may be cached in memory, on local disk outside version control, or as a database materialised view.
It is never a membership authority and MUST NOT be committed as a repository member.

Revision 1 required an implementation to "verify a materialised catalog against content", which is
the enumeration the catalog exists to avoid — a rule certain to be ignored. Validity is instead
carried by an explicit **validity token**: a value the store reports cheaply and changes whenever
enumerable content changes (a filesystem generation counter, a database transaction id, a content
digest over the enumerated id set). A catalog is served only while its token matches the store's
current one; otherwise it is rebuilt. That is Required decision #7's invalidation signal.

A **snapshot** is an immutable point-in-time artifact — a `.srs` archive or a `.srsj` document.
Within a snapshot the enumerated contents *are* authoritative, because the snapshot is closed by
construction.

**An archive carries every reserved repository location, not just instances.** Revision 1 said
"every discovered instance, every relation file, and every source-document sidecar and content file",
which would have dropped local packages and containers and produced archives that cannot resolve a
single `typeId`. The current rule already requires "the full local package" when
`PackageRef.mode === "local"` — and all 5 of `srs/`'s `packageRefs` are local, covering 234 files.
Producing an archive enumerates and writes **all six authoritative sets** plus the manifest and
marker. The completeness check becomes an internal consistency check of the snapshot — every
reference resolves within it — rather than a check of a list against a filesystem. Consuming an
archive discovers by the same rules as any repository, so an archive and its source repository are
read by one code path.

The same correction applies to `.srsj`. `docs/spec/examples/gallery.srsj` has **68 `data` keys**, of
which only **24** fall under `records/` — **44 (65%)** are `package/**` (39), `containers/**` (4) and
`relations/**` (1). Membership is the `data` keys resolving under a reserved *instance* root; the
other reserved locations are carried as repository content. RFC-039 [R13]'s anti-glob limb applies
with force here: `data` keys are strings that look exactly like paths, and matching them with a glob
is the same defect in a new place. Resolution is segment-wise.

`core-bundle.srsj` is a package bundle with no `data`/`manifest` envelope at all, so the `.srsj`
membership rule does not apply to it.

**No new serialised catalog format is standardised by this RFC.** `.srs` and `.srsj` already
enumerate their own contents, and `RepositorySnapshot` already carries instances and relations through
portability without paths. Standardising a dated inventory would add a schema, a verification rule
and a second thing to keep in sync, ahead of a consumer that needs it. If one is standardised later
its identity MUST be content-derived, with observation time and source revision as optional
provenance — a generated wall-clock timestamp inside an export would break the deterministic-archive
property ADR-039 requires.

### Change J — version discrimination, and what an old reader does

Required decision #9 asks for version discrimination, and Revision 1 supplied none. It matters more
here than it did for RFC-039, whose array-vs-object carrier change is structurally self-announcing.

**Absence of `instanceIndex` is not a usable discriminator.** `dataModelRevision` absent ⇒ 0, and two
first-party trees (the gallery and the conformance fixture) carry no stamp today, so "no index" and
"old repository that happens to be empty" are indistinguishable from the property alone.

The generation of a repository or snapshot is therefore determined by `dataModelRevision` on the
manifest — the embedded manifest, for a snapshot — with absent ⇒ 0. Phase B stamps it everywhere,
which is what makes it usable.

For `.srsj` there is a second gate already in the format and it is the right one to use: the `srsj`
property carries the format version, currently `"1"`, and the specification already says
"Implementations must reject files with unrecognised versions." **`srsj` bumps to `"2"`.** That
converts the dangerous case into a loud one. Without the bump, a pre-cutover reader accepts a
revision-2 `.srsj` as version `"1"`, looks for `manifest.instanceIndex`, finds nothing, and reports
an **empty repository** rather than an error — silent data loss presented as success. With the bump
it refuses the file.

The `.srs` marker's optional format-version line is **not** bumped: it identifies the repository-root
marker convention, which this RFC does not change, and overloading it would give two answers to one
question.

### Change K — which manifest fields go, and which stay

Removed, because they are membership inventories or caches of them: `instanceIndex`,
`containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, and `relationsPath` (relation location
is now fixed by Change E rather than configured). The `InstanceIndexEntry`, `ContainerIndexEntry`,
`SourceDocumentIndexEntry` and `RelationsChecksumEntry` definitions are retired with them.

Retained, because they are repository configuration and identity rather than contents:
`$schema`, `srsVersion`, `dataModelRevision`, `repositoryId`, `namespace`, `title`, `description`,
`declaredExtensions`, `container`, `packageRef` / `packageRefs`, `upstreamPackage`,
`sourceDocumentsPath`, `changelogPath`, `federationPath`, `federationEventsPath`, `aiGuidance`,
`meta`, `renderedPresentations`, `slice`, `createdAt`, `updatedAt`.

`relationsPath` loses its configurability while four sibling path fields keep theirs, and the reason
is the contention argument rather than tidiness: `relationsPath` names the location of a *frequently
written, per-object* collection, so a configured path is a shared decision every writer must agree
on. `sourceDocumentsPath`, `changelogPath`, `federationPath` and `federationEventsPath` name
locations written rarely and by deliberate operations, where configurability costs nothing.

`instanceIndex` moves from `required` to absent, which is the single change that makes a routine
create stop touching the manifest. One stated consequence: `manifest.updatedAt` becomes effectively
frozen after the cutover, because routine writes no longer touch the manifest. It is retained rather
than removed — it still advances on deliberate configuration and container-membership edits — but it
stops being a proxy for "when did this repository last change". `formatVersion` and `conformance`
appear in the prose `RepositoryManifest` model but not in `manifest.json`; the schema is normative and
neither is added.

**The root-container model is retained and untouched.** `manifest.container` stays inline and canonical;
the `muSrs` correction below repairs conflicting corpus content without changing that model.
Structural membership composition remains #267's, and this RFC neither changes `memberInstanceIds`
semantics nor takes a position on them. It adds one requirement in the negative: a routine unscoped
instance create MUST NOT modify the root container — otherwise the hotspot moves from `instanceIndex`
to `container.memberInstanceIds` and nothing is fixed. Deliberate root-membership edits remain
deliberate shared-file writes, and conflicting on those is correct.

The `muSrs` migration has one explicit corpus repair rather than an open composition decision. Its
inline root keeps `dc2723e7-aca3-4562-b893-47bd24da629d` as `identityInstanceId`: that instance is the
Tier-2 `com.semanticops.core/purpose` record, so it satisfies RFC-029 I-87. The conflicting
`09b3fbbc-d7af-4924-b0a9-4c09133e2550` instance is a Tier-0 Note and therefore cannot be the canonical
root identity, but remains a root member. The standalone Container's five guides remain root members;
because each was also listed as a member, the redundant member declarations are removed. The purpose
and decision log remain ordinary members. `containerType: repository-root` is not retained: it is a
legacy, soft-deprecated field and inaccurately describes a root whose `rootInstanceIds` contain
multiple guides. Phase 0 records the exact resulting object.

### Change L — a backend-neutral catalog interface that returns identifiers, not paths

Enumeration becomes a **store operation**. The store exposes, for each of the six authoritative
sets, an enumeration returning entries of `{id, kind, tier?, locator?}`:

- `id` — the logical identifier, canonical lowercase hyphenated UUID;
- `kind` — one of `note`, `typed-record`, `record`, `relation`, `container`, `source-document`,
  `field`, `type`, `view`, `document-view`, `theme`, `relation-type`, `vocabulary`, `lifecycle`,
  `blueprint`, `protocol`, `changelog`, `federation-registry`, `federation-event`;
- `tier` — present only for `note` (0), `typed-record` (1), `record` (2); a Relation, Container and
  source document have no tier, and Revision 1 implied otherwise by attaching tier to every entry;
- `locator` — adapter-private, optional, for diagnostics and portable-tree projection only.

The extension aggregates need an explicit identity projection because `changelog.json` has no id of
its own: the changelog entry uses the owning manifest's `repositoryId`; a federation registry uses its
`registryId`; and a federation-events aggregate uses its `repositoryId`. Extension identity is the
pair `{kind, id}`, so a changelog and federation-events aggregate owned by the same repository do not
collide. Core instance, definition, relation, container and source-document identifier domains remain
global within their respective authoritative set.

Enumeration is **materialised, not streaming**: a caller receives one complete catalog snapshot per
operation, because duplicate-id detection ([R12]) and the completeness assertions are set-level
properties that a stream cannot decide. Diagnostics travel **with** the result rather than out of
band — an enumeration returns entries and diagnostics together, which is what lets a validator report
[R9]'s malformed-candidate errors from the same call that produced the catalog.

Paths do not appear in the semantic contract. A filesystem adapter walks reserved locations; a
JSON-store adapter resolves `data` keys segment-wise; a database adapter issues a query and never
synthesises a path. Each returns the same logical catalog for the same logical content, and a
duplicate id is diagnosed identically by all three.

This is also the enforcement point for RFC-039 [R13]'s anti-glob limb: if enumeration is a store
operation returning ids, there is no path list for a client to glob over.

### Change M — the four Accepted RFCs this one amends

Revision 1 claimed RFC-038 and RFC-039 have "no shared normative surface" and adopted their division
"without amendment". Both statements were false, and a reader could only discover it by opening
RFC-039 — the exact failure the RFC bar forbids. The conflicts are stated here instead.

**RFC-039 [R13]** (`rfcs/rfc-039-record-field-value-carrier.md:749`) reads:

> The migration MUST enumerate instances from `manifest.json`'s `instanceIndex` and MUST NOT enumerate
> by directory glob or by `$schema` value. On completion it MUST assert that the count of migrated
> instances equals the `instanceIndex` count, and MUST fail otherwise.

That is a *mandate to use `instanceIndex`*, with a completeness assertion against its count — not
merely the anti-glob prohibition Revision 1 cited three times. **RFC-039 [R14]** requires a
`mode: "reference"` value to resolve "to an instance present in the repository's `instanceIndex`",
which is a **standing** rule, not a migration-only one, and is unsatisfiable once the property is
gone.

The amendments this RFC makes, effective at the cutover:

- **[R13]** — "enumerate instances from `manifest.json`'s `instanceIndex`" becomes "enumerate
  instances from the authoritative store per RFC-038 [R1]"; the count assertion is taken against the
  pre-migration `instanceIndex` **during** the migration, which is legitimate because the index still
  exists at that point (see the phase ordering below). The anti-glob limb is unchanged and this RFC
  reinforces it.
- **[R14]** — "present in the repository's `instanceIndex`" becomes "present in the repository's
  authoritative instance set".

The warrant is RFC-039's own: it states that where the two RFCs touch, "RFC-038's decisions govern
placement and this RFC's govern value shape". Enumeration and placement are ceded to this RFC by the
Accepted text; what Revision 1 got wrong was claiming there was nothing to cede.

**RFC-026 (`ext:slices`)** was not mentioned in Revision 1 at all, and it quantifies over both
retired properties. Its **[R5]** requires that a container slice's `spec.id` "MUST be a `containerId`
in the source `containerIndex`", and its Change C traversal walks `containerIndex` to find
sub-containers; its **[R13]** requires a validator not to treat `externalRelationRefs` absent from
`instanceIndex` as an error, and not to require "a complete `containerIndex`". Change K retains the
`slice` manifest block while removing both properties those rules are written against, so
`ext:slices` becomes unimplementable as specified.

The amendments: [R5]'s `spec.id` test resolves against the **container set**; Change C's traversal
enumerates the container set rather than `containerIndex`; [R13]'s two tests resolve against the
**instance set** and the container set. The slice-completeness property survives unchanged, because
[R17] makes a snapshot's own enumerated contents authoritative for that snapshot — which is exactly
the closure `ext:slices` needs.

---

## Conformance Rules

> **[R1]** A repository's authoritative content MUST be what the authoritative store reports, across
> six sets: the **instance set**, **relation set**, **container set**, **source-document set**,
> **definition set**, and **extension set**. `manifest.json` MUST NOT be treated as an authority for
> any of them, **except the root container**, which it carries inline at `manifest.container` and for
> which it is authoritative (RFC-013 I-79). An implementation MAY maintain a derived catalog but MUST
> treat the store as authoritative when they differ.

> **[R2]** `manifest.json` MUST remain required, exactly one per repository, and MUST NOT contain
> `instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, or `relationsPath`
> at `dataModelRevision ≥ 2`. A reader encountering any of them at `dataModelRevision ≥ 2` MUST report
> an error naming the file and property, and MUST NOT silently ignore it.

> **[R3]** On a filesystem repository, a directory named `records`, `notes`, or `typed-records` is a
> reserved **instance root** if and only if it is an immediate child of the repository root — the
> directory containing both the `.srs` marker and `manifest.json` — or of a directory containing a
> `package.json` that validates against `package-manifest.json`. Discovery MUST recurse through the
> entire subtree. The anchor search MUST be confined to the repository subtree and MUST skip `.git/`,
> `node_modules/` and `.srs/`. A package root nested inside a reserved instance root MUST NOT anchor
> further roots. Reserved instance roots MUST NOT be determined from `packageRefs` or any other
> manifest-declared path list.

> **[R4]** A `package.json` that exists but fails to validate against `package-manifest.json` MUST
> produce a diagnostic naming the file and the validation failure. A `package.json` that is not an SRS
> package manifest at all (e.g. an npm manifest) MUST NOT anchor reserved roots and MUST NOT be
> reported as an error.

> **[R5]** The reserved **repository locations** are, all anchored at the repository root unless
> stated otherwise: `manifest.json` and the `.srs` marker; every reserved instance root; `relations/`;
> `containers/`; the directory named by `sourceDocumentsPath`; the locations named by `changelogPath`,
> `federationPath` and `federationEventsPath` when the owning extension is declared; and every local
> package root, wherever in the subtree it occurs. Each MUST be discovered and validated as its own
> entity kind. Where reserved locations nest, the most-specific applicable location MUST govern
> classification. The contents of the `.srs` directory are implementation-private: they MUST NOT be
> validated as SRS entities and MUST be preserved unmodified.

> **[R6]** The tier and kind of an object MUST be determined from its own content. An implementation
> MUST NOT infer tier or kind from the name or position of the directory containing it.

> **[R7]** When a candidate object under a reserved repository location declares `$schema`, it MUST validate
> against that schema, and that schema MUST resolve — directly or through `allOf` composition — to
> exactly one entity admissible at that location, which is its classification. Validation failure, an
> unresolvable `$schema`, or resolution to zero or more than one admissible entity MUST each be
> reported as an error naming the file and the declared schema. The implementation MUST NOT
> reclassify by shape.

> **[R8]** When an object under a reserved repository location does not declare `$schema`, it MUST
> validate as exactly one entity admissible at that location. Zero matches, or two or more, MUST be
> reported as an error naming the file and the candidates. The admissible sets are: under a reserved
> instance root, `note.json`, `typed-record.json`, `record.json`; under `relations/`, `relation.json`;
> under `containers/`, `container.json`; for `.meta.json` candidates under `sourceDocumentsPath`, the
> source-document sidecar; at a local package root, `package.json` as `package-manifest.json`; and for
> paths declared in that package manifest's definition arrays, the corresponding declared definition
> entity. A nested reserved instance root or other more-specific reserved location MUST take precedence
> over the encompassing package root. Within each
> admissible set the schemas MUST remain pairwise distinguishable: every schema MUST be
> `additionalProperties: false` and MUST have at least one `required` property that is not a declared
> property of any other schema in the set. A change that breaks this property MUST be rejected.

> **[R9]** Every candidate file under a reserved repository location MUST be an object conforming to an entity
> admissible at that location, a recognised
> sidecar, or an error. A recognised sidecar MUST satisfy all three of: a name ending in a reserved
> sidecar suffix; a base name resolving to a discovered instance in the same directory; and validation
> against the schema declared for that suffix. A file meeting the first two but with no declared
> schema, or failing it, MUST be an error — recognition is not conferred by filename alone. An
> orphaned sidecar MUST be an error. Recognition MUST NOT be conditioned on `declaredExtensions`.
> Malformed, unrecognised, and ambiguous files MUST each produce a diagnostic naming the file, and
> MUST NOT be skipped silently. Under `sourceDocumentsPath`, `.meta.json` files are the candidate files;
> every other file is an opaque source payload, MUST NOT be parsed or classified as an SRS entity, and
> MUST be preserved unmodified whether or not a sidecar's `contentPath` names it.

> **[R10]** Files under no reserved repository location, and non-candidate application or opaque payload
> files expressly permitted by [R8]/[R9] inside one, MUST NOT be discovered as SRS entities, MUST NOT be
> validated as SRS entities, and MUST be preserved unmodified by any repository operation.

> **[R11]** A Relation MUST be stored as a standalone object at `relations/<relationId>.json`
> containing exactly one Relation and declaring a `const`-pinned `$schema` of `relation.json`. The
> in-file `relationId` is authoritative; a filename disagreeing with it MUST be an error naming both.
> `relations/` MUST be flat. Creating, updating, or deleting one Relation MUST NOT read or write any
> other Relation's file. At `dataModelRevision ≥ 2` a live repository MUST NOT contain a
> relations-collection file.

> **[R12]** Two objects in the same authoritative set declaring the same logical identifier —
> `instanceId`, `relationId`, `documentId`, `containerId`, or the schema-defined primary identifier of
> a definition or extension object — MUST be reported as an error naming **every** conflicting locator.
> Identifier uniqueness is global within each core authoritative set; within the extension set it is
> keyed by `{kind, id}` as defined in Change L.
> An implementation MUST NOT resolve the conflict by precedence, recency, or enumeration order. This
> rule binds enumeration and validation; it does not require a routine write to read other objects.

> **[R13]** A reference MUST resolve to exactly one object within the set it targets. Resolution to zero
> or more than one object MUST be reported as an error naming the referring object, the referring
> property, the identifier, and every conflicting locator when more than one exists.
> `FieldAssignment.fieldId` resolves against the **definition set**; `Relation.sourceInstanceId` and
> `Relation.targetInstanceId`, and Container `rootInstanceIds`/`memberInstanceIds`, against the
> **instance set**; `SourceReference.sourceId` against the **source-document set**.

> **[R14]** Enumeration MUST be deterministic and total-ordered within every authoritative set by its
> schema-defined logical identifier ascending — including `instanceId`, `relationId`, `documentId`,
> and `containerId` — compared byte-wise over the canonical
> lowercase hyphenated UUID form. Implementations MUST NOT expose filesystem or key iteration order as
> enumeration order. The extension set MUST order first by `kind` byte-wise and then by `id`, because
> two aggregate kinds may deliberately project the same owning `repositoryId`.

> **[R15]** A source document's identity MUST be its `.meta.json` sidecar under `sourceDocumentsPath`,
> and its `documentId` MUST be read from that sidecar. A sidecar whose content file is absent MUST
> remain a valid source document. A sidecar with no parseable `documentId` MUST be an error.

> **[R16]** A derived catalog MUST NOT be committed as a repository member and MUST NOT be used as an
> authority. An implementation MUST associate a catalog with a **validity token** reported by the
> store that changes whenever enumerable content changes, MUST serve the catalog only while the token
> matches the store's current token, and MUST rebuild it otherwise.

> **[R17]** Within an immutable snapshot (`.srs`, `.srsj`), the enumerated contents ARE authoritative
> for that snapshot. Producing a snapshot MUST enumerate and include all six authoritative sets, the
> manifest, and the marker — including every presence-discovered local package root, whether or not a
> `PackageRef` names it, and every opaque payload under `sourceDocumentsPath`. Consuming one MUST
> discover by the same rules as a live repository of the same
> generation.

> **[R18]** If a serialised catalog artifact is standardised in future, its identity MUST be derived
> from a content digest. Observation time and source revision MUST be optional metadata. A generated
> wall-clock timestamp MUST NOT be written into a deterministic export (ADR-039).

> **[R19]** In `ext:json-store`, instance membership MUST be the set of `data` keys resolving under a
> reserved instance root, determined by segment-wise resolution of the key. Because a `.srsj` document
> has neither an `.srs` marker nor a `manifest.json` key, its anchors are stated directly rather than
> by [R3]: the empty key prefix is the repository root, and a key `<p>/package.json` whose value
> validates against `package-manifest.json` makes `<p>` a local package root. Other reserved
> repository locations MUST be carried as repository content. An implementation MUST NOT determine
> membership by glob or substring match over `data` keys (RFC-039 [R13]).

> **[R20]** The generation of a repository or snapshot MUST be determined by `dataModelRevision` on
> its manifest (the embedded manifest, for a snapshot), absent ⇒ 0. A `.srsj` document at
> `dataModelRevision ≥ 2` MUST declare `srsj: "2"`. A reader MUST reject an unrecognised `srsj`
> version rather than attempting to read it.

> **[R21]** A repository or package at `dataModelRevision ≥ 2` MUST satisfy this RFC's storage
> contract. A conforming **reader** encountering `dataModelRevision ≤ 1` data MUST reject it with a
> diagnostic naming the file and the expected generation, and MUST NOT coerce, partially read, or
> migrate it in place. A **migration tool operating under an explicit opt-in** is exempt from this
> rule; it is the only component permitted to read pre-generation-2 data.

> **[R22]** A routine instance create, update, or delete that is not an explicit container-membership
> operation MUST NOT modify `manifest.json`, MUST NOT modify `manifest.container`, and MUST NOT
> **write** any object other than its own target. An instance delete is the exception: it MAY declare
> and delete every incident Relation as additional targets in the same scoped cascade, and MUST do so
> when retaining one would violate [R13]. The same exception applies to references incident to a deleted
> Container or source document. No unrelated object may be added to the cascade.

> **[R23]** The store enumeration interface MUST return, per authoritative set, entries of
> `{id, kind, tier?, locator?}` with `kind` from the closed list in Change L and `tier` present only
> for instances. Enumeration MUST be materialised, not streaming, and MUST return diagnostics
> alongside entries. A locator MUST NOT be required to address an object and MUST NOT be used as
> semantic identity.

> **[R24]** Every diagnostic this RFC introduces MUST carry a stable identifier and a declared
> severity. An `error` under a reserved repository location MUST be **fatal to the load**: the
> repository MUST NOT be reported as successfully loaded, and an implementation MUST NOT return a
> partial catalog as if complete. A `validate` operation MUST report all diagnostics rather than
> stopping at the first.

> **[R25]** Amendments to Accepted RFCs, effective at the cutover. **RFC-039**: [R13]'s enumeration
> source becomes the authoritative store per [R1]; [R14]'s reference target becomes the authoritative
> instance set. **RFC-026**: [R5]'s `spec.id` test and Change C step 6's traversal resolve against the
> container set, and step 6's *output* obligation becomes "included in the slice archive's container
> set" rather than "in the slice archive's `containerIndex`", which [R2] would otherwise make an
> error; [R6]'s endpoint test and [R13]'s tests resolve against the instance set and container set;
> Change C step 5 and Change E item 4 resolve source documents against the source-document set.
> **RFC-013**: [R6] and [R9] resolve containers against the container set rather than
> `containerIndex`. **RFC-017**: [R2] and [R12] resolve source documents against sidecar discovery,
> and [R12]'s tombstone is keyed to the sidecar rather than to a `sourceDocumentIndex` entry.

---

## Schema changes

**No schema file is edited by this RFC.** Per the process gate on #296 this is design only; the table
below is the reviewed contract that the Phase-B cutover (#297) implements, in the composed release
train with RFC-039.

| Schema file | Change | Effect on existing data |
|---|---|---|
| `manifest.json` | Remove `instanceIndex` from `required`; remove the `instanceIndex`, `containerIndex`, `sourceDocumentIndex`, `relationsChecksums`, `relationsPath` properties and the `InstanceIndexEntry`, `ContainerIndexEntry`, `SourceDocumentIndexEntry`, `RelationsChecksumEntry` `$defs`; retitle away from "authoritative index" | All 3 exploded first-party repository manifests and 3 embedded manifests rewritten. `srs/manifest.json` loses ~3,400 of 3,560 lines |
| `relation.json` | **New file.** Standalone single-Relation entity: the 16 properties of Change E, 4 required, `additionalProperties: false`, `$schema` required and `const`-pinned | **243 relations across 3 live collections** become one file each: 205 (`srs/`), 17 (`gallery-project-v2/`), and 21 (`muSrs/`) |
| `relations-collection.json` | Retained only to describe generation-≤1 artifacts; **not** a generation-2 format in live repositories *or* snapshots | The 3 live collection files are removed after conversion; `gallery.srsj`'s embedded collection is converted too |
| *revisions sidecar* | **New file, owed.** No schema exists for `.revisions.json` today | 3 files under `gallery-project-v2/records/**` are unclassifiable; [R9]'s third conjunct makes them errors until this lands |
| *`.srsj` envelope* | **New file, owed.** There is **no schema in `docs/schema/2.0/` for the `{srsj, manifest, data}` envelope at all** — RFC-039 recorded this same gap and deferred it. [R20]'s `srsj: "2"` requirement therefore has no schema home today | 3 `.srsj` artifacts restamped; whoever closes RFC-039's recorded gap owns this |

**Invariants rewritten by this RFC** (beyond I-80 and I-118, whose substance is *ratified* but whose
wording references a now-absent property). Note the spec uses two identifier conventions — bare
numbers for core invariants, `I-` prefixes for extension invariants — and both appear here:
**Invariant 46** (every `instanceId` in `instanceIndex` resolves to a file at its declared `path`),
**Invariant 49** (an archive must include all instance files listed in `instanceIndex` — directly
contradicts [R17]), **Invariant 50** (a local package must include all Fields and Types referenced by
any Tier-2 Record "in the repository's instance index"), **I-82** (conditioned on a non-empty
`containerIndex`, permanently vacuous after Change K), **I-102** (`sourceId` resolves against
`sourceDocumentIndex`), **I-112** (tombstone keyed to a `sourceDocumentIndex` entry).

**Prose retired or rewritten**, named by section rather than by line because `docs/spec/srs-spec.md`
is a generated projection of `srs/records/` — re-rendering during this review shifted every line in it
by +37, which is why Revision 1's line citations were already stale when written:

- `ext:repository` §`RepositoryManifest` — the membership sentence, the TS model block, the layout-tree
  comment ("`manifest.json` ← required: root manifest and instance index"), and all **four** Entry
  definitions;
- `ext:repository` §Conformance requirements — the obligation to maintain "a complete and accurate
  `instanceIndex`" and to resolve "all instances via the index" (normative spec, not agent guidance);
- `ext:json-store` §File format — the AI-comprehension paragraph resting on "the `instanceIndex` in
  `manifest.json`";
- `srs-usage.md` §"The instanceIndex trap" — *"`manifest.json → instanceIndex` is the authoritative
  membership list. A record file on disk that is not listed there does not exist to the system."*
  `CLAUDE.md` names this file "the authoritative rules for working with any SRS repository as an
  agent", so it is the most consequential first-party statement of the losing side;
- `ext:repository` §Repository layout — the subfolder permission's `instanceIndex` condition; the
  folder-responsibility table gains `containers/`;
- `ext:repository` §Relations storage — collection requirement;
- `ext:repository` §Archive format — self-containment list, produce step 1, consume steps 4 and 5 ("Load relations from `relationsPath`");
- `ext:repository` §Import / re-import semantics — checksum-based no-op optimisation;
- `ext:json-store` §File format — the `srsj` version row and the `manifest.instanceIndex` row;
- `ext:json-store` §Path conventions in `data` — the membership rule, and the tier-by-folder table
  (which contradicts [R6], and would classify all 19 live `records/notes/` Notes as Tier 2);
- `ext:json-store` §Conformance requirements — producer obligations quantified over `instanceIndex`
  and `relationsPath`;
- the canonical `$schema` URL table — gains a `relation.json` row;
- agent guidance instructing maintenance of "a complete and accurate `instanceIndex`";
- `CLAUDE.md` (repository root) — states "The `instanceIndex` in the manifest is the authoritative member list",
  i.e. first-party documentation asserting the losing side of the contradiction.

Schema changes are synced to `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/`
through those repositories' own pipelines, from the `srs` release artifact. Their mirror PRs MUST
merge **before** the `srs` schema PR — a rule already violated once, on RFC-036, which turned
`srs-rust` `master` red. That ordering binds the Phase-B PR, not this one.

---

## Migration plan

The owner direction fixes the boundary: there are **no SRS repositories in the wild** and no
unmentioned repository population to defer. No public upgrade command, no compatibility reader, and
no supported intermediate format is owed. The corpus that must reach the final contract is the spec
repository, the gallery example, `muSrs` in `muDemocracy.org`, and the first-party package artifacts
and snapshots they require. `conformance/discovery/fixture-repo/` and `tests/rfc-032/` remain test
inputs, not repositories: neither receives invented root identity or a repository marker.

### Composition with RFC-039

RFC-039 (Accepted, Rev 6) states its side: the designs are independently reviewable, first-party data
moves **once**, and where they touch — `manifest.json`'s stamped revision and `.srsj` enumeration —
"RFC-038's decisions govern placement and this RFC's govern value shape". This RFC adopts that
division **and amends two of RFC-039's rules to match it** (Change M); the claim in Revision 1 that no
amendment was needed was false.

Both land at a **single `dataModelRevision: 2`**, in the composed #242 / #296 release train tracked on
#297. Neither ships alone, and this RFC does **not** take revision 3.

**Ordering is pinned below step granularity**, because two steps collide. RFC-039 [R13] asserts a
count against `instanceIndex`, which this RFC deletes; and RFC-039 Phase 2 **step 8** stamps
`dataModelRevision: 2` on every manifest. If that stamp landed before this RFC's strip, the corpus
would sit — for the duration of the migration, and across RFC-039's own count assertion — stamped
generation 2 *and still carrying* `instanceIndex`, which [R2] makes an error and for which [R21]'s
migrator exemption does not provide (it exempts reading generation-≤1 data, not this). The stamp is
therefore **not** RFC-039 step 8's to apply; it is a single shared final step:

1. RFC-039 Phase 0 (definitions) → Phase 1 (instances) → Phase 2 **steps 1–7 and 9–10** run first and
   to completion, including [R13]'s count assertion, while `instanceIndex` still exists and the corpus
   is still stamped generation ≤ 1.
2. RFC-038 Phase 1 steps 7 and 9–10 below run, converting relations and stripping the retired
   properties.
3. **One shared stamping step** — RFC-038 Phase 1 step 8 — applies `dataModelRevision: 2` and
   `srsj: "2"` across the whole inventory. RFC-039 Phase 2 step 8 is subsumed by it and does not run
   separately; the corpus is never simultaneously stamped and un-stripped.

### Phase 0 — audit, before anything is written

1. Enumerate every in-scope repository tree under the new rules and diff against the current
   `instanceIndex` where one exists. Every discovered-but-unindexed and indexed-but-undiscoverable
   object is reported and resolved explicitly. **Fail closed**: the migration does not proceed with an
   unresolved disagreement. In `srs/` the diff is empty at 375/375; in `muSrs` it is independently
   empty at **32/32**, with zero path disagreements.
2. Resolve `spec/srs-purpose-and-scope.md` (Change G) — sidecar present, not indexed; it becomes a
   member unless deliberately removed.
3. Resolve srs#307 (Change H). It is fixed on its own row, but it **must** be fixed before the
   cutover, not merely registered: [R13] makes it an error and [R24] makes an error under a reserved
   location fatal, so a deferred #307 means the spec repository does not load. Revision 3 offered
   "or record it as a known failure the new diagnostics will surface"; that option does not exist.
   Bringing `base` and `core` into `package-manifest.json` conformance is a prerequisite for the same
   reason — [R4] diagnoses them, and under [R24] that is fatal.
4. Preserve the 3 `.revisions.json` histories by landing the owed `ext:addressability` sidecar schema.
   The three files have one uniform envelope and entry shape; deleting valid history is not an
   admissible migration action.
5. Record baseline counts, identifier sets and content hashes for parity checking: **417 Tier-2, 2
   Tier-1, 23 Tier-0 instances** across the in-scope exploded repositories and **243 relations across
   4 collections**, measured per tree. Preserve both sides of every explicitly reconciled conflict in
   the audit record so Phase 2 can distinguish an owner-approved correction from accidental loss.
6. Apply the owner-selected `muSrs` reconciliation before stamping. Its inline root Container and
   `containers/1706c6a2-a901-4503-98a3-876b9a437ec9.json` claim the same `containerId` but disagree on
   `identityInstanceId`. Set `manifest.container` to exactly:

   ```json
   {
     "containerId": "1706c6a2-a901-4503-98a3-876b9a437ec9",
     "identityInstanceId": "dc2723e7-aca3-4562-b893-47bd24da629d",
     "memberInstanceIds": [
       "632e1331-7756-481d-84c5-3c34812bf55b",
       "dc2723e7-aca3-4562-b893-47bd24da629d"
     ],
     "rootInstanceIds": [
       "09b3fbbc-d7af-4924-b0a9-4c09133e2550",
       "1ff0ab83-c1c8-4e23-b611-2e629d919307",
       "30b82df3-1cf3-45e9-a1e5-1b8fe1d3497b",
       "0b3cd130-0f39-4542-a64f-48135f35c246",
       "0dff90b5-4534-4a2b-9f1a-28f35130e943",
       "a44be813-d2b4-4214-aaa9-4b8a11ce206f"
     ],
     "title": "muDemocracy"
   }
   ```

   This keeps the RFC-029 I-87-conforming Tier-2 purpose identity, normalizes the overlapping member
   and root arrays, and deliberately omits `containerType`. Remove the standalone Container so the
   inline object is the sole generation-2 root representation. Its `package/` and `packages/governance/`
   manifests also declare 27 duplicate definition ids (19 Fields, 4 Types, 1 View, 3 DocumentViews).
   They are byte-identical, and `com.mudemocracy.governance` is the namespace-specific owner: remove
   the duplicate declarations and files from `muSrs/package/`; retain the canonical copies in
   `muSrs/packages/governance/`. `conformance/discovery/fixture-repo/` remains outside the repository
   model, so its deliberately incomplete root structure is not migrated. Add an empty `.srs` marker to
   `docs/spec/examples/gallery-project-v2/`, whose manifest, inline root and package make it an
   intended repository.

### Phase 1 — transform placement

7. Write each relation in all four collections to `relations/<relationId>.json`; verify the
   `relationId` set is unchanged and unique; delete the collection files. This includes the 21
   relations in `muSrs/relations/relations-collection.json`.
8. **The single shared stamping step** (see the ordering above): strip the retired inventories from
   every manifest and stamp the generation across the whole inventory. Because Revision 3 stated three
   mutually inconsistent counts across four sections, the inventory is given once, as a table, and
   this is the only place it appears:

   | Artifact class | Count | Notes |
   |---|---|---|
   | Repository manifests, exploded | 3 | `srs/`, `docs/spec/examples/gallery-project-v2/`, `muDemocracy.org/muSrs/` |
   | Repository manifests, **embedded in `.srsj`** | 3 | `gallery.srsj` (24 `instanceIndex` + 4 `containerIndex`); both governance seeds (`instanceIndex: []`) — each needs stripping, not just stamping |
   | Package manifests, first-party in-scope | 11 | 6 under `srs/package/` + gallery + `muSrs/package/` + `muSrs/packages/governance/` + `packages/com.mudemocracy.governance/{1.0.0,1.1.0}/package/` |
   | Package manifests, out of scope | 3 | `rfcs/rfc-004/**` — RFC proposal fixtures, not live packages |
   | `.srsj` envelopes taking `srsj: "2"` | 3 | `gallery.srsj` + 2 governance seeds; each currently `srsj: "1"` with no `dataModelRevision` at top level or inner manifest |
   | `.srsj` artifacts out of scope for [R19]/[R20] | 1 | `core-bundle.srsj` — no `srsj`, no `manifest`, no `data`; it is a package bundle |

   **The `packages/**` boundary joins this cutover.** The owner has ruled out a deferred repository
   population. The two published governance packages are therefore migrated with their consumers,
   superseding RFC-039's #286 scheduling note; they cannot remain pre-generation-2 while [R21] makes
   that generation unreadable.

9. Bring `base` and `core` package manifests into conformance with `package-manifest.json` (5 missing
   required properties each — `$schema`, `createdAt`, `description`, `status`, `title`), so [R3]
   anchors them. **This runs before step 8**, despite the numbering, and before any stamping.
10. Leave instance files where they are. **No instance moves**: all 375 indexed instances in `srs/` are
    already under a reserved instance root by [R3] — 368 under `records/**` and 7 under
    `package/records/**` via the package-manifest anchor; all 32 indexed `muSrs` instances are already
    under its top-level `records/**`. These are verified properties, not assumptions.

### Phase 2 — verify

11. Re-enumerate and assert identity-set parity against the Phase-0 baseline plus its recorded owner
    decisions: same instance, relation and document ids; the root-container and duplicated-definition
    deltas must equal exactly the explicit `muSrs` reconciliations in step 6; same content hashes for
    every otherwise unchanged object.
12. Assert `srs repo validate` reports 0 errors, and that the new diagnostics fire where Phase 0 said
    they should.
13. Re-render `docs/spec/` and assert the output is unchanged except where a retired property is
    quoted. This is expected to hold rather than merely hoped for: document order is Rule **[N+12]**
    (`ext:views-l2`) — a `precedes` topological sort with a **`createdAt`-ascending** tiebreak — with
    RFC-013 [R5] pinning residual equal-`createdAt` ties by `instanceId` ascending as a *secondary*
    key. None of those is enumeration order, so [R14]'s ordering change does not reach the renderer.
    (Stated precisely because RFC-013's own Rev-3 history records an earlier draft "invent[ing] an
    ascending-`instanceId` tiebreak that conflicted with the existing Rule [N+12]" — the same
    simplification, already caught once.) The assertion is the check that proves it.
14. Round-trip each of the 4 `.srsj` artifacts and each `.srs` archive through pack/unpack and assert
    byte-stability of the deterministic archive (ADR-039).
15. Run the mergeability proofs below.

### Rollback

`git revert` of the cutover train, per the owner decision that git history is the development recovery
mechanism. There is no downgrade converter and none is owed: a staged-tree-plus-backup-artifact
procedure would be right for a public migration and is unnecessary for a first-party one.

### Acceptance tests

1. Two branches from one base each add a Tier-0 Note. Neither diff touches `manifest.json`. The
   branches merge with no textual conflict, and enumeration from the merge result finds both notes.
   PR #291 is the fixture.
2. Two branches from one base each create a Relation. Neither touches a shared file; merge is clean;
   both relations enumerate.
3. Filesystem, JSON-store, memory/tree and a database-shaped store return the same catalog — same
   ids, kinds, tiers and order under [R14]'s stated collation — for the same logical content.
4. A duplicate `instanceId`, `relationId`, and definition primary identifier each produce an error
   naming every locator; a reference resolving to duplicate definitions is not accepted.
5. A malformed JSON file under a reserved location is a fatal error ([R24]); the same file outside
   every reserved location is untouched and undiagnosed.
6. A sidecar with no content file survives migration as a source document.
7. A catalog whose validity token is stale is rebuilt, never served.
8. srs#307's dangling `fieldId` is an error under [R13].
9. A pre-cutover reader given a `srsj: "2"` document refuses it rather than reporting an empty
   repository.
10. An orphaned `.revisions.json` is an error under [R9].
11. A conforming `package.json` is classified as the package manifest at its local package root, while
    a nested `records/` object is classified only as an instance under the most-specific-location rule.
12. Markdown or arbitrary-byte source payloads under `sourceDocumentsPath` are preserved and are not
    parsed as entities; malformed `.meta.json` candidates remain fatal.
13. Deleting an instance with two incident Relations removes exactly the instance and those two
    relation files in one scoped cascade and leaves no [R13] diagnostic.
14. The migrated `muSrs` enumerates 32 instances and 21 relations; its sole root-container
    representation equals the exact object in Phase 0 step 6 (including the Tier-2 purpose identity,
    normalized membership arrays, and absence of `containerType`); it has no duplicate definition
    identifiers and carries generation 2 on its repository and both package manifests.
15. A snapshot containing declared changelog or federation data round-trips the extension set without
    loss, alongside the other five authoritative sets.

---

## Corpus

The `srs`-repository figures were measured at `srs@e0fb4b0` by an exhaustive walk of **1,011 files
(891 JSON/`.srsj`)**, with `srs` built from `srs-rust@356c544`. Revision 5 separately measured the
working-tree `muSrs` migration target. Each row states its tree; no `srs/`-scoped figure is quoted as
covering the full migration scope.

| Tree | Manifest | `.srs` marker | Instances | `$schema` on instances |
|---|---|---|---|---|
| `srs/records/**` | `srs/manifest.json` | present | 19 T0, 349 T2 | 368 / 368 |
| `srs/package/records/**` | same manifest | — | 7 T2 | **0 / 7** |
| `conformance/discovery/fixture-repo/` | own | **absent** | 1 T0, 2 T1, 8 T2 | 11 / 11 |
| `docs/spec/examples/gallery-project-v2/` | own | **absent** | 2 T0, 22 T2 | 2 / 2 T0, **0 / 22 T2** |
| `tests/rfc-032/` | **none** | absent | 1 record-shaped object | 1 / 1, non-conforming |
| `muDemocracy.org/muSrs/records/**` | own | present | 1 T0, 31 T2 | **11 / 32** |

Migration-scope totals across the exploded repository trees are **417 Tier-2, 2 Tier-1, 23 Tier-0**.
The pre-`muSrs` subtotal (**386 Tier-2, 2 Tier-1, 22 Tier-0**) matches RFC-039's independently-derived
figures; Revision 5 adds the separately measured target rather than pretending it was included before.

**Relations: 243 across 3 live collections** — 205 in `srs/` (99 `precedes`, 106 `contains`), 17 in
`gallery-project-v2/`, and 21 in `muSrs`; all 21 `muSrs` relation endpoints resolve against its
32-instance set.

**Non-instance content is the majority of what a repository holds**, which is why [R5] and [R10] had
to be separated. In `srs/`: 637 files, **375 inside reserved instance roots, 262 outside** (255 JSON
+ 7 non-JSON) — **150 Fields, 45 Types**, 23 RelationTypes, 12 Containers, 5 source-document
sidecars, 6 package manifests, 4 Views, 4 DocumentViews, 1 Vocabulary, `relations/relations.json`,
and `manifest.json`. In `gallery.srsj`: 68 `data` keys, **24 under `records/`**, 44 elsewhere.

**`$schema` absence is a corpus-wide pattern, not a Records quirk.** Counted by *shape* rather than
declaration, the non-instance population also carries undeclared objects: 4 of 150 Fields (all in
`srs/package/base/fields/`), 1 of 45 Types, **12 of 12 Containers**, and 1 of 1 Vocabulary declare no
`$schema`. The Container figure is the operative one — it means classification at a reserved
non-instance location cannot rely on a declaration either, which is why [R7] and [R8] are written
over reserved *locations* generally rather than over instance roots alone.

**The discovery rule reproduces the existing index exactly.** [R3] was implemented independently and
run over `srs@e0fb4b0`: it returns **exactly the 375 instances `instanceIndex` lists** — zero
discovered-but-unindexed, zero indexed-but-undiscoverable, zero path disagreements. That is the
strongest available evidence that the rule is neither over- nor under-inclusive on the live corpus,
and it makes Phase 1 step 10's "no instance moves" a measured property rather than an assumption.

**The anchor rule is bounded in practice.** Of the 13 `package.json` files in the repository, exactly
**one** — `srs/package/` — has a reserved directory beside it, so [R3] adds no discovery surface
beyond the known 7 instances. The 3 under `rfcs/rfc-004/` (RFC proposal fixtures) and the 2 under
`packages/com.mudemocracy.governance/*/package/` lie outside the `srs/` repository subtree — there is
no `.srs` marker and `manifest.json` above them — so [R3]'s confinement clause excludes them without
a special case. Inside `srs/`, [R4] fires on exactly **2** files, `base` and `core`, which is correct:
both genuinely fail `package-manifest.json`.

**`muSrs` non-instance audit.** Its new instance discovery is exactly index-equivalent at **32/32**,
with zero discovered-only, indexed-only or path-disagreement cases. It adds one exploded repository
manifest, two conforming presence-discovered package manifests and one 21-relation collection. It also
contains the two Phase-0 conflicts that changed Revision 5: a duplicate root `containerId` with
conflicting `identityInstanceId`, and 27 duplicated definitions across the two package roots. Revision
6 resolves the root conflict explicitly: the Tier-2 purpose (`dc2723e7-…`) is the identity, the Note
(`09b3fbbc-…`) remains a root member, the five guides are root-only, and the purpose plus decision log
are member-only. The duplicate-definition reconciliation remains a Phase-0 repository repair because
canonical package ownership must be decided as each affected repository is migrated.

**Snapshot artifacts (4):** `docs/spec/examples/gallery.srsj` (22 records / 100 field values),
`packages/com.semanticops.core/1.0.0/core-bundle.srsj` (a package bundle — no `data`/`manifest`
envelope), and `packages/com.mudemocracy.governance/{1.0.0,1.1.0}/seed/empty-governance-document.srsj`.
None carries `dataModelRevision` today.

Two rows carry design weight beyond their size. `srs/package/records/**` falsifies a
`packageRefs`-keyed discovery rule (Change B). `tests/rfc-032/` has no manifest at all, so it is
invisible to every manifest-based enumeration including the current one — it is reachable only under
this RFC's rules, and only once it acquires a manifest, which is a Phase-0 decision.

Shared-file sizes: `srs/manifest.json` 95,846 bytes / 3,560 lines / 375 indexed instances / 12 indexed
containers / 4 indexed source documents; `srs/relations/relations.json` 57,709 bytes / 1,440 lines.
`relationsChecksums` is absent from all three exploded first-party repository manifests, so retiring it costs
nothing anywhere.

---

## Rationale

**Why tree authority rather than index authority.** The contradiction had to be resolved in one
direction, and one direction was already load-bearing. RFC-013's required-root-container guarantee is
defined against "the repository's authoritative instance set", with `instanceIndex` explicitly
demoted to a cache; I-80 and I-118 carry that into the invariants. Choosing index authority would
mean amending three ratified rules and the guarantee built on them. Choosing tree authority means
retiring prose and a schema description that lost an argument the specification already had.

It is also the only choice that fixes Problem 2. Index authority with better ergonomics is still a
shared mutable file.

**Why enumeration had to be specified here.** RFC-013 [R2] says membership is "the union of the
instance files declared by the repository" without saying how they are declared. That was survivable
while `instanceIndex` existed, because the index answered the question in practice even though the
rule said it was not authoritative. Removing the index without defining enumeration would leave
membership genuinely undefined for the first time.

**Why six named sets rather than "the authoritative set".** Because the single-set formulation, which
Revision 1 used, is not closed over what a repository contains: 262 of 637 files in `srs/` are not
instances, and rules about manifests, relations, containers, sidecars and Fields all have to quantify
over something. Naming the sets is what makes [R13] mean "this `fieldId` is missing" rather than "all
51 Types are broken".

**Why presence of a package manifest, not `packageRefs`.** The corpus falsified the alternative: 7
instances live under a package manifest `packageRefs` does not declare. Beyond the count, a discovery
rule that reads a manifest-declared path list reintroduces the thing being removed — a mutable
registry a writer must maintain, in the file that must stop being touched.

**Why one relation per file rather than shards.** Sharding is a probability reduction; standalone
files are an elimination. The cost is 222 small files where there were 3, which is what the filesystem
is for, and what every instance already does.

**Why relations keep a bespoke root and a derived filename** rather than becoming ordinary discovered
objects with implementation-chosen names. That alternative is coherent and would avoid the
filename-vs-content question entirely, but it loses the property that makes relation writes
conflict-free *by construction*: if the filename is free, two writers can create the same relation
under two names, and nothing but a content scan detects it. Deriving the name from the `relationId`
makes a duplicate a filesystem-level collision — visible immediately, at the point of writing, without
enumeration. The in-file identifier stays authoritative, so the existing rule is preserved.

**Why no new snapshot inventory.** Nothing in the corpus needs it: `.srs` and `.srsj` already
enumerate their own contents. Standardising a format ahead of its consumer is how `instanceIndex`
became normative in the first place — a convenience that hardened into an authority. [R18] fixes the
identity rule now so a future artifact cannot be introduced with a wall-clock timestamp and break
ADR-039 determinism.

**What this RFC deliberately does not decide.** Root-container composition is #267's, and Change K
touches it only to forbid routine writes. Package definition indexes, federation aggregates and
changelog aggregates are out of scope by the issue's framing and stay out — each is an aggregate over
definitions rather than a membership claim over instances. Definition **kinds and declared paths**
continue to come from each package manifest's arrays, while the set of package roots is presence-keyed;
that distinction is what exposes both srs#307's formerly invisible definitions and `muSrs`'s duplicate
definition ids.

---

## Alternatives Considered

### Alt A — do nothing

The contradiction stays unresolved and implementations keep choosing. PR #291's failure mode recurs on
every pair of concurrent writers, which for an agent-authored repository is the normal case. Rejected:
the cost is already being paid.

### Alt B — keep the index, make it merge-friendly

Sort deterministically, one entry per line, or a union merge driver. This reduces conflict frequency
without changing that two independent writes touch one file; a union driver silently produces an index
containing both writers' entries and whatever ordering artifact results, with no validation that the
result is coherent. It leaves Problems 1 and 3 entirely. Rejected as a mitigation offered in place of
a fix.

### Alt C — manifest-configured discovery roots

Keep an index-like list, but of *roots* rather than instances. Rejected because it recreates a shared
mutable registry in the file that must stop being written, and because the corpus shows the failure
mode: `packageRefs` is exactly such a list and is already missing the root holding 7 instances.

### Alt D — scan the whole repository by shape

No reserved locations; anything that validates as an SRS entity is a member. Wrong in both directions:
it captures application JSON that happens to validate, and makes "add a file" a semantic act. It also
makes [R9]'s closed candidate policy impossible — with no boundary there is no set within which an
unrecognised shape is an error.

### Alt E — require `$schema` on every object

Rejected on evidence: 29 live Tier-2 Records have no `$schema` and are conforming without it, since the
schema-conventions section makes it a SHOULD. The rule would invalidate them, and
`tests/rfc-032/records/showcase-instance.json` shows a declaration is not proof of conformance anyway —
so validation is needed regardless and the requirement buys nothing.

### Alt F — separate `dataModelRevision` for RFC-038

The issue's option appraisal originally recommended #242 take the next revision and RFC-038 the one
after. Superseded by RFC-039 as Accepted, which fixes a single shared revision 2 and states neither
cutover ships alone. Two revisions would imply a supported intermediate state the owner decision
removes the need for.

### Alt G — bump the `.srs` marker version instead of `srsj`

Rejected: the marker identifies the repository-root convention, which is unchanged, and `.srsj`
documents do not carry a marker at all — so it would not discriminate the format where discrimination
actually matters. The `srsj` gate already exists and already obliges readers to reject unrecognised
versions.

---

## Cross-references

| RFC / ADR | Relationship |
|---|---|
| RFC-012 [R6] | Ratified tree authority for membership; this RFC promotes it to the general rule and supplies enumeration |
| RFC-013 [R2], I-79, I-80 | Ratified warrant for tree authority; root container retained inline. **[R6] and [R9] amended** — both resolve containers against `containerIndex` ([R25]) |
| RFC-017 | **Amended** — [R2] and [R12] quantify over `sourceDocumentIndex`; [R12] is the Accepted rule I-112 encodes ([R25]) |
| RFC-026 (`ext:slices`) | **Amended** — [R5] and [R13] quantify over `containerIndex`/`instanceIndex` (Change M, [R25]) |
| RFC-039 (#242, Accepted Rev 6) | **Amended** — [R13] and [R14] depend on `instanceIndex` (Change M, [R25]); composed cutover at a single `dataModelRevision: 2` |
| RFC-033 / #265 | `dataModelRevision` as a monotonic integer generation stamp |
| ADR-039 | Deterministic `.srs` archives — constrains [R18] |
| ADR-041 | Storage backend guardrails G3–G5; Change L is its enumeration half |
| ADR-042 | Typed logical-id persistence methods; the template Change L extends to relations |
| #267 | Root-container composition — explicitly out of scope |
| #297 / srs-rust#783 | Ecosystem cutover and core implementation |
| #285 | Publication reachability must consume discovered/catalogued records, not index membership ([R1], [R23]) |
| #272 | Schema ledger must account for the post-cutover manifest and the new `relation.json` |
| #291 | Evidence and acceptance fixture |
| #307 | Live dangling reference; the calibration case for [R13] |

---

## Resolved migration dispositions

- `docs/spec/examples/gallery-project-v2/` is a repository and receives the required empty `.srs`
  marker. Its existing manifest, inline root and local package demonstrate that intent.
- `conformance/discovery/fixture-repo/` is fixture data, not a repository. Its intentionally absent
  root Container is retained as fixture coverage rather than repaired by inventing a purpose Record.
- `tests/rfc-032/` is unit-test input, not a repository: it has a test runner, goldens and one sample
  instance but no manifest or repository boundary.
- The uniform `.revisions.json` data is preserved and covered by a new `ext:addressability` schema in
  this cutover. Schema ownership is an implementation task, not a policy decision.
