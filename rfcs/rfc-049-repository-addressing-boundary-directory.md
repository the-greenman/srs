> **GitHub issue**: [the-greenman/srs#913](https://github.com/the-greenman/srs/issues/913)

# RFC-049: Repository addressing — the Address in the core, and a first registry

**Status**: Draft (Revision 8)
**Affects**: the core, Foundation group (the `Address` moves out of `ext:addressability` and gains an optional `repositoryId`); `ext:addressability` (keeps the live cursor, `AttentionState`); `ext:repository` (one rule: a repository declares no boundary or neighbours); `ext:registry` (its existing `Registry` catalog grows to entries by **kind**: `package`, carried across from today's entry, and `repository`, new); a new schema for the registry document (`docs/schema/2.0/registry.json`, proposed); implementations that resolve an Address in another repository, and srs-rust's shipped `srs registry` commands. Builds on **RFC-003 (Accepted)** ([C5] canonical JSON), **RFC-026 (Accepted)** (slices: a new `repositoryId` and a recorded origin), **RFC-038 (Accepted)** (tree-authoritative repositories), **RFC-044 (Accepted)** (package dependencies keyed by `packageId`) and `rfc-decision-5f18603e` (federation's return is committed, after its removal by `rfc-decision-4f1e12e5`). Scheduled by programme decision 31e9fd27 (ratified 2026-10-16) as step 1 of federation's return. Leaves package distribution and binding to **RFC-047 (Draft)**.
**Author**: Owner direction on the-greenman/srs-rust#683 (2026-10-08) and owner rulings of 2026-10-30; drafted by Claude Code
**Date**: 2026-10-08 (Revisions 4–8: 2026-10-30)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 8 | 2026-10-30 | Review round 5 (one combined review: **0 blocking**, 6 should-fix, 4 nits; review loop closed; none declined; posted on #913) folded. Own-id exception extended to the request's repository, and an `ext:registry` implementation using no registry keeps the one-repository boundary ([R8]). `bundled` locators are `entry-malformed` in a registry ([R3], [R15]). The `registryRevision` deviation from `rfc-decision-628cf6c4`'s parenthetical named in *Contradictions found*. A target below the supported revision and not migrated is `revision-unsupported` ([R5]). A default whose entry did not load is governed in [R13]. Counts of the srs-rust changes corrected (seven). Ordering overlap, `packageId` case, malformed entries in conflicts, and charter bookkeeping fixed. |
| 7 | 2026-10-30 | Review round 4 folded (one combined review: 1 blocking, 9 should-fix, 4 nits; none declined; posted on #913). **The registry carries its own generation counter, `registryRevision`,** which moves only when the registry's shape changes, instead of the corpus's `dataModelRevision`: sharing the corpus counter would have forced a no-op 11→12 revision on every repository and made older binaries refuse registries a newer one writes. Resolution outcome codes moved to a Core rule ([R5]); locator-taking moved into Core [R8]; [R2] limited to what is checkable (locators). Own-id exception carried into [R5]/[R8]. `locator-unusable` is a resolution outcome only. Unknown entry fields are kept, not malformed. Missing migration step added to load refusals; the load code renamed `registry-revision-unsupported`. LOCATOR shape cited from `ThemeReference` (`packageRef` has not reached it); `bundled` not used in registries. Package identity check left to RFC-047. Address equality and container context reconciled with design note 008. Ids compared without regard to case. What breaks gains the WASM registry bindings and srs-rust's `DocumentAddress`. Citation slips fixed. |
| 6 | 2026-10-30 | Review round 3 folded (Spec Integrity 15 findings, 0 blocking; Completeness 20, 5 blocking; none declined; posted on #913). **The locator is the charter's LOCATOR shape** (`rfc-decision-c8704763`: `{mode, path|url|id}`), not an opaque string; `repositoryId` is a KEYED reference scoped by the registry. **The `downloadUrl`→`locator` rename applies `rfc-decision-628cf6c4`**: a deterministic migration of pre-RFC catalogs on read, and the registry stamped with `dataModelRevision` under RFC-003 [C6]'s reader rule (absent ⇒ 0, re-stamp across steps that change no registry shape). RFC-047's manifest `bindings[]` stay legal as references by id ([R2]); `childRegistries` is referral. [R2] restated as two checkable halves. The boundary and `not-in-boundary` are Core; an implementation without `ext:registry` serves one repository for resolution. Self-id always resolves as absent ([R13]). Stored conversation tags name the session's repository. [R12] is Address equality, not record identity. Kind shapes made normative ([R14]). Outcome codes split into load and resolution ([R5], [R15]). [R9] ordering made total; unknown top-level fields kept. Only three spaces. Resolution of non-member records and unset fields stated. Shipped srs-rust behaviour changes listed. Every decision's triggers say where they are checked. Integration counts made exact (22 records change, 7 checked unchanged). **One question for the owner: writes to non-default repositories (srs-rust#683).** |
| 5 | 2026-10-30 | Owner ruling **option B**: the registry is the existing `ext:registry` `Registry`, grown (catalog fields optional, every entry states `kind` and `locator`), with today's entry carried across as the `package` kind; decision, uses, rationale, costs and review triggers recorded (*Decisions*). Each ruling now a decision with its own review triggers. Review round 2 folded (Spec Integrity 15 findings, Completeness 19; none declined; posted on #913): [R2] narrowed to structural declarations; conformance class on every rule; Address equivalence, request default and self-id rules ([R12], [R13]); `fieldId` requires `recordId`; AttentionState and Invariant 34 stated unchanged; unsupported spaces covered by [R11]; one registry per resolution context; duplicates and malformed entries fail per entry; [R9] reuses RFC-003 [C5] and states ordering, unknown-kind preservation and the stamp rule; resolution outcomes and codes enumerated; non-Address reads bound by the boundary; consequence of acceptance stated plainly (no stored construct carries a foreign Address yet); integration fold lists 17 records; "registry" name collisions acknowledged; worktree consequence listed. |
| 4 | 2026-10-30 | Owner rulings (conversation of 2026-10-30, vignettes in srs-programme's Narrative explorations). The Address moves to the core and `AttentionState` stays in `ext:addressability` (Change A). One generic registry replaces the boundary directory (option C of the registry choice). `srs://` stays tooling: [R1] and its grammar withdrawn, ADR-037 §6 stands, srs#218 stays parked. [R2] re-worded to the owner's framing. Unresolvable Addresses stay valid ([R11]). [R7] scoped to resolution. The Address corrected to the spec's actual union. Acceptance gate answered by decision 31e9fd27; Open Questions 1–6 closed. |
| 3 | 2026-10-08 | Owner review comment on PR #917: `Address` gains an optional `repositoryId` component and `srs://<repositoryId>/…` is one serialization of it. Referral and R6 noted in Rationale. |
| 2 | 2026-10-08 | Review round 1 (both reviews posted on #913). Repository id defined as `manifest.repositoryId`; self-address and existing-MCP behaviour stated; acceptance gate separated from Open Questions; relationship to RFC-038/045/047, forecloses list and integration tokens added. |
| 1 | 2026-10-08 | Initial draft. Frames the repository directory first asked for as MCP multi-repo serving (srs-rust#683) as the first, addressing-only step of federation's committed return. |

---

## Charter alignment

**Cell(s):** cell:reference, cell:identity, cell:repository, cell:conformance, cell:portability
**Decision mode:** complex

This is a complex decision. The consequence map below places the options; the owner's rulings of 2026-10-30 chose among them (see *Decisions*).

**Governing cell preferences.**
- **Reference: declared strength over convenient reach.** Deciding cell for Change A. A reference to another repository names it by id inside the Address; reaching it goes through a declared registry entry and is read-only. Cross-repository relations, which need their own declared strength, are the next RFC.
- **Identity: identifier over label.** Every registry entry is keyed by an identifier, never by its label or locator. A record's home is named by `repositoryId`, which tells apart the same `instanceId` held in two repositories (an origin and its slice, RFC-026).
- **Repository: catalog over circumstance.** Which repositories an implementation can reach becomes a declared catalog, not whatever paths a process was started with.
- **Conformance: one way over many.** Deciding cell for Change B. Repositories and packages both need "an identity resolves to a place". The catalog `ext:registry` already defines and srs-rust already ships becomes the one mechanism for both.
- **Portability: preserve over recognize.** The registry has one held-and-travelling form (`rfc-decision-8948e43f`, applied by extension). An Address that cannot be resolved here is preserved, never discarded ([R11]), as the *Distributed Knowledge Ownership* note asks of federation.

**Axis preferences.**
- **4–10, Office over Testimony.** Default pole. A registry entry is the declaration of whoever operates the registry (office); a repository's report of its own id is testimony checked against it ([R6]).
- **6–12, Portability over Possession.** Default pole. No repository holds its neighbours' locations ([R2]); the registry itself travels ([R9]).
- **1–7, Semantic Integrity over Practical Expression.** Default pole. The `srs://` string, the practical expression, stays tooling's; the Address is the meaning.

**Decisions consulted:** rfc-decision-4f1e12e5, rfc-decision-5f18603e, rfc-decision-8948e43f, rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-16b20c56, rfc-decision-c20fcff8, rfc-decision-e99a9437, rfc-decision-7caca3a1, rfc-decision-5f8204bc, rfc-decision-628cf6c4, rfc-decision-a8dcbfe5, rfc-decision-c8704763, rfc-decision-2a1e1590, rfc-decision-1e5df0d9. Programme decision 31e9fd27 (srs-programme) schedules this RFC.

**Contradictions found:**
- The live `ext:registry` text says it "states no opinion on registry authority". This RFC gives the registry an authority for resolution: the operator's entry is office ([R6]). The clause is replaced in the fold, and the other half of it, that a consumer may index several catalogs, is kept for discovery and excluded from resolution ([R8]).
- "Registry" already names three other things: the migration registry (`repo apply-migration --id …`, RFC-051/052), the conformance check registry (`scripts/checks.json`), and the **consumer's registry** of installed packages (`manifest.json`'s `PackageRef` `remote` description, `mechanism-cac02817`, `mechanism-c6699224`, `table-e6e67001`). Description's "one name over many" is strained, not broken: the first two are tooling inventories, and the consumer's registry is the local store a package lands in after it is fetched. This RFC writes "`ext:registry` registry" wherever a reader could confuse them. A `PackageRef` keeps its own locator and does not resolve through a `package` entry; the registry is where a consumer finds a locator for a `packageId` it does not yet have.
- **Reference taxonomy (`rfc-decision-c8704763`).** The registry's `locator` is a LOCATOR reference and takes the taxonomy's one LOCATOR shape, `{mode: local|remote|bundled, path|url|id}`; no second locator form is introduced. `Address.repositoryId` is a KEYED reference: a bare key whose scope is stated by the construct, here the registry in use. No fifth strength is needed.
- **Rename as migration (`rfc-decision-628cf6c4`).** The `package` entry's `downloadUrl` becomes `locator`, and `kind` becomes required. The rule is applied in full: D2 names old and new; a deterministic migration brings a pre-RFC catalog forward on read ([R9]); the registry carries a generation stamp; the old name is not kept as an alias. The decision's parenthetical names the corpus's stamp, `dataModelRevision`; the registry deliberately carries its own, `registryRevision`, because it holds nothing from any repository and sharing the corpus counter would force no-op corpus revisions (see *Schema changes*, Generation stamp). The `.srsj` envelope's own `srsj` format gate is the precedent for a carrier with its own counter.
- srs-rust ADR-037 §6 (`srs://` is tooling) is no longer contradicted: no rule on `srs://` strings remains. Its text pointing at `ext:addressability` for the Address becomes stale; a pointer fix is a follow-up in srs-rust.

**Deciding cell:** Reference for Change A; Conformance for Change B.

**One-way-per-goal:**
- The Address already exists, inside `ext:addressability`. Change A **moves** it to the core and extends it; no second address type.
- `ext:registry` already defines a `Registry` catalog. Change B **grows** it; no second catalog.
- Bundles, archives and slices move content between repositories. Nothing here moves content.

**Layer test:**
- *Which layer owns this?* The **Address** is MEANING plane, instances: it names a thing. The **registry** is OPERATION plane, adapters: it is deployment knowledge of where things are. The compass's source-of-truth map has no row for either; the fold adds both.
- *Consume or clone downward?* Consumes. The Address reuses existing ids; resolution reads through the existing per-repository services.
- *Does the layer below stand alone without this?* Yes. A repository is complete and valid with no registry and no knowledge of any other repository ([R2], [R11]).

**Consequence map (complex mode).**

| Option | Reference | Identity | Repository | Conformance | Portability | Verdict |
|---|---|---|---|---|---|---|
| 1. Grow the existing catalog into entries by kind (chosen, option B) | reach declared per entry | keyed by id | declared catalog | one catalog, the one that ships | no repo holds neighbours; registry travels | coherent across all five |
| 2. A new minimal registry document replacing the catalog (option A) | as 1 | as 1 | as 1 | one catalog, but the shipped form is discarded and re-added | as 1 | coherent, more churn |
| 3. A repository directory beside the catalog (option C, Revision 3) | as 1 | as 1 | as 1 | two catalogs for one goal | as 1 | fails Conformance |
| 4. Neighbours declared in each member's `manifest.json` | reach declared by the thing reached | — | each repo vouches for others | — | content depends on neighbours: layer rule 5 fails | fails Portability |
| 5. No catalog; the address carries a locator | convenient reach | locator, not id | circumstance | — | dies when a repo moves | fails Reference, Identity |

Emergence: a registry with entry kinds is where later federation pieces attach (package distribution and binding, referral to another registry, declared mirrors, published repositories) without re-opening what an Address is.

---

## Abstract

Two things change. The **Address**, the stable identifier for anything that can be referred to, moves from the optional `ext:addressability` into the core and gains an optional `repositoryId`, so it can name a thing in another repository. `AttentionState`, the live cursor, stays in the extension unchanged. And `ext:registry`'s existing **`Registry`** catalog grows into a registry of **entries by kind**: every entry states a `kind`, an identity and a `locator`. Today's package entry is carried across as the `package` kind; this RFC adds the `repository` kind. The repository entries of a registry form a **boundary**: the repositories an Address can be resolved in. Resolution is read-through and read-only.

On acceptance, nothing stored yet carries an Address with a foreign `repositoryId`: no Relation or SourceReference shape holds an Address. What changes now is the registry document and how an implementation resolves an Address or a repository-scoped read, which is what multi-repository MCP serving (srs-rust#683) needs. Cross-repository relations, the first stored carrier, are step 2 of decision 31e9fd27.

---

## Uses

Packages and repositories are used in opposite directions (owner, 2026-10-30):

- **A package catalog faces outward.** A publisher lists static, versioned packages; other groups subscribe and take updates. Subscription is binding (RFC-047), not the registry.
- **A repository registry faces inward.** At first it is the operator's own list of repositories, loaded by one MCP server so all of them are reachable through one interface. It carries entries only.
- **Later, a published repository** appears in someone else's registry with an HTTP or MCP locator, and is read live, not installed.

One mechanism serves all three because each needs the same thing: an identity resolves to a place, through an entry someone vouches for. What differs is per kind (versions, checksums, install versus live read) or per document (publication metadata, optional).

---

## Motivation

### Problem 1 — a repository id is used as an address, but nothing declares which repositories exist

The MCP surface already names repositories by id (`srs://<repositoryId>/…`), but no standard says which repositories an id can refer to. Each process answers from its own startup arguments, so two tools that agree on a record's id can disagree on whether the repository holding it exists. Cell: Repository.

### Problem 2 — the Address cannot name another repository, and lives in the wrong layer

The owner's need (SP-86, SP-87): research in one repository, essays in another, and an essay saying "this links to that record in that repo". The main form of that link is a relation (step 2), whose endpoint will be an Address. Today's Address has no repository component and is defined inside `ext:addressability`, an optional extension scoped to live facilitation. A core relation cannot rest on an optional extension. Cell: Reference.

### Problem 3 — the same `instanceId` can already exist in two repositories

A slice (RFC-026), such as an essay split off into its own repository to work on, gets a new `repositoryId` and keeps its records' `instanceId`s. After a split, `{recordId}` alone does not say which copy is meant; `{repositoryId, recordId}` names a record's home. Cell: Identity.

### Problem 4 — packages need the same thing, and must not get a second mechanism

Package dependencies are keyed by `packageId` (RFC-044); `ext:registry`'s catalog says where a package is fetched from. If repositories got their own directory, the shared rules (identity-keyed, labels never resolve, duplicates fatal) would be specified twice. Cell: Conformance.

---

## Proposed Changes

### Change A — the Address in the core, with a `repositoryId`

**The Address moves to the core,** into the Foundation group. It is the union the spec already defines, keyed by `space`:

- `document`: `containerId`, `recordId`, `fieldId`;
- `process`: `runId`, optional `stageId`; given content by `ext:protocol`, unchanged;
- `conversation`: `sessionId`, optional `chunkId`, optional `annotationId`; given content by the conversation layer, unchanged.

The core owns the union and its `document` space. The `process` and `conversation` spaces keep their meaning and are given content by `ext:protocol` and by the conversation layer. An implementation that supports neither still holds and preserves such Addresses ([R11]).

The three spaces are the whole union; an Address with any other `space` value is not an Address.

**Every Address may carry `repositoryId`:** the `manifest.repositoryId` (a UUID, written in lower-case canonical text) of the repository holding the thing addressed. It is a KEYED reference in the charter's taxonomy (`rfc-decision-c8704763`): a bare key, resolved against the set of repositories the implementation declares (its **boundary**, [R8], filled by the registry under `ext:registry`). Absent means the repository that holds the Address; an Address that names the holding repository's own id means the same ([R13]). For a transient Address that no repository holds, such as a request to an implementation, absent means the repository the request is made against. Every existing Address keeps its meaning.

**In the `document` space, `containerId` becomes optional:** at least one of `containerId` and `recordId` is required, and `fieldId` requires `recordId`. Membership is declared, never derived, so a record may sit in no container or in several (RFC-034); design note 008 already calls `containerId` "a context specifier", not part of identity. An Address to a record need not pick a container.

This is mostly a loosening, with one tightening: today's union allows `{containerId, fieldId}` with no `recordId`, and [R0] forbids it, because a field has no value outside a record. No stored construct holds an Address today (no schema carries one), so no stored data migrates. The one live producer of that form is an `AttentionState` with a `fieldId` and no `recordId`, which Invariant 34 allows; such a cursor resolves to its container's Address (the `fieldId` is dropped from the resolved Address, not from the cursor).

**Address equality is not record identity.** Two Addresses name the same thing when they agree on space, on `repositoryId` (an absent one standing for the holder's) and on every identity component; in the `document` space `containerId` is context and does not take part when `recordId` is present ([R12]). `{repoA, recordX}` and `{repoB, recordX}` are different Addresses: the same record held in two repositories, as an origin and its slice. The record's identity is still its `instanceId` wherever it is held; the Address says which repository's copy is meant.

**`AttentionState` is unchanged.** It is the live cursor, a mutable record of where focus is, which resolves to a document-space Address. Its shape, its required `containerId` (Invariant 34) and its components stay as they are, and it gains no `repositoryId` in this RFC. Conversation material is tagged with the active `AttentionState` as it is produced; a stored tag names things in the repository of the session that wrote it, never in whatever repository later reads it. A cursor over several repositories is left to the conversation work that needs it. (Invariant 34 names the process component `protocolRunId` while the Address union names it `runId`; that pre-existing mismatch is noted, not changed here.)

**No string form is specified.** `srs://<repositoryId>/<path>` stays implementation tooling (srs-rust ADR-037 §6). A rule on the string can be added later at little cost, because today's strings already put the repository id first; removing one would break emitters.

Consequences. What becomes possible now: an implementation resolves an Address, or any read scoped by repository id, against a declared set of repositories; a later core construct can be defined to carry an Address with `repositoryId`, and the next RFC does so for relations. What becomes forbidden: a `document` Address with `fieldId` and no `recordId` ([R0]), and a `space` outside the three. What becomes required of every implementation (Core): resolution confined to its boundary, with `not-in-boundary` outside it ([R8]); Address equality as [R12] states it; the meaning of an absent or self `repositoryId` ([R13]); preserving Addresses it cannot resolve ([R11]). What it costs later: the stored form of a cross-repository link is decided by the next RFC; the string form waits for srs#218.

### Change B — the registry: the existing catalog, grown to entries by kind

`ext:registry` already defines a **`Registry`** (fields `schemaVersion`, `registryId`, `registryName`, `catalogVersion`, `updatedAt`, `homepage`, `entries`) and a **`RegistryEntry`** for a definition package; srs-rust ships both as `srs registry list` and `srs registry get`. This RFC grows that catalog. It does not add a second one.

**The document.** `entries` is required. Every other document field becomes optional, and nothing resolves by any of them: a published catalog fills in its name, version and update time; an operator's own list of repositories carries entries only. A document carries `registryRevision`, its own generation counter ([R9]).

**Every entry has:**
- **`kind`** (required): what the entry catalogs.
- an **identity**, defined by the kind: the fields that name what the entry catalogs.
- **`locator`** (required): how to reach it, in the charter's one LOCATOR shape (`rfc-decision-c8704763`), as `ThemeReference` already uses it (`packageRef` has not yet reached the full shape): `{mode: "local", path}` for a filesystem path, `{mode: "remote", url}` for anything reached over a network (an HTTP URL, a git remote, an MCP endpoint, told apart by the URL's scheme). The third mode, `bundled`, names something carried inside the same artifact; a registry carries no artifacts, so a registry entry does not use it. A relative `path` resolves against the directory holding the registry document. Which URL schemes an implementation can reach is its own; the entry still loads, and resolving through it gives `locator-unusable` ([R5]). As the taxonomy says, a locator says where to fetch, never what it means: identity is verified from what is fetched ([R6] for repositories; the check for a fetched package is RFC-047's).
- **`label`** (optional): display only, never used to resolve anything.

**The `package` kind** is today's `RegistryEntry`, carried across with two changes, both a rename under `rfc-decision-628cf6c4`: `kind: "package"` is stated, and the optional `downloadUrl` becomes the required `locator` (`{mode: "remote", url: <the old downloadUrl>}`), because an entry that cannot say where its package is cannot be resolved. Its identity is `packageId` and `packageVersion`. Every other field is unchanged. A catalog written before this RFC is brought forward on read by a deterministic migration ([R9]); an old entry with no `downloadUrl` has no locator and fails as `entry-malformed`. RFC-047 develops the kind (discovery metadata, integrity checking, binding).

**The `repository` kind** is new. Its identity is **`id`**, the repository's `manifest.repositoryId` (required in every conforming manifest, unchanged on copy or export). Its locator leads to a repository. The repository entries of a registry fill the implementation's **boundary**. Because a clone keeps its source's id, at most one copy of a repository can be in a boundary: listing a worktree and its main checkout gives two entries with one identity, and **both** fail ([R4]), so neither is reachable. Splitting work off into its own repository is a slice (RFC-026), which mints a new id, so it is not a copy in this sense. A directory whose manifest lacks `repositoryId` is not a conforming repository and cannot be an entry.

**Where it lives and who vouches for it.** The registry lives outside everything it lists. Its **operator**, whoever runs the implementation that loads it, vouches for its entries; nothing else is claimed about ownership. Credentials and other settings an operator must keep private are not part of the registry; an implementation keeps them in its own configuration, keyed by entry identity.

**One registry per resolution context.** Several catalogs may coexist and a consumer may index several for discovery, as `ext:registry` says today. For resolving an Address or a repository-scoped read, an implementation uses exactly one registry. Combining registries is referral, left open.

**Failure is per entry.** An entry of a kind the implementation does not support, an entry missing its kind's required fields, and two entries of a supported kind with the same identity each fail only the entries involved, when the registry is loaded ([R15]). A registry carrying package and repository entries therefore loads in an implementation that knows only one of the kinds. Only the document as a whole can refuse the whole load: a document that is not a JSON object with an `entries` array, stamped above the reader's supported `registryRevision`, or stamped below it with no transformer for a step ([R9], [R15]).

**The default repository.** An implementation serving more than one repository names one of them as its default, for requests that carry no `repositoryId` ([R13]). The default must be a `repository` entry that loaded; an implementation whose default has no usable entry reports it and serves no requests that rely on the default. It states its default where it describes itself to clients (for an MCP server, its `initialize` instructions and its `map` resource).

**Discovery is not resolution.** Looking entries up by a label or a display name (`packageName`, `label`) is discovery: it MAY be offered, and it returns every matching entry, each identified by its identity. Resolving anything goes by identity only ([R3]).

`ext:registry` is a capability an implementation declares in its conformance claim (`SRS Core + ext:registry …`), never a repository's `declaredExtensions`.

Consequences. What becomes possible: one document tells an implementation every repository it may resolve into and every package it may fetch, and the same shape serves a published catalog and a private list. What becomes forbidden: a repository declaring its own boundary or neighbours ([R2]); a catalog entry without `kind`; a `package` entry without a locator; resolving by name.

What breaks, all in srs-rust, its mirrors and one srs documentation page (no registry document exists in any of the ecosystem's repositories):
1. `Registry` and `RegistryEntry` (`srs-core/src/extensions/registry.rs`): `schemaVersion`, `registryId`, `registryName`, `catalogVersion` and `updatedAt` change from required to optional; entries gain `kind` and `locator`; `downloadUrl` goes; repository entries are added.
2. Parsing (`registry_service.rs`): today one bad entry fails the whole file; it must fail only that entry, keep entries it does not understand, and migrate a pre-RFC catalog on read.
3. `srs registry get` looks up by `package_name` and returns the first match; under this RFC that is discovery and returns every match. The `registry-get` and `registry-list` payload schemas (mirrored in srs-vscode) change with 1–3.
4. The MCP URI parser (`srs-mcp-core/src/uri.rs`) rejects a foreign repository id today with a URI error, comparing ids case-sensitively; it reports `not-in-boundary` instead, and compares without regard to case.
5. The WASM bindings `parse_registry` and `list_registry_entries` (`srs-bindings/src/lib.rs`) return the new shapes.
6. Documentation describing the old shape: `srs-usage.md` (srs repository) and `docs/dogfooding.md` (srs-rust).
7. srs-rust's `DocumentAddress` (`srs-core/src/types/address.rs`) requires `container_id`, has no `repository_id`, does not check that `fieldId` needs `recordId`, and still carries `revision_id` from the removed revisions (`rfc-decision-2a1e1590`); it follows [R0].

### Change C — resolution is read-through and read-only

Resolving an Address with a `repositoryId`, or any read an implementation scopes by repository id (the record, container, type, map, tree and other resources an MCP server serves), reads from the target repository through the existing per-repository services. The result equals the same request made against the target directly ([R10]). Resolution writes nothing and makes nothing part of the resolving repository. An implementation may cache only where every result still satisfies [R10].

**What resolving returns.**
- A `document` Address with only `containerId` resolves to that container.
- With `recordId`, it resolves to that record. If `containerId` is also given and the record is not a member of that container, the result is `target-not-found`: the context names a place the record is not.
- With `fieldId`, it resolves to that field of the record. A field the record's Type does not assign is `target-not-found`; a field the Type assigns but the record leaves unset resolves, with no value.
- `process` and `conversation` Addresses resolve through the target's own support for those spaces, or give `space-unsupported`.

The resolution outcomes and their codes are [R5]; the per-entry outcomes of loading a registry are [R15]. Every resolution failure is a result of that resolution, reported as a structured error code (srs-rust ADR-053 surface), and none makes the construct holding the Address invalid ([R11]).

This scopes resolution, not the future. A later RFC may let a repository declare that it holds **mirrors** of records from another repository: an essay split off from a research repository may see itself as a mirror of the records it took. That is a separate, declared act, not resolution. A mirror naming its origin is provenance, like a slice's recorded origin, so [R2] does not forbid it.

A relation's endpoints remain instances in its own repository until the next RFC.

**Writes are not resolution.** Nothing in this RFC writes across repositories: no write spans two repositories, and resolution never writes ([R7]). Whether an implementation serving several repositories may accept a write addressed by `repositoryId` to a repository other than its default — an ordinary write to that one repository, through that repository's own services and rules — is the one question this revision leaves to the owner (*Open Questions*).

### Change D — conflicts are fatal to the entries, mismatches are errors

Two entries of a supported kind with the same identity both fail. Neither wins: identity conflicts are fatal and never resolved by precedence (the compass's column principle for Earth, `rfc-decision-cce3c00e`). The rest of the registry still loads, which is the per-entry stance the owner ruled for unreachable entries (*Other rulings*), applied to conflicts. If the repository a `repository` entry locates reports a different id from the entry's, resolution through that entry fails (`id-mismatch`): the entry is office, the repository's report is testimony, and a disagreement is surfaced, never reconciled.

### Change E — the registry travels

The registry's held form and its travelling form are the same deterministic JSON document ([R9]), so a registry can be moved, reviewed or pinned in version control. Locators are carried verbatim; nothing promises a locator is reachable from another machine.

---

## Conformance Rules

Each rule names its conformance class: **Core** (Foundation group), **`ext:repository`**, or **`ext:registry`**. The boundary, the resolution outcomes and the rule against taking locators from content are Core; `ext:registry` is how an implementation fills its boundary from a registry document. UUIDs (`repositoryId`, `id`, `packageId`) are compared without regard to case everywhere ([R4], [R6], [R8], [R12], [R13]).

> **[R0]** *(Core)* The `Address` is a core construct: a union of exactly three spaces, `document`, `process` and `conversation`. Every Address MAY carry one optional `repositoryId`, a repository's `manifest.repositoryId` written as a lower-case canonical UUID. A `document`-space Address MUST carry at least one of `containerId` and `recordId`, and MUST NOT carry `fieldId` without `recordId`.
>
> **[R2]** *(`ext:repository`)* A repository does not declare which boundary it belongs to or who its neighbours are. No property that the specification or an extension defines on a manifest or a container may carry a locator to another repository. Naming another repository by id (an Address, a binding's source, a slice's recorded origin) is a reference, not a declaration; content in `meta` and field values that mention or link to another repository are inert, because no implementation takes a locator from repository content ([R8]).
>
> **[R3]** *(`ext:registry`)* Every registry entry MUST carry a `kind`, a `locator` in the LOCATOR shape with mode `local` (`{mode: local, path}`) or `remote` (`{mode: remote, url}`); a registry carries no artifacts, so `bundled` is not valid in it; and the fields its kind requires ([R14]). An entry's `label`, and any other display field, MUST NOT be used to resolve anything; lookup by them is discovery and returns every matching entry.
>
> **[R4]** *(`ext:registry`)* The identity of a `package` entry is `packageId` and `packageVersion`; of a `repository` entry, `id`. Two entries of a kind the implementation supports with the same identity both fail ([R15]); neither is used. An entry that carries its identity takes part in such a conflict even if it is otherwise malformed.
>
> **[R5]** *(Core)* Resolving an Address, or any read an implementation scopes by repository id, has one of these outcomes besides success, each a result of that one resolution:
> - `not-in-boundary`: the repository id is not in the implementation's boundary ([R8]), including an id whose registry entries failed at load ([R15]);
> - `locator-unusable` (only with `ext:registry`): the entry's locator mode or URL scheme is not one the implementation can reach, or it does not lead to a repository;
> - `id-mismatch` (only with `ext:registry`): see [R6];
> - `revision-unsupported`: the target repository's `dataModelRevision` is above what the implementation supports, or below it and not migrated;
> - `target-not-found`: the repository resolves but the container, record or field addressed is not in it, or the record is not a member of the given container (Change C);
> - `space-unsupported`: the Address's space is not supported by the target or the resolving implementation.
>
> **[R6]** *(`ext:registry`)* If the repository reached through a `repository` entry reports a different id from the entry's, the implementation MUST fail resolution through that entry with `id-mismatch` and MUST NOT use either id as an override.
>
> **[R7]** *(`ext:registry`)* Resolution MUST NOT write to or alter the target repository, and MUST NOT make the target's content part of the resolving repository. (This governs resolution only; declared mirroring is left to a later RFC.)
>
> **[R8]** *(Core)* Every implementation resolves an Address with a `repositoryId`, and every read it scopes by repository id, only within its **boundary**, and reports `not-in-boundary` for any other repository id, except the id of the repository that holds the Address or that the request is made against ([R13]). An implementation without `ext:registry`, or with it but using no registry for resolution, has a boundary of exactly one repository, the one it serves. An implementation using a registry for resolution has as its boundary the `repository` entries that loaded from the one registry it uses for resolution, and resolves only through them. No implementation takes a locator for resolution from any repository's content.
>
> **[R9]** *(`ext:registry`)* The registry's held form and its travelling form are one JSON document, written by RFC-003 [C5]'s rules: UTF-8 without a byte-order mark, every object's members in ascending order of member name by Unicode code point at every depth, no duplicate names, array order kept except `entries`. `entries` MUST be ordered by `kind`; within a kind the writer supports, by the kind's identity fields in the order [R4] lists them, an absent field first; and every remaining tie and every entry of a kind the writer does not support by the entry's own [C5] serialization. All comparisons are of the text as written, by Unicode code point. The same build of a writer MUST write byte-identical files for identical content. A writer MUST stamp `registryRevision`, an integer that counts registry shapes only, with the revision of the shape it writes; this RFC's shape is `registryRevision` 1. A writer that rewrites a registry MUST keep entries, entry fields and top-level properties it does not understand, unchanged. A reader MUST read an absent stamp as revision 0, MUST refuse, loading nothing, a registry stamped above its supported revision, and MUST bring a registry stamped below it forward through a registry-form transformer for each intervening step, refusing it when a step has none. The step from 0 to 1 has this transformer: on every entry without `kind`, add `kind: "package"`, and replace `downloadUrl` by `locator: {mode: "remote", url: <downloadUrl>}` (an entry without `downloadUrl` gets no locator and fails as `entry-malformed`). How a registry is supplied (flag, file, environment) is the implementation's.
>
> **[R10]** *(`ext:registry`)* A read resolved through a `repository` entry MUST return the same result as the same request made directly against the target repository.
>
> **[R11]** *(Core)* An Address whose `repositoryId` is outside the boundary, whose resolution fails, or whose space the implementation does not support is still a valid Address. Failure to resolve it is a resolution result and MUST NOT make the record, relation or other construct that holds it invalid, and an implementation that rewrites a construct holding an Address MUST write the Address unchanged.
>
> **[R12]** *(Core)* Two Addresses are equal when they have the same space, the same `repositoryId` (an absent one standing for the repository that holds the Address, [R13]) and the same identity components; in the `document` space, when `recordId` is present, `containerId` is context and does not take part. A context is still checked when the Address is resolved, so of two equal Addresses the one whose container does not hold the record resolves to `target-not-found` ([R5]): equality says what is named, resolution says whether the context given is right. Address equality says which repository's copy is meant; it does not define record identity, which is the `instanceId` wherever a record is held.
>
> **[R13]** *(Core)* An Address without `repositoryId` names a thing in the repository that holds it, and an Address whose `repositoryId` is the holder's own id names the same thing; it resolves as if the id were absent, whether or not that repository is a registry entry. A transient Address that no repository holds (a request to an implementation) names a thing in the repository the request is made against; an implementation serving more than one repository MUST name one default repository, a `repository` entry of its registry, for requests that carry no `repositoryId`, and MUST state it where it describes itself to clients; if the default's entry did not load, it MUST report that and refuse the requests that rely on the default. A conversation-layer tag names things in the repository of the session that wrote it.
>
> **[R14]** *(`ext:registry`)* The kinds this RFC defines require these fields beyond `kind` and `locator`:
> - `package`: `packageId` (UUID), `packageName`, `packageVersion`, `publisher`, `publishedAt`, `fieldCount`, `typeCount`; it MAY carry `label`, `description`, `homepage`, `tags`, `viewCount`, `schemaCount`, `protocolCount`, `relationTypeCount` and `checksum`. `downloadUrl` is not a field of the kind; [R9]'s migration replaces it.
> - `repository`: `id` (UUID); it MAY carry `label`.
>
> Other fields on an entry are kept on rewrite ([R9]) and never used.
>
> **[R15]** *(`ext:registry`)* Loading a registry reports, per entry and affecting only the entries named: `entry-malformed` (an entry missing `kind`, a valid `locator` or a field [R14] requires, or with a `bundled` locator), `duplicate-identity` (every entry in a [R4] conflict) and `kind-unsupported` (an entry whose kind the implementation does not support, which it keeps but does not use). It refuses the whole document, loading nothing, only when the document is not a JSON object with an `entries` array (`registry-malformed`), or its `registryRevision` is above the supported revision or below it with no transformer for a step (`registry-revision-unsupported`, [R9]).

([R1] of Revisions 2–3, a rule on `srs://` strings, is withdrawn; the number is not reused.)

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `registry.json` (new, proposed) | The `Registry` document, defined below | None in any repository: no registry document exists in the ecosystem's repositories. A catalog written to today's example shape is brought forward on read by [R9]'s transformer |
| `manifest.json` | none | None |

Shape of `registry.json`: a top-level object with required `entries` (array, may be empty) and optional `$schema`, `registryRevision` (integer), `schemaVersion`, `registryId`, `registryName`, `catalogVersion`, `updatedAt` and `homepage`, typed as today's example shape. Other top-level properties are allowed and kept on rewrite ([R9]), so a document field added by a later kind or revision does not fail older validators. Each item of `entries` must be an object; the schema constrains entries no further. The entry rules ([R3], [R4], [R14]) are rules, not schema constraints, so that a malformed entry fails only itself ([R15]) and an entry of a kind defined later still validates. Uniqueness is likewise a rule, because JSON Schema cannot express it across array items without keywords the other schemas do not use. Nothing gates on `schemaVersion`; the generation is `registryRevision` alone ([R9]).

**Generation stamp.** The registry carries its own counter, `registryRevision`, not the corpus's `dataModelRevision`. This RFC's shape is `registryRevision` 1; a catalog written before it has no stamp and reads as 0, brought forward by [R9]'s transformer. The counter moves only when the registry's shape changes, so a revision of the repository data model never touches a registry, and no repository's `dataModelRevision` changes because of this RFC: the Address is in no stored shape and the registry is not part of any repository. A separate counter is not a second mechanism for one goal: `dataModelRevision` versions what a repository holds (and what is exported from one, RFC-003 [C6]); a registry holds nothing from any repository. Like every stamp, it means an older reader refuses a registry written to a newer shape.

No schema file carries the `Address`; its move to the core and its new component change records and prose only.

`registry.json` is a new hand-authored schema outside the metamodel emitter's closure: acceptance adds its generation-ledger entry and schema-README listing, `check-ledger-completeness` must pass, and `metamodel-fidelity.md` says it is outside the closure. It is mirrored into `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` by the release-asset sync after acceptance.

Level test (`rfc-decision-c20fcff8`): the kind, identity, uniqueness, ordering, stamp and shape rules are checkable by any implementation. `locator-unusable` is the one outcome that depends on the holding implementation's own reach. [R2] is checkable on the properties the specification and extensions define on manifests and containers: none may carry a locator to another repository (today neither schema has such a property; a checker re-checks every new one). `meta` is free-form and not checked, which [R8] makes harmless: no implementation takes a locator from repository content.

---

## Decisions

Each ruling of 2026-10-30, with its reason and the signals that would show it wrong, each with the place it is checked. On acceptance D1–D5 each become an `rfc-decision` record, these triggers its `review_trigger`. The *Other rulings* are not separate records: they are scope settings folded into D2 and the rules, with no alternative left that a later reader would need explained.

### D1 — The Address is core; `AttentionState` stays a cursor

**Statement.** The Address moves to the core (Foundation group) with an optional `repositoryId`; `AttentionState` stays in `ext:addressability` unchanged.
**Why.** Addressability and federation are foundational (owner). Cross-repository links are relations, and a core relation cannot rest on an optional extension. The cursor holds a pointer to an Address; it is not the Address (owner), as the concept record already says.
**Costs accepted.** 14 records change for the move (Integration table, rows 1–14); `ext:addressability` narrows to the cursor; one tightening ([R0], `fieldId` needs `recordId`) with no stored data affected.
**Review triggers.**
1. Step 2's relation needs an Address the union cannot express, such as a definition (Type, Field) in another repository, which no space covers. *Checked at:* the cross-repository relations RFC.
2. A core construct needs a cursor, not an Address, to cross repositories. *Checked at:* the cross-repository relations RFC and any conversation-layer RFC.
3. The cursor turns out unusable without parts of the Address it no longer gets from its extension. *Checked at:* srs-rust's `attention_service.rs`, the one implementation of `AttentionState`, when it is next changed.

### D2 — One registry, grown from the existing `ext:registry` catalog (option B)

**Statement.** There is one registry mechanism. Its document is the `Registry` that `ext:registry` already defines and srs-rust ships. Every entry states `kind` and carries a `locator` in the charter's LOCATOR shape; catalog fields are optional and resolve nothing. Today's entry becomes the `package` kind, its `downloadUrl` renamed `locator` by migration; this RFC adds the `repository` kind. Subscription to updates is binding (RFC-047), never part of the registry.
**Why.** Packages face outward and repositories inward (*Uses*), but both need an identity to resolve to a place through an entry someone vouches for, so the rules are written once. What differs is per kind or per document. Growing the shipped catalog keeps what exists (against option A, which discards and re-adds it) and avoids two catalogs for one goal (against option C). `kind` is required, not defaulted, so no permanent "absent means package" rule is locked in; the one-time migration ([R9]) carries old catalogs forward instead.
**Costs accepted.** The seven changes listed under Change B: six in srs-rust and its mirrors (registry types, per-entry parsing, `registry get` as discovery, the URI parser's code and case, the WASM registry bindings, `DocumentAddress`) and one srs documentation page (`srs-usage.md`), with payload schemas mirrored in srs-vscode; `registryId` stays as inert optional metadata; one document shape serves a public catalog and a private list.
**Review triggers.**
1. **The shared rules bend per kind.** The `package` kind (RFC-047) or a later kind needs an exception to more than one shared rule: identity unique within a kind, per-entry failure, label never resolves, LOCATOR shape, one deterministic form. Then split into separate catalogs that share an entry convention. *Checked at:* RFC-047's review.
2. **Private settings need a place in the document.** The operator's repository list needs content that must never be published (credentials, tokens, per-machine options). Then public catalogs and private lists get separate document roles that keep the entry core. *Checked at:* srs-rust#683's implementation and the first `remote` repository entry.
3. **Subscription leaks in.** Binding needs subscription state (last-seen version, update policy) stored in registry entries. Then "the registry says where, binding says whether to follow" is wrong. *Checked at:* RFC-047's review.
4. **Catalogs we must read omit `kind`.** Registries outside our control that we must consume carry entries without `kind` at `registryRevision` 1 or above. Then requiring `kind` was wrong and a default is needed. *Checked at:* the first external catalog consumed.
5. **A document-level field is needed per kind.** A published repository catalog needs document metadata a package catalog cannot carry, or the reverse. *Checked at:* the first published repository, which is also the trigger to reopen srs#218.
6. **Generality nobody uses (soft).** A year after acceptance, no registry holds more than one kind and no tool reads more than one: stop extending the generic core, do not undo it. *Checked at:* a review scheduled in the srs-programme roadmap when this RFC is accepted.

### D3 — `srs://` stays tooling

**Statement.** The spec defines no string form for an Address; `srs://` remains srs-rust tooling (ADR-037 §6); srs#218 stays parked.
**Why.** The main form of a cross-repository link is a relation (owner), so the stored form is Address components. The resource paths change often (ADR-037 carries 18 amendments since July 2026, several adding resource paths: `type/`, `tree`, `agent-index`, `context/`). A string rule can be added later at little cost; removing one breaks emitters.
**Costs accepted.** No standard string to paste into prose; agents may still guess malformed strings (finding bbe9faf9, `srs://default/…`), which [R8] answers with `not-in-boundary`.
**Review triggers.**
1. A repository is published and its elements need public URLs. *Checked at:* the first published repository.
2. Links start being stored as strings inside field content across repositories. *Checked at:* the cross-repository relations RFC, which must say why a relation does not cover such a link.
3. Two implementations need to exchange `srs://` strings and disagree on them. *Checked at:* the first second implementation of the MCP surface (srs-web's browser MCP shares srs-mcp-core today, so it does not count).

### D4 — At most one copy of a repository per boundary

**Statement.** A clone keeps its source's `repositoryId`, so only one of them can be a boundary member; no re-id rule is added.
**Why.** Splitting work off is a slice, which already mints a new id and records its origin. Two repositories sharing an id are clones or worktrees: the same repository at another version, which a re-id rule would mis-model as a different repository.
**Costs accepted.** Listing a worktree and its main checkout in one registry makes both entries fail ([R4]), so neither is reachable; if one is the default, the implementation reports that its default has no usable entry. Each needs its own registry or process.
**Review triggers.**
1. The owner or an agent regularly needs a worktree and its main checkout in one session. *Checked at:* srs-rust#683's first use with worktrees (`scripts/wt`), and any friction finding filed against it.
2. Forks that diverge but are not slices need to coexist with their source in one boundary. *Checked at:* the first such fork.

### D5 — A repository declares no boundary and no neighbours ([R2])

**Statement.** In the owner's words: a repository does not declare which boundary it belongs to or who its neighbours are.
**Why.** A repository that lists its neighbours stops being complete on its own, and every repository would carry facts that belong to whoever assembled the boundary. The rule's two halves keep references open: naming another repository by id (an Address, a binding, a slice origin) is allowed; only declaring membership, and taking locators from content, is not. Revision 3's "MUST NOT name another repository's id" would have forbidden step 2's relations, and a version forbidding any locator in content would have invalidated `rfc-decision-1e5df0d9`, which links into muSrs.
**Costs accepted.** A repository cannot say "my research lives over there"; the operator's registry says it.
**Review triggers.**
1. Declared mirrors (Change C) need more than an origin, such as a standing subscription to the origin with a locator, which would be a declaration of a neighbour. *Checked at:* the mirrors RFC.
2. RFC-047's bindings need a locator inside the manifest, not just a source id. *Checked at:* RFC-047's review.
3. Repositories published for others need to advertise related repositories. *Checked at:* the first published repository.

### Other rulings

| Question | Ruling | Why |
|---|---|---|
| Acceptance gate: is this the scheduling act for federation's return? | Answered by programme decision 31e9fd27 (ratified 2026-10-16) | The owner named the need (SP-86, SP-87) and scheduled it |
| Does a boundary need its own id? | **No, until required** | Adding an optional id later is additive; nothing refers to a boundary yet |
| Empty registry, unreachable entries | **Per-entry failure** | One missing repository must not take down the rest |
| Naming against RFC-047 | **Registry**, the one `ext:registry` catalog (D2); "boundary" names the repositories it lists | One catalog removes the two-registries problem instead of naming around it |

## Relationship to other RFCs

- **RFC-003** fixes the canonical JSON writing rules ([C5]) and the reader stamp pattern ([C6]) that [R9] reuses.
- **RFC-026** gives a slice a new `repositoryId` and an `origin.repositoryId`, keeps `instanceId`s, and records the relations it cut in `slice.externalRelationRefs`. This RFC relies on the first two (Problem 3, D4); the cut relations are the natural seed for step 2.
- **RFC-033** sets the absent-stamp convention (absent ⇒ 0) that [R9] follows for registries.
- **RFC-038** reserved `sourceRepositoryId`/`targetRepositoryId` on relations and a federation registry; `rfc-decision-4f1e12e5` removed them. They stay removed.
- **RFC-044** keys package dependencies by `packageId`; the `package` kind is where a `packageId` and version find a locator.
- **RFC-045** describes a readme beside `srs://<repositoryId>/map`; unaffected.
- **RFC-047** (Draft) develops the `package` kind (discovery metadata, checksum semantics, binding) on this core. Its manifest `bindings[]` may name a source repository by `sourceRepositoryId`: that is a reference by id, allowed by [R2], and is located through the consumer's boundary, never by a locator in the binding. Its `childRegistries` is referral, left open here. Its `RepositoryRegistry` is dropped. The rebase is a follow-up on srs#871.

## What this forecloses

- A repository declaring its boundary or neighbours, or an implementation taking a locator from repository content ([R2]).
- A second catalog beside the `ext:registry` registry, for repositories or packages.
- A second locator form: registry locators use the LOCATOR shape.
- An Address that carries a locator: the Address names, the registry locates.
- Resolution that writes, copies or merges ([R7]).
- A registry entry without `kind`, a `package` entry without a locator, resolving by name.
- A `document` Address with `fieldId` and no `recordId`.
- Serving a git worktree and its main checkout from one registry (D4).

## What this leaves open

- **Cross-repository relations**, step 2 of decision 31e9fd27.
- **Package distribution and binding**, RFC-047.
- **Mirrors and caches**, a repository declaring that it holds copies of another repository's records (Change C).
- **Published repositories and their public URLs**: the trigger to reopen srs#218 (D3).
- **Referral**, an entry whose locator names another registry (RFC-047's `childRegistries`); [R6] would be relaxed for it, and `not-in-boundary` is where "ask the next registry" attaches.
- **A cursor across repositories**, `repositoryId` on `AttentionState`.
- **A boundary id** and **a re-id rule for copies**, when something needs them.

## Integration on acceptance (Door 2)

22 existing records change, in 21 rows (row 21 is a mechanism and its example), and 7 are checked and left unchanged:

| # | Record | Disposition |
|---|---|---|
| 1 | `mechanism-ffb63d1d` (`Address`) | Moved to the core, Foundation group; gains `repositoryId`, optional `containerId`, `fieldId` requires `recordId`; "stable, resolvable" becomes "stable" ([R11]) |
| 2 | `example-7fc60d9a` (the `Address` union) | Updated to the new shape |
| 3 | `extension-4b7178eb` (`ext:addressability`) | `extension_adds` and `extension_cost_of_non_adoption` narrowed to the live cursor; the Address cited as core |
| 4 | `mechanism-63564240` (`ext:addressability`) | "Defines a universal addressing scheme" becomes "the live cursor over the core Address" |
| 5 | `concept-94c41365` (Addressability) | Description split: the stable Address is core, the cursor is the extension |
| 6 | `mechanism-caaefa31` (`AttentionState`) | Cites the core Address; shape unchanged; states the resolution of a cursor with `fieldId` and no `recordId` (Change A) |
| 7 | `mechanism-6f93d128` (Context Query) | "given an address" cites the core Address; stays an `ext:addressability` requirement |
| 8 | `mechanism-e2ab4ff5` (extension conformance model) | Notes the Address in the Foundation group and `ext:registry` as an implementation claim |
| 9 | `concept-580cfe0e` (Extensions) | No longer says Addressability is documented in full in the extensions Part; points to the core Address |
| 10 | `concept-159ae3c2` (Extensions) | As row 9 |
| 11 | `concept-c34c0dd8` (Conversation Layer) | States that a stored tag names the session's repository ([R13]) |
| 12 | `design-notes/008` (why Address and AttentionState) | Note added: a record's Address no longer requires a container; Addresses that differ only in their container are equal under [R12], and the container is context checked when the Address is resolved, replacing "one Address per Container context" |
| 13 | `design-notes/025` (addressability and live facilitation) | Note added: the extension is the cursor; the Address is core |
| 14 | `mechanism-99976f0e` (self-contained profile) | States that a foreign Address needs no registry and stays valid ([R11]) |
| 15 | `mechanism-7c556f28` (`ext:repository` conformance) | Gains [R2] |
| 16 | `tables/t004-which-extensions-to-implement` | "Publish a definition catalog → `ext:registry`" becomes "Catalog packages or serve several repositories → `ext:registry`" |
| 17 | `extension-a6c209c1` (`ext:registry`) | `extension_adds` widened to entries by kind; `extension_cost_of_non_adoption` widened (without it an implementation catalogs no packages and serves exactly one repository); "no opinion on registry authority" replaced by the operator-as-office rule for resolution; several catalogs still allowed for discovery |
| 18 | `concept-d755fb20` (Registry) | As row 17 |
| 19 | `mechanism-cd486126` (`Registry`) | Document fields optional; one registry per resolution context; the sentence "does not define registry authority, authentication, or federation" replaced |
| 20 | `example-2d432ba0` (the `Registry` shape) | Updated |
| 21 | `mechanism-0b3e1575` and `example-137b1d3b` (`RegistryEntry` and its shape) | Become the shared entry and the `package` kind shape (counted as one row: the mechanism and its example) |

Checked, unchanged: `invariant-034`; `example-821ada90` (the `AttentionState` shape); `mechanism-de203359` (`ext:protocol` × `ext:addressability`); `design-notes/040` (sub-field addressing); `mechanism-cac02817`, `mechanism-c6699224` and `table-e6e67001` (the consumer's registry, see *Contradictions found*).

New: a `repository` kind mechanism and its example; 15 conformance records, [R0] and [R2]–[R15] ([R1] is withdrawn); `schema:registry.json`; two compass source-of-truth rows (the Address, MEANING plane, instances; the registry, OPERATION plane, adapters); one `rfc-decision` record per decision D1–D5. This RFC is Door 2: new normative meaning, owner-merge.

Follow-ups filed on acceptance: the six srs-rust changes under Change B (one issue) and the `srs-usage.md` update (srs); srs-rust ADR-037 §6 pointer to the core Address; RFC-047 rebase (srs#871); the `protocolRunId`/`runId` naming mismatch in Invariant 34; the D2 trigger-6 review on the srs-programme roadmap.

---

## Rationale

The reasons for each choice are in *Decisions*. Three that cut across them:

**Addressing before relations or writes.** Every later federation feature needs to say which repository it means; nothing else is needed for multi-repository serving. It is the smallest slice that is both useful and forecloses little.

**The registry outside the repositories.** A repository that lists its neighbours stops being complete on its own; the registry states those facts once, where the operator keeps them.

**Resolution failure is not invalidity.** Federated knowledge must preserve references it cannot follow (the *Distributed Knowledge Ownership* note). An essay that cites a record in a repository this machine does not hold is still a correct essay.

---

## Alternatives Considered

### Alt A — A new minimal registry document replacing the catalog (option A)

Rejected (D2): it breaks the shipped `srs registry` commands and discards the published-catalog fields RFC-047 would re-add.

### Alt B — A repository directory beside the catalog (option C, Revision 3)

Rejected (D2): two catalogs for one goal.

### Alt C — Neighbours in each repository's manifest

Rejected (D5): a repository's content would depend on its neighbours, and each would vouch for others.

### Alt D — The address carries a locator

Rejected: addresses stop being stable when anything moves.

### Alt E — A canonical `srs://` serialization now

Rejected (D3).

### Alt F — Restore the removed federation entities

Rejected: `rfc-decision-5f18603e` requires the redesign to be grounded in practice; the removed design bundled addressing with events and cross-repository relations that had no usage.

---

## Open Questions

1. **Writes to a non-default repository (srs-rust#683).** This RFC specifies reads and resolution only. Should an implementation serving several repositories accept a write addressed by `repositoryId` to a boundary member other than its default, as an ordinary write to that one repository through its own services and rules? Options and consequences are in the PR's *Decisions you need to make*. Everything else is ruled (see *Decisions*).
