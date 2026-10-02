> **GitHub issue**: [the-greenman/srs#850](https://github.com/the-greenman/srs/issues/850)

# RFC-046: Actor provenance — `createdBy` on Record, Note and Relation

**Status**: Accepted (Revision 6)
**Affects**: `Record`, `Note`, `Relation` (new optional `createdBy`); new shared `Actor` shape; `FieldMeta.source` (vocabulary declared shared, no shape change); `docs/schema/2.0/record.json`, `note.json`, `relation.json`; `dataModelRevision` (8 → 9); the operations of conforming implementations that create, update or move instances. Builds on **RFC-038 (Accepted)** (independent relation files), **RFC-033 (Accepted)** (`dataModelRevision`) and the Attribution cell's principle, `rfc-decision-16b20c56` (Accepted).
**Author**: Peter Brownell (owner ruling 2026-10-02, the-greenman/srs#850)
**Date**: 2026-10-02

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-10-02 | Initial draft |
| 2 | 2026-10-02 | Addressed review round 1 (both reviews are posted on #850). **Blocking:** an exhaustive operation table (Change C) with "creating" defined as persisting a new instance and every other operation preserving; a defined *session actor* and the no-actor default (unattributed, never an error); a "What this does not guarantee" section; "What breaks" names the pinned builds affected. **Should-fix:** the `dataModelRevision` bump is now decided in the RFC (Change F, [R10]) instead of being left as an open question; diagnostic codes for [R4]/[R5]; update semantics for whole-object updates; graduation and successor stamp the acting session; [R6] is value-preserving rather than byte-for-byte; Discovery and digests are addressed; the byte-identical `$defs/Actor` convention is stated as new, with its own check; the reason for exactly two kinds is given. **Nits:** [R7] is scoped to applications; the RFC numbering note; `FieldMeta` is defined only in `record.json`. |
| 3 | 2026-10-02 | Addressed review round 2 (posted on #850). Blocking: an actor session writing into a corpus below revision 9 is refused with `revision-too-old` ([R11]). Should-fix: the RFC-043 dependency is stated; [R3] excludes preservation; the bulk-load collision rule; an invalid session actor is refused with `actor-invalid` ([R12]); a fixture shape; Problem 3's `meta` claim is corrected. Nits: verb coverage, `createdAt`, corpus counts, `ai` for person-run agents, and [R8] marked as checked by inspection. |
| 4 | 2026-10-02 | Addressed review round 3. Blocking: [R8]'s exceptions now list the rules that actually read `createdBy`; transport that would place a stamped instance into a corpus below revision 9 is refused with `revision-too-old` ([R13]). Should-fix: `actor-invalid` is checked before `revision-too-old`; a session with no actor is never refused by [R11]/[R12]; the revision table is fixed. |
| 5 | 2026-10-02 | Round 4: no blocking findings. Should-fix: a repair or migration that persists a *new* relation stamps it under [R3], and preservation covers existing instances only; one total precedence order for the three creation diagnostics ([R12]). |
| 6 | 2026-10-02 | **Accepted by the owner.** Open Question 1 resolved: the Actor kind stays `ai` (no rename). Implementation started on branch `rfc/046-actor-provenance`. |

---

## Charter alignment

**Cell(s):** cell:attribution, cell:identity, cell:portability
**Decision mode:** complicated

**Governing cell preference:**
- **Attribution: stated over assumed.** Aligned. Today the standard cannot say who wrote anything, so every reader assumes. This RFC lets an implementation *state* the creator.
- **Identity: identifier over label.** Aligned. An actor is identified by a stable opaque `id`. Its display `name` is a hint and never identity.
- **Portability: preserve over recognize.** Aligned. Every operation other than creation preserves `createdBy`, and the revision bump (Change F) stops older binaries from silently dropping it.

**Axis preference:**
- **4–10, Office over Testimony.** Default pole taken. `createdBy` is **testimony**, even when the implementation stamps it. It informs trust and diagnosis and never affects validity or overrides the record, per `rfc-decision-16b20c56`'s "never authority" clause. Promoting it to office (signatures, verified publishers) is out of scope and stays the future verification design that decision names.
- **6–12, Portability over Possession.** Default pole taken. Attribution travels inside the instance file it describes.

**Decisions consulted:** rfc-decision-16b20c56, rfc-decision-4f1e12e5, rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-0118e938, rfc-decision-c20fcff8, rfc-decision-1e7c0c8e, rfc-decision-2a1e1590, rfc-decision-7caca3a1.

**Contradictions found:** None.
- `rfc-decision-4f1e12e5` (entry 1) removed the Relation provenance fields, including `createdBy`, with the trigger "the attribution mechanism's return claimant". This RFC is that claimant. It restores **one** field only: `assertedBy`, `confidence`, `status`, `validFrom` and `validUntil` stay removed.
- `rfc-decision-16b20c56` fixes three constraints in advance:
  - **optional** — Change B and [R2];
  - **single-shaped** — Change A and Change E;
  - **never authority** — Change D and [R8].

  Its review trigger reads "agent-written content needs marking", which is this RFC's motivation.
- The same decision's "one timestamp convention" is the existing `createdAt`. An Actor carries no time of its own, so the time of the stamp is not recorded twice.

**One-way-per-goal:**
- **`FieldMeta.source`** (`human | ai | imported | derived`) is the one surviving attribution vocabulary, and `16b20c56` says the single shape "retroactively governs FieldMeta". This RFC therefore **collapses onto it**: an Actor's `kind` takes its values from the actor half of that enum (`human`, `ai`). It does not invent a second spelling. `imported` and `derived` describe a process, not an actor, so they are not Actor kinds.
- **`meta`** is implementation-local and namespaced, so it is not a standard carrier, and `16b20c56` forbids putting the asserter in more than one shape.
- **`sourceRefs`** points at source documents, not actors, and stays the one reference-to-source convention.

**Layer test:**
- **Which layer owns this?** The MEANING plane, instances layer: `createdBy` is an instance-envelope property, the sibling of `createdAt`. The stamping rule binds the OPERATION plane's core service, the single place an implementation persists a new instance. Adapters (CLI, MCP, WASM) only hand the session's actor to that service; they never stamp it themselves.
- **Consume or clone downward?** Consume. It reuses the instance envelope and the existing `FieldMeta.source` vocabulary. No definition-layer or substrate change.
- **Does the layer below stand alone without this?** Yes. Definitions and substrate are untouched. Every instance stays valid with `createdBy` absent ([R2]).

**Level test** (`rfc-decision-c20fcff8`): the field can be declared through the schema. Its stamping and preservation rules can be checked by a conformance fixture driven through each implementation's declared session-actor input (Change C). It belongs in the standard. *What an application does with* `createdBy` (for example, refusing an agent edit to a record another actor created) is repository or application policy and stays out ([R7], [R8]).

---

## Abstract

SRS cannot say who created anything. A repository that humans and AI agents write together, such as an essay with agent comments or an agent stewardship process, cannot show which actor wrote which record, note or relation, and cannot tell two agents apart.

This RFC adds one optional, single-shaped property, `createdBy`, to Record, Note and Relation. It names the actor with a `kind` (`human` or `ai`), a stable `id` and an optional display `name`. The implementation stamps it, at the moment a new instance is persisted, from the **session actor**: an actor its host configures outside of any request. It never takes the value from the request, so an agent cannot claim to be someone else. It is set once, preserved by every other operation (updates, migrations, copies, archives), and never affects validity. Because pre-existing binaries would reject or drop it, the data model moves to revision 9.

---

## Motivation

### Problem 1 — agent-written content cannot be marked

The essay editor (the-greenman/muDemocracy.org#227) lets humans write and agents comment. Its acceptance criteria require that "every comment, attachment and record shows its author (human or named agent), stamped by the system" and that "multiple agents are distinguishable". The agent stewardship process has the same need.

Today the only per-instance timestamp is `createdAt`, and there is no per-instance actor at all. `FieldMeta.source` records only the *kind* of source (`human`, `ai`), per field, with no identity. So two agents are indistinguishable, a human and an agent cannot be told apart at instance level, and Relations, the very edges a comment uses to attach to a paragraph, carry nothing.

### Problem 2 — a self-asserted author is worth nothing

The obvious workaround is an `author` field on a comment Type. That puts the claim **in the content the actor writes**, so any agent can write any name. It is testimony with no provenance, a second attribution shape beside `FieldMeta.source` (forbidden by `16b20c56`'s single-shape clause), and it works only for the one Type that declares it.

The mechanism has to sit below content: in the instance envelope, written by the implementation from the session doing the writing.

### Problem 3 — Relations are closed

`relation.json` has `additionalProperties: false`. Since `4f1e12e5` removed the provenance fields, the only open slot on a Relation is `meta`, which is implementation-local and namespaced. An application could hide an author there, but every application would invent its own key. That is exactly the many-shaped attribution `16b20c56` forbids. A standard, single-shaped attribution on Relations therefore needs a standard change.

---

## Proposed Changes

### Change A — the `Actor` shape (one shape, used everywhere)

An **Actor** names who performed an act. It has exactly three properties and no others:

- **`kind`** (required): `human` or `ai`. These are the actor values of `FieldMeta.source`, so the standard has one actor vocabulary (Change E).
  - `human` means a person stands directly behind the act.
  - `ai` means an AI agent performed it.
  - An AI agent is `ai` even when a person started it or supervises it.
  - A non-AI automated process (an import script, a scheduled job) is not a third kind. It acts on behalf of whoever runs it, so its host stamps that human or agent as the actor, or stamps no actor at all.
- **`id`** (required, non-empty string): a stable, opaque identifier for the actor, issued by whatever authenticated the session. Examples are a relay caller identity, an account login, or a configured agent name. Ids are compared by exact string equality and carry no other meaning. The same actor SHOULD get the same `id` every time, so its contributions can be grouped.
- **`name`** (optional string): a display label captured when the stamp was made. It is a hint. It may go stale and it never identifies. When it disagrees with whatever an application knows about `id`, the `id` wins, visibly. This is the Air column rule in `docs/charter/decision-compass.md`: informational conflicts resolve by declared authority, and the hint loses visibly.

*Consequences.* Two agents with different ids are distinguishable even if they share a name. An actor's display name can change without breaking the grouping of its past contributions. The standard does not define how ids are issued, resolved to people, or verified; that is the future verification design. A new kind must be added to the shared vocabulary, which affects `FieldMeta.source` too ([R9]).

**Schema placement.** The committed schemas do not use cross-file `$ref`. The Actor definition is therefore repeated as a `$defs/Actor` entry in `record.json`, `note.json` and `relation.json`, and the three copies MUST be byte-identical. This convention is new to the committed schemas; RFC-010 (Draft) proposed the same pattern for `MergeBase`, but that never landed. A new conformance check, registered in `scripts/checks.json`, fails the build if the three copies differ.

### Change B — `createdBy` on Record, Note and Relation

Record, Note and Relation each gain one optional property, `createdBy`, whose value is an Actor.

*Consequences.* Every existing instance in every corpus stays valid: they all lack the property, and absence is allowed. An instance without `createdBy` is **unattributed**. It is not invalid, it is not anonymous-by-assertion, and it is not implicitly attributed to the repository owner or anyone else. This is `16b20c56`'s "optional" clause.

Other entities with a `createdAt` (Field, Type, Container, Composition, Protocol, Package, …) do **not** gain `createdBy` here. Definitions travel under package version history, and no consumer has asked for definition authorship. Adding it later is additive.

### Change C — creation stamps from the session; every other operation preserves

**The session actor.** Every operation an implementation performs runs with a *session actor*: either one Actor or none. The **host** supplies it: whoever invoked or embedded the implementation (a CLI invocation's configuration, the MCP server for one connected caller, the application embedding a library). It is supplied outside of the operation's request payload. Each implementation MUST document how its host supplies the session actor. A session with no actor is normal: everything it creates is unattributed, and that is never an error. A session actor that is not a valid Actor (an empty `id`, an unknown `kind`, an extra property) is never treated as "no actor". The implementation refuses every creating operation in that session with the diagnostic code `actor-invalid` ([R12]).

*Conformance fixture shape.* A fixture states three things: a session actor (an Actor, or none), an operation from the table below with its request, and the expected `createdBy` of every instance the operation writes or keeps (an exact Actor, absent, or "unchanged"), or the expected diagnostic code. Each implementation runs the fixture by feeding the session actor through its documented input. The fixture itself stays implementation-neutral.

**Creating means persisting a new instance.** An operation *creates* when it writes a Record, Note or Relation whose id did not exist in the repository. Creation is the **only** point where `createdBy` is set; every other operation carries it unchanged. The table below covers the operations of the reference implementation's CLI and MCP surfaces:
- **record:** create, update, delete, transition, successor and tag commands;
- **note:** create, update, delete, graduate and tag commands;
- **relation:** create and delete;
- **container and composition:** commands;
- **package, type, field, view and protocol:** commands;
- **repository:** `copy`, `apply-migration`, `migrate-identity` and repair commands;
- **archive:** `pack` and `unpack`;
- **WASM:** the `.srsj` load and export of the WASM binding.

| Operation | Effect on `createdBy` |
|---|---|
| Create a record; create a note; create a relation | **Stamp** the new instance with the session actor (absent if none). |
| Create a successor record | **Stamp** the new successor and any relation the operation writes. The predecessor is untouched and keeps its own `createdBy`. |
| Graduate a note to a record | **Stamp** the new record and the `derived-from` relation the operation writes. The note keeps its own `createdBy`. The stamp names the actor who graduated, not the note's author. |
| Any other operation that writes a new relation as part of its work | **Stamp** that relation. |
| Update a record, note or relation (whole-object or partial), including field values, tags, `meta`, `fieldMeta`, lifecycle transitions and type-version migration | **Preserve** ([R5]). |
| Repository and data-model migrations, including revision migrations and repair operations | **Preserve** every existing instance. A migration moves data between shapes; it does not create content. If a repair or migration does persist a new Record, Note or Relation, that instance is stamped like any other creation ([R3]). |
| Copy a repository; pack or unpack an archive; load or export a `.srsj` bundle (into a new or an existing repository) | **Preserve** ([R6]). These move existing instances and never create them. When an incoming instance meets an existing one with the same id, `createdBy` is never handled separately from the rest of the instance: whatever the operation does with the instance (replace it, keep it, or refuse), it does with `createdBy` too. |
| Delete | **N/a**: nothing remains to attribute. |
| Container, Composition, package, definition, lifecycle-definition and protocol-run operations | **N/a**: none of them persists a Record, Note or Relation. Container membership is container data, not relations. |

A future operation is classified by the same test: if it persists a new Record, Note or Relation, it stamps that instance; otherwise it preserves.

**Requests never carry the actor.**
- A creation request that contains a `createdBy` value is rejected with the diagnostic code `actor-supplied`, and nothing is written ([R4]).
- An update request may carry `createdBy` only if it is identical to the stored value, including when both are absent. This is because many clients send the whole stored object back on update. A request that carries a different value, or a value where none is stored, is rejected with the diagnostic code `actor-changed`, and nothing is written ([R5]).

*Consequences.* Within one implementation, an agent cannot impersonate another actor through the write API. That is the gap this RFC closes. It **cannot** stop anyone who edits the repository's files directly (a text editor, a git commit) from writing any `createdBy` they like. That is why Change D keeps `createdBy` testimony rather than authority.

### Change D — attribution is testimony, never authority

`createdBy` informs trust and diagnosis. It never decides anything in the standard:
- validity never depends on its presence or value ([R8]);
- no ordering, membership, lifecycle or relation semantics derive from it;
- it is **not** part of the Discovery text projection or any Discovery query axis.

An implementation-computed digest of a whole instance file naturally covers it, as it covers every property. Applications and repository governance MAY use it for their own policy, for example a write guard that lets an agent change only records the same agent created. Such a policy rests on testimony and is only as trustworthy as write access to the store. Making attribution authoritative (signatures, verified publishers, promotion into office) is explicitly **not** part of this RFC; it remains the verification design that `16b20c56` reserves.

### Change E — one actor vocabulary

This RFC declares that the actor values of `FieldMeta.source` (`human`, `ai`) and the `kind` values of Actor are **one vocabulary**. A value added to or renamed in one MUST be added to or renamed in the other in the same change. `FieldMeta.source` keeps its other two values (`imported`, `derived`), which describe a process rather than an actor and are not Actor kinds. `FieldMeta`'s shape does not change, and it is defined only in `record.json`.

### Change F — the data model moves to revision 9

The three entity schemas are closed. A binary built before this RFC therefore rejects any file carrying `createdBy` as a schema violation, and a binary that rewrites such a file without understanding the property can lose it. That is exactly the silent loss Portability forbids. This RFC therefore moves `dataModelRevision` from 8 to 9. Revision 8 comes from RFC-043, so the 8 → 9 step lands after RFC-043's 7 → 8 migration (srs-rust#1133) and is applied after it. A corpus at revision 7 takes both steps in order. Today `srs/srs` is at revision 8 and muSrs is still at 7.
- A corpus at revision 9 may contain `createdBy`.
- An implementation that supports only revision 8 or lower refuses a revision-9 corpus, with its existing "newer corpus" refusal, instead of reading it.
- The 8 → 9 migration changes no instance data. It only re-stamps the revision, because no existing instance has `createdBy`.
- **Transport never puts attribution into a pre-9 corpus.** A copy, unpack or `.srsj` load that would place an instance carrying `createdBy` into an existing corpus declaring a revision below 9 is refused with `revision-too-old` ([R13]). Loading a bundle into a *new* repository is not affected, because that repository takes the bundle's own revision.
- **A session with an actor never writes a pre-9 corpus silently.** If the session has an actor and the corpus declares a revision below 9, every creating operation is refused with the diagnostic code `revision-too-old`, and nothing is written ([R11]). The user migrates the corpus first. Stamping anyway would make the corpus claim a revision it does not have. Writing unstamped would discard the attribution the host asked for. A session without an actor is unaffected: it creates unattributed instances in a corpus at any revision, and is never refused by [R11] or [R12].

The bump follows the established revision choreography:
1. Implementation support lands, including the migration registry entry and the ability to load revision 8 and 9 corpora.
2. A release is cut.
3. The spec-side change merges.
4. The client pins advance.

---

## What this does not guarantee

- **That every instance has an author.** Attribution is optional. Instances written by a session without an actor, by older tools, or by hand are unattributed. An application that needs every comment attributed (muDemocracy.org#227) must make sure its own sessions always carry an actor. The standard does not force it.
- **That an author is genuine.** A stamp shows what the writing session said its actor was, and anyone with direct file access can change it. Verification is future work.
- **Who last changed an instance.** Only the creator is recorded (Alt B).

---

## Conformance Rules

> **[R1]** An `Actor` MUST have a `kind` of `human` or `ai` and a non-empty string `id`, MAY have a string `name`, and MUST NOT have any other property. The `$defs/Actor` entries in `record.json`, `note.json` and `relation.json` MUST be byte-identical.
>
> **[R2]** `createdBy` is OPTIONAL on Record, Note and Relation. Its absence MUST NOT make an instance invalid, and an implementation MUST NOT infer an actor for an instance that lacks it.
>
> **[R3]** When an operation persists a new Record, Note or Relation, the implementation MUST set that instance's `createdBy` to the session actor, or leave it absent if the session has no actor. This includes successor records, the record and relation produced by note graduation, and any relation an operation writes as part of its work. Outside creation, an implementation MUST NOT set, change or remove `createdBy`. Carrying it unchanged under [R5] and [R6] is not setting it.
>
> **[R4]** The session actor MUST come from the host, outside the request payload, through an input the implementation documents. A creation request that contains `createdBy` MUST be rejected with the diagnostic code `actor-supplied`, and nothing MUST be written.
>
> **[R5]** Every operation that updates an existing Record, Note or Relation MUST preserve its stored `createdBy` exactly, including its absence. An update request MAY contain `createdBy` only when it equals the stored value, absence matching absence. Otherwise the request MUST be rejected with the diagnostic code `actor-changed`, and nothing MUST be written.
>
> **[R6]** Repository copy, archive pack and unpack, `.srsj` load and export, and data-model and repair migrations MUST preserve the value of every existing instance's `createdBy`, and MUST NOT add, remove or alter one. An instance such an operation newly persists falls under [R3].
>
> **[R7]** An application that compares Actors MUST compare by `id` alone, using exact string equality, and MUST NOT treat `name` as identity. This rule constrains applications; no rule of the standard compares Actors ([R8]).
>
> **[R8]** No validation or conformance outcome defined by this standard MAY depend on the presence or value of `createdBy`, other than the rules of this RFC that govern `createdBy` itself: [R1], [R3]–[R6], [R10] and [R13]. *(A design constraint, checked by inspection of the rules, not by a fixture.)*
>
> **[R9]** The Actor `kind` values and the actor values of `FieldMeta.source` are one vocabulary. A change to either MUST change both.
>
> **[R10]** A corpus containing any `createdBy` MUST declare `dataModelRevision` 9 or later. An implementation that does not support revision 9 MUST refuse such a corpus rather than read it.
>
> **[R11]** If the session has an actor and the corpus declares a `dataModelRevision` below 9, every operation that would persist a new Record, Note or Relation MUST be refused with the diagnostic code `revision-too-old`, and nothing MUST be written.
>
> **[R12]** A session actor that does not satisfy [R1] MUST NOT be treated as "no actor". Every operation in that session that would persist a new Record, Note or Relation MUST be refused with the diagnostic code `actor-invalid`, and nothing MUST be written. When more than one creation diagnostic applies, exactly one is reported, in the order `actor-invalid`, then `actor-supplied`, then `revision-too-old`. [R11] and [R12] never apply to a session with no actor.
>
> **[R13]** A copy, archive unpack or `.srsj` load that would place an instance carrying `createdBy` into an existing corpus declaring a `dataModelRevision` below 9 MUST be refused with the diagnostic code `revision-too-old`, and nothing MUST be written.

---

## Schema changes

| Schema file | Change |
|---|---|
| `record.json` | Add `$defs/Actor`: `kind` (enum `human`, `ai`) and `id` (non-empty string) required; optional `name` string; `additionalProperties: false`. Add an optional `createdBy` referencing it. Annotate `FieldMeta.source` as sharing the actor vocabulary ([R9]). |
| `note.json` | Add the byte-identical `$defs/Actor` and an optional `createdBy`. |
| `relation.json` | Add the byte-identical `$defs/Actor` and an optional `createdBy`. |
| `manifest.json` | Document revision 9 in the `dataModelRevision` description. No shape change. |

Checked and unaffected:
- **`srsj-envelope.json`** carries instance files as opaque entries. It defines the manifest and container shapes, not Record, Note or Relation.
- **`package-bundle.json`** carries definitions, not instances.
- **`document-view-output.json`** is a rendered projection. Its relation rows are projections, and attribution is not projected (Change D).
- **`discovery.json`** gains no axis and no projected field (Change D).

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

---

## What breaks

**No existing data breaks.** No surveyed instance has `createdBy`: 683 instance files and 922 relations in `srs/srs`, and 884 instance files and 3,138 relations in muSrs. [R2] makes absence valid. Across the two surveyed corpora (`srs/srs` and muSrs), `FieldMeta.source` appears once in total (one `"human"` value in `srs/srs`), and nothing about it changes.

**Every currently pinned binary predates this RFC.** That covers:
- the spec render pin (`SRS_RUST_CLI_TAG` `v0.1.0-build.417`);
- srs-web's bindings (`v0.1.0-build.425`);
- muDemocracy.org's CLI (`v0.1.0-build.417`).

Once a corpus is migrated to revision 9, each of them refuses it as a newer corpus ([R10]) until its pin advances to a supporting release. Separately, a supporting binary with a session actor refuses to create in a corpus that has not yet been migrated ([R11]). Migrating is a single command. That is the normal revision-bump cost: one implementation release, then one pin advance in each of those three places. Without the bump, the same binaries would either reject stamped files one at a time or drop `createdBy` when rewriting them. A mixed-binary round trip would lose attribution silently, which is what Change F forecloses.

---

## Rationale

- **Stamped by the implementation, not written by the actor.** This is the only placement that makes the field mean anything across actors. A self-asserted field (Alt A) is indistinguishable from forgery. A stamp from the session at least binds the claim to whatever authenticated the caller.
- **Testimony, not office.** This follows `16b20c56`, and it is honest. Anyone with file access can edit the JSON, so pretending the stamp is authoritative would build trust on sand.
- **Creator only, stamped once.** This answers the need actually raised (who made this comment, who made this link). It is simple to test ([R3]–[R6]), and immutability makes it the one thing about an instance that never churns.
- **Exactly two kinds.** The vocabulary must be the one `FieldMeta.source` already uses. "Is there a person or an AI behind this?" is the distinction both consumers need. Automated non-AI processes are attributed to whoever runs them (Change A).
- **Inline actor, not a reference to an actor record.** This keeps attribution readable from the file alone, with no new Type, package dependency or resolution rule, and every corpus can use it immediately (Alt C).
- **Decide the revision bump here.** A field that older binaries can drop on rewrite cannot keep [R6]'s promise without it (Change F).

---

## Alternatives Considered

### Alt A — an `author` field on the Types that need it

A comment Type declares an `author` Field that the writer fills in.
- **Rejected.** It is self-asserted, so any agent can write any name.
- It works only for the Types that declare it, and Relations cannot have Fields at all.
- It would be a second attribution shape beside `FieldMeta.source`, which `16b20c56` forbids.

### Alt B — `createdBy` plus `updatedBy`

Stamp the last modifier on every update too.
- **Deferred.** No consumer has asked for it.
- It needs a rule about which writes count.
- With revisions removed (`rfc-decision-2a1e1590`), a single last-modifier slot loses all earlier modifiers anyway.
- Adding it later is additive and reuses the Actor shape.

### Alt C — `createdBy` as a reference to an Actor record

Actors become instances of an Actor Type, and `createdBy` holds an instance UUID.
- **Rejected for now.** Every repository would need actor records before it could attribute anything, and attribution would depend on a resolution step and on package contents.
- The inline Actor can be linked to such records later by matching `id`, without changing this shape.

### Alt D — restore the full removed provenance set

Restore `assertedBy`, `confidence`, `status`, `validFrom` and `validUntil` on Relation.
- **Rejected.** Zero of 250 relations used them (`4f1e12e5`). The return claimant needs the creator only.

### Alt E — let a privileged caller supply `createdBy`

For example, to impersonate an author during an import.
- **Rejected.** Moving existing instances is already covered by preservation ([R6]).
- Any creation path that accepts a supplied actor is the forgery path this RFC closes.

### Alt F — no revision bump

Treat `createdBy` as an ordinary additive property.
- **Rejected.** The schemas are closed, so every pinned binary today would reject stamped files one by one, or drop the field on rewrite, with no corpus-level signal (Change F).

---

## Open Questions

**None.** Open Question 1 (keep `ai` or rename it to `agent`) was resolved by the owner on acceptance: keep `ai`.

*(RFC numbering: RFC-044 and RFC-045 are claimed by open issues srs#855 and srs#858, which have no files yet, so this RFC takes 046.)*
