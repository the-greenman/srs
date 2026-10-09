> **GitHub issue**: [the-greenman/srs#913](https://github.com/the-greenman/srs/issues/913)

# RFC-049: Repository addressing — the boundary directory and `srs://` addresses

**Status**: Draft (Revision 3)
**Affects**: the Repository group (repository-id segment of `srs://` strings, boundary directory conformance); `ext:addressability` (the `Address` gains one optional `repositoryId` component), a new boundary directory shape (`docs/schema/2.0/boundary.json`, proposed), the Repository group's identity statements; conforming implementations that serve more than one repository. Builds on **RFC-038 (Accepted)** (tree-authoritative repositories), **RFC-045 (Accepted)** (self-describing artifacts) and `rfc-decision-5f18603e` (federation's return is committed). Adjacent to, and deliberately not part of, **RFC-047 (Draft)** (definition distribution).
**Author**: Owner direction on the-greenman/srs-rust#683 (2026-10-08); drafted by Claude Code for owner review
**Date**: 2026-10-08

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 3 | 2026-10-08 | Owner review comment on PR #917: `Address` gains an optional `repositoryId` component and `srs://<repositoryId>/…` is one serialization of it (Change A, [R1], Affects, One-way-per-goal, Conformance class). Referral and R6 noted in Rationale. Number clash with #916 left for the owner to resolve. |
| 2 | 2026-10-08 | Review round 1 (both reviews posted on #913). Repository id defined as `manifest.repositoryId`; Change A narrowed to the repository segment only (the path grammar stays implementation-defined); self-address and existing-MCP behaviour stated; Open Questions split into an acceptance gate and genuine questions; relationship to RFC-038/045/047, forecloses list and integration tokens added. |
| 1 | 2026-10-08 | Initial draft. Frames the repository directory first asked for as MCP multi-repo serving (srs-rust#683) as the first, addressing-only step of federation's committed return. No implementation work before acceptance. |

---

## Charter alignment

**Cell(s):** cell:repository, cell:reference, cell:identity, cell:portability, cell:attribution
**Decision mode:** complex

This is a complex decision, so a single-cell citation is not an answer (`rfc-decision-7caca3a1` names that as the premature-classification pathology). The consequence map below is the substance; the owner's rulings on the Open Questions are the output.

**Governing cell preferences.**
- **Repository: catalog over circumstance.** Aligned. Today which repositories exist in a deployment is circumstance (whatever `--repo` paths a process was started with). A directory makes it a declared catalog.
- **Reference: declared strength over convenient reach.** Aligned in intent, and the reason for Change C. A cross-repository address that silently reaches a neighbour is convenient reach; here every reach goes through a declared directory entry and is read-only.
- **Identity: identifier over label.** Aligned. Entries are keyed by the repository's stable id, never by a path or a friendly name.
- **Portability: preserve over recognize.** Aligned. `rfc-decision-8948e43f` is scoped to artifact forms; this RFC applies its standing rule (the travelling form ships with the held form) to the directory by extension. A directory entry never moves content; content still travels only in bundles, archives and slices (`rfc-decision-8948e43f`).
- **Attribution: stated over assumed.** Adjacent, not decisive. `rfc-decision-16b20c56` governs per-statement attribution; it says nothing about which boundary vouches for a repository. The directory states membership rather than leaving it to where a path sits, which is in the cell's spirit only.

**Axis preferences.**
- **4–10, Office over Testimony.** Default pole taken. A directory entry is a *declaration by whoever owns the boundary* (office); a repository's own claim about its id is testimony until it matches the entry. The clause "Testimony fills gaps, never contradicts authority, and is promoted into office only by verification" is applied in Change D: a mismatch is an error, never resolved in the repository's favour.
- **6–12, Portability over Possession.** Default pole taken. The directory is kept out of every member repository so that no repository holds its neighbours' locations (Change B). The boundary clause "a capability that exists only in place is captivity" is why the directory itself must also be exportable (Change E).
- **1–7, Semantic Integrity over Practical Expression.** Default pole taken. Practical expression (a `--repo id=path` flag) is the part that falls out last and is not specified here.

**Decisions consulted:** rfc-decision-4f1e12e5, rfc-decision-5f18603e, rfc-decision-8948e43f, rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-16b20c56, rfc-decision-c20fcff8, rfc-decision-e99a9437, rfc-decision-7caca3a1.

**Contradictions found:** None directly. Two questions are routed to the owner rather than assumed:
- `rfc-decision-4f1e12e5` removed the federation entities (registry, events, cross-repository relation fields) and `rfc-decision-5f18603e` committed their return as a roadmap phase **that the owner schedules**. This RFC treats the owner's 2026-10-08 direction on srs-rust#683 as the scheduling act for the *addressing* slice only. Whether that reading is right is Open Question 1.
- srs-rust ADR-037 §6 rules that the `srs://` scheme is implementation tooling, not spec, and anticipates at most "a tooling-only spec note" if a canonical URI syntax is wanted. Change A is a normative rule on the first segment, a larger step than the ADR anticipated, so the ADR's position is partly superseded; the ADR's "Neutral" consequences already name multi-repository serving as a follow-up. Open Question 1.

**Deciding cell:** Repository (catalog over circumstance); the other four cells constrain how the catalog is built (Change B, C, D, E) but do not select between the options.

**One-way-per-goal:** Three existing mechanisms are adjacent and none is duplicated:
- `ext:addressability` already addresses a thing *within* a repository. Change A **extends** that Address with a repository component and adds no second address type.
- Bundles, archives and slices already move *content* between repositories. Nothing here moves content.
- RFC-047's `ext:registry` catalogs *definition packages*. A boundary directory catalogs *repositories*. To avoid one word doing two jobs, this RFC says "directory", never "registry" (Open Question 5 asks whether RFC-047's term should change instead).

**Layer test:**
- *Which layer owns this?* It splits across two planes. The **address** (repository id plus the existing component address) is MEANING plane, instances: it names a thing. The **directory** (which repositories a boundary contains and where to reach them) is OPERATION plane, adapters: it is deployment knowledge. The compass's source-of-truth map has no row for "boundary" or "repository directory"; that absence is itself a finding, and accepting this RFC adds the row.
- *Consume or clone downward?* Consumes. The address reuses existing ID components; resolution is read-through to the existing per-repository services.
- *Does the layer below stand alone without this?* Yes. A repository is complete and valid with no directory and no knowledge of any boundary (Change B, [R2]).

**Consequence map (complex mode).** The options differ on where the directory lives and how far an address reaches. Plotted against the cells they touch:

| Option | Repository | Reference | Portability | Attribution | Verdict |
|---|---|---|---|---|---|
| 1. Directory in a standalone boundary document, addresses read-only (proposed) | catalog declared, not inferred | reach is declared per entry | no repo holds neighbours; directory exportable | boundary owner states membership | coherent across all five |
| 2. Directory inside each member's `manifest.json` | each repo declares its own neighbours | reach declared, but by the thing being reached | content now depends on neighbours existing: layer rule 5 fails | a repo vouches for itself and others: testimony as office | fails Portability and Attribution |
| 3. No directory; the address itself carries a locator (`srs://host/path`) | circumstance, again | convenient reach in its purest form | address dies when the repo moves | none stated | fails Repository and Reference |
| 4. Plain `--repo id=path` flags only (owner: "don't build it first") | partial: process-lifetime catalog | reaches by id, but locator is unstated config | not exportable as specified; making it so is itself an RFC-level choice of document shape | none | solves #683 but hardens the directory as unstated configuration; not federation |

Emergence: Option 1 makes "boundary" a first-class unit. That is what lets the later pieces (cross-repository relations, verification, sharing rules) have somewhere to attach without re-opening addressing. It is also the largest commitment in this RFC, which is why it is the main decision requested.

---

## Abstract

Today an SRS server serves one repository per process, and a reference such as `srs://<repositoryId>/record/<id>` names a repository by an id nothing in the standard declares. This RFC makes that id meaningful: a **boundary** is a declared set of repositories that can address each other, a **boundary directory** lists them by stable repository id, and an address qualified by a repository id resolves only to repositories in the directory. It is proposed as the addressing-only first step of federation's committed return (`rfc-decision-5f18603e`), conditional on the Acceptance gate below, and the multi-repository MCP server asked for in srs-rust#683 falls out of it as one consumer.

---

## Motivation

### Problem 1 — a repository id is used as an address, but nothing declares which repositories exist

The MCP surface already builds addresses of the form `srs://<repositoryId>/…`. The id in that address is real, but there is no standard answer to "which repositories can this id refer to?". Each process answers differently, from its own startup arguments. Two tools that agree on a record's id can disagree on whether the repository holding it exists. Cell: Repository, *catalog over circumstance*.

### Problem 2 — federation was removed, and its return is committed but has no first step

`rfc-decision-4f1e12e5` removed the federation entities after finding 34 prose records and 7 invariants specifying a capability with zero data. `rfc-decision-5f18603e` committed its return and said the redesign must be "grounded in the sharing forms that actually emerged". The form that has now emerged in practice is the one in srs-rust#683: one agent connection that needs several repositories. Addressing — naming a repository inside a boundary — is the smallest piece every later federation feature needs and none can skip.

### Problem 3 — the obvious fix would be a second address type

A `--repo id=path` flag gives the server a map from id to path. That map is exactly the directory this RFC specifies, but as unstated process configuration it cannot be exchanged, checked or reasoned about, and it would harden as a second way to say which repository an address means. Cell: Conformance, *one way over many*.

---

## Proposed Changes

### Change A — a `repositoryId` component on `Address`, and the `srs://` serialization of it

The spec's Address today (`ext:addressability`, Invariant 34) is a set of optional components — `containerId`, `recordId`, `fieldId`, `protocolRunId`, `stageId` — and defines no string form. The MCP server separately emits `srs://<repositoryId>/<path>` strings (for example `srs://<repositoryId>/record/<instanceId>`), whose paths are not the Address components. This RFC adds one optional component to the `Address`, **`repositoryId`**, defined in Change B. Absent means "this repository", so every existing Address keeps its meaning. The `srs://<repositoryId>/<path>` string is one serialization of that component, so there is a single way to say which repository is meant and the URI form is a projection of the Address, not a parallel mechanism. The path after the repository segment stays implementation-defined and is not reconciled with the other Address components here.

It standardizes, for the string form: in any `srs://` string, the first segment after `srs://` is a **repository id** (defined in Change B), and a string whose first segment is not a repository id is not a conforming `srs://` address. In ABNF: `address = "srs://" repository-id "/" path`, `repository-id = 8HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 12HEXDIG` (lower-case canonical UUID text), and `path` is implementation-defined and opaque to this RFC.

Consequences. What becomes possible: any tool can tell which repository an `srs://` string names without knowing the rest of its grammar. What becomes forbidden: a conforming tool minting an `srs://` string whose first segment is anything else (a label, a path, a host). What it costs later: the path vocabulary stays tooling's, so the question parked as srs#218 (canonical Address serialization) is **narrowed, not answered**; a later RFC owns the path (Open Question 1). Under this scope the strings RFC-045 describes (the readme "beside `srs://<repositoryId>/map`") conform without change: their first segment is already a repository id.

"This repository" is still expressed by omitting the repository segment where no `srs://` string is used (Address components as today); nothing existing changes meaning.

### Change B — the boundary and its directory

A **boundary** is a set of repositories that an owner declares can address one another. Its **directory** is a document with one entry per repository. Each entry has:

- the repository's **id** (the key; required), which is that repository's `manifest.repositoryId`, a required UUID in every conforming manifest and unchanged on copy or export (`docs/schema/2.0/manifest.json`);
- an optional human **label**, which is display only and never resolves an address;
- a **locator**, a required non-empty string saying how to reach the repository (a filesystem path, a git remote, a bundle location). It is interpretable only by the implementation that holds the directory; a locator kind the implementation does not support fails resolution of that one entry, never the whole directory. The standard does not define locator syntax.

`manifest.repositoryId` "never changes on copy or export", so a clone, fork or unpacked archive carries the same id as its source. At most one of any such copies may be a directory member ([R4]); a boundary that needs two diverged copies requires one to receive a new id, and no spec rule yet provides that (Open Question 5). A repository whose manifest has no id (a deliberately id-less test fixture, per RFC-038) cannot be a directory member and any qualified address naming it fails under [R5]. The directory lives **outside every member repository**; the party that assembles and keeps it is the **boundary owner**, whoever operates the implementation that loads it, and the directory carries no further claim of ownership. A repository's manifest, records and containers say nothing about its neighbours.

Consequences. What becomes possible: an implementation can serve any number of repositories from one directory and resolve any qualified address against it. What becomes forbidden: a repository declaring its own neighbours, which would make its content depend on theirs and fail layer rule 5 (every layer stands alone below). What it costs later: the directory is a new artifact owners must keep, and its schema (`boundary.json`) is a new schema file to mirror into `srs-rust` and `srs-vscode`.

### Change C — resolution is read-through and read-only

Resolving a qualified address reads from the target repository by the existing per-repository services. Nothing is copied, merged or cached as authoritative, and no write is addressed by this RFC. Cross-repository **relations** (the removed federation field) are not part of this RFC; a relation endpoint remains an instance in the same repository.

A conforming read through a directory entry returns the same result as the same request made against the target repository directly ([R10]). Consequences. What becomes possible: an agent can read a record in a neighbour by address. What stays forbidden: a Relation whose target lives in another repository, and any cross-repository write. That keeps Reference's *declared strength* intact: the first cross-repository relation will need its own declared strength, decided on its own RFC.

### Change D — conflicts are fatal, mismatches are errors

If two directory entries carry the same id, the directory is invalid (identity conflicts are fatal, never resolved by precedence: the compass's "Four column principles", Earth, from `rfc-decision-cce3c00e`). If an entry's id differs from the id the located repository reports for itself, resolution of that entry fails with a mismatch error and the entry's claim wins nothing: the repository's own statement is testimony, the directory is office, and a disagreement between them is surfaced rather than reconciled.

### Change E — the directory travels

The directory is exportable as a single deterministic JSON document so that a boundary can be moved (entries ordered by `id` ascending, bytewise on the lower-case UUID text; keys sorted), reviewed, or pinned in version control, satisfying the travel mandate (`rfc-decision-8948e43f`: the travelling form ships in the same RFC that introduces the held form). Locators are carried verbatim; the standard makes no promise that a locator is reachable from another machine. This is the same determinism as the `.srspkg` bundle (sorted keys), applied to a different document.

---

## Conformance Rules

> **[R0]** The `Address` MAY carry one optional `repositoryId` component, a repository id (Change B). An Address without it names a thing in the repository that holds or resolves it.
>
> **[R1]** The first segment after `srs://` in any `srs://` string an implementation emits MUST be a repository id (a lower-case canonical UUID); the grammar of the remaining path is not constrained by this RFC.
>
> **[R2]** A repository's manifest, records, containers and relations MUST NOT name any other repository's id or locator as a neighbour, member of a boundary, or resolution target. A slice's recorded origin repository id (provenance, RFC-026) is not such a naming and is unaffected.
>
> **[R3]** A directory entry MUST carry a repository id. An entry's label MUST NOT be used to resolve an address.
>
> **[R4]** A directory MUST NOT contain two entries with the same repository id; a directory that does MUST be rejected as invalid. Entries MUST be ordered by id ascending in the exported form ([R9]).
>
> **[R5]** An implementation MUST resolve a qualified address only to a repository that has an entry in the directory it was given, and MUST fail with a distinct error, diagnostic code `not-in-boundary`, for any other repository id. An entry whose locator is unsupported or does not lead to a repository fails with code `locator-unusable`, affecting only that entry.
>
> **[R6]** If the repository reached through an entry reports a different id from the entry's, the implementation MUST fail resolution of that entry with code `id-mismatch` and MUST NOT use either id as an override.
>
> **[R7]** Resolving a qualified address MUST NOT write to, copy from, or alter the target repository, and MUST NOT make the target's content part of the resolving repository's catalog.
>
> **[R8]** An implementation that serves a single repository with no directory MUST behave as if it held a directory with exactly one entry, that repository's own id; its existing `srs://<repositoryId>/…` addresses resolve exactly as before, and any other repository id fails under [R5].
>
> **[R10]** A read resolved through a directory entry MUST return the same result as the same request made directly against the target repository.
>
> **[R9]** The directory's held form and its travelling form are the same document (`boundary.json`): UTF-8 JSON with sorted keys and no insignificant whitespace variation, so that equal directories serialize to identical bytes, stamped with the repository's `dataModelRevision`. An implementation that loads a directory MUST accept this form as input; how it is supplied (flag, file, environment) is the implementation's.

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `boundary.json` (new, proposed) | The directory document, defined in prose below | None — no existing document has this shape |
| `manifest.json` | none | None |

Shape of `boundary.json`, in words: a top-level object with required `$schema`, `dataModelRevision` (integer) and `entries` (array). Each entry has required `id` (UUID string) and `locator` (non-empty string) and optional `label` (string). Entries accept no other properties; the document accepts no other top-level properties. `entries` may be empty. Uniqueness of `id` is a rule ([R4]), not a schema constraint, because JSON Schema cannot express it across array items without extension keywords the other schemas do not use.

Because `boundary.json` is a new hand-authored file in the frozen-seed set, acceptance also adds its generation-ledger entry and schema-README listing, and `check-ledger-completeness` must pass; it is outside the metamodel emitter's closure and says so in `metamodel-fidelity.md`. Records changed on acceptance: the Repository group and `ext:repository` conformance text (to cite the directory), and the compass source-of-truth map. `locator` is checkable only for non-emptiness; its meaning is the holding implementation's, so [R5]'s `locator-unusable` is the one rule that depends on private semantics, and the level test (`rfc-decision-c20fcff8`) is met by the id, uniqueness and shape rules, which any implementation can check.

No existing schema file is modified. `boundary.json` would be mirrored into `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` by the release-asset sync after acceptance (the existing schema-drift checks cover mirror alignment). The `Address` shape in `ext:addressability` gains the optional `repositoryId` component; no schema file carries `Address`, so the change is to the extension's records and prose. [R1] is the rule on `srs://` strings.

---

## Relationship to RFC-038, RFC-045 and RFC-047

- **RFC-038** reserved `sourceRepositoryId`/`targetRepositoryId` on relations and a federation registry with its own `registryId`; `rfc-decision-4f1e12e5` removed those with the federation entities. They stay removed. This RFC reuses only `manifest.repositoryId`.
- **RFC-045** describes the readme resource beside `srs://<repositoryId>/map`. That string already satisfies [R1]; RFC-045 is unchanged.
- **RFC-047** (Draft) still refers to `ext:registry`, `ext:federation` and `ext:repository` in its text. This RFC takes no position on that text and adds no extension; it uses the word "directory" so the two never share a term (Open Question 4).

## What this forecloses

- A repository declaring its neighbours in its own manifest or records ([R2]).
- A locator inside an address, and any second `srs://` form with a non-id first segment ([R1]).
- Cross-repository relations and cross-repository writes, until a later RFC specifies them (Change C).
- Using a plain `--repo id=path` flag as an unstated alternative to the directory: the owner declined it as a first build on srs-rust#683 (comment of 2026-10-08, "don't build it first"); it may return as one way of supplying the directory ([R9]).

## Conformance class

`ext:addressability` is required only for live facilitation, so it is the wrong home for the *rules* that every multi-repository server must follow, even though the component itself is added to its `Address`. This draft places [R0]–[R10] in the Repository group, binding only an implementation that serves more than one repository or emits `srs://` strings; Open Question 6 asks whether a new extension is wanted instead.

## Integration on acceptance (Door 2)

On acceptance the fold would declare: `schema:boundary.json`, the Repository group records, and a compass source-of-truth row for the boundary directory (OPERATION plane, adapters). This RFC is Door 2: new normative meaning, owner-merge.

---

## Rationale

**Why addressing before relations or writes.** Every later federation feature needs to say which repository it means. Nothing else is needed to deliver the multi-repository server (srs-rust#683), so addressing is the smallest slice that is both useful and forecloses little (see *What this forecloses*): a later RFC can add cross-repository relations, verification, or sharing rules on top without re-opening what an address is.

**Referral stays possible.** Locators are opaque, so a later rule can let an entry's locator name another directory, and `not-in-boundary` is where "ask the next directory" would attach. [R6] assumes every entry locates a repository that reports its own id; a referral entry would not, and that later RFC would relax [R6] for it. No domain is introduced now: repository ids are UUIDs, so a domain adds nothing to uniqueness, and a named domain is needed only for routing or authority, which arrive with referral.

**Why a directory outside the repositories.** A repository that lists its neighbours has stopped being complete on its own, and every repository would carry a copy of facts that belong to whoever assembled the boundary. The directory is the one place those facts are stated once.

**Why the id, not the label or path, is the key.** Paths change when a repository moves and labels change when someone renames; the id is the only component that survives both and is what addresses already carry.

---

## Alternatives Considered

### Alt A — Directory inside each repository's manifest

Rejected in the consequence map: it ties a repository's content to the existence of its neighbours and turns each repository into a self-vouching authority.

### Alt B — The address carries a locator

Rejected: addresses stop being stable when anything moves, and the standard would have to define locator syntax and a trust story for every scheme.

### Alt C — Ship `--repo id=path` for the MCP server and specify later

Declined by the owner on srs-rust#683: it would harden the directory as unstated configuration. It may still be the implementation of a directory input once this RFC is accepted.

### Alt D — Restore the removed federation entities

Rejected: `rfc-decision-5f18603e` requires the redesign to be grounded in practice, and the removed design bundled addressing with events and cross-repository relations for which there is still no usage.

---

## Acceptance gate

**Is this RFC the owner's scheduling act for federation's return?** `rfc-decision-5f18603e` says the owner schedules it. This draft assumes the 2026-10-08 direction on srs-rust#683 is that act, for the addressing slice only. Accepting the RFC confirms it, and a successor decision records it. Declining it means this RFC does not proceed.

## Open Questions

1. **How much of the `srs://` path enters the spec?** (a) Nothing beyond the repository segment — this draft; the path stays tooling's and srs#218 stays open. Forecloses: a single canonical Address serialization for now. (b) A canonical serialization of the Address components and the resource kinds the MCP server exposes. Forecloses: tooling growing new resource kinds without an RFC. Recommendation: (a). Under both answers srs-rust ADR-037 §6, which rules the scheme is tooling, not spec, must be amended.
2. **Does a boundary need its own stable id?** Yes: it can be named in logs and later rules. No: it is only a directory. Recommendation: no, until something needs to refer to one.
3. **May a directory be empty or contain a repository the implementation cannot reach?** The draft says yes to both ([R3]–[R6] fail per entry). Alternative: fail the load. Recommendation: per-entry failure, so one missing neighbour does not take down the rest.
4. **Naming against RFC-047.** Keep "directory" here and leave RFC-047's "registry" alone (recommended), or rename one.
5. **Copies of one repository.** `repositoryId` is unchanged on copy, so a fork and its source share an id and cannot both be members. Options: (a) accept that (this draft); (b) a separate rule giving a diverged copy a new id. Recommendation: (a) now; (b) is its own RFC.
6. **Conformance class.** Repository group (this draft) or a new extension. Recommendation: Repository group, since the rules are small and bind only multi-repository servers.
