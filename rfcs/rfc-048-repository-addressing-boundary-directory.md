> **GitHub issue**: [the-greenman/srs#913](https://github.com/the-greenman/srs/issues/913)

# RFC-048: Repository addressing — the boundary directory and `srs://` addresses

**Status**: Draft (Revision 1)
**Affects**: `ext:addressability` (Address gains a repository component and a canonical `srs://` serialization), a new boundary directory shape (`docs/schema/2.0/boundary.json`, proposed), the Repository group's identity statements; conforming implementations that serve more than one repository. Builds on **RFC-038 (Accepted)** (tree-authoritative repositories), **RFC-045 (Accepted)** (self-describing artifacts) and `rfc-decision-5f18603e` (federation's return is committed). Adjacent to, and deliberately not part of, **RFC-047 (Draft)** (definition distribution).
**Author**: Owner direction on the-greenman/srs-rust#683 (2026-10-08); drafted by Claude Code for owner review
**Date**: 2026-10-08

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-08 | Initial draft. Frames the repository directory first asked for as MCP multi-repo serving (srs-rust#683) as the first, addressing-only step of federation's committed return. Proposes nothing for implementation. |

---

## Charter alignment

**Cell(s):** cell:repository, cell:reference, cell:identity, cell:portability, cell:attribution
**Decision mode:** complex

This is a complex decision, so a single-cell citation is not an answer (`rfc-decision-7caca3a1` names that as the premature-classification pathology). The consequence map below is the substance; the owner's rulings on the Open Questions are the output.

**Governing cell preferences.**
- **Repository: catalog over circumstance.** Aligned. Today which repositories exist in a deployment is circumstance (whatever `--repo` paths a process was started with). A directory makes it a declared catalog.
- **Reference: declared strength over convenient reach.** Aligned in intent, and the reason for Change C. A cross-repository address that silently reaches a neighbour is convenient reach; here every reach goes through a declared directory entry and is read-only.
- **Identity: identifier over label.** Aligned. Entries are keyed by the repository's stable id, never by a path or a friendly name.
- **Portability: preserve over recognize.** Aligned. A directory entry never moves content; content still travels only in bundles, archives and slices (`rfc-decision-8948e43f`).
- **Attribution: stated over assumed.** Aligned. Which boundary vouches for which repository is stated by the directory, not assumed from where a path happens to sit.

**Axis preferences.**
- **4–10, Office over Testimony.** Default pole taken. A directory entry is a *declaration by whoever owns the boundary* (office); a repository's own claim about its id is testimony until it matches the entry. The clause "Testimony fills gaps, never contradicts authority, and is promoted into office only by verification" is applied in Change D: a mismatch is an error, never resolved in the repository's favour.
- **6–12, Portability over Possession.** Default pole taken. The directory is kept out of every member repository so that no repository holds its neighbours' locations (Change B). The boundary clause "a capability that exists only in place is captivity" is why the directory itself must also be exportable (Change E).
- **1–7, Semantic Integrity over Practical Expression.** Default pole taken. Practical expression (a `--repo id=path` flag) is the part that falls out last and is not specified here.

**Decisions consulted:** rfc-decision-4f1e12e5, rfc-decision-5f18603e, rfc-decision-8948e43f, rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-16b20c56, rfc-decision-c20fcff8, rfc-decision-e99a9437, rfc-decision-7caca3a1.

**Contradictions found:** None directly. Two questions are routed to the owner rather than assumed:
- `rfc-decision-4f1e12e5` removed the federation entities (registry, events, cross-repository relation fields) and `rfc-decision-5f18603e` committed their return as a roadmap phase **that the owner schedules**. This RFC treats the owner's 2026-10-08 direction on srs-rust#683 as the scheduling act for the *addressing* slice only. Whether that reading is right is Open Question 1.
- srs-rust ADR-037 §6 rules that the `srs://` scheme is implementation tooling, not spec. Change A moves the scheme's repository-qualified form into the spec. That supersedes the ADR's position, as ADR-037 itself anticipated ("if a canonical URI syntax is later wanted"). Open Question 2.

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
| 4. Plain `--repo id=path` flags only (owner: "don't build it first") | partial: process-lifetime catalog | reaches by id, but locator is unstated config | not exportable | none | solves #683, forecloses nothing, but is not federation |

Emergence: Option 1 makes "boundary" a first-class unit. That is what lets the later pieces (cross-repository relations, verification, sharing rules) have somewhere to attach without re-opening addressing. It is also the largest commitment in this RFC, which is why it is the main decision requested.

---

## Abstract

Today an SRS server serves one repository per process, and a reference such as `srs://<repositoryId>/record/<id>` names a repository by an id nothing in the standard declares. This RFC makes that id meaningful: a **boundary** is a declared set of repositories that can address each other, a **boundary directory** lists them by stable repository id, and an address qualified by a repository id resolves only to repositories in the directory. It is the addressing-only first step of federation's committed return (`rfc-decision-5f18603e`), and the multi-repository MCP server asked for in srs-rust#683 falls out of it as one consumer.

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

### Change A — a repository-qualified Address and its canonical `srs://` form

`ext:addressability` today defines an Address as components that locate a thing inside one repository. This RFC adds one optional leading component, the **repository id**, and defines one canonical string form:

`srs://<repositoryId>/<path>` where `<path>` is the existing component address (for example `record/<instanceId>`, `container/<containerId>`).

Consequences. What becomes possible: any tool (MCP, web deep-link, CLI output) can serialize and parse the same address. What becomes forbidden: minting a different URI form for the same Address. What it costs later: the path vocabulary under `srs://<repositoryId>/` becomes a standing contract, so the set of resource kinds the MCP server exposes today (`map`, `navigation`, `record`, `container`, `view`, `type`, `tree`, `agent-index`, `context`) must either be admitted into the spec or stay marked implementation-private (Open Question 2). This also answers the question parked as srs#218.

An address with no repository component means "this repository", exactly as today; nothing existing changes meaning.

### Change B — the boundary and its directory

A **boundary** is a set of repositories that an owner declares can address one another. Its **directory** is a document with one entry per repository. Each entry has:

- the repository's stable **id** (the key; required);
- an optional human **label**, which is display only and never resolves an address;
- a **locator**, an opaque, implementation-defined string saying how to reach the repository (a filesystem path, a git remote, a bundle location). The standard does not define locator syntax.

The directory lives **outside every member repository**. A repository's manifest, records and containers say nothing about its neighbours.

Consequences. What becomes possible: an implementation can serve any number of repositories from one directory and resolve any qualified address against it. What becomes forbidden: a repository declaring its own neighbours, which would make its content depend on theirs and fail layer rule 5 (every layer stands alone below). What it costs later: the directory is a new artifact owners must keep, and its schema (`boundary.json`) is a new schema file to mirror into `srs-rust` and `srs-vscode`.

### Change C — resolution is read-through and read-only

Resolving a qualified address reads from the target repository by the existing per-repository services. Nothing is copied, merged or cached as authoritative, and no write is addressed by this RFC. Cross-repository **relations** (the removed federation field) are not part of this RFC; a relation endpoint remains an instance in the same repository.

Consequences. What becomes possible: an agent can read a record in a neighbour by address. What stays forbidden: a Relation whose target lives in another repository, and any cross-repository write. That keeps Reference's *declared strength* intact: the first cross-repository relation will need its own declared strength, decided on its own RFC.

### Change D — conflicts are fatal, mismatches are errors

If two directory entries carry the same id, the directory is invalid (identity conflicts are fatal, never resolved by precedence; the Earth column principle). If an entry's id differs from the id the located repository reports for itself, resolution of that entry fails with a mismatch error and the entry's claim wins nothing: the repository's own statement is testimony, the directory is office, and a disagreement between them is surfaced rather than reconciled.

### Change E — the directory travels

The directory is exportable as a single deterministic JSON document so that a boundary can be moved, reviewed, or pinned in version control, satisfying the travel mandate (`rfc-decision-8948e43f`: the travelling form ships in the same RFC that introduces the held form). Locators are carried verbatim; the standard makes no promise that a locator is reachable from another machine.

---

## Conformance Rules

> **[R1]** An address with a repository component MUST be serialized as `srs://<repositoryId>/<path>`; an implementation MUST NOT emit a different URI form for the same Address.
>
> **[R2]** A repository's manifest, records, containers and relations MUST NOT name any other repository's id or locator as a neighbour, member of a boundary, or resolution target.
>
> **[R3]** A directory entry MUST carry a repository id. An entry's label MUST NOT be used to resolve an address.
>
> **[R4]** A directory MUST NOT contain two entries with the same repository id; a directory that does MUST be rejected as invalid.
>
> **[R5]** An implementation MUST resolve a qualified address only to a repository that has an entry in the directory it was given, and MUST fail with a distinct "not in boundary" error for any other repository id.
>
> **[R6]** If the repository reached through an entry reports a different id from the entry's, the implementation MUST fail resolution of that entry with a mismatch error and MUST NOT use either id as an override.
>
> **[R7]** Resolving a qualified address MUST NOT write to, copy from, or alter the target repository, and MUST NOT make the target's content part of the resolving repository's catalog.
>
> **[R8]** An implementation that serves a single repository with no directory MUST continue to resolve unqualified addresses exactly as before.
>
> **[R9]** A directory MUST be exportable as a single deterministic document, and an implementation MUST accept the exported form as input.

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `boundary.json` (new, proposed) | the directory document: entries of `{id, label?, locator}`, no other properties | None — no existing document has this shape |
| `manifest.json` | none | None |

No existing schema file is modified. `boundary.json` would be mirrored into `srs-rust/crates/srs-schema/schemas/2.0/` and `srs-vscode/schemas/2.0/` through the release-asset sync after acceptance. The `ext:addressability` change is to prose and records, not a schema.

---

## Rationale

**Why addressing before relations or writes.** Every later federation feature needs to say which repository it means. Nothing else is needed to deliver the multi-repository server (srs-rust#683), so addressing is the smallest slice that is both useful and forecloses nothing: a later RFC can add cross-repository relations, verification, or sharing rules on top without re-opening what an address is.

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

## Open Questions

1. **Is this RFC the scheduling act for federation's return?** `rfc-decision-5f18603e` says the owner schedules it. Recommendation: yes, for the addressing slice only, recorded by a successor decision on acceptance.
2. **How much of the `srs://` path vocabulary enters the spec?** Options: (a) only the repository-qualified form and the generic rule that `<path>` is a component address, leaving resource kinds implementation-private; (b) also enumerate the kinds the MCP server uses today. Recommendation: (a), so the spec does not freeze tooling that is still growing (ADR-037 has been amended repeatedly).
3. **Where does the directory live in practice?** This draft says "outside every member repository" and nothing more. Recommendation: leave the file's name and location to implementations in this RFC, and let the first consumer (the MCP server) document its choice.
4. **Boundary identity.** Does a boundary itself need a stable id (to be named in addresses or logs), or is it only a directory? Recommendation: no id now; add one when something needs to refer to a boundary.
5. **Naming against RFC-047.** RFC-047 uses "registry" for a catalog of definition packages. Recommendation: keep "directory" here and leave RFC-047's term alone.
6. **Supersession of ADR-037 §6** in srs-rust, if Open Question 2 is answered (a) or (b). Recommendation: amend the ADR when this RFC is accepted.
